// fund-escrow — S5: poster confirms escrow funding for a booking
// POST { booking_id: string }
// Returns { booking_id, escrow_id, state, amount_cents, service_fee_cents, total_cents, currency }
//
// DEMO MODE: no Stripe call — creates the escrow row (state 'pending') and moves the
// booking to 'awaiting_signatures' directly. When Stripe test keys land, this function
// gains a PaymentIntent immediate-charge step before the escrow insert; the request and
// response contract stays identical so the client does not change.
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
      .select('id, poster_user_id, status, agreed_amount_cents, service_fee_cents, currency, escrow_id')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (booking.poster_user_id !== user.id) return jsonResponse({ error: 'not_booking_poster' }, 403);
    if (booking.status !== 'escrow_pending') {
      return jsonResponse({ error: 'booking_not_fundable', status: booking.status }, 409);
    }

    const { data: escrow, error: escrowError } = await admin
      .from('escrow_transactions')
      .insert({
        booking_id: booking.id,
        amount_cents: booking.agreed_amount_cents,
        service_fee_cents: booking.service_fee_cents,
        currency: booking.currency,
        state: 'pending',
        held_at: new Date().toISOString(),
        stripe_payment_intent_id: `demo_${booking.id.slice(0, 8)}_${Date.now()}`,
      })
      .select('id, state')
      .single();
    if (escrowError) throw escrowError;

    const { error: updateError } = await admin
      .from('bookings')
      .update({
        escrow_id: escrow.id,
        status: 'awaiting_signatures',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    if (updateError) throw updateError;

    return jsonResponse({
      booking_id: booking.id,
      escrow_id: escrow.id,
      state: escrow.state,
      amount_cents: booking.agreed_amount_cents,
      service_fee_cents: booking.service_fee_cents,
      total_cents: booking.agreed_amount_cents + booking.service_fee_cents,
      currency: booking.currency,
    });
  } catch (e) {
    console.error('[fund-escrow]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
