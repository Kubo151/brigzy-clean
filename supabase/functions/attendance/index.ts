// attendance — work-day check-in / check-out (button version; QR scan lands on
// the same endpoint later with a qr_nonce parameter).
// POST { booking_id: string, action: 'check_in' | 'check_out' }
// Returns { booking_id, check_in_at, check_out_at }
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

    const { booking_id, action } = await req.json().catch(() => ({}));
    if (!booking_id) return jsonResponse({ error: 'booking_id_required' }, 400);
    if (action !== 'check_in' && action !== 'check_out') {
      return jsonResponse({ error: 'invalid_action' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, poster_user_id, status, check_in_at, check_out_at')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (booking.poster_user_id !== user.id) return jsonResponse({ error: 'not_booking_poster' }, 403);
    if (booking.status !== 'in_progress') {
      return jsonResponse({ error: 'booking_not_in_progress', status: booking.status }, 409);
    }

    const now = new Date().toISOString();

    if (action === 'check_in') {
      if (booking.check_in_at) return jsonResponse({ error: 'already_checked_in' }, 409);
      const { error } = await admin
        .from('bookings')
        .update({ check_in_at: now, updated_at: now })
        .eq('id', booking.id);
      if (error) throw error;
    } else {
      if (!booking.check_in_at) return jsonResponse({ error: 'not_checked_in' }, 409);
      if (booking.check_out_at) return jsonResponse({ error: 'already_checked_out' }, 409);
      const { error } = await admin
        .from('bookings')
        .update({ check_out_at: now, updated_at: now })
        .eq('id', booking.id);
      if (error) throw error;
    }

    const { error: eventError } = await admin.from('attendance_events').insert({
      booking_id: booking.id,
      kind: action,
      scanned_by: user.id,
      device_timestamp: now,
    });
    if (eventError) throw eventError;

    return jsonResponse({
      booking_id: booking.id,
      check_in_at: action === 'check_in' ? now : booking.check_in_at,
      check_out_at: action === 'check_out' ? now : booking.check_out_at,
    });
  } catch (e) {
    console.error('[attendance]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
