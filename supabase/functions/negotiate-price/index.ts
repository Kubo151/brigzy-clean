// negotiate-price — S2: worker/poster back-and-forth rate negotiation on
// an application, before the poster selects a worker (P4).
// POST { application_id, action: 'propose', rate_cents, rate_type, note? }
// POST { application_id, action: 'accept' | 'reject', negotiation_id }
// Returns { negotiation, application: { negotiated_rate_cents } }
//
// Max 3 rounds (price_negotiations.round check constraint). A propose
// while a round is pending is treated as a counter-offer: the pending
// round is auto-rejected and a new round is opened. Only the
// counterpart of the last proposer may accept/reject/counter — you
// can't act on your own proposal.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'unauthorized' }, 401);

    const { application_id, action, rate_cents, rate_type, note, negotiation_id } = await req.json().catch(() => ({}));
    if (!application_id) return jsonResponse({ error: 'application_id_required' }, 400);
    if (!['propose', 'accept', 'reject'].includes(action)) return jsonResponse({ error: 'invalid_action' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: app, error: appError } = await admin
      .from('applications')
      .select('id, job_id, worker_id, worker_user_id, status, negotiated_rate_cents')
      .eq('id', application_id)
      .maybeSingle();
    if (appError) throw appError;
    if (!app) return jsonResponse({ error: 'application_not_found' }, 404);

    const workerUserId = app.worker_user_id ?? app.worker_id;
    if (app.status !== 'pending') {
      // once the poster selects the worker (status -> accepted), the booking
      // is already created at the locked-in rate — negotiating further is
      // too late. rejected/withdrawn applications aren't negotiable either.
      return jsonResponse({ error: 'application_not_negotiable', status: app.status }, 409);
    }

    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, poster_user_id, employer_id, currency, pay_type')
      .eq('id', app.job_id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return jsonResponse({ error: 'job_not_found' }, 404);
    const posterUserId = job.poster_user_id ?? job.employer_id;

    let callerRole: 'worker' | 'poster';
    if (user.id === workerUserId) callerRole = 'worker';
    else if (user.id === posterUserId) callerRole = 'poster';
    else return jsonResponse({ error: 'not_a_party_to_this_application' }, 403);

    const { data: latest, error: latestError } = await admin
      .from('price_negotiations')
      .select('*')
      .eq('application_id', application_id)
      .order('round', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw latestError;

    if (action === 'propose') {
      if (!Number.isInteger(rate_cents) || rate_cents <= 0) return jsonResponse({ error: 'invalid_rate' }, 422);
      if (rate_type !== 'hourly' && rate_type !== 'fixed') return jsonResponse({ error: 'invalid_rate_type' }, 422);

      if (latest?.status === 'pending') {
        if (latest.proposed_by === callerRole) {
          return jsonResponse({ error: 'already_your_turn_to_wait', negotiation: latest }, 409);
        }
        // counter-offer: auto-close the pending round we're replying to
        const { error: closeError } = await admin
          .from('price_negotiations')
          .update({ status: 'rejected' })
          .eq('id', latest.id);
        if (closeError) throw closeError;
      }

      const nextRound = (latest?.round ?? 0) + 1;
      if (nextRound > 3) return jsonResponse({ error: 'max_rounds_reached' }, 409);

      const { data: created, error: insertError } = await admin
        .from('price_negotiations')
        .insert({
          application_id, round: nextRound, proposed_by: callerRole,
          rate_cents, rate_type, note: (note ?? '').toString().trim() || null,
          currency: job.currency ?? 'EUR', status: 'pending',
        })
        .select().single();
      if (insertError) throw insertError;

      return jsonResponse({ negotiation: created, application: { negotiated_rate_cents: app.negotiated_rate_cents } });
    }

    // accept / reject — must target an existing pending negotiation, and
    // the caller must be the counterpart of whoever proposed it.
    if (!negotiation_id) return jsonResponse({ error: 'negotiation_id_required' }, 400);
    const target = latest?.id === negotiation_id ? latest : (
      await admin.from('price_negotiations').select('*').eq('id', negotiation_id).eq('application_id', application_id).maybeSingle()
    ).data;
    if (!target) return jsonResponse({ error: 'negotiation_not_found' }, 404);
    if (target.status !== 'pending') return jsonResponse({ error: 'negotiation_not_pending', status: target.status }, 409);
    if (target.proposed_by === callerRole) return jsonResponse({ error: 'cannot_respond_to_own_proposal' }, 409);

    if (action === 'reject') {
      const { data: updated, error } = await admin
        .from('price_negotiations').update({ status: 'rejected' }).eq('id', target.id).select().single();
      if (error) throw error;
      return jsonResponse({ negotiation: updated, application: { negotiated_rate_cents: app.negotiated_rate_cents } });
    }

    // accept
    const { data: updated, error: updError } = await admin
      .from('price_negotiations').update({ status: 'accepted' }).eq('id', target.id).select().single();
    if (updError) throw updError;

    const { error: appUpdError } = await admin
      .from('applications').update({ negotiated_rate_cents: target.rate_cents, updated_at: new Date().toISOString() })
      .eq('id', application_id);
    if (appUpdError) throw appUpdError;

    return jsonResponse({ negotiation: updated, application: { negotiated_rate_cents: target.rate_cents } });
  } catch (e) {
    console.error('[negotiate-price]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
