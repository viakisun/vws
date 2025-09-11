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
