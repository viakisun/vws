import { expect, test } from '@playwright/test'

test.describe('CRM 대시보드 및 통계 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 후 CRM 페이지로 이동
    await page.goto('/login')
    await page.getByLabel('이메일').fill('admin@example.com')
    await page.getByLabel('비밀번호').fill('admin123')
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/crm')
  })

  test('CRM 대시보드 개요 카드 표시', async ({ page }) => {
    // 1. CRM 페이지 로드 확인
    await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()

    // 2. 개요 탭이 기본 선택되어 있는지 확인
    await expect(page.getByRole('tab', { name: '개요', selected: true })).toBeVisible()

    // 3. 주요 통계 카드들 확인
    await expect(page.getByText('총 고객 수')).toBeVisible()
    await expect(page.getByText('활성 계약')).toBeVisible()
    await expect(page.getByText('이번 달 예상 수익')).toBeVisible()
    await expect(page.getByText('진행중인 기회')).toBeVisible()

    // 4. 통계 수치 확인 (실제 데이터가 표시되는지)
    await expect(page.getByText(/\d+/)).toBeVisible() // 숫자 패턴 매칭
  })

  test('고객 통계 상세 보기', async ({ page }) => {
    // 1. 총 고객 수 카드 클릭
    await page.getByRole('button', { name: '총 고객 수' }).click()

    // 2. 고객 통계 상세 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '고객 통계' })).toBeVisible()

    // 3. 고객 분류별 통계 확인
    await expect(page.getByText('신규 고객')).toBeVisible()
    await expect(page.getByText('기존 고객')).toBeVisible()
    await expect(page.getByText('비활성 고객')).toBeVisible()

    // 4. 월별 고객 증가 추이 차트 확인
    await expect(page.getByText('월별 고객 증가 추이')).toBeVisible()

    // 5. 고객 유형별 분포 차트 확인
    await expect(page.getByText('고객 유형별 분포')).toBeVisible()

    // 6. 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('계약 상태 요약 표시', async ({ page }) => {
    // 1. 계약 상태 요약 섹션 확인
    await expect(page.getByText('계약 상태 요약')).toBeVisible()

    // 2. 계약 상태별 진행률 바 확인
    await expect(page.getByRole('progressbar')).toBeVisible()

    // 3. 각 상태별 계약 수 확인
    await expect(page.getByText('진행중')).toBeVisible()
    await expect(page.getByText('완료')).toBeVisible()
    await expect(page.getByText('중단')).toBeVisible()
    await expect(page.getByText('취소')).toBeVisible()

    // 4. 상태별 퍼센티지 표시 확인
    await expect(page.getByText(/%/)).toBeVisible()
  })

  test('빠른 통계 카드 상호작용', async ({ page }) => {
    // 1. 빠른 통계 카드들 확인
    await expect(page.getByText('이번 주 신규 고객')).toBeVisible()
    await expect(page.getByText('이번 달 계약 체결')).toBeVisible()
    await expect(page.getByText('평균 계약 금액')).toBeVisible()
    await expect(page.getByText('고객 만족도')).toBeVisible()

    // 2. 이번 주 신규 고객 카드 클릭
    await page.getByRole('button', { name: '이번 주 신규 고객' }).click()

    // 3. 신규 고객 목록 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '이번 주 신규 고객' })).toBeVisible()

    // 4. 신규 고객 목록 테이블 확인
    await expect(page.getByRole('table')).toBeVisible()

    // 5. 모달 닫기
    await page.getByRole('button', { name: '닫기' }).click()

    // 6. 다른 카드 클릭 테스트
    await page.getByRole('button', { name: '이번 달 계약 체결' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '이번 달 계약 체결' })).toBeVisible()
  })

  test('기간별 필터링 기능', async ({ page }) => {
    // 1. 기간 필터 드롭다운 확인
    await expect(page.getByLabel('기간 필터')).toBeVisible()

    // 2. 기간 필터 옵션들 확인
    await page.getByLabel('기간 필터').click()
    await expect(page.getByRole('menuitem', { name: '최근 7일' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 30일' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 3개월' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '최근 1년' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '사용자 정의' })).toBeVisible()

    // 3. 최근 30일 선택
    await page.getByRole('menuitem', { name: '최근 30일' }).click()

    // 4. 데이터 새로고침 확인
    await expect(page.getByText('데이터를 불러오는 중...')).toBeVisible()

    // 5. 필터링된 데이터 표시 확인
    await expect(page.getByText('최근 30일 데이터')).toBeVisible()
  })

  test('사용자 정의 기간 설정', async ({ page }) => {
    // 1. 기간 필터에서 사용자 정의 선택
    await page.getByLabel('기간 필터').click()
    await page.getByRole('menuitem', { name: '사용자 정의' }).click()

    // 2. 사용자 정의 기간 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '사용자 정의 기간 설정' })).toBeVisible()

    // 3. 시작일과 종료일 입력
    await page.getByLabel('시작일').fill('2024-01-01')
    await page.getByLabel('종료일').fill('2024-03-31')

    // 4. 적용 버튼 클릭
    await page.getByRole('button', { name: '적용' }).click()

    // 5. 모달 닫힘 확인
    await expect(page.getByRole('dialog')).toBeHidden()

    // 6. 사용자 정의 기간 데이터 표시 확인
    await expect(page.getByText('2024-01-01 ~ 2024-03-31')).toBeVisible()
  })

  test('실시간 데이터 새로고침', async ({ page }) => {
    // 1. 새로고침 버튼 클릭
    await page.getByRole('button', { name: '새로고침' }).click()

    // 2. 로딩 상태 표시 확인
    await expect(page.getByText('데이터를 새로고침하는 중...')).toBeVisible()

    // 3. 새로고침 완료 후 데이터 표시 확인
    await expect(page.getByText('최종 업데이트')).toBeVisible()

    // 4. 자동 새로고침 설정 확인
    await page.getByRole('button', { name: '자동 새로고침 설정' }).click()

    // 5. 자동 새로고침 옵션 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('5분마다 자동 새로고침')).toBeVisible()
    await expect(page.getByLabel('10분마다 자동 새로고침')).toBeVisible()
    await expect(page.getByLabel('30분마다 자동 새로고침')).toBeVisible()

    // 6. 5분마다 자동 새로고침 선택
    await page.getByLabel('5분마다 자동 새로고침').check()
    await page.getByRole('button', { name: '저장' }).click()

    // 7. 설정 저장 확인
    await expect(page.getByText('자동 새로고침 설정이 저장되었습니다')).toBeVisible()
  })

  test('통계 데이터 내보내기', async ({ page }) => {
    // 1. 내보내기 버튼 클릭
    await page.getByRole('button', { name: '통계 내보내기' }).click()

    // 2. 내보내기 옵션 메뉴 표시 확인
    await expect(page.getByRole('menuitem', { name: 'Excel로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'PDF로 내보내기' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'CSV로 내보내기' })).toBeVisible()

    // 3. Excel 내보내기 선택
    await page.getByRole('menuitem', { name: 'Excel로 내보내기' }).click()

    // 4. 내보내기 설정 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '데이터 내보내기 설정' })).toBeVisible()

    // 5. 내보낼 데이터 선택
    await page.getByLabel('고객 통계').check()
    await page.getByLabel('계약 통계').check()
    await page.getByLabel('매출 통계').check()

    // 6. 내보내기 실행 버튼 클릭
    await page.getByRole('button', { name: '내보내기 실행' }).click()

    // 7. 내보내기 진행 상태 확인
    await expect(page.getByText('데이터를 내보내는 중...')).toBeVisible()

    // 8. 완료 메시지 확인
    await expect(page.getByText('내보내기가 완료되었습니다')).toBeVisible()
  })

  test('대시보드 위젯 재배치', async ({ page }) => {
    // 1. 위젯 편집 모드 활성화
    await page.getByRole('button', { name: '대시보드 편집' }).click()

    // 2. 위젯 드래그 핸들 표시 확인
    await expect(page.getByRole('button', { name: '위젯 드래그' })).toBeVisible()

    // 3. 첫 번째 위젯 드래그하여 위치 변경
    const firstWidget = page.getByRole('button', { name: '위젯 드래그' }).first()
    const secondWidget = page.getByRole('button', { name: '위젯 드래그' }).nth(1)

    await firstWidget.dragTo(secondWidget)

    // 4. 위치 변경 확인 메시지 표시
    await expect(page.getByText('위젯 위치가 변경되었습니다')).toBeVisible()

    // 5. 편집 모드 종료
    await page.getByRole('button', { name: '편집 완료' }).click()

    // 6. 편집 모드 비활성화 확인
    await expect(page.getByRole('button', { name: '위젯 드래그' })).toBeHidden()
  })

  test('알림 및 알림 센터', async ({ page }) => {
    // 1. 알림 센터 버튼 클릭
    await page.getByRole('button', { name: '알림 센터' }).click()

    // 2. 알림 센터 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '알림 센터' })).toBeVisible()

    // 3. 알림 목록 확인
    await expect(page.getByText('알림 목록')).toBeVisible()

    // 4. 알림 읽음 처리
    await page.getByRole('button', { name: '모두 읽음' }).click()

    // 5. 읽음 처리 완료 메시지 확인
    await expect(page.getByText('모든 알림을 읽음 처리했습니다')).toBeVisible()

    // 6. 알림 설정 버튼 클릭
    await page.getByRole('button', { name: '알림 설정' }).click()

    // 7. 알림 설정 옵션 확인
    await expect(page.getByLabel('새 고객 등록 알림')).toBeVisible()
    await expect(page.getByLabel('계약 만료 알림')).toBeVisible()
    await expect(page.getByLabel('매출 목표 달성 알림')).toBeVisible()

    // 8. 알림 설정 저장
    await page.getByRole('button', { name: '설정 저장' }).click()
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible()
  })

  test('대시보드 즐겨찾기 및 공유', async ({ page }) => {
    // 1. 즐겨찾기 버튼 클릭
    await page.getByRole('button', { name: '즐겨찾기' }).click()

    // 2. 즐겨찾기 추가 확인 메시지
    await expect(page.getByText('대시보드가 즐겨찾기에 추가되었습니다')).toBeVisible()

    // 3. 공유 버튼 클릭
    await page.getByRole('button', { name: '공유' }).click()

    // 4. 공유 옵션 모달 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '대시보드 공유' })).toBeVisible()

    // 5. 공유 옵션 선택
    await page.getByLabel('링크 공유').check()
    await page.getByLabel('이메일 공유').check()

    // 6. 공유 링크 생성 버튼 클릭
    await page.getByRole('button', { name: '공유 링크 생성' }).click()

    // 7. 공유 링크 표시 확인
    await expect(page.getByText('공유 링크가 생성되었습니다')).toBeVisible()

    // 8. 링크 복사 버튼 클릭
    await page.getByRole('button', { name: '링크 복사' }).click()

    // 9. 복사 완료 메시지 확인
    await expect(page.getByText('링크가 클립보드에 복사되었습니다')).toBeVisible()
  })

  test('반응형 대시보드 레이아웃', async ({ page }) => {
    // 1. 데스크톱 뷰에서 레이아웃 확인
    await expect(page.getByRole('heading', { name: 'CRM 관리' })).toBeVisible()

    // 2. 화면 크기를 태블릿 크기로 조정
    await page.setViewportSize({ width: 768, height: 1024 })

    // 3. 태블릿 레이아웃에서 위젯들이 적절히 배치되었는지 확인
    await expect(page.getByText('총 고객 수')).toBeVisible()

    // 4. 화면 크기를 모바일 크기로 조정
    await page.setViewportSize({ width: 375, height: 667 })

    // 5. 모바일 레이아웃에서 위젯들이 세로로 배치되었는지 확인
    await expect(page.getByText('총 고객 수')).toBeVisible()

    // 6. 모바일에서 햄버거 메뉴 표시 확인
    await expect(page.getByRole('button', { name: '메뉴' })).toBeVisible()

    // 7. 원래 화면 크기로 복원
    await page.setViewportSize({ width: 1920, height: 1080 })
  })
})
