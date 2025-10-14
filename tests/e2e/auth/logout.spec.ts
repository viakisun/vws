import { expect, test } from '@playwright/test'

test.describe('로그아웃 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 대시보드로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
  })

  test('사용자 메뉴를 통한 로그아웃', async ({ page }) => {
    // 1. 사용자 메뉴 버튼 클릭
    const userMenuButton = page.getByRole('button', { name: '사용자 메뉴' })
    await expect(userMenuButton).toBeVisible()
    await userMenuButton.click()

    // 2. 로그아웃 메뉴 항목 확인 및 클릭
    const logoutMenuItem = page.getByRole('menuitem', { name: '로그아웃' })
    await expect(logoutMenuItem).toBeVisible()
    await logoutMenuItem.click()

    // 3. 로그아웃 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말 로그아웃 하시겠습니까?')).toBeVisible()

    // 4. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 5. 로그인 페이지로 리디렉션 확인
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  })

  test('로그아웃 취소', async ({ page }) => {
    // 1. 사용자 메뉴에서 로그아웃 클릭
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()

    // 2. 로그아웃 확인 모달에서 취소 버튼 클릭
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: '취소' }).click()

    // 3. 모달이 닫히고 대시보드에 머물러 있는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()
  })

  test('세션 만료로 인한 자동 로그아웃', async ({ page }) => {
    // 1. 세션 만료를 시뮬레이션하기 위해 API 호출 차단
    await page.route('**/api/auth/verify', (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      })
    })

    // 2. API 호출을 트리거하기 위해 페이지 새로고침
    await page.reload()

    // 3. 자동으로 로그인 페이지로 리디렉션되는지 확인
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('세션이 만료되었습니다')).toBeVisible()
  })

  test('다중 탭에서의 로그아웃 동기화', async ({ page, context }) => {
    // 1. 새 탭 열기
    const newPage = await context.newPage()
    await newPage.goto('/dashboard')

    // 2. 원래 탭에서 로그아웃
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '확인' }).click()

    // 3. 새 탭도 자동으로 로그아웃되는지 확인
    await expect(newPage).toHaveURL('/login')
    await expect(newPage.getByText('다른 탭에서 로그아웃되었습니다')).toBeVisible()

    // 4. 새 탭 닫기
    await newPage.close()
  })

  test('로그아웃 후 보호된 페이지 접근 시도', async ({ page }) => {
    // 1. 로그아웃 수행
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '확인' }).click()
    await page.waitForURL('/login')

    // 2. 보호된 페이지에 직접 접근 시도
    await page.goto('/dashboard')

    // 3. 로그인 페이지로 리디렉션되는지 확인
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('로그인이 필요합니다')).toBeVisible()
  })

  test('로그아웃 후 뒤로가기 버튼 사용', async ({ page }) => {
    // 1. 로그아웃 수행
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '확인' }).click()
    await page.waitForURL('/login')

    // 2. 브라우저 뒤로가기 버튼 클릭
    await page.goBack()

    // 3. 로그인 페이지로 다시 리디렉션되는지 확인
    await expect(page).toHaveURL('/login')
  })

  test('로그아웃 중 로딩 상태 표시', async ({ page }) => {
    // 1. 로그아웃 API 응답을 지연시켜 로딩 상태 확인
    await page.route('**/api/auth/logout', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 지연
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      })
    })

    // 2. 로그아웃 시작
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    
    const confirmButton = page.getByRole('button', { name: '확인' })
    await confirmButton.click()

    // 3. 로딩 상태 확인
    await expect(confirmButton).toBeDisabled()
    await expect(page.getByText('로그아웃 중...')).toBeVisible()

    // 4. 로그아웃 완료 후 로그인 페이지로 이동 확인
    await expect(page).toHaveURL('/login')
  })

  test('로그아웃 API 오류 처리', async ({ page }) => {
    // 1. 로그아웃 API 오류 시뮬레이션
    await page.route('**/api/auth/logout', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // 2. 로그아웃 시도
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '확인' }).click()

    // 3. 오류 메시지 표시 확인
    await expect(page.getByText('로그아웃 중 오류가 발생했습니다')).toBeVisible()

    // 4. 여전히 대시보드에 머물러 있는지 확인
    await expect(page).toHaveURL('/dashboard')
  })

  test('키보드 접근성을 통한 로그아웃', async ({ page }) => {
    // 1. Tab 키로 사용자 메뉴 버튼까지 이동
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // 사용자 메뉴 열기

    // 2. 화살표 키로 로그아웃 메뉴 항목 선택
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter') // 로그아웃 선택

    // 3. Enter 키로 확인
    await page.keyboard.press('Enter')

    // 4. 로그인 페이지로 이동 확인
    await expect(page).toHaveURL('/login')
  })

  test('로그아웃 후 브라우저 새로고침', async ({ page }) => {
    // 1. 로그아웃 수행
    await page.getByRole('button', { name: '사용자 메뉴' }).click()
    await page.getByRole('menuitem', { name: '로그아웃' }).click()
    await page.getByRole('button', { name: '확인' }).click()
    await page.waitForURL('/login')

    // 2. 브라우저 새로고침
    await page.reload()

    // 3. 로그인 페이지가 유지되는지 확인
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  })
})
