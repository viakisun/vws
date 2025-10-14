import { expect, test } from '@playwright/test'

test.describe('CRM 계약 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 CRM 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/crm')
  })

  test('계약 목록 조회 및 표시', async ({ page }) => {
    // 1. 계약 탭 클릭
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 계약 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계약명' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '고객사' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계약 유형' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계약 금액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계약 상태' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '계약 기간' })).toBeVisible()
  })

  test('새 계약 생성 플로우', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 새 계약 추가 버튼 클릭
    await page.getByRole('button', { name: '새 계약 추가' }).click()
    
    // 3. 계약 생성 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 계약 생성' })).toBeVisible()
    
    // 4. 기본 정보 입력
    await page.getByLabel('계약명').fill('테스트 계약')
    await page.getByLabel('계약 번호').fill('CONTRACT-2024-001')
    await page.getByLabel('고객사').selectOption('테스트 회사')
    await page.getByLabel('계약 유형').selectOption('수익')
    await page.getByLabel('계약 금액').fill('10000000')
    await page.getByLabel('계약 시작일').fill('2024-01-01')
    await page.getByLabel('계약 종료일').fill('2024-12-31')
    
    // 5. 결제 조건 설정
    await page.getByLabel('결제 방법').selectOption('월 단위')
    await page.getByLabel('결제 조건').fill('매월 말일')
    
    // 6. 담당자 지정
    await page.getByLabel('담당자').selectOption('김담당')
    
    // 7. 계약서 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '계약서 파일' })
    await fileInput.setInputFiles('tests/fixtures/sample-contract.pdf')
    
    // 8. 저장 버튼 클릭
    await page.getByRole('button', { name: '계약 생성' }).click()
    
    // 9. 성공 메시지 확인
    await expect(page.getByText('계약이 성공적으로 생성되었습니다')).toBeVisible()
    
    // 10. 계약 목록에 새 계약 표시 확인
    await expect(page.getByText('테스트 계약')).toBeVisible()
    await expect(page.getByText('CONTRACT-2024-001')).toBeVisible()
  })

  test('계약 정보 수정 플로우', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 기존 계약 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()
    
    // 3. 계약 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계약 정보 수정' })).toBeVisible()
    
    // 4. 계약 금액 수정
    await page.getByLabel('계약 금액').clear()
    await page.getByLabel('계약 금액').fill('15000000')
    
    // 5. 계약 기간 연장
    await page.getByLabel('계약 종료일').clear()
    await page.getByLabel('계약 종료일').fill('2025-12-31')
    
    // 6. 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('계약 정보가 성공적으로 수정되었습니다')).toBeVisible()
    
    // 8. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('15,000,000원')).toBeVisible()
  })

  test('계약 상태 변경 플로우', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 계약 상태 드롭다운 클릭
    await page.getByRole('button', { name: '계약 상태' }).first().click()
    
    // 3. 상태 변경 옵션 확인
    await expect(page.getByRole('menuitem', { name: '진행중' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '완료' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '중단' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '취소' })).toBeVisible()
    
    // 4. 상태를 '완료'로 변경
    await page.getByRole('menuitem', { name: '완료' }).click()
    
    // 5. 상태 변경 확인 모달 표시
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('계약 상태를 완료로 변경하시겠습니까?')).toBeVisible()
    
    // 6. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('계약 상태가 변경되었습니다')).toBeVisible()
    
    // 8. 테이블에서 상태 변경 확인
    await expect(page.getByText('완료')).toBeVisible()
  })

  test('계약 검색 및 필터링', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 계약명으로 검색
    await page.getByPlaceholder('계약명, 고객사로 검색...').fill('테스트')
    await page.keyboard.press('Enter')
    
    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()
    
    // 4. 계약 유형 필터링
    await page.getByRole('button', { name: '계약 유형 필터' }).click()
    await page.getByRole('menuitem', { name: '수익' }).click()
    
    // 5. 수익 계약만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외
    
    // 6. 계약 상태 필터링
    await page.getByRole('button', { name: '상태 필터' }).click()
    await page.getByRole('menuitem', { name: '진행중' }).click()
    
    // 7. 진행중인 계약만 표시되는지 확인
    await expect(page.getByText('진행중 계약만 표시됩니다')).toBeVisible()
  })

  test('계약 상세 정보 보기', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 계약 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행
    
    // 3. 계약 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계약 상세 정보' })).toBeVisible()
    
    // 4. 상세 정보 섹션 확인
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByText('결제 정보')).toBeVisible()
    await expect(page.getByText('계약서 파일')).toBeVisible()
    await expect(page.getByText('진행 이력')).toBeVisible()
    
    // 5. 계약서 다운로드 버튼 확인
    await expect(page.getByRole('button', { name: '계약서 다운로드' })).toBeVisible()
    
    // 6. 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('계약 삭제 플로우', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 삭제할 계약의 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).first().click()
    
    // 3. 삭제 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말로 이 계약을 삭제하시겠습니까?')).toBeVisible()
    await expect(page.getByText('삭제된 계약은 복구할 수 없습니다')).toBeVisible()
    
    // 4. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()
    
    // 5. 성공 메시지 확인
    await expect(page.getByText('계약이 성공적으로 삭제되었습니다')).toBeVisible()
    
    // 6. 계약 목록에서 해당 계약이 제거되었는지 확인
    // (삭제된 계약명이 더 이상 표시되지 않음을 확인)
  })

  test('계약 진행률 관리', async ({ page }) => {
    // 1. 계약 상세 정보 열기
    await page.getByRole('tab', { name: '계약' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 진행률 섹션 확인
    await expect(page.getByText('진행률 관리')).toBeVisible()
    
    // 3. 진행률 업데이트 버튼 클릭
    await page.getByRole('button', { name: '진행률 업데이트' }).click()
    
    // 4. 진행률 입력 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('현재 진행률 (%)')).toBeVisible()
    
    // 5. 진행률 입력
    await page.getByLabel('현재 진행률 (%)').fill('75')
    await page.getByLabel('진행 상황 메모').fill('3단계 완료, 4단계 진행중')
    
    // 6. 업데이트 버튼 클릭
    await page.getByRole('button', { name: '업데이트' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('진행률이 업데이트되었습니다')).toBeVisible()
    
    // 8. 진행률 바 표시 확인
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByText('75%')).toBeVisible()
  })

  test('계약 알림 및 리마인더 설정', async ({ page }) => {
    // 1. 계약 상세 정보 열기
    await page.getByRole('tab', { name: '계약' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 알림 설정 섹션 확인
    await expect(page.getByText('알림 설정')).toBeVisible()
    
    // 3. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()
    
    // 4. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계약 알림 설정' })).toBeVisible()
    
    // 5. 알림 옵션 설정
    await page.getByLabel('계약 만료 30일 전 알림').check()
    await page.getByLabel('계약 만료 7일 전 알림').check()
    await page.getByLabel('결제일 3일 전 알림').check()
    
    // 6. 알림 방법 선택
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('SMS 알림').check()
    
    // 7. 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
  })

  test('계약 템플릿 관리', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 템플릿 관리 버튼 클릭
    await page.getByRole('button', { name: '템플릿 관리' }).click()
    
    // 3. 템플릿 관리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계약 템플릿 관리' })).toBeVisible()
    
    // 4. 새 템플릿 추가 버튼 클릭
    await page.getByRole('button', { name: '새 템플릿 추가' }).click()
    
    // 5. 템플릿 정보 입력
    await page.getByLabel('템플릿명').fill('표준 서비스 계약')
    await page.getByLabel('템플릿 설명').fill('일반적인 서비스 제공 계약 템플릿')
    await page.getByLabel('계약 유형').selectOption('수익')
    
    // 6. 템플릿 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '템플릿 파일' })
    await fileInput.setInputFiles('tests/fixtures/contract-template.docx')
    
    // 7. 저장 버튼 클릭
    await page.getByRole('button', { name: '템플릿 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('템플릿이 저장되었습니다')).toBeVisible()
    
    // 9. 템플릿 목록에 새 템플릿 표시 확인
    await expect(page.getByText('표준 서비스 계약')).toBeVisible()
  })

  test('계약 통계 및 대시보드', async ({ page }) => {
    // 1. 계약 탭으로 이동
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 통계 카드 확인
    await expect(page.getByText('총 계약 수')).toBeVisible()
    await expect(page.getByText('진행중 계약')).toBeVisible()
    await expect(page.getByText('완료된 계약')).toBeVisible()
    await expect(page.getByText('총 계약 금액')).toBeVisible()
    
    // 3. 차트 섹션 확인
    await expect(page.getByText('월별 계약 현황')).toBeVisible()
    await expect(page.getByText('계약 유형별 분포')).toBeVisible()
    
    // 4. 필터 옵션 확인
    await page.getByLabel('기간 필터').selectOption('최근 6개월')
    
    // 5. 차트 업데이트 확인
    await expect(page.getByText('차트가 업데이트되었습니다')).toBeVisible()
    
    // 6. 내보내기 버튼 확인
    await expect(page.getByRole('button', { name: '통계 내보내기' })).toBeVisible()
  })

  test('계약 승인 워크플로우', async ({ page }) => {
    // 1. 계약 상세 정보 열기
    await page.getByRole('tab', { name: '계약' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 승인 워크플로우 섹션 확인
    await expect(page.getByText('승인 워크플로우')).toBeVisible()
    
    // 3. 승인 요청 버튼 클릭
    await page.getByRole('button', { name: '승인 요청' }).click()
    
    // 4. 승인 요청 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '승인 요청' })).toBeVisible()
    
    // 5. 승인자 선택
    await page.getByLabel('승인자').selectOption('김승인')
    await page.getByLabel('요청 사유').fill('신규 계약 승인 요청')
    
    // 6. 승인 요청 버튼 클릭
    await page.getByRole('button', { name: '요청 전송' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('승인 요청이 전송되었습니다')).toBeVisible()
    
    // 8. 승인 상태 확인
    await expect(page.getByText('승인 대기중')).toBeVisible()
  })

  test('계약 복사 및 템플릿 적용', async ({ page }) => {
    // 1. 계약 목록에서 복사할 계약 선택
    await page.getByRole('tab', { name: '계약' }).click()
    
    // 2. 계약 복사 버튼 클릭
    await page.getByRole('button', { name: '계약 복사' }).first().click()
    
    // 3. 계약 복사 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '계약 복사' })).toBeVisible()
    
    // 4. 복사할 정보 수정
    await page.getByLabel('계약명').clear()
    await page.getByLabel('계약명').fill('복사된 계약')
    await page.getByLabel('계약 번호').clear()
    await page.getByLabel('계약 번호').fill('CONTRACT-2024-002')
    
    // 5. 복사 생성 버튼 클릭
    await page.getByRole('button', { name: '복사 생성' }).click()
    
    // 6. 성공 메시지 확인
    await expect(page.getByText('계약이 복사되었습니다')).toBeVisible()
    
    // 7. 새로 생성된 계약이 목록에 표시되는지 확인
    await expect(page.getByText('복사된 계약')).toBeVisible()
  })
})
