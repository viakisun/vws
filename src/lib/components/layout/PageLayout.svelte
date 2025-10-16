<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    subtitle?: string
    children?: any
    headerExtra?: Snippet
    stats?: Array<{
      title: string
      value: string | number
      badge?: string
      icon?: any
      href?: string
      color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink'
    }>
    actions?: Array<{
      label: string
      variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost'
      icon?: any
      onclick?: () => void
      href?: string
    }>
    searchPlaceholder?: string
    backLink?: string
  }

  const {
    title,
    subtitle = '',
    children,
    headerExtra,
    stats = [],
    actions = [],
    searchPlaceholder: _searchPlaceholder,
    backLink,
  }: Props = $props()
</script>

<div>
  <!-- 페이지 헤더와 액션 버튼 -->
  <div class="mb-6 flex items-start justify-between">
    <div class="flex-1">
      <!-- 제목과 부제목 -->
      {#if title}
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
      {/if}

      {#if subtitle}
        <p class="text-gray-600" class:mb-4={!headerExtra}>
          {subtitle}
        </p>
      {/if}

      <!-- 헤더 추가 콘텐츠 (태그 등) -->
      {#if headerExtra}
        <div class:mt-3={subtitle}>
          {@render headerExtra()}
        </div>
      {/if}
    </div>

    <!-- 액션 버튼들 (우측 상단) -->
    {#if actions.length > 0}
      <div class="flex flex-wrap gap-3 ml-4">
        {#each actions as action}
          {#if action.href}
            <a href={action.href}>
              <ThemeButton variant={action.variant || 'primary'} size="md">
                {#if action.icon}
                  <action.icon size={18} />
                {/if}
                {action.label}
              </ThemeButton>
            </a>
          {:else}
            <ThemeButton variant={action.variant || 'primary'} size="md" onclick={action.onclick}>
              {#if action.icon}
                <action.icon size={18} />
              {/if}
              {action.label}
            </ThemeButton>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- 통계 카드들 -->
  {#if stats.length > 0}
    <ThemeGrid cols={1} mdCols={2} lgCols={4} gap={6}>
      {#each stats as stat (stat.title)}
        <ThemeStatCard
          title={stat.title}
          value={String(stat.value)}
          badge={stat.badge}
          icon={stat.icon}
          href={stat.href}
          color={stat.color}
        />
      {/each}
    </ThemeGrid>

    <!-- 통계 카드와 메인 콘텐츠 사이 간격 -->
    <div class="mb-8"></div>
  {/if}

  <!-- 메인 콘텐츠 -->
  <ThemeSpacer size={6}>
    {@render children()}
  </ThemeSpacer>
</div>
