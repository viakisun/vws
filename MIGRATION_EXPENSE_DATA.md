# 증빙 카테고리 코드 시스템 및 세부 집행 내역 마이그레이션

## 개요

이 문서는 증빙 관리 시스템의 리팩토링 및 데이터 마이그레이션 절차를 설명합니다.

### 주요 변경사항

1. **증빙 카테고리 코드 시스템** - UUID 참조에서 코드 기반 enum 시스템으로 전환
2. **거래처 정보 연동** - `sales_customers` 테이블과 증빙 아이템 연결
3. **세부 집행 내역 추가** - 6개 사업의 재료비, 연구활동비 등 비인건비 증빙 데이터 추가
4. **SELECT \* 패턴 제거** - 모든 API 쿼리에서 필드를 명시적으로 지정

---

## 실행 순서

### 1단계: 데이터베이스 스키마 마이그레이션

```bash
# PostgreSQL에 접속
psql postgresql://postgres:viahubdev@db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com:5432/postgres

# 마이그레이션 실행
\i migrations/032_add_evidence_category_codes.sql
\i migrations/033_add_evidence_item_vendor_details.sql
```

**변경 내역:**

- `evidence_categories` 테이블에 `code`, `parent_code`, `display_order`, `is_active` 컬럼 추가
- `evidence_items` 테이블에 `vendor_id`, `vendor_name`, `item_detail`, `tax_amount`, `payment_date`, `notes` 컬럼 추가
- 금액 컬럼 타입을 `DECIMAL`에서 `BIGINT`로 변경
- 필요한 인덱스 및 외래키 제약 추가

### 2단계: 거래처 데이터 마이그레이션

```bash
npm run db:migrate:vendors
```

**생성되는 거래처:**

- 무기체계: (주)디클래스, (주)스페이스케이, 스카에이어, 라보테, 두거리 우신탕, 하늘천
- 스마트팜: 엔티렉스, 디스플레이스먼트, 사이더스, 에어플레이
- 침수안전: MK 솔루션, 이티컴퍼니, 디큐브랩, 바른컴퓨터, 스카이에어
- AI 솔루션: 전주밥상다잡수소, 육희당, 하늘천숫불갈비

### 3단계: 세부 집행 내역 마이그레이션

```bash
npm run db:migrate:expenses
```

**처리 내역:**

- 기존 비인건비 증빙 삭제 (카테고리 코드 1로 시작하지 않는 항목)
- 6개 사업의 증빙 항목 생성:
  - 무기체계 개조개발: 13개 항목
  - 스마트팜(작업자추종): 6개 항목
  - 스마트팜(적심적과): 4개 항목
  - 침수안전산업: 24개 항목
  - AI 솔루션 실증 지원: 6개 항목

---

## 데이터 구조

### 증빙 카테고리 코드 체계

```
1000번대: 인건비
  - 1001: 인건비

2000번대: 재료비
  - 2001: 연구재료비
  - 2002: 재료비
  - 2003: 시제품제작경비

3000번대: 연구활동비
  - 3001: 연구활동비
  - 3002: 연구용역비
  - 3003: 국내여비
  - 3005: 회의비
  - 3006: 업무추진비

9000번대: 간접비
  - 9001: 간접비
```

### 프로젝트 매핑

```typescript
const PROJECT_MAPPING = {
  '무기체계 개조개발': 'PROJ_2024_003',
  '스마트팜(작업자추종)': 'PROJ_2025_002',
  '스마트팜(적심적과)': 'PROJ_2025_001',
  침수안전산업: 'PROJ_2025_003',
  'AI 솔루션 실증 지원': 'PROJ_2024_002',
}
```

---

## 검증 쿼리

### 거래처별 거래 합계

```sql
SELECT
  sc.name as vendor_name,
  COUNT(ei.id) as transaction_count,
  SUM(ei.spent_amount) as total_amount
FROM evidence_items ei
JOIN sales_customers sc ON ei.vendor_id = sc.id
GROUP BY sc.name
ORDER BY total_amount DESC;
```

