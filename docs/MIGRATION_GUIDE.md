# DatabaseService → Domain Services 마이그레이션 가이드

## 개요

`DatabaseService` 클래스가 제거되고 각 도메인별 서비스로 분리되었습니다.
이 가이드는 기존 코드를 새 아키텍처로 마이그레이션하는 방법을 설명합니다.

## 변경 사항

### Before (Old)
```typescript
import { DatabaseService } from '$lib/database/connection'

// Company 작업
const companies = await DatabaseService.getCompanies({ limit: 10 })
const company = await DatabaseService.createCompany(data)

// Project 작업
const projects = await DatabaseService.getProjects({ status: 'active' })

// Employee 작업
const employees = await DatabaseService.getEmployees({ department: 'IT' })

// Transaction 작업
const transactions = await DatabaseService.getTransactions({ type: 'income' })
```

### After (New)
```typescript
import { companyService } from '$lib/services/company/company-service'
import { projectService } from '$lib/services/project/project-service'
import { employeeService } from '$lib/services/employee/employee-service'
import { transactionService } from '$lib/services/transaction/transaction-service'

// Company 작업
const companies = await companyService.list({ limit: 10 })
const company = await companyService.create(data)

// Project 작업
const projects = await projectService.list({ status: 'active' })

// Employee 작업
const employees = await employeeService.list({ department: 'IT' })

// Transaction 작업
const transactions = await transactionService.list({ type: 'income' })
```

## 메서드 매핑

### Company

| Old | New |
|-----|-----|
| `DatabaseService.createCompany(data)` | `companyService.create(data)` |
| `DatabaseService.getCompanyById(id)` | `companyService.getById(id)` |
| `DatabaseService.getCompanies(filters)` | `companyService.list(filters)` |
| N/A | `companyService.getByName(name)` ✨ 신규 |
| N/A | `companyService.update(id, data)` ✨ 신규 |
| N/A | `companyService.delete(id)` ✨ 신규 |

### Project

| Old | New |
|-----|-----|
| `DatabaseService.createProject(data)` | `projectService.create(data)` |
| `DatabaseService.getProjectById(id)` | `projectService.getById(id)` |
| `DatabaseService.getProjects(filters)` | `projectService.list(filters)` |
| N/A | `projectService.getByCode(code)` ✨ 신규 |
| N/A | `projectService.update(id, data)` ✨ 신규 |
| N/A | `projectService.delete(id)` ✨ 신규 |

### Employee

| Old | New |
|-----|-----|
| `DatabaseService.createEmployee(data)` | `employeeService.create(data)` |
| `DatabaseService.getEmployeeById(id)` | `employeeService.getById(id)` |
| `DatabaseService.getEmployees(filters)` | `employeeService.list(filters)` |
| N/A | `employeeService.getByEmployeeId(employeeId)` ✨ 신규 |
| N/A | `employeeService.update(id, data)` ✨ 신규 |
| N/A | `employeeService.delete(id)` ✨ 신규 |
| N/A | `employeeService.terminate(id)` ✨ 신규 |

### Transaction

| Old | New |
|-----|-----|
| `DatabaseService.createTransaction(data)` | `transactionService.create(data)` |
| `DatabaseService.getTransactionById(id)` | `transactionService.getById(id)` |
| `DatabaseService.getTransactions(filters)` | `transactionService.list(filters)` |
| N/A | `transactionService.update(id, data)` ✨ 신규 |
| N/A | `transactionService.delete(id)` ✨ 신규 |
| N/A | `transactionService.getAccountSummary(accountId)` ✨ 신규 |

## 단계별 마이그레이션

### 1단계: Import 변경

```typescript
// ❌ Before
import { DatabaseService } from '$lib/database/connection'

// ✅ After
import { companyService } from '$lib/services/company/company-service'
```

### 2단계: 메서드 호출 변경

```typescript
// ❌ Before
const company = await DatabaseService.createCompany({
  name: '회사명',
  type: 'startup'
})

// ✅ After
const company = await companyService.create({
  name: '회사명',
  business_type: 'startup'  // 필드명도 변경됨
})
```

### 3단계: 에러 핸들링 (변경 없음)

```typescript
try {
  const company = await companyService.create(data)
} catch (error) {
  logger.error('Failed to create company:', error)
  throw error
}
```

## 주의사항

### 1. 필드명 변경

Company 관련 필드명이 변경되었습니다:

| Old | New |
|-----|-----|
| `type` | `business_type` |
| `industry` | 제거됨 |
| `status` | 제거됨 |
| `contact_person` | 제거됨 |
| `revenue` | 제거됨 |
| `employees` | 제거됨 |
| `notes` | 제거됨 |
| `tags` | 제거됨 |
| N/A | `establishment_date` 추가 |
| N/A | `ceo_name` 추가 |
| N/A | `fax` 추가 |
| N/A | `registration_number` 추가 |

### 2. 타입 안전성

새 서비스는 더 강력한 타입 체킹을 제공합니다:

```typescript
// DTO 타입을 사용하여 타입 안전성 보장
import type { CreateCompanyDto } from '$lib/services/company/company-service'

const dto: CreateCompanyDto = {
  name: '회사명',
  business_type: 'IT서비스업',  // 자동완성 지원
  // ... 다른 필드들
}

await companyService.create(dto)
```

### 3. 날짜 처리

모든 날짜 필드는 `::text`로 캐스팅되어 문자열로 반환됩니다:

```typescript
const company = await companyService.getById(id)
console.log(company.created_at)  // "2025-10-11 18:30:00+09" (string)
```

## 마이그레이션 체크리스트

각 파일마다:

- [ ] `DatabaseService` import 제거
- [ ] 해당 도메인 서비스 import 추가
- [ ] `DatabaseService.method()` → `service.method()` 변경
- [ ] 메서드명 변경 적용 (create/list/getById/...)
- [ ] 필드명 변경 확인 (특히 Company)
- [ ] 테스트 실행 및 확인
- [ ] TypeScript 에러 해결
- [ ] Linter 에러 해결

## 도움이 필요한 경우

1. **아키텍처 가이드**: `docs/ARCHITECTURE.md`
2. **서비스 코드 예제**: `src/lib/services/company/company-service.ts`
3. **마이그레이션 예제**: `src/routes/api/companies/+server.ts`

## 추가 리소스

- 각 서비스는 JSDoc 주석으로 완전히 문서화되어 있습니다
- TypeScript 타입으로 자동완성 지원
- 모든 메서드는 에러 로깅 포함

## FAQ

**Q: 왜 DatabaseService를 제거했나요?**
A: 관심사의 분리(Separation of Concerns)를 위해서입니다. connection.ts는 순수 DB 연결 관리만 담당해야 합니다.

**Q: 기존 DatabaseService를 계속 사용할 수 있나요?**
A: 잠시 동안은 가능하지만 deprecated되었으며, 새로운 기능은 추가되지 않습니다.

**Q: 점진적 마이그레이션이 가능한가요?**
A: 네, 각 파일을 독립적으로 마이그레이션할 수 있습니다.

**Q: 새 메서드는 어디에 추가하나요?**
A: 해당 도메인의 서비스 클래스에 추가하세요. 예: `CompanyService`에 새 메서드 추가

**Q: expense_items나 다른 테이블은요?**
A: 필요시 새 서비스를 만드세요. 예: `src/lib/services/expense/expense-service.ts`

