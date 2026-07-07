// select-applicant — P4: poster selects a worker → creates booking (escrow_pending)
// POST { application_id: string }
// Returns { booking_id, amount_cents, service_fee_cents, total_cents, currency }
//
// Fee model (spec v2.7, krátkodobý/escrow mode): 2€ fix + 10% of transaction.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const FEE_FIXED_CENTS = 200;
const FEE_PCT = 0.10;

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

    const { application_id } = await req.json().catch(() => ({}));
    if (!application_id) return jsonResponse({ error: 'application_id_required' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: app, error: appError } = await admin
      .from('applications')
      .select('id, status, job_id, worker_user_id, worker_id, negotiated_rate_cents')
      .eq('id', application_id)
      .maybeSingle();
    if (appError) throw appError;
    if (!app) return jsonResponse({ error: 'application_not_found' }, 404);

    const workerUserId = app.worker_user_id ?? app.worker_id;
    if (!workerUserId) return jsonResponse({ error: 'application_has_no_worker' }, 422);
    if (app.status === 'rejected' || app.status === 'withdrawn') {
      return jsonResponse({ error: 'application_not_selectable', status: app.status }, 409);
    }

    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, poster_user_id, employer_id, pay_amount_cents, pay_amount, pay_type, estimated_hours, currency, status')
      .eq('id', app.job_id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) return jsonResponse({ error: 'job_not_found' }, 404);

    const posterUserId = job.poster_user_id ?? job.employer_id;
    if (posterUserId !== user.id) return jsonResponse({ error: 'not_job_poster' }, 403);

    // One active booking per job+worker pair
    const { data: existing, error: existingError } = await admin
      .from('bookings')
      .select('id, status')
      .eq('job_id', job.id)
      .eq('worker_user_id', workerUserId)
      .not('status', 'in', '(cancelled)')
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return jsonResponse({ error: 'booking_already_exists', booking_id: existing.id, status: existing.status }, 409);
    }

    const rateCents = app.negotiated_rate_cents
      ?? job.pay_amount_cents
      ?? Math.round((job.pay_amount ?? 0) * 100);
    if (!rateCents || rateCents <= 0) return jsonResponse({ error: 'invalid_job_amount' }, 422);

    // Hourly jobs escrow the planned total: rate × estimated hours.
    // Actual payout is prorated from attendance at release time.
    const plannedHours = job.pay_type === 'hourly'
      ? Math.max(Number(job.estimated_hours) || 1, 0.25)
      : 1;
    const amountCents = Math.round(rateCents * plannedHours);
    const serviceFeeCents = FEE_FIXED_CENTS + Math.round(amountCents * FEE_PCT);

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        job_id: job.id,
        worker_user_id: workerUserId,
        poster_user_id: user.id,
        agreed_amount_cents: amountCents,
        service_fee_cents: serviceFeeCents,
        currency: job.currency ?? 'EUR',
        status: 'escrow_pending',
      })
      .select('id')
      .single();
    if (bookingError) throw bookingError;

    const { error: updateError } = await admin
      .from('applications')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', application_id);
    if (updateError) throw updateError;

    return jsonResponse({
      booking_id: booking.id,
      amount_cents: amountCents,
      service_fee_cents: serviceFeeCents,
      total_cents: amountCents + serviceFeeCents,
      currency: job.currency ?? 'EUR',
    });
  } catch (e) {
    console.error('[select-applicant]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
