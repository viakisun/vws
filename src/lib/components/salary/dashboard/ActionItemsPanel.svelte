<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { AlertCircleIcon, CalendarOffIcon, CheckCircleIcon } from '@lucide/svelte'

  interface Props {
    actionItems: {
      missingPayslips: number
      expiringContracts: number
      pendingApprovals: number
      total: number
    }
    onNavigate?: (tab: string) => void
  }

  const { actionItems, onNavigate = () => {} }: Props = $props()
</script>

<ThemeCard class="p-6">
  <div class="mb-4">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">처리 필요 항목</h3>
    <p class="text-sm mt-1" style:color="var(--color-text-secondary)">
      오늘 처리해야 할 급여 관련 업무
    </p>
  </div>

  <div class="space-y-3">
    <!-- 급여명세서 미작성 -->
    <button
      type="button"
      onclick={() => onNavigate('payslips')}
      class="w-full p-3 rounded-lg border hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
      style:border-color={actionItems.missingPayslips > 0
        ? 'var(--color-warning)'
        : 'var(--color-border)'}
      style:background-color={actionItems.missingPayslips > 0
        ? 'var(--color-warning-bg)'
        : 'transparent'}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            style:background-color={actionItems.missingPayslips > 0
              ? 'var(--color-warning)'
              : 'var(--color-surface)'}
          >
            <AlertCircleIcon
              class="w-5 h-5 {actionItems.missingPayslips > 0 ? 'text-white' : 'text-gray-500'}"
            />
          </div>
          <div>
            <p class="font-medium" style:color="var(--color-text)">급여명세서 미작성</p>
            <p class="text-sm" style:color="var(--color-text-secondary)">
              이번 달 급여명세서 생성 필요
            </p>
          </div>
        </div>
        <span
          class="text-2xl font-bold"
          style:color={actionItems.missingPayslips > 0
            ? 'var(--color-warning)'
            : 'var(--color-text-secondary)'}
        >
          {actionItems.missingPayslips}
        </span>
      </div>
    </button>

    <!-- 계약 만료 임박 -->
    <button
      type="button"
      onclick={() => onNavigate('contracts')}
      class="w-full p-3 rounded-lg border hover:border-red-400 hover:bg-red-50 transition-colors text-left"
      style:border-color={actionItems.expiringContracts > 0
        ? 'var(--color-danger)'
        : 'var(--color-border)'}
      style:background-color={actionItems.expiringContracts > 0
        ? 'var(--color-danger-bg)'
        : 'transparent'}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            style:background-color={actionItems.expiringContracts > 0
              ? 'var(--color-danger)'
              : 'var(--color-surface)'}
          >
            <CalendarOffIcon
              class="w-5 h-5 {actionItems.expiringContracts > 0 ? 'text-white' : 'text-gray-500'}"
            />
          </div>
          <div>
            <p class="font-medium" style:color="var(--color-text)">계약 만료 임박</p>
            <p class="text-sm" style:color="var(--color-text-secondary)">30일 이내 만료 예정</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold"
          style:color={actionItems.expiringContracts > 0
            ? 'var(--color-danger)'
            : 'var(--color-text-secondary)'}
        >
          {actionItems.expiringContracts}
        </span>
      </div>
    </button>

    <!-- 승인 대기 -->
    <button
      type="button"
      onclick={() => onNavigate('payslips')}
      class="w-full p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
      style:border-color={actionItems.pendingApprovals > 0
        ? 'var(--color-primary)'
        : 'var(--color-border)'}
      style:background-color={actionItems.pendingApprovals > 0
        ? 'var(--color-primary-bg)'
        : 'transparent'}
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            style:background-color={actionItems.pendingApprovals > 0
              ? 'var(--color-primary)'
              : 'var(--color-surface)'}
          >
            <CheckCircleIcon
              class="w-5 h-5 {actionItems.pendingApprovals > 0 ? 'text-white' : 'text-gray-500'}"
            />
          </div>
          <div>
            <p class="font-medium" style:color="var(--color-text)">승인 대기</p>
            <p class="text-sm" style:color="var(--color-text-secondary)">급여 승인이 필요한 항목</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold"
          style:color={actionItems.pendingApprovals > 0
            ? 'var(--color-primary)'
            : 'var(--color-text-secondary)'}
        >
          {actionItems.pendingApprovals}
        </span>
      </div>
    </button>
  </div>

  {#if actionItems.total === 0}
    <div class="mt-4 p-3 rounded-lg bg-green-50">
      <p class="text-sm text-green-700 text-center">✅ 모든 급여 업무가 처리되었습니다!</p>
    </div>
  {/if}
</ThemeCard>
