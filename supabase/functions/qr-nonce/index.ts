// qr-nonce — W7: worker requests/refreshes the rotating QR for attendance.
// POST { booking_id: string }
// Returns { nonce, expires_at, payload } — payload is what the QR encodes.
//
// TTL 65s (60s rotation + 5s buffer, per spec). The worker app re-calls this
// every 60s in the background; no user interaction needed.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const TTL_MS = 65_000;

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
      .select('id, worker_user_id, status, check_out_at')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);
    if (booking.worker_user_id !== user.id) return jsonResponse({ error: 'not_booking_worker' }, 403);
    if (booking.status !== 'in_progress') {
      return jsonResponse({ error: 'booking_not_in_progress', status: booking.status }, 409);
    }

    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
    const { data: nonceRow, error: insertError } = await admin
      .from('qr_nonces')
      .insert({ booking_id: booking.id, worker_user_id: booking.worker_user_id, expires_at: expiresAt })
      .select('nonce, expires_at')
      .single();
    if (insertError) throw insertError;

    const payload = JSON.stringify({
      n: nonceRow.nonce,
      b: booking.id,
      w: booking.worker_user_id,
    });

    return jsonResponse({ nonce: nonceRow.nonce, expires_at: nonceRow.expires_at, payload });
  } catch (e) {
    console.error('[qr-nonce]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
