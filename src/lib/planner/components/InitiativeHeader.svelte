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
<div class="mb-4 flex items-center gap-2 text-sm" style:color="var(--color-text-tertiary)">
  <a href="/planner" class="hover:underline">플래너</a>
  <span>/</span>
  {#if initiative.product}
    <a href="/planner/products/{initiative.product.id}" class="hover:underline">
      {initiative.product.name}
    </a>
    <span>/</span>
  {/if}
  <span style:color="var(--color-text-secondary)">{initiative.title}</span>
</div>

<!-- Main Info Section -->
<div class="rounded-lg border p-6 mb-4" style:background="var(--color-surface)" style:border-color="var(--color-border)">
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

  <h1 class="text-2xl font-bold mb-3" style:color="var(--color-text-primary)">
    {initiative.title}
  </h1>

  <p class="text-sm" style:color="var(--color-text-secondary)">
    {initiative.intent}
  </p>
</div>

<!-- Details Section -->
<div class="rounded-lg border p-6" style:background="var(--color-surface)" style:border-color="var(--color-border)">
  <SectionHeader title="Details">
    {#if onEditDetails}
      <SectionActionButton onclick={onEditDetails}>Edit</SectionActionButton>
    {/if}
  </SectionHeader>

  <div class="space-y-4">
    <!-- Success Criteria -->
    {#if initiative.success_criteria && initiative.success_criteria.length > 0}
      <div>
        <div class="text-xs font-semibold mb-2" style:color="var(--color-text-tertiary)">
          Success Criteria
        </div>
        <ul class="space-y-1">
          {#each initiative.success_criteria as criterion}
            <li class="text-sm flex items-start gap-2" style:color="var(--color-text-secondary)">
              <span class="text-green-500 flex-shrink-0">✓</span>
              <span>{criterion}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Meta Info -->
    <div class="flex flex-col gap-2 text-sm">
      <div class="flex items-center gap-2">
        <span style:color="var(--color-text-tertiary)">Owner:</span>
        <strong style:color="var(--color-text-secondary)">{formatKoreanName(initiative.owner.last_name, initiative.owner.first_name)}</strong>
      </div>
      {#if initiative.formation}
        <div class="flex items-center gap-2">
          <span style:color="var(--color-text-tertiary)">Team:</span>
          <strong style:color="var(--color-text-secondary)">{initiative.formation.name}</strong>
        </div>
      {/if}
      {#if initiative.horizon}
        <div class="flex items-center gap-2">
          <span style:color="var(--color-text-tertiary)">Target Date:</span>
          <strong style:color="var(--color-text-secondary)">{new Date(initiative.horizon).toLocaleDateString('ko-KR')}</strong>
        </div>
      {/if}
    </div>
  </div>
</div>
