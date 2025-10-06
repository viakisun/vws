# 🚀 VWS CI/CD Pipeline

## 📋 Overview

**하나의 통합 파이프라인**으로 테스트부터 배포까지 자동화되었습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Push (main)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: 📝 Code Quality                                    │
│  - Format check, Lint, Type check                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┼────────┐
                ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 🧪 Unit │ │ 🔗 Intg │ │ 🎨 Comp │ │ 🔒 Sec  │
│  Tests  │ │  Tests  │ │  Tests  │ │  Audit  │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     └───────────┴───────────┴───────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ 🎭 E2E Tests     │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ 🏗️ Build         │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ ⚡ Performance   │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ 🐳 Docker Push   │  ← main 브랜치만
        │    to ECR        │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ 🚀 Deploy to EC2 │  ← main 브랜치만
        │  ws.viahub.dev   │
        └────────┬─────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ 📢 Slack Notify  │
        └─────────────────┘
```

## 🎯 Pipeline Stages

### Stage 1-6: Testing & Quality (모든 브랜치)

- **Quality**: 코드 포맷, 린트, 타입 체크
- **Unit Tests**: 빠른 유닛 테스트 (DB 없음)
- **Integration Tests**: PostgreSQL 연동 테스트
- **Component Tests**: Svelte 컴포넌트 테스트
- **E2E Tests**: Playwright 브라우저 테스트
- **Security**: npm audit 보안 검사

### Stage 7-8: Build & Performance (모든 브랜치)

- **Build**: SvelteKit 프로덕션 빌드
- **Performance**: Lighthouse CI 성능 측정

### Stage 9-10: Deploy (main 브랜치만)

- **Docker Push**: AWS ECR에 이미지 푸시
- **EC2 Deploy**: 자동 배포 및 헬스체크

### Stage 11-12: Status & Notifications

- **Final Status**: 전체 결과 요약
- **Slack Notify**: 성공/실패 알림

## 🔧 Configuration

### Required GitHub Secrets

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>

# EC2 SSH
EC2_HOST=<your-ec2-host>
EC2_USER=<ec2-username>
EC2_SSH_KEY=<private-ssh-key>

# Optional: Slack
SLACK_WEBHOOK_URL=<slack-webhook-url>
```

### Workflow File

**Single file**: `.github/workflows/ci-cd.yml`

- ✅ **Clean**: 하나의 파일로 전체 관리
- ✅ **Clear**: 단계별로 명확한 구조
- ✅ **Complete**: 테스트부터 배포까지 완전 자동화

## 🚦 Trigger Conditions

### Push/PR to main or develop

```yaml
on:
  push:
    branches: ['main', 'develop']
  pull_request:
    branches: ['main', 'develop']
```

**실행 범위**:

- ✅ Stages 1-8: Testing, Build, Performance
- ❌ Stages 9-10: Deploy (실행 안 함)

### Push to main (Auto Deploy)

```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

**실행 범위**:

- ✅ Stages 1-10: 모든 스테이지 + 자동 배포
- ✅ Docker 이미지 ECR 푸시
- ✅ EC2 자동 배포

### Manual Trigger

```yaml
on:
  workflow_dispatch:
```

**실행 방법**:

1. GitHub Actions 탭 이동
2. "ci" workflow 선택
3. "Run workflow" 버튼 클릭

## ⏱️ Estimated Duration

| Stage             | Duration      | Parallel |
| ----------------- | ------------- | -------- |
| Quality           | 2-3 min       | -        |
| Unit Tests        | 1-2 min       | ✅       |
| Integration Tests | 3-5 min       | ✅       |
| Component Tests   | 2-3 min       | ✅       |
| Security          | 1-2 min       | ✅       |
| E2E Tests         | 5-10 min      | -        |
| Build             | 3-5 min       | -        |
| Performance       | 2-3 min       | -        |
| Docker Push       | 3-5 min       | -        |
| EC2 Deploy        | 2-3 min       | -        |
| **Total**         | **15-25 min** |          |

## 🎭 Local Testing

테스트를 로컬에서 실행하려면:

```bash
# 1. Unit Tests
pnpm test:unit

# 2. Integration Tests (PostgreSQL 필요)
pnpm test:integration

# 3. Component Tests
pnpm test:component

# 4. E2E Tests (Playwright)
pnpm test:e2e

