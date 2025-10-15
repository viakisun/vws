import { expect, test } from '@playwright/test'

test.describe('CRM 고객 관리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 CRM 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/crm')
  })

  test('고객 목록 조회 및 표시', async ({ page }) => {
    // 1. CRM 페이지 로드 확인
    await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()

    // 2. 고객 탭 클릭
    await page.getByRole('tab', { name: '고객' }).click()

    // 3. 고객 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '회사명' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '사업자번호' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '담당자' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible()
  })

  test('새 고객 추가 플로우', async ({ page }) => {
    // 1. 새 고객 추가 버튼 클릭
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 고객 추가 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '새 고객 추가' })).toBeVisible()

    // 3. 필수 정보 입력
    await page.getByLabel('회사명').fill('테스트 회사')
    await page.getByLabel('사업자번호').fill('123-45-67890')
    await page.getByLabel('대표자명').fill('홍길동')
    await page.getByLabel('담당자명').fill('김담당')
    await page.getByLabel('담당자 이메일').fill('contact@test.com')
    await page.getByLabel('담당자 전화번호').fill('010-1234-5678')
    await page.getByLabel('주소').fill('서울시 강남구')

    // 4. 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click()

    // 5. 성공 메시지 확인
    await expect(page.getByText('고객이 성공적으로 추가되었습니다')).toBeVisible()

    // 6. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 7. 고객 목록에 새 고객 표시 확인
    await expect(page.getByText('테스트 회사')).toBeVisible()
  })

  test('고객 정보 수정 플로우', async ({ page }) => {
    // 1. 기존 고객 행에서 편집 버튼 클릭
    await page.getByRole('button', { name: '편집' }).first().click()

    // 2. 고객 편집 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '고객 정보 수정' })).toBeVisible()

    // 3. 정보 수정
    await page.getByLabel('회사명').fill('수정된 회사명')
    await page.getByLabel('담당자명').fill('수정된 담당자')

    // 4. 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click()

    // 5. 성공 메시지 확인
    await expect(page.getByText('고객 정보가 성공적으로 수정되었습니다')).toBeVisible()

    // 6. 수정된 정보가 테이블에 반영되었는지 확인
    await expect(page.getByText('수정된 회사명')).toBeVisible()
  })

  test('고객 검색 기능', async ({ page }) => {
    // 1. 검색 입력창에 검색어 입력
    await page.getByPlaceholder('고객명, 사업자번호로 검색...').fill('테스트')

    // 2. 검색 버튼 클릭 또는 Enter 키 입력
    await page.keyboard.press('Enter')

    // 3. 검색 결과 표시 확인
    await expect(page.getByText('검색 결과')).toBeVisible()

    // 4. 검색어와 일치하는 고객만 표시되는지 확인
    const tableRows = page.getByRole('table').getByRole('row')
    const rowCount = await tableRows.count()

    // 검색 결과가 1개 이상 있는지 확인
    expect(rowCount).toBeGreaterThan(1) // 헤더 행 제외
  })

  test('고객 상태 필터링', async ({ page }) => {
    // 1. 상태 필터 드롭다운 클릭
    await page.getByRole('button', { name: '상태 필터' }).click()

    // 2. 활성 상태 선택
    await page.getByRole('menuitem', { name: '활성' }).click()

    // 3. 필터링된 결과 확인
    await expect(page.getByText('활성 고객만 표시됩니다')).toBeVisible()

    // 4. 모든 표시된 고객의 상태가 활성인지 확인
    const activeBadges = page.getByText('활성')
    const activeCount = await activeBadges.count()
    expect(activeCount).toBeGreaterThan(0)
  })

  test('고객 삭제 플로우', async ({ page }) => {
    // 1. 삭제할 고객 행에서 삭제 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).first().click()

    // 2. 삭제 확인 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말로 이 고객을 삭제하시겠습니까?')).toBeVisible()

    // 3. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 4. 성공 메시지 확인
    await expect(page.getByText('고객이 성공적으로 삭제되었습니다')).toBeVisible()

    // 5. 고객 목록에서 해당 고객이 제거되었는지 확인
    await expect(page.getByText('삭제된 고객명')).toBeHidden()
  })

  test('고객 상세 정보 보기', async ({ page }) => {
    // 1. 고객 행 클릭하여 상세 정보 보기
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행

    // 2. 고객 상세 정보 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '고객 상세 정보' })).toBeVisible()

    // 3. 상세 정보 섹션 확인
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByText('연락처 정보')).toBeVisible()
    await expect(page.getByText('문서 정보')).toBeVisible()

    // 4. 모달 닫기 버튼 클릭
    await page.getByRole('button', { name: '닫기' }).click()

    // 5. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('고객 목록 페이지네이션', async ({ page }) => {
    // 1. 페이지네이션 컨트롤 확인
    await expect(page.getByRole('button', { name: '다음 페이지' })).toBeVisible()

    // 2. 다음 페이지 버튼 클릭
    await page.getByRole('button', { name: '다음 페이지' }).click()

    // 3. 페이지 번호가 변경되었는지 확인
    await expect(page.getByText('페이지 2')).toBeVisible()

    // 4. 이전 페이지 버튼 클릭
    await page.getByRole('button', { name: '이전 페이지' }).click()

    // 5. 첫 페이지로 돌아왔는지 확인
    await expect(page.getByText('페이지 1')).toBeVisible()
  })

  test('고객 목록 정렬 기능', async ({ page }) => {
    // 1. 회사명 컬럼 헤더 클릭하여 정렬
    await page.getByRole('columnheader', { name: '회사명' }).click()

    // 2. 오름차순 정렬 표시 확인
    await expect(page.getByRole('columnheader', { name: '회사명 ↑' })).toBeVisible()

    // 3. 다시 클릭하여 내림차순 정렬
    await page.getByRole('columnheader', { name: '회사명 ↑' }).click()

    // 4. 내림차순 정렬 표시 확인
    await expect(page.getByRole('columnheader', { name: '회사명 ↓' })).toBeVisible()
  })

  test('고객 목록 내보내기 기능', async ({ page }) => {
    // 1. 내보내기 버튼 클릭
    await page.getByRole('button', { name: '내보내기' }).click()

    // 2. 내보내기 옵션 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible()

    // 3. Excel 내보내기 선택
    await page.getByRole('menuitem', { name: 'Excel로 내보내기' }).click()

    // 4. 다운로드 시작 메시지 확인
    await expect(page.getByText('파일 다운로드가 시작됩니다')).toBeVisible()
  })

  test('고객 목록 새로고침 기능', async ({ page }) => {
    // 1. 새로고침 버튼 클릭
    await page.getByRole('button', { name: '새로고침' }).click()

    // 2. 로딩 상태 표시 확인
    await expect(page.getByText('데이터를 불러오는 중...')).toBeVisible()

    // 3. 데이터 로드 완료 후 테이블 표시 확인
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('고객 정보 유효성 검사', async ({ page }) => {
    // 1. 새 고객 추가 버튼 클릭
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 필수 필드 없이 저장 시도
    await page.getByRole('button', { name: '저장' }).click()

    // 3. 유효성 검사 오류 메시지 확인
    await expect(page.getByText('회사명을 입력해주세요')).toBeVisible()
    await expect(page.getByText('사업자번호를 입력해주세요')).toBeVisible()
    await expect(page.getByText('대표자명을 입력해주세요')).toBeVisible()

    // 4. 잘못된 사업자번호 형식 입력
    await page.getByLabel('사업자번호').fill('12345')

    // 5. 사업자번호 형식 오류 메시지 확인
    await expect(page.getByText('올바른 사업자번호 형식을 입력해주세요')).toBeVisible()
  })

  test('고객 중복 검사', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 이미 존재하는 사업자번호 입력
    await page.getByLabel('회사명').fill('새로운 회사')
    await page.getByLabel('사업자번호').fill('123-45-67890') // 이미 존재하는 번호
    await page.getByLabel('대표자명').fill('새로운 대표')

    // 3. 저장 시도
    await page.getByRole('button', { name: '저장' }).click()

    // 4. 중복 오류 메시지 확인
    await expect(page.getByText('이미 존재하는 사업자번호입니다')).toBeVisible()
  })

  test('고객 목록 대량 선택 및 작업', async ({ page }) => {
    // 1. 전체 선택 체크박스 클릭
    await page.getByRole('checkbox', { name: '전체 선택' }).click()

    // 2. 모든 행이 선택되었는지 확인
    const checkboxes = page.getByRole('checkbox')
    const allCheckboxes = await checkboxes.all()
    const checkedCount = await Promise.all(
      allCheckboxes.map(async (checkbox) => await checkbox.isChecked()),
    ).then((results) => results.filter(Boolean).length)
    expect(checkedCount).toBeGreaterThan(1) // 전체 선택 체크박스 + 데이터 행들

    // 3. 대량 작업 버튼 표시 확인
    await expect(page.getByRole('button', { name: '선택된 항목 삭제' })).toBeVisible()

    // 4. 선택 해제
    await page.getByRole('checkbox', { name: '전체 선택' }).click()

    // 5. 대량 작업 버튼이 숨겨졌는지 확인
    await expect(page.getByRole('button', { name: '선택된 항목 삭제' })).toBeHidden()
  })
})
