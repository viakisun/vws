import { expect, test } from '@playwright/test'

test.describe('HR 관리 - 급여 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 HR 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/hr')
  })

  test('급여 관리 메인 화면 표시', async ({ page }) => {
    // 1. HR 관리 페이지에서 급여 관리 탭 클릭
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 관리 메인 화면 표시 확인
    await expect(page.getByRole('heading', { name: '급여 관리' })).toBeVisible()

    // 3. 급여 현황 카드 표시 확인
    await expect(page.getByText('이번 달 급여 현황')).toBeVisible()
    await expect(page.getByText('총 급여 지급액')).toBeVisible()
    await expect(page.getByText('지급 완료')).toBeVisible()
    await expect(page.getByText('지급 대기')).toBeVisible()

    // 4. 급여 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '부서' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '기본급' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '수당' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '공제' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '실수령액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('급여 지급 처리 플로우', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 지급 버튼 클릭
    await page.getByRole('button', { name: '급여 지급' }).click()

    // 3. 급여 지급 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 지급' })).toBeVisible()

    // 4. 급여 지급 정보 입력
    await page.getByLabel('지급월').fill('2024-01')
    await page.getByLabel('지급일').fill('2024-02-05')
    await page.getByLabel('지급 방법').selectOption('계좌 이체')

    // 5. 지급 대상 직원 선택
    await page.getByLabel('전체 직원').check()

    // 6. 급여 항목 확인
    await expect(page.getByText('기본급')).toBeVisible()
    await expect(page.getByText('수당')).toBeVisible()
    await expect(page.getByText('공제')).toBeVisible()
    await expect(page.getByText('실수령액')).toBeVisible()

    // 7. 급여 지급 실행 버튼 클릭
    await page.getByRole('button', { name: '급여 지급 실행' }).click()

    // 8. 지급 확인 모달 표시
    await expect(page.getByText('급여 지급을 실행하시겠습니까?')).toBeVisible()
    await expect(page.getByText('총 지급 대상:')).toBeVisible()
    await expect(page.getByText('총 지급액:')).toBeVisible()

    // 9. 최종 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 10. 급여 지급 진행 상태 확인
    await expect(page.getByText('급여 지급 진행 중...')).toBeVisible()

    // 11. 급여 지급 완료 메시지 확인
    await expect(page.getByText('급여 지급이 완료되었습니다')).toBeVisible()

    // 12. 급여 상태가 지급 완료로 변경되었는지 확인
    await expect(page.getByText('지급 완료')).toBeVisible()
  })

  test('급여 명세서 생성 및 조회', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 명세서 버튼 클릭
    await page.getByRole('button', { name: '급여 명세서' }).click()

    // 3. 급여 명세서 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '급여 명세서' })).toBeVisible()

    // 4. 직원 선택
    await page.getByLabel('직원 선택').selectOption('김테스트')

    // 5. 급여 기간 선택
    await page.getByLabel('급여 기간').selectOption('2024년 1월')

    // 6. 명세서 생성 버튼 클릭
    await page.getByRole('button', { name: '명세서 생성' }).click()

    // 7. 급여 명세서 표시 확인
    await expect(page.getByText('급여 명세서')).toBeVisible()
    await expect(page.getByText('2024년 1월')).toBeVisible()
    await expect(page.getByText('김테스트')).toBeVisible()

    // 8. 급여 상세 정보 확인
    await expect(page.getByText('기본급')).toBeVisible()
    await expect(page.getByText('상여금')).toBeVisible()
    await expect(page.getByText('야근수당')).toBeVisible()
    await expect(page.getByText('식비지원')).toBeVisible()
    await expect(page.getByText('교통비지원')).toBeVisible()

    // 9. 공제 상세 정보 확인
    await expect(page.getByText('국민연금')).toBeVisible()
    await expect(page.getByText('건강보험')).toBeVisible()
    await expect(page.getByText('고용보험')).toBeVisible()
    await expect(page.getByText('소득세')).toBeVisible()
    await expect(page.getByText('지방소득세')).toBeVisible()

    // 10. 실수령액 확인
    await expect(page.getByText('실수령액')).toBeVisible()
    await expect(page.getByText(/[0-9,]+원/)).toBeVisible()
  })

  test('급여 항목 수정 플로우', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()

    // 3. 급여 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 정보 수정' })).toBeVisible()

    // 4. 기본급 수정
    await page.getByLabel('기본급').clear()
    await page.getByLabel('기본급').fill('45000000')

    // 5. 수당 항목 수정
    await page.getByLabel('상여금').clear()
    await page.getByLabel('상여금').fill('5000000')
    await page.getByLabel('야근수당').clear()
    await page.getByLabel('야근수당').fill('1000000')

    // 6. 추가 수당 입력
    await page.getByLabel('식비지원').clear()
    await page.getByLabel('식비지원').fill('500000')
    await page.getByLabel('교통비지원').clear()
    await page.getByLabel('교통비지원').fill('300000')

    // 7. 수정 사유 입력
    await page.getByLabel('수정 사유').fill('성과급 반영 및 수당 조정')

    // 8. 수정 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('급여 정보가 수정되었습니다')).toBeVisible()

    // 10. 수정된 급여 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('45,000,000원')).toBeVisible()
  })

  test('급여 검색 및 필터링', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 기간 필터 설정
    await page.getByLabel('급여 기간').selectOption('2024년 1월')

    // 3. 부서별 필터링
    await page.getByRole('button', { name: '부서 필터' }).click()
    await page.getByRole('menuitem', { name: '개발팀' }).click()

    // 4. 개발팀 급여만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외

    // 5. 급여 상태별 필터링
    await page.getByRole('button', { name: '상태 필터' }).click()
    await page.getByRole('menuitem', { name: '지급 완료' }).click()

    // 6. 지급 완료된 급여만 표시되는지 확인
    await expect(page.getByText('지급 완료된 급여만 표시됩니다')).toBeVisible()

    // 7. 직원명으로 검색
    await page.getByPlaceholder('직원명으로 검색...').fill('김')
    await page.keyboard.press('Enter')

    // 8. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 9. 급여 금액 범위 필터링
    await page.getByRole('button', { name: '금액 범위' }).click()
    await page.getByLabel('최소 금액').fill('30000000')
    await page.getByLabel('최대 금액').fill('50000000')
    await page.getByRole('button', { name: '적용' }).click()

    // 10. 금액 범위 필터 적용 확인
    await expect(page.getByText('금액 범위 필터가 적용되었습니다')).toBeVisible()
  })

  test('급여 통계 및 분석', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 통계 버튼 클릭
    await page.getByRole('button', { name: '급여 통계' }).click()

    // 3. 급여 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 통계' })).toBeVisible()

    // 4. 통계 카드들 확인
    await expect(page.getByText('총 급여 지급액')).toBeVisible()
    await expect(page.getByText('평균 급여')).toBeVisible()
    await expect(page.getByText('최고 급여')).toBeVisible()
    await expect(page.getByText('최저 급여')).toBeVisible()
    await expect(page.getByText('급여 인상률')).toBeVisible()

    // 5. 차트 섹션 확인
    await expect(page.getByText('부서별 급여 분포')).toBeVisible()
    await expect(page.getByText('직급별 급여 분포')).toBeVisible()
    await expect(page.getByText('월별 급여 추이')).toBeVisible()

    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 1년')

    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()

    // 8. 급여 인상 분석
    await page.getByRole('button', { name: '급여 인상 분석' }).click()

    // 9. 급여 인상 분석 결과 표시 확인
    await expect(page.getByText('급여 인상 분석 결과')).toBeVisible()
    await expect(page.getByText('인상 대상자')).toBeVisible()
    await expect(page.getByText('인상 금액')).toBeVisible()
  })

  test('급여 지급 내역 조회', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 지급 내역 버튼 클릭
    await page.getByRole('button', { name: '지급 내역' }).click()

    // 3. 급여 지급 내역 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '급여 지급 내역' })).toBeVisible()

    // 4. 지급 내역 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지급일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지급월' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지급 대상자 수' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '총 지급액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '지급 방법' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()

    // 5. 지급 내역 상세 보기
    await page.getByRole('button', { name: '상세 보기' }).first().click()

    // 6. 지급 상세 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 지급 상세' })).toBeVisible()

    // 7. 지급 상세 정보 확인
    await expect(page.getByText('지급 정보')).toBeVisible()
    await expect(page.getByText('지급 대상자 목록')).toBeVisible()
    await expect(page.getByText('지급 결과')).toBeVisible()

    // 8. 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()
  })

  test('급여 내보내기 기능', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

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
    await expect(page.getByRole('heading', { name: '급여 내보내기 설정' })).toBeVisible()

    // 6. 내보낼 기간 설정
    await page.getByLabel('시작월').fill('2024-01')
    await page.getByLabel('종료월').fill('2024-12')

    // 7. 내보낼 필드 선택
    await page.getByLabel('기본 정보').check()
    await page.getByLabel('급여 정보').check()
    await page.getByLabel('공제 정보').check()
    await page.getByLabel('실수령액').check()

    // 8. 내보내기 실행 버튼 클릭
    await page.getByRole('button', { name: '내보내기 실행' }).click()

    // 9. 내보내기 진행 상태 확인
    await expect(page.getByText('데이터를 내보내는 중...')).toBeVisible()

    // 10. 완료 메시지 확인
    await expect(page.getByText('내보내기가 완료되었습니다')).toBeVisible()
  })

  test('급여 설정 관리', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 급여 설정 버튼 클릭
    await page.getByRole('button', { name: '급여 설정' }).click()

    // 3. 급여 설정 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '급여 설정' })).toBeVisible()

    // 4. 급여 항목 관리 탭 클릭
    await page.getByRole('tab', { name: '급여 항목 관리' }).click()

    // 5. 급여 항목 목록 표시 확인
    await expect(page.getByText('기본급')).toBeVisible()
    await expect(page.getByText('상여금')).toBeVisible()
    await expect(page.getByText('야근수당')).toBeVisible()
    await expect(page.getByText('식비지원')).toBeVisible()
    await expect(page.getByText('교통비지원')).toBeVisible()

    // 6. 새 급여 항목 추가 버튼 클릭
    await page.getByRole('button', { name: '새 항목 추가' }).click()

    // 7. 급여 항목 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 급여 항목 추가' })).toBeVisible()

    // 8. 급여 항목 정보 입력
    await page.getByLabel('항목명').fill('성과급')
    await page.getByLabel('항목 유형').selectOption('수당')
    await page.getByLabel('계산 방법').selectOption('고정금액')
    await page.getByLabel('기본값').fill('0')
    await page.getByLabel('설명').fill('성과에 따른 지급')

    // 9. 항목 저장 버튼 클릭
    await page.getByRole('button', { name: '항목 저장' }).click()

    // 10. 성공 메시지 확인
    await expect(page.getByText('급여 항목이 추가되었습니다')).toBeVisible()

    // 11. 공제 항목 관리 탭 클릭
    await page.getByRole('tab', { name: '공제 항목 관리' }).click()

    // 12. 공제 항목 목록 표시 확인
    await expect(page.getByText('국민연금')).toBeVisible()
    await expect(page.getByText('건강보험')).toBeVisible()
    await expect(page.getByText('고용보험')).toBeVisible()
    await expect(page.getByText('소득세')).toBeVisible()
    await expect(page.getByText('지방소득세')).toBeVisible()
  })

  test('급여 알림 및 리마인더', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()

    // 3. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 알림 설정' })).toBeVisible()

    // 4. 알림 옵션 설정
    await page.getByLabel('급여 지급 알림').check()
    await page.getByLabel('급여 명세서 알림').check()
    await page.getByLabel('급여 지급 완료 알림').check()
    await page.getByLabel('급여 지급 실패 알림').check()

    // 5. 알림 시간 설정
    await page.getByLabel('급여 지급 알림 시간').fill('09:00')
    await page.getByLabel('명세서 알림 시간').fill('10:00')

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

    // 10. 테스트 알림 전송
    await page.getByRole('button', { name: '테스트 알림' }).click()

    // 11. 테스트 알림 전송 완료 확인
    await expect(page.getByText('테스트 알림이 전송되었습니다')).toBeVisible()
  })

  test('급여 보안 및 권한 관리', async ({ page }) => {
    // 1. 급여 관리 탭으로 이동
    await page.getByRole('tab', { name: '급여 관리' }).click()

    // 2. 보안 설정 버튼 클릭
    await page.getByRole('button', { name: '보안 설정' }).click()

    // 3. 보안 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '급여 보안 설정' })).toBeVisible()

    // 4. 접근 권한 설정
    await page.getByLabel('급여 조회 권한').selectOption('관리자만')
    await page.getByLabel('급여 수정 권한').selectOption('관리자만')
    await page.getByLabel('급여 지급 권한').selectOption('관리자만')

    // 5. 로그 설정
    await page.getByLabel('급여 조회 로그').check()
    await page.getByLabel('급여 수정 로그').check()
    await page.getByLabel('급여 지급 로그').check()

    // 6. 암호화 설정
    await page.getByLabel('급여 데이터 암호화').check()
    await page.getByLabel('급여 파일 암호화').check()

    // 7. 백업 설정
    await page.getByLabel('자동 백업').check()
    await page.getByLabel('백업 암호화').check()

    // 8. 설정 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('보안 설정이 저장되었습니다')).toBeVisible()

    // 10. 권한 테스트
    await page.getByRole('button', { name: '권한 테스트' }).click()

    // 11. 권한 테스트 결과 확인
    await expect(page.getByText('권한 테스트가 완료되었습니다')).toBeVisible()
  })
})
