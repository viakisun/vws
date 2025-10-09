<script lang="ts">
  import type { InitiativeWithOwner, InitiativeStatus } from '../types'
  import { getStageColor, getStageText, getStatusColor } from '../utils/initiative-helpers'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'

  interface Props {
    initiative: InitiativeWithOwner
    onStatusChange: (status: InitiativeStatus) => Promise<void>
    onEditDetails?: () => void
  }

  let { initiative, onStatusChange, onEditDetails }: Props = $props()

  const stageColor = $derived(getStageColor(initiative.stage))
  const statusColor = $derived(getStatusColor(initiative.status))

  const STATUS_OPTIONS: Array<{ value: InitiativeStatus; label: string }> = [
    { value: 'active', label: '진행 중' },
    { value: 'paused', label: '일시중지' },
    { value: 'shipped', label: '완료' },
    { value: 'abandoned', label: '중단' },
  ]

  let isChanging = $state(false)

  async function handleStatusChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const newStatus = target.value as InitiativeStatus

    if (newStatus === initiative.status || isChanging) return

    isChanging = true
    try {
      await onStatusChange(newStatus)
    } catch (e) {
      alert(e instanceof Error ? e.message : '상태 변경에 실패했습니다')
      // Revert select value on error
      target.value = initiative.status
    } finally {
      isChanging = false
    }
  }
</script>

<!-- Breadcrumb -->
<div class="mb-6 flex items-center gap-2 text-sm" style:color="var(--color-text-tertiary)">
  <a href="/planner" class="hover:underline">플래너</a>
  <span>/</span>
  {#if !initiative.product}
    <span style:color="var(--color-error)">⚠ 제품 정보 없음</span>
  {:else}
    <a href="/planner/products/{initiative.product.id}" class="hover:underline">
      {initiative.product.name}
    </a>
    <span>/</span>
    <span style:color="var(--color-text-secondary)">{initiative.title}</span>
  {/if}
</div>

<!-- Main Info Section -->
<div
  class="rounded-lg border p-6 mb-4"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <div class="flex items-center gap-2 mb-4">
    <span class="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
      이니셔티브
    </span>
    <span
      class="px-2 py-1 text-xs font-medium rounded"
      class:bg-gray-100={stageColor === 'gray'}
      class:text-gray-700={stageColor === 'gray'}
      class:bg-blue-100={stageColor === 'blue'}
      class:text-blue-700={stageColor === 'blue'}
      class:bg-purple-100={stageColor === 'purple'}
      class:text-purple-700={stageColor === 'purple'}
      class:bg-orange-100={stageColor === 'orange'}
      class:text-orange-700={stageColor === 'orange'}
      class:bg-green-100={stageColor === 'green'}
      class:text-green-700={stageColor === 'green'}
    >
      {getStageText(initiative.stage)}
    </span>
    <select
      value={initiative.status}
      onchange={handleStatusChange}
      disabled={isChanging}
      class="px-3 py-1 text-xs font-medium rounded border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      class:bg-blue-100={statusColor === 'blue'}
      class:text-blue-700={statusColor === 'blue'}
      class:bg-orange-100={statusColor === 'orange'}
      class:text-orange-700={statusColor === 'orange'}
      class:bg-green-100={statusColor === 'green'}
      class:text-green-700={statusColor === 'green'}
      class:bg-red-100={statusColor === 'red'}
      class:text-red-700={statusColor === 'red'}
      class:bg-gray-100={statusColor === 'gray'}
      class:text-gray-700={statusColor === 'gray'}
    >
      {#each STATUS_OPTIONS as status}
        <option value={status.value}>{status.label}</option>
      {/each}
    </select>
  </div>

  <!-- Title with Product Name -->
  <div class="mb-3">
    {#if !initiative.product}
      <div class="flex items-center gap-2 mb-2 px-3 py-2 rounded bg-red-50 border border-red-200">
        <span class="text-sm font-medium" style:color="var(--color-error)">
          ⚠ 이 이니셔티브에 제품 정보가 연결되어 있지 않습니다.
        </span>
      </div>
    {:else}
      <div class="flex items-center gap-2 mb-1">
        <span class="text-lg font-light" style:color="var(--color-text-tertiary)">
          {initiative.product.name}
        </span>
        <span style:color="var(--color-text-tertiary)">/</span>
      </div>
    {/if}
    <h1 class="text-2xl font-bold" style:color="var(--color-text-primary)">
      {initiative.title}
    </h1>
  </div>

  <p class="text-sm" style:color="var(--color-text-secondary)">
    {initiative.intent}
  </p>
</div>

<!-- Details Section -->
<div
  class="rounded-lg border p-6"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="Details">
    {#if onEditDetails}
      <SectionActionButton onclick={onEditDetails}>Edit</SectionActionButton>
    {/if}
  </SectionHeader>

  <div class="space-y-6">
    <!-- Success Criteria -->
    {#if initiative.success_criteria && initiative.success_criteria.length > 0}
      <div>
        <div
          class="text-xs font-semibold uppercase tracking-wide mb-3"
          style:color="var(--color-text-tertiary)"
        >
          Success Criteria
        </div>
        <div
          class="rounded-lg border p-4 space-y-2"
          style:background="var(--color-surface-secondary)"
          style:border-color="var(--color-border)"
        >
          {#each initiative.success_criteria as criterion, i}
            <div class="flex items-start gap-3">
              <div
                class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-green-500"
              >
                {i + 1}
              </div>
              <p class="text-sm pt-0.5" style:color="var(--color-text-primary)">
                {criterion}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Meta Info Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Owner Card -->
      <div
        class="rounded-lg border p-4"
        style:background="var(--color-surface-secondary)"
        style:border-color="var(--color-border)"
      >
        <div
          class="text-xs font-semibold uppercase tracking-wide mb-2"
          style:color="var(--color-text-tertiary)"
        >
          Owner
        </div>
        <div class="text-sm font-medium" style:color="var(--color-text-primary)">
          {formatKoreanName(initiative.owner.last_name, initiative.owner.first_name)}
        </div>
      </div>

      <!-- Team Card -->
      {#if initiative.formation}
        <div
          class="rounded-lg border p-4"
          style:background="var(--color-surface-secondary)"
          style:border-color="var(--color-border)"
        >
          <div
            class="text-xs font-semibold uppercase tracking-wide mb-2"
            style:color="var(--color-text-tertiary)"
          >
            Team
          </div>
          <div class="text-sm font-medium" style:color="var(--color-text-primary)">
            {initiative.formation.name}
          </div>
        </div>
      {/if}

      <!-- Target Date Card -->
      {#if initiative.horizon}
        <div
          class="rounded-lg border p-4"
          style:background="var(--color-surface-secondary)"
          style:border-color="var(--color-border)"
        >
          <div
            class="text-xs font-semibold uppercase tracking-wide mb-2"
            style:color="var(--color-text-tertiary)"
          >
            Target Date
          </div>
          <div class="text-sm font-medium" style:color="var(--color-text-primary)">
            {new Date(initiative.horizon).toLocaleDateString('ko-KR')}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
