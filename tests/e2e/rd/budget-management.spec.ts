import { expect, test } from '@playwright/test'

test.describe('R&D 관리 - 예산 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 R&D 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/research-development')
  })

  test('R&D 예산 관리 메인 화면 표시', async ({ page }) => {
    // 1. R&D 관리 페이지에서 예산 관리 탭 클릭
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 예산 관리 메인 화면 표시 확인
    await expect(page.getByRole('heading', { name: 'R&D 예산 관리' })).toBeVisible()

    // 3. 예산 현황 카드 표시 확인
    await expect(page.getByText('총 예산')).toBeVisible()
    await expect(page.getByText('사용 예산')).toBeVisible()
    await expect(page.getByText('잔여 예산')).toBeVisible()
    await expect(page.getByText('사용률')).toBeVisible()

    // 4. 예산 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '프로젝트명' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '총 예산' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사용 예산' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '잔여 예산' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사용률' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('예산 계획 수립 플로우', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 예산 계획 수립 버튼 클릭
    await page.getByRole('button', { name: '예산 계획 수립' }).click()

    // 3. 예산 계획 수립 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 계획 수립' })).toBeVisible()

    // 4. 기본 정보 입력
    await page.getByLabel('계획명').fill('2024년 R&D 예산 계획')
    await page.getByLabel('계획 기간').selectOption('2024년')
    await page.getByLabel('계획 유형').selectOption('연간 계획')

    // 5. 총 예산 설정
    await page.getByLabel('총 예산').fill('1000000000')

    // 6. 예산 배분 입력
    await page.getByLabel('인건비').fill('600000000')
    await page.getByLabel('장비비').fill('200000000')
    await page.getByLabel('재료비').fill('100000000')
    await page.getByLabel('기타비용').fill('100000000')

    // 7. 프로젝트별 예산 배분
    await page.getByLabel('AI 프로젝트').fill('400000000')
    await page.getByLabel('데이터 분석 프로젝트').fill('300000000')
    await page.getByLabel('시스템 개발 프로젝트').fill('300000000')

    // 8. 예산 계획 저장 버튼 클릭
    await page.getByRole('button', { name: '예산 계획 저장' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('예산 계획이 수립되었습니다')).toBeVisible()

    // 10. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 11. 예산 계획이 목록에 표시되었는지 확인
    await expect(page.getByText('2024년 R&D 예산 계획')).toBeVisible()
  })

  test('예산 사용 승인 플로우', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 예산 사용 신청 버튼 클릭
    await page.getByRole('button', { name: '예산 사용 신청' }).click()

    // 3. 예산 사용 신청 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 사용 신청' })).toBeVisible()

    // 4. 예산 사용 정보 입력
    await page.getByLabel('프로젝트 선택').selectOption('AI 기반 데이터 분석 시스템 개발')
    await page.getByLabel('사용 유형').selectOption('인건비')
    await page.getByLabel('사용 금액').fill('5000000')
    await page.getByLabel('사용 목적').fill('개발자 인건비 지급')
    await page.getByLabel('사용 일자').fill('2024-02-15')

    // 5. 첨부 파일 업로드
    const fileInput = page.getByLabel('첨부 파일')
    await fileInput.setInputFiles({
      name: 'budget_request.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data'),
    })

    // 6. 예산 사용 신청 버튼 클릭
    await page.getByRole('button', { name: '신청' }).click()

    // 7. 성공 메시지 확인
    await expect(page.getByText('예산 사용 신청이 제출되었습니다')).toBeVisible()

    // 8. 승인 대기 상태 확인
    await expect(page.getByText('승인 대기')).toBeVisible()

    // 9. 관리자 승인 처리
    await page.getByRole('button', { name: '승인' }).click()

    // 10. 승인 처리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('예산 사용 승인')).toBeVisible()

    // 11. 승인 정보 입력
    await page.getByLabel('승인 금액').fill('5000000')
    await page.getByLabel('승인 사유').fill('정당한 사용 목적 확인')

    // 12. 승인 버튼 클릭
    await page.getByRole('button', { name: '승인' }).click()

    // 13. 승인 완료 메시지 확인
    await expect(page.getByText('예산 사용이 승인되었습니다')).toBeVisible()
  })

  test('예산 사용 내역 조회 및 관리', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 사용 내역 버튼 클릭
    await page.getByRole('button', { name: '사용 내역' }).click()

    // 3. 예산 사용 내역 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '예산 사용 내역' })).toBeVisible()

    // 4. 사용 내역 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사용일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '프로젝트' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사용 유형' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사용 금액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '승인자' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()

    // 5. 사용 내역 검색
    await page.getByPlaceholder('프로젝트명, 사용 유형으로 검색...').fill('AI')
    await page.keyboard.press('Enter')

    // 6. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 7. 사용 유형별 필터링
    await page.getByRole('button', { name: '사용 유형 필터' }).click()
    await page.getByRole('menuitem', { name: '인건비' }).click()

    // 8. 인건비 사용 내역만 표시되는지 확인
    await expect(page.getByText('인건비 사용 내역만 표시됩니다')).toBeVisible()

    // 9. 사용 내역 상세 보기
    await page.getByRole('button', { name: '상세 보기' }).first().click()

    // 10. 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 사용 내역 상세' })).toBeVisible()

    // 11. 상세 정보 확인
    await expect(page.getByText('사용 정보')).toBeVisible()
    await expect(page.getByText('승인 정보')).toBeVisible()
    await expect(page.getByText('첨부 파일')).toBeVisible()
  })

  test('예산 집행 현황 모니터링', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 집행 현황 버튼 클릭
    await page.getByRole('button', { name: '집행 현황' }).click()

    // 3. 예산 집행 현황 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '예산 집행 현황' })).toBeVisible()

    // 4. 집행 현황 대시보드 표시 확인
    await expect(page.getByText('월별 집행 현황')).toBeVisible()
    await expect(page.getByText('프로젝트별 집행 현황')).toBeVisible()
    await expect(page.getByText('유형별 집행 현황')).toBeVisible()

    // 5. 집행 현황 차트 확인
    await expect(page.locator('[data-testid="budget-execution-chart"]')).toBeVisible()

    // 6. 집행률 표시 확인
    await expect(page.getByText('전체 집행률')).toBeVisible()
    await expect(page.getByText('프로젝트별 집행률')).toBeVisible()

    // 7. 집행 현황 필터링
    await page.getByLabel('조회 기간').selectOption('최근 6개월')
    await page.getByLabel('프로젝트 필터').selectOption('AI 프로젝트')

    // 8. 필터 적용 후 차트 업데이트 확인
    await expect(page.getByText('차트가 업데이트되었습니다')).toBeVisible()

    // 9. 집행 현황 상세 분석
    await page.getByRole('button', { name: '상세 분석' }).click()

    // 10. 상세 분석 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 집행 상세 분석' })).toBeVisible()

    // 11. 분석 결과 확인
    await expect(page.getByText('집행 추이 분석')).toBeVisible()
    await expect(page.getByText('예산 효율성 분석')).toBeVisible()
    await expect(page.getByText('리스크 분석')).toBeVisible()
  })

  test('예산 초과 알림 및 관리', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 알림 관리 버튼 클릭
    await page.getByRole('button', { name: '알림 관리' }).click()

    // 3. 예산 알림 관리 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '예산 알림 관리' })).toBeVisible()

    // 4. 알림 설정 섹션 확인
    await expect(page.getByText('알림 설정')).toBeVisible()
    await expect(page.getByText('알림 이력')).toBeVisible()

    // 5. 예산 초과 알림 설정
    await page.getByLabel('예산 초과 알림').check()
    await page.getByLabel('예산 사용률 80% 알림').check()
    await page.getByLabel('예산 사용률 90% 알림').check()
    await page.getByLabel('예산 사용률 100% 알림').check()

    // 6. 알림 임계값 설정
    await page.getByLabel('초과 임계값').fill('10')
    await page.getByLabel('알림 주기').selectOption('실시간')

    // 7. 알림 방법 설정
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('SMS 알림').check()
    await page.getByLabel('푸시 알림').check()

    // 8. 알림 대상 설정
    await page.getByLabel('프로젝트 매니저').check()
    await page.getByLabel('예산 담당자').check()
    await page.getByLabel('관리자').check()

    // 9. 알림 설정 저장
    await page.getByRole('button', { name: '알림 설정 저장' }).click()

    // 10. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()

    // 11. 알림 이력 확인
    await page.getByRole('tab', { name: '알림 이력' }).click()

    // 12. 알림 이력 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '알림 시간' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '알림 유형' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '프로젝트' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '알림 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('예산 보고서 생성 및 내보내기', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '보고서 생성' }).click()

    // 3. 보고서 생성 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 보고서 생성' })).toBeVisible()

    // 4. 보고서 설정 입력
    await page.getByLabel('보고서 유형').selectOption('월간 예산 보고서')
    await page.getByLabel('보고 기간').selectOption('2024년 2월')
    await page.getByLabel('보고서 제목').fill('2024년 2월 R&D 예산 집행 보고서')

    // 5. 포함할 섹션 선택
    await page.getByLabel('예산 현황').check()
    await page.getByLabel('집행 현황').check()
    await page.getByLabel('프로젝트별 분석').check()
    await page.getByLabel('유형별 분석').check()
    await page.getByLabel('향후 계획').check()

    // 6. 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '보고서 생성' }).click()

    // 7. 보고서 생성 진행 상태 확인
    await expect(page.getByText('보고서를 생성하는 중...')).toBeVisible()

    // 8. 보고서 생성 완료 확인
    await expect(page.getByText('보고서가 생성되었습니다')).toBeVisible()

    // 9. 생성된 보고서 미리보기 확인
    await expect(page.getByText('보고서 미리보기')).toBeVisible()
    await expect(page.getByText('예산 현황')).toBeVisible()
    await expect(page.getByText('집행 현황')).toBeVisible()
    await expect(page.getByText('프로젝트별 분석')).toBeVisible()

    // 10. 보고서 내보내기 옵션
    await page.getByRole('button', { name: '내보내기' }).click()

    // 11. 내보내기 옵션 메뉴 확인
    await expect(page.getByRole('menuitem', { name: 'PDF로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible()

    // 12. PDF 내보내기 선택
    await page.getByRole('menuitem', { name: 'PDF로 내보내기' }).click()

    // 13. PDF 생성 완료 확인
    await expect(page.getByText('PDF가 생성되었습니다')).toBeVisible()
  })

  test('예산 통계 및 분석', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '예산 통계' }).click()

    // 3. 예산 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 통계 및 분석' })).toBeVisible()

    // 4. 통계 카드들 확인
    await expect(page.getByText('총 예산')).toBeVisible()
    await expect(page.getByText('사용 예산')).toBeVisible()
    await expect(page.getByText('잔여 예산')).toBeVisible()
    await expect(page.getByText('평균 집행률')).toBeVisible()
    await expect(page.getByText('예산 효율성')).toBeVisible()

    // 5. 차트 섹션 확인
    await expect(page.getByText('월별 예산 집행 추이')).toBeVisible()
    await expect(page.getByText('프로젝트별 예산 분포')).toBeVisible()
    await expect(page.getByText('유형별 예산 분포')).toBeVisible()
    await expect(page.getByText('집행률 분포')).toBeVisible()

    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 1년')

    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()

    // 8. 예산 효율성 분석
    await page.getByRole('button', { name: '효율성 분석' }).click()

    // 9. 효율성 분석 결과 표시 확인
    await expect(page.getByText('예산 효율성 분석 결과')).toBeVisible()
    await expect(page.getByText('효율적인 프로젝트')).toBeVisible()
    await expect(page.getByText('개선이 필요한 프로젝트')).toBeVisible()
    await expect(page.getByText('추천 사항')).toBeVisible()
  })

  test('예산 승인 워크플로우', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 승인 관리 버튼 클릭
    await page.getByRole('button', { name: '승인 관리' }).click()

    // 3. 예산 승인 관리 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '예산 승인 관리' })).toBeVisible()

    // 4. 승인 대기 목록 표시 확인
    await expect(page.getByText('승인 대기')).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청자' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청 내용' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청 금액' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '신청일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()

    // 5. 첫 번째 승인 요청 상세 보기
    await page.getByRole('button', { name: '상세 보기' }).first().click()

    // 6. 승인 상세 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 승인 요청 상세' })).toBeVisible()

    // 7. 승인 요청 내용 확인
    await expect(page.getByText('신청 정보')).toBeVisible()
    await expect(page.getByText('예산 정보')).toBeVisible()
    await expect(page.getByText('첨부 파일')).toBeVisible()
    await expect(page.getByText('승인 이력')).toBeVisible()

    // 8. 승인 처리
    await page.getByRole('button', { name: '승인' }).click()

    // 9. 승인 처리 모달 표시
    await expect(page.getByText('예산 사용 승인')).toBeVisible()

    // 10. 승인 정보 입력
    await page.getByLabel('승인 금액').fill('5000000')
    await page.getByLabel('승인 사유').fill('정당한 사용 목적 확인')
    await page.getByLabel('승인 조건').fill('월말 정산서 제출 필수')

    // 11. 승인 버튼 클릭
    await page.getByRole('button', { name: '승인' }).click()

    // 12. 승인 완료 메시지 확인
    await expect(page.getByText('예산 사용이 승인되었습니다')).toBeVisible()

    // 13. 승인된 항목이 목록에서 상태 변경 확인
    await expect(page.getByText('승인됨')).toBeVisible()
  })

  test('예산 백업 및 복원', async ({ page }) => {
    // 1. 예산 관리 탭으로 이동
    await page.getByRole('tab', { name: '예산 관리' }).click()

    // 2. 데이터 관리 버튼 클릭
    await page.getByRole('button', { name: '데이터 관리' }).click()

    // 3. 데이터 관리 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: '데이터 백업' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '데이터 복원' })).toBeVisible()

    // 4. 데이터 백업 선택
    await page.getByRole('menuitem', { name: '데이터 백업' }).click()

    // 5. 백업 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 데이터 백업' })).toBeVisible()

    // 6. 백업 옵션 설정
    await page.getByLabel('전체 데이터 백업').check()
    await page.getByLabel('예산 계획 데이터').check()
    await page.getByLabel('사용 내역 데이터').check()
    await page.getByLabel('승인 이력 데이터').check()

    // 7. 백업 파일 암호화
    await page.getByLabel('백업 파일 암호화').check()
    await page.getByLabel('암호화 비밀번호').fill('backup123!')

    // 8. 백업 실행 버튼 클릭
    await page.getByRole('button', { name: '백업 실행' }).click()

    // 9. 백업 진행 상태 확인
    await expect(page.getByText('백업 진행 중...')).toBeVisible()

    // 10. 백업 완료 메시지 확인
    await expect(page.getByText('백업이 완료되었습니다')).toBeVisible()

    // 11. 백업 파일 다운로드 확인
    await expect(page.getByText('백업 파일이 다운로드되었습니다')).toBeVisible()

    // 12. 복원 기능 테스트
    await page.getByRole('button', { name: '데이터 복원' }).click()

    // 13. 복원 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 데이터 복원' })).toBeVisible()

    // 14. 복원 파일 선택
    const fileInput = page.getByLabel('복원 파일 선택')
    await fileInput.setInputFiles({
      name: 'budget_backup.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('fake-backup-data'),
    })

    // 15. 복원 실행 버튼 클릭
    await page.getByRole('button', { name: '복원 실행' }).click()

    // 16. 복원 완료 메시지 확인
    await expect(page.getByText('데이터 복원이 완료되었습니다')).toBeVisible()
  })
})
