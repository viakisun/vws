-- Add assets management permissions to the database
-- This migration adds the necessary permissions for assets management functionality

-- Insert assets permissions
INSERT INTO permissions (code, resource, action, description) VALUES
('assets.read', 'assets', 'read', 'Read access to assets management'),
('assets.write', 'assets', 'write', 'Write access to assets management'),
('assets.approve', 'assets', 'approve', 'Approve asset requests and changes'),
('assets.delete', 'assets', 'delete', 'Delete assets and related data'),
('assets.physical.read', 'assets.physical', 'read', 'Read access to physical assets'),
('assets.physical.write', 'assets.physical', 'write', 'Write access to physical assets'),
('assets.physical.approve', 'assets.physical', 'approve', 'Approve physical asset requests'),
('assets.physical.delete', 'assets.physical', 'delete', 'Delete physical assets'),
('assets.ip.read', 'assets.ip', 'read', 'Read access to intellectual property'),
('assets.ip.write', 'assets.ip', 'write', 'Write access to intellectual property'),
('assets.ip.approve', 'assets.ip', 'approve', 'Approve IP asset requests'),
('assets.ip.delete', 'assets.ip', 'delete', 'Delete intellectual property'),
('assets.certifications.read', 'assets.certifications', 'read', 'Read access to certifications'),
('assets.certifications.write', 'assets.certifications', 'write', 'Write access to certifications'),
('assets.certifications.approve', 'assets.certifications', 'approve', 'Approve certification requests'),
('assets.certifications.delete', 'assets.certifications', 'delete', 'Delete certifications'),
('assets.requests.read', 'assets.requests', 'read', 'Read access to asset requests'),
('assets.requests.write', 'assets.requests', 'write', 'Write access to asset requests'),
('assets.requests.approve', 'assets.requests', 'approve', 'Approve asset requests'),
('assets.requests.delete', 'assets.requests', 'delete', 'Delete asset requests'),
('assets.audit.read', 'assets.audit', 'read', 'Read access to asset audits'),
('assets.audit.write', 'assets.audit', 'write', 'Write access to asset audits'),
('assets.audit.approve', 'assets.audit', 'approve', 'Approve asset audits'),
('assets.audit.delete', 'assets.audit', 'delete', 'Delete asset audits')
ON CONFLICT (code) DO NOTHING;

-- Add assets permissions to appropriate roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN' 
  AND p.resource LIKE 'assets%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Management gets read, write, approve permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'MANAGEMENT' 
  AND p.resource LIKE 'assets%'
  AND p.action IN ('read', 'write', 'approve')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR Manager gets read and approve permissions for requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'HR_MANAGER' 
  AND p.resource LIKE 'assets%'
  AND (p.action = 'read' OR (p.resource = 'assets.requests' AND p.action = 'approve'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance Manager gets read and approve permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'FINANCE_MANAGER' 
  AND p.resource LIKE 'assets%'
  AND p.action IN ('read', 'approve')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- All employees get read access to their own assets and can make requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'EMPLOYEE' 
  AND p.resource LIKE 'assets%'
  AND (p.action = 'read' OR (p.resource = 'assets.requests' AND p.action = 'write'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Researchers get read access and can make requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'RESEARCHER' 
  AND p.resource LIKE 'assets%'
  AND (p.action = 'read' OR (p.resource = 'assets.requests' AND p.action = 'write'))
ON CONFLICT (role_id, permission_id) DO NOTHING;
