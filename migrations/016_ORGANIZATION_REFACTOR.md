# 016: 조직 구조 리팩토링

## 목적
`employees.manager_id` 컬럼을 제거하고 조직 구조를 별도 관계 테이블로 분리하여 유연한 조직 관리 구현

## 배경
### 기존 구조의 문제점
1. **1:1 관계 제약**: 한 명의 직원이 한 명의 매니저만 가질 수 있음
2. **히스토리 부재**: 과거 조직 변경 이력 추적 불가
3. **다중 소속 불가**: 겸직, 매트릭스 조직 등 표현 불가
4. **조직도 혼동**: 조직 구조와 보고 라인이 혼재됨

### 새로운 구조의 장점
1. ✅ 조직 변경 이력 완벽 추적 (start_date, end_date)
2. ✅ 다중 소속 가능 (겸직, 프로젝트 조직)
3. ✅ 조직도와 보고 라인 분리 관리
4. ✅ 부서별 계층 구조 지원
5. ✅ 시간 기준 조직도 재구성 가능

## 변경 사항

### 새로 생성되는 테이블

#### 1. `departments` - 부서/조직 정보
```sql
- id: UUID (PK)
- code: VARCHAR(50) UNIQUE - 부서 코드
- name: VARCHAR(100) - 부서명
- parent_id: UUID - 상위 부서
- level: INTEGER - 조직 레벨 (1: 본부, 2: 팀 등)
- description: TEXT
- is_active: BOOLEAN
```

#### 2. `employee_departments` - 직원-부서 관계
```sql
- id: UUID (PK)
- employee_id: UUID (FK)
- department_id: UUID (FK)
- role: VARCHAR(100) - 팀장, 팀원 등
- is_primary: BOOLEAN - 주 소속 여부
- start_date: DATE - 소속 시작일
- end_date: DATE - 소속 종료일 (NULL = 현재 소속)
```

**특징:**
- 한 직원이 여러 부서에 소속 가능 (겸직)
- `end_date IS NULL`인 레코드가 현재 소속
- 이력 관리로 과거 조직 변경 추적 가능

#### 3. `reporting_lines` - 보고 라인
```sql
- id: UUID (PK)
- employee_id: UUID (FK) - 보고하는 직원
- manager_id: UUID (FK) - 보고받는 매니저
- report_type: VARCHAR(50) - direct, dotted, functional
- start_date: DATE
- end_date: DATE (NULL = 현재 보고 관계)
```

**특징:**
- 조직도와 독립적인 보고 관계 관리
- 매트릭스 조직의 복수 보고 라인 지원
- 보고 유형 구분 (직접, 점선, 기능별)

### 제거되는 컬럼
- ❌ `employees.manager_id` - `reporting_lines` 테이블로 대체

### 생성되는 뷰

#### `v_employee_current_department`
직원의 현재 부서 정보 조회
```sql
SELECT * FROM v_employee_current_department WHERE employee_id = '...';
```

#### `v_employee_current_manager`
직원의 현재 보고 라인 조회
```sql
SELECT * FROM v_employee_current_manager WHERE employee_id = '...';
```

### 생성되는 함수

#### `get_department_tree(root_dept_id)`
부서 트리 구조를 재귀적으로 조회
```sql
SELECT * FROM get_department_tree(); -- 전체 조직도
SELECT * FROM get_department_tree('dept-uuid'); -- 특정 부서 하위
```

## 데이터 마이그레이션

### 1. 부서 생성
- `employees.department` 값에서 중복 제거하여 `departments` 생성
- 코드는 자동 생성 (한글/영문/숫자만 유지)

### 2. 직원-부서 관계 생성
- 모든 직원을 현재 부서에 매핑
- `hire_date`를 `start_date`로 사용
- 모두 주 소속(`is_primary = true`)으로 설정

### 3. 보고 라인 생성
- 기존 `manager_id`를 `reporting_lines`로 이전
- 모두 직접 보고(`report_type = 'direct'`)로 설정

### 4. 기존 컬럼 제거
- `employees.manager_id` DROP

## 실행 방법

