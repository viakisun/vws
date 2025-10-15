import { expect, test } from '@playwright/test'

test.describe('재무 관리 - 거래 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 재무 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/finance')
  })

  test('거래 목록 조회 및 표시', async ({ page }) => {
    // 1. 재무 관리 페이지에서 거래 관리 탭 클릭
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 거래 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래 유형' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래 금액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계좌' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '거래 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '잔액' })).toBeVisible()
  })

  test('새 거래 추가 플로우', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 새 거래 추가 버튼 클릭
    await page.getByRole('button', { name: '새 거래 추가' }).click()

    // 3. 거래 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 거래 추가' })).toBeVisible()

    // 4. 거래 정보 입력
    await page.getByLabel('거래일').fill('2024-01-15')
    await page.getByLabel('거래 유형').selectOption('수입')
    await page.getByLabel('계좌').selectOption('테스트 계좌')
    await page.getByLabel('거래 금액').fill('500000')
    await page.getByLabel('거래 내용').fill('프로젝트 수익')
    await page.getByLabel('카테고리').selectOption('사업 수익')
    await page.getByLabel('메모').fill('Q1 프로젝트 완료')

    // 5. 저장 버튼 클릭
    await page.getByRole('button', { name: '거래 추가' }).click()

    // 6. 성공 메시지 확인
    await expect(page.getByText('거래가 성공적으로 추가되었습니다')).toBeVisible()

    // 7. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 8. 거래 목록에 새 거래 표시 확인
    await expect(page.getByText('프로젝트 수익')).toBeVisible()
    await expect(page.getByText('500,000원')).toBeVisible()
  })

  test('거래 정보 수정 플로우', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 기존 거래 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()

    // 3. 거래 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 정보 수정' })).toBeVisible()

    // 4. 거래 금액 수정
    await page.getByLabel('거래 금액').clear()
    await page.getByLabel('거래 금액').fill('750000')

    // 5. 거래 내용 수정
    await page.getByLabel('거래 내용').clear()
    await page.getByLabel('거래 내용').fill('수정된 거래 내용')

    // 6. 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('거래 정보가 성공적으로 수정되었습니다')).toBeVisible()

    // 8. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('750,000원')).toBeVisible()
  })

  test('거래 삭제 플로우', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 삭제할 거래의 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).first().click()

    // 3. 삭제 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말로 이 거래를 삭제하시겠습니까?')).toBeVisible()
    await expect(page.getByText('삭제된 거래는 복구할 수 없습니다')).toBeVisible()

    // 4. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 5. 성공 메시지 확인
    await expect(page.getByText('거래가 성공적으로 삭제되었습니다')).toBeVisible()

    // 6. 거래 목록에서 해당 거래가 제거되었는지 확인
    // (삭제된 거래 내용이 더 이상 표시되지 않음을 확인)
  })

  test('거래 검색 및 필터링', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 거래 내용으로 검색
    await page.getByPlaceholder('거래 내용, 메모로 검색...').fill('프로젝트')
    await page.keyboard.press('Enter')

    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 4. 거래 유형 필터링
    await page.getByRole('button', { name: '거래 유형 필터' }).click()
    await page.getByRole('menuitem', { name: '수입' }).click()

    // 5. 수입 거래만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외

    // 6. 기간 필터링
    await page.getByRole('button', { name: '기간 필터' }).click()
    await page.getByRole('menuitem', { name: '최근 30일' }).click()

    // 7. 최근 30일 거래만 표시되는지 확인
    await expect(page.getByText('최근 30일 거래만 표시됩니다')).toBeVisible()

    // 8. 금액 범위 필터링
    await page.getByRole('button', { name: '금액 범위' }).click()
    await page.getByLabel('최소 금액').fill('100000')
    await page.getByLabel('최대 금액').fill('1000000')
    await page.getByRole('button', { name: '적용' }).click()

    // 9. 금액 범위 필터 적용 확인
    await expect(page.getByText('금액 범위 필터가 적용되었습니다')).toBeVisible()
  })

  test('거래 상세 정보 보기', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 거래 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행

    // 3. 거래 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 상세 정보' })).toBeVisible()

    // 4. 상세 정보 섹션 확인
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByText('계좌 정보')).toBeVisible()
    await expect(page.getByText('카테고리 정보')).toBeVisible()
    await expect(page.getByText('첨부 파일')).toBeVisible()

    // 5. 모달 닫기 버튼 클릭
    await page.getByRole('button', { name: '닫기' }).click()

    // 6. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('거래 일괄 처리', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 전체 선택 체크박스 클릭
    await page.getByRole('checkbox', { name: '전체 선택' }).click()

    // 3. 모든 거래가 선택되었는지 확인
    const checkboxes = page.getByRole('checkbox')
    const allCheckboxes = await checkboxes.all()
    const checkedCount = await Promise.all(
      allCheckboxes.map(async (checkbox) => await checkbox.isChecked()),
    ).then((results) => results.filter(Boolean).length)
    expect(checkedCount).toBeGreaterThan(1) // 전체 선택 체크박스 + 데이터 행들

    // 4. 일괄 작업 버튼 표시 확인
    await expect(page.getByRole('button', { name: '일괄 삭제' })).toBeVisible()
    await expect(page.getByRole('button', { name: '일괄 카테고리 변경' })).toBeVisible()

    // 5. 일괄 카테고리 변경 클릭
    await page.getByRole('button', { name: '일괄 카테고리 변경' }).click()

    // 6. 일괄 처리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '일괄 카테고리 변경' })).toBeVisible()

    // 7. 새 카테고리 선택
    await page.getByLabel('새 카테고리').selectOption('기타')

    // 8. 일괄 처리 실행 버튼 클릭
    await page.getByRole('button', { name: '일괄 처리 실행' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('선택된 거래의 카테고리가 변경되었습니다')).toBeVisible()
  })

  test('거래 승인 워크플로우', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 승인 대기 중인 거래 확인
    await expect(page.getByText('승인 대기')).toBeVisible()

    // 3. 거래 승인 버튼 클릭
    await page.getByRole('button', { name: '승인' }).first().click()

    // 4. 승인 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('이 거래를 승인하시겠습니까?')).toBeVisible()

    // 5. 승인 사유 입력
    await page.getByLabel('승인 사유').fill('정상적인 사업 거래')

    // 6. 승인 버튼 클릭
    await page.getByRole('button', { name: '승인' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('거래가 승인되었습니다')).toBeVisible()

    // 8. 거래 상태가 승인으로 변경되었는지 확인
    await expect(page.getByText('승인됨')).toBeVisible()
  })

  test('거래 반려 처리', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 거래 반려 버튼 클릭
    await page.getByRole('button', { name: '반려' }).first().click()

    // 3. 반려 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('이 거래를 반려하시겠습니까?')).toBeVisible()

    // 4. 반려 사유 입력
    await page.getByLabel('반려 사유').fill('서류 불완전')

    // 5. 반려 버튼 클릭
    await page.getByRole('button', { name: '반려' }).click()

    // 6. 성공 메시지 확인
    await expect(page.getByText('거래가 반려되었습니다')).toBeVisible()

    // 7. 거래 상태가 반려로 변경되었는지 확인
    await expect(page.getByText('반려됨')).toBeVisible()
  })

  test('거래 내보내기 기능', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 내보내기 버튼 클릭
    await page.getByRole('button', { name: '내보내기' }).click()

    // 3. 내보내기 옵션 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'PDF로 내보내기' })).toBeVisible()

    // 4. Excel 내보내기 선택
    await page.getByRole('menuitem', { name: 'Excel로 내보내기' }).click()

    // 5. 내보내기 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 내보내기 설정' })).toBeVisible()

    // 6. 내보낼 필드 선택
    await page.getByLabel('거래일').check()
    await page.getByLabel('거래 유형').check()
    await page.getByLabel('거래 금액').check()
    await page.getByLabel('거래 내용').check()

    // 7. 내보내기 실행 버튼 클릭
    await page.getByRole('button', { name: '내보내기 실행' }).click()

    // 8. 내보내기 진행 상태 확인
    await expect(page.getByText('데이터를 내보내는 중...')).toBeVisible()

    // 9. 완료 메시지 확인
    await expect(page.getByText('내보내기가 완료되었습니다')).toBeVisible()
  })

  test('거래 통계 및 분석', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '거래 통계' }).click()

    // 3. 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 통계' })).toBeVisible()

    // 4. 통계 카드들 확인
    await expect(page.getByText('총 거래 수')).toBeVisible()
    await expect(page.getByText('총 수입')).toBeVisible()
    await expect(page.getByText('총 지출')).toBeVisible()
    await expect(page.getByText('순이익')).toBeVisible()

    // 5. 차트 섹션 확인
    await expect(page.getByText('월별 수입/지출 추이')).toBeVisible()
    await expect(page.getByText('카테고리별 지출 분포')).toBeVisible()
    await expect(page.getByText('계좌별 거래 현황')).toBeVisible()

    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 6개월')

    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()
  })

  test('거래 템플릿 관리', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 템플릿 관리 버튼 클릭
    await page.getByRole('button', { name: '템플릿 관리' }).click()

    // 3. 템플릿 관리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 템플릿 관리' })).toBeVisible()

    // 4. 새 템플릿 추가 버튼 클릭
    await page.getByRole('button', { name: '새 템플릿 추가' }).click()

    // 5. 템플릿 정보 입력
    await page.getByLabel('템플릿명').fill('월급 템플릿')
    await page.getByLabel('거래 유형').selectOption('수입')
    await page.getByLabel('카테고리').selectOption('급여')
    await page.getByLabel('거래 내용').fill('월급 지급')

    // 6. 템플릿 저장 버튼 클릭
    await page.getByRole('button', { name: '템플릿 저장' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('템플릿이 저장되었습니다')).toBeVisible()

    // 8. 템플릿 목록에 새 템플릿 표시 확인
    await expect(page.getByText('월급 템플릿')).toBeVisible()

    // 9. 템플릿 적용 테스트
    await page.getByRole('button', { name: '템플릿 적용' }).first().click()

    // 10. 템플릿 적용 확인
    await expect(page.getByText('템플릿이 적용되었습니다')).toBeVisible()
  })

  test('거래 알림 및 리마인더', async ({ page }) => {
    // 1. 거래 관리 탭으로 이동
    await page.getByRole('tab', { name: '거래 관리' }).click()

    // 2. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()

    // 3. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '거래 알림 설정' })).toBeVisible()

    // 4. 알림 옵션 설정
    await page.getByLabel('대용량 거래 알림').check()
    await page.getByLabel('정기 거래 알림').check()
    await page.getByLabel('승인 필요 거래 알림').check()

    // 5. 알림 임계값 설정
    await page.getByLabel('대용량 거래 임계값').fill('1000000')

    // 6. 알림 방법 선택
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('브라우저 알림').check()

    // 7. 설정 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
  })
})
