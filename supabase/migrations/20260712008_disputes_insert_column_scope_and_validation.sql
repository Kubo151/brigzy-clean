-- Same bug class as the messages column-scope fix (20260712003): an INSERT
-- policy's WITH CHECK gates the row (caller is a party, raised_against is the
-- other party) but never constrained which OTHER columns the client could set.
-- The new mobile "raise a dispute" entry point only ever sends
-- booking_id/raised_by/raised_against/category/description/status, but
-- nothing stopped a direct API call from also setting resolution_note,
-- resolution_split_pct, support_agent_id, resolved_at, or a non-'open' status
-- on insert — self-resolving a dispute in your own favor, forging a fake
-- admin resolution note, or claiming an assignment. Disputes are meant to be
-- part of the audit trail for C2C evidence, so this is a real integrity gap,
-- not just a cosmetic one.
--
-- Also adds length caps on category/description — the client only enforces a
-- minimum via UI, nothing capped the maximum server-side.

DROP POLICY IF EXISTS "disputes_insert_entitled" ON public.disputes;

CREATE POLICY "disputes_insert_entitled" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    raised_by = auth.uid()
    AND status = 'open'
    AND resolution_note IS NULL
    AND resolution_split_pct IS NULL
    AND support_agent_id IS NULL
    AND resolved_at IS NULL
    AND char_length(category) <= 50
    AND (description IS NULL OR char_length(description) <= 2000)
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
        AND disputes.raised_against IN (b.worker_user_id, b.poster_user_id)
        AND disputes.raised_against <> auth.uid()
    )
  );
