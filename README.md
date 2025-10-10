# VIA Workstream - Enterprise Management Platform

> SvelteKit 기반의 통합 업무 관리 플랫폼

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (AWS RDS)

### Installation

```bash
# Install dependencies
npm ci

# Copy environment file
cp env.example .env

# Start development server
npm run dev
```

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Development Guide](#-development-guide)
- [Adding New Pages](#-adding-new-pages)
- [Scripts](#-scripts)
- [Code Quality](#-code-quality)
- [Deployment](#-deployment)

---

## ✨ Features

### 🎯 Core Modules

- **재무 관리**: 계정 과목, 거래 내역, 예산 관리
- **인사 관리**: 직원 정보, 급여, 근태, 휴가 관리
- **프로젝트 관리**: 프로젝트, 산출물, 예산 추적
- **플래너**: VIA 이니셔티브, 제품, 스레드, 포메이션, 마일스톤
- **영업 관리**: 고객, 계약, CRM
- **시스템**: 권한 관리, 역할 관리, 보고서, 분석

### 🔐 RBAC (Role-Based Access Control)

- 9개 역할: ADMIN, MANAGEMENT, FINANCE_MANAGER, HR_MANAGER, 등
- 128개 권한: 32개 리소스 × 4개 액션 (read/write/delete/approve)
- 동적 권한 매트릭스 UI
- 실시간 권한 캐싱

---

## 🏗️ Architecture

### Single Source of Truth

모든 리소스와 권한은 **`src/lib/config/resources.ts`** 에서 중앙 관리됩니다.

```
resources.ts (Single Source of Truth)
    ↓
    ├─→ navigation.ts (자동 생성)
    ├─→ permission-matrix.ts (자동 생성)
    └─→ Database (자동 동기화)
```

### Project Structure

```
src/
├── lib/
│   ├── config/           # 중앙 설정
│   │   ├── resources.ts      # 🎯 리소스 정의 (Single Source)
│   │   ├── resource-icons.ts # 🎨 아이콘 매핑
│   │   ├── navigation.ts     # 🧭 네비게이션 (자동 생성)
│   │   ├── routes.ts         # 🛣️ 라우트 권한
│   │   └── permissions.ts    # 🔐 권한 타입
│   ├── components/       # UI 컴포넌트
│   ├── services/         # API 서비스 레이어
│   ├── stores/           # Svelte 스토어
│   └── server/           # 서버 사이드 로직
│       ├── rbac/         # RBAC 시스템
│       └── services/     # 서버 서비스
├── routes/               # SvelteKit 라우트
└── hooks.server.ts       # 권한 체크 미들웨어

scripts/
├── validate-resources.ts    # ✅ 검증
├── sync-resources-to-db.ts  # 🔄 동기화
└── generate-migration.ts    # 📝 마이그레이션 생성

migrations/
└── [번호]_*.sql          # DB 마이그레이션
```

### Data Flow

```
Client Request
    ↓
hooks.server.ts (권한 체크)
    ↓
+page.server.ts (데이터 로드)
    ↓
Service Layer (API 호출)
    ↓
Database (PostgreSQL)
```

---

## 💻 Development Guide

### Code Style

프로젝트는 엄격한 코드 품질 관리 시스템을 사용합니다:

- **TypeScript Strict Mode**: 타입 안전성 보장
- **ESLint**: 100+ 규칙으로 코드 품질 관리
- **Prettier**: 일관된 코드 포맷팅
- **Pre-commit Hook**: 커밋 전 자동 검증

자세한 내용은 [AGENTS.md](./AGENTS.md)를 참고하세요.

### Project Management Module

대규모 컴포넌트를 계층화된 아키텍처로 분리:

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

자세한 내용: [프로젝트 관리 아키텍처](./docs/project-management-architecture.md)

---

## 🆕 Adding New Pages

### Step-by-Step Guide

새로운 페이지를 추가하는 것은 **3단계**로 매우 간단합니다:

#### 1️⃣ 리소스 정의 추가

`src/lib/config/resources.ts`에 새 리소스를 추가합니다:

```typescript
export const RESOURCE_REGISTRY: readonly ResourceDefinition[] = Object.freeze([
  // ... 기존 리소스들

  {
    key: 'marketing', // 🎯 리소스 키 (DB와 매칭)
    category: ResourceCategory.BUSINESS,
    nameKo: '마케팅', // 한글 이름
    nameEn: 'Marketing',
    route: Routes.MARKETING, // 라우트
    showInMatrix: true, // 권한 매트릭스 표시
    showInNav: true, // 네비게이션 표시
    description: '마케팅 캠페인 관리',
    children: [
      // 하위 리소스 (선택)
      {
        key: 'marketing.campaigns',
        category: ResourceCategory.BUSINESS,
        nameKo: '캠페인',
        nameEn: 'Campaigns',
        showInMatrix: false,
        showInNav: false,
      },
    ],
  },
])
```

#### 2️⃣ 아이콘 추가 (선택)

`src/lib/config/resource-icons.ts`에 아이콘을 매핑합니다:

```typescript
import { MegaphoneIcon } from 'lucide-svelte'

export const RESOURCE_ICONS: Record<string, ComponentType> = {
  // ... 기존 아이콘들
  marketing: MegaphoneIcon,
}
```

#### 3️⃣ DB 동기화

터미널에서 자동 동기화를 실행합니다:

```bash
# 1. 검증 (코드와 DB 비교)
npm run validate-resources

# 2. 동기화 (DB에 권한 자동 추가)
npm run sync-resources
```

### 🎉 완료!

이제 다음이 자동으로 생성됩니다:

- ✅ **네비게이션 메뉴**: 사이드바에 자동 추가
- ✅ **DB 권한**: 4개 액션 (read/write/delete/approve) 자동 생성
- ✅ **ADMIN 할당**: ADMIN 역할에 자동 할당
- ✅ **권한 매트릭스**: 권한 관리 UI에 자동 표시

### 🔍 검증 및 배포

```bash
# 개발 환경 테스트
npm run dev

# 프로덕션 배포용 Migration 생성
npm run generate-migration

# 생성된 Migration 파일 검토
cat migrations/[번호]_sync_resources.sql

# Git 커밋
git add .
git commit -m "feat: add marketing page"
```

### 📊 Before & After

**Before (수동 관리):**

```
1. resources.ts 수정 (5분)
2. migration SQL 작성 (10분)
3. 권한 할당 SQL 작성 (10분)
4. 네비게이션 수정 (5분)
5. 테스트 (10분)
---
총 40분 + 실수 가능성 높음 ❌
```

**After (자동화):**

```
1. resources.ts 수정 (5분)
2. npm run sync-resources (자동)
3. 테스트 (5분)
---
총 10분 + 실수 제로 ✅
```

**⚡ 시간 75% 단축!**

---

## 📜 Scripts

### Development

```bash
npm run dev              # 개발 서버 시작
npm run build            # 프로덕션 빌드
npm run preview          # 빌드 미리보기
```

### Code Quality

```bash
npm run check            # TypeScript 타입 체크
npm run lint             # ESLint 체크
npm run format           # Prettier 포맷팅
npm run test             # 유닛 테스트 실행
npm run test:coverage    # 테스트 커버리지
```

### Resource Management

```bash
npm run validate-resources     # 리소스 검증 (코드 ↔ DB 비교)
npm run sync-resources         # DB 동기화 (실제 적용)
npm run sync-resources:dry     # Dry run (미리보기만)
npm run generate-migration     # Migration 파일 생성
```

### CI/CD

```bash
npm run ci               # CI 파이프라인 시뮬레이션
npm run quality:gate     # 품질 게이트 실행
```

---

## 🎯 Code Quality

### Quality Gates

- ✅ TypeScript 오류: **0개 허용**
- ✅ ESLint 오류: **0개 허용**
- ✅ 테스트 커버리지: **75% 이상**
- ✅ 보안 취약점: **0개 허용**

### Pre-commit Hooks

모든 커밋 전 자동으로 실행됩니다:

1. TypeScript 타입 체크
2. ESLint 코드 품질 체크
3. Prettier 포맷팅 체크
4. 테스트 실행

### Available Commands

```bash
# 빠른 체크
npm run check:quick      # TypeScript + 빌드

# 상세 분석
npm run check:errors     # 상세 오류 리포트

# 자동 수정
npm run lint:fix         # ESLint 자동 수정
npm run format           # Prettier 포맷팅
```

---

## 🚀 Deployment

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/db
API_BASE_URL=http://localhost:3000/api
LOG_LEVEL=info
```

### Node.js

```bash
npm run build
node build/index.js
```

### Docker

```bash
docker build -t vws .
docker run -p 3000:3000 vws
```

### AWS ECS/ECR

1. **ECR Repository 생성**: `workstream-svelte` (ap-northeast-2)
2. **GitHub Secrets 설정**:
   - `AWS_ROLE_TO_ASSUME`: OIDC 역할 ARN
   - `ECS_EXEC_ROLE_ARN`: ECS 실행 역할 ARN
   - `ECS_TASK_ROLE_ARN`: ECS 태스크 역할 ARN
3. **Build & Push**: GitHub Action `Push to ECR` 실행
4. **Deploy**: GitHub Action `ECS Deploy` 실행

---

## 📚 Documentation

- [개발 가이드](./DEVELOPMENT_GUIDE.md)
- [빠른 시작](./QUICK_START.md)
- [릴리즈 노트](./RELEASE_NOTES.md)
- [RBAC 구현 계획](./docs/RBAC_IMPLEMENTATION_PLAN.md)
- [프로젝트 관리 아키텍처](./docs/project-management-architecture.md)
- [리소스 동기화 계획](./docs/RESOURCE_SYNC_PLAN.md)

---

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (AWS RDS)
- **Testing**: Vitest, Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: AWS ECS, Docker

---

## 📄 License

Proprietary - VIA Corporation

---

## 🤝 Contributing

1. 브랜치 생성: `git checkout -b feature/new-feature`
2. 변경사항 커밋: `git commit -m 'feat: add new feature'`
3. 푸시: `git push origin feature/new-feature`
4. Pull Request 생성

---

**Made with ❤️ by VIA Team**
