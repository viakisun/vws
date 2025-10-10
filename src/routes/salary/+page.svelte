<script lang="ts">
  /**
   * Salary Management Page
   *
   * 급여 관리 시스템의 중앙 허브 페이지
   * - 급여 대시보드: 계약 현황 및 통계
   * - 급여 계약: 직원별 급여 계약 관리
   * - 급여명세서: 급여대장 업로드 및 명세서 생성/관리
   */

  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import { BarChartIcon, FileTextIcon, PrinterIcon, UsersIcon } from '@lucide/svelte'

  // Layouts & UI Components
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'

  // Salary Components
  import PayrollUploader from '$lib/components/salary/PayrollUploader.svelte'
  import PayslipManagement from '$lib/components/salary/PayslipManagement.svelte'
  import SalaryContracts from '$lib/components/salary/SalaryContracts.svelte'
  import SalaryOverviewTab from '$lib/components/salary/dashboard/SalaryOverviewTab.svelte'

  // Business Logic
  import { useSalaryManagement } from '$lib/hooks/salary/useSalaryManagement.svelte'
  import { Resource, PermissionAction } from '$lib/stores/permissions'

  // ============================================================================
  // State & Data Management
  // ============================================================================

  const salary = useSalaryManagement()
  const { store } = salary

  let activeTab = $state<string>('overview')

  // ============================================================================
  // Tab Configuration
  // ============================================================================

  const tabs = [
    { id: 'overview', label: '대시보드', icon: BarChartIcon },
    { id: 'contracts', label: '급여 계약', icon: FileTextIcon },
    { id: 'payslips', label: '급여명세서', icon: PrinterIcon },
  ]

  // ============================================================================
  // Derived State
  // ============================================================================

  const stats = $derived([
    {
      title: '계약 직원',
      value: salary.statistics.dashboard.activeContracts,
      change: `총 ${store.data.contracts.length}명`,
      trend: 'up' as const,
      icon: UsersIcon,
    },
  ])

  const activeComponent = $derived.by(() => {
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

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * 탭 변경 핸들러
   * URL 쿼리 파라미터 동기화
   */
  function handleTabChange(tabId: string): void {
    activeTab = tabId
    const url = new URL(page.url)
    url.searchParams.set('tab', tabId)
    goto(url.toString(), { replaceState: true })
  }

  /**
   * 대시보드에서 탭 전환 핸들러
   */
  function handleNavigateToTab(tab: string): void {
    activeTab = tab
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    // URL에서 활성 탭 복원
    activeTab = page.url.searchParams.get('tab') || 'overview'

    // 급여 데이터 로드
    salary.loadAllData()
  })
</script>

<svelte:head>
  <title>급여 관리 - VWS</title>
  <meta name="description" content="직원 급여 계약 관리 및 급여명세서 생성 시스템" />
</svelte:head>

<PermissionGate resource={Resource.SALARY_MANAGEMENT} action={PermissionAction.READ}>
  <PageLayout title="급여 관리" {stats}>
    <ThemeTabs {tabs} bind:activeTab onTabChange={handleTabChange}>
      <!-- 대시보드 탭 -->
      {#if activeComponent === 'overview'}
        <SalaryOverviewTab
          dashboardStats={salary.statistics.dashboard}
          actionItems={salary.statistics.actionItems}
          onNavigate={handleNavigateToTab}
        />

        <!-- 급여 계약 탭 -->
      {:else if activeComponent === 'contracts'}
        <ThemeSpacer size={6}>
          <SalaryContracts />
        </ThemeSpacer>

        <!-- 급여명세서 탭 -->
      {:else if activeComponent === 'payslips'}
        <ThemeSpacer size={6}>
          <div class="space-y-6">
            <!-- 급여대장 업로드 섹션 -->
            <section class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <header class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">급여대장 일괄 처리</h3>
                <p class="text-sm text-gray-600">
                  엑셀 형식의 급여대장 파일을 업로드하여 전체 직원의 급여명세서를 자동으로
                  생성합니다.
                </p>
              </header>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <h4 class="font-medium text-blue-900 mb-1">급여대장 파일 업로드</h4>
                    <p class="text-sm text-blue-700">
                      표준 양식의 급여대장 엑셀 파일을 업로드하면 급여명세서가 자동 생성됩니다.
                    </p>
                  </div>
                  <PayrollUploader />
                </div>
              </div>
            </section>

            <!-- 개별 급여명세서 관리 섹션 -->
            <section class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <header class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">급여명세서 관리</h3>
                <p class="text-sm text-gray-600">
                  직원별 급여명세서를 개별적으로 조회, 생성, 수정 및 출력할 수 있습니다.
                </p>
              </header>

              <PayslipManagement />
            </section>
          </div>
        </ThemeSpacer>
      {/if}
    </ThemeTabs>
  </PageLayout>
</PermissionGate>
