# Workstream Enterprise Management Platform (SvelteKit)

## Setup

1. Node 20+
2. Install deps:

```bash
npm ci
```

3. Copy env:

```bash
cp env.example .env
```

## Scripts

- dev: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- check: `npm run check`
- test: `npm run test`

## 오류 체크 및 코드 품질

- **빠른 체크**: `npm run check:quick` - TypeScript + 빌드 체크
- **상세 체크**: `npm run check:errors` - 모든 오류 상세 분석
- **전체 체크**: `npm run check:all` - 오류 + TypeScript + 빌드 + 린터
- **개발 중**: `npm run check:watch` - 파일 변경 시 자동 체크

### 코드 작성 후 필수 체크

```bash
# 코드 작성 후 즉시 실행
npm run check:quick

# 문제가 있을 때 상세 분석
npm run check:errors
```

### 타이트한 코드 품질 관리 시스템

#### 🔒 **Pre-commit Hook (강화됨)**

- TypeScript 타입 체크 (오류 0개 허용)
- ESLint 코드 품질 체크 (오류 0개, 경고 10개 이하)
- 빌드 테스트 (120초 이내)
- 보안 취약점 체크
- 의존성 무결성 체크

#### 🚀 **CI/CD 파이프라인**

- **코드 품질 체크**: TypeScript, ESLint, 빌드, 테스트
- **성능 테스트**: 번들 크기 체크
- **보안 스캔**: npm audit, CodeQL 분석
- **배포 준비**: 프로덕션 빌드 및 아티팩트 업로드

#### 📊 **품질 게이트**

- TypeScript 오류: **0개 허용**
- ESLint 오류: **0개 허용**
- ESLint 경고: **10개 이하**
- 테스트 커버리지: **80% 이상**
- 보안 취약점: **0개 허용**
- 빌드 시간: **120초 이내**

#### 🛠 **개발 도구**

- **ESLint**: 100+ 규칙으로 엄격한 코드 품질 관리
- **Prettier**: 일관된 코드 포맷팅
- **TypeScript**: Strict 모드 + 추가 엄격 옵션
- **VS Code**: 자동 포맷팅, 린팅, 타입 체크

### 📋 **사용 가능한 명령어**

```bash
# 기본 체크
npm run check          # TypeScript 타입 체크
npm run lint           # ESLint 체크
npm run lint:strict    # ESLint 엄격 체크 (경고도 오류로 처리)
npm run build          # 빌드 테스트

# 품질 관리
npm run quality:gate   # 품질 게이트 실행
npm run quality:full   # 전체 품질 체크
npm run ci             # CI 파이프라인 시뮬레이션

# 자동 수정
npm run lint:fix       # ESLint 자동 수정
npm run format         # Prettier 포맷팅
npm run security:fix   # 보안 취약점 자동 수정

# 상세 분석
npm run check:errors   # 상세 오류 리포트
npm run security:audit # 보안 취약점 분석
```

### ⚠️ **현재 상태**

- 🔴 **667개 문제 발견**: TypeScript 오류 332개, ESLint 경고 335개
- 🎯 **목표**: 모든 문제를 0개로 줄이기
- 🚀 **다음 단계**: 타입 정의 통합 및 Svelte 5 마이그레이션 완료

## 🏗️ Architecture

### Project Management Module

대규모 컴포넌트를 계층화된 서비스, 비즈니스 로직, 데이터 변환 계층으로 분리했습니다.

**구조:**

```
Component (2,709 lines)
    ↓
Services (540 lines, 21 APIs)
    ↓
Business Logic (93 lines, 3 functions)
    ↓
Data Transformers (281 lines, 13 functions)
    ↓
Database
```

**주요 구성요소:**

- **Service Layer**: 21개 API 호출을 5개 서비스로 캡슐화
- **Business Logic**: 도메인 계산 로직 (기간 계산, 예산 계산 등)
- **Data Transformers**: API ↔ UI 데이터 변환, 타입 안전성 보장

**자세한 내용**: [프로젝트 관리 아키텍처 문서](./docs/project-management-architecture.md)

### Utilities

```typescript
// Service Layer (21 APIs)
import * as projectService from '$lib/services/project-management/project.service'
import * as memberService from '$lib/services/project-management/member.service'
import * as budgetService from '$lib/services/project-management/budget.service'
import * as evidenceService from '$lib/services/project-management/evidence.service'
import * as validationService from '$lib/services/project-management/validation.service'

// Business Logic (3 functions)
import * as calculationUtils from '$lib/components/project-management/utils/calculationUtils'
// - calculatePeriodMonths(startDate, endDate): 기간(개월) 계산
// - calculateMemberBudget(member, months): 멤버 예산 계산
// - calculateTotalBudget(categories): 총 예산 계산

// Data Transformers (13 functions)
import * as dataTransformers from '$lib/components/project-management/utils/dataTransformers'
// - safeStringToNumber(), safeNumberToString(): 안전한 타입 변환
// - extractCashAmount(), extractInKindAmount(): 필드 추출
// - calculateMemberContribution(): 멤버 기여금 계산
// - distributeMemberAmount(): 현금/현물 자동 분배
// - transformBudgetToCategories(): 예산 → 카테고리 변환
// - extractApiData(), extractApiArrayData(): API 응답 추출
// - groupIssuesByMember(): Validation issue 그룹화
```

**테스트:**

- Unit Tests: 53/53 passing (100%)
- Coverage: dataTransformers.ts (90%+)

## Tech

- SvelteKit 2, Svelte 5, TypeScript
- Tailwind CSS 4
- Vitest

## Env

- `API_BASE_URL` default `http://localhost:3000/api`
- `LOG_LEVEL` one of `debug|info|warn|error`

## Deploy

- Node:

```bash
npm run build
node build/index.js
```

- Adapter can be switched in `svelte.config.js`

## AWS ECS/ECR Deploy (template)

1. Create ECR repo `workstream-svelte` in `ap-northeast-2`.
2. Configure OIDC/GitHub in AWS and set repo secrets:
   - `AWS_ROLE_TO_ASSUME`: ARN for GitHub OIDC role
   - `ECS_EXEC_ROLE_ARN`: ECS execution role ARN
   - `ECS_TASK_ROLE_ARN`: ECS task role ARN
3. Build & push image:
   - Run GitHub Action `Push to ECR` (ecr.yml)
4. Deploy to ECS:
   - Ensure `ECS_CLUSTER`/`ECS_SERVICE` in `ecs-deploy.yml`
   - Run GitHub Action `ECS Deploy`
