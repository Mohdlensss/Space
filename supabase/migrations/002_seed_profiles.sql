-- DOO Team Member Seeds
-- These are pre-populated so profiles are auto-provisioned on first login

INSERT INTO profile_seeds (email, full_name, role, department, reports_to_email) VALUES
  -- Leadership
  ('ali@doo.ooo', 'Ali Mohsen', 'CEO, Co-founder', 'Leadership', NULL),
  ('mohamed@doo.ooo', 'Mohamed Alkhabbaz', 'COO, Co-founder', 'Leadership', NULL),
  ('hh@doo.ooo', 'Hussain Haji', 'Chief Growth Officer', 'Leadership', NULL),
  
  -- Finance & Legal (report to COO)
  ('nawaf@doo.ooo', 'Nawaf Haffadh', 'Finance Analyst', 'Finance', 'mohamed@doo.ooo'),
  ('faisal@doo.ooo', 'Faisal Khamdan', 'Legal & Compliance Officer', 'Legal', 'mohamed@doo.ooo'),
  
  -- Product Engineering (report to CEO)
  ('yusuf@doo.ooo', 'Yusuf Alhamad', 'Product Engineering Lead', 'Product Engineering', 'ali@doo.ooo'),
  ('eyad@doo.ooo', 'Eyad Ahmed', 'Senior Product Engineer', 'Product Engineering', 'yusuf@doo.ooo'),
  ('ali.h@doo.ooo', 'Ali Ali', 'Product Engineer', 'Product Engineering', 'yusuf@doo.ooo'),
  ('naser@doo.ooo', 'Naser Almeel', 'Product Engineer', 'Product Engineering', 'yusuf@doo.ooo'),
  ('hadeel@doo.ooo', 'Hadeel Rafea', 'Product Engineer', 'Product Engineering', 'yusuf@doo.ooo'),
  
  -- AI Success (report to CEO)
  ('ahmedh@doo.ooo', 'Ahmed Haffadh', 'AI Success Lead', 'AI Success', 'ali@doo.ooo'),
  ('qabas@doo.ooo', 'Qabas Al Hasni', 'AI Success Engineer', 'AI Success', 'ahmedh@doo.ooo'),
  ('alsabbagh@doo.ooo', 'Ahmed Alsabbagh', 'AI Success Officer', 'AI Success', 'ahmedh@doo.ooo'),
  ('a.a@doo.ooo', 'Ahmed Aldakheel', 'AI Success Officer', 'AI Success', 'ahmedh@doo.ooo'),
  ('ahmeda@doo.ooo', 'Ahmed Alhamad', 'Technical Consultant', 'AI Success', 'ahmedh@doo.ooo'),
  
  -- BD & Marketing (report to CGO)
  ('at@doo.ooo', 'Ali AlToblani', 'Regional BD Director', 'Business Development', 'hh@doo.ooo'),
  ('ghazwan@doo.ooo', 'Mohammed Ghazwan', 'BD Lead', 'Business Development', 'at@doo.ooo'),
  ('mustafa@doo.ooo', 'Mustafa Hesham', 'BD Officer', 'Business Development', 'ghazwan@doo.ooo'),
  ('mohammed.alnoaimi@doo.ooo', 'Mohammed Alnoaimi', 'Delivery Integration Lead', 'Business Development', 'hh@doo.ooo'),
  
  -- Marketing (report to CGO)
  ('noor@doo.ooo', 'Noor Ali', 'Marketing Officer', 'Marketing', 'hh@doo.ooo'),
  ('hesham@doo.ooo', 'Hesham Alshoala', 'VP Digital Growth', 'Marketing', 'hh@doo.ooo')

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to_email = EXCLUDED.reports_to_email;


