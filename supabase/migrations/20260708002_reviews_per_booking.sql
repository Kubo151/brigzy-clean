-- ============================================================
-- Migration 011: reviews are per-booking, not per-pair
--   Legacy UNIQUE (reviewer_id, reviewee_id) allowed only ONE
--   review between two users EVER — repeat hires could never be
--   reviewed again. Replace with one review per (booking, author).
-- ============================================================

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_key;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_from_unique UNIQUE (booking_id, from_user_id);
