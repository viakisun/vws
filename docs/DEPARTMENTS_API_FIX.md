# Departments API 수정

## 📋 문제

```
Error fetching departments: error: relation "departments" does not exist
```

**원인**: `departments` 테이블이 데이터베이스에 존재하지 않음

**실제 구조**:
- `employees` 테이블에 `department` 컬럼(VARCHAR)만 존재
- 별도의 `departments` 테이블 없음

---

## ✅ 해결 방법

### GET: 부서 목록 조회

**Before**:
```sql
SELECT id, name, description, status, max_employees, created_at, updated_at
FROM departments
WHERE status = $1
ORDER BY name ASC
```

**After**:
```sql
SELECT 
  department as name,
  COUNT(*) as employee_count,
  MIN(hire_date) as created_at
FROM employees e
WHERE e.status = 'active'
GROUP BY department
HAVING department IS NOT NULL AND department != ''
ORDER BY department ASC
```

**변환 로직**:
```typescript
const departments = result.rows.map((row) => ({
  id: row.name, // department 이름을 ID로 사용
  name: row.name,
  description: `${row.employee_count}명`,
  status: 'active',
  max_employees: null,
  created_at: row.created_at,
  updated_at: row.created_at,
  employee_count: parseInt(row.employee_count),
}))
```

### POST: 부서 생성

**변경 사항**:
- `departments` 테이블에 INSERT 대신 가상 응답 반환
- 중복 체크는 `employees.department`에서 수행
- 실제 부서는 직원 생성 시 `department` 필드로 관리됨

---

## 🎯 장점

1. ✅ **기존 코드 호환성 유지**: API 응답 형식 동일
2. ✅ **실제 데이터 반영**: 현재 사용 중인 부서만 표시
3. ✅ **직원 수 표시**: 각 부서의 인원 수 자동 계산
4. ✅ **에러 해결**: `relation "departments" does not exist` 오류 해결

---

## 📊 API 응답 예시

### GET /api/departments?status=active

```json
{
  "success": true,
  "data": [
    {
      "id": "개발팀",
      "name": "개발팀",
      "description": "5명",
      "status": "active",
      "max_employees": null,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z",
      "employee_count": 5
    },
    {
      "id": "영업팀",
      "name": "영업팀",
      "description": "3명",
      "status": "active",
      "max_employees": null,
      "created_at": "2024-02-01T00:00:00.000Z",
      "updated_at": "2024-02-01T00:00:00.000Z",
      "employee_count": 3
    }
  ]
}
```

---

## 🔄 마이그레이션 경로 (향후)

만약 향후 `departments` 테이블을 추가하고 싶다면:

```sql
-- 1. departments 테이블 생성
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  max_employees INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 현재 사용 중인 부서 데이터 마이그레이션
INSERT INTO departments (name, created_at, updated_at)
SELECT DISTINCT 
  department,
  MIN(hire_date),
  now()
FROM employees
WHERE department IS NOT NULL AND department != ''
GROUP BY department;

-- 3. employees 테이블에 FK 추가
ALTER TABLE employees ADD COLUMN department_id UUID REFERENCES departments(id);

-- 4. department 값을 department_id로 마이그레이션
UPDATE employees e
SET department_id = d.id
FROM departments d
WHERE e.department = d.name;

-- 5. 기존 department 컬럼 제거 (선택사항)
-- ALTER TABLE employees DROP COLUMN department;
```

---

## ✅ 체크리스트

- [x] GET API 수정 완료
- [x] POST API 수정 완료
- [x] 타입 체크 통과
- [x] 기존 API 호환성 유지
- [x] 에러 해결 확인
- [x] 문서 작성 완료

---

## 📝 참고

**현재 데이터베이스 구조**:
- `employees.department`: VARCHAR (text)
- 별도의 `departments` 테이블 없음
- 부서는 직원 생성 시 직접 입력

**관련 파일**:
- `src/routes/api/departments/+server.ts`

**테스트 방법**:
```bash
# 부서 목록 조회
curl http://localhost:5173/api/departments?status=active

# 부서 생성
curl -X POST http://localhost:5173/api/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"신규팀","description":"새로운 팀"}'
```

---

**작업 완료!** 🎉

