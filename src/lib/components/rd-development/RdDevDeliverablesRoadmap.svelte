<script lang="ts">
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import { ChevronDownIcon, ChevronUpIcon, ClockIcon } from 'lucide-svelte'

  interface Props {
    phases: any[]
    deliverables: any[]
    institutions: any[]
    class?: string
  }

  let { phases, deliverables, institutions, class: className = '' }: Props = $props()

  const deliverablesByPhase = $derived.by(() => {
    const grouped: Record<string, any[]> = {}
    deliverables.forEach((d: any) => {
      const phaseId = d.phase_id || 'unassigned'
      if (!grouped[phaseId]) grouped[phaseId] = []
      grouped[phaseId].push(d)
    })
    return grouped
  })

  let expandedPhases = $state<Set<string>>(
    new Set(phases.filter((p: any) => p.status === 'active').map((p: any) => p.id)),
  )

  function togglePhase(phaseId: string) {
    if (expandedPhases.has(phaseId)) {
      expandedPhases.delete(phaseId)
    } else {
      expandedPhases.add(phaseId)
    }
    expandedPhases = new Set(expandedPhases)
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'green'
      case 'in_progress':
        return 'blue'
      case 'delayed':
        return 'red'
      default:
        return 'gray'
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행중'
      case 'delayed':
        return '지연'
      case 'planned':
        return '계획'
      default:
        return status
    }
  }

  function getPhaseStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'green'
      case 'active':
        return 'blue'
      case 'delayed':
        return 'red'
      default:
        return 'gray'
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getDaysRemaining(targetDate: string): number | null {
    if (!targetDate) return null
    const now = new Date()
    const target = new Date(targetDate)
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="단계별 산출물 로드맵" count={deliverables.length} />

  {#if phases.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">아직 단계 정보가 없습니다.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each phases as phase}
        {@const phaseDeliverables = deliverablesByPhase[phase.id] || []}
        {@const phaseStatusColor = getPhaseStatusColor(phase.status)}
        {@const completedCount = phaseDeliverables.filter(
          (d: any) => d.status === 'completed',
        ).length}
        {@const completionRate =
          phaseDeliverables.length > 0
            ? Math.round((completedCount / phaseDeliverables.length) * 100)
            : 0}

        <div
          class="rounded-lg border overflow-hidden"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
        >
          <button
            type="button"
            class="w-full flex items-center justify-between p-4 transition hover:opacity-80"
            style:background="var(--color-background)"
            onclick={() => togglePhase(phase.id)}
          >
            <div class="flex items-center gap-3">
              <span class="text-base font-semibold" style:color="var(--color-text-primary)">
                Phase {phase.phase_number}-Year {phase.year_number}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                style:background="var(--color-{phaseStatusColor}-light)"
                style:color="var(--color-{phaseStatusColor})"
              >
                {phase.status}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                style:background="var(--color-blue-light)"
                style:color="var(--color-blue)"
              >
                {phaseDeliverables.length}개
              </span>
            </div>

            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="text-xs" style:color="var(--color-text-tertiary)">
                  {formatDate(phase.start_date)} ~ {formatDate(phase.end_date)}
                </div>
                <div class="text-xs font-semibold" style:color="var(--color-primary)">
                  완료율: {completionRate}%
                </div>
              </div>
              {#if expandedPhases.has(phase.id)}
                <ChevronUpIcon size={18} />
              {:else}
                <ChevronDownIcon size={18} />
              {/if}
            </div>
          </button>

          {#if expandedPhases.has(phase.id)}
            <div class="p-4">
              {#if phaseDeliverables.length === 0}
                <p class="text-sm text-center py-6" style:color="var(--color-text-tertiary)">
                  등록된 산출물이 없습니다.
                </p>
              {:else}
                <div class="space-y-2">
                  {#each phaseDeliverables as deliverable}
                    {@const statusColor = getStatusColor(deliverable.status)}
                    {@const daysRemaining = getDaysRemaining(deliverable.target_date)}
                    {@const isUrgent =
                      daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0}
                    {@const institution = institutions.find(
                      (i: any) => i.id === deliverable.institution_id,
                    )}

                    <div
                      class="p-4 rounded-lg border transition hover:border-blue-300 hover:shadow-sm"
                      style="background: var(--color-surface); border-color: {isUrgent
                        ? 'var(--color-red)'
                        : 'var(--color-border)'}"
                    >
                      <div class="flex items-start justify-between gap-3 mb-2">
                        <div class="flex-1">
                          <div
                            class="text-sm font-medium mb-1"
                            style:color="var(--color-text-primary)"
                          >
                            {deliverable.title}
                          </div>
                          {#if deliverable.description}
                            <p class="text-xs mb-2" style:color="var(--color-text-secondary)">
                              {deliverable.description}
                            </p>
                          {/if}
                        </div>
                        <span
                          class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                          style:background="var(--color-{statusColor}-light)"
                          style:color="var(--color-{statusColor})"
                        >
                          {getStatusText(deliverable.status)}
                        </span>
                      </div>

                      <div
                        class="flex items-center gap-4 text-xs"
                        style:color="var(--color-text-tertiary)"
                      >
                        {#if deliverable.target_date}
                          <div class="flex items-center gap-1">
                            <ClockIcon size={12} />
                            <span>
                              {formatDate(deliverable.target_date)}
                              {#if isUrgent}
                                <span style:color="var(--color-red)" class="font-semibold ml-1">
                                  (D-{daysRemaining})
                                </span>
                              {/if}
                            </span>
                          </div>
                        {/if}
                        {#if institution}
                          <span style:color="var(--color-primary)" class="font-medium">
                            {institution.institution_name}
                          </span>
                        {/if}
                        {#if deliverable.deliverable_type}
                          <span>{deliverable.deliverable_type}</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
