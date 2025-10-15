import { expect, test } from '@playwright/test'

test.describe('로그인 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 페이지로 이동
    await page.goto('/login')
  })

  test('성공적인 로그인 플로우', async ({ page }) => {
    // 1. 로그인 페이지 요소 확인
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()

    // 2. 유효한 자격 증명으로 로그인
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()

    // 3. 대시보드로 리디렉션 확인
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

    // 4. 사용자 정보 표시 확인
    await expect(page.getByText('관리자')).toBeVisible()
  })

  test('잘못된 이메일로 로그인 시도', async ({ page }) => {
    // 1. 잘못된 이메일 입력
    await page.getByLabel('이메일').fill('wrong@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()

    // 2. 오류 메시지 표시 확인
    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible()

    // 3. 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL('/login')
  })

  test('잘못된 비밀번호로 로그인 시도', async ({ page }) => {
    // 1. 잘못된 비밀번호 입력
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('wrongpassword')
    await page.getByRole('button', { name: '로그인' }).click()

    // 2. 오류 메시지 표시 확인
    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible()

    // 3. 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL('/login')
  })

  test('빈 필드로 로그인 시도', async ({ page }) => {
    // 1. 빈 필드로 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click()

    // 2. 유효성 검사 오류 메시지 확인
    await expect(page.getByText('이메일을 입력해주세요')).toBeVisible()
    await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible()

    // 3. 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL('/login')
  })

  test('이메일 형식 검증', async ({ page }) => {
    // 1. 잘못된 이메일 형식 입력
    await page.getByLabel('이메일').fill('invalid-email')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()

    // 2. 이메일 형식 오류 메시지 확인
    await expect(page.getByText('올바른 이메일 형식을 입력해주세요')).toBeVisible()

    // 3. 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL('/login')
  })

  test('로그인 폼 상태 관리', async ({ page }) => {
    // 1. 로그인 버튼이 초기에는 비활성화되어 있는지 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeDisabled()

    // 2. 이메일만 입력했을 때 여전히 비활성화
    await page.getByLabel('이메일').fill('admin@example.com')
    await expect(page.getByRole('button', { name: '로그인' })).toBeDisabled()

    // 3. 비밀번호까지 입력했을 때 활성화
    await page.getByLabel('비밀번호').fill('password123')
    await expect(page.getByRole('button', { name: '로그인' })).toBeEnabled()
  })

  test('로그인 중 로딩 상태 표시', async ({ page }) => {
    // 1. 로그인 시도
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('password123')

    // 2. 로그인 버튼 클릭 전에 로딩 상태 확인을 위한 Promise 설정
    const loginButton = page.getByRole('button', { name: '로그인' })

    await loginButton.click()

    // 3. 로딩 상태 표시 확인 (간단한 로딩 텍스트나 버튼 비활성화)
    await expect(loginButton).toBeDisabled()

    // 4. 최종적으로 성공적으로 로그인되는지 확인
    await expect(page).toHaveURL('/dashboard')
  })

  test('비밀번호 표시/숨기기 토글', async ({ page }) => {
    const passwordInput = page.getByLabel('비밀번호')
    const toggleButton = page.getByRole('button', { name: '비밀번호 표시' })

    // 1. 초기에는 비밀번호가 숨겨져 있는지 확인
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // 2. 토글 버튼 클릭
    await toggleButton.click()

    // 3. 비밀번호가 표시되는지 확인
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // 4. 다시 토글 버튼 클릭
    await toggleButton.click()

    // 5. 비밀번호가 다시 숨겨지는지 확인
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('자동 로그인 기능 (체크박스)', async ({ page }) => {
    // 1. 자동 로그인 체크박스 확인
    const rememberMeCheckbox = page.getByLabel('자동 로그인')
    await expect(rememberMeCheckbox).toBeVisible()

    // 2. 체크박스 선택
    await rememberMeCheckbox.check()
    await expect(rememberMeCheckbox).toBeChecked()

    // 3. 로그인 수행
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: '로그인' }).click()

    // 4. 대시보드로 이동 확인
    await expect(page).toHaveURL('/dashboard')

    // 5. 새 탭에서도 자동 로그인 상태인지 확인
    const newPage = await page.context().newPage()
    await newPage.goto('/dashboard')
    await expect(newPage).toHaveURL('/dashboard') // 리디렉션되지 않음
    await expect(newPage.getByRole('heading', { name: '대시보드' })).toBeVisible()
  })

  test('키보드 네비게이션', async ({ page }) => {
    // 1. Tab 키로 필드 간 이동
    await page.keyboard.press('Tab') // 이메일 필드로 이동
    await page.keyboard.type('admin@example.com')

    await page.keyboard.press('Tab') // 비밀번호 필드로 이동
    await page.keyboard.type('password123')

    await page.keyboard.press('Tab') // 로그인 버튼으로 이동
    await page.keyboard.press('Enter') // Enter로 로그인

    // 2. 대시보드로 이동 확인
    await expect(page).toHaveURL('/dashboard')
  })
})
