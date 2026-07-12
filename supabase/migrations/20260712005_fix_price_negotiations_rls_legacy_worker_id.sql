-- price_negotiations_select_parties only checked a.worker_user_id, but the
-- apply flow (src/app/apply/[id].tsx) only wrote the legacy a.worker_id
-- column, leaving worker_user_id null on every application created after
-- the 20260616001 backfill. Result: workers could not see their own
-- negotiation history (including accepted deals) after a page reload —
-- it only appeared via the live realtime subscription. Fallback-chain both
-- columns, matching the pattern already used elsewhere in the schema.

UPDATE public.applications SET worker_user_id = worker_id
WHERE worker_user_id IS NULL AND worker_id IS NOT NULL;

DROP POLICY IF EXISTS "price_negotiations_select_parties" ON public.price_negotiations;

CREATE POLICY "price_negotiations_select_parties" ON public.price_negotiations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = price_negotiations.application_id
        AND (
          a.worker_user_id = auth.uid() OR a.worker_id = auth.uid()
          OR j.poster_user_id = auth.uid() OR j.employer_id = auth.uid()
        )
    )
  );
