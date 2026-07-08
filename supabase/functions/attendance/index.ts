// attendance — work-day check-in / check-out. Two paths:
//   1. Manual button (action explicit) — kept as a fallback per product decision.
//   2. QR scan (nonce present) — poster scanned the worker's rotating QR;
//      server validates the nonce and auto-determines check_in vs check_out.
// POST { booking_id: string, action?: 'check_in' | 'check_out', nonce?: string, lat?: number, lng?: number }
// Returns { booking_id, check_in_at, check_out_at, kind }
//
// Poster records attendance (per spec the poster scans the worker's QR).
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

    const { booking_id, action, nonce, lat, lng } = await req.json().catch(() => ({}));
    if (!booking_id) return jsonResponse({ error: 'booking_id_required' }, 400);
    if (!nonce && action !== 'check_in' && action !== 'check_out') {
      return jsonResponse({ error: 'invalid_action' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, poster_user_id, worker_user_id, status, check_in_at, check_out_at')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (booking.poster_user_id !== user.id) return jsonResponse({ error: 'not_booking_poster' }, 403);
    if (booking.status !== 'in_progress') {
      return jsonResponse({ error: 'booking_not_in_progress', status: booking.status }, 409);
    }

    let resolvedAction: 'check_in' | 'check_out';
    let nonceRowId: string | null = null;

    if (nonce) {
      // QR path — validate the nonce, then auto-determine the action from the
      // last recorded event (spec: "server určí automaticky podľa posledného eventu").
      const { data: nonceRow, error: nonceError } = await admin
        .from('qr_nonces')
        .select('nonce, booking_id, worker_user_id, expires_at, used_at')
        .eq('nonce', nonce)
        .maybeSingle();
      if (nonceError) throw nonceError;
      if (!nonceRow) return jsonResponse({ error: 'nonce_not_found' }, 404);
      if (nonceRow.booking_id !== booking.id) return jsonResponse({ error: 'wrong_booking' }, 409);
      if (nonceRow.used_at) return jsonResponse({ error: 'nonce_already_used' }, 409);
      if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
        return jsonResponse({ error: 'nonce_expired' }, 409);
      }
      resolvedAction = booking.check_in_at && !booking.check_out_at ? 'check_out' : 'check_in';
      nonceRowId = nonceRow.nonce;
    } else {
      resolvedAction = action;
    }

    if (resolvedAction === 'check_in' && booking.check_in_at) {
      return jsonResponse({ error: 'already_checked_in' }, 409);
    }
    if (resolvedAction === 'check_out' && !booking.check_in_at) {
      return jsonResponse({ error: 'not_checked_in' }, 409);
    }
    if (resolvedAction === 'check_out' && booking.check_out_at) {
      return jsonResponse({ error: 'already_checked_out' }, 409);
    }

    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from('bookings')
      .update({
        [resolvedAction === 'check_in' ? 'check_in_at' : 'check_out_at']: now,
        updated_at: now,
      })
      .eq('id', booking.id);
    if (updateError) throw updateError;

    const { error: eventError } = await admin.from('attendance_events').insert({
      booking_id: booking.id,
      kind: resolvedAction,
      scanned_by: user.id,
      qr_nonce: nonceRowId,
      device_timestamp: now,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
    });
    if (eventError) throw eventError;

    if (nonceRowId) {
      const { error: markUsedError } = await admin
        .from('qr_nonces')
        .update({ used_at: now })
        .eq('nonce', nonceRowId);
      if (markUsedError) throw markUsedError;
    }

    return jsonResponse({
      booking_id: booking.id,
      check_in_at: resolvedAction === 'check_in' ? now : booking.check_in_at,
      check_out_at: resolvedAction === 'check_out' ? now : booking.check_out_at,
      kind: resolvedAction,
    });
  } catch (e) {
    console.error('[attendance]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
