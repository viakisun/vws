# RBAC 테이블 구조 설명

## 📋 테이블 관계도

```
employees (직원)
    ↓
employee_roles (직원-역할 매핑)
    ↓
roles (역할)
    ↓
role_permissions (역할-권한 매핑)
    ↓
permissions (권한)
```

## 🔍 테이블별 역할

### 1. `roles` (역할 테이블)

```sql
-- 역할 정의
id, code, name, name_ko, priority
```

- ADMIN, MANAGEMENT, RESEARCHER 등의 역할 정의
- 역할의 기본 정보만 저장

**예시:**
| code | name_ko | priority |
|------|---------|----------|
| ADMIN | 관리자 | 100 |
| RESEARCHER | 연구원 | 40 |

---

### 2. `permissions` (권한 테이블)

```sql
-- 권한 정의
id, code, resource, action, scope
```

- 실제 수행 가능한 작업(권한) 정의
- 예: `planner.products.read`, `hr.employees.write`

**예시:**
| code | resource | action |
|------|----------|--------|
| planner.products.read | planner.products | read |
| planner.products.write | planner.products | write |

---

### 3. `role_permissions` (역할-권한 매핑)

```sql
-- 역할에 권한 할당
role_id, permission_id
```

- **"이 역할은 이런 권한들을 가진다"**
- 역할(role)과 권한(permission)을 연결

**예시:**
| role_code | permission_code |
|-----------|-----------------|
| RESEARCHER | planner.products.read |
| RESEARCHER | planner.products.write |
| RESEARCHER | common.dashboard.read |

**의미:**

- 연구원(RESEARCHER) 역할은 플래너 제품을 읽고 쓸 수 있다

---

### 4. `employee_roles` (직원-역할 매핑)

```sql
-- 직원에게 역할 할당
employee_id, role_id
```

- **"이 직원은 이런 역할을 가진다"**
- 실제 직원(employee)과 역할(role)을 연결

**예시:**
| employee_id | role_code |
|-------------|-----------|
| emp_001 | RESEARCHER |
| emp_002 | ADMIN |

**의미:**

- emp_001 직원은 연구원(RESEARCHER) 역할을 가진다

---

## 🔗 전체 연결 흐름

```
직원 "김연구" (employee_id: emp_001)
    ↓ (employee_roles 테이블)
역할 "연구원" (RESEARCHER)
    ↓ (role_permissions 테이블)
권한들:
  - planner.products.read
  - planner.products.write
  - planner.initiatives.read
  - ... (총 21개)
```

## ⚙️ 권한 체크 흐름

사용자가 `/planner/products` 페이지에 접근할 때:

1. **직원 확인**: 현재 로그인한 사용자의 employee_id 확인
2. **역할 조회**: `employee_roles`에서 이 직원이 가진 역할들 조회
3. **권한 조회**: `role_permissions`에서 그 역할들이 가진 권한들 조회
4. **권한 검증**: `planner.products.read` 권한이 있는지 확인
5. **접근 허용/거부**: 있으면 허용, 없으면 거부

## 💡 핵심 차이점

| 테이블               | 연결 대상    | 목적                            | 예시                               |
| -------------------- | ------------ | ------------------------------- | ---------------------------------- |
| **role_permissions** | 역할 ↔ 권한 | 역할이 무엇을 할 수 있는지 정의 | "연구원은 플래너를 사용할 수 있다" |
| **employee_roles**   | 직원 ↔ 역할 | 직원이 어떤 역할인지 정의       | "김연구님은 연구원이다"            |

## 🎯 우리가 수정하는 것

현재 작업은 **`role_permissions`** 테이블을 수정하는 것입니다:

```sql
-- 연구원(RESEARCHER) 역할에 플래너 권한 추가
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'RESEARCHER'),  -- 역할: 연구원
  id
FROM permissions
WHERE resource LIKE 'planner.%';  -- 권한: 플래너 관련 모든 것
```

**의미:** "연구원이라는 역할은 플래너를 사용할 수 있다"

이렇게 설정하면, `employee_roles`에서 연구원 역할을 가진 모든 직원들이 자동으로 플래너 권한을 갖게 됩니다!

## 📊 현재 문제

`employee_roles`는 데이터가 있지만,
`role_permissions`에 플래너 권한 매핑이 없어서
연구원 역할을 가진 직원들이 플래너에 접근할 수 없는 상태입니다.

**해결:** `role_permissions`에 데이터 추가 필요!
