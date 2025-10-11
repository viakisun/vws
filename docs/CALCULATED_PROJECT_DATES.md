# 프로젝트 시작일/종료일 계산 방식

## 배경

프로젝트의 `start_date`, `end_date` 컬럼을 `projects` 테이블에서 제거했습니다. 이는 다음과 같은 이유 때문입니다:

1. **중복 데이터 제거**: 사업 기간은 연차별 예산 데이터(`rd_project_budgets`)에 이미 저장되어 있음
2. **데이터 일관성**: 연차별 예산이 변경될 때마다 프로젝트 날짜를 수동으로 업데이트해야 하는 번거로움 제거
3. **정확한 데이터**: 연차별 예산의 MIN/MAX를 사용하면 항상 정확한 사업 기간을 보장

## 해결 방법

### 1. SQL 서브쿼리를 통한 동적 계산 (권장)

프로젝트 조회 시 연차별 예산 테이블에서 MIN/MAX를 실시간으로 계산합니다:

```sql
SELECT 
  p.*,
  -- 연차별 예산에서 시작일/종료일 계산
  (SELECT MIN(pb.start_date)::text 
   FROM rd_project_budgets pb 
   WHERE pb.project_id = p.id) as start_date,
  (SELECT MAX(pb.end_date)::text 
   FROM rd_project_budgets pb 
   WHERE pb.project_id = p.id) as end_date
FROM projects p
WHERE p.id = $1;
```

**장점:**
- 항상 최신 데이터 보장
- 추가적인 업데이트 로직 불필요
- `::text` 캐스팅을 정확히 제어 가능

**단점:**
- 서브쿼리로 인한 약간의 성능 오버헤드 (일반적으로 무시할 수 있는 수준)

### 2. PostgreSQL View 사용 (대안)

View를 생성하여 계산 로직을 재사용할 수 있습니다:

```sql
CREATE VIEW v_projects_with_dates AS
SELECT 
  p.*,
  (SELECT MIN(pb.start_date) 
   FROM rd_project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_start_date,
  (SELECT MAX(pb.end_date) 
   FROM rd_project_budgets pb 
   WHERE pb.project_id = p.id) AS calculated_end_date
FROM projects p;
```

**참고**: 현재는 View를 사용하지 않고, API 쿼리에서 직접 계산하는 방식을 채택했습니다.

## 구현 위치

### API 엔드포인트

1. **개별 프로젝트 조회**
   - 파일: `src/routes/api/research-development/projects/[id]/+server.ts`
   - 메서드: `GET`

2. **프로젝트 목록 조회**
   - 파일: `src/routes/api/research-development/projects/+server.ts`
   - 메서드: `GET`

### 주요 변경사항

- `GROUP BY` 절에서 `start_date`, `end_date` 제거
- `COUNT(pm.id)` → `COUNT(DISTINCT pm.id)`로 변경 (중복 집계 방지)
- `startDateFrom`, `startDateTo` 필터링 제거 (필요시 CTE로 구현 가능)

## 성능 고려사항

- **인덱스**: `rd_project_budgets(project_id, start_date, end_date)` 복합 인덱스 권장
- **캐싱**: 프론트엔드에서 적절한 캐싱 전략 사용
- **최적화**: 대량 데이터 조회 시 JOIN 대신 서브쿼리가 더 효율적일 수 있음

## 마이그레이션

- **027**: `start_date`, `end_date` 컬럼 삭제
- **028** (optional): View 생성 (현재는 사용하지 않음)

## 결론

이 접근 방식은:
- ✅ 데이터 중복을 제거하고
- ✅ 데이터 일관성을 보장하며
- ✅ 유지보수를 간소화합니다

연차별 예산 데이터가 프로젝트 기간의 **Single Source of Truth**가 되어, 더욱 안정적이고 확장 가능한 시스템을 구축할 수 있습니다.

