import { expect, test } from '@playwright/test'

test.describe('재무 관리 - 보고서 및 분석 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 재무 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/finance')
  })

  test('재무 보고서 메인 화면 표시', async ({ page }) => {
    // 1. 재무 관리 페이지에서 보고서 탭 클릭
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 보고서 메인 화면 표시 확인
    await expect(page.getByRole('heading', { name: '재무 보고서' })).toBeVisible()
    
    // 3. 보고서 카테고리 메뉴 확인
    await expect(page.getByText('수입/지출 보고서')).toBeVisible()
    await expect(page.getByText('현금흐름 보고서')).toBeVisible()
    await expect(page.getByText('예산 대비 실적')).toBeVisible()
    await expect(page.getByText('투자 분석')).toBeVisible()
    await expect(page.getByText('세금 보고서')).toBeVisible()
    
    // 4. 최근 생성된 보고서 목록 확인
    await expect(page.getByText('최근 보고서')).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('수입/지출 보고서 생성', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 수입/지출 보고서 카드 클릭
    await page.getByText('수입/지출 보고서').click()
    
    // 3. 보고서 생성 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '수입/지출 보고서 생성' })).toBeVisible()
    
    // 4. 보고서 설정 폼 표시 확인
    await expect(page.getByLabel('보고서 기간')).toBeVisible()
    await expect(page.getByLabel('보고서 유형')).toBeVisible()
    await expect(page.getByLabel('포함할 계좌')).toBeVisible()
    await expect(page.getByLabel('포함할 카테고리')).toBeVisible()
    
    // 5. 보고서 설정 입력
    await page.getByLabel('보고서 기간').selectOption('최근 3개월')
    await page.getByLabel('보고서 유형').selectOption('상세 보고서')
    
    // 6. 계좌 선택
    await page.getByLabel('메인 계좌').check()
    await page.getByLabel('보조 계좌').check()
    
    // 7. 카테고리 선택
    await page.getByLabel('모든 카테고리').check()
    
    // 8. 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '보고서 생성' }).click()
    
    // 9. 보고서 생성 진행 상태 확인
    await expect(page.getByText('보고서를 생성하는 중...')).toBeVisible()
    
    // 10. 보고서 생성 완료 확인
    await expect(page.getByText('보고서가 생성되었습니다')).toBeVisible()
    
    // 11. 생성된 보고서 표시 확인
    await expect(page.getByRole('heading', { name: '수입/지출 보고서' })).toBeVisible()
    await expect(page.getByText('요약 정보')).toBeVisible()
    await expect(page.getByText('상세 거래 내역')).toBeVisible()
  })

  test('현금흐름 보고서 분석', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 현금흐름 보고서 카드 클릭
    await page.getByText('현금흐름 보고서').click()
    
    // 3. 현금흐름 보고서 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '현금흐름 보고서' })).toBeVisible()
    
    // 4. 현금흐름 차트 표시 확인
    await expect(page.locator('[data-testid="cashflow-chart"]')).toBeVisible()
    
    // 5. 현금흐름 섹션 확인
    await expect(page.getByText('영업 현금흐름')).toBeVisible()
    await expect(page.getByText('투자 현금흐름')).toBeVisible()
    await expect(page.getByText('재무 현금흐름')).toBeVisible()
    
    // 6. 기간 필터 변경
    await page.getByRole('button', { name: '기간 필터' }).click()
    await page.getByRole('menuitem', { name: '최근 6개월' }).click()
    
    // 7. 차트 업데이트 확인
    await expect(page.getByText('차트가 업데이트되었습니다')).toBeVisible()
    
    // 8. 상세 분석 버튼 클릭
    await page.getByRole('button', { name: '상세 분석' }).click()
    
    // 9. 상세 분석 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '현금흐름 상세 분석' })).toBeVisible()
    
    // 10. 분석 결과 표시 확인
    await expect(page.getByText('현금흐름 분석 결과')).toBeVisible()
    await expect(page.getByText('추천 사항')).toBeVisible()
  })

  test('예산 대비 실적 보고서', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 예산 대비 실적 카드 클릭
    await page.getByText('예산 대비 실적').click()
    
    // 3. 예산 대비 실적 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '예산 대비 실적' })).toBeVisible()
    
    // 4. 예산 설정 버튼 클릭
    await page.getByRole('button', { name: '예산 설정' }).click()
    
    // 5. 예산 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 설정' })).toBeVisible()
    
    // 6. 예산 정보 입력
    await page.getByLabel('예산 기간').selectOption('2024년')
    await page.getByLabel('총 예산').fill('50000000')
    await page.getByLabel('월간 예산').fill('4166667')
    
    // 7. 카테고리별 예산 설정
    await page.getByLabel('사업비 예산').fill('20000000')
    await page.getByLabel('인건비 예산').fill('15000000')
    await page.getByLabel('운영비 예산').fill('10000000')
    await page.getByLabel('기타 예산').fill('5000000')
    
    // 8. 예산 저장
    await page.getByRole('button', { name: '예산 저장' }).click()
    
    // 9. 예산 저장 완료 확인
    await expect(page.getByText('예산이 설정되었습니다')).toBeVisible()
    
    // 10. 예산 대비 실적 차트 확인
    await expect(page.locator('[data-testid="budget-vs-actual-chart"]')).toBeVisible()
    
    // 11. 예산 달성률 표시 확인
    await expect(page.getByText('예산 달성률')).toBeVisible()
    await expect(page.locator('[data-testid="budget-achievement-rate"]')).toBeVisible()
  })

  test('투자 분석 보고서', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 투자 분석 카드 클릭
    await page.getByText('투자 분석').click()
    
    // 3. 투자 분석 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '투자 분석' })).toBeVisible()
    
    // 4. 투자 포트폴리오 섹션 확인
    await expect(page.getByText('투자 포트폴리오')).toBeVisible()
    await expect(page.getByText('투자 수익률')).toBeVisible()
    await expect(page.getByText('리스크 분석')).toBeVisible()
    
    // 5. 투자 추가 버튼 클릭
    await page.getByRole('button', { name: '투자 추가' }).click()
    
    // 6. 투자 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '투자 추가' })).toBeVisible()
    
    // 7. 투자 정보 입력
    await page.getByLabel('투자명').fill('테스트 주식')
    await page.getByLabel('투자 유형').selectOption('주식')
    await page.getByLabel('투자 금액').fill('1000000')
    await page.getByLabel('투자일').fill('2024-01-01')
    await page.getByLabel('현재 가치').fill('1100000')
    
    // 8. 투자 저장
    await page.getByRole('button', { name: '투자 저장' }).click()
    
    // 9. 투자 저장 완료 확인
    await expect(page.getByText('투자가 추가되었습니다')).toBeVisible()
    
    // 10. 투자 수익률 계산 확인
    await expect(page.getByText('수익률: 10.00%')).toBeVisible()
    
    // 11. 투자 성과 차트 확인
    await expect(page.locator('[data-testid="investment-performance-chart"]')).toBeVisible()
  })

  test('세금 보고서 생성', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 세금 보고서 카드 클릭
    await page.getByText('세금 보고서').click()
    
    // 3. 세금 보고서 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '세금 보고서' })).toBeVisible()
    
    // 4. 세금 연도 선택
    await page.getByLabel('세금 연도').selectOption('2024')
    
    // 5. 보고서 유형 선택
    await page.getByLabel('보고서 유형').selectOption('종합소득세')
    
    // 6. 소득 카테고리 설정
    await page.getByLabel('사업소득').check()
    await page.getByLabel('기타소득').check()
    
    // 7. 세금 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '세금 보고서 생성' }).click()
    
    // 8. 보고서 생성 진행 상태 확인
    await expect(page.getByText('세금 보고서를 생성하는 중...')).toBeVisible()
    
    // 9. 세금 보고서 생성 완료 확인
    await expect(page.getByText('세금 보고서가 생성되었습니다')).toBeVisible()
    
    // 10. 세금 계산 결과 표시 확인
    await expect(page.getByText('소득 총액')).toBeVisible()
    await expect(page.getByText('공제 총액')).toBeVisible()
    await expect(page.getByText('과세표준')).toBeVisible()
    await expect(page.getByText('산출세액')).toBeVisible()
    await expect(page.getByText('납부할 세액')).toBeVisible()
    
    // 11. 세금 보고서 내보내기
    await page.getByRole('button', { name: '보고서 내보내기' }).click()
    
    // 12. 내보내기 옵션 선택
    await page.getByRole('menuitem', { name: 'PDF로 내보내기' }).click()
    
    // 13. PDF 생성 완료 확인
    await expect(page.getByText('세금 보고서 PDF가 생성되었습니다')).toBeVisible()
  })

  test('보고서 비교 분석', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 보고서 비교 버튼 클릭
    await page.getByRole('button', { name: '보고서 비교' }).click()
    
    // 3. 보고서 비교 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '보고서 비교 분석' })).toBeVisible()
    
    // 4. 비교할 보고서 선택
    await page.getByLabel('기준 보고서').selectOption('2024년 1분기')
    await page.getByLabel('비교 보고서').selectOption('2024년 2분기')
    
    // 5. 비교 항목 선택
    await page.getByLabel('수입 비교').check()
    await page.getByLabel('지출 비교').check()
    await page.getByLabel('수익률 비교').check()
    
    // 6. 비교 분석 실행 버튼 클릭
    await page.getByRole('button', { name: '비교 분석 실행' }).click()
    
    // 7. 비교 분석 결과 표시 확인
    await expect(page.getByText('비교 분석 결과')).toBeVisible()
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible()
    
    // 8. 차이점 요약 확인
    await expect(page.getByText('주요 차이점')).toBeVisible()
    await expect(page.getByText('증감률')).toBeVisible()
    
    // 9. 상세 분석 버튼 클릭
    await page.getByRole('button', { name: '상세 분석' }).click()
    
    // 10. 상세 분석 결과 표시 확인
    await expect(page.getByText('카테고리별 상세 비교')).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('보고서 템플릿 관리', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 템플릿 관리 버튼 클릭
    await page.getByRole('button', { name: '템플릿 관리' }).click()
    
    // 3. 템플릿 관리 페이지 표시 확인
    await expect(page.getByRole('heading', { name: '보고서 템플릿 관리' })).toBeVisible()
    
    // 4. 새 템플릿 추가 버튼 클릭
    await page.getByRole('button', { name: '새 템플릿 추가' }).click()
    
    // 5. 템플릿 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 보고서 템플릿' })).toBeVisible()
    
    // 6. 템플릿 정보 입력
    await page.getByLabel('템플릿명').fill('월간 재무 요약')
    await page.getByLabel('템플릿 유형').selectOption('수입/지출 보고서')
    await page.getByLabel('템플릿 설명').fill('월간 수입/지출 요약 보고서 템플릿')
    
    // 7. 템플릿 설정
    await page.getByLabel('기본 기간').selectOption('월간')
    await page.getByLabel('포함 항목').check()
    await page.getByLabel('차트 포함').check()
    await page.getByLabel('상세 내역 포함').check()
    
    // 8. 템플릿 저장
    await page.getByRole('button', { name: '템플릿 저장' }).click()
    
    // 9. 템플릿 저장 완료 확인
    await expect(page.getByText('템플릿이 저장되었습니다')).toBeVisible()
    
    // 10. 템플릿 목록에 새 템플릿 표시 확인
    await expect(page.getByText('월간 재무 요약')).toBeVisible()
    
    // 11. 템플릿 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()
    
    // 12. 템플릿 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '템플릿 편집' })).toBeVisible()
    
    // 13. 템플릿 수정
    await page.getByLabel('템플릿 설명').clear()
    await page.getByLabel('템플릿 설명').fill('수정된 월간 재무 요약 템플릿')
    
    // 14. 수정 저장
    await page.getByRole('button', { name: '수정 저장' }).click()
    
    // 15. 수정 완료 확인
    await expect(page.getByText('템플릿이 수정되었습니다')).toBeVisible()
  })

  test('보고서 예약 생성', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 예약 생성 버튼 클릭
    await page.getByRole('button', { name: '예약 생성' }).click()
    
    // 3. 예약 생성 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '보고서 예약 생성' })).toBeVisible()
    
    // 4. 예약 설정 입력
    await page.getByLabel('보고서 유형').selectOption('수입/지출 보고서')
    await page.getByLabel('생성 주기').selectOption('매월')
    await page.getByLabel('생성일').fill('1')
    await page.getByLabel('생성 시간').fill('09:00')
    
    // 5. 수신자 설정
    await page.getByLabel('이메일 수신자').fill('admin@example.com')
    await page.getByLabel('보고서 형식').selectOption('PDF')
    
    // 6. 예약 활성화
    await page.getByLabel('예약 활성화').check()
    
    // 7. 예약 저장 버튼 클릭
    await page.getByRole('button', { name: '예약 저장' }).click()
    
    // 8. 예약 저장 완료 확인
    await expect(page.getByText('보고서 예약이 설정되었습니다')).toBeVisible()
    
    // 9. 예약 목록에 새 예약 표시 확인
    await expect(page.getByText('매월 수입/지출 보고서')).toBeVisible()
    
    // 10. 예약 테스트 실행
    await page.getByRole('button', { name: '테스트 실행' }).first().click()
    
    // 11. 테스트 실행 확인 모달
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('예약된 보고서를 지금 생성하시겠습니까?')).toBeVisible()
    
    // 12. 테스트 실행 확인
    await page.getByRole('button', { name: '실행' }).click()
    
    // 13. 테스트 실행 완료 확인
    await expect(page.getByText('테스트 보고서가 생성되었습니다')).toBeVisible()
  })

  test('보고서 공유 및 권한 관리', async ({ page }) => {
    // 1. 보고서 탭으로 이동
    await page.getByRole('tab', { name: '보고서' }).click()
    
    // 2. 보고서 공유 버튼 클릭
    await page.getByRole('button', { name: '보고서 공유' }).click()
    
    // 3. 공유 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '보고서 공유' })).toBeVisible()
    
    // 4. 공유 설정 입력
    await page.getByLabel('공유 대상').fill('manager@example.com')
    await page.getByLabel('공유 권한').selectOption('읽기 전용')
    await page.getByLabel('만료일').fill('2024-12-31')
    
    // 5. 공유 메시지 입력
    await page.getByLabel('공유 메시지').fill('재무 보고서를 공유합니다.')
    
    // 6. 공유 실행 버튼 클릭
    await page.getByRole('button', { name: '공유 실행' }).click()
    
    // 7. 공유 완료 확인
    await expect(page.getByText('보고서가 공유되었습니다')).toBeVisible()
    
    // 8. 공유 링크 생성
    await page.getByRole('button', { name: '공유 링크 생성' }).click()
    
    // 9. 공유 링크 설정
    await page.getByLabel('링크 권한').selectOption('읽기 전용')
    await page.getByLabel('비밀번호 보호').check()
    await page.getByLabel('비밀번호').fill('secure123')
    
    // 10. 링크 생성
    await page.getByRole('button', { name: '링크 생성' }).click()
    
    // 11. 공유 링크 생성 완료 확인
    await expect(page.getByText('공유 링크가 생성되었습니다')).toBeVisible()
    
    // 12. 생성된 링크 복사
    await page.getByRole('button', { name: '링크 복사' }).click()
    
    // 13. 링크 복사 완료 확인
    await expect(page.getByText('링크가 클립보드에 복사되었습니다')).toBeVisible()
  })
})
