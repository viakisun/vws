import { expect, test } from '@playwright/test'

test.describe('HR 관리 - 출근 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 HR 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/hr')
  })

  test('출근 관리 메인 화면 표시', async ({ page }) => {
    // 1. HR 관리 페이지에서 출근 관리 탭 클릭
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 출근 관리 메인 화면 표시 확인
    await expect(page.getByRole('heading', { name: '출근 관리' })).toBeVisible()
    
    // 3. 오늘의 출근 현황 카드 표시 확인
    await expect(page.getByText('오늘의 출근 현황')).toBeVisible()
    await expect(page.getByText('출근 완료')).toBeVisible()
    await expect(page.getByText('지각')).toBeVisible()
    await expect(page.getByText('결근')).toBeVisible()
    await expect(page.getByText('휴가')).toBeVisible()
    
    // 4. 출근 기록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '부서' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '출근시간' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '퇴근시간' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '근무시간' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('출근 체크인 플로우', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 출근 체크인 버튼 클릭
    await page.getByRole('button', { name: '출근 체크인' }).click()
    
    // 3. 출근 체크인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '출근 체크인' })).toBeVisible()
    
    // 4. 현재 시간 표시 확인
    await expect(page.getByText('현재 시간:')).toBeVisible()
    await expect(page.getByText(/오전|오후/)).toBeVisible()
    
    // 5. 출근 메모 입력
    await page.getByLabel('출근 메모').fill('정상 출근')
    
    // 6. 출근 체크인 확인 버튼 클릭
    await page.getByRole('button', { name: '출근 체크인' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('출근 체크인이 완료되었습니다')).toBeVisible()
    
    // 8. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()
    
    // 9. 출근 기록이 테이블에 추가되었는지 확인
    await expect(page.getByText('정상 출근')).toBeVisible()
    await expect(page.getByText('출근')).toBeVisible()
  })

  test('퇴근 체크아웃 플로우', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 퇴근 체크아웃 버튼 클릭
    await page.getByRole('button', { name: '퇴근 체크아웃' }).click()
    
    // 3. 퇴근 체크아웃 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '퇴근 체크아웃' })).toBeVisible()
    
    // 4. 근무 시간 요약 표시 확인
    await expect(page.getByText('오늘의 근무시간')).toBeVisible()
    await expect(page.getByText('출근시간:')).toBeVisible()
    await expect(page.getByText('퇴근시간:')).toBeVisible()
    await expect(page.getByText('총 근무시간:')).toBeVisible()
    
    // 5. 퇴근 메모 입력
    await page.getByLabel('퇴근 메모').fill('정상 퇴근')
    
    // 6. 퇴근 체크아웃 확인 버튼 클릭
    await page.getByRole('button', { name: '퇴근 체크아웃' }).click()
    
    // 7. 성공 메시지 확인
    await expect(page.getByText('퇴근 체크아웃이 완료되었습니다')).toBeVisible()
    
    // 8. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()
    
    // 9. 퇴근 기록이 테이블에 업데이트되었는지 확인
    await expect(page.getByText('정상 퇴근')).toBeVisible()
    await expect(page.getByText('퇴근')).toBeVisible()
  })

  test('출근 기록 수정 플로우', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 출근 기록 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()
    
    // 3. 출근 기록 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '출근 기록 수정' })).toBeVisible()
    
    // 4. 출근 시간 수정
    await page.getByLabel('출근 시간').fill('09:00')
    
    // 5. 퇴근 시간 수정
    await page.getByLabel('퇴근 시간').fill('18:00')
    
    // 6. 수정 사유 입력
    await page.getByLabel('수정 사유').fill('시스템 오류로 인한 수정')
    
    // 7. 수정 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('출근 기록이 수정되었습니다')).toBeVisible()
    
    // 9. 수정된 시간이 테이블에 반영되었는지 확인
    await expect(page.getByText('09:00')).toBeVisible()
    await expect(page.getByText('18:00')).toBeVisible()
  })

  test('출근 기록 검색 및 필터링', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 날짜 범위 필터 설정
    await page.getByLabel('시작일').fill('2024-01-01')
    await page.getByLabel('종료일').fill('2024-01-31')
    
    // 3. 부서별 필터링
    await page.getByRole('button', { name: '부서 필터' }).click()
    await page.getByRole('menuitem', { name: '개발팀' }).click()
    
    // 4. 개발팀 출근 기록만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외
    
    // 5. 상태별 필터링
    await page.getByRole('button', { name: '상태 필터' }).click()
    await page.getByRole('menuitem', { name: '정상 출근' }).click()
    
    // 6. 정상 출근 기록만 표시되는지 확인
    await expect(page.getByText('정상 출근 기록만 표시됩니다')).toBeVisible()
    
    // 7. 직원명으로 검색
    await page.getByPlaceholder('직원명으로 검색...').fill('김')
    await page.keyboard.press('Enter')
    
    // 8. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()
  })

  test('월간 출근 현황 조회', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 월간 현황 버튼 클릭
    await page.getByRole('button', { name: '월간 현황' }).click()
    
    // 3. 월간 출근 현황 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '월간 출근 현황' })).toBeVisible()
    
    // 4. 월 선택 달력 표시 확인
    await expect(page.getByRole('button', { name: '월 선택' })).toBeVisible()
    
    // 5. 달력에서 2024년 1월 선택
    await page.getByRole('button', { name: '월 선택' }).click()
    await page.getByText('2024년').click()
    await page.getByText('1월').click()
    
    // 6. 2024년 1월 데이터 로드 확인
    await expect(page.getByText('2024년 1월 출근 현황')).toBeVisible()
    
    // 7. 월간 통계 카드 표시 확인
    await expect(page.getByText('총 근무일수')).toBeVisible()
    await expect(page.getByText('출근일수')).toBeVisible()
    await expect(page.getByText('지각일수')).toBeVisible()
    await expect(page.getByText('결근일수')).toBeVisible()
    await expect(page.getByText('휴가일수')).toBeVisible()
    
    // 8. 출근률 계산 표시 확인
    await expect(page.getByText('출근률')).toBeVisible()
    await expect(page.locator('[data-testid="attendance-rate-chart"]')).toBeVisible()
  })

  test('출근 기록 내보내기', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
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
    await expect(page.getByRole('heading', { name: '출근 기록 내보내기 설정' })).toBeVisible()
    
    // 6. 내보낼 기간 설정
    await page.getByLabel('시작일').fill('2024-01-01')
    await page.getByLabel('종료일').fill('2024-01-31')
    
    // 7. 내보낼 필드 선택
    await page.getByLabel('기본 정보').check()
    await page.getByLabel('출근 시간').check()
    await page.getByLabel('퇴근 시간').check()
    await page.getByLabel('근무 시간').check()
    
    // 8. 내보내기 실행 버튼 클릭
    await page.getByRole('button', { name: '내보내기 실행' }).click()
    
    // 9. 내보내기 진행 상태 확인
    await expect(page.getByText('데이터를 내보내는 중...')).toBeVisible()
    
    // 10. 완료 메시지 확인
    await expect(page.getByText('내보내기가 완료되었습니다')).toBeVisible()
  })

  test('출근 통계 및 분석', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '출근 통계' }).click()
    
    // 3. 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '출근 통계' })).toBeVisible()
    
    // 4. 통계 카드들 확인
    await expect(page.getByText('평균 출근률')).toBeVisible()
    await expect(page.getByText('평균 근무시간')).toBeVisible()
    await expect(page.getByText('지각률')).toBeVisible()
    await expect(page.getByText('결근률')).toBeVisible()
    
    // 5. 차트 섹션 확인
    await expect(page.getByText('월별 출근률 추이')).toBeVisible()
    await expect(page.getByText('부서별 출근률 비교')).toBeVisible()
    await expect(page.getByText('시간대별 출근 분포')).toBeVisible()
    
    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 6개월')
    
    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()
  })

  test('지각/결근 관리', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 지각/결근 관리 버튼 클릭
    await page.getByRole('button', { name: '지각/결근 관리' }).click()
    
    // 3. 지각/결근 관리 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '지각/결근 관리' })).toBeVisible()
    
    // 4. 지각 목록 탭 클릭
    await page.getByRole('tab', { name: '지각 목록' }).click()
    
    // 5. 지각 목록 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지각일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지각시간' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사유' })).toBeVisible()
    
    // 6. 지각 사유 수정 버튼 클릭
    await page.getByRole('button', { name: '사유 수정' }).first().click()
    
    // 7. 사유 수정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '지각 사유 수정' })).toBeVisible()
    
    // 8. 지각 사유 입력
    await page.getByLabel('지각 사유').fill('교통 지연')
    await page.getByLabel('비고').fill('지하철 지연으로 인한 지각')
    
    // 9. 사유 저장 버튼 클릭
    await page.getByRole('button', { name: '사유 저장' }).click()
    
    // 10. 성공 메시지 확인
    await expect(page.getByText('지각 사유가 수정되었습니다')).toBeVisible()
    
    // 11. 결근 목록 탭 클릭
    await page.getByRole('tab', { name: '결근 목록' }).click()
    
    // 12. 결근 목록 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '결근일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '결근 유형' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('출근 알림 설정', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()
    
    // 3. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '출근 알림 설정' })).toBeVisible()
    
    // 4. 알림 옵션 설정
    await page.getByLabel('출근 알림').check()
    await page.getByLabel('퇴근 알림').check()
    await page.getByLabel('지각 알림').check()
    await page.getByLabel('결근 알림').check()
    
    // 5. 알림 시간 설정
    await page.getByLabel('출근 알림 시간').fill('08:50')
    await page.getByLabel('퇴근 알림 시간').fill('17:50')
    
    // 6. 알림 방법 설정
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('SMS 알림').check()
    await page.getByLabel('푸시 알림').check()
    
    // 7. 알림 대상 설정
    await page.getByLabel('관리자에게 알림').check()
    await page.getByLabel('직원에게 알림').check()
    
    // 8. 설정 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()
    
    // 9. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
  })

  test('출근 기록 승인 관리', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 승인 관리 버튼 클릭
    await page.getByRole('button', { name: '승인 관리' }).click()
    
    // 3. 승인 관리 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '출근 기록 승인 관리' })).toBeVisible()
    
    // 4. 대기 중인 승인 목록 표시 확인
    await expect(page.getByText('대기 중인 승인')).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청자' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
    
    // 5. 첫 번째 승인 요청 상세 보기
    await page.getByRole('button', { name: '상세 보기' }).first().click()
    
    // 6. 승인 상세 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '승인 요청 상세' })).toBeVisible()
    
    // 7. 승인 요청 내용 확인
    await expect(page.getByText('신청 내용')).toBeVisible()
    await expect(page.getByText('신청 사유')).toBeVisible()
    await expect(page.getByText('첨부 파일')).toBeVisible()
    
    // 8. 승인 버튼 클릭
    await page.getByRole('button', { name: '승인' }).click()
    
    // 9. 승인 확인 모달 표시
    await expect(page.getByText('이 요청을 승인하시겠습니까?')).toBeVisible()
    
    // 10. 승인 사유 입력
    await page.getByLabel('승인 사유').fill('정당한 사유로 인한 출근 시간 수정')
    
    // 11. 최종 승인 확인
    await page.getByRole('button', { name: '승인' }).click()
    
    // 12. 승인 완료 메시지 확인
    await expect(page.getByText('승인이 완료되었습니다')).toBeVisible()
  })

  test('출근 기록 백업 및 복원', async ({ page }) => {
    // 1. 출근 관리 탭으로 이동
    await page.getByRole('tab', { name: '출근 관리' }).click()
    
    // 2. 데이터 관리 버튼 클릭
    await page.getByRole('button', { name: '데이터 관리' }).click()
    
    // 3. 데이터 관리 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: '데이터 백업' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '데이터 복원' })).toBeVisible()
    
    // 4. 데이터 백업 선택
    await page.getByRole('menuitem', { name: '데이터 백업' }).click()
    
    // 5. 백업 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '출근 기록 백업' })).toBeVisible()
    
    // 6. 백업 옵션 설정
    await page.getByLabel('전체 데이터 백업').check()
    await page.getByLabel('백업 파일 암호화').check()
    
    // 7. 백업 기간 설정
    await page.getByLabel('백업 기간').selectOption('최근 1년')
    
    // 8. 백업 실행 버튼 클릭
    await page.getByRole('button', { name: '백업 실행' }).click()
    
    // 9. 백업 진행 상태 확인
    await expect(page.getByText('백업 진행 중...')).toBeVisible()
    
    // 10. 백업 완료 메시지 확인
    await expect(page.getByText('백업이 완료되었습니다')).toBeVisible()
    
    // 11. 백업 파일 다운로드 확인
    await expect(page.getByText('백업 파일이 다운로드되었습니다')).toBeVisible()
  })
})
