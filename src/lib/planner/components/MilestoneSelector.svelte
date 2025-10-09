<script lang="ts">
  import type { Milestone } from '$lib/planner/types'

  interface Props {
    productId: string
    selectedMilestoneId?: string | null
    onSelect: (milestoneId: string | null) => void
  }

  let { productId, selectedMilestoneId = $bindable(), onSelect }: Props = $props()

  let milestones = $state<Milestone[]>([])
  let loading = $state(true)

  async function loadMilestones() {
    if (!productId) {
      milestones = []
      loading = false
      return
    }

    try {
      loading = true
      const res = await fetch(`/api/planner/milestones?product_id=${productId}`)
      const data = await res.json()
      if (data.success) {
        milestones = data.data
      }
    } catch (error) {
      console.error('Failed to load milestones:', error)
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadMilestones()
  })

  function handleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    const newValue = value === '' ? null : value
    selectedMilestoneId = newValue
    onSelect(newValue)
  }

  const groupedMilestones = $derived(() => {
    const groups = {
      in_progress: milestones.filter((m) => m.status === 'in_progress'),
      upcoming: milestones.filter((m) => m.status === 'upcoming'),
      achieved: milestones.filter((m) => m.status === 'achieved'),
      missed: milestones.filter((m) => m.status === 'missed'),
    }
    return groups
  })

  function formatDate(dateStr?: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<div class="milestone-selector">
  <label for="milestone-select" class="block text-sm font-medium mb-1">
    마일스톤 <span class="text-gray-400">(선택사항)</span>
  </label>

  {#if loading}
    <div class="text-sm text-gray-500">마일스톤 로딩 중...</div>
  {:else if milestones.length === 0}
    <div class="text-sm text-gray-500">해당 제품에 마일스톤이 없습니다.</div>
  {:else}
    <!-- Display selected milestone -->
    {#if selectedMilestoneId}
      {@const selected = milestones.find((m) => m.id === selectedMilestoneId)}
      {#if selected}
        <div class="mb-2 px-3 py-2 rounded border" style:background="var(--color-surface-secondary)" style:border-color="var(--color-border)">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium" style:color="var(--color-text-primary)">
                {selected.name}
              </div>
              {#if selected.target_date}
                <div class="text-xs" style:color="var(--color-text-tertiary)">
                  {formatDate(selected.target_date)}
                </div>
              {/if}
            </div>
            <span class="text-xs px-2 py-1 rounded"
              class:bg-green-100={selected.status === 'in_progress'}
              class:text-green-700={selected.status === 'in_progress'}
              class:bg-gray-100={selected.status === 'upcoming' || selected.status === 'achieved'}
              class:text-gray-600={selected.status === 'upcoming' || selected.status === 'achieved'}
            >
              {selected.status === 'in_progress' ? '진행중' : selected.status === 'achieved' ? '달성' : '예정'}
            </span>
          </div>
        </div>
      {/if}
    {/if}

    <select
      id="milestone-select"
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={selectedMilestoneId || ''}
      onchange={handleChange}
    >
      <option value="">없음</option>

      {#if groupedMilestones().in_progress.length > 0}
        <optgroup label="진행중">
          {#each groupedMilestones().in_progress as milestone}
            <option value={milestone.id}>
              {milestone.name}
              {#if milestone.description}
                - {milestone.description}
              {/if}
              {#if milestone.target_date}
                ({formatDate(milestone.target_date)})
              {/if}
            </option>
          {/each}
        </optgroup>
      {/if}

      {#if groupedMilestones().upcoming.length > 0}
        <optgroup label="예정">
          {#each groupedMilestones().upcoming as milestone}
            <option value={milestone.id}>
              {milestone.name}
              {#if milestone.description}
                - {milestone.description}
              {/if}
              {#if milestone.target_date}
                ({formatDate(milestone.target_date)})
              {/if}
            </option>
          {/each}
        </optgroup>
      {/if}

      {#if groupedMilestones().achieved.length > 0}
        <optgroup label="달성">
          {#each groupedMilestones().achieved as milestone}
            <option value={milestone.id}>
              {milestone.name}
              {#if milestone.description}
                - {milestone.description}
              {/if}
              {#if milestone.target_date}
                ({formatDate(milestone.target_date)})
              {/if}
            </option>
          {/each}
        </optgroup>
      {/if}

      {#if groupedMilestones().missed.length > 0}
        <optgroup label="미달성">
          {#each groupedMilestones().missed as milestone}
            <option value={milestone.id}>
              {milestone.name}
              {#if milestone.description}
                - {milestone.description}
              {/if}
              {#if milestone.target_date}
                ({formatDate(milestone.target_date)})
              {/if}
            </option>
          {/each}
        </optgroup>
      {/if}
    </select>
  {/if}
</div>

<style>
  select {
    background-color: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  select:focus {
    border-color: var(--color-primary);
  }

  optgroup {
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  option {
    font-weight: 400;
    color: var(--color-text);
  }
</style>
