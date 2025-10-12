<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { formatDate, formatNumber } from '$lib/utils/format'
  import { getRDStatusColor, getRDStatusText } from './utils/rd-status-utils'

  interface Props {
    project: any
  }

  let { project }: Props = $props()
</script>

<a href="/research-development/projects/{project.id}" class="block">
  <ThemeCard variant="default" hover clickable>
    <!-- 상단: 제목 + 과제책임자 + 주관기관 + 배지 -->
    <div class="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
      <div class="flex-1 min-w-0">
        {#if project.project_task_name || project.projectTaskName}
          <h3 class="text-xl font-bold text-gray-900 mb-1">
            {project.project_task_name || project.projectTaskName}
          </h3>
        {/if}
        <p class="text-base text-gray-700 mb-1">
          {project.title}
        </p>
        <div class="flex items-center gap-4 mt-2">
          <p class="text-xs font-mono text-gray-500">
            {project.code}
          </p>
          {#if project.sponsor}
            <p class="text-xs text-gray-600">
              주관기관: <span class="font-medium text-gray-900">{project.sponsor}</span>
            </p>
          {/if}
          {#if project.manager_name || project.managerName}
            <p class="text-xs text-gray-600">
              과제책임자: <span class="font-medium text-gray-900"
                >{project.manager_name || project.managerName}</span
              >
            </p>
          {/if}
        </div>
      </div>
      <div class="flex items-center gap-2 ml-4 flex-shrink-0">
        <ThemeBadge variant={getRDStatusColor(project.status)} size="md">
          {getRDStatusText(project.status)}
        </ThemeBadge>
      </div>
    </div>

    <!-- 하단: 상세정보 (사업기간, 총 사업비, 당해연도 사업비) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 사업기간 -->
      <div>
        <div class="text-xs text-gray-500 mb-1">사업기간</div>
        <div class="text-sm text-gray-900 font-medium">
          {#if project.start_date && project.end_date}
            {formatDate(project.start_date)}
            ~
            {formatDate(project.end_date)}
          {:else}
            <span class="text-gray-400">미정</span>
          {/if}
        </div>
      </div>

      <!-- 총 사업비 -->
      <div>
        <div class="text-xs text-gray-500 mb-1">총 사업비</div>
        <div class="text-sm text-gray-900 font-semibold">
          {formatNumber(project.budget_total || 0, true, '원')}
          <span class="text-gray-500 font-normal">
            ({formatNumber(project.government_funding_total || 0, true, '원')})
          </span>
        </div>
      </div>

      <!-- 당해연도 사업비 -->
      <div>
        <div class="text-xs text-gray-500 mb-1">당해연도 사업비</div>
        <div class="text-sm text-gray-900 font-semibold">
          {formatNumber(project.current_year_budget || 0, true, '원')}
          <span class="text-gray-500 font-normal">
            ({formatNumber(project.current_year_government_funding || 0, true, '원')})
          </span>
        </div>
      </div>
    </div>
  </ThemeCard>
</a>
