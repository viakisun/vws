import { expect, test } from '@playwright/test'

test.describe('권한 기반 접근 제어', () => {
  test.describe('관리자 권한', () => {
    test.beforeEach(async ({ page }) => {
      // 관리자로 로그인
      await page.goto('/login')
      await page.getByLabel('이메일').fill('admin@example.com')
      await page.getByLabel('비밀번호').fill('admin123')
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/dashboard')
    })

    test('관리자는 모든 페이지에 접근 가능', async ({ page }) => {
      // 1. 대시보드 접근
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

      // 2. CRM 페이지 접근
      await page.goto('/crm')
      await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()

      // 3. 재무 관리 페이지 접근
      await page.goto('/finance')
      await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

      // 4. 인사 관리 페이지 접근
      await page.goto('/hr')
      await expect(page.getByRole('heading', { name: '인사 관리' })).toBeVisible()

      // 5. R&D 관리 페이지 접근
      await page.goto('/research-development')
      await expect(page.getByRole('heading', { name: 'R&D 관리' })).toBeVisible()

      // 6. 설정 페이지 접근
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
    })

    test('관리자는 모든 기능을 사용할 수 있음', async ({ page }) => {
      // 1. CRM에서 고객 생성
      await page.goto('/crm')
      await expect(page.getByRole('button', { name: '새 고객 추가' })).toBeVisible()
      await expect(page.getByRole('button', { name: '고객 편집' })).toBeVisible()
      await expect(page.getByRole('button', { name: '고객 삭제' })).toBeVisible()

      // 2. 재무 관리에서 거래 생성
      await page.goto('/finance')
      await expect(page.getByRole('button', { name: '새 거래 추가' })).toBeVisible()
      await expect(page.getByRole('button', { name: '거래 편집' })).toBeVisible()
      await expect(page.getByRole('button', { name: '거래 삭제' })).toBeVisible()

      // 3. 인사 관리에서 직원 관리
      await page.goto('/hr')
      await expect(page.getByRole('button', { name: '새 직원 추가' })).toBeVisible()
      await expect(page.getByRole('button', { name: '직원 편집' })).toBeVisible()
      await expect(page.getByRole('button', { name: '직원 삭제' })).toBeVisible()
    })

    test('관리자는 시스템 설정에 접근 가능', async ({ page }) => {
      await page.goto('/settings')

      // 시스템 설정 섹션 확인
      await expect(page.getByRole('heading', { name: '시스템 설정' })).toBeVisible()
      await expect(page.getByRole('button', { name: '사용자 관리' })).toBeVisible()
      await expect(page.getByRole('button', { name: '권한 관리' })).toBeVisible()
      await expect(page.getByRole('button', { name: '데이터베이스 백업' })).toBeVisible()
    })
  })

  test.describe('매니저 권한', () => {
    test.beforeEach(async ({ page }) => {
      // 매니저로 로그인
      await page.goto('/login')
      await page.getByLabel('이메일').fill('manager@example.com')
      await page.getByLabel('비밀번호').fill('manager123')
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/dashboard')
    })

    test('매니저는 대부분의 페이지에 접근 가능', async ({ page }) => {
      // 1. 대시보드 접근
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

      // 2. CRM 페이지 접근
      await page.goto('/crm')
      await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()

      // 3. 재무 관리 페이지 접근
      await page.goto('/finance')
      await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

      // 4. 인사 관리 페이지 접근
      await page.goto('/hr')
      await expect(page.getByRole('heading', { name: '인사 관리' })).toBeVisible()
    })

    test('매니저는 시스템 설정에 제한적 접근', async ({ page }) => {
      await page.goto('/settings')

      // 기본 설정은 볼 수 있지만 시스템 설정은 볼 수 없음
      await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
      await expect(page.getByRole('button', { name: '프로필 설정' })).toBeVisible()
      await expect(page.getByRole('button', { name: '알림 설정' })).toBeVisible()

      // 시스템 설정은 접근 불가
      await expect(page.getByRole('heading', { name: '시스템 설정' })).toBeHidden()
    })

    test('매니저는 삭제 권한이 제한됨', async ({ page }) => {
      // CRM에서 삭제 버튼이 비활성화되어 있는지 확인
      await page.goto('/crm')
      await expect(page.getByRole('button', { name: '고객 삭제' })).toBeDisabled()

      // 재무 관리에서 삭제 버튼이 비활성화되어 있는지 확인
      await page.goto('/finance')
      await expect(page.getByRole('button', { name: '거래 삭제' })).toBeDisabled()
    })
  })

  test.describe('직원 권한', () => {
    test.beforeEach(async ({ page }) => {
      // 직원으로 로그인
      await page.goto('/login')
      await page.getByLabel('이메일').fill('employee@example.com')
      await page.getByLabel('비밀번호').fill('employee123')
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/dashboard')
    })

    test('직원은 읽기 전용 페이지에만 접근 가능', async ({ page }) => {
      // 1. 대시보드 접근
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

      // 2. CRM 페이지 접근 (읽기 전용)
      await page.goto('/crm')
      await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()
      await expect(page.getByRole('button', { name: '새 고객 추가' })).toBeHidden()
      await expect(page.getByRole('button', { name: '고객 편집' })).toBeHidden()

      // 3. 재무 관리 페이지 접근 (읽기 전용)
      await page.goto('/finance')
      await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()
      await expect(page.getByRole('button', { name: '새 거래 추가' })).toBeHidden()
    })

    test('직원은 설정 페이지에 제한적 접근', async ({ page }) => {
      await page.goto('/settings')

      // 프로필 설정만 접근 가능
      await expect(page.getByRole('heading', { name: '프로필 설정' })).toBeVisible()
      await expect(page.getByRole('button', { name: '프로필 편집' })).toBeVisible()

      // 다른 설정 섹션은 접근 불가
      await expect(page.getByRole('heading', { name: '알림 설정' })).toBeHidden()
      await expect(page.getByRole('heading', { name: '시스템 설정' })).toBeHidden()
    })

    test('직원은 인사 관리 페이지에 접근 불가', async ({ page }) => {
      await page.goto('/hr')

      // 접근 거부 메시지 표시
      await expect(page.getByText('접근 권한이 없습니다')).toBeVisible()
      await expect(page.getByRole('heading', { name: '인사 관리' })).toBeHidden()
    })
  })

  test.describe('권한 없는 사용자', () => {
    test('인증되지 않은 사용자는 로그인 페이지로 리디렉션', async ({ page }) => {
      // 보호된 페이지에 직접 접근 시도
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/login')
      await expect(page.getByText('로그인이 필요합니다')).toBeVisible()

      await page.goto('/crm')
      await expect(page).toHaveURL('/login')

      await page.goto('/finance')
      await expect(page).toHaveURL('/login')
    })

    test('만료된 토큰으로 접근 시도', async ({ page }) => {
      // 만료된 토큰을 가진 상태로 페이지 접근 시뮬레이션
      await page.goto('/dashboard')

      // 로그인 페이지로 리디렉션
      await expect(page).toHaveURL('/login')
      await expect(page.getByText('세션이 만료되었습니다')).toBeVisible()
    })
  })

  test.describe('권한 변경 시 실시간 반영', () => {
    test('권한이 변경되면 즉시 반영됨', async ({ page }) => {
      // 관리자로 로그인
      await page.goto('/login')
      await page.getByLabel('이메일').fill('admin@example.com')
      await page.getByLabel('비밀번호').fill('admin123')
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/dashboard')

      // CRM 페이지에서 삭제 버튼이 활성화되어 있는지 확인
      await page.goto('/crm')
      await expect(page.getByRole('button', { name: '고객 삭제' })).toBeEnabled()

      // 권한 변경 API 호출 시뮬레이션
      await page.route('**/api/auth/verify', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              role: 'MANAGER', // 관리자에서 매니저로 권한 변경
              permissions: ['read', 'write'],
            },
          }),
        })
      })

      // 페이지 새로고침으로 권한 변경 반영
      await page.reload()

      // 삭제 버튼이 비활성화되었는지 확인
      await expect(page.getByRole('button', { name: '고객 삭제' })).toBeDisabled()
    })
  })

  test.describe('API 권한 검증', () => {
    test('권한 없는 API 호출 시 403 오류', async ({ page }) => {
      // 직원으로 로그인
      await page.goto('/login')
      await page.getByLabel('이메일').fill('employee@example.com')
      await page.getByLabel('비밀번호').fill('employee123')
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/dashboard')

      // 권한 없는 API 호출 시뮬레이션
      await page.route('**/api/hr/employees', (route) => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ error: 'Forbidden' }),
        })
      })

      // 인사 관리 페이지 접근 시도
      await page.goto('/hr')

      // 오류 메시지 표시 확인
      await expect(page.getByText('접근 권한이 없습니다')).toBeVisible()
    })
  })
})
