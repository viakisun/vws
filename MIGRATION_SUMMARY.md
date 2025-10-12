# RD Personnel Data Migration Summary

## Migration Date

$(date +"%Y-%m-%d %H:%M:%S")

## Overview

Successfully migrated research development project member data and personnel cost evidence for 6 projects.

## Database Changes

### 1. Schema Migration (031_add_evidence_personnel_fields.sql)

Added three new fields to `evidence_items` table:

- `employee_id` (uuid, FK to employees): Links evidence to specific employee
- `project_member_id` (uuid, FK to project_members): Links evidence to project member record
- `evidence_month` (date): Target month for the evidence (YYYY-MM-01 format)

### 2. Data Migration Results

#### Project Members Inserted: 53

Distribution by project:

- PROJ_2024_003 (국방-무기체계): 22 members
- PROJ_2024_002 (캠틱-AI솔루션): 2 members
- PROJ_2025_001 (스마트팜-과채류): 7 members
- PROJ_2025_002 (스마트팜-추종형): 3 members
- PROJ_2025_003 (침수안전): 7 members
- PROJ_2025_004 (A-SW): 12 members

#### Personnel Cost Evidence Inserted: 165

Distribution by project:

- PROJ_2024_003 (국방-무기체계): 114 evidence items
- PROJ_2024_002 (캠틱-AI솔루션): 6 evidence items
- PROJ_2025_001 (스마트팜-과채류): 30 evidence items
- PROJ_2025_002 (스마트팜-추종형): 12 evidence items
- PROJ_2025_004 (A-SW): 3 evidence items
- PROJ_2025_003 (침수안전): 0 evidence items (no budgets found for 2025-05~09)

#### Skipped Items: 37

Reason: No matching project_budgets found for specific months

## Key Features

### Member Data Includes:

- Participation rate (%)
- Start and end dates
- Monthly payment amounts
- Funding type (in-kind vs cash)
- Cash and in-kind amount split

### Evidence Data Includes:

- Monthly personnel cost records (up to 2025-09)
- Automatic evidence naming: "{Name} {Year}년 {Month}월 인건비"
- Links to both employee and project member records
- Status set to 'completed' with 100% progress

## Files Modified/Created

### New Files:

1. `migrations/031_add_evidence_personnel_fields.sql` - Schema migration
2. `scripts/migrate-rd-personnel-data.ts` - Data migration script

### Modified Files:

1. `package.json` - Added `db:migrate:personnel` script
2. `src/lib/utils/schema-validation.ts` - Added validation rules for new fields

## Execution Command

\`\`\`bash
npm run db:migrate:personnel
\`\`\`

## Verification Queries

### Check member counts:

\`\`\`sql
SELECT p.code, COUNT(DISTINCT pm.id) as member*count
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
WHERE p.code LIKE 'PROJ*%'
GROUP BY p.code;
\`\`\`

### Check evidence counts:

\`\`\`sql
SELECT p.code, COUNT(DISTINCT ei.id) as evidence*count
FROM projects p
LEFT JOIN project_budgets pb ON p.id = pb.project_id
LEFT JOIN evidence_items ei ON pb.id = ei.project_budget_id
WHERE p.code LIKE 'PROJ*%'
AND ei.category_id = (SELECT id FROM evidence_categories WHERE name = '인건비')
GROUP BY p.code;
\`\`\`

### Sample evidence data:

\`\`\`sql
SELECT ei.name, ei.evidence_month, ei.spent_amount,
CASE
WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$'
THEN e.last_name || e.first_name
ELSE e.first_name || ' ' || e.last_name
END as employee
FROM evidence_items ei
LEFT JOIN employees e ON ei.employee_id = e.id
WHERE ei.category_id = (SELECT id FROM evidence_categories WHERE name = '인건비')
ORDER BY ei.evidence_month DESC, ei.name
LIMIT 10;
\`\`\`

## Notes

- Evidence data only includes records up to 2025-09 as specified
- Some evidence items were skipped due to missing project_budgets
- Korean name formatting is correctly handled (LastNameFirstName)
- All data is linked properly through foreign keys
