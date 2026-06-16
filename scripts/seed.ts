/**
 * Brigzy demo seed script
 * Creates 4 demo users, 10 Bratislava jobs, and a complete demo booking path.
 *
 * Run:
 *   node --env-file=.env --experimental-strip-types scripts/seed.ts
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Env loading ───────────────────────────────────────────────
// Node 24 --env-file handles this, but fallback to manual parse
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch { /* .env missing — rely on actual env */ }
}
loadEnv()

const URL  = process.env.EXPO_PUBLIC_SUPABASE_URL
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('❌  Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// ── Time helpers ──────────────────────────────────────────────
const ago    = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()
const hAgo   = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const todayAt = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); return d.toISOString() }

// ── Demo identifiers ──────────────────────────────────────────
const DEMO_TAG = '@demo.brigzy.sk'
const PASS     = 'Brigzy2026!'

const DEMO_USERS = [
  {
    email: `lucia${DEMO_TAG}`,
    first_name: 'Lucia', last_name: 'Nováková', phone: '+421901111111',
    active_role: 'worker', xp: 850, rank_tier: 'Skúsený',
    rating_avg: 4.7, rating_count: 8,
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=lucia',
  },
  {
    email: `marek${DEMO_TAG}`,
    first_name: 'Marek', last_name: 'Kováč', phone: '+421902222222',
    active_role: 'worker', xp: 120, rank_tier: 'Začiatočník',
    rating_avg: 4.2, rating_count: 2,
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=marek',
  },
  {
    email: `jana${DEMO_TAG}`,
    first_name: 'Jana', last_name: 'Horáková', phone: '+421903333333',
    active_role: 'poster', xp: 40, rank_tier: null,
    rating_avg: 4.8, rating_count: 3,
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=jana',
  },
  {
    email: `pavel${DEMO_TAG}`,
    first_name: 'Pavel', last_name: 'Sloboda', phone: '+421904444444',
    active_role: 'poster', xp: 150, rank_tier: null,
    rating_avg: 4.6, rating_count: 6,
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=pavel',
  },
]

// ── Bratislava job definitions ────────────────────────────────
// pay_amount_cents = minor units (EUR cents)
const JOB_DEFS = [
  { title: 'Čašník/čašníčka — večerná smena',       category_key: 'hospitality',  pay_type: 'hourly', pay_amount_cents: 700,  lat: 48.1457, lng: 17.1077, is_sos: false, poster: 'pavel', slots_total: 2, starts_at: ago(-1), ends_at: ago(-1) },
  { title: 'Kuchárska výpomoc — víkendové menu',     category_key: 'hospitality',  pay_type: 'hourly', pay_amount_cents: 800,  lat: 48.1390, lng: 17.0960, is_sos: false, poster: 'pavel', slots_total: 1, starts_at: ago(3),  ends_at: ago(3)  },
  { title: 'Pomocník na firemný event',               category_key: 'events',       pay_type: 'fixed',  pay_amount_cents: 8000, lat: 48.1234, lng: 17.1020, is_sos: false, poster: 'pavel', slots_total: 4, starts_at: ago(5),  ends_at: ago(5)  },
  { title: 'Upratovanie kancelárskych priestorov',   category_key: 'cleaning',     pay_type: 'hourly', pay_amount_cents: 580,  lat: 48.1698, lng: 17.1202, is_sos: false, poster: 'jana',  slots_total: 1, starts_at: ago(2),  ends_at: ago(2)  },
  { title: 'Predavač/predavačka na trhu Miletičova', category_key: 'retail',       pay_type: 'hourly', pay_amount_cents: 580,  lat: 48.1430, lng: 17.1250, is_sos: false, poster: 'jana',  slots_total: 1, starts_at: ago(4),  ends_at: ago(4)  },
  { title: 'Skladník/skladníčka — jednorázová smena',category_key: 'warehouse',    pay_type: 'hourly', pay_amount_cents: 650,  lat: 48.1650, lng: 17.1400, is_sos: false, poster: 'pavel', slots_total: 3, starts_at: ago(10), ends_at: ago(10) },
  { title: 'Brigáda v predajni — Aupark',            category_key: 'retail',       pay_type: 'hourly', pay_amount_cents: 600,  lat: 48.1360, lng: 17.1020, is_sos: false, poster: 'pavel', slots_total: 2, starts_at: ago(6),  ends_at: ago(6)  },
  { title: 'Kuriér/kuriérka — expresné doručovanie', category_key: 'delivery',     pay_type: 'hourly', pay_amount_cents: 620,  lat: 48.1440, lng: 17.1160, is_sos: false, poster: 'jana',  slots_total: 2, starts_at: ago(3),  ends_at: ago(3)  },
  { title: '⚡ Asistent stavby — okamžite',           category_key: 'construction', pay_type: 'hourly', pay_amount_cents: 850,  lat: 48.1200, lng: 17.1000, is_sos: true,  poster: 'jana',  slots_total: 1, starts_at: ago(0),  ends_at: ago(0)  },
  { title: 'Recepčná/recepčný na víkend',            category_key: 'admin',        pay_type: 'hourly', pay_amount_cents: 700,  lat: 48.1464, lng: 17.1265, is_sos: false, poster: 'jana',  slots_total: 1, starts_at: ago(7),  ends_at: ago(7)  },
]

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Brigzy demo seed — starting...\n')

  // 1. Cleanup existing demo users
  await cleanup()

  // 2. Create auth + public users
  const userIds = await createUsers()

  const lucia = userIds['lucia']
  const marek = userIds['marek']
  const jana  = userIds['jana']
  const pavel = userIds['pavel']

  // 3. Company for Pavel
  const companyId = await createCompany(pavel)

  // 4. 10 Jobs
  const jobIds = await createJobs({ lucia, marek, jana, pavel }, companyId)

  // 5. Demo booking path: Job 0 (Čašník) — Lucia ↔ Pavel, in_progress
  await createDemoPath({ lucia, pavel, jana, marek }, jobIds, companyId)

  console.log('\n✅  Seed complete!')
  console.log('   lucia@demo.brigzy.sk  / Brigzy2026!  (worker)')
  console.log('   marek@demo.brigzy.sk  / Brigzy2026!  (worker)')
  console.log('   jana@demo.brigzy.sk   / Brigzy2026!  (poster)')
  console.log('   pavel@demo.brigzy.sk  / Brigzy2026!  (poster)')
}