### 카테고리별 증빙 수 및 금액

```sql
SELECT
  ec.code,
  ec.name,
  COUNT(ei.id) as item_count,
  SUM(ei.spent_amount) as total_spent
FROM evidence_categories ec
LEFT JOIN evidence_items ei ON ec.id = ei.category_id
WHERE ec.code NOT LIKE '1%'
GROUP BY ec.code, ec.name
ORDER BY ec.display_order;
```

### 프로젝트별 비인건비 증빙 합계

```sql
SELECT
  p.code,
  p.title,
  ec.name as category_name,
  COUNT(ei.id) as item_count,
  SUM(ei.spent_amount) as total_spent
FROM projects p
JOIN project_budgets pb ON p.id = pb.project_id
JOIN evidence_items ei ON pb.id = ei.project_budget_id
JOIN evidence_categories ec ON ei.category_id = ec.id
WHERE ec.code NOT LIKE '1%'
GROUP BY p.code, p.title, ec.name
ORDER BY p.code, ec.name;
```

---

## 파일 목록

### 마이그레이션 파일

- `migrations/032_add_evidence_category_codes.sql`
- `migrations/033_add_evidence_item_vendor_details.sql`

### 스크립트 파일

- `scripts/migrate-rd-vendors.ts`
- `scripts/migrate-rd-expense-data.ts`

### TypeScript 파일

- `src/lib/constants/evidence-category-codes.ts` - 카테고리 코드 enum 정의
- `src/lib/utils/evidence-category-utils.ts` - 카테고리 유틸리티 함수
- `src/lib/services/research-development/evidence.service.ts` - 확장된 타입 정의

### API 파일

- `src/routes/api/research-development/evidence-categories/+server.ts` - 업데이트됨
- `src/routes/api/research-development/evidence/+server.ts` - 업데이트됨

### 기타

- `src/lib/utils/schema-validation.ts` - 스키마 검증 규칙 추가
- `package.json` - 마이그레이션 스크립트 추가

---

## 주의사항

1. **백업**: 마이그레이션 실행 전 반드시 데이터베이스 백업을 수행하세요.
2. **순서**: 반드시 위의 실행 순서를 따르세요 (스키마 → 거래처 → 증빙 데이터).
3. **인건비 데이터**: 이 마이그레이션은 인건비 증빙 데이터를 건드리지 않습니다.
4. **비인건비 증빙**: 기존 비인건비 증빙 데이터는 자동으로 삭제됩니다.

---

## 트러블슈팅

### 문제: 마이그레이션 실패

**원인**: 제약 조건 충돌 또는 데이터 타입 불일치

**해결**:

```sql
-- 외래키 제약 확인
SELECT conname FROM pg_constraint WHERE conname LIKE '%evidence%';

-- 컬럼 타입 확인
\d evidence_items
\d evidence_categories
```

### 문제: 거래처가 중복 생성됨

**원인**: `ON CONFLICT` 절이 제대로 작동하지 않음

**해결**:

```sql
-- 중복 거래처 확인
SELECT name, COUNT(*)
FROM sales_customers
GROUP BY name
HAVING COUNT(*) > 1;
```

### 문제: 증빙 데이터가 생성되지 않음

**원인**: 프로젝트 또는 예산 정보를 찾을 수 없음

**해결**:

```sql
-- 프로젝트 확인
SELECT code, title FROM projects WHERE code LIKE 'PROJ_%';

-- 예산 확인
SELECT p.code, pb.period_number
FROM projects p
JOIN project_budgets pb ON p.id = pb.project_id;
```

---

## 참고

- 모든 금액은 원 단위로 저장됩니다.
- 날짜 필드는 `::text`로 명시적 캐스팅됩니다.
- 집계 함수 사용 시 `DISTINCT`를 사용하여 중복 카운팅을 방지합니다.