# 5. All Tests
pnpm test

# 6. Coverage Report
pnpm test:coverage
```

## 📊 Artifacts

파이프라인이 생성하는 아티팩트:

| Artifact               | Description              | Retention |
| ---------------------- | ------------------------ | --------- |
| `unit-coverage`        | 유닛 테스트 커버리지     | 30 days   |
| `integration-coverage` | 통합 테스트 커버리지     | 30 days   |
| `component-coverage`   | 컴포넌트 테스트 커버리지 | 30 days   |
| `playwright-report`    | E2E 테스트 리포트        | 30 days   |
| `playwright-videos`    | E2E 실패 시 비디오       | 7 days    |
| `build`                | 빌드 결과물              | 7 days    |
| `lighthouse-reports`   | 성능 측정 결과           | 7 days    |

## 🐳 Docker Deployment

### ECR Image Tags

```bash
# Latest (항상 최신)
<account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/vws-app:latest

# Commit SHA (특정 버전)
<account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/vws-app:<commit-sha>
```

### EC2 Container

```bash
# Container name: vws-app
# Port: 3000
# Restart policy: unless-stopped
# Environment: NODE_ENV=production
```

## 🔍 Monitoring

### GitHub Actions UI

1. **Repository → Actions 탭**
2. 최근 workflow run 확인
3. 각 stage 클릭하여 로그 확인

### Slack Notifications

- ✅ CI/CD 완료 시: `#vws_action`
- 🚀 배포 완료 시: `#vws_action`
- ❌ 실패 시: `#vws_action`

### EC2 Health Check

```bash
# Pipeline이 자동으로 수행
curl -I https://ws.viahub.dev/project-management?tab=projects

# 예상 응답: HTTP 200 or 302
```

## 🆘 Troubleshooting

### Pipeline 실패 시

1. **Quality Stage 실패**

   ```bash
   # Local check
   pnpm format:check
   pnpm lint:svelte
   pnpm check:typescript
   ```

2. **Tests 실패**

   ```bash
   # Run specific test
   pnpm test:unit
   pnpm test:integration
   ```

3. **Build 실패**

   ```bash
   # Local build
   pnpm build
   ```

4. **Docker Push 실패**
   - AWS credentials 확인
   - ECR 권한 확인

5. **Deploy 실패**
   - EC2 SSH key 확인
   - EC2 인스턴스 상태 확인
   - Docker 설치 확인

### 로그 확인

```bash
# GitHub Actions에서
1. Failed stage 클릭
2. 로그 펼쳐보기
3. 에러 메시지 확인

# EC2에서
ssh ec2-user@<ec2-host>
docker logs vws-app
sudo tail -f /var/log/nginx/error.log
```

## 📈 Best Practices

1. **Commit 전 로컬 테스트**

   ```bash
   pnpm test
   pnpm build
   ```

2. **PR 먼저 생성**
   - `develop` 브랜치로 PR
   - CI 통과 확인 후 merge

3. **main 브랜치 보호**
   - Direct push 금지
   - PR review 필수
   - CI 통과 필수

4. **실패 시 즉시 대응**
   - Slack 알림 확인
   - 로그 분석
   - 빠른 hotfix

## 🎯 Success Criteria

Pipeline이 성공하려면:

- ✅ All tests pass (Unit, Integration, Component, E2E)
- ✅ Build succeeds
- ✅ Security audit has no critical vulnerabilities
- ✅ Docker image builds successfully
- ✅ EC2 deployment completes
- ✅ Health check returns 2xx/3xx status

## 🔗 Related Documentation

- [QUICK_START.md](./QUICK_START.md) - 빠른 시작 가이드
- [TEST_PLAN.md](./TEST_PLAN.md) - 전체 테스트 전략
- [PHASE1_IMPLEMENTATION_GUIDE.md](./PHASE1_IMPLEMENTATION_GUIDE.md) - Phase 1 구현 가이드

## 📝 Changelog

### 2025-01-06

- ✅ 통합 CI/CD 파이프라인 생성
- ✅ 12단계 자동화 워크플로우
- ✅ Docker ECR 푸시 자동화
- ✅ EC2 자동 배포
- ✅ Slack 알림 통합
- 🗑️ 기존 분산된 workflow 파일 삭제
  - `ci.yml`, `build-and-push.yml`, `deploy-to-ec2.yml` 제거
