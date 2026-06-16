-- ============================================================
-- Migration 004: RLS policies for all new tables
-- Existing tables (users/jobs/applications/messages/reviews)
-- keep their existing policies — new columns don't need new policies.
-- ============================================================

-- ── Helper: check if calling user is admin ────────────────────
-- (Used in several policies below)
-- CREATE OR REPLACE FUNCTION public.is_admin()
-- RETURNS bool LANGUAGE sql SECURITY DEFINER STABLE AS
-- $$ SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = auth.uid()), false) $$;
-- Note: inline auth.uid() checks are simpler for demo — skip the helper fn for now.

-- ── companies ─────────────────────────────────────────────────
CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid());

-- ── bookings ──────────────────────────────────────────────────
CREATE POLICY "bookings_select_parties" ON public.bookings
  FOR SELECT TO authenticated
  USING (worker_user_id = auth.uid() OR poster_user_id = auth.uid());

-- Bookings created/updated by Edge Functions (service_role bypasses RLS)
-- No INSERT/UPDATE policies needed for client

-- ── escrow_transactions — service_role only ───────────────────
-- (no user-level policies → all client access denied)

-- ── wallet_ledger — read own balance ─────────────────────────
CREATE POLICY "wallet_ledger_select_own" ON public.wallet_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── payouts — read own ────────────────────────────────────────
CREATE POLICY "payouts_select_own" ON public.payouts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── contracts — parties in the booking can read ───────────────
CREATE POLICY "contracts_select_parties" ON public.contracts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = contracts.booking_id
        AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
    )
  );

-- ── contract_otp_events — own rows only ──────────────────────
CREATE POLICY "contract_otp_events_select_own" ON public.contract_otp_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── contract_addendums — parties in related booking ───────────
CREATE POLICY "contract_addendums_select_parties" ON public.contract_addendums
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = contract_addendums.booking_id
        AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
    )
  );

-- ── price_negotiations — worker or poster of the application ──
CREATE POLICY "price_negotiations_select_parties" ON public.price_negotiations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = price_negotiations.application_id
        AND (a.worker_user_id = auth.uid() OR j.poster_user_id = auth.uid())
    )
  );

-- ── conversations — only participants ─────────────────────────
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert_authenticated" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── conversation_participants ─────────────────────────────────
CREATE POLICY "conv_participants_select_own" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "conv_participants_insert_authenticated" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "conv_participants_update_own" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── messages (new conversation_id based rows) ─────────────────
-- Existing policies stay for old rows.
-- New policy: participants in the conversation can read/write.
CREATE POLICY "messages_select_conversation_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (conversation_id IS NULL AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
    OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_conversation_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- ── reviews — parties see their own review pair after reveal ──
CREATE POLICY "reviews_select_parties" ON public.reviews
  FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- ── xp_events — read own ─────────────────────────────────────
CREATE POLICY "xp_events_select_own" ON public.xp_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── user_badges — public read ─────────────────────────────────
CREATE POLICY "user_badges_select_all" ON public.user_badges
  FOR SELECT TO authenticated
  USING (true);

-- ── brigy_ledger — read own ───────────────────────────────────
CREATE POLICY "brigy_ledger_select_own" ON public.brigy_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── referrals — read own ─────────────────────────────────────
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT TO authenticated
  USING (inviter_user_id = auth.uid() OR invitee_user_id = auth.uid());

-- ── verified_applications — own ──────────────────────────────
CREATE POLICY "verified_applications_select_own" ON public.verified_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── worker_listing_profiles — public read, own write ─────────
CREATE POLICY "worker_listing_profiles_select_all" ON public.worker_listing_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "worker_listing_profiles_write_own" ON public.worker_listing_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── worker_availability — public read, own write ──────────────
CREATE POLICY "worker_availability_select_all" ON public.worker_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "worker_availability_write_own" ON public.worker_availability
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── qr_nonces — service_role only ────────────────────────────
-- (workers need to generate & read their own nonce for display)
CREATE POLICY "qr_nonces_select_own_worker" ON public.qr_nonces
  FOR SELECT TO authenticated
  USING (worker_user_id = auth.uid());

-- ── attendance_events — parties in the booking ────────────────
CREATE POLICY "attendance_events_select_parties" ON public.attendance_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = attendance_events.booking_id
        AND (b.worker_user_id = auth.uid() OR b.poster_user_id = auth.uid())
    )
  );

-- ── work_hours_counters — parties can read ────────────────────
CREATE POLICY "work_hours_select_parties" ON public.work_hours_counters
  FOR SELECT TO authenticated
  USING (poster_user_id = auth.uid() OR worker_user_id = auth.uid());

-- ── push_tokens — own ────────────────────────────────────────
CREATE POLICY "push_tokens_own" ON public.push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── notifications — read/update own ──────────────────────────
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ── disputes — both parties see it ───────────────────────────
CREATE POLICY "disputes_select_parties" ON public.disputes
  FOR SELECT TO authenticated
  USING (raised_by = auth.uid() OR raised_against = auth.uid());

CREATE POLICY "disputes_insert_own" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (raised_by = auth.uid());

-- ── dispute_messages — parties in the dispute ─────────────────
CREATE POLICY "dispute_messages_select_parties" ON public.dispute_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_messages.dispute_id
        AND (d.raised_by = auth.uid() OR d.raised_against = auth.uid())
    )
  );

CREATE POLICY "dispute_messages_insert_parties" ON public.dispute_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_messages.dispute_id
        AND (d.raised_by = auth.uid() OR d.raised_against = auth.uid())
    )
  );

-- ── support_conversations — own ──────────────────────────────
CREATE POLICY "support_conversations_own" ON public.support_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_conversations_insert_own" ON public.support_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── support_messages — own conversation ──────────────────────
CREATE POLICY "support_messages_select_own" ON public.support_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations sc
      WHERE sc.id = support_messages.conversation_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "support_messages_insert_own" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_conversations sc
      WHERE sc.id = support_messages.conversation_id
        AND sc.user_id = auth.uid()
    )
  );

-- ── feature_flags — all authenticated can read ────────────────
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

-- ── broadcast_log, admin_actions — admin only ────────────────
CREATE POLICY "broadcast_log_admin_only" ON public.broadcast_log
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_actions_admin_only" ON public.admin_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- ── listing_contacts — own rows ───────────────────────────────
CREATE POLICY "listing_contacts_select_own" ON public.listing_contacts
  FOR SELECT TO authenticated
  USING (poster_user_id = auth.uid() OR worker_user_id = auth.uid());
