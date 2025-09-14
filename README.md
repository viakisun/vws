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

### 자동화된 체크
- **Git 커밋 시**: 기본 빌드 체크만 수행 (간소화됨)
- **VS Code 저장 시**: 자동 포맷팅 및 오류 표시
- **빌드 전**: 자동 TypeScript 및 린터 체크

### 현재 상태
- 🚧 **개발 중**: 많은 TypeScript 오류가 있어 일시적으로 체크 규칙을 간소화했습니다
- 📋 **향후 계획**: 타입 정의 통합 및 오류 수정 후 전체 체크 규칙 복원 예정

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
1) Create ECR repo `workstream-svelte` in `ap-northeast-2`.
2) Configure OIDC/GitHub in AWS and set repo secrets:
   - `AWS_ROLE_TO_ASSUME`: ARN for GitHub OIDC role
   - `ECS_EXEC_ROLE_ARN`: ECS execution role ARN
   - `ECS_TASK_ROLE_ARN`: ECS task role ARN
3) Build & push image:
   - Run GitHub Action `Push to ECR` (ecr.yml)
4) Deploy to ECS:
   - Ensure `ECS_CLUSTER`/`ECS_SERVICE` in `ecs-deploy.yml`
   - Run GitHub Action `ECS Deploy`
