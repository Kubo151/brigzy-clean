-- Fix: conversation_participants INSERT was unrestricted (IDOR / Broken RLS)
-- conv_participants_insert_authenticated had WITH CHECK (true) — any authenticated
-- user could add anyone to any conversation.
-- conversations_insert_authenticated also had WITH CHECK (true) — tightened too.

-- ── conversation_participants ─────────────────────────────────
DROP POLICY IF EXISTS "conv_participants_insert_authenticated" ON public.conversation_participants;

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
          OR j.poster_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.job_id = j.id AND a.worker_user_id = auth.uid()
          )
        )
    )
  );

-- ── conversations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;

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
            j.poster_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.applications a
              WHERE a.job_id = j.id AND a.worker_user_id = auth.uid()
            )
          )
      )
    )
  );
