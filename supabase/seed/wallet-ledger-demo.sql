-- Wallet ledger demo seed (W8) — credits for the demo worker account.
-- Amounts are signed: credits positive, payouts negative. Balance after seed: 135,00 €.
-- Idempotent: skips if the user already has any ledger rows.
WITH w AS (
  SELECT id FROM public.users WHERE email = 'lucia@demo.brigzy.sk' LIMIT 1
)
INSERT INTO public.wallet_ledger (user_id, entry_type, amount_cents, currency, description, created_at)
SELECT w.id, e.entry_type, e.amount_cents, 'EUR', e.description, e.created_at
FROM w,
(VALUES
  ('credit',  6750, 'Brigáda — kaviareň',       now() - interval '30 days'),
  ('credit',  4000, 'Pomocník v sklade',         now() - interval '9 days'),
  ('payout', -6000, 'IBAN •••• 4821',            now() - interval '7 days'),
  ('credit',  5500, 'Firemný event — obsluha',   now() - interval '3 days'),
  ('credit',  3250, 'Doručovanie balíkov',       now() - interval '1 day')
) AS e(entry_type, amount_cents, description, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet_ledger wl WHERE wl.user_id = w.id
);
