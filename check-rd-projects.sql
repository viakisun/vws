-- R&D 개발 프로젝트 확인 쿼리

-- 1. 모든 rd_dev_projects 확인
SELECT 
    rdp.id,
    p.code,
    p.title,
    rdp.project_type,
    p.status
FROM rd_dev_projects rdp
JOIN projects p ON rdp.project_id = p.id
ORDER BY rdp.created_at DESC
LIMIT 10;

-- 2. 특정 ID 확인
SELECT 
    rdp.*,
    p.*
FROM rd_dev_projects rdp
JOIN projects p ON rdp.project_id = p.id
WHERE rdp.id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- 3. phases 확인
SELECT * FROM rd_dev_phases WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- 4. deliverables 확인
SELECT * FROM rd_dev_deliverables WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

-- 5. institutions 확인
SELECT * FROM rd_dev_institutions WHERE project_id = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6';

