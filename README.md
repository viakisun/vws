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
