import { expect, test } from '@playwright/test'

test.describe('재무 관리 - 대시보드 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 재무 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/finance')
  })

  test('재무 대시보드 메인 화면 표시', async ({ page }) => {
    // 1. 재무 관리 페이지 로드 확인
    await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

    // 2. 대시보드 탭이 기본 선택되어 있는지 확인
    await expect(page.getByRole('tab', { name: '대시보드', selected: true })).toBeVisible()

    // 3. 주요 KPI 카드들 표시 확인
    await expect(page.getByText('총 자산')).toBeVisible()
    await expect(page.getByText('월간 수입')).toBeVisible()
    await expect(page.getByText('월간 지출')).toBeVisible()
    await expect(page.getByText('순이익')).toBeVisible()

    // 4. 차트 섹션 표시 확인
    await expect(page.getByText('수입/지출 추이')).toBeVisible()
    await expect(page.getByText('카테고리별 지출')).toBeVisible()
    await expect(page.getByText('계좌별 잔액')).toBeVisible()
  })

  test('기간 필터 변경 및 데이터 업데이트', async ({ page }) => {
    // 1. 대시보드 페이지 확인
    await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

    // 2. 기간 필터 드롭다운 클릭
    await page.getByRole('button', { name: '기간 필터' }).click()

    // 3. 다른 기간 옵션들 확인
    await expect(page.getByRole('menuitem', { name: '최근 7일' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 30일' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 3개월' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 6개월' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 1년' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '사용자 정의' })).toBeVisible()

    // 4. 최근 30일 선택
    await page.getByRole('menuitem', { name: '최근 30일' }).click()

    // 5. 로딩 상태 확인
    await expect(page.getByText('데이터를 불러오는 중...')).toBeVisible()

    // 6. 데이터 업데이트 완료 확인
    await expect(page.getByText('최근 30일 데이터가 표시됩니다')).toBeVisible()

    // 7. KPI 카드들이 업데이트되었는지 확인
    await expect(page.getByText('총 자산')).toBeVisible()
    await expect(page.getByText('월간 수입')).toBeVisible()
  })

  test('사용자 정의 기간 설정', async ({ page }) => {
    // 1. 기간 필터 드롭다운 클릭
    await page.getByRole('button', { name: '기간 필터' }).click()

    // 2. 사용자 정의 옵션 선택
    await page.getByRole('menuitem', { name: '사용자 정의' }).click()

    // 3. 사용자 정의 기간 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '사용자 정의 기간 설정' })).toBeVisible()

    // 4. 시작일 설정
    await page.getByLabel('시작일').fill('2024-01-01')

    // 5. 종료일 설정
    await page.getByLabel('종료일').fill('2024-01-31')

    // 6. 적용 버튼 클릭
    await page.getByRole('button', { name: '적용' }).click()

    // 7. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 8. 설정된 기간 표시 확인
    await expect(page.getByText('2024년 1월 1일 ~ 2024년 1월 31일')).toBeVisible()

    // 9. 데이터 업데이트 확인
    await expect(page.getByText('사용자 정의 기간 데이터가 표시됩니다')).toBeVisible()
  })

  test('수입/지출 추이 차트 상호작용', async ({ page }) => {
    // 1. 수입/지출 추이 차트 섹션 확인
    await expect(page.getByText('수입/지출 추이')).toBeVisible()

    // 2. 차트 컨테이너 표시 확인
    await expect(page.locator('[data-testid="income-expense-chart"]')).toBeVisible()

    // 3. 범례 확인
    await expect(page.getByText('수입')).toBeVisible()
    await expect(page.getByText('지출')).toBeVisible()

    // 4. 범례 클릭하여 데이터 시리즈 토글
    await page.getByText('지출').click()

    // 5. 지출 데이터가 숨겨졌는지 확인
    await expect(page.getByText('지출 데이터가 숨겨졌습니다')).toBeVisible()

    // 6. 다시 클릭하여 표시
    await page.getByText('지출').click()

    // 7. 지출 데이터가 다시 표시되었는지 확인
    await expect(page.getByText('지출 데이터가 표시되었습니다')).toBeVisible()

    // 8. 차트 포인트 호버 테스트
    await page.locator('[data-testid="income-expense-chart"]').hover()

    // 9. 툴팁 표시 확인
    await expect(page.getByRole('tooltip')).toBeVisible()
  })

  test('카테고리별 지출 차트 드릴다운', async ({ page }) => {
    // 1. 카테고리별 지출 차트 섹션 확인
    await expect(page.getByText('카테고리별 지출')).toBeVisible()

    // 2. 차트 컨테이너 표시 확인
    await expect(page.locator('[data-testid="category-expense-chart"]')).toBeVisible()

    // 3. 차트 세그먼트 클릭
    await page.locator('[data-testid="category-expense-chart"] circle').first().click()

    // 4. 드릴다운 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '카테고리 상세 분석' })).toBeVisible()

    // 5. 상세 거래 목록 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '금액' })).toBeVisible()

    // 6. 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()

    // 7. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('계좌별 잔액 요약 카드', async ({ page }) => {
    // 1. 계좌별 잔액 섹션 확인
    await expect(page.getByText('계좌별 잔액')).toBeVisible()

    // 2. 계좌 카드들 표시 확인
    const accountCards = page.locator('[data-testid="account-card"]')
    const cardCount = await accountCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // 3. 첫 번째 계좌 카드 확인
    await expect(accountCards.first().getByText('계좌명')).toBeVisible()
    await expect(accountCards.first().getByText('잔액')).toBeVisible()
    await expect(accountCards.first().getByText('거래 수')).toBeVisible()

    // 4. 계좌 카드 클릭
    await accountCards.first().click()

    // 5. 계좌 상세 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '계좌 상세' })).toBeVisible()

    // 6. 뒤로 가기
    await page.getByRole('button', { name: '뒤로 가기' }).click()

    // 7. 대시보드로 돌아왔는지 확인
    await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()
  })

  test('최근 거래 목록 및 빠른 작업', async ({ page }) => {
    // 1. 최근 거래 섹션 확인
    await expect(page.getByText('최근 거래')).toBeVisible()

    // 2. 최근 거래 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '금액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()

    // 3. 더 보기 버튼 클릭
    await page.getByRole('button', { name: '더 보기' }).click()

    // 4. 거래 관리 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '거래 관리' })).toBeVisible()

    // 5. 대시보드로 돌아가기
    await page.goto('/finance')
    await page.getByRole('tab', { name: '대시보드' }).click()

    // 6. 빠른 거래 추가 버튼 클릭
    await page.getByRole('button', { name: '빠른 거래 추가' }).click()

    // 7. 빠른 거래 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '빠른 거래 추가' })).toBeVisible()

    // 8. 거래 정보 입력
    await page.getByLabel('거래 유형').selectOption('지출')
    await page.getByLabel('금액').fill('50000')
    await page.getByLabel('거래 내용').fill('점심 식사')

    // 9. 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click()

    // 10. 성공 메시지 확인
    await expect(page.getByText('거래가 추가되었습니다')).toBeVisible()

    // 11. 대시보드 데이터 업데이트 확인
    await expect(page.getByText('데이터가 업데이트되었습니다')).toBeVisible()
  })

  test('재무 목표 설정 및 추적', async ({ page }) => {
    // 1. 재무 목표 섹션 확인
    await expect(page.getByText('재무 목표')).toBeVisible()

    // 2. 목표 설정 버튼 클릭
    await page.getByRole('button', { name: '목표 설정' }).click()

    // 3. 목표 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '재무 목표 설정' })).toBeVisible()

    // 4. 목표 정보 입력
    await page.getByLabel('목표 유형').selectOption('월간 지출 제한')
    await page.getByLabel('목표 금액').fill('1000000')
    await page.getByLabel('목표 기간').selectOption('2024년')
    await page.getByLabel('목표 설명').fill('월간 지출을 100만원 이하로 제한')

    // 5. 목표 저장 버튼 클릭
    await page.getByRole('button', { name: '목표 저장' }).click()

    // 6. 성공 메시지 확인
    await expect(page.getByText('재무 목표가 설정되었습니다')).toBeVisible()

    // 7. 목표 진행률 표시 확인
    await expect(page.getByText('목표 진행률')).toBeVisible()
    await expect(page.locator('[data-testid="goal-progress-bar"]')).toBeVisible()

    // 8. 목표 편집 버튼 클릭
    await page.getByRole('button', { name: '목표 편집' }).click()

    // 9. 목표 수정
    await page.getByLabel('목표 금액').clear()
    await page.getByLabel('목표 금액').fill('800000')

    // 10. 수정 저장
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 11. 수정 완료 메시지 확인
    await expect(page.getByText('목표가 수정되었습니다')).toBeVisible()
  })

  test('알림 및 알림 설정', async ({ page }) => {
    // 1. 알림 섹션 확인
    await expect(page.getByText('알림')).toBeVisible()

    // 2. 알림 목록 표시 확인
    const notifications = page.locator('[data-testid="notification-item"]')
    const notificationCount = await notifications.count()

    if (notificationCount > 0) {
      // 3. 첫 번째 알림 클릭
      await notifications.first().click()

      // 4. 알림 상세 정보 표시 확인
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: '알림 상세' })).toBeVisible()

      // 5. 알림 읽음 처리
      await page.getByRole('button', { name: '읽음 처리' }).click()

      // 6. 모달 닫기
      await page.getByRole('button', { name: '닫기' }).click()
    }

    // 7. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()

    // 8. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '알림 설정' })).toBeVisible()

    // 9. 알림 옵션 설정
    await page.getByLabel('대용량 거래 알림').check()
    await page.getByLabel('목표 달성 알림').check()
    await page.getByLabel('월말 요약 알림').check()

    // 10. 알림 임계값 설정
    await page.getByLabel('대용량 거래 임계값').fill('500000')

    // 11. 설정 저장
    await page.getByRole('button', { name: '설정 저장' }).click()

    // 12. 저장 완료 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
  })

  test('대시보드 내보내기 및 공유', async ({ page }) => {
    // 1. 내보내기 버튼 클릭
    await page.getByRole('button', { name: '대시보드 내보내기' }).click()

    // 2. 내보내기 옵션 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: 'PDF로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '이미지로 내보내기' })).toBeVisible()

    // 3. PDF 내보내기 선택
    await page.getByRole('menuitem', { name: 'PDF로 내보내기' }).click()

    // 4. PDF 내보내기 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'PDF 내보내기 설정' })).toBeVisible()

    // 5. 내보낼 섹션 선택
    await page.getByLabel('KPI 요약').check()
    await page.getByLabel('수입/지출 추이').check()
    await page.getByLabel('카테고리별 지출').check()

    // 6. PDF 생성 버튼 클릭
    await page.getByRole('button', { name: 'PDF 생성' }).click()

    // 7. PDF 생성 진행 상태 확인
    await expect(page.getByText('PDF를 생성하는 중...')).toBeVisible()

    // 8. PDF 생성 완료 메시지 확인
    await expect(page.getByText('PDF가 생성되었습니다')).toBeVisible()

    // 9. 공유 버튼 클릭
    await page.getByRole('button', { name: '대시보드 공유' }).click()

    // 10. 공유 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '대시보드 공유' })).toBeVisible()

    // 11. 공유 링크 생성
    await page.getByRole('button', { name: '공유 링크 생성' }).click()

    // 12. 공유 링크 생성 완료 확인
    await expect(page.getByText('공유 링크가 생성되었습니다')).toBeVisible()
  })

  test('대시보드 새로고침 및 실시간 업데이트', async ({ page }) => {
    // 1. 대시보드 페이지 확인
    await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

    // 2. 새로고침 버튼 클릭
    await page.getByRole('button', { name: '새로고침' }).click()

    // 3. 로딩 상태 확인
    await expect(page.getByText('데이터를 새로고침하는 중...')).toBeVisible()

    // 4. 새로고침 완료 확인
    await expect(page.getByText('데이터가 새로고침되었습니다')).toBeVisible()

    // 5. 자동 새로고침 설정 토글
    await page.getByRole('button', { name: '자동 새로고침' }).click()

    // 6. 자동 새로고침 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '자동 새로고침 설정' })).toBeVisible()

    // 7. 새로고침 간격 설정
    await page.getByLabel('새로고침 간격').selectOption('5분')

    // 8. 설정 저장
    await page.getByRole('button', { name: '설정 저장' }).click()

    // 9. 자동 새로고침 활성화 확인
    await expect(page.getByText('자동 새로고침이 활성화되었습니다')).toBeVisible()

    // 10. 실시간 업데이트 상태 표시 확인
    await expect(page.getByText('실시간 업데이트 중')).toBeVisible()
  })
})
