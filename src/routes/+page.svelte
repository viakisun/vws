<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatKRW } from '$lib/utils/format'
  import { BanknoteIcon, UsersIcon, FlaskConicalIcon, BriefcaseIcon } from '@lucide/svelte'

  // Mock data
  const stats = [
    { title: '오늘 지출', value: formatKRW(1250000), icon: BanknoteIcon, color: 'blue' },
    { title: '인사 현황', value: '2건', icon: UsersIcon, color: 'green' },
    { title: 'R&D 예산', value: formatKRW(1200000000), icon: FlaskConicalIcon, color: 'purple' },
    { title: '월 매출', value: formatKRW(320000000), icon: BriefcaseIcon, color: 'orange' }
  ]
</script>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="mb-8">
    <h1
      class="text-3xl font-bold"
      style:color="var(--color-text)">🔥 핫리로드 대시보드</h1>
    <p
      class="text-sm mt-2"
      style:color="var(--color-text-secondary)">
      전체 시스템 현황과 주요 지표를 한눈에 확인하세요 - 실시간 업데이트!
    </p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <ThemeCard
        variant="elevated"
        hover={true}
        class="group cursor-pointer">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium"
              style:color="var(--color-text-secondary)">
              {stat.title}
            </p>
            <p
              class="text-2xl font-bold mt-1"
              style:color="var(--color-text)">{stat.value}</p>
            <div class="mt-2">
              <ThemeBadge
                variant="default"
                size="sm">상태 양호</ThemeBadge>
            </div>
          </div>
          <div class="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 bg-blue-100 dark:bg-blue-900/20"
          >
            <stat.icon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </ThemeCard>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Key Metrics -->
    <ThemeCard
      variant="elevated"
      class="lg:col-span-2">
      <h2
        class="text-xl font-semibold mb-6"
        style:color="var(--color-text)">주요 지표</h2>
      <div class="space-y-4">
        <div
          class="p-4 rounded-xl"
          style:background="var(--color-surface)"
          style:border="1px solid var(--color-border)"
        >
          <h3
            class="text-sm font-medium mb-2"
            style:color="var(--color-text-secondary)">
            예산 사용률
          </h3>
          <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              class="bg-blue-600 h-2.5 rounded-full"
              style:width="68%"></div>
          </div>
          <p
            class="text-xs mt-2"
            style:color="var(--color-text-secondary)">68% 사용됨</p>
        </div>
      </div>
    </ThemeCard>

    <!-- My Tasks -->
    <ThemeCard variant="elevated">
      <h2
        class="text-xl font-semibold mb-6"
        style:color="var(--color-text)">내 업무</h2>
      <div class="space-y-3">
        <div
          class="flex items-center justify-between p-4 rounded-xl"
          style:background="var(--color-surface)"
          style:border="1px solid var(--color-border)"
        >
          <div class="flex items-center space-x-3">
            <div
              class="h-8 w-8 rounded-lg flex items-center justify-center"
              style:background="var(--color-primary-light)"
            >
              <BanknoteIcon
                class="h-4 w-4"
                style="color: var(--color-primary);" />
            </div>
            <div>
              <p
                class="text-sm font-medium"
                style:color="var(--color-text)">
                결재 대기: 비용 청구 2건
              </p>
              <ThemeBadge
                variant="error"
                size="sm">긴급</ThemeBadge>
            </div>
          </div>
          <ThemeButton
            variant="primary"
            size="sm">처리</ThemeButton>
        </div>
      </div>
    </ThemeCard>
  </div>
</div>
