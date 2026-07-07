// release-escrow — P5: poster approves finished work → escrow released to worker
// POST { booking_id: string }
// Returns { booking_id, escrow_state, released_amount_cents, currency }
//
// DEMO MODE: no Stripe transfer — marks escrow 'cleared' and credits the worker's
// wallet_ledger directly. When Stripe keys land, a Transfer to the worker's Connect
// account happens before the ledger write; contract stays identical for the client.
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

    const { booking_id } = await req.json().catch(() => ({}));
    if (!booking_id) return jsonResponse({ error: 'booking_id_required' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, job_id, worker_user_id, poster_user_id, status, agreed_amount_cents, currency, escrow_id, check_in_at, check_out_at')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (booking.poster_user_id !== user.id) return jsonResponse({ error: 'not_booking_poster' }, 403);
    if (booking.status !== 'in_progress' && booking.status !== 'completed') {
      return jsonResponse({ error: 'booking_not_releasable', status: booking.status }, 409);
    }
    if (!booking.escrow_id) return jsonResponse({ error: 'escrow_not_funded' }, 409);

    const { data: escrow, error: escrowError } = await admin
      .from('escrow_transactions')
      .select('id, state, amount_cents, currency')
      .eq('id', booking.escrow_id)
      .maybeSingle();
    if (escrowError) throw escrowError;
    if (!escrow || escrow.state !== 'pending') {
      return jsonResponse({ error: 'escrow_not_releasable', state: escrow?.state ?? null }, 409);
    }

    const now = new Date().toISOString();

    const { data: job } = await admin
      .from('jobs')
      .select('title, pay_type, pay_amount_cents, pay_amount')
      .eq('id', booking.job_id)
      .maybeSingle();

    // Hourly + recorded attendance → prorate: rate × actual hours (rounded UP
    // to a started 15-minute block), capped at the escrowed amount. The
    // remainder stays with the poster (Stripe partial refund once live).
    // Hours beyond the estimate are the S4 Dodatok case (post-demo).
    let payoutCents = escrow.amount_cents;
    let actualHours: number | null = null;
    if (job?.pay_type === 'hourly' && booking.check_in_at && booking.check_out_at) {
      const rateCents = job.pay_amount_cents ?? Math.round((job.pay_amount ?? 0) * 100);
      const minutes = (new Date(booking.check_out_at).getTime() - new Date(booking.check_in_at).getTime()) / 60000;
      if (rateCents > 0 && minutes > 0) {
        actualHours = Math.max(Math.ceil(minutes / 15) * 0.25, 0.25);
        payoutCents = Math.min(Math.round(rateCents * actualHours), escrow.amount_cents);
      }
    }

    const { error: releaseError } = await admin
      .from('escrow_transactions')
      .update({ state: 'cleared', released_at: now, released_amount_cents: payoutCents })
      .eq('id', escrow.id);
    if (releaseError) throw releaseError;

    const { error: statusError } = await admin
      .from('bookings')
      .update({ status: 'cleared', updated_at: now })
      .eq('id', booking.id);
    if (statusError) throw statusError;

    const { error: ledgerError } = await admin.from('wallet_ledger').insert({
      user_id: booking.worker_user_id,
      entry_type: 'credit',
      amount_cents: payoutCents,
      currency: escrow.currency,
      ref_booking_id: booking.id,
      description: actualHours !== null
        ? `${job?.title ?? 'Brigáda'} · ${actualHours} h`
        : job?.title ?? 'Brigáda',
    });
    if (ledgerError) throw ledgerError;

    return jsonResponse({
      booking_id: booking.id,
      escrow_state: 'cleared',
      released_amount_cents: payoutCents,
      refunded_to_poster_cents: escrow.amount_cents - payoutCents,
      actual_hours: actualHours,
      currency: escrow.currency,
    });
  } catch (e) {
    console.error('[release-escrow]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