// ── Cleanup ───────────────────────────────────────────────────
async function cleanup() {
  console.log('🧹  Cleaning up existing demo data...')
  const { data: users } = await sb.auth.admin.listUsers()
  const demoIds = (users?.users ?? [])
    .filter(u => u.email?.endsWith(DEMO_TAG))
    .map(u => u.id)

  for (const id of demoIds) {
    await sb.auth.admin.deleteUser(id)
  }
  console.log(`    Removed ${demoIds.length} demo auth user(s)`)
}

// ── Create auth + public users ────────────────────────────────
async function createUsers(): Promise<Record<string, string>> {
  console.log('👤  Creating users...')
  const result: Record<string, string> = {}

  for (const u of DEMO_USERS) {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: PASS,
      email_confirm: true,
      phone: u.phone,
    })
    if (error || !data.user) throw new Error(`Auth user create failed: ${error?.message}`)

    const id = data.user.id
    const key = u.email.replace(DEMO_TAG, '')
    result[key] = id

    const { error: pe } = await sb.from('users').insert({
      id,
      email:            u.email,
      first_name:       u.first_name,
      last_name:        u.last_name,
      name:             u.first_name,    // legacy column
      surname:          u.last_name,     // legacy column
      phone:            u.phone,
      active_role:      u.active_role,
      role:             u.active_role === 'poster' ? 'employer' : 'worker', // legacy
      xp:               u.xp,
      rank_tier:        u.rank_tier,
      rating_avg:       u.rating_avg,
      rating_count:     u.rating_count,
      rating:           u.rating_avg,    // legacy
      avatar_url:       u.avatar_url,
      kyc_status:       'none',
      locale:           'sk',
      created_at:       ago(14),
    })
    if (pe) throw new Error(`Public user insert failed (${u.email}): ${pe.message}`)

    console.log(`    ✓ ${u.first_name} ${u.last_name} (${u.active_role})`)
  }
  return result
}

// ── Company ───────────────────────────────────────────────────
async function createCompany(pavelsId: string): Promise<string> {
  console.log('🏢  Creating company...')
  const { data, error } = await sb.from('companies').insert({
    owner_user_id:    pavelsId,
    name:             'Reštaurácia Korzo s.r.o.',
    ico:              '12345678',
    dic:              '2020123456',
    billing_address:  'Obchodná 10, 811 06 Bratislava',
    created_at:       ago(30),
  }).select('id').single()
  if (error || !data) throw new Error(`Company insert failed: ${error?.message}`)
  console.log('    ✓ Reštaurácia Korzo s.r.o.')
  return data.id
}

