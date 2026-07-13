-- Admin panel Support chat section needs live updates on support_messages
-- (and the conversation list for new/incoming conversations).
alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.support_conversations;

-- Unlike price_negotiations (20260712004), joining the publication alone isn't
-- enough here: support_conversations_own / support_messages_select_own /
-- support_messages_insert_own only ever match user_id = auth.uid(). The admin
-- panel's browser session must respect RLS (anon key + the admin's own JWT,
-- never service-role client-side) — an is_admin=true user is never a
-- conversation's user_id, so without an explicit bypass they'd see nothing,
-- live or otherwise. This is the first admin RLS bypass in this schema;
-- follow this pattern (EXISTS check against users.is_admin) for any other
-- admin-panel table that needs cross-user read/write over the anon key.

CREATE POLICY "support_conversations_admin_all" ON public.support_conversations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

CREATE POLICY "support_messages_admin_select" ON public.support_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

CREATE POLICY "support_messages_admin_insert" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'agent'
    AND sender_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );
