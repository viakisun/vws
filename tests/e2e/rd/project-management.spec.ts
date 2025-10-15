import { expect, test } from '@playwright/test'

test.describe('R&D 관리 - 프로젝트 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 R&D 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/research-development')
  })

  test('R&D 프로젝트 목록 조회 및 표시', async ({ page }) => {
    // 1. R&D 관리 페이지 로드 확인
    await expect(page.getByRole('heading', { name: 'R&D 관리' })).toBeVisible()

    // 2. 프로젝트 관리 탭 클릭
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 3. 프로젝트 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '프로젝트명' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '연구 분야' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '담당자' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '시작일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '종료일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '진행률' })).toBeVisible()
  })

  test('새 R&D 프로젝트 생성 플로우', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 새 프로젝트 생성 버튼 클릭
    await page.getByRole('button', { name: '새 프로젝트 생성' }).click()

    // 3. 프로젝트 생성 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 R&D 프로젝트 생성' })).toBeVisible()

    // 4. 기본 정보 입력
    await page.getByLabel('프로젝트명').fill('AI 기반 데이터 분석 시스템 개발')
    await page.getByLabel('연구 분야').selectOption('인공지능')
    await page.getByLabel('프로젝트 유형').selectOption('기술개발')
    await page.getByLabel('프로젝트 코드').fill('R&D-2024-001')

    // 5. 프로젝트 기간 설정
    await page.getByLabel('시작일').fill('2024-01-01')
    await page.getByLabel('종료일').fill('2024-12-31')
    await page.getByLabel('예상 기간').fill('12개월')

    // 6. 담당자 및 팀 정보
    await page.getByLabel('프로젝트 매니저').selectOption('김연구')
    await page.getByLabel('주담당자').selectOption('이개발')
    await page.getByLabel('부담당자').selectOption('박분석')

    // 7. 프로젝트 설명 입력
    await page.getByLabel('프로젝트 개요').fill('머신러닝을 활용한 대용량 데이터 분석 시스템 개발')
    await page.getByLabel('연구 목표').fill('데이터 처리 속도 50% 향상 및 정확도 95% 달성')
    await page.getByLabel('기대 효과').fill('업무 효율성 향상 및 비용 절감')

    // 8. 예산 정보 입력
    await page.getByLabel('총 예산').fill('500000000')
    await page.getByLabel('월간 예산').fill('41666667')

    // 9. 프로젝트 생성 버튼 클릭
    await page.getByRole('button', { name: '프로젝트 생성' }).click()

    // 10. 성공 메시지 확인
    await expect(page.getByText('프로젝트가 성공적으로 생성되었습니다')).toBeVisible()

    // 11. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 12. 프로젝트 목록에 새 프로젝트 표시 확인
    await expect(page.getByText('AI 기반 데이터 분석 시스템 개발')).toBeVisible()
    await expect(page.getByText('인공지능')).toBeVisible()
    await expect(page.getByText('진행중')).toBeVisible()
  })

  test('프로젝트 정보 수정 플로우', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 기존 프로젝트 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()

    // 3. 프로젝트 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '프로젝트 정보 수정' })).toBeVisible()

    // 4. 프로젝트명 수정
    await page.getByLabel('프로젝트명').clear()
    await page.getByLabel('프로젝트명').fill('AI 기반 데이터 분석 플랫폼 개발')

    // 5. 예산 수정
    await page.getByLabel('총 예산').clear()
    await page.getByLabel('총 예산').fill('600000000')

    // 6. 연구 목표 수정
    await page.getByLabel('연구 목표').clear()
    await page.getByLabel('연구 목표').fill('데이터 처리 속도 70% 향상 및 정확도 98% 달성')

    // 7. 수정 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('프로젝트 정보가 성공적으로 수정되었습니다')).toBeVisible()

    // 9. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('AI 기반 데이터 분석 플랫폼 개발')).toBeVisible()
  })

  test('프로젝트 상태 변경 플로우', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 프로젝트 상태 변경 버튼 클릭
    await page.getByRole('button', { name: '상태 변경' }).first().click()

    // 3. 상태 변경 옵션 확인
    await expect(page.getByRole('menuitem', { name: '진행중' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '완료' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '보류' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '취소' })).toBeVisible()

    // 4. 완료 상태로 변경
    await page.getByRole('menuitem', { name: '완료' }).click()

    // 5. 상태 변경 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('프로젝트 상태 변경')).toBeVisible()

    // 6. 완료 정보 입력
    await page.getByLabel('완료일').fill('2024-12-15')
    await page.getByLabel('완료 사유').fill('목표 달성 및 성과 검증 완료')
    await page.getByLabel('최종 결과').fill('모든 연구 목표 달성 및 상용화 준비 완료')

    // 7. 완료 처리 버튼 클릭
    await page.getByRole('button', { name: '완료 처리' }).click()

    // 8. 최종 확인 모달 표시
    await expect(page.getByText('정말로 이 프로젝트를 완료 처리하시겠습니까?')).toBeVisible()

    // 9. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 10. 성공 메시지 확인
    await expect(page.getByText('프로젝트가 완료 처리되었습니다')).toBeVisible()

    // 11. 프로젝트 상태가 완료로 변경되었는지 확인
    await expect(page.getByText('완료')).toBeVisible()
  })

  test('프로젝트 검색 및 필터링', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 프로젝트명으로 검색
    await page.getByPlaceholder('프로젝트명, 담당자로 검색...').fill('AI')
    await page.keyboard.press('Enter')

    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 4. 연구 분야별 필터링
    await page.getByRole('button', { name: '연구 분야 필터' }).click()
    await page.getByRole('menuitem', { name: '인공지능' }).click()

    // 5. 인공지능 프로젝트만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외

    // 6. 상태별 필터링
    await page.getByRole('button', { name: '상태 필터' }).click()
    await page.getByRole('menuitem', { name: '진행중' }).click()

    // 7. 진행중인 프로젝트만 표시되는지 확인
    await expect(page.getByText('진행중인 프로젝트만 표시됩니다')).toBeVisible()

    // 8. 기간별 필터링
    await page.getByRole('button', { name: '기간 필터' }).click()
    await page.getByRole('menuitem', { name: '2024년' }).click()

    // 9. 2024년 프로젝트만 표시되는지 확인
    await expect(page.getByText('2024년 프로젝트만 표시됩니다')).toBeVisible()
  })

  test('프로젝트 상세 정보 보기', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 프로젝트 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행

    // 3. 프로젝트 상세 정보 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '프로젝트 상세 정보' })).toBeVisible()

    // 4. 상세 정보 탭들 확인
    await expect(page.getByRole('tab', { name: '기본 정보' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '진행 현황' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '예산 현황' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '팀 구성' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '성과 자료' })).toBeVisible()

    // 5. 기본 정보 탭 내용 확인
    await expect(page.getByText('프로젝트 개요')).toBeVisible()
    await expect(page.getByText('연구 목표')).toBeVisible()
    await expect(page.getByText('기대 효과')).toBeVisible()

    // 6. 진행 현황 탭 클릭
    await page.getByRole('tab', { name: '진행 현황' }).click()

    // 7. 진행 현황 내용 확인
    await expect(page.getByText('전체 진행률')).toBeVisible()
    await expect(page.getByText('마일스톤 현황')).toBeVisible()
    await expect(page.getByText('일정 현황')).toBeVisible()

    // 8. 예산 현황 탭 클릭
    await page.getByRole('tab', { name: '예산 현황' }).click()

    // 9. 예산 현황 내용 확인
    await expect(page.getByText('총 예산')).toBeVisible()
    await expect(page.getByText('사용 예산')).toBeVisible()
    await expect(page.getByText('잔여 예산')).toBeVisible()
    await expect(page.getByText('예산 사용률')).toBeVisible()
  })

  test('프로젝트 일정 관리', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 일정 관리 탭 클릭
    await page.getByRole('tab', { name: '일정 관리' }).click()

    // 3. 일정 관리 섹션 표시 확인
    await expect(page.getByText('프로젝트 일정')).toBeVisible()
    await expect(page.getByText('마일스톤 관리')).toBeVisible()
    await expect(page.getByText('작업 일정')).toBeVisible()

    // 4. 새 마일스톤 추가 버튼 클릭
    await page.getByRole('button', { name: '새 마일스톤 추가' }).click()

    // 5. 마일스톤 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 마일스톤 추가' })).toBeVisible()

    // 6. 마일스톤 정보 입력
    await page.getByLabel('마일스톤명').fill('데이터 모델 설계 완료')
    await page.getByLabel('목표일').fill('2024-03-31')
    await page.getByLabel('설명').fill('머신러닝 모델 설계 및 검증 완료')
    await page.getByLabel('우선순위').selectOption('높음')

    // 7. 마일스톤 저장 버튼 클릭
    await page.getByRole('button', { name: '마일스톤 저장' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('마일스톤이 추가되었습니다')).toBeVisible()

    // 9. 새 작업 추가 버튼 클릭
    await page.getByRole('button', { name: '새 작업 추가' }).click()

    // 10. 작업 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 작업 추가' })).toBeVisible()

    // 11. 작업 정보 입력
    await page.getByLabel('작업명').fill('데이터 전처리 모듈 개발')
    await page.getByLabel('담당자').selectOption('이개발')
    await page.getByLabel('시작일').fill('2024-02-01')
    await page.getByLabel('종료일').fill('2024-02-28')
    await page.getByLabel('진행률').fill('0')

    // 12. 작업 저장 버튼 클릭
    await page.getByRole('button', { name: '작업 저장' }).click()

    // 13. 성공 메시지 확인
    await expect(page.getByText('작업이 추가되었습니다')).toBeVisible()
  })

  test('프로젝트 예산 관리', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 예산 현황 탭 클릭
    await page.getByRole('tab', { name: '예산 현황' }).click()

    // 3. 예산 현황 섹션 표시 확인
    await expect(page.getByText('예산 요약')).toBeVisible()
    await expect(page.getByText('예산 사용 내역')).toBeVisible()
    await expect(page.getByText('예산 계획')).toBeVisible()

    // 4. 예산 사용 내역 추가 버튼 클릭
    await page.getByRole('button', { name: '예산 사용 내역 추가' }).click()

    // 5. 예산 사용 내역 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 사용 내역 추가' })).toBeVisible()

    // 6. 예산 사용 내역 입력
    await page.getByLabel('사용일').fill('2024-02-15')
    await page.getByLabel('사용 항목').selectOption('인건비')
    await page.getByLabel('사용 금액').fill('10000000')
    await page.getByLabel('사용 사유').fill('개발자 인건비 지급')
    await page.getByLabel('승인자').selectOption('김연구')

    // 7. 예산 사용 내역 저장 버튼 클릭
    await page.getByRole('button', { name: '사용 내역 저장' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('예산 사용 내역이 추가되었습니다')).toBeVisible()

    // 9. 예산 계획 수정 버튼 클릭
    await page.getByRole('button', { name: '예산 계획 수정' }).click()

    // 10. 예산 계획 수정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '예산 계획 수정' })).toBeVisible()

    // 11. 예산 계획 수정
    await page.getByLabel('인건비').clear()
    await page.getByLabel('인건비').fill('300000000')
    await page.getByLabel('장비비').clear()
    await page.getByLabel('장비비').fill('100000000')
    await page.getByLabel('재료비').clear()
    await page.getByLabel('재료비').fill('100000000')

    // 12. 예산 계획 저장 버튼 클릭
    await page.getByRole('button', { name: '예산 계획 저장' }).click()

    // 13. 성공 메시지 확인
    await expect(page.getByText('예산 계획이 수정되었습니다')).toBeVisible()
  })

  test('프로젝트 팀 구성 관리', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 팀 구성 탭 클릭
    await page.getByRole('tab', { name: '팀 구성' }).click()

    // 3. 팀 구성 섹션 표시 확인
    await expect(page.getByText('팀 구성원')).toBeVisible()
    await expect(page.getByText('역할 및 책임')).toBeVisible()
    await expect(page.getByText('참여 기간')).toBeVisible()

    // 4. 팀원 추가 버튼 클릭
    await page.getByRole('button', { name: '팀원 추가' }).click()

    // 5. 팀원 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '팀원 추가' })).toBeVisible()

    // 6. 팀원 정보 입력
    await page.getByLabel('팀원 선택').selectOption('최연구')
    await page.getByLabel('역할').selectOption('연구원')
    await page.getByLabel('참여 시작일').fill('2024-02-01')
    await page.getByLabel('참여 종료일').fill('2024-11-30')
    await page.getByLabel('참여율').fill('100')
    await page.getByLabel('담당 업무').fill('데이터 분석 및 모델 검증')

    // 7. 팀원 추가 버튼 클릭
    await page.getByRole('button', { name: '팀원 추가' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('팀원이 추가되었습니다')).toBeVisible()

    // 9. 팀원 정보 수정
    await page.getByRole('button', { name: '편집' }).first().click()

    // 10. 팀원 정보 수정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '팀원 정보 수정' })).toBeVisible()

    // 11. 참여율 수정
    await page.getByLabel('참여율').clear()
    await page.getByLabel('참여율').fill('80')

    // 12. 수정 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()

    // 13. 성공 메시지 확인
    await expect(page.getByText('팀원 정보가 수정되었습니다')).toBeVisible()
  })

  test('프로젝트 성과 자료 관리', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 성과 자료 탭 클릭
    await page.getByRole('tab', { name: '성과 자료' }).click()

    // 3. 성과 자료 섹션 표시 확인
    await expect(page.getByText('논문 및 특허')).toBeVisible()
    await expect(page.getByText('프로토타입')).toBeVisible()
    await expect(page.getByText('기술 문서')).toBeVisible()
    await expect(page.getByText('데모 영상')).toBeVisible()

    // 4. 새 성과 자료 추가 버튼 클릭
    await page.getByRole('button', { name: '새 성과 자료 추가' }).click()

    // 5. 성과 자료 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 성과 자료 추가' })).toBeVisible()

    // 6. 성과 자료 정보 입력
    await page.getByLabel('성과 유형').selectOption('논문')
    await page.getByLabel('제목').fill('딥러닝 기반 데이터 분석 알고리즘 연구')
    await page.getByLabel('저자').fill('김연구, 이개발')
    await page.getByLabel('발표일').fill('2024-06-15')
    await page.getByLabel('발표처').fill('한국정보과학회')
    await page.getByLabel('설명').fill('프로젝트 핵심 알고리즘에 대한 연구 논문')

    // 7. 성과 자료 저장 버튼 클릭
    await page.getByRole('button', { name: '성과 자료 저장' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('성과 자료가 추가되었습니다')).toBeVisible()

    // 9. 파일 업로드 테스트
    await page.getByRole('button', { name: '파일 업로드' }).click()

    // 10. 파일 선택
    const fileInput = page.getByLabel('파일 선택')
    await fileInput.setInputFiles({
      name: 'research_paper.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data'),
    })

    // 11. 파일 업로드 버튼 클릭
    await page.getByRole('button', { name: '업로드' }).click()

    // 12. 업로드 완료 메시지 확인
    await expect(page.getByText('파일이 업로드되었습니다')).toBeVisible()
  })

  test('프로젝트 보고서 생성', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '보고서 생성' }).click()

    // 3. 보고서 생성 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '프로젝트 보고서 생성' })).toBeVisible()

    // 4. 보고서 유형 선택
    await page.getByLabel('보고서 유형').selectOption('진행 보고서')
    await page.getByLabel('보고 기간').selectOption('2024년 1분기')

    // 5. 포함할 섹션 선택
    await page.getByLabel('프로젝트 개요').check()
    await page.getByLabel('진행 현황').check()
    await page.getByLabel('예산 현황').check()
    await page.getByLabel('성과 자료').check()
    await page.getByLabel('다음 계획').check()

    // 6. 보고서 생성 버튼 클릭
    await page.getByRole('button', { name: '보고서 생성' }).click()

    // 7. 보고서 생성 진행 상태 확인
    await expect(page.getByText('보고서를 생성하는 중...')).toBeVisible()

    // 8. 보고서 생성 완료 확인
    await expect(page.getByText('보고서가 생성되었습니다')).toBeVisible()

    // 9. 생성된 보고서 미리보기 확인
    await expect(page.getByText('보고서 미리보기')).toBeVisible()
    await expect(page.getByText('프로젝트 개요')).toBeVisible()
    await expect(page.getByText('진행 현황')).toBeVisible()
    await expect(page.getByText('예산 현황')).toBeVisible()

    // 10. 보고서 내보내기 버튼 클릭
    await page.getByRole('button', { name: '보고서 내보내기' }).click()

    // 11. 내보내기 옵션 선택
    await page.getByRole('menuitem', { name: 'PDF로 내보내기' }).click()

    // 12. PDF 생성 완료 확인
    await expect(page.getByText('PDF가 생성되었습니다')).toBeVisible()
  })

  test('프로젝트 통계 및 분석', async ({ page }) => {
    // 1. 프로젝트 관리 탭으로 이동
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()

    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '프로젝트 통계' }).click()

    // 3. 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'R&D 프로젝트 통계' })).toBeVisible()

    // 4. 통계 카드들 확인
    await expect(page.getByText('총 프로젝트 수')).toBeVisible()
    await expect(page.getByText('진행중인 프로젝트')).toBeVisible()
    await expect(page.getByText('완료된 프로젝트')).toBeVisible()
    await expect(page.getByText('총 예산')).toBeVisible()
    await expect(page.getByText('평균 프로젝트 기간')).toBeVisible()

    // 5. 차트 섹션 확인
    await expect(page.getByText('연구 분야별 분포')).toBeVisible()
    await expect(page.getByText('프로젝트 상태별 분포')).toBeVisible()
    await expect(page.getByText('월별 프로젝트 현황')).toBeVisible()
    await expect(page.getByText('예산 사용률 분포')).toBeVisible()

    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 1년')

    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()

    // 8. 상세 분석 버튼 클릭
    await page.getByRole('button', { name: '상세 분석' }).click()

    // 9. 상세 분석 결과 표시 확인
    await expect(page.getByText('프로젝트 성과 분석')).toBeVisible()
    await expect(page.getByText('예산 효율성 분석')).toBeVisible()
    await expect(page.getByText('팀 생산성 분석')).toBeVisible()
  })

  test('프로젝트 알림 및 리마인더', async ({ page }) => {
    // 1. 프로젝트 상세 정보 열기
    await page.getByRole('tab', { name: '프로젝트 관리' }).click()
    await page.getByRole('row').nth(1).click()

    // 2. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()

    // 3. 알림 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '프로젝트 알림 설정' })).toBeVisible()

    // 4. 알림 옵션 설정
    await page.getByLabel('마일스톤 알림').check()
    await page.getByLabel('예산 초과 알림').check()
    await page.getByLabel('일정 지연 알림').check()
    await page.getByLabel('보고서 제출 알림').check()

    // 5. 알림 시간 설정
    await page.getByLabel('알림 시간').selectOption('09:00')
    await page.getByLabel('알림 주기').selectOption('매주')

    // 6. 알림 방법 설정
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('SMS 알림').check()
    await page.getByLabel('푸시 알림').check()

    // 7. 알림 대상 설정
    await page.getByLabel('프로젝트 매니저').check()
    await page.getByLabel('팀원').check()
    await page.getByLabel('관리자').check()

    // 8. 설정 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()

    // 9. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()

    // 10. 테스트 알림 전송
    await page.getByRole('button', { name: '테스트 알림' }).click()

    // 11. 테스트 알림 전송 완료 확인
    await expect(page.getByText('테스트 알림이 전송되었습니다')).toBeVisible()
  })
})
