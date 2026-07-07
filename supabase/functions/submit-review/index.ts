// submit-review — S7: blind two-way review after a cleared booking
// POST { booking_id: string, rating: 1..5, comment?: string }
// Returns { review_id, revealed }
//
// Blind logic: a review stays hidden (revealed_at NULL) until BOTH parties
// have submitted for the booking — then both are revealed at once and the
// recipients' rating_avg / rating_count are recomputed from revealed reviews.
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

    const { booking_id, rating, comment } = await req.json().catch(() => ({}));
    if (!booking_id) return jsonResponse({ error: 'booking_id_required' }, 400);
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return jsonResponse({ error: 'invalid_rating' }, 422);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, worker_user_id, poster_user_id, status')
      .eq('id', booking_id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return jsonResponse({ error: 'booking_not_found' }, 404);

    const isPoster = booking.poster_user_id === user.id;
    const isWorker = booking.worker_user_id === user.id;
    if (!isPoster && !isWorker) return jsonResponse({ error: 'not_booking_party' }, 403);
    if (booking.status !== 'cleared') {
      return jsonResponse({ error: 'booking_not_reviewable', status: booking.status }, 409);
    }

    const toUserId = isPoster ? booking.worker_user_id : booking.poster_user_id;

    const { data: existing, error: existingError } = await admin
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('from_user_id', user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return jsonResponse({ error: 'already_reviewed' }, 409);

    const now = new Date().toISOString();
    const { data: review, error: insertError } = await admin
      .from('reviews')
      .insert({
        booking_id: booking.id,
        from_user_id: user.id,
        to_user_id: toUserId,
        reviewer_id: user.id,
        reviewee_id: toUserId,
        rating: stars,
        rating_overall: stars,
        comment: (comment ?? '').toString().trim() || null,
        submitted_at: now,
        created_at: now,
      })
      .select('id')
      .single();
    if (insertError) throw insertError;

    // Blind reveal: both sides submitted → reveal both + recompute ratings
    const { data: pair, error: pairError } = await admin
      .from('reviews')
      .select('id, to_user_id')
      .eq('booking_id', booking.id)
      .in('from_user_id', [booking.worker_user_id, booking.poster_user_id]);
    if (pairError) throw pairError;

    let revealed = false;
    if ((pair ?? []).length >= 2) {
      const { error: revealError } = await admin
        .from('reviews')
        .update({ revealed_at: now })
        .eq('booking_id', booking.id)
        .is('revealed_at', null);
      if (revealError) throw revealError;
      revealed = true;

      // Recompute both parties' public rating from revealed reviews
      for (const uid of [booking.worker_user_id, booking.poster_user_id]) {
        const { data: agg, error: aggError } = await admin
          .from('reviews')
          .select('rating_overall')
          .eq('to_user_id', uid)
          .not('revealed_at', 'is', null);
        if (aggError) throw aggError;
        const ratings = (agg ?? []).map(r => r.rating_overall).filter((r): r is number => r != null);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          const { error: userError } = await admin
            .from('users')
            .update({ rating_avg: Math.round(avg * 10) / 10, rating_count: ratings.length })
            .eq('id', uid);
          if (userError) throw userError;
        }
      }
    }

    return jsonResponse({ review_id: review.id, revealed });
  } catch (e) {
    console.error('[submit-review]', e);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
});
