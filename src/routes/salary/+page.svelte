<script lang="ts">
  /**
   * Salary Management Page - Orchestrator
   *
   * Clean Architecture로 리팩토링된 급여 관리 페이지
   * - useSalaryManagement hook: 비즈니스 로직
   * - salaryStore: 상태 관리
   * - Services: API 호출
   * - Components: UI 렌더링
   */

  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import PayrollUploader from '$lib/components/salary/PayrollUploader.svelte'
  import PayslipGenerator from '$lib/components/salary/PayslipGenerator.svelte'
  import PayslipUploader from '$lib/components/salary/PayslipUploader.svelte'
  import SalaryContracts from '$lib/components/salary/SalaryContracts.svelte'
  import SalaryOverviewTab from '$lib/components/salary/dashboard/SalaryOverviewTab.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { useSalaryManagement } from '$lib/hooks/salary/useSalaryManagement.svelte'
  import { BarChartIcon, FileTextIcon, PrinterIcon, UsersIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // Hook 사용
  const salary = useSalaryManagement()
  const { store } = salary

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '대시보드', icon: BarChartIcon },
    { id: 'contracts', label: '급여 계약', icon: FileTextIcon },
    { id: 'payslips', label: '급여명세서', icon: PrinterIcon },
  ]

  // URL 파라미터에서 탭 상태 가져오기
  let activeTab = $state('overview')

  // Stats for PageLayout
  const stats = $derived([
    {
      title: '계약 직원',
      value: salary.statistics.dashboard.activeContracts,
      change: `총 ${store.data.contracts.length}명`,
      trend: 'up' as const,
      icon: UsersIcon,
    },
  ])

  // 데이터 로드
  onMount(() => {
    activeTab = page.url.searchParams.get('tab') || 'overview'
    salary.loadAllData()
  })

  // 탭 변경 함수
  function handleTabChange(tabId: string) {
    activeTab = tabId
    const url = new URL(page.url)
    url.searchParams.set('tab', tabId)
    goto(url.toString(), { replaceState: true })
  }

  // 대시보드에서 탭 전환 함수
  function handleNavigateToTab(tab: string) {
    activeTab = tab
  }

  // 탭별 컴포넌트 렌더링
  let activeComponent = $derived.by(() => {
    switch (activeTab) {
      case 'overview':
        return 'overview'
      case 'contracts':
        return 'contracts'
      case 'payslips':
        return 'payslips'
      default:
        return 'overview'
    }
  })
</script>

<svelte:head>
  <title>급여 관리 - VWS</title>
  <meta name="description" content="전체 직원 급여 관리 및 급여명세서 출력" />
</svelte:head>

<PageLayout title="급여 관리" {stats}>
  <ThemeTabs {tabs} bind:activeTab onTabChange={handleTabChange}>
    {#if activeComponent === 'overview'}
      <SalaryOverviewTab
        dashboardStats={salary.statistics.dashboard}
        actionItems={salary.statistics.actionItems}
        onNavigate={handleNavigateToTab}
      />
    {:else if activeComponent === 'contracts'}
      <ThemeSpacer size={6}>
        <SalaryContracts />
      </ThemeSpacer>
    {:else if activeComponent === 'payslips'}
      <ThemeSpacer size={6}>
        <div class="space-y-6">
          <!-- 업로드 섹션 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">엑셀 일괄 업로드</h3>
              <p class="text-sm text-gray-600">
                급여대장 엑셀 파일을 업로드하여 모든 직원의 급여명세서를 일괄 생성할 수 있습니다.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-blue-900">급여대장 업로드</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      급여대장 엑셀 파일을 업로드하여 급여명세서를 생성합니다.
                    </p>
                  </div>
                  <PayrollUploader />
                </div>
              </div>

              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-green-900">급여명세서 업로드</h4>
                    <p class="text-sm text-green-700 mt-1">
                      기존 급여명세서 템플릿을 사용하여 업로드합니다.
                    </p>
                  </div>
                  <PayslipUploader />
                </div>
              </div>
            </div>
          </div>

          <!-- 개별 급여명세서 관리 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900">개별 급여명세서 관리</h3>
              <p class="text-sm text-gray-600">
                직원별로 급여명세서를 작성하고 관리할 수 있습니다.
              </p>
            </div>
            <PayslipGenerator />
          </div>
        </div>
      </ThemeSpacer>
    {/if}
  </ThemeTabs>
</PageLayout>
