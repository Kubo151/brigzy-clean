-- Same class of bug as 20260712005 (price_negotiations): conv_participants_insert_self_entitled
-- and conversations_insert_entitled only check applications.worker_user_id and jobs.poster_user_id,
-- not the legacy applications.worker_id / jobs.employer_id columns. The apply/post-job flows now
-- dual-write both columns going forward, and existing rows were backfilled in 20260616001/20260712005,
-- so this isn't currently exploitable — but it's the same latent gap, closed here for consistency so
-- a future insert path that only sets the legacy column doesn't silently break conversation creation.

-- ── conversation_participants ─────────────────────────────────
DROP POLICY IF EXISTS "conv_participants_insert_self_entitled" ON public.conversation_participants;

CREATE POLICY "conv_participants_insert_self_entitled" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      LEFT JOIN public.bookings b ON b.id = c.booking_id
      LEFT JOIN public.jobs     j ON j.id = c.job_id
      WHERE c.id = conversation_participants.conversation_id
        AND (
          b.worker_user_id = auth.uid()
          OR b.poster_user_id = auth.uid()
          OR j.poster_user_id = auth.uid() OR j.employer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.job_id = j.id AND (a.worker_user_id = auth.uid() OR a.worker_id = auth.uid())
          )
        )
    )
  );

-- ── conversations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_insert_entitled" ON public.conversations;

CREATE POLICY "conversations_insert_entitled" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      booking_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = conversations.booking_id
          AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
      )
    )
    OR (
      job_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = conversations.job_id
          AND (
            j.poster_user_id = auth.uid() OR j.employer_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.applications a
              WHERE a.job_id = j.id AND (a.worker_user_id = auth.uid() OR a.worker_id = auth.uid())
            )
          )
      )
    )
  );