// ── Jobs ──────────────────────────────────────────────────────
async function createJobs(
  ids: Record<string, string>,
  companyId: string,
): Promise<string[]> {
  console.log('💼  Creating 10 jobs...')
  const jobIds: string[] = []

  for (const [i, j] of JOB_DEFS.entries()) {
    const posterId = ids[j.poster]
    const { data, error } = await sb.from('jobs').insert({
      poster_user_id:   posterId,
      employer_id:      posterId,         // legacy
      company_id:       j.poster === 'pavel' ? companyId : null,
      title:            j.title,
      description:      `Demo brigáda — ${j.title}. Vhodné pre šikovných ľudí s dobrou pracovnou morálkou.`,
      category_key:     j.category_key,
      category:         j.category_key,  // legacy
      location_text:    'Bratislava',
      location:         'Bratislava',     // legacy
      pay_type:         j.pay_type,
      pay_amount_cents: j.pay_amount_cents,
      pay_amount:       j.pay_amount_cents / 100, // legacy
      currency:         'EUR',
      is_sos:           j.is_sos,
      is_urgent:        j.is_sos,        // legacy
      slots_total:      j.slots_total,
      slots_filled:     i < 3 ? 1 : 0,
      lat:              j.lat,
      lng:              j.lng,
      status:           'active',
      starts_at:        j.starts_at,
      ends_at:          j.ends_at,
      created_at:       ago(7),
    }).select('id').single()
    if (error || !data) throw new Error(`Job insert failed (${j.title}): ${error?.message}`)
    jobIds.push(data.id)
    console.log(`    ✓ [${i + 1}] ${j.title}`)
  }
  return jobIds
}

