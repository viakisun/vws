# CI 워크플로우 빠른 참조 가이드

## 🎯 CI 워크플로우 개요

GitHub Actions CI는 다음 5개 job으로 구성됩니다:

```
┌─────────────────────────────────────────────────────────┐
│                   CI 워크플로우                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐  ┌──────────┐                             │
│  │ Quality │  │ Security │  (병렬 실행)                 │
│  └────┬────┘  └──────────┘                             │
│       │                                                  │
│       ├───────┬─────────┬──────────┐                   │
│       │       │         │          │                    │
│  ┌────▼───┐  │    ┌────▼────┐  ┌──▼────┐              │
│  │  Perf  │  │    │ Coverage│  │ Build │              │
│  └────────┘  │    └─────────┘  └───┬───┘              │
│              │                      │                   │
│              └──────────────────────┘                   │
│                        │                                │
│                   ┌────▼─────┐                         │
│                   │  Notify  │                         │
│                   └──────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 각 Job 설명

### 1️⃣ Quality Job

**목적**: 코드 품질 검증
**실행 시간**: ~3-5분

- ✅ Prettier 포맷 검사
- ⚠️ Svelte 타입 체크 (경고 허용)
- ⚠️ TypeScript 타입 체크 (경고 허용)
- ⚠️ ESLint (Svelte) (경고 허용)
- ⚠️ ESLint (TypeScript) (경고 허용)
- ⚠️ 테스트 + 커버리지 (경고 허용)

**실패 조건**: Prettier 검사만 실패 시 전체 실패

### 2️⃣ Security Job

**목적**: 보안 취약점 검사
**실행 시간**: ~1-2분

- ⚠️ npm audit (critical 수준, 경고 허용)

**실패 조건**: 없음 (항상 통과)

### 3️⃣ Perf Job

**목적**: 성능 측정 (Lighthouse)
**실행 시간**: ~5-7분
**의존성**: Quality Job 완료 필요

1. 프로덕션 빌드 생성
2. 미리보기 서버 시작 (포트 4173)
3. 서버 준비 대기 (30초 타임아웃)
4. Lighthouse CI 실행
5. 서버 종료

**실패 조건**: 빌드 실패 시만 실패, Lighthouse는 실패해도 계속

### 4️⃣ Build Job

**목적**: 배포 준비
**실행 시간**: ~2-3분
**의존성**: Quality, Security, Perf 모두 완료 필요

- 프로덕션 빌드 생성
- 빌드 아티팩트 업로드 (.svelte-kit, build)

**실패 조건**: 빌드 실패 시

### 5️⃣ Coverage Job

**목적**: 코드 커버리지 보고
**실행 시간**: ~1분
**의존성**: Quality Job 완료 필요

- Quality Job에서 생성된 커버리지 다운로드
- 커버리지 데이터 확인

**실패 조건**: 없음 (항상 통과)

### 6️⃣ Notify Job

**목적**: Slack 알림
**실행 시간**: ~10초
**의존성**: 모든 Job 완료 (성공/실패 무관)

- Slack으로 CI 결과 전송
- 필요 시크릿: `SLACK_WEBHOOK_URL`

---

## 🔧 로컬 테스트 명령어

### 전체 CI 시뮬레이션

```bash
./scripts/test-ci-locally.sh
```

### 개별 단계 테스트

#### Quality 단계

```bash
# Format 검사 (필수 통과)
pnpm format:check

# Svelte 검사 (경고 허용)
pnpm run check:svelte

# TypeScript 검사 (경고 허용)
pnpm run check:typescript

# Lint 검사 (경고 허용)
pnpm run lint:svelte
pnpm run lint:typescript

# 테스트 (경고 허용)
pnpm test:coverage
```

#### Security 단계

```bash
pnpm security:audit
```

#### Build 단계

```bash
pnpm build
```

#### Perf 단계 (수동)

```bash
# 1. 빌드
pnpm build

# 2. 미리보기 서버 시작
pnpm preview --port 4173 &
echo $! > preview.pid

# 3. Lighthouse 실행
pnpm dlx @lhci/cli autorun --collect.url=http://localhost:4173 --upload.target=filesystem

# 4. 서버 종료
kill $(cat preview.pid)
rm preview.pid
```

---

## 🚨 트러블슈팅

### CI 실패 시 체크리스트

1. **Format Check 실패**

   ```bash
   pnpm format
   git add .
   git commit -m "chore: format code"
   ```

2. **Svelte/TypeScript 체크 실패** (경고는 괜찮음)
   - 에러 로그 확인
   - 해당 파일 수정
   - 로컬에서 재검증

3. **Build 실패**

   ```bash
   pnpm install
   pnpm build
   # 에러 메시지 확인 후 수정
   ```

4. **Perf Job 실패**
   - 빌드가 성공하는지 확인
   - 포트 4173이 사용 중인지 확인
   - Lighthouse 타임아웃 증가 필요 시 CI 파일 수정

5. **Notify Job 실패**
   - GitHub Secrets에 `SLACK_WEBHOOK_URL` 설정 확인
   - Slack 웹훅 URL 유효성 확인

---

## 📊 CI 통과 기준

### ✅ 전체 CI 통과 조건

1. ✅ Prettier 포맷 검사 통과
2. ✅ 프로덕션 빌드 성공
3. ⚠️ 기타 검사는 경고 허용

### ⚠️ 경고만 발생 (통과)

- Svelte 타입 에러
- TypeScript 타입 에러
- ESLint 경고
- 테스트 없음
- 보안 취약점 (critical 미만)
- Lighthouse 실패

### ❌ CI 실패 조건

- Prettier 포맷 불일치
- 프로덕션 빌드 실패

---

## 🔐 필요한 GitHub Secrets

Repository → Settings → Secrets and variables → Actions

| Secret 이름         | 필수 여부 | 용도         |
| ------------------- | --------- | ------------ |
| `SLACK_WEBHOOK_URL` | 선택      | Slack 알림   |
| `CODECOV_TOKEN`     | 선택      | Codecov 통합 |

---

## 📈 CI 최적화 팁

1. **캐싱 활용** (이미 설정됨)
   - pnpm 캐시: `pnpm/action-setup@v4`
   - Node.js 설정: `actions/setup-node@v4`

2. **병렬 실행**
   - Quality와 Security는 병렬 실행
   - 총 실행 시간 단축

3. **조건부 실행**
   - Coverage: Quality 완료 후
   - Perf: Quality 완료 후
   - Build: 모든 검증 완료 후
   - Notify: 항상 실행 (`if: always()`)

4. **에러 허용**
   - 개발 중 경고는 허용
   - 프로덕션 배포 전 수정

---

## 📝 체크리스트: PR 생성 전

- [ ] `pnpm format` 실행
- [ ] `pnpm build` 성공 확인
- [ ] (선택) `./scripts/test-ci-locally.sh` 실행
- [ ] 변경사항 커밋 및 푸시
- [ ] PR 생성 후 CI 결과 확인

---

## 🔗 관련 문서

- [CI 검증 보고서](./CI_VALIDATION_REPORT.md)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Lighthouse CI 문서](https://github.com/GoogleChrome/lighthouse-ci)
