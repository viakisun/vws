<!--
  R&D Development Timeline Visualization Component
  
  Displays project phases, quarterly milestones, and deliverables
  in an interactive timeline format
-->

<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertCircleIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    TargetIcon,
  } from 'lucide-svelte'

  interface Props {
    phases: any[]
    milestones: any[]
    deliverables: any[]
    currentQuarter?: { year: number; quarter: string }
    class?: string
  }

  let { phases, milestones, deliverables, currentQuarter, class: className = '' }: Props = $props()

  // 현재 날짜
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 분기를 월로 변환
  function getQuarterMonth(year: number, quarter: string): number {
    const quarterMonths = { Q1: 1, Q2: 4, Q3: 7, Q4: 10 }
    return quarterMonths[quarter as keyof typeof quarterMonths] || 1
  }

  // 날짜가 현재보다 이전인지 확인
  function isPast(date: Date): boolean {
    return date < now
  }

  // 날짜가 현재 분기인지 확인
  function isCurrentQuarter(year: number, quarter: string): boolean {
    const quarterMonth = getQuarterMonth(year, quarter)
    return year === currentYear && Math.abs(quarterMonth - currentMonth) <= 1
  }

  // 진행률 계산
  function calculateProgress(phase: any): number {
    if (!phase.milestones || phase.milestones.length === 0) return 0

    const completed = phase.milestones.filter((m: any) =>
      isPast(new Date(`${m.year}-${getQuarterMonth(m.year, m.quarter)}-01`)),
    ).length

    return Math.round((completed / phase.milestones.length) * 100)
  }

  // 단계별 상태 계산
  function getPhaseStatus(phase: any): 'completed' | 'active' | 'upcoming' {
    const startDate = new Date(phase.start_date)
    const endDate = new Date(phase.end_date)

    if (isPast(endDate)) return 'completed'
    if (isPast(startDate) && !isPast(endDate)) return 'active'
    return 'upcoming'
  }

  // 분기별 상태 계산
  function getMilestoneStatus(milestone: any): 'completed' | 'current' | 'upcoming' {
    const milestoneDate = new Date(
      `${milestone.year}-${getQuarterMonth(milestone.year, milestone.quarter)}-01`,
    )

    if (isPast(milestoneDate)) return 'completed'
    if (isCurrentQuarter(milestone.year, milestone.quarter)) return 'current'
    return 'upcoming'
  }

  // 산출물 상태별 색상
  function getDeliverableStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'delayed':
        return 'error'
      default:
        return 'default'
    }
  }

  // 산출물 상태별 아이콘
  function getDeliverableStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'in_progress':
        return ClockIcon
      case 'delayed':
        return AlertCircleIcon
      default:
        return TargetIcon
    }
  }
</script>

