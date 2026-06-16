-- Fix: disputes INSERT only checked raised_by = auth.uid()
-- A user could set booking_id to any booking and raised_against to any user.
-- Tightened to require: caller is a party to the booking, raised_against
-- is the other party of that booking, and differs from caller.

DROP POLICY IF EXISTS "disputes_insert_own" ON public.disputes;

CREATE POLICY "disputes_insert_entitled" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    raised_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
        AND disputes.raised_against IN (b.worker_user_id, b.poster_user_id)
        AND disputes.raised_against <> auth.uid()
    )
  );
