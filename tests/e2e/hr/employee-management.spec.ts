import { expect, test } from '@playwright/test'

test.describe('HR 관리 - 직원 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 HR 관리 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/hr')
  })

  test('직원 목록 조회 및 표시', async ({ page }) => {
    // 1. HR 관리 페이지 로드 확인
    await expect(page.getByRole('heading', { name: 'HR 관리' })).toBeVisible()
    
    // 2. 직원 관리 탭 클릭
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 3. 직원 목록 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '부서' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '직급' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '입사일' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '연락처' })).toBeVisible()
  })

  test('새 직원 등록 플로우', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 새 직원 등록 버튼 클릭
    await page.getByRole('button', { name: '새 직원 등록' }).click()
    
    // 3. 직원 등록 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 직원 등록' })).toBeVisible()
    
    // 4. 기본 정보 입력
    await page.getByLabel('이름').fill('김테스트')
    await page.getByLabel('영문명').fill('Test Kim')
    await page.getByLabel('이메일').fill('test.kim@example.com')
    await page.getByLabel('전화번호').fill('010-1234-5678')
    
    // 5. 부서 및 직급 정보 입력
    await page.getByLabel('부서').selectOption('개발팀')
    await page.getByLabel('직급').selectOption('대리')
    await page.getByLabel('직책').fill('백엔드 개발자')
    
    // 6. 입사 정보 입력
    await page.getByLabel('입사일').fill('2024-01-15')
    await page.getByLabel('계약 유형').selectOption('정규직')
    await page.getByLabel('근무 형태').selectOption('정규 근무')
    
    // 7. 급여 정보 입력
    await page.getByLabel('기본급').fill('40000000')
    await page.getByLabel('수당').fill('5000000')
    
    // 8. 주소 정보 입력
    await page.getByLabel('주소').fill('서울시 강남구 테헤란로 123')
    await page.getByLabel('우편번호').fill('06292')
    
    // 9. 비상연락처 입력
    await page.getByLabel('비상연락처').fill('010-9876-5432')
    await page.getByLabel('비상연락처 관계').fill('배우자')
    
    // 10. 등록 버튼 클릭
    await page.getByRole('button', { name: '직원 등록' }).click()
    
    // 11. 성공 메시지 확인
    await expect(page.getByText('직원이 성공적으로 등록되었습니다')).toBeVisible()
    
    // 12. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()
    
    // 13. 직원 목록에 새 직원 표시 확인
    await expect(page.getByText('김테스트')).toBeVisible()
    await expect(page.getByText('개발팀')).toBeVisible()
  })

  test('직원 정보 수정 플로우', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 기존 직원 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()
    
    // 3. 직원 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '직원 정보 수정' })).toBeVisible()
    
    // 4. 부서 정보 수정
    await page.getByLabel('부서').selectOption('마케팅팀')
    
    // 5. 직급 정보 수정
    await page.getByLabel('직급').selectOption('과장')
    
    // 6. 급여 정보 수정
    await page.getByLabel('기본급').clear()
    await page.getByLabel('기본급').fill('45000000')
    
    // 7. 수정 저장 버튼 클릭
    await page.getByRole('button', { name: '수정 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('직원 정보가 성공적으로 수정되었습니다')).toBeVisible()
    
    // 9. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('마케팅팀')).toBeVisible()
    await expect(page.getByText('과장')).toBeVisible()
  })

  test('직원 검색 및 필터링', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 이름으로 검색
    await page.getByPlaceholder('이름, 이메일로 검색...').fill('김')
    await page.keyboard.press('Enter')
    
    // 3. 검색 결과 확인
    await expect(page.getByText('검색 결과')).toBeVisible()
    
    // 4. 부서별 필터링
    await page.getByRole('button', { name: '부서 필터' }).click()
    await page.getByRole('menuitem', { name: '개발팀' }).click()
    
    // 5. 개발팀 직원만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외
    
    // 6. 직급별 필터링
    await page.getByRole('button', { name: '직급 필터' }).click()
    await page.getByRole('menuitem', { name: '대리' }).click()
    
    // 7. 대리급 직원만 표시되는지 확인
    await expect(page.getByText('대리급 직원만 표시됩니다')).toBeVisible()
    
    // 8. 상태별 필터링
    await page.getByRole('button', { name: '상태 필터' }).click()
    await page.getByRole('menuitem', { name: '재직' }).click()
    
    // 9. 재직 직원만 표시되는지 확인
    await expect(page.getByText('재직 직원만 표시됩니다')).toBeVisible()
  })

  test('직원 상세 정보 보기', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 직원 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행
    
    // 3. 직원 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '직원 상세 정보' })).toBeVisible()
    
    // 4. 상세 정보 탭들 확인
    await expect(page.getByRole('tab', { name: '기본 정보' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '근무 정보' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '급여 정보' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '출근 기록' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '휴가 기록' })).toBeVisible()
    
    // 5. 기본 정보 탭 내용 확인
    await expect(page.getByText('개인 정보')).toBeVisible()
    await expect(page.getByText('연락처 정보')).toBeVisible()
    await expect(page.getByText('주소 정보')).toBeVisible()
    
    // 6. 근무 정보 탭 클릭
    await page.getByRole('tab', { name: '근무 정보' }).click()
    
    // 7. 근무 정보 내용 확인
    await expect(page.getByText('부서 정보')).toBeVisible()
    await expect(page.getByText('직급 정보')).toBeVisible()
    await expect(page.getByText('계약 정보')).toBeVisible()
    
    // 8. 모달 닫기 버튼 클릭
    await page.getByRole('button', { name: '닫기' }).click()
    
    // 9. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('직원 상태 변경 (퇴사 처리)', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 직원 상태 변경 버튼 클릭
    await page.getByRole('button', { name: '상태 변경' }).first().click()
    
    // 3. 상태 변경 옵션 확인
    await expect(page.getByRole('menuitem', { name: '재직' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '휴직' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '퇴사' })).toBeVisible()
    
    // 4. 퇴사 선택
    await page.getByRole('menuitem', { name: '퇴사' }).click()
    
    // 5. 퇴사 처리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('직원 퇴사 처리')).toBeVisible()
    
    // 6. 퇴사 정보 입력
    await page.getByLabel('퇴사일').fill('2024-12-31')
    await page.getByLabel('퇴사 사유').selectOption('개인 사정')
    await page.getByLabel('퇴사 메모').fill('개인적인 사정으로 인한 퇴사')
    
    // 7. 퇴사 처리 버튼 클릭
    await page.getByRole('button', { name: '퇴사 처리' }).click()
    
    // 8. 최종 확인 모달 표시
    await expect(page.getByText('정말로 이 직원을 퇴사 처리하시겠습니까?')).toBeVisible()
    
    // 9. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()
    
    // 10. 성공 메시지 확인
    await expect(page.getByText('직원이 퇴사 처리되었습니다')).toBeVisible()
    
    // 11. 직원 상태가 퇴사로 변경되었는지 확인
    await expect(page.getByText('퇴사')).toBeVisible()
  })

  test('직원 일괄 처리', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 여러 직원 선택
    await page.getByRole('checkbox', { name: '선택' }).nth(1).check()
    await page.getByRole('checkbox', { name: '선택' }).nth(2).check()
    
    // 3. 일괄 작업 버튼 표시 확인
    await expect(page.getByRole('button', { name: '일괄 상태 변경' })).toBeVisible()
    await expect(page.getByRole('button', { name: '일괄 부서 이동' })).toBeVisible()
    await expect(page.getByRole('button', { name: '일괄 내보내기' })).toBeVisible()
    
    // 4. 일괄 부서 이동 클릭
    await page.getByRole('button', { name: '일괄 부서 이동' }).click()
    
    // 5. 일괄 처리 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '일괄 부서 이동' })).toBeVisible()
    
    // 6. 대상 부서 선택
    await page.getByLabel('이동할 부서').selectOption('운영팀')
    
    // 7. 이동 사유 입력
    await page.getByLabel('이동 사유').fill('조직 개편에 따른 부서 이동')
    
    // 8. 일괄 처리 실행 버튼 클릭
    await page.getByRole('button', { name: '일괄 처리 실행' }).click()
    
    // 9. 성공 메시지 확인
    await expect(page.getByText('선택된 직원들의 부서가 이동되었습니다')).toBeVisible()
  })

  test('직원 내보내기 기능', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
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
    await expect(page.getByRole('heading', { name: '직원 정보 내보내기 설정' })).toBeVisible()
    
    // 6. 내보낼 필드 선택
    await page.getByLabel('기본 정보').check()
    await page.getByLabel('부서 정보').check()
    await page.getByLabel('급여 정보').check()
    
    // 7. 필터 적용
    await page.getByLabel('재직 직원만').check()
    await page.getByLabel('개발팀만').check()
    
    // 8. 내보내기 실행 버튼 클릭
    await page.getByRole('button', { name: '내보내기 실행' }).click()
    
    // 9. 내보내기 진행 상태 확인
    await expect(page.getByText('데이터를 내보내는 중...')).toBeVisible()
    
    // 10. 완료 메시지 확인
    await expect(page.getByText('내보내기가 완료되었습니다')).toBeVisible()
  })

  test('직원 통계 및 분석', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 통계 버튼 클릭
    await page.getByRole('button', { name: '직원 통계' }).click()
    
    // 3. 통계 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '직원 통계' })).toBeVisible()
    
    // 4. 통계 카드들 확인
    await expect(page.getByText('총 직원 수')).toBeVisible()
    await expect(page.getByText('재직 직원 수')).toBeVisible()
    await expect(page.getByText('신입 직원 수')).toBeVisible()
    await expect(page.getByText('평균 근무 연수')).toBeVisible()
    
    // 5. 차트 섹션 확인
    await expect(page.getByText('부서별 직원 분포')).toBeVisible()
    await expect(page.getByText('직급별 분포')).toBeVisible()
    await expect(page.getByText('입사 연도별 분포')).toBeVisible()
    
    // 6. 기간 필터 확인
    await page.getByLabel('분석 기간').selectOption('최근 1년')
    
    // 7. 차트 업데이트 확인
    await expect(page.getByText('통계가 업데이트되었습니다')).toBeVisible()
  })

  test('직원 프로필 이미지 관리', async ({ page }) => {
    // 1. 직원 상세 정보 열기
    await page.getByRole('tab', { name: '직원 관리' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 프로필 이미지 영역 확인
    await expect(page.getByRole('img', { name: '프로필 이미지' })).toBeVisible()
    
    // 3. 이미지 변경 버튼 클릭
    await page.getByRole('button', { name: '이미지 변경' }).click()
    
    // 4. 이미지 업로드 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '프로필 이미지 변경' })).toBeVisible()
    
    // 5. 파일 선택
    const fileInput = page.getByLabel('이미지 파일 선택')
    await fileInput.setInputFiles({
      name: 'profile.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })
    
    // 6. 이미지 미리보기 확인
    await expect(page.getByRole('img', { name: '이미지 미리보기' })).toBeVisible()
    
    // 7. 업로드 버튼 클릭
    await page.getByRole('button', { name: '업로드' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('프로필 이미지가 업데이트되었습니다')).toBeVisible()
    
    // 9. 새로운 이미지가 표시되는지 확인
    await expect(page.getByRole('img', { name: '프로필 이미지' })).toBeVisible()
  })

  test('직원 조직도 보기', async ({ page }) => {
    // 1. 직원 관리 탭으로 이동
    await page.getByRole('tab', { name: '직원 관리' }).click()
    
    // 2. 조직도 보기 버튼 클릭
    await page.getByRole('button', { name: '조직도 보기' }).click()
    
    // 3. 조직도 페이지로 이동 확인
    await expect(page.getByRole('heading', { name: '조직도' })).toBeVisible()
    
    // 4. 조직도 차트 표시 확인
    await expect(page.locator('[data-testid="org-chart"]')).toBeVisible()
    
    // 5. 부서 노드 클릭
    await page.locator('[data-testid="org-chart"] .department-node').first().click()
    
    // 6. 부서 상세 정보 표시 확인
    await expect(page.getByText('부서 상세 정보')).toBeVisible()
    
    // 7. 직원 노드 클릭
    await page.locator('[data-testid="org-chart"] .employee-node').first().click()
    
    // 8. 직원 상세 정보 표시 확인
    await expect(page.getByText('직원 상세 정보')).toBeVisible()
    
    // 9. 확대/축소 기능 테스트
    await page.getByRole('button', { name: '확대' }).click()
    await page.getByRole('button', { name: '축소' }).click()
    
    // 10. 전체 보기 기능 테스트
    await page.getByRole('button', { name: '전체 보기' }).click()
  })

  test('직원 이력 관리', async ({ page }) => {
    // 1. 직원 상세 정보 열기
    await page.getByRole('tab', { name: '직원 관리' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 이력 관리 탭 클릭
    await page.getByRole('tab', { name: '이력 관리' }).click()
    
    // 3. 이력 목록 표시 확인
    await expect(page.getByText('직급 변경 이력')).toBeVisible()
    await expect(page.getByText('부서 이동 이력')).toBeVisible()
    await expect(page.getByText('급여 변경 이력')).toBeVisible()
    
    // 4. 새 이력 추가 버튼 클릭
    await page.getByRole('button', { name: '새 이력 추가' }).click()
    
    // 5. 이력 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 이력 추가' })).toBeVisible()
    
    // 6. 이력 정보 입력
    await page.getByLabel('이력 유형').selectOption('직급 변경')
    await page.getByLabel('변경일').fill('2024-01-01')
    await page.getByLabel('이전 직급').fill('대리')
    await page.getByLabel('새 직급').fill('과장')
    await page.getByLabel('변경 사유').fill('성과에 따른 승진')
    
    // 7. 이력 저장 버튼 클릭
    await page.getByRole('button', { name: '이력 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('이력이 추가되었습니다')).toBeVisible()
    
    // 9. 새 이력이 목록에 표시되는지 확인
    await expect(page.getByText('과장')).toBeVisible()
    await expect(page.getByText('성과에 따른 승진')).toBeVisible()
  })

  test('직원 권한 관리', async ({ page }) => {
    // 1. 직원 상세 정보 열기
    await page.getByRole('tab', { name: '직원 관리' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 권한 관리 탭 클릭
    await page.getByRole('tab', { name: '권한 관리' }).click()
    
    // 3. 권한 목록 표시 확인
    await expect(page.getByText('시스템 권한')).toBeVisible()
    await expect(page.getByText('부서 권한')).toBeVisible()
    await expect(page.getByText('기능 권한')).toBeVisible()
    
    // 4. 권한 수정 버튼 클릭
    await page.getByRole('button', { name: '권한 수정' }).click()
    
    // 5. 권한 수정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '권한 수정' })).toBeVisible()
    
    // 6. 권한 설정
    await page.getByLabel('HR 관리').check()
    await page.getByLabel('급여 관리').check()
    await page.getByLabel('출근 관리').uncheck()
    
    // 7. 권한 저장 버튼 클릭
    await page.getByRole('button', { name: '권한 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('권한이 수정되었습니다')).toBeVisible()
    
    // 9. 변경된 권한이 반영되었는지 확인
    await expect(page.getByText('HR 관리: 허용')).toBeVisible()
    await expect(page.getByText('급여 관리: 허용')).toBeVisible()
    await expect(page.getByText('출근 관리: 거부')).toBeVisible()
  })

  test('직원 알림 설정', async ({ page }) => {
    // 1. 직원 상세 정보 열기
    await page.getByRole('tab', { name: '직원 관리' }).click()
    await page.getByRole('row').nth(1).click()
    
    // 2. 알림 설정 탭 클릭
    await page.getByRole('tab', { name: '알림 설정' }).click()
    
    // 3. 알림 설정 섹션 확인
    await expect(page.getByText('이메일 알림')).toBeVisible()
    await expect(page.getByText('SMS 알림')).toBeVisible()
    await expect(page.getByText('푸시 알림')).toBeVisible()
    
    // 4. 알림 설정 변경
    await page.getByLabel('급여 지급 알림').check()
    await page.getByLabel('휴가 신청 알림').check()
    await page.getByLabel('출근 체크 알림').uncheck()
    
    // 5. 알림 방법 설정
    await page.getByLabel('이메일 알림').check()
    await page.getByLabel('SMS 알림').uncheck()
    
    // 6. 알림 시간 설정
    await page.getByLabel('알림 시간').selectOption('09:00')
    
    // 7. 설정 저장 버튼 클릭
    await page.getByRole('button', { name: '설정 저장' }).click()
    
    // 8. 성공 메시지 확인
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
    
    // 9. 테스트 알림 전송
    await page.getByRole('button', { name: '테스트 알림' }).click()
    
    // 10. 테스트 알림 전송 완료 확인
    await expect(page.getByText('테스트 알림이 전송되었습니다')).toBeVisible()
  })
})
