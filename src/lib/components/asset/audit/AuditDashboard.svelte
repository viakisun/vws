<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import type { AssetAudit, AssetDashboardStats } from '$lib/types/asset'
  import {
    CalendarIcon,
    CheckCircleIcon,
    CheckSquareIcon,
    ClockIcon,
    PlusIcon,
    TrendingUpIcon,
  } from 'lucide-svelte'

  // Props
  interface Props {
    audits: AssetAudit[]
    summary: AssetDashboardStats
    onStartAudit?: () => void
    onViewAudit?: (audit: AssetAudit) => void
    onContinueAudit?: (audit: AssetAudit) => void
  }

  let { audits = [], summary, onStartAudit, onViewAudit, onContinueAudit }: Props = $props()

  // 상태별 배지 스타일
  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'pending':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  // 상태 한글명
  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return '완료'
      case 'in_progress':
        return '진행 중'
      case 'pending':
        return '대기 중'
      default:
        return status
    }
  }

  // 날짜 포맷팅
  function formatDate(dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 진행률 계산
  function calculateProgress(audit: AssetAudit) {
    // 임시로 0 반환 - 실제 구현 시 audit_items 배열을 기반으로 계산
    return 0
  }

  // 현재 분기 계산
  function getCurrentQuarter() {
    const now = new Date()
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    return `Q${quarter}`
  }

  // 현재 연도
  const currentYear = new Date().getFullYear()
</script>

<div class="space-y-6">
  <!-- 통계 카드 -->
  <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={4}>
    <ThemeCard variant="default">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 실사</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{audits.length || 0}건</p>
        </div>
        <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
          <CheckSquareIcon size={24} class="text-blue-600 dark:text-blue-400" stroke-width={1.5} />
        </div>
      </div>
    </ThemeCard>

    <ThemeCard variant="default">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">진행 중</p>
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {audits.filter((a) => a.status === 'in_progress').length || 0}건
          </p>
        </div>
        <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
          <ClockIcon size={24} class="text-orange-600 dark:text-orange-400" stroke-width={1.5} />
        </div>
      </div>
    </ThemeCard>

    <ThemeCard variant="default">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">완료</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {audits.filter((a) => a.status === 'completed').length || 0}건
          </p>
        </div>
        <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
          <CheckCircleIcon
            size={24}
            class="text-green-600 dark:text-green-400"
            stroke-width={1.5}
          />
        </div>
      </div>
    </ThemeCard>

    <ThemeCard variant="default">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 자산</p>
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.totalAssets || 0}개
          </p>
        </div>
        <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
          <TrendingUpIcon
            size={24}
            class="text-purple-600 dark:text-purple-400"
            stroke-width={1.5}
          />
        </div>
      </div>
    </ThemeCard>
  </ThemeGrid>

  <!-- 빠른 액션 -->
  <div class="flex justify-between items-center">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">실사 관리</h3>
    <ThemeButton variant="primary" onclick={onStartAudit}>
      <PlusIcon class="w-4 h-4 mr-2" />
      새 실사 시작
    </ThemeButton>
  </div>

  <!-- 실사 목록 -->
  <div class="grid gap-4">
    {#each audits as audit}
      {@const progress = calculateProgress(audit)}
      <ThemeCard variant="default">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {audit.audit_name} 자산 실사
              </h4>
              <Badge variant={getStatusBadgeVariant(audit.status)}>
                {getStatusLabel(audit.status)}
              </Badge>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <div class="flex items-center space-x-2">
                <CalendarIcon class="w-4 h-4" />
                <span>시작일: {formatDate(audit.start_date)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <CalendarIcon class="w-4 h-4" />
                <span>종료일: {formatDate(audit.end_date)}</span>
              </div>
              <div class="flex items-center space-x-2">
                <CheckSquareIcon class="w-4 h-4" />
                <span>담당자: {audit.auditor?.first_name || '알 수 없음'}</span>
              </div>
            </div>

            {#if audit.status === 'in_progress'}
              <div class="mt-3">
                <div
                  class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1"
                >
                  <span>진행률</span>
                  <span>{progress}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style="width: {progress}%"
                  ></div>
                </div>
              </div>
            {/if}

            {#if audit.notes}
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <strong>메모:</strong>
                {audit.notes}
              </div>
            {/if}
          </div>

          <div class="flex space-x-2 ml-4">
            {#if audit.status === 'in_progress'}
              <ThemeButton variant="primary" size="sm" onclick={() => onContinueAudit?.(audit)}>
                계속하기
              </ThemeButton>
            {:else}
              <ThemeButton variant="secondary" size="sm" onclick={() => onViewAudit?.(audit)}>
                보기
              </ThemeButton>
            {/if}
          </div>
        </div>
      </ThemeCard>
    {:else}
      <ThemeCard variant="default">
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <CheckSquareIcon size={48} class="mx-auto mb-3" />
          <p>아직 실사가 없습니다.</p>
          <p class="text-sm mt-1">새 실사를 시작해보세요.</p>
        </div>
      </ThemeCard>
    {/each}
  </div>

  <!-- 최근 실사 요약 -->
  {#if audits.length > 0}
    <ThemeCard variant="default">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">최근 실사 요약</h4>

      <div class="space-y-4">
        {#each audits.slice(0, 3) as audit}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <CheckSquareIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-gray-100">
                  {audit.audit_name} 실사
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {audit.status === 'completed' ? '완료' : '진행 중'}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {calculateProgress(audit)}%
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {audit.status === 'completed' ? '완료됨' : '진행 중'}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </ThemeCard>
  {/if}
</div>
