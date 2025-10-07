# 🔐 VWS 환경 변수 관리 가이드

## 📋 Overview

VWS 프로젝트의 환경 변수를 관리하는 **2가지 방법**만 알면 됩니다.

## 🎯 간단 요약

```
┌─────────────┬──────────────────┬─────────────────────┐
│ Environment │ Storage          │ 설정 방법            │
├─────────────┼──────────────────┼─────────────────────┤
│ 로컬 개발   │ .env 파일        │ .env 파일 생성       │
│ 프로덕션    │ GitHub Secrets   │ GitHub에서 설정      │
└─────────────┴──────────────────┴─────────────────────┘
```

**중요**:

- ✅ 로컬에서는 `.env` 파일만 사용
- ✅ GitHub Secrets는 CI/CD에서만 사용 (로컬에서 사용 불가)
- ✅ EC2에 직접 설정할 필요 없음! GitHub Secrets → SSH → Docker로 자동 전달

---

## 1️⃣ 로컬 개발 환경

### 설정 방법

```bash
# 프로젝트 루트에 .env 파일이 이미 있습니다
# 필요시 수정하세요
vim .env
```

### 환경 변수 목록

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your-jwt-secret-at-least-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/callback/google
ALLOWED_DOMAINS=yourdomain.com
ADMIN_EMAILS=your-email@yourdomain.com

# API
API_BASE_URL=http://localhost:3000/api

# Timezone
DEFAULT_TIMEZONE=Asia/Seoul
```

### 확인

```bash
# .env 파일이 gitignore에 포함되어 있는지 확인
cat .gitignore | grep "^\.env$"
# 출력: .env ✅

# 앱 실행
pnpm dev
```

---

## 2️⃣ 프로덕션 배포 (GitHub Secrets)

### 설정 방법

**GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

### 필수 Secrets 목록

```bash
# AWS (이미 설정되어 있을 것)
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ EC2_HOST
✅ EC2_USER
✅ EC2_SSH_KEY

# Slack (선택)
✅ SLACK_WEBHOOK_URL

# 환경 변수 (추가 필요)
📝 DATABASE_URL
   예: postgresql://postgres:password@rds-endpoint:5432/postgres

📝 JWT_SECRET
   예: production-jwt-secret-min-32-characters

📝 GOOGLE_CLIENT_ID
   예: 382610203479-xxxxx.apps.googleusercontent.com

📝 GOOGLE_CLIENT_SECRET
   예: GOCSPX-xxxxx

📝 GOOGLE_REDIRECT_URI
   예: https://ws.viahub.dev/api/auth/callback/google

📝 ALLOWED_DOMAINS
   예: viasofts.com

📝 ADMIN_EMAILS
   예: admin@viasofts.com
```

### 동작 방식

```yaml
# .github/workflows/ci-cd.yml에서
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }} # GitHub Secret
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  # ...

with:
  envs: DATABASE_URL,JWT_SECRET,... # SSH로 전달

script: |
  docker run -d \
    -e DATABASE_URL="${DATABASE_URL}"  # 자동으로 사용 가능
    -e JWT_SECRET="${JWT_SECRET}"
    # ...
```

**결과**: GitHub Secrets → SSH → Docker 컨테이너로 자동 전달됩니다.

**EC2에 직접 설정할 필요 없음!** ✅

---

## 3️⃣ 배포 흐름

```
┌─────────────────────────────────────────────────────┐
│  1. git push origin main                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  2. GitHub Actions 실행                              │
│     - Tests, Build, Docker Push                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  3. GitHub Secrets 읽기                              │
│     - DATABASE_URL, JWT_SECRET 등                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  4. EC2에 SSH 접속                                   │
│     - 환경 변수를 SSH로 전달                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  5. Docker 컨테이너 실행                             │
│     docker run -e DATABASE_URL="${DATABASE_URL}"    │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 확인 방법

### 로컬에서

```bash
# .env 파일 확인
cat .env

# 앱 실행 후 테스트
pnpm dev
curl http://localhost:5173
```

### 프로덕션에서

```bash
# EC2에 SSH 접속
ssh ec2-user@your-ec2-host

# Docker 컨테이너 환경 변수 확인
docker exec vws-app env | grep -E 'DATABASE_URL|JWT_SECRET|GOOGLE'

# 예상 출력:
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# GOOGLE_CLIENT_ID=...

# 앱 로그 확인
docker logs vws-app

# 헬스체크
curl -I https://ws.viahub.dev
```

---

## 🆘 Troubleshooting

### 문제: 로컬에서 DB 연결 안 됨

```bash
# 1. .env 파일 확인
cat .env | grep DATABASE_URL

# 2. DATABASE_URL 형식 확인
# 올바른 형식: postgresql://user:password@host:port/dbname

# 3. 네트워크 확인
ping your-db-host
```

### 문제: 프로덕션 배포 후 환경 변수가 안 보임

```bash
# 1. GitHub Secrets 확인
GitHub → Settings → Secrets → Actions
# DATABASE_URL, JWT_SECRET 등이 있는지 확인

# 2. EC2에서 Docker 환경 변수 확인
ssh ec2-user@your-ec2-host
docker exec vws-app env

# 3. 컨테이너 재시작
docker restart vws-app
docker logs vws-app
```

### 문제: OAuth 로그인 안 됨

```bash
# 1. GOOGLE_REDIRECT_URI 확인
echo $GOOGLE_REDIRECT_URI
# 예상: https://ws.viahub.dev/api/auth/callback/google

# 2. Google Cloud Console에서 설정 확인
# https://console.cloud.google.com/apis/credentials
# Authorized redirect URIs에 위 URL이 등록되어 있는지 확인

# 3. ALLOWED_DOMAINS 확인
# viasofts.com 도메인의 이메일만 로그인 가능
```

---

## � 보안 체크리스트

### ✅ 로컬

- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] `env.example`에 실제 값이 없음 (플레이스홀더만)
- [ ] `.env` 파일을 Git에 커밋하지 않음

### ✅ GitHub

- [ ] 모든 민감 정보가 GitHub Secrets에 저장됨
- [ ] Public repository에 secret이 노출되지 않음
- [ ] `env.example`에 예시 값만 포함됨

### ✅ EC2

- [ ] Docker 컨테이너에 환경 변수가 전달됨
- [ ] 실제 DB 접속이 가능함
- [ ] OAuth 로그인이 작동함

---

## 📝 요약

### 해야 할 일 (Only 2 Steps!)

1. **로컬 개발**: `.env` 파일 확인/수정
2. **프로덕션 배포**: GitHub Secrets 추가

### 하지 않아도 되는 일

- ❌ EC2에 환경 변수 설정 (자동으로 전달됨)
- ❌ EC2에 `.env` 파일 생성 (필요 없음)
- ❌ Docker 컨테이너에 직접 환경 변수 입력 (CI/CD가 처리)

### 현재 상태 (2025-01-06)

- ✅ `.env` 파일 생성됨
- ✅ `env.example` 보안 처리 완료
- ✅ CI/CD에 환경 변수 전달 로직 구현
- ⚠️ GitHub Secrets 추가 필요 (DATABASE_URL, JWT_SECRET, OAuth 등)

---

## 🔗 관련 문서

- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) - 전체 CI/CD 파이프라인
- [QUICK_START.md](./QUICK_START.md) - 빠른 시작 가이드
