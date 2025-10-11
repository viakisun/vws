<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import { formatDate } from '$lib/utils/format'
  import {
    ActivityIcon,
    AlertTriangleIcon,
    DollarSignIcon,
    FlaskConicalIcon,
    UsersIcon,
  } from '@lucide/svelte'
  import { formatRDCurrency } from './utils/rd-format-utils'

  import type { ProjectSummary } from '$lib/types/index'

  interface Props {
    projectSummary?: ProjectSummary | null
    alerts?: unknown[]
  }

  const { projectSummary = null, alerts = [] }: Props = $props()

  // 간소화된 상태 배지 색상
  function getStatusBadgeColor(status) {
    switch (status) {
      case 'active':
        return 'success'
      case 'planning':
        return 'primary'
      case 'completed':
        return 'default'
      default:
        return 'default'
    }
  }

  // 간소화된 상태 한글 변환
  function getStatusLabel(status) {
    switch (status) {
      case 'active':
        return '진행'
      case 'planning':
        return '기획'
      case 'completed':
        return '완료'
      default:
        return status
    }
  }

  // 안전한 날짜 표시 함수
  function safeFormatDate(dateString) {
    if (!dateString) return '미정'
    try {
      return formatDate(dateString)
    } catch {
      return '잘못된 날짜'
    }
  }
</script>

<div class="space-y-6">
  <!-- 요약 통계 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <ThemeCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <FlaskConicalIcon class="h-8 w-8 text-blue-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">총 프로젝트</p>
          <p class="text-2xl font-semibold text-gray-900">
            {projectSummary?.totalProjects || 0}개
          </p>
          <div class="flex items-center mt-2">
            <span class="text-sm text-green-600">
              진행중: {projectSummary?.activeProjects || 0}
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <DollarSignIcon class="h-8 w-8 text-green-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">총 예산</p>
          <p class="text-2xl font-semibold text-gray-900">
            {formatRDCurrency(projectSummary?.totalBudget || 0)}
          </p>
          <div class="flex items-center mt-2">
            <span class="text-sm text-blue-600">
              올해: {formatRDCurrency(projectSummary?.currentYearBudget || 0)}
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <UsersIcon class="h-8 w-8 text-purple-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">참여 연구원</p>
          <p class="text-2xl font-semibold text-gray-900">
            {projectSummary?.totalMembers || 0}명
          </p>
          <div class="flex items-center mt-2">
            <span class="text-sm text-gray-500">
              활성: {projectSummary?.activeMembers || 0}명
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <AlertTriangleIcon class="h-8 w-8 text-orange-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">알림</p>
          <p class="text-2xl font-semibold text-gray-900">
            {alerts.length}개
          </p>
          <div class="flex items-center mt-2">
            <span class="text-sm text-red-600">
              초과 참여: {projectSummary?.overParticipationEmployees || 0}명
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>
  </div>

  <!-- 최근 활동 -->
  <ThemeCard>
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">최근 프로젝트 활동</h3>
    </div>
    <div class="divide-y divide-gray-200">
      {#if projectSummary?.recentActivities && projectSummary.recentActivities.length > 0}
        {#each projectSummary.recentActivities as activity (activity.code)}
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <ThemeBadge variant={getStatusBadgeColor(activity.status)}>
                  {getStatusLabel(activity.status)}
                </ThemeBadge>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p class="text-sm text-gray-500">{activity.code}</p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                {safeFormatDate(activity.updatedAt)}
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="px-6 py-8 text-center text-gray-500">
          <ActivityIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2">최근 활동이 없습니다.</p>
        </div>
      {/if}
    </div>
  </ThemeCard>
</div>