```bash
# 1. 마이그레이션 실행
psql $DATABASE_URL -f migrations/016_organization_structure.sql

# 2. 결과 확인
psql $DATABASE_URL -c "SELECT * FROM departments ORDER BY name;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM employee_departments WHERE end_date IS NULL;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM reporting_lines WHERE end_date IS NULL;"

# 3. 뷰 테스트
psql $DATABASE_URL -c "SELECT * FROM v_employee_current_department LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM get_department_tree();"
```

## 롤백 방법

```sql
-- 1. 테이블 제거
DROP VIEW IF EXISTS v_employee_current_manager CASCADE;
DROP VIEW IF EXISTS v_employee_current_department CASCADE;
DROP FUNCTION IF EXISTS get_department_tree CASCADE;
DROP TABLE IF EXISTS reporting_lines CASCADE;
DROP TABLE IF EXISTS employee_departments CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 2. manager_id 컬럼 복원
ALTER TABLE employees ADD COLUMN manager_id UUID REFERENCES employees(id);

-- 3. 기존 데이터 복원 (백업이 있는 경우)
-- ... 백업에서 복원
```

## 코드 변경 필요 사항

### API 수정 필요
1. **직원 조회 API** - manager_id 대신 v_employee_current_manager 사용
2. **조직도 API** - 새로운 departments 테이블 사용
3. **직원 등록/수정 API** - employee_departments, reporting_lines 사용

### 예시 쿼리 변경

**Before:**
```sql
SELECT e.*, m.first_name || ' ' || m.last_name as manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
```

**After:**
```sql
SELECT e.*, vcm.manager_name
FROM employees e
LEFT JOIN v_employee_current_manager vcm ON e.id = vcm.employee_id
```

## 주의사항

1. **트랜잭션 필수**: 전체 마이그레이션을 한 트랜잭션으로 실행
2. **백업 필수**: 실행 전 반드시 DB 백업
3. **다운타임 고려**: 컬럼 DROP 시 기존 쿼리 오류 발생 가능
4. **점진적 적용**: 테이블 생성 → 코드 수정 → 컬럼 제거 순서 권장

## 향후 확장 가능성

1. **부서별 권한 관리**: departments와 RBAC 연동
2. **조직 개편 시뮬레이션**: end_date를 미래로 설정하여 예정된 개편 관리
3. **비용센터 연동**: departments에 비용센터 정보 추가
4. **임시 조직**: 프로젝트 조직, TF팀 등을 기간 한정으로 관리

## 테스트 시나리오

### 1. 다중 소속 테스트
```sql
-- 개발팀 + AI팀 겸직
INSERT INTO employee_departments (employee_id, department_id, role, is_primary)
VALUES 
  ('emp-uuid', 'dev-dept-uuid', '팀원', true),
  ('emp-uuid', 'ai-dept-uuid', '연구원', false);
```

### 2. 보고 라인 변경 테스트
```sql
-- 기존 보고 라인 종료
UPDATE reporting_lines 
SET end_date = CURRENT_DATE 
WHERE employee_id = 'emp-uuid' AND end_date IS NULL;

-- 새 보고 라인 추가
INSERT INTO reporting_lines (employee_id, manager_id, report_type)
VALUES ('emp-uuid', 'new-manager-uuid', 'direct');
```

### 3. 조직도 조회 테스트
```sql
-- 전체 조직도
SELECT * FROM get_department_tree();

-- 특정 직원의 현재 소속
SELECT * FROM v_employee_current_department WHERE employee_id = 'emp-uuid';

-- 특정 매니저의 부하 직원들
SELECT e.first_name, e.last_name 
FROM v_employee_current_manager vcm
JOIN employees e ON vcm.employee_id = e.id
WHERE vcm.manager_id = 'manager-uuid';
```

## 성공 기준

- [x] departments 테이블 생성 및 데이터 마이그레이션
- [x] employee_departments 테이블 생성 및 관계 설정
- [x] reporting_lines 테이블 생성 및 보고 라인 이전
- [x] employees.manager_id 컬럼 제거
- [x] 뷰 및 함수 생성
- [ ] API 코드 수정 및 테스트
- [ ] 프론트엔드 조직도 UI 업데이트

## 관련 이슈
- 조직 구조 유연성 개선
- 이력 관리 기능 추가
- 매트릭스 조직 지원
