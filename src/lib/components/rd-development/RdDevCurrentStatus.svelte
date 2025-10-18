<script lang="ts">
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import { AlertTriangleIcon, CalendarIcon } from 'lucide-svelte'

  interface Props {
    project: any
    phases: any[]
    deliverables: any[]
    kpis: any[]
    upcomingEvents: any[]
    class?: string
  }

  let {
    project,
    phases,
    deliverables,
    kpis,
    upcomingEvents,
    class: className = '',
  }: Props = $props()

  const currentPhase = $derived.by(() => {
    const now = new Date()
    return phases.find((p: any) => {
      const start = new Date(p.start_date)
      const end = new Date(p.end_date)
      return start <= now && now <= end
    })
  })

  const urgentDeliverables = $derived.by(() => {
    const now = new Date()
    return deliverables.filter((d: any) => {
      if (!d.target_date || d.status === 'completed') return false
      const daysUntil = Math.ceil(
        (new Date(d.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysUntil <= 7 && daysUntil >= 0
    })
  })

  const delayedKpis = $derived(kpis.filter((k: any) => k.status === '지연'))
  const nextEvent = $derived(upcomingEvents.length > 0 ? upcomingEvents[0] : null)
  const hasUrgentActions = $derived(urgentDeliverables.length > 0 || delayedKpis.length > 0)
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="현재 상태" />

  <div class="space-y-4">
    <!-- Current Phase -->
    <div
      class="flex items-center justify-between p-4 rounded-lg"
      style:background="var(--color-background)"
    >
      <div>
        <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
          현재 단계
        </div>
        {#if currentPhase}
          <div class="text-base font-medium" style:color="var(--color-text-primary)">
            Phase {currentPhase.phase_number}-Year {currentPhase.year_number}
          </div>
        {:else}
          <div class="text-base" style:color="var(--color-text-secondary)">진행 중인 단계 없음</div>
        {/if}
      </div>
    </div>

    <!-- Urgent Actions -->
    {#if hasUrgentActions}
      <div
        class="p-4 rounded-lg border"
        style="background: var(--color-red-light); border-color: var(--color-red)"
      >
        <div class="flex items-center gap-2 mb-3">
          <AlertTriangleIcon size={18} />
          <span class="text-sm font-semibold" style:color="var(--color-red)"> 긴급 액션 필요 </span>
        </div>

        <div class="space-y-2">
          {#if urgentDeliverables.length > 0}
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 text-xs font-medium rounded"
                style:background="var(--color-red)"
                style:color="white"
              >
                이번 주 마감 {urgentDeliverables.length}개
              </span>
            </div>
          {/if}
          {#if delayedKpis.length > 0}
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 text-xs font-medium rounded"
                style:background="var(--color-orange)"
                style:color="white"
              >
                지연 KPI {delayedKpis.length}개
              </span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Next Event -->
    {#if nextEvent}
      <div
        class="flex items-center gap-3 p-4 rounded-lg"
        style:background="var(--color-background)"
      >
        <CalendarIcon size={18} />
        <div>
          <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
            다음 일정
          </div>
          <div class="text-sm font-medium" style:color="var(--color-text-primary)">
            {new Date(nextEvent.event_date).toLocaleDateString('ko-KR')} - {nextEvent.event_title}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