<div class="rd-dev-timeline {className}">
  <!-- 타임라인 헤더 -->
  <div class="timeline-header mb-6">
    <h3 class="text-xl font-semibold mb-2">프로젝트 타임라인</h3>
    <p class="text-muted-foreground">프로젝트 단계별 진행 상황과 분기별 마일스톤을 확인하세요</p>
  </div>

  <!-- 단계별 타임라인 -->
  <div class="phases-timeline">
    {#each phases as phase, index (phase.id)}
      {@const progress = calculateProgress(phase)}
      {@const status = getPhaseStatus(phase)}

      <div class="phase-container mb-8">
        <!-- 단계 헤더 -->
        <div class="phase-header flex items-center mb-4">
          <div
            class="phase-number w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mr-4"
          >
            {phase.phase_number}
          </div>
          <div class="phase-info flex-1">
            <h4 class="text-lg font-semibold">
              Phase {phase.phase_number} - Year {phase.year_number}
            </h4>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {new Date(phase.start_date).toLocaleDateString('ko-KR')} ~
                {new Date(phase.end_date).toLocaleDateString('ko-KR')}
              </span>
              <ThemeBadge
                variant={status === 'completed'
                  ? 'success'
                  : status === 'active'
                    ? 'warning'
                    : 'default'}
              >
                {status === 'completed' ? '완료' : status === 'active' ? '진행중' : '예정'}
              </ThemeBadge>
            </div>
          </div>
          <div class="progress-info text-right">
            <div class="text-sm font-medium">{progress}%</div>
            <div class="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300"
                style="width: {progress}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- 진행률 바 -->
        <div class="progress-bar mb-4">
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style="width: {progress}%"
            ></div>
          </div>
        </div>

        <!-- 목표 및 기술 -->
        <div class="phase-details grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ThemeCard class="p-4">
            <h5 class="font-semibold mb-2 flex items-center">
              <TargetIcon size={16} class="mr-2" />
              주요 목표
            </h5>
            <ul class="text-sm space-y-1">
              {#each phase.objectives?.slice(0, 3) as objective}
                <li class="flex items-start">
                  <span class="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>{objective}</span>
                </li>
              {/each}
              {#if phase.objectives && phase.objectives.length > 3}
                <li class="text-muted-foreground">
                  외 {phase.objectives.length - 3}개 목표
                </li>
              {/if}
            </ul>
          </ThemeCard>

          <ThemeCard class="p-4">
            <h5 class="font-semibold mb-2">핵심 기술</h5>
            <div class="flex flex-wrap gap-1">
              {#each phase.key_technologies?.slice(0, 4) as tech}
                <ThemeBadge variant="default" size="sm">{tech}</ThemeBadge>
              {/each}
              {#if phase.key_technologies && phase.key_technologies.length > 4}
                <ThemeBadge variant="default" size="sm">
                  +{phase.key_technologies.length - 4}
                </ThemeBadge>
              {/if}
            </div>
          </ThemeCard>
        </div>

        <!-- 분기별 마일스톤 -->
        {#if phase.milestones && phase.milestones.length > 0}
          <div class="milestones-container">
            <h5 class="font-semibold mb-3 flex items-center">
              <CalendarIcon size={16} class="mr-2" />
              분기별 마일스톤
            </h5>
            <div class="milestones-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {#each phase.milestones as milestone}
                {@const milestoneStatus = getMilestoneStatus(milestone)}

                <ThemeCard class="p-3 milestone-card milestone-{milestoneStatus}">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">
                      {milestone.year}
                      {milestone.quarter}
                    </span>
                    <ThemeBadge
                      variant={milestoneStatus === 'completed'
                        ? 'success'
                        : milestoneStatus === 'current'
                          ? 'warning'
                          : 'default'}
                      size="sm"
                    >
                      {milestoneStatus === 'completed'
                        ? '완료'
                        : milestoneStatus === 'current'
                          ? '진행중'
                          : '예정'}
                    </ThemeBadge>
                  </div>

                  <div class="text-xs text-muted-foreground mb-2">주요 활동:</div>
                  <ul class="text-xs space-y-1">
                    {#each milestone.planned_activities?.slice(0, 2) as activity}
                      <li class="flex items-start">
                        <span class="w-1 h-1 bg-current rounded-full mt-1.5 mr-1.5 flex-shrink-0"
                        ></span>
                        <span>{activity}</span>
                      </li>
                    {/each}
                    {#if milestone.planned_activities && milestone.planned_activities.length > 2}
                      <li class="text-muted-foreground">
                        +{milestone.planned_activities.length - 2}개 활동
                      </li>
                    {/if}
                  </ul>
                </ThemeCard>
              {/each}
            </div>
          </div>
        {/if}

        <!-- 관련 산출물 -->
        {#if deliverables.filter((d) => d.phase_id === phase.id).length > 0}
          {@const phaseDeliverables = deliverables.filter((d) => d.phase_id === phase.id)}
          <div class="deliverables-container mt-4">
            <h5 class="font-semibold mb-3">관련 산출물</h5>
            <div class="deliverables-grid grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each phaseDeliverables as deliverable}
                {@const StatusIcon = getDeliverableStatusIcon(deliverable.status)}

                <ThemeCard class="p-3 deliverable-card">
                  <div class="flex items-start justify-between mb-2">
                    <h6 class="text-sm font-medium line-clamp-2">{deliverable.title}</h6>
                    <StatusIcon
                      size={16}
                      class="text-{getDeliverableStatusColor(
                        deliverable.status,
                      )} flex-shrink-0 ml-2"
                    />
                  </div>

                  <div class="text-xs text-muted-foreground mb-2">
                    {deliverable.description}
                  </div>

                  <div class="flex items-center justify-between">
                    <ThemeBadge
                      variant={getDeliverableStatusColor(deliverable.status) as any}
                      size="sm"
                    >
                      {deliverable.status === 'completed'
                        ? '완료'
                        : deliverable.status === 'in_progress'
                          ? '진행중'
                          : deliverable.status === 'delayed'
                            ? '지연'
                            : '계획'}
                    </ThemeBadge>

                    {#if deliverable.target_date}
                      <span class="text-xs text-muted-foreground">
                        목표: {new Date(deliverable.target_date).toLocaleDateString('ko-KR')}
                      </span>
                    {/if}
                  </div>
                </ThemeCard>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .rd-dev-timeline {
    @apply flex flex-col gap-6;
  }

  .phase-container {
    @apply relative;
  }

  .phase-container:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 15px;
    top: 40px;
    bottom: -32px;
    width: 2px;
    background: linear-gradient(to bottom, var(--color-primary), var(--color-border));
  }

  .milestone-card {
    @apply transition-all duration-200 hover:shadow-md;
  }

  .milestone-card.milestone-completed {
    @apply border-success/20 bg-success/5;
  }

  .milestone-card.milestone-current {
    @apply border-warning/20 bg-warning/5;
  }

  .milestone-card.milestone-upcoming {
    @apply border-border bg-surface;
  }

  .deliverable-card {
    @apply transition-all duration-200 hover:shadow-md;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .phases-timeline {
      @apply space-y-4;
    }

    .phase-header {
      @apply flex-col items-start space-y-2;
    }

    .phase-number {
      @apply mr-0 mb-2;
    }

    .progress-info {
      @apply w-full text-left;
    }

    .milestones-grid {
      @apply grid-cols-1;
    }

    .deliverables-grid {
      @apply grid-cols-1;
    }
  }
</style>
