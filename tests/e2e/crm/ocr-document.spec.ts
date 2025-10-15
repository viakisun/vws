import { expect, test } from '@playwright/test'

test.describe('CRM OCR 문서 처리 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 CRM 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/crm')
  })

  test('사업자등록증 업로드 및 OCR 처리', async ({ page }) => {
    // 1. 새 고객 추가 버튼 클릭
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 사업자등록증 업로드 영역 확인
    await expect(page.getByText('사업자등록증 업로드')).toBeVisible()

    // 3. 파일 업로드 영역 클릭
    await page.getByRole('button', { name: '파일 선택' }).click()

    // 4. 테스트용 사업자등록증 파일 선택
    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')

    // 5. OCR 처리 버튼 클릭
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 6. OCR 처리 중 로딩 상태 확인
    await expect(page.getByText('OCR 처리 중...')).toBeVisible()

    // 7. OCR 결과 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'OCR 처리 결과' })).toBeVisible()

    // 8. 추출된 정보 확인
    await expect(page.getByText('회사명: 테스트 회사')).toBeVisible()
    await expect(page.getByText('사업자번호: 123-45-67890')).toBeVisible()
    await expect(page.getByText('대표자명: 홍길동')).toBeVisible()

    // 9. 확인 버튼 클릭하여 정보 적용
    await page.getByRole('button', { name: '확인' }).click()

    // 10. 폼에 OCR 결과가 자동 입력되었는지 확인
    await expect(page.getByDisplayValue('테스트 회사')).toBeVisible()
    await expect(page.getByDisplayValue('123-45-67890')).toBeVisible()
    await expect(page.getByDisplayValue('홍길동')).toBeVisible()
  })

  test('통장사본 업로드 및 OCR 처리', async ({ page }) => {
    // 1. 기존 고객 편집 또는 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 통장사본 업로드 영역 확인
    await expect(page.getByText('통장사본 업로드')).toBeVisible()

    // 3. 통장사본 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '통장사본 파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/sample-bank-account.pdf')

    // 4. OCR 처리 버튼 클릭
    await page.getByRole('button', { name: '통장 OCR 처리' }).click()

    // 5. OCR 결과 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('은행명: 국민은행')).toBeVisible()
    await expect(page.getByText('계좌번호: 123-456-7890')).toBeVisible()
    await expect(page.getByText('예금주명: 테스트 회사')).toBeVisible()

    // 6. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()
  })

  test('OCR 결과 수정 기능', async ({ page }) => {
    // 1. 사업자등록증 OCR 처리
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 2. OCR 결과 모달에서 편집 가능한 필드 확인
    await expect(page.getByRole('dialog')).toBeVisible()

    // 3. 회사명 필드 편집
    const companyNameField = page.getByRole('textbox', { name: '회사명' })
    await companyNameField.clear()
    await companyNameField.fill('수정된 회사명')

    // 4. 대표자명 필드 편집
    const representativeField = page.getByRole('textbox', { name: '대표자명' })
    await representativeField.clear()
    await representativeField.fill('수정된 대표자')

    // 5. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 6. 수정된 정보가 폼에 반영되었는지 확인
    await expect(page.getByDisplayValue('수정된 회사명')).toBeVisible()
    await expect(page.getByDisplayValue('수정된 대표자')).toBeVisible()
  })

  test('OCR 처리 실패 시나리오', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 잘못된 형식의 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/invalid-file.txt')

    // 3. OCR 처리 시도
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 4. 오류 메시지 표시 확인
    await expect(page.getByText('지원하지 않는 파일 형식입니다')).toBeVisible()

    // 5. 다시 올바른 파일 업로드
    await fileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 6. 성공적으로 OCR 처리되는지 확인
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('OCR 처리 중 취소 기능', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')

    // 3. OCR 처리 시작
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 4. OCR 처리 중 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click()

    // 5. OCR 처리가 중단되었는지 확인
    await expect(page.getByText('OCR 처리가 취소되었습니다')).toBeVisible()

    // 6. 모달이 닫혔는지 확인
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('드래그 앤 드롭 파일 업로드', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 드래그 앤 드롭 영역 확인
    const dropZone = page.getByRole('region', { name: '파일 업로드 영역' })
    await expect(dropZone).toBeVisible()

    // 3. 파일을 드래그 앤 드롭
    const file = await page.evaluateHandle(() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.jpg,.png'
      return input
    })

    // 4. 파일 드롭 시뮬레이션
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: ['tests/fixtures/sample-business-registration.pdf'],
      },
    })

    // 5. 파일이 업로드되었는지 확인
    await expect(page.getByText('파일이 업로드되었습니다')).toBeVisible()
  })

  test('중복 사업자번호 감지 및 처리', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 이미 존재하는 사업자번호로 OCR 처리
    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/duplicate-business-registration.pdf')
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 3. 중복 감지 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('이미 존재하는 사업자번호입니다')).toBeVisible()

    // 4. 기존 고객 정보 표시 확인
    await expect(page.getByText('기존 고객: 테스트 회사')).toBeVisible()

    // 5. 덮어쓰기 옵션 선택
    await page.getByRole('button', { name: '덮어쓰기' }).click()

    // 6. 덮어쓰기 확인 모달 표시
    await expect(page.getByText('기존 고객 정보를 덮어쓰시겠습니까?')).toBeVisible()

    // 7. 최종 확인
    await page.getByRole('button', { name: '확인' }).click()

    // 8. 성공 메시지 확인
    await expect(page.getByText('고객 정보가 업데이트되었습니다')).toBeVisible()
  })

  test('문서 다운로드 기능', async ({ page }) => {
    // 1. 기존 고객 선택 (문서가 있는 고객)
    await page.getByRole('row').nth(1).click() // 첫 번째 데이터 행

    // 2. 고객 상세 정보 모달에서 문서 다운로드 버튼 확인
    await expect(page.getByRole('button', { name: '사업자등록증 다운로드' })).toBeVisible()
    await expect(page.getByRole('button', { name: '통장사본 다운로드' })).toBeVisible()

    // 3. 사업자등록증 다운로드 버튼 클릭
    await page.getByRole('button', { name: '사업자등록증 다운로드' }).click()

    // 4. 다운로드 시작 메시지 확인
    await expect(page.getByText('파일 다운로드가 시작됩니다')).toBeVisible()
  })

  test('문서 삭제 기능', async ({ page }) => {
    // 1. 기존 고객 편집
    await page.getByRole('button', { name: '편집' }).first().click()

    // 2. 문서 삭제 버튼 확인
    await expect(page.getByRole('button', { name: '사업자등록증 삭제' })).toBeVisible()

    // 3. 사업자등록증 삭제 버튼 클릭
    await page.getByRole('button', { name: '사업자등록증 삭제' }).click()

    // 4. 삭제 확인 모달 표시
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('정말로 이 문서를 삭제하시겠습니까?')).toBeVisible()

    // 5. 확인 버튼 클릭
    await page.getByRole('button', { name: '확인' }).click()

    // 6. 삭제 완료 메시지 확인
    await expect(page.getByText('문서가 성공적으로 삭제되었습니다')).toBeVisible()

    // 7. 문서 업로드 영역이 다시 표시되는지 확인
    await expect(page.getByText('사업자등록증 업로드')).toBeVisible()
  })

  test('OCR 처리 진행률 표시', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 파일 업로드
    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/large-business-registration.pdf')

    // 3. OCR 처리 시작
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 4. 진행률 표시 확인
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByText('OCR 처리 중... 0%')).toBeVisible()

    // 5. 진행률 업데이트 확인
    await expect(page.getByText('OCR 처리 중... 50%')).toBeVisible()
    await expect(page.getByText('OCR 처리 중... 100%')).toBeVisible()

    // 6. 완료 후 결과 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('다중 파일 업로드 및 순차 처리', async ({ page }) => {
    // 1. 새 고객 추가
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    // 2. 사업자등록증 업로드
    const businessFileInput = page.getByRole('textbox', { name: '사업자등록증 파일 선택' })
    await businessFileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')

    // 3. 통장사본 업로드
    const bankFileInput = page.getByRole('textbox', { name: '통장사본 파일 선택' })
    await bankFileInput.setInputFiles('tests/fixtures/sample-bank-account.pdf')

    // 4. 모든 파일 OCR 처리 버튼 클릭
    await page.getByRole('button', { name: '모든 문서 OCR 처리' }).click()

    // 5. 순차 처리 상태 확인
    await expect(page.getByText('사업자등록증 처리 중...')).toBeVisible()
    await expect(page.getByText('통장사본 처리 중...')).toBeVisible()

    // 6. 모든 처리 완료 후 결과 확인
    await expect(page.getByText('모든 문서 처리가 완료되었습니다')).toBeVisible()
  })

  test('OCR 결과 저장 및 불러오기', async ({ page }) => {
    // 1. OCR 처리 후 결과 저장
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/sample-business-registration.pdf')
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 2. 결과 저장 버튼 클릭
    await page.getByRole('button', { name: '결과 저장' }).click()

    // 3. 저장 완료 메시지 확인
    await expect(page.getByText('OCR 결과가 저장되었습니다')).toBeVisible()

    // 4. 페이지 새로고침 후 저장된 결과 불러오기
    await page.reload()
    await page.getByRole('button', { name: '저장된 결과 불러오기' }).click()

    // 5. 저장된 정보가 불러와졌는지 확인
    await expect(page.getByDisplayValue('테스트 회사')).toBeVisible()
    await expect(page.getByDisplayValue('123-45-67890')).toBeVisible()
  })

  test('OCR 품질 검증 및 수동 보정', async ({ page }) => {
    // 1. 품질이 낮은 문서로 OCR 처리
    await page.getByRole('button', { name: '새 고객 추가' }).click()

    const fileInput = page.getByRole('textbox', { name: '파일 선택' })
    await fileInput.setInputFiles('tests/fixtures/low-quality-business-registration.pdf')
    await page.getByRole('button', { name: 'OCR 처리' }).click()

    // 2. OCR 품질 경고 메시지 확인
    await expect(page.getByText('OCR 품질이 낮습니다. 수동으로 확인해주세요')).toBeVisible()

    // 3. 수동 보정 모드 활성화
    await page.getByRole('button', { name: '수동 보정' }).click()

    // 4. 의심스러운 필드 하이라이트 확인
    await expect(page.getByText('사업자번호 (확인 필요)')).toBeVisible()

    // 5. 수동으로 정확한 정보 입력
    const businessNumberField = page.getByRole('textbox', { name: '사업자번호' })
    await businessNumberField.clear()
    await businessNumberField.fill('123-45-67890')

    // 6. 보정 완료 버튼 클릭
    await page.getByRole('button', { name: '보정 완료' }).click()

    // 7. 최종 확인 및 적용
    await page.getByRole('button', { name: '확인' }).click()
  })
})
