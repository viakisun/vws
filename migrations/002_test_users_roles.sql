-- =============================================
-- 테스트 사용자 생성 및 역할 할당
-- =============================================

-- 1. 테스트 사용자 생성 (비밀번호: Test123!)
INSERT INTO users (email, password_hash, name, role, department, position, is_active)
VALUES
  ('finance.manager@viasofts.com', '$2b$10$YourHashedPasswordHere', '김재무', 'FINANCE', '재무팀', '팀장', true),
  ('hr.manager@viasofts.com', '$2b$10$YourHashedPasswordHere', '이인사', 'HR', '인사팀', '팀장', true),
  ('researcher1@viasofts.com', '$2b$10$YourHashedPasswordHere', '박연구', 'EMPLOYEE', '연구소', '선임연구원', true),
  ('sales.manager@viasofts.com', '$2b$10$YourHashedPasswordHere', '최영업', 'EMPLOYEE', '영업팀', '팀장', true),
  ('admin.staff@viasofts.com', '$2b$10$YourHashedPasswordHere', '정행정', 'EMPLOYEE', '경영지원팀', '사원', true)
ON CONFLICT (email) DO NOTHING;

-- 2. 기존 사용자에게 새로운 역할 할당

-- 기선 박: HR_MANAGER 역할 할당
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'kisun@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'HR_MANAGER')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'kisun@viasofts.com')
ON CONFLICT DO NOTHING;

-- admin@viasofts.com: ADMIN 역할 확인 및 할당
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'admin@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'ADMIN')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@viasofts.com')
ON CONFLICT DO NOTHING;

-- 3. 새로 생성한 사용자들에게 역할 할당

-- 김재무: FINANCE_MANAGER
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'finance.manager@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'FINANCE_MANAGER')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'finance.manager@viasofts.com')
ON CONFLICT DO NOTHING;

-- 이인사: HR_MANAGER
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'hr.manager@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'HR_MANAGER')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'hr.manager@viasofts.com')
ON CONFLICT DO NOTHING;

-- 박연구: RESEARCHER
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'researcher1@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'RESEARCHER')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'researcher1@viasofts.com')
ON CONFLICT DO NOTHING;

-- 최영업: SALES
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'sales.manager@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'SALES')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sales.manager@viasofts.com')
ON CONFLICT DO NOTHING;

-- 정행정: ADMINISTRATOR
INSERT INTO user_roles (user_id, role_id)
SELECT
  (SELECT id FROM users WHERE email = 'admin.staff@viasofts.com'),
  (SELECT id FROM roles WHERE code = 'ADMINISTRATOR')
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin.staff@viasofts.com')
ON CONFLICT DO NOTHING;

-- 4. 권한 캐시 클리어 (새로운 권한 반영을 위해)
DELETE FROM permission_cache;

-- 5. 확인 쿼리
SELECT
  u.email,
  u.name,
  r.code as role_code,
  r.name_ko as role_name
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = true
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY u.email;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '테스트 사용자 및 역할 할당 완료';
  RAISE NOTICE '- 김재무: FINANCE_MANAGER (재무관리자)';
  RAISE NOTICE '- 이인사: HR_MANAGER (인사관리자)';
  RAISE NOTICE '- 박연구: RESEARCHER (연구원)';
  RAISE NOTICE '- 최영업: SALES (영업)';
  RAISE NOTICE '- 정행정: ADMINISTRATOR (행정원)';
  RAISE NOTICE '- 기선 박: HR_MANAGER (인사관리자)';
  RAISE NOTICE '- admin: ADMIN (관리자)';
END $$;