// ── Demo booking path ─────────────────────────────────────────
async function createDemoPath(
  ids: Record<string, string>,
  jobIds: string[],
  _companyId: string,
) {
  console.log('🎬  Building demo booking path...')

  const { lucia, pavel, marek } = ids
  const job0 = jobIds[0]  // Čašník — active booking (in_progress)
  const job5 = jobIds[5]  // Skladník — completed (cleared)
  const job1 = jobIds[1]  // Kuchárska výpomoc — escrow_pending

  // ── A: Lucia ↔ Pavel / Job0 — in_progress (live shift) ──────
  const appA = await insert('applications', {
    job_id:        job0,
    worker_user_id: lucia,
    worker_id:     lucia,  // legacy
    status:        'accepted',
    message:       'Ahoj, mám skúsenosti s obsluhou, rád by som sa pridal!',
    created_at:    ago(3),
  })

  const bookingA = await insert('bookings', {
    job_id:              job0,
    worker_user_id:      lucia,
    poster_user_id:      pavel,
    agreed_amount_cents: 5600,   // 8h × €7
    service_fee_cents:   560,    // 10%
    currency:            'EUR',
    status:              'in_progress',
    check_in_at:         todayAt(8),
    created_at:          ago(3),
  })

  const contractA = await insert('contracts', {
    booking_id:          bookingA,
    type:                'dovp',
    status:              'signed',
    payload_json:        { rodne_cislo: null, health_insurer: 'vszp', iban: 'SK...demo' },
    signed_by_worker_at: ago(2),
    signed_by_poster_at: ago(2),
    worker_sign_method:  'otp',
    poster_sign_method:  'otp',
    template_version:    'v1-vzor',
    created_at:          ago(3),
  })

  const escrowA = await insert('escrow_transactions', {
    booking_id:               bookingA,
    stripe_payment_intent_id: 'pi_demo_AAAAAAAAAAAAAAAA',
    amount_cents:             5600,
    service_fee_cents:        560,
    currency:                 'EUR',
    state:                    'pending',
    held_at:                  ago(2),
    created_at:               ago(3),
  })

  // Update booking with contract + escrow FKs
  await sb.from('bookings').update({ contract_id: contractA, escrow_id: escrowA }).eq('id', bookingA)

  // Conversation for Job0
  const convA = await insert('conversations', {
    job_id:     job0,
    booking_id: bookingA,
    type:       'direct',
    created_at: ago(3),
  })
  await sb.from('conversation_participants').insert([
    { conversation_id: convA, user_id: lucia, unread_count: 0 },
    { conversation_id: convA, user_id: pavel, unread_count: 1 },
  ])
  await sb.from('messages').insert([
    { conversation_id: convA, sender_user_id: pavel, message_type: 'text', content: 'Ahoj Lucia, máš záujem o brigádu v sobotu?', created_at: ago(4) },
    { conversation_id: convA, sender_user_id: lucia, message_type: 'text', content: 'Áno, určite! Kedy začíname?', created_at: ago(4) },
    { conversation_id: convA, sender_user_id: pavel, message_type: 'text', content: 'Začíname o 17:00, trvá to cca 8 hodín.', created_at: ago(3) },
    { conversation_id: convA, sender_user_id: null,  message_type: 'system', content: 'Lucia Nováková sa prihlásila na brigádu.', created_at: ago(3) },
    { conversation_id: convA, sender_user_id: null,  message_type: 'system', content: 'Escrow zaistený — €56,00 bolo zablokovaných.', created_at: ago(2) },
    { conversation_id: convA, sender_user_id: null,  message_type: 'system', content: 'Zmluva podpísaná oboma stranami.', created_at: ago(2) },
    { conversation_id: convA, sender_user_id: lucia, message_type: 'text', content: 'Super, teším sa! Do videnia.', created_at: ago(2) },
  ])

  // 350h counter — Lucia + Pavel at 315h (90% warning)
  await insert('work_hours_counters', {
    poster_user_id: pavel,
    worker_user_id: lucia,
    year:           2026,
    seed_hours:     280,
    accrued_hours:  35,
  })

  // Brigy — Lucia has earned 420 Brigy
  await sb.from('brigy_ledger').insert([
    { user_id: lucia, entry_type: 'earn', delta: 350, reason: 'hour', ref_booking_id: bookingA, created_at: ago(2) },
    { user_id: lucia, entry_type: 'earn', delta: 70,  reason: 'rating5', created_at: ago(10) },
  ])

  console.log('    ✓ Booking A (in_progress) — Lucia čašníčka at Korzo')

  // ── B: Lucia ↔ Pavel / Job5 — cleared (historical, wallet credit) ─
  const appB = await insert('applications', {
    job_id:         job5,
    worker_user_id: lucia,
    worker_id:      lucia,
    status:         'accepted',
    message:        'Mám skúsenosti so skladom, budem rád pomôcť.',
    created_at:     ago(14),
  })

  const bookingB = await insert('bookings', {
    job_id:              job5,
    worker_user_id:      lucia,
    poster_user_id:      pavel,
    agreed_amount_cents: 3900,   // 6h × €6.50
    service_fee_cents:   390,
    currency:            'EUR',
    status:              'cleared',
    check_in_at:         ago(10),
    check_out_at:        hAgo(10 * 24 - 6),
    created_at:          ago(12),
  })

  const contractB = await insert('contracts', {
    booking_id:          bookingB,
    type:                'dovp',
    status:              'signed',
    payload_json:        {},
    signed_by_worker_at: ago(11),
    signed_by_poster_at: ago(11),
    worker_sign_method:  'otp',
    poster_sign_method:  'otp',
    template_version:    'v1-vzor',
    created_at:          ago(12),
  })
  const escrowB = await insert('escrow_transactions', {
    booking_id:               bookingB,
    stripe_payment_intent_id: 'pi_demo_BBBBBBBBBBBBBBBB',
    amount_cents:             3900,
    service_fee_cents:        390,
    currency:                 'EUR',
    state:                    'cleared',
    held_at:                  ago(11),
    released_at:              ago(9),
    released_amount_cents:    3510,  // after fee
    created_at:               ago(12),
  })
  await sb.from('bookings').update({ contract_id: contractB, escrow_id: escrowB }).eq('id', bookingB)

  // Wallet credit for Lucia
  await insert('wallet_ledger', {
    user_id:        lucia,
    entry_type:     'credit',
    amount_cents:   3510,
    currency:       'EUR',
    ref_booking_id: bookingB,
    description:    'Výplata za brigádu — Skladník',
    created_at:     ago(9),
  })

  // XP events
  await sb.from('xp_events').insert([
    { user_id: lucia, delta: 100, reason: 'booking_completed', ref_booking_id: bookingB, created_at: ago(9) },
    { user_id: lucia, delta: 20,  reason: 'review_submitted',  ref_booking_id: bookingB, created_at: ago(9) },
  ])

  // Badges
  await sb.from('user_badges').insert([
    { user_id: lucia, badge_key: 'first_job',  awarded_at: ago(30) },
    { user_id: lucia, badge_key: 'reliable',   awarded_at: ago(9)  },
    { user_id: lucia, badge_key: 'five_star',  awarded_at: ago(9)  },
  ])

  // Reviews (revealed)
  const reviewB1 = await insert('reviews', {
    booking_id:     bookingB,
    from_user_id:   pavel,
    to_user_id:     lucia,
    rating_overall: 5,
    rating_cat1:    5,   // dochvíľnosť
    rating_cat2:    5,   // kvalita
    rating_cat3:    4,   // spoľahlivosť
    comment:        'Výborná pracovníčka, prišla načas a odviedla skvelú prácu!',
    submitted_at:   ago(9),
    revealed_at:    ago(9),
    created_at:     ago(10),
  })
  const reviewB2 = await insert('reviews', {
    booking_id:     bookingB,
    from_user_id:   lucia,
    to_user_id:     pavel,
    rating_overall: 5,
    rating_cat1:    5,   // komunikácia
    rating_cat2:    5,   // férové podmienky
    rating_cat3:    5,   // odporúčam
    comment:        'Skvelý zamestnávateľ, všetko jasné a vyplatené okamžite.',
    submitted_at:   ago(9),
    revealed_at:    ago(9),
    created_at:     ago(10),
  })

  console.log('    ✓ Booking B (cleared) — Lucia skladník, wallet credit €35.10')

  // ── C: Marek ↔ Pavel / Job1 — escrow_pending (needs funding) ─
  const appC = await insert('applications', {
    job_id:         job1,
    worker_user_id: marek,
    worker_id:      marek,
    status:         'accepted',
    message:        'Mám skúsenosti v kuchyni, môžem nastúpiť ihneď.',
    created_at:     ago(1),
  })

  const bookingC = await insert('bookings', {
    job_id:              job1,
    worker_user_id:      marek,
    poster_user_id:      pavel,
    agreed_amount_cents: 4800,   // 6h × €8
    service_fee_cents:   480,
    currency:            'EUR',
    status:              'escrow_pending',
    created_at:          ago(1),
  })
  const escrowC = await insert('escrow_transactions', {
    booking_id:               bookingC,
    stripe_payment_intent_id: 'pi_demo_CCCCCCCCCCCCCCCC',
    amount_cents:             4800,
    service_fee_cents:        480,
    currency:                 'EUR',
    state:                    'created',
    created_at:               ago(1),
  })
  await sb.from('bookings').update({ escrow_id: escrowC }).eq('id', bookingC)

  const convC = await insert('conversations', {
    job_id:     job1,
    booking_id: bookingC,
    type:       'direct',
    created_at: ago(1),
  })
  await sb.from('conversation_participants').insert([
    { conversation_id: convC, user_id: marek, unread_count: 0 },
    { conversation_id: convC, user_id: pavel, unread_count: 2 },
  ])
  await sb.from('messages').insert([
    { conversation_id: convC, sender_user_id: marek, message_type: 'text', content: 'Dobrý deň, rád by som nastúpil na brigádu.', created_at: ago(2) },
    { conversation_id: convC, sender_user_id: pavel, message_type: 'text', content: 'Vyzerá to dobre. Zasielam ti ponuku.', created_at: ago(1) },
    { conversation_id: convC, sender_user_id: null,  message_type: 'system', content: 'Pavel Sloboda prijal žiadosť Mareka Kováča.', created_at: ago(1) },
    { conversation_id: convC, sender_user_id: null,  message_type: 'system', content: 'Čaká sa na zaistenie escrow platby.', created_at: ago(1) },
  ])

  console.log('    ✓ Booking C (escrow_pending) — Marek kuchár, čaká na platbu')

  // ── Some pending applications (for W2 list & P4 hub) ─────────
  const pendingApps = [
    { job_id: jobIds[2], worker: lucia  },
    { job_id: jobIds[3], worker: lucia  },
    { job_id: jobIds[8], worker: marek  },
  ]
  for (const a of pendingApps) {
    await insert('applications', {
      job_id:         a.job_id,
      worker_user_id: a.worker,
      worker_id:      a.worker,
      status:         'pending',
      message:        'Záujem o brigádu, som k dispozícii.',
      created_at:     ago(1),
    })
  }
  console.log('    ✓ 3 pending applications seeded')
}

// ── Helper: insert + return id ────────────────────────────────
async function insert(table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await (sb.from(table) as any)
    .insert(row)
    .select('id')
    .single()
  if (error || !data) throw new Error(`Insert into ${table} failed: ${error?.message}`)
  return data.id as string
}

main().catch(e => { console.error('❌ ', e.message); process.exit(1) })
