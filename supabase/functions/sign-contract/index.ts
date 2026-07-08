// sign-contract — S3: mock-OTP contract signing (AdES flow simulated)
// POST { booking_id: string, otp: string }
// Returns { contract_id, status, signed_by_poster, signed_by_worker, booking_status }
//
// DEMO MODE: OTP is a click-through mock — the only accepted code is 123456.
// Order is enforced per spec v2.7: poster signs FIRST, worker second.
// Both signatures → contract 'signed' + booking → 'in_progress'.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const DEMO_OTP = '123456';

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

    const { booking_id, otp } = await req.json().catch(() => ({}));
    if (!booking_id) return jsonResponse({ error: 'booking_id_required' }, 400);
    if (otp !== DEMO_OTP) return jsonResponse({ error: 'invalid_otp' }, 422);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, job_id, worker_user_id, poster_user_id, status, agreed_amount_cents, currency, contract_id')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);

    const isPoster = booking.poster_user_id === user.id;
    const isWorker = booking.worker_user_id === user.id;
    if (!isPoster && !isWorker) return jsonResponse({ error: 'not_booking_party' }, 403);
    if (booking.status !== 'awaiting_signatures') {
      return jsonResponse({ error: 'booking_not_signable', status: booking.status }, 409);
    }

    // Load or create the contract row
    let contract: {
      id: string;
      status: string;
      signed_by_poster_at: string | null;
      signed_by_worker_at: string | null;
    } | null = null;

    const { data: existing, error: contractError } = await admin
      .from('contracts')
      .select('id, status, signed_by_poster_at, signed_by_worker_at')
      .eq('booking_id', booking.id)
      .maybeSingle();
    if (contractError) throw contractError;
    contract = existing;

    if (!contract) {
      // Poster signs first (their initiative) — worker cannot open the signing
      if (!isPoster) return jsonResponse({ error: 'poster_signs_first' }, 409);
      const { data: job } = await admin
        .from('jobs')
        .select('title, location, location_text, company_id, task_nature')
        .eq('id', booking.job_id)
        .maybeSingle();

      // Contract-type derivation (spec v2.7 §3, never a user choice):
      //   B2B (job has a company) + result   → DoVP §226 ZP
      //   B2B (job has a company) + activity → DoPČ §228a ZP
      //   C2C (no company)                   → Zmluva o dielo §631–643 OZ (always)
      const contractType = job?.company_id
        ? (job.task_nature === 'activity' ? 'dopc' : 'dovp')
        : 'zmluva_o_dielo';

      const { data: created, error: createError } = await admin
        .from('contracts')
        .insert({
          booking_id: booking.id,
          type: contractType,
          status: 'draft',
          esign_level: 'ades',
          template_version: 'VZOR-demo-1',
          payload_json: {
            job_title: job?.title ?? null,
            location: job?.location_text ?? job?.location ?? null,
            amount_cents: booking.agreed_amount_cents,
            currency: booking.currency,
            demo: true,
          },
        })
        .select('id, status, signed_by_poster_at, signed_by_worker_at')
        .single();
      if (createError) throw createError;
      contract = created;
    }

    const now = new Date().toISOString();
    const auditEntry = {
      at: now,
      user_id: user.id,
      role: isPoster ? 'poster' : 'worker',
      method: 'otp',
      otp_mock: true,
    };

    if (isPoster) {
      if (contract.signed_by_poster_at) return jsonResponse({ error: 'already_signed' }, 409);
      const { error } = await admin
        .from('contracts')
        .update({
          signed_by_poster_at: now,
          poster_sign_method: 'otp',
          status: 'pending_signatures',
        })
        .eq('id', contract.id);
      if (error) throw error;
    } else {
      if (!contract.signed_by_poster_at) return jsonResponse({ error: 'poster_signs_first' }, 409);
      if (contract.signed_by_worker_at) return jsonResponse({ error: 'already_signed' }, 409);
      const { error } = await admin
        .from('contracts')
        .update({
          signed_by_worker_at: now,
          worker_sign_method: 'otp',
          status: 'signed',
        })
        .eq('id', contract.id);
      if (error) throw error;
    }

    // OTP audit trail (mock)
    await admin.from('contract_otp_events').insert({
      contract_id: contract.id,
      user_id: user.id,
      sent_at: now,
      verified_at: now,
    });

    // Append to contract audit log
    const { data: fresh } = await admin
      .from('contracts')
      .select('id, status, signed_by_poster_at, signed_by_worker_at, audit_log_json')
      .eq('id', contract.id)
      .single();
    await admin
      .from('contracts')
      .update({ audit_log_json: [...(fresh?.audit_log_json ?? []), auditEntry] })
      .eq('id', contract.id);

    let bookingStatus = booking.status;
    if (fresh?.signed_by_poster_at && fresh?.signed_by_worker_at) {
      const { error } = await admin
        .from('bookings')
        .update({ contract_id: contract.id, status: 'in_progress', updated_at: now })
        .eq('id', booking.id);
      if (error) throw error;
      bookingStatus = 'in_progress';
    } else if (!booking.contract_id) {
      await admin
        .from('bookings')
        .update({ contract_id: contract.id, updated_at: now })
        .eq('id', booking.id);
    }

    return jsonResponse({
      contract_id: contract.id,
      status: fresh?.status ?? contract.status,
      signed_by_poster: !!fresh?.signed_by_poster_at,
      signed_by_worker: !!fresh?.signed_by_worker_at,
      booking_status: bookingStatus,
    });
  } catch (e) {
    console.error('[sign-contract]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
