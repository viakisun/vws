<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import SalaryDashboard from '$lib/components/salary/SalaryDashboard.svelte'
  import SalaryContracts from '$lib/components/salary/SalaryContracts.svelte'
  import SalaryHistory from '$lib/components/salary/SalaryHistory.svelte'
  import PayslipGenerator from '$lib/components/salary/PayslipGenerator.svelte'
  import PayslipUploader from '$lib/components/salary/PayslipUploader.svelte'
  import { DollarSignIcon, UsersIcon, FileTextIcon, CheckCircleIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { loadContracts, loadContractStats } from '$lib/stores/salary/contract-store'
  import { loadPayslips } from '$lib/stores/salary/salary-store'
  import { formatCurrency } from '$lib/utils/format'
  import { BarChartIcon, ClockIcon, PrinterIcon } from '@lucide/svelte'
  import { logger } from '$lib/utils/logger'

  // 탭 정의
  const tabs = [
    {
      id: 'overview',
      label: '개요',
      icon: BarChartIcon,
    },
    {
      id: 'contracts',
      label: '급여 계약',
      icon: FileTextIcon,
    },
    {
      id: 'history',
      label: '급여 이력',
      icon: ClockIcon,
    },
    {
      id: 'payslips',
      label: '급여명세서',
      icon: PrinterIcon,
    },
  ]

  // URL 파라미터에서 탭 상태 가져오기
  let activeTab = $state('overview')

  // 페이지 마운트 후 URL 파라미터 처리
  onMount(() => {
    activeTab = $page?.url?.searchParams?.get('tab') || 'overview'
  })
  let mounted = $state(false)

  // 급여 통계 데이터
  let salaryStats: any[] = $state([])

  // 탭 변경 함수
  function handleTabChange(tabId: string) {
    activeTab = tabId
    // URL 파라미터 업데이트
    const url = new URL($page.url)
    url.searchParams.set('tab', tabId)
    goto(url.toString(), { replaceState: true })
  }

  // 급여 통계 로드
  async function loadSalaryStats() {
    try {
      const response = await fetch('/api/salary/contracts?page=1&limit=100')
      const result = await response.json()

      if (result.success && result.data) {
        const contracts = result.data.data
        const activeContracts = contracts.filter((contract) => contract.status === 'active')
        const totalMonthlySalary = activeContracts.reduce(
          (sum, contract) => sum + (contract.monthlySalary || 0),
          0,
        )
        const totalAnnualSalary = activeContracts.reduce(
          (sum, contract) => sum + (contract.annualSalary || 0),
          0,
        )

        salaryStats = [
          {
            title: '이번달 급여 지급 예정액',
            value: formatCurrency(totalMonthlySalary),
            change: '변화 없음 (지난달 대비)',
            changeType: 'neutral',
            icon: DollarSignIcon,
          },
          {
            title: '총 직원 수',
            value: activeContracts.length + '명',
            change: '변화 없음 (지난달 대비)',
            changeType: 'neutral',
            icon: UsersIcon,
          },
          {
            title: '총 지급액',
            value: formatCurrency(totalAnnualSalary),
            change: '변화 없음 (지난달 대비)',
            changeType: 'neutral',
            icon: FileTextIcon,
          },
          {
            title: '급여 상태',
            value: '정상',
            change: '모든 계약 활성',
            changeType: 'positive',
            icon: CheckCircleIcon,
          },
        ]
      }
    } catch (_error) {
      // 에러 처리
    }
  }

  $effect(() => {
    if (!mounted) {
      mounted = true
      // 기본 데이터 로드
      loadPayslips()
      loadContractStats()
      loadSalaryStats()
    }
  })

  // 탭 변경 시 데이터 로드
  $effect(() => {
    if (!mounted) return

    const currentTab = activeTab
    logger.log('Salary tab changed to:', currentTab)

    switch (currentTab) {
      case 'contracts':
        loadContracts()
        break
      case 'history':
        loadPayslips() // 급여 이력 탭에서는 payslips 로드
        break
      case 'payslips':
        // 급여명세서 탭은 별도 데이터 로드 불필요
        break
    }
  })
</script>

<svelte:head>
  <title>급여 관리 - VWS</title>
  <meta name="description" content="전체 직원 급여 관리 및 급여명세서 출력" />
</svelte:head>

<PageLayout
  title="급여 관리"
  subtitle="전체 직원 급여 현황 및 계약 관리"
  searchPlaceholder="직원명, 부서, 사번으로 검색..."
  stats={salaryStats}
>
  <!-- 탭 시스템 -->
  <ThemeTabs
    {tabs}
    {activeTab}
    onTabChange={handleTabChange}
    variant="underline"
    size="md"
    class="mb-6"
  >
    {#snippet children(tab: { id: string; label: string })}
      {#if tab.id === 'overview'}
        <!-- 개요 탭 -->
        <ThemeSpacer size={6}>
          <SalaryDashboard />
        </ThemeSpacer>
      {:else if tab.id === 'contracts'}
        <!-- 급여 계약 탭 -->
        <ThemeSpacer size={6}>
          <SalaryContracts />
        </ThemeSpacer>
      {:else if tab.id === 'history'}
        <!-- 급여 이력 탭 -->
        <ThemeSpacer size={6}>
          <SalaryHistory />
        </ThemeSpacer>
      {:else if tab.id === 'payslips'}
        <!-- 급여명세서 탭 -->
        <ThemeSpacer size={6}>
          <div class="space-y-6">
            <!-- 업로드 섹션 -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">엑셀 일괄 업로드</h3>
                  <p class="text-sm text-gray-600">
                    모든 직원의 급여명세서를 엑셀 파일로 일괄 업로드할 수 있습니다.
                  </p>
                </div>
                <PayslipUploader />
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
    {/snippet}
  </ThemeTabs>
</PageLayout>
