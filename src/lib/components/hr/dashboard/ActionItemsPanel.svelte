<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { AlertCircleIcon, ClockIcon, FileTextIcon, UserMinusIcon } from '@lucide/svelte'
  import type { Employee } from '$lib/types/hr'

  interface Props {
    employees: Employee[]
    leaveRequests: any[]
    onNavigate?: (tab: string) => void
  }

  let { employees = [], leaveRequests = [], onNavigate }: Props = $props()

  // 처리 필요 항목 계산
  const actionItems = $derived.by(() => {
    // 급여명세서 미작성 (이번 달 입사자로 가정)
    const thisMonth = new Date().toISOString().slice(0, 7)
    const newHires = employees.filter(
      (e) => e.hire_date && e.hire_date.startsWith(thisMonth) && e.status === 'active',
    )

    // 휴가 승인 대기
    const pendingLeaves = leaveRequests.filter((r) => r.status === 'pending')

    // 퇴사 예정자 (termination_date가 설정되어 있지만 status가 아직 terminated가 아닌 경우)
    const terminationPending = employees.filter(
      (e) => e.termination_date && e.status !== 'terminated',
    )

    return {
      payslipPending: newHires.length,
      leavePending: pendingLeaves.length,
      terminationPending: terminationPending.length,
      total: newHires.length + pendingLeaves.length + terminationPending.length,
    }
  })
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <AlertCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">처리 필요 항목</h3>
    </div>
    {#if actionItems.total > 0}
      <ThemeBadge variant="error">{actionItems.total}</ThemeBadge>
    {:else}
      <ThemeBadge variant="success">완료</ThemeBadge>
    {/if}
  </div>

  <div class="space-y-3">
    <!-- 급여명세서 미작성 -->
    <div
      class="flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-opacity-50"
      style:border-color="var(--color-border)"
      style:background="var(--color-surface-elevated)"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
          <FileTextIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p class="font-medium" style:color="var(--color-text)">급여명세서 미작성</p>
          <p class="text-sm" style:color="var(--color-text-secondary)">이번 달 신규 입사자</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold" style:color="var(--color-text)">
          {actionItems.payslipPending}
        </span>
        <ThemeButton
          size="sm"
          variant="ghost"
          onclick={() => onNavigate?.('employees')}
          disabled={actionItems.payslipPending === 0}
        >
          처리
        </ThemeButton>
      </div>
    </div>

    <!-- 휴가 승인 대기 -->
    <div
      class="flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-opacity-50"
      style:border-color="var(--color-border)"
      style:background="var(--color-surface-elevated)"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
          <ClockIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p class="font-medium" style:color="var(--color-text)">휴가 승인 대기</p>
          <p class="text-sm" style:color="var(--color-text-secondary)">처리 대기중인 휴가 신청</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold" style:color="var(--color-text)">
          {actionItems.leavePending}
        </span>
        <ThemeButton
          size="sm"
          variant="ghost"
          onclick={() => {
            window.location.href = '/hr/leave-management'
          }}
          disabled={actionItems.leavePending === 0}
        >
          처리
        </ThemeButton>
      </div>
    </div>

    <!-- 퇴사 예정자 처리 -->
    <div
      class="flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-opacity-50"
      style:border-color="var(--color-border)"
      style:background="var(--color-surface-elevated)"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
          <UserMinusIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p class="font-medium" style:color="var(--color-text)">퇴사 예정자 처리</p>
          <p class="text-sm" style:color="var(--color-text-secondary)">퇴사일이 설정된 직원</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold" style:color="var(--color-text)">
          {actionItems.terminationPending}
        </span>
        <ThemeButton
          size="sm"
          variant="ghost"
          onclick={() => onNavigate?.('employees')}
          disabled={actionItems.terminationPending === 0}
        >
          처리
        </ThemeButton>
      </div>
    </div>
  </div>

  {#if actionItems.total === 0}
    <div class="mt-4 text-center p-4 rounded-lg" style:background="var(--color-surface-elevated)">
      <p class="text-sm" style:color="var(--color-text-secondary)">
        ✅ 모든 처리 항목이 완료되었습니다
      </p>
    </div>
  {/if}
</ThemeCard>
