# 프로젝트 시작일/종료일 계산 방식

## 배경

프로젝트의 `start_date`, `end_date` 컬럼을 `projects` 테이블에서 제거했습니다. 이는 다음과 같은 이유 때문입니다:

1. **중복 데이터 제거**: 사업 기간은 연차별 예산 데이터(`project_budgets`)에 이미 저장되어 있음
2. **데이터 일관성**: 연차별 예산이 변경될 때마다 프로젝트 날짜를 수동으로 업데이트해야 하는 번거로움 제거
3. **정확한 데이터**: 연차별 예산의 MIN/MAX를 사용하면 항상 정확한 사업 기간을 보장

## 해결 방법

### PostgreSQL View 사용 (✅ 현재 구현)

**`v_projects_with_dates` View**를 생성하여 중앙 집중식으로 관리합니다:

```sql
-- Migration 028: View 생성
CREATE VIEW v_projects_with_dates AS
SELECT
  p.*,
  (SELECT MIN(pb.start_date)
   FROM project_budgets pb
   WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date)
   FROM project_budgets pb
   WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;
```

**View 사용 예시:**

```sql
-- 모든 API에서 이렇게 사용
SELECT
  p.id, p.code, p.title,
  p.calculated_start_date::text as start_date,
  p.calculated_end_date::text as end_date,
  -- ... other fields
FROM v_projects_with_dates p
WHERE p.id = $1;
```

**성능 최적화:**

```sql
-- Migration 029: 인덱스 생성
CREATE INDEX idx_project_budgets_project_dates
ON project_budgets(project_id, start_date, end_date);
```

**장점:**

- ✅ **중앙 집중화**: 모든 API가 동일한 로직 사용
- ✅ **유지보수 용이**: View만 수정하면 모든 곳에 반영
- ✅ **성능 최적화**: 인덱스 활용으로 빠른 조회
- ✅ **데이터 일관성**: 항상 최신 데이터 보장
- ✅ **코드 간결화**: 복잡한 서브쿼리 제거

## 구현 위치

### API 엔드포인트

모든 연구개발사업 관련 API가 `v_projects_with_dates` View를 사용합니다:

1. **개별 프로젝트 조회**
   - 파일: `src/routes/api/research-development/projects/[id]/+server.ts`
   - 메서드: `GET`, `PUT`

2. **프로젝트 목록 조회**
   - 파일: `src/routes/api/research-development/projects/+server.ts`
   - 메서드: `GET`

3. **프로젝트 요약**
   - 파일: `src/routes/api/research-development/summary/+server.ts`
   - 메서드: `GET`

4. **프로젝트 알림**
   - 파일: `src/routes/api/research-development/alerts/+server.ts`
   - 메서드: `GET`

### 주요 변경사항

- ✅ `FROM projects p` → `FROM v_projects_with_dates p`
- ✅ 서브쿼리 제거 → `p.calculated_start_date`, `p.calculated_end_date` 사용
- ✅ `GROUP BY` 절에 `calculated_start_date`, `calculated_end_date` 추가
- ✅ 모든 API에서 동일한 로직 사용

## 마이그레이션

### 027: 컬럼 삭제

```sql
ALTER TABLE projects
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;
```

### 028: View 생성

```sql
CREATE VIEW v_projects_with_dates AS
SELECT
  p.*,
  (SELECT MIN(pb.start_date) FROM project_budgets pb WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date) FROM project_budgets pb WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;
```

### 029: 인덱스 추가

```sql
CREATE INDEX idx_project_budgets_project_dates
ON project_budgets(project_id, start_date, end_date);
```

## 성능 고려사항

- **인덱스**: `idx_project_budgets_project_dates` 복합 인덱스로 MIN/MAX 연산 최적화
- **캐싱**: 프론트엔드에서 적절한 캐싱 전략 사용
- **View 물리화**: 필요시 `MATERIALIZED VIEW`로 전환 가능 (현재는 일반 View로 충분)

## 실행 스크립트

```bash
# View 생성
npx tsx scripts/run-project-view-migration.ts

# 인덱스 생성
npx tsx scripts/run-index-migration.ts
```

## 결론

이 접근 방식은:

- ✅ 데이터 중복을 제거하고
- ✅ 데이터 일관성을 보장하며
- ✅ 유지보수를 간소화하고
- ✅ 성능을 최적화합니다

연차별 예산 데이터(`project_budgets`)가 프로젝트 기간의 **Single Source of Truth**가 되어, 더욱 안정적이고 확장 가능한 시스템을 구축할 수 있습니다.

**모든 `start_date`/`end_date` 관련 로직이 View에 중앙 집중화되어, 향후 변경 시 한 곳만 수정하면 됩니다!** 🎉
