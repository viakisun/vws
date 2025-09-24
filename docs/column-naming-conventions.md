# 컬럼 명명 규칙 (Column Naming Conventions)

## 📋 개요

이 문서는 프로젝트 전체에서 일관된 컬럼 명명 규칙을 정의합니다. 데이터베이스와 JavaScript/TypeScript
간의 데이터 변환 시 일관성을 보장하기 위한 가이드라인입니다.

## 🎯 명명 규칙

### 1. 데이터베이스 (PostgreSQL)

- **snake_case** 사용
- 모든 컬럼명은 소문자와 언더스코어(\_)로 구성
- 예시:
  ```sql
  start_date
  end_date
  manager_id
  budget_total
  created_at
  updated_at
  ```

### 2. JavaScript/TypeScript (프론트엔드 & API)

- **camelCase** 사용
- 첫 번째 단어는 소문자, 이후 단어의 첫 글자는 대문자
- 예시:
  ```typescript
  startDate
  endDate
  managerId
  budgetTotal
  createdAt
  updatedAt
  ```

## 🔄 데이터 변환 규칙

### API 응답 변환

- **데이터베이스 → API**: `snake_case` → `camelCase` 변환
- **API → 프론트엔드**: `camelCase` 유지

### 변환 예시

```typescript
// 데이터베이스 (snake_case)
{
  start_date: "2024-12-31T15:00:00.000Z",  // UTC 형식
  end_date: "2025-12-30T15:00:00.000Z",    // UTC 형식
  manager_id: "uuid-123",
  budget_total: 1000000
}

// API 응답 (camelCase + 사용자 타임존 변환)
{
  startDate: "2025-01-01",    // KST로 변환된 YYYY-MM-DD 형식
  endDate: "2025-12-31",      // KST로 변환된 YYYY-MM-DD 형식
  managerId: "uuid-123",
  budgetTotal: 1000000
}
```

## 🛠️ 구현 방법

### 공통 유틸리티 사용

모든 API 엔드포인트에서 `src/lib/utils/api-data-transformer.ts`의 변환 함수를 사용합니다:

```typescript
import {
  transformProjectData,
  transformArrayData,
  transformProjectMemberData,
} from '$lib/utils/api-data-transformer'

// 단일 객체 변환
const transformedProject = transformProjectData(project)

// 배열 변환
const transformedMembers = transformArrayData(members, transformProjectMemberData)
```

### 변환 함수 목록

- `transformProjectData()` - 프로젝트 데이터 (날짜 자동 변환)
- `transformProjectMemberData()` - 프로젝트 멤버 데이터 (날짜 자동 변환)
- `transformProjectBudgetData()` - 프로젝트 예산 데이터 (날짜 자동 변환)
- `transformMilestoneData()` - 마일스톤 데이터 (날짜 자동 변환)
- `transformRiskData()` - 리스크 데이터
- `transformEmployeeData()` - 직원 데이터 (날짜 자동 변환)
- `transformEvidenceItemData()` - 증빙 항목 데이터 (날짜 자동 변환)

### 날짜 변환 기능

모든 변환 함수는 자동으로 UTC 날짜를 사용자 타임존의 `YYYY-MM-DD` 형식으로 변환합니다:

- **입력**: `"2024-12-31T15:00:00.000Z"` (UTC)
- **출력**: `"2025-01-01"` (KST, YYYY-MM-DD 형식)

## 📝 적용된 API 엔드포인트

### ✅ 완료된 API

- `/api/project-management/projects` - 프로젝트 목록/생성
- `/api/project-management/projects/[id]` - 프로젝트 상세
- `/api/project-management/project-members` - 프로젝트 멤버
- `/api/project-management/project-budgets` - 프로젝트 예산

### 🔄 적용 예정 API

- `/api/project-management/employees` - 직원 관리
- `/api/project-management/evidence` - 증빙 관리
- `/api/project-management/milestones` - 마일스톤 관리
- `/api/project-management/risks` - 리스크 관리

## 🚫 금지사항

### ❌ 하지 말아야 할 것들

1. **혼재 사용**: 같은 API에서 snake_case와 camelCase를 혼재 사용
2. **수동 변환**: 변환 유틸리티 없이 수동으로 변환
3. **일관성 없는 명명**: 비슷한 데이터에 다른 명명 규칙 적용

### ✅ 해야 할 것들

1. **일관성 유지**: 모든 API에서 동일한 변환 규칙 적용
2. **유틸리티 사용**: 공통 변환 함수 사용
3. **문서화**: 새로운 변환 함수 추가 시 문서 업데이트

## 🔍 검증 방법

### 자동 검증

- 자동 검증 시스템이 API 응답 형식을 검증
- snake_case와 camelCase 혼재 사용 시 경고

### 수동 검증

```bash
# API 응답 확인
curl -s "http://localhost:5173/api/project-management/projects" | jq '.data[0]'

# 예상 결과: camelCase 형식
{
  "id": "uuid",
  "title": "Project Title",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "managerId": "uuid",
  "budgetTotal": 1000000
}
```

## 📚 참고 자료

- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [JavaScript Naming Conventions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Variables)
- [TypeScript Style Guide](https://typescript-eslint.io/rules/naming-convention/)

---

**마지막 업데이트**: 2025-09-19  
**버전**: 1.0.0  
**작성자**: AI Assistant
