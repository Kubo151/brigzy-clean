-- Brigzy Test Data - Jobs
-- Run this in Supabase SQL Editor to create test jobs

-- First, let's create a test employer user (if not exists)
-- You'll need to replace 'your-employer-user-id' with an actual user ID from your auth.users table

-- Insert test jobs
INSERT INTO jobs (
  id,
  title,
  description,
  company_name,
  location,
  pay_type,
  pay_amount,
  duration,
  category,
  employer_id,
  applicants_count,
  requires_introduction,
  created_at
) VALUES
-- Job 1: Barista (Urgentné)
(
  gen_random_uuid(),
  'Barista for Weekend',
  'Urban Brew Coffee is looking for an experienced barista to work weekends. Must have latte art skills and customer service experience.',
  'Urban Brew Coffee',
  'Downtown, NYC',
  'hourly',
  18,
  'Weekends only',
  'hospitality',
  (SELECT id FROM auth.users LIMIT 1), -- Replace with actual employer ID
  12,
  false,
  NOW() - INTERVAL '2 hours'
),

-- Job 2: Event Setup Crew
(
  gen_random_uuid(),
  'Event Setup Crew',
  'Elite Events Co needs reliable crew members for event setup and breakdown. Physical work required.',
  'Elite Events Co',
  'Manhattan, NYC',
  'hourly',
  22,
  '3-4 days',
  'events',
  (SELECT id FROM auth.users LIMIT 1),
  8,
  false,
  NOW() - INTERVAL '5 hours'
),

-- Job 3: Retail Sales Associate
(
  gen_random_uuid(),
  'Retail Sales Associate',
  'Fashion boutique seeking friendly sales associate for part-time position. Retail experience preferred.',
  'Style & Co Boutique',
  'SoHo, NYC',
  'hourly',
  16,
  'Part-time',
  'retail',
  (SELECT id FROM auth.users LIMIT 1),
  15,
  true,
  NOW() - INTERVAL '1 day'
),

-- Job 4: Delivery Driver
(
  gen_random_uuid(),
  'Delivery Driver',
  'Fast-paced delivery service needs drivers with own vehicle. Flexible hours, good pay.',
  'QuickDeliver NYC',
  'Brooklyn, NYC',
  'hourly',
  20,
  'Flexible',
  'delivery',
  (SELECT id FROM auth.users LIMIT 1),
  25,
  false,
  NOW() - INTERVAL '3 hours'
),

-- Job 5: House Cleaning
(
  gen_random_uuid(),
  'House Cleaning Specialist',
  'Professional cleaning service looking for detail-oriented cleaners. Training provided.',
  'Sparkle Clean Services',
  'Upper East Side, NYC',
  'hourly',
  19,
  '2-3 days/week',
  'cleaning',
  (SELECT id FROM auth.users LIMIT 1),
  6,
  false,
  NOW() - INTERVAL '6 hours'
),

-- Job 6: Construction Helper
(
  gen_random_uuid(),
  'Construction Helper',
  'Construction company needs helpers for residential project. No experience required, will train.',
  'BuildRight Construction',
  'Queens, NYC',
  'hourly',
  25,
  '2 weeks',
  'construction',
  (SELECT id FROM auth.users LIMIT 1),
  10,
  false,
  NOW() - INTERVAL '4 hours'
),

-- Job 7: Moving Assistant
(
  gen_random_uuid(),
  'Moving Assistant',
  'Moving company needs strong, reliable assistants. Must be able to lift heavy items.',
  'NYC Movers Pro',
  'Bronx, NYC',
  'hourly',
  21,
  'As needed',
  'moving',
  (SELECT id FROM auth.users LIMIT 1),
  18,
  false,
  NOW() - INTERVAL '8 hours'
),

-- Job 8: Office Admin
(
  gen_random_uuid(),
  'Office Administrator',
  'Small business needs part-time office admin for filing, phones, and general office tasks.',
  'TechStart Inc',
  'Midtown, NYC',
  'hourly',
  17,
  'Part-time',
  'admin',
  (SELECT id FROM auth.users LIMIT 1),
  9,
  true,
  NOW() - INTERVAL '12 hours'
);

-- Verify the jobs were created
SELECT 
  title,
  company_name,
  location,
  pay_amount,
  category,
  applicants_count
FROM jobs
ORDER BY created_at DESC
LIMIT 10;
