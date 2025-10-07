import { test, expect } from '@playwright/test'

/**
 * E2E 테스트 예시
 * 실제 브라우저에서 사용자 시나리오를 테스트합니다.
 */

test.describe('로그인 페이지', () => {
  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 이동
    await page.goto('/login')

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/VWS/)

    // 로그인 폼 요소 확인
    await expect(page.getByRole('textbox', { name: /이메일|email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /비밀번호|password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible()
  })

  test('빈 폼 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
    await page.goto('/login')

    // 로그인 버튼 클릭
    await page.getByRole('button', { name: /로그인/i }).click()

    // 에러 메시지 확인 (실제 구현에 맞게 수정 필요)
    await expect(page.getByText(/이메일을 입력/i)).toBeVisible()
  })
})

test.describe('대시보드', () => {
  // 각 테스트 전에 로그인 (실제 로그인 로직에 맞게 수정 필요)
  test.beforeEach(async ({ page }) => {
    // 방법 1: 로그인 페이지를 통한 로그인
    await page.goto('/login')
    await page.getByRole('textbox', { name: /이메일/i }).fill('test@example.com')
    await page.getByRole('textbox', { name: /비밀번호/i }).fill('password123')
    await page.getByRole('button', { name: /로그인/i }).click()
    await page.waitForURL('/dashboard')

    // 방법 2: 세션 쿠키 직접 설정 (더 빠름)
    // await page.context().addCookies([
    //   {
    //     name: 'session',
    //     value: 'test-session-token',
    //     domain: 'localhost',
    //     path: '/',
    //   },
    // ])
  })

  test('대시보드가 정상적으로 로드된다', async ({ page }) => {
    await page.goto('/dashboard')

    // 대시보드 주요 요소 확인
    await expect(page.getByRole('heading', { name: /대시보드/i })).toBeVisible()
  })

  test('사이드바 네비게이션이 동작한다', async ({ page }) => {
    await page.goto('/dashboard')

    // HR 메뉴 클릭
    await page.getByRole('link', { name: /인사관리|HR/i }).click()
    await expect(page).toHaveURL(/\/hr/)
  })
})

test.describe('재무 관리', () => {
  test('계좌 목록이 표시된다', async ({ page }) => {
    await page.goto('/finance')

    // 탭 클릭
    await page.getByRole('tab', { name: /계좌관리/i }).click()

    // 테이블 또는 카드 확인
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('새 거래 내역을 추가할 수 있다', async ({ page }) => {
    await page.goto('/finance')

    // 거래내역 탭으로 이동
    await page.getByRole('tab', { name: /거래내역/i }).click()

    // 추가 버튼 클릭
    await page.getByRole('button', { name: /추가|등록/i }).click()

    // 모달이 열림
    await expect(page.getByRole('dialog')).toBeVisible()

    // 폼 입력
    await page.getByLabel(/날짜/i).fill('2025-01-15')
    await page.getByLabel(/금액/i).fill('50000')
    await page.getByLabel(/내용/i).fill('테스트 거래')

    // 저장 버튼 클릭
    await page.getByRole('button', { name: /저장/i }).click()

    // 성공 메시지 확인
    await expect(page.getByText(/추가되었습니다|성공/i)).toBeVisible()
  })
})

/**
 * 모바일 뷰포트 테스트 예시
 */
test.describe('모바일 반응형', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('모바일에서 햄버거 메뉴가 표시된다', async ({ page }) => {
    await page.goto('/dashboard')

    // 햄버거 메뉴 버튼 확인
    await expect(page.getByRole('button', { name: /메뉴/i })).toBeVisible()
  })
})

/**
 * API 응답 모킹 예시
 */
test.describe('API 모킹', () => {
  test('API 에러 처리를 테스트한다', async ({ page }) => {
    // API 응답 가로채기
    await page.route('**/api/finance/accounts', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/finance')

    // 에러 메시지 확인
    await expect(page.getByText(/오류가 발생했습니다/i)).toBeVisible()
  })
})
