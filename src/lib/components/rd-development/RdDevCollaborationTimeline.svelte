<script lang="ts">
  interface Props {
    project: any
    phases: any[]
    deliverables: any[]
    institutions: any[]
    class?: string
  }

  let { project, phases, deliverables, institutions, class: className = '' }: Props = $props()

  const sortedInstitutions = $derived.by(() => {
    // Show VIA last for emphasis
    const via = institutions.find((i: any) => i.institution_name === 'VIA')
    const others = institutions.filter((i: any) => i.institution_name !== 'VIA')
    return via ? [...others, via] : others
  })

  const projectStart = $derived.by(() => {
    if (phases.length === 0) return new Date(project.start_date || '2025-04-01')
    const dates = phases.map((p: any) => new Date(p.start_date))
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  })

  const projectEnd = $derived.by(() => {
    if (phases.length === 0) return new Date(project.end_date || '2027-12-31')
    const dates = phases.map((p: any) => new Date(p.end_date))
    return new Date(Math.max(...dates.map((d) => d.getTime())))
  })

  interface Quarter {
    year: number
    quarter: number
    label: string
    key: string
    isCurrent: boolean
  }

  const quarters = $derived.by((): Quarter[] => {
    const result: Quarter[] = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)

    for (let year = projectStart.getFullYear(); year <= projectEnd.getFullYear(); year++) {
      for (let q = 1; q <= 4; q++) {
        result.push({
          year,
          quarter: q,
          label: `Q${q}`,
          key: `${year}-Q${q}`,
          isCurrent: year === currentYear && q === currentQuarter,
        })
      }
    }

    return result
  })

  interface TimelineData {
    [quarterKey: string]: {
      [institutionId: string]: any[]
    }
  }

  const timelineData = $derived.by((): TimelineData => {
    const data: TimelineData = {}

    deliverables.forEach((d: any) => {
      if (!d.target_date || !d.institution_id) return

      const date = new Date(d.target_date)
      const year = date.getFullYear()
      const quarter = Math.ceil((date.getMonth() + 1) / 3)
      const key = `${year}-Q${quarter}`

      if (!data[key]) data[key] = {}
      if (!data[key][d.institution_id]) data[key][d.institution_id] = []

      data[key][d.institution_id].push(d)
    })

    return data
  })

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
      default:
        return '계획'
    }
  }

  function getCellData(quarterKey: string, institutionId: string) {
    return timelineData[quarterKey]?.[institutionId] || []
  }
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <div class="mb-4">
    <h3 class="text-xl font-light" style:color="var(--color-text-primary)">협업 타임라인</h3>
    <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
      {projectStart.getFullYear()}.{String(projectStart.getMonth() + 1).padStart(2, '0')} ~
      {projectEnd.getFullYear()}.{String(projectEnd.getMonth() + 1).padStart(2, '0')}
    </p>
  </div>

  {#if institutions.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">참여 기관 정보가 없습니다.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr style:background="var(--color-background)">
            <th
              class="p-3 text-left text-xs font-semibold sticky left-0 z-10"
              style:background="var(--color-background)"
              style:color="var(--color-text-primary)"
              style:border="1px solid var(--color-border)"
            >
              시간 / 기관
            </th>
            {#each sortedInstitutions as institution}
              {@const isVia = institution.institution_name === 'VIA'}
              <th
                class="p-3 text-center text-xs font-semibold min-w-[200px]"
                style:color="var(--color-text-primary)"
                style:border="1px solid var(--color-border)"
                style:background={isVia ? 'var(--color-primary-light)' : 'transparent'}
              >
                <div class="flex items-center justify-center gap-2">
                  {#if isVia}
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      style:background="var(--color-primary)"
                      style:color="white"
                    >
                      VIA
                    </span>
                  {/if}
                  <span>{institution.institution_name}</span>
                </div>
                {#if institution.institution_type}
                  <div class="text-xs font-normal mt-1" style:color="var(--color-text-tertiary)">
                    {institution.institution_type}
                  </div>
                {/if}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each quarters as quarter}
            <tr class:bg-blue-50={quarter.isCurrent}>
              <td
                class="p-3 sticky left-0 z-10"
                style:background={quarter.isCurrent
                  ? 'var(--color-blue-light)'
                  : 'var(--color-background)'}
                style:border="1px solid var(--color-border)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold" style:color="var(--color-text-primary)">
                    {quarter.label}
                  </span>
                  {#if quarter.isCurrent}
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      style:background="var(--color-blue)"
                      style:color="white"
                    >
                      현재
                    </span>
                  {/if}
                </div>
                <div class="text-xs" style:color="var(--color-text-tertiary)">
                  {quarter.year}
                </div>
              </td>
              {#each sortedInstitutions as institution}
                {@const isVia = institution.institution_name === 'VIA'}
                {@const cellDeliverables = getCellData(quarter.key, institution.id)}
                <td
                  class="p-2 align-top"
                  style:background={cellDeliverables.length > 0
                    ? isVia
                      ? 'var(--color-primary-light)'
                      : 'var(--color-surface)'
                    : isVia
                      ? 'var(--color-background)'
                      : 'transparent'}
                  style:border="1px solid var(--color-border)"
                >
                  {#if cellDeliverables.length > 0}
                    <div class="space-y-2">
                      {#each cellDeliverables as deliverable}
                        {@const statusColor = getStatusColor(deliverable.status)}
                        <div
                          class="p-2 rounded text-xs transition hover:shadow-sm"
                          style:background="var(--color-{statusColor}-light)"
                          style:border="1px solid var(--color-{statusColor})"
                        >
                          <div class="font-medium mb-1" style:color="var(--color-text-primary)">
                            {deliverable.title}
                          </div>
                          <div class="flex items-center justify-between">
                            <span
                              class="px-1.5 py-0.5 rounded text-xs font-medium"
                              style:background="var(--color-{statusColor})"
                              style:color="white"
                            >
                              {getStatusText(deliverable.status)}
                            </span>
                            {#if deliverable.target_date}
                              <span style:color="var(--color-text-tertiary)">
                                {new Date(deliverable.target_date).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="text-center text-xs" style:color="var(--color-text-tertiary)">
                      -
                    </div>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4 text-xs" style:color="var(--color-text-tertiary)">
      각 셀은 해당 분기에 각 기관이 담당하는 산출물을 표시합니다.
    </div>
  {/if}
</div>
