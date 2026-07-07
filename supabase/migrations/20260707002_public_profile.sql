-- ============================================================
-- Migration 008: W13 public profile support
--   - revealed reviews are publicly readable (blind-review S7:
--     only pairs see unrevealed ones)
--   - SECURITY DEFINER stats fn: completed-booking counts without
--     opening the bookings table to everyone
-- ============================================================

DROP POLICY IF EXISTS "reviews_select_revealed" ON public.reviews;
CREATE POLICY "reviews_select_revealed" ON public.reviews
  FOR SELECT TO authenticated
  USING (revealed_at IS NOT NULL);

CREATE OR REPLACE FUNCTION public.get_public_profile_stats(p_user_id uuid)
RETURNS TABLE (completed_as_worker bigint, completed_as_poster bigint)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.bookings WHERE worker_user_id = p_user_id AND status = 'cleared'),
    (SELECT count(*) FROM public.bookings WHERE poster_user_id = p_user_id AND status = 'cleared');
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_stats(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile_stats(uuid) TO authenticated;
