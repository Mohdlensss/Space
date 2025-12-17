-- DOO Team Seeds - Final Locked Version
-- This is the single source of truth for team members

-- First, ensure profiles table has all necessary columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reports_to_profile_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS focus_areas TEXT[],
ADD COLUMN IF NOT EXISTS is_leadership BOOLEAN DEFAULT FALSE;

-- Leadership
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, is_leadership, created_at, updated_at)
VALUES
  -- CEO (no reports_to)
  ('00000000-0000-0000-0000-000000000001', 'ali@doo.ooo', 'Ali Mohsen', 'CEO & Co-Founder', 'Leadership', NULL, true, true, NOW(), NOW()),
  -- COO (reports to CEO in practice, but both are co-founders)
  ('00000000-0000-0000-0000-000000000002', 'mohamed@doo.ooo', 'Mohamed Alkhabbaz', 'COO & Co-Founder', 'Leadership', NULL, true, true, NOW(), NOW()),
  -- CGO
  ('00000000-0000-0000-0000-000000000003', 'hh@doo.ooo', 'Hussain Haji', 'Chief Growth Officer', 'Leadership', NULL, true, true, NOW(), NOW()),
  -- VP Digital Growth (reports to CGO)
  ('00000000-0000-0000-0000-000000000004', 'hesham@doo.ooo', 'Hesham Alshoala', 'VP of Digital Growth', 'Growth', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  is_leadership = EXCLUDED.is_leadership,
  updated_at = NOW();

-- Update is_leadership for existing leadership
UPDATE profiles SET is_leadership = true WHERE role IN ('CEO & Co-Founder', 'COO & Co-Founder', 'Chief Growth Officer', 'VP of Digital Growth', 'Regional Director of Business Development');

-- Operations (report to COO)
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'nawaf@doo.ooo', 'Nawaf Haffadh', 'Finance Analyst', 'Operations', (SELECT id FROM profiles WHERE email = 'mohamed@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'faisal@doo.ooo', 'Faisal Khamdan', 'Legal & Compliance Officer', 'Operations', (SELECT id FROM profiles WHERE email = 'mohamed@doo.ooo'), true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  updated_at = NOW();

-- Product Engineering (report to CEO)
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'yusuf@doo.ooo', 'Yusuf Alhamad', 'Product Engineering Lead', 'Product Engineering', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000021', 'eyad@doo.ooo', 'Eyad Ahmed', 'Senior Product Engineer', 'Product Engineering', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000022', 'ali.h@doo.ooo', 'Ali Ali', 'Product Engineer', 'Product Engineering', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000023', 'naser@doo.ooo', 'Naser Almeel', 'Product Engineer', 'Product Engineering', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000024', 'hadeel@doo.ooo', 'Hadeel Rafea', 'Product Engineer', 'Product Engineering', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  updated_at = NOW();

-- AI Success / Technical (report structure TBD, defaulting to CEO for now)
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'ahmedh@doo.ooo', 'Ahmed Haffadh', 'AI Success Lead', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000031', 'qabas@doo.ooo', 'Qabas Al Hasni', 'AI Success Engineer', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000032', 'alsabbagh@doo.ooo', 'Ahmed Alsabbagh', 'AI Success Officer', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000033', 'a.a@doo.ooo', 'Ahmed Aldakheel', 'AI Success Officer', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000034', 'ahmeda@doo.ooo', 'Ahmed Alhamad', 'Technical Consultant', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  updated_at = NOW();

-- Business Development & Marketing (report to CGO)
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000040', 'at@doo.ooo', 'Ali AlToblani', 'Regional Director of Business Development', 'Business Development', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000041', 'ghazwan@doo.ooo', 'Mohammed Ghazwan', 'Business Development Lead', 'Business Development', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000042', 'mustafa@doo.ooo', 'Mustafa Hesham', 'Business Development Officer', 'Business Development', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000043', 'mohammed.alnoaimi@doo.ooo', 'Mohammed Alnoaimi', 'Delivery Integration Lead', 'Business Development', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000044', 'noor@doo.ooo', 'Noor Ali', 'Marketing Officer', 'Marketing', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  updated_at = NOW();

-- New additions (lock emails now)
INSERT INTO profiles (id, email, full_name, role, department, reports_to_profile_id, is_onboarded, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000050', 'salman@doo.ooo', 'Salman', 'Strategy & Operations', 'Operations', (SELECT id FROM profiles WHERE email = 'mohamed@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000051', 'zainab@doo.ooo', 'Zainab', 'AI Success & Operations', 'AI Success', (SELECT id FROM profiles WHERE email = 'ali@doo.ooo'), true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000052', 'mahmood@doo.ooo', 'Mahmood AlHubaish', 'Business Development Lead', 'Business Development', (SELECT id FROM profiles WHERE email = 'hh@doo.ooo'), true, NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_profile_id = EXCLUDED.reports_to_profile_id,
  updated_at = NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reports_to ON profiles(reports_to_profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

