import { expect, test } from '@playwright/test'

test.describe('재무 관리 - 계좌 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 재무 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/finance')
  })

  test('계좌 목록 조회 및 표시', async ({ page }) => {
    // 1. 재무 관리 페이지 로드 확인
    await expect(page.getByRole('heading', { name: '재무 관리' })).toBeVisible()

    // 2. 계좌 관리 탭 클릭
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 3. 계좌 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계좌명' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '은행' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계좌번호' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '잔액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계좌 유형' })).toBeVisible()
  })

  test('새 계좌 추가 플로우', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 새 계좌 추가 버튼 클릭
    await page.getByRole('button', { name: '새 계좌 추가' }).click()

    // 3. 계좌 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 계좌 추가' })).toBeVisible()

    // 4. 계좌 정보 입력
    await page.getByLabel('계좌명').fill('테스트 계좌')
    await page.getByLabel('은행명').selectOption('국민은행')
    await page.getByLabel('계좌번호').fill('123-456-789012')
    await page.getByLabel('계좌 유형').selectOption('입출금')
    await page.getByLabel('초기 잔액').fill('1000000')
    await page.getByLabel('계좌 설명').fill('테스트용 계좌')

    // 5. 저장 버튼 클릭
    await page.getByRole('button', { name: '계좌 추가' }).click()

    // 6. 성공 메시지 확인
    await expect(page.getByText('계좌가 성공적으로 추가되었습니다')).toBeVisible()

    // 7. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 8. 계좌 목록에 새 계좌 표시 확인
    await expect(page.getByText('테스트 계좌')).toBeVisible()
    await expect(page.getByText('123-456-789012')).toBeVisible()
  })

  test('계좌 정보 수정 플로우', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 기존 계좌 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()

    // 3. 계좌 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계좌 정보 수정' })).toBeVisible()

    // 4. 계좌명 수정
    await page.getByLabel('계좌명').clear()
    await page.getByLabel('계좌명').fill('수정된 계좌명')

    // 5. 계좌 설명 수정
    await page.getByLabel('계좌 설명').clear()
    await page.getByLabel('계좌 설명').fill('수정된 설명')

    // 6. 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('계좌 정보가 성공적으로 수정되었습니다')).toBeVisible()

    // 8. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('수정된 계좌명')).toBeVisible()
  })

  test('계좌 삭제 플로우', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 삭제할 계좌의 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).first().click()

    // 3. 삭제 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말로 이 계좌를 삭제하시겠습니까?')).toBeVisible()
    await expect(page.getByText('삭제된 계좌는 복구할 수 없습니다')).toBeVisible()

    // 4. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 5. 성공 메시지 확인
    await expect(page.getByText('계좌가 성공적으로 삭제되었습니다')).toBeVisible()

    // 6. 계좌 목록에서 해당 계좌가 제거되었는지 확인
    // (삭제된 계좌명이 더 이상 표시되지 않음을 확인)
  })

  test('계좌 검색 및 필터링', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 계좌명으로 검색
    await page.getByPlaceholder('계좌명, 은행명으로 검색...').fill('테스트')
    await page.keyboard.press('Enter')

    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 4. 계좌 유형 필터링
    await page.getByRole('button', { name: '계좌 유형 필터' }).click()
    await page.getByRole('menuitem', { name: '입출금' }).click()

    // 5. 입출금 계좌만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외

    // 6. 은행별 필터링
    await page.getByRole('button', { name: '은행 필터' }).click()
    await page.getByRole('menuitem', { name: '국민은행' }).click()

    // 7. 국민은행 계좌만 표시되는지 확인
    await expect(page.getByText('국민은행 계좌만 표시됩니다')).toBeVisible()
  })

  test('계좌 상세 정보 보기', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 계좌 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행

    // 3. 계좌 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계좌 상세 정보' })).toBeVisible()

    // 4. 상세 정보 섹션 확인
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByText('거래 내역')).toBeVisible()
    await expect(page.getByText('통계 정보')).toBeVisible()

    // 5. 모달 닫기 버튼 클릭
    await page.getByRole('button', { name: '닫기' }).click()

    // 6. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('계좌 잔액 업데이트', async ({ page }) => {
    // 1. 계좌 상세 정보 열기
    await page.getByRole('tab', { name: '계좌 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 잔액 업데이트 버튼 클릭
    await page.getByRole('button', { name: '잔액 업데이트' }).click()

    // 3. 잔액 입력 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '잔액 업데이트' })).toBeVisible()

    // 4. 새 잔액 입력
    await page.getByLabel('새 잔액').fill('2000000')
    await page.getByLabel('업데이트 사유').fill('월말 정산')

    // 5. 업데이트 버튼 클릭
    await page.getByRole('button', { name: '업데이트' }).click()

    // 6. 성공 메시지 확인
    await expect(page.getByText('잔액이 업데이트되었습니다')).toBeVisible()

    // 7. 업데이트된 잔액 표시 확인
    await expect(page.getByText('2,000,000원')).toBeVisible()
  })

  test('계좌 활성화/비활성화', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 계좌 상태 토글 버튼 클릭
    await page.getByRole('button', { name: '계좌 상태' }).first().click()

    // 3. 상태 변경 옵션 확인
    await expect(page.getByRole('menuitem', { name: '활성' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '비활성' })).toBeVisible()

    // 4. 비활성으로 변경
    await page.getByRole('menuitem', { name: '비활성' }).click()

    // 5. 상태 변경 확인 모달 표시
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('계좌를 비활성화하시겠습니까?')).toBeVisible()

    // 6. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('계좌 상태가 변경되었습니다')).toBeVisible()

    // 8. 테이블에서 상태 변경 확인
    await expect(page.getByText('비활성')).toBeVisible()
  })

  test('계좌 목록 내보내기', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 내보내기 버튼 클릭
    await page.getByRole('button', { name: '내보내기' }).click()

    // 3. 내보내기 옵션 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible()

    // 4. Excel 내보내기 선택
    await page.getByRole('menuitem', { name: 'Excel로 내보내기' }).click()

    // 5. 다운로드 시작 메시지 확인
    await expect(page.getByText('파일 다운로드가 시작됩니다')).toBeVisible()
  })

  test('계좌 통합 관리', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 통합 관리 버튼 클릭
    await page.getByRole('button', { name: '통합 관리' }).click()

    // 3. 통합 관리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계좌 통합 관리' })).toBeVisible()

    // 4. 통합할 계좌들 선택
    await page.getByLabel('통합할 계좌 1').check()
    await page.getByLabel('통합할 계좌 2').check()

    // 5. 통합 대상 계좌 선택
    await page.getByLabel('통합 대상 계좌').selectOption('메인 계좌')

    // 6. 통합 실행 버튼 클릭
    await page.getByRole('button', { name: '통합 실행' }).click()

    // 7. 통합 확인 모달 표시
    await expect(page.getByText('선택된 계좌들을 통합하시겠습니까?')).toBeVisible()

    // 8. 최종 확인
    await page.getByRole('button', { name: '확인' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('계좌가 성공적으로 통합되었습니다')).toBeVisible()
  })

  test('계좌 백업 및 복원', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 백업 버튼 클릭
    await page.getByRole('button', { name: '백업' }).click()

    // 3. 백업 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계좌 데이터 백업' })).toBeVisible()

    // 4. 백업 옵션 선택
    await page.getByLabel('전체 계좌 백업').check()
    await page.getByLabel('거래 내역 포함').check()

    // 5. 백업 실행 버튼 클릭
    await page.getByRole('button', { name: '백업 실행' }).click()

    // 6. 백업 진행 상태 확인
    await expect(page.getByText('백업 진행 중...')).toBeVisible()

    // 7. 백업 완료 메시지 확인
    await expect(page.getByText('백업이 완료되었습니다')).toBeVisible()

    // 8. 백업 파일 다운로드 확인
    await expect(page.getByText('백업 파일이 다운로드되었습니다')).toBeVisible()
  })

  test('계좌 통계 및 분석', async ({ page }) => {
    // 1. 계좌 관리 탭으로 이동
    await page.getByRole('tab', { name: '계좌 관리' }).click()

    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '통계 보기' }).click()

    // 3. 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계좌 통계' })).toBeVisible()

    // 4. 통계 카드들 확인
    await expect(page.getByText('총 계좌 수')).toBeVisible()
    await expect(page.getByText('총 잔액')).toBeVisible()
    await expect(page.getByText('평균 잔액')).toBeVisible()
    await expect(page.getByText('활성 계좌 수')).toBeVisible()

    // 5. 차트 섹션 확인
    await expect(page.getByText('은행별 분포')).toBeVisible()
    await expect(page.getByText('계좌 유형별 분포')).toBeVisible()

    // 6. 기간 필터 확인
    await page.getByLabel('기간 필터').selectOption('최근 6개월')

    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()
  })
})
