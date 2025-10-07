# Playwright E2E 테스트 가이드

## 🎯 Playwright란?

Playwright는 실제 브라우저(Chromium, Firefox, Safari)에서 웹 애플리케이션을 테스트하는 E2E(End-to-End) 테스트 프레임워크입니다.

**Vitest vs Playwright:**

- **Vitest**: 단위 테스트 (함수, 컴포넌트 로직)
- **Playwright**: E2E 테스트 (실제 사용자 시나리오)

---

## 📦 설치

```bash
# Playwright 이미 설치되어 있음
pnpm install

# 브라우저 설치 (처음 한 번만)
pnpm exec playwright install
```

---

## 🚀 테스트 실행

```bash
# 모든 E2E 테스트 실행
pnpm exec playwright test

# 헤드리스 모드 해제 (브라우저 창 보면서 실행)
pnpm exec playwright test --headed

# 특정 파일만 실행
pnpm exec playwright test tests/e2e/example.spec.ts

# UI 모드로 실행 (디버깅에 유용)
pnpm exec playwright test --ui

# 특정 브라우저에서만 실행
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# 디버그 모드
pnpm exec playwright test --debug
```

---

## 📝 테스트 작성 패턴

### 1. 기본 구조

```typescript
import { test, expect } from '@playwright/test'

test.describe('테스트 그룹 이름', () => {
  test('개별 테스트 케이스', async ({ page }) => {
    // 페이지 이동
    await page.goto('/login')

    // 요소 찾기 및 상호작용
    await page.getByRole('button', { name: '로그인' }).click()

    // 검증
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### 2. 요소 선택 방법 (우선순위 순)

```typescript
// ✅ 권장: Role 기반 (접근성 좋음)
page.getByRole('button', { name: '저장' })
page.getByRole('textbox', { name: '이메일' })
page.getByRole('heading', { name: '대시보드' })

// ✅ 권장: Label 기반
page.getByLabel('비밀번호')

// ✅ 권장: Placeholder
page.getByPlaceholder('검색어를 입력하세요')

// ✅ 권장: Text 내용
page.getByText('로그인')

// ⚠️ 차선: Test ID (data-testid 속성)
page.getByTestId('submit-button')

// ❌ 비권장: CSS Selector (구조 변경에 취약)
page.locator('.btn-primary')
page.locator('#login-form')
```

### 3. 자주 사용하는 액션

```typescript
// 클릭
await page.getByRole('button', { name: '제출' }).click()

// 입력
await page.getByLabel('이름').fill('홍길동')

// 선택 (select)
await page.getByLabel('카테고리').selectOption('수입')

// 체크박스/라디오
await page.getByLabel('동의합니다').check()
await page.getByLabel('비동의').uncheck()

// 파일 업로드
await page.getByLabel('파일').setInputFiles('path/to/file.xlsx')

// 키보드
await page.keyboard.press('Enter')
await page.keyboard.type('검색어')

// 스크롤
await page.getByText('더보기').scrollIntoViewIfNeeded()

// 대기
await page.waitForURL('/dashboard')
await page.waitForLoadState('networkidle')
await page.waitForSelector('.loading', { state: 'hidden' })
```

### 4. 검증 (Assertion)

```typescript
// URL 확인
await expect(page).toHaveURL('/finance')
await expect(page).toHaveURL(/\/finance/)

// 제목 확인
await expect(page).toHaveTitle('VWS - 재무관리')

// 요소 표시 확인
await expect(page.getByText('저장 완료')).toBeVisible()
await expect(page.getByText('로딩중')).toBeHidden()

// 요소 활성화/비활성화
await expect(page.getByRole('button')).toBeEnabled()
await expect(page.getByRole('button')).toBeDisabled()

// 텍스트 내용
await expect(page.getByRole('heading')).toHaveText('대시보드')
await expect(page.getByRole('cell')).toContainText('50,000원')

// 개수 확인
await expect(page.getByRole('row')).toHaveCount(10)

// 속성 확인
await expect(page.getByRole('link')).toHaveAttribute('href', '/settings')
```

### 5. 로그인 처리

```typescript
// 방법 1: 매번 로그인 페이지 통해 로그인
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('이메일').fill('test@example.com')
  await page.getByLabel('비밀번호').fill('password')
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/dashboard')
})

// 방법 2: 세션 재사용 (더 빠름)
import { test as base } from '@playwright/test'

