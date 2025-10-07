<script lang="ts">
  import { salaryStore } from '$lib/stores/salary'
  import ActionItemsPanel from './ActionItemsPanel.svelte'
  import RecentPayslipsPanel from './RecentPayslipsPanel.svelte'
  import SalaryOverviewCards from './SalaryOverviewCards.svelte'

  interface Props {
    dashboardStats: {
      currentMonth: {
        totalGrossSalary: number
        totalEmployees: number
      }
      departmentStats: Record<string, { averageGrossSalary: number }>
      activeContracts: number
    }
    actionItems: {
      missingPayslips: number
      expiringContracts: number
      pendingApprovals: number
      total: number
    }
    onNavigate?: (tab: string) => void
  }

  let { dashboardStats, actionItems, onNavigate = () => {} }: Props = $props()
</script>

<div class="space-y-6">
  <!-- 빠른 통계 카드 -->
  <SalaryOverviewCards {dashboardStats} />

  <!-- 메인 콘텐츠: 처리 필요 항목 + 최근 급여명세서 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 처리 필요 항목 -->
    <ActionItemsPanel {actionItems} {onNavigate} />

    <!-- 최근 급여명세서 -->
    <RecentPayslipsPanel payslips={salaryStore.data.payslips} />
  </div>
</div>
