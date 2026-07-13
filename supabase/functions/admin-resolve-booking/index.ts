// admin-resolve-booking — used by the (separate) admin panel for two cases:
//   1. Manual escrow override on a booking (Bookings & Escrow section)
//   2. Dispute resolution (Spory section) — pass dispute_id to also close the dispute
// POST { booking_id, resolution: 'release_worker' | 'refund_poster' | 'split',
//        split_pct?: number (0-100, required for 'split'), reason: string, dispute_id?: string }
//
// Unlike release-escrow (mobile, poster-only), this is admin-only: caller must have
// users.is_admin = true. Every call writes an admin_actions audit row per Admin-Panel-Spec §6.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Inlined (not imported from ../_shared/cors.ts) because the MCP deploy tool
// bundles only the files explicitly passed to it, not the shared folder.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: caller } = await admin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    if (!caller?.is_admin) return jsonResponse({ error: 'not_admin' }, 403);

    const { booking_id, resolution, split_pct, reason, dispute_id } = await req.json().catch(() => ({}));
    if (!booking_id || !resolution || !reason) {
      return jsonResponse({ error: 'booking_id_resolution_reason_required' }, 400);
    }
    if (!['release_worker', 'refund_poster', 'split'].includes(resolution)) {
      return jsonResponse({ error: 'invalid_resolution' }, 400);
    }
    if (resolution === 'split' && (typeof split_pct !== 'number' || split_pct < 0 || split_pct > 100)) {
      return jsonResponse({ error: 'split_pct_required_0_100' }, 400);
    }

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, job_id, worker_user_id, poster_user_id, status, escrow_id')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (!booking.escrow_id) return jsonResponse({ error: 'escrow_not_funded' }, 409);

    const { data: escrow, error: escrowError } = await admin
      .from('escrow_transactions')
      .select('id, state, amount_cents, currency')
      .eq('id', booking.escrow_id)
      .maybeSingle();
    if (escrowError) throw escrowError;
    if (!escrow || (escrow.state !== 'pending' && escrow.state !== 'disputed')) {
      return jsonResponse({ error: 'escrow_not_resolvable', state: escrow?.state ?? null }, 409);
    }

    const { data: job } = await admin.from('jobs').select('title').eq('id', booking.job_id).maybeSingle();

    const pct = resolution === 'release_worker' ? 100 : resolution === 'refund_poster' ? 0 : split_pct;
    const payoutCents = Math.round((escrow.amount_cents * pct) / 100);
    const refundCents = escrow.amount_cents - payoutCents;
    const now = new Date().toISOString();

    const { error: escrowUpdateError } = await admin
      .from('escrow_transactions')
      .update({
        state: payoutCents === 0 ? 'refunded' : 'cleared',
        released_at: now,
        released_amount_cents: payoutCents,
      })
      .eq('id', escrow.id);
    if (escrowUpdateError) throw escrowUpdateError;

    const { error: bookingUpdateError } = await admin
      .from('bookings')
      .update({ status: payoutCents === 0 ? 'cancelled' : 'cleared', updated_at: now })
      .eq('id', booking.id);
    if (bookingUpdateError) throw bookingUpdateError;

    if (payoutCents > 0) {
      const { error: ledgerError } = await admin.from('wallet_ledger').insert({
        user_id: booking.worker_user_id,
        entry_type: 'credit',
        amount_cents: payoutCents,
        currency: escrow.currency,
        ref_booking_id: booking.id,
        description: `${job?.title ?? 'Brigáda'} · admin resolution (${resolution})`,
      });
      if (ledgerError) throw ledgerError;
    }

    if (dispute_id) {
      const disputeStatus =
        resolution === 'release_worker' ? 'resolved_worker'
        : resolution === 'refund_poster' ? 'resolved_poster'
        : 'resolved_split';
      const { error: disputeError } = await admin
        .from('disputes')
        .update({
          status: disputeStatus,
          resolution_split_pct: pct,
          resolution_note: reason,
          support_agent_id: user.id,
          resolved_at: now,
        })
        .eq('id', dispute_id);
      if (disputeError) throw disputeError;
    }

    await admin.from('admin_actions').insert({
      admin_user_id: user.id,
      action: dispute_id ? 'resolve_dispute' : 'manual_escrow_resolution',
      entity_type: 'booking',
      entity_id: booking.id,
      payload_json: { resolution, split_pct: pct, reason, dispute_id, payoutCents, refundCents },
    });

    return jsonResponse({
      booking_id: booking.id,
      escrow_state: payoutCents === 0 ? 'refunded' : 'cleared',
      released_amount_cents: payoutCents,
      refunded_amount_cents: refundCents,
      currency: escrow.currency,
    });
  } catch (e) {
    console.error('[admin-resolve-booking]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
