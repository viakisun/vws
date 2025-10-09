<script lang="ts">
  import type { InitiativeWithOwner } from '../types'
  import { formatKoreanName } from '$lib/utils/korean-name'

  interface Props {
    initiative: InitiativeWithOwner
    compact?: boolean
  }

  let { initiative, compact = false }: Props = $props()

  function getStateColor(state: string): string {
    switch (state) {
      case 'shaping':
        return 'bg-gray-100 text-gray-700'
      case 'active':
        return 'bg-blue-100 text-blue-700'
      case 'paused':
        return 'bg-orange-100 text-orange-700'
      case 'shipped':
        return 'bg-green-100 text-green-700'
      case 'abandoned':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  function getThreadSummary(): string {
    const counts = initiative.thread_counts
    const parts: string[] = []

    if (counts.blocks > 0) parts.push(`🔴 ${counts.blocks}`)
    if (counts.questions > 0) parts.push(`🟡 ${counts.questions}`)
    if (counts.decisions > 0) parts.push(`🟣 ${counts.decisions}`)

    return parts.join(' · ') || `${counts.total} threads`
  }
</script>

{#if compact}
  <!-- Compact view for sidebars -->
  <a
    href="/planner/initiatives/{initiative.id}"
    class="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
  >
    <div class="flex items-start justify-between gap-2 mb-1">
      <h3 class="text-sm font-medium text-gray-900 line-clamp-2">{initiative.title}</h3>
      {#if initiative.horizon}
        <span class="text-xs text-gray-500 whitespace-nowrap">{formatDate(initiative.horizon)}</span
        >
      {/if}
    </div>
    <p class="text-xs text-gray-600 mb-2">
      {formatKoreanName(initiative.owner.last_name, initiative.owner.first_name)}
    </p>
    <div class="text-xs text-gray-500">{getThreadSummary()}</div>
  </a>
{:else}
  <!-- Full view for lists -->
  <a
    href="/planner/initiatives/{initiative.id}"
    class="block p-5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow transition"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-lg font-medium text-gray-900">{initiative.title}</h3>
          <span class="px-2 py-1 text-xs font-medium rounded {getStateColor(initiative.state)}">
            {initiative.state}
          </span>
        </div>
        <p class="text-sm text-gray-600 line-clamp-2">{initiative.intent}</p>
      </div>
    </div>

    <div class="flex items-center justify-between text-sm text-gray-600">
      <div class="flex items-center gap-4">
        <span>
          {formatKoreanName(initiative.owner.last_name, initiative.owner.first_name)}
        </span>
        {#if initiative.milestone}
          <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
            📍 {initiative.milestone.name}
          </span>
        {/if}
        {#if initiative.formation}
          <span class="text-xs px-2 py-1 bg-gray-100 rounded">{initiative.formation.name}</span>
        {/if}
      </div>
      <div class="flex items-center gap-3 text-xs">
        {#if initiative.horizon}
          <span>📅 {formatDate(initiative.horizon)}</span>
        {/if}
        <span>{getThreadSummary()}</span>
      </div>
    </div>
  </a>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