const test = base.extend({
  storageState: async ({}, use) => {
    // 한 번만 로그인해서 상태 저장
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto('/login')
    // 로그인 수행...
    await page.context().storageState({ path: 'auth.json' })
    await browser.close()
    await use('auth.json')
  },
})
```

### 6. API 모킹

```typescript
test('API 실패 시나리오', async ({ page }) => {
  // API 응답 가로채기
  await page.route('**/api/finance/accounts', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: '서버 오류' }),
    })
  })

  await page.goto('/finance')
  await expect(page.getByText('오류가 발생했습니다')).toBeVisible()
})

// 응답 수정
await page.route('**/api/users', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ users: [{ id: 1, name: '테스트' }] }),
  })
})
```

### 7. 스크린샷 & 비디오

```typescript
test('스크린샷 예시', async ({ page }) => {
  await page.goto('/dashboard')

  // 전체 페이지 스크린샷
  await page.screenshot({ path: 'dashboard.png', fullPage: true })

  // 특정 요소만
  await page.getByRole('table').screenshot({ path: 'table.png' })
})

// 실패 시 자동 스크린샷/비디오는 playwright.config.ts에 설정됨
```

---

## 🎨 Best Practices

### 1. ✅ 사용자 관점에서 테스트

```typescript
// ✅ Good: 사용자가 보는 것 기준
await page.getByRole('button', { name: '저장' }).click()

// ❌ Bad: 구현 세부사항 기준
await page.locator('#save-btn-123').click()
```

### 2. ✅ 안정적인 선택자 사용

```typescript
// ✅ Good: 변경에 강함
await page.getByRole('textbox', { name: '이메일' })

// ❌ Bad: 구조 변경에 취약
await page.locator('.form > div:nth-child(2) > input')
```

### 3. ✅ 명시적 대기 사용

```typescript
// ✅ Good: 조건이 만족될 때까지 대기
await expect(page.getByText('로딩 완료')).toBeVisible()

// ❌ Bad: 임의 시간 대기
await page.waitForTimeout(3000)
```

### 4. ✅ 독립적인 테스트

```typescript
// ✅ Good: 각 테스트가 독립적
test('테스트 1', async ({ page }) => {
  await page.goto('/finance')
  // 독립적으로 실행 가능
})

// ❌ Bad: 이전 테스트에 의존
test('테스트 2', async ({ page }) => {
  // page는 이미 /finance에 있을 것으로 가정 (위험)
})
```

### 5. ✅ 테스트 격리

```typescript
// ✅ Good: beforeEach로 매번 초기화
test.beforeEach(async ({ page }) => {
  await page.goto('/finance')
})

test('테스트 1', async ({ page }) => {
  // 항상 깨끗한 상태에서 시작
})
```

---

## 🐛 디버깅 팁

### 1. UI 모드 사용

```bash
pnpm exec playwright test --ui
```

- 테스트 실행 과정 시각화
- 각 단계별 DOM 스냅샷
- 타임라인 확인

### 2. 디버그 모드

```bash
pnpm exec playwright test --debug
```

- 브라우저 개발자 도구 사용 가능
- 단계별 실행

### 3. Trace 확인

```bash
pnpm exec playwright show-trace trace.zip
```

- 실패한 테스트의 trace 파일 분석

### 4. 콘솔 로그

```typescript
test('디버깅', async ({ page }) => {
  // 브라우저 콘솔 메시지 캡처
  page.on('console', (msg) => console.log(msg.text()))

  await page.goto('/finance')
})
```

---

## 📁 프로젝트 구조 권장사항

```
tests/e2e/
├── README.md                  # 이 파일
├── example.spec.ts            # 예시 테스트
├── auth/                      # 인증 관련
│   ├── login.spec.ts
│   └── logout.spec.ts
├── finance/                   # 재무 관리
│   ├── accounts.spec.ts
│   ├── transactions.spec.ts
│   └── reports.spec.ts
├── hr/                        # 인사 관리
│   └── employees.spec.ts
└── fixtures/                  # 재사용 가능한 설정
    ├── auth.ts
    └── test-data.ts
```

---

## 🔗 유용한 링크

- [Playwright 공식 문서](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators 가이드](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)

---

## 💡 package.json 스크립트 추가 권장

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

그러면 `pnpm test:e2e`로 간단하게 실행 가능합니다.
