-- =============================================
-- Migration 038: R&D Development Permissions
-- =============================================
-- Add permissions for R&D Development module
-- Date: 2025-01-13
-- =============================================

-- R&D Development 권한 추가
INSERT INTO permissions (code, resource, action, scope, description) VALUES
-- Projects
('rd_development.projects.read', 'rd_development.projects', 'read', 'all', 'R&D 개발 프로젝트 조회'),
('rd_development.projects.write', 'rd_development.projects', 'write', 'all', 'R&D 개발 프로젝트 생성/수정'),
('rd_development.projects.delete', 'rd_development.projects', 'delete', 'all', 'R&D 개발 프로젝트 삭제'),

-- Phases
('rd_development.phases.read', 'rd_development.phases', 'read', 'all', 'R&D 개발 단계 조회'),
('rd_development.phases.write', 'rd_development.phases', 'write', 'all', 'R&D 개발 단계 생성/수정'),
('rd_development.phases.delete', 'rd_development.phases', 'delete', 'all', 'R&D 개발 단계 삭제'),

-- Deliverables
('rd_development.deliverables.read', 'rd_development.deliverables', 'read', 'all', 'R&D 개발 산출물 조회'),
('rd_development.deliverables.write', 'rd_development.deliverables', 'write', 'all', 'R&D 개발 산출물 생성/수정'),
('rd_development.deliverables.delete', 'rd_development.deliverables', 'delete', 'all', 'R&D 개발 산출물 삭제'),

-- Institutions
('rd_development.institutions.read', 'rd_development.institutions', 'read', 'all', 'R&D 개발 참여기관 조회'),
('rd_development.institutions.write', 'rd_development.institutions', 'write', 'all', 'R&D 개발 참여기관 생성/수정'),
('rd_development.institutions.delete', 'rd_development.institutions', 'delete', 'all', 'R&D 개발 참여기관 삭제'),

-- VIA Roles
('rd_development.via_roles.read', 'rd_development.via_roles', 'read', 'all', 'R&D 개발 VIA 역할 조회'),
('rd_development.via_roles.write', 'rd_development.via_roles', 'write', 'all', 'R&D 개발 VIA 역할 생성/수정'),
('rd_development.via_roles.delete', 'rd_development.via_roles', 'delete', 'all', 'R&D 개발 VIA 역할 삭제'),

-- Technical Specs
('rd_development.technical_specs.read', 'rd_development.technical_specs', 'read', 'all', 'R&D 개발 기술사양 조회'),
('rd_development.technical_specs.write', 'rd_development.technical_specs', 'write', 'all', 'R&D 개발 기술사양 생성/수정'),
('rd_development.technical_specs.delete', 'rd_development.technical_specs', 'delete', 'all', 'R&D 개발 기술사양 삭제'),

-- Timeline & Milestones
('rd_development.timeline.read', 'rd_development.timeline', 'read', 'all', 'R&D 개발 타임라인 조회'),
('rd_development.timeline.write', 'rd_development.timeline', 'write', 'all', 'R&D 개발 타임라인 생성/수정'),
('rd_development.milestones.read', 'rd_development.milestones', 'read', 'all', 'R&D 개발 마일스톤 조회'),
('rd_development.milestones.write', 'rd_development.milestones', 'write', 'all', 'R&D 개발 마일스톤 생성/수정');

-- VIA 팀 멤버들에게 권한 부여 (RESEARCHER, DEVELOPER, MANAGEMENT 역할)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('RESEARCHER', 'DEVELOPER', 'MANAGEMENT')
AND p.resource LIKE 'rd_development.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 권한 부여 확인 쿼리 (참고용)
-- SELECT 
--   r.code as role_code,
--   r.name_ko as role_name,
--   COUNT(p.id) as permission_count
-- FROM roles r
-- INNER JOIN role_permissions rp ON r.id = rp.role_id
-- INNER JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.resource LIKE 'rd_development.%'
-- GROUP BY r.id, r.code, r.name_ko
-- ORDER BY r.code;
