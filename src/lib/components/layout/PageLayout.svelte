<script lang="ts">
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'

  interface Props {
    title: string
    subtitle?: string
    children?: any
    stats?: Array<{
      title: string
      value: string | number
      badge?: string
      icon?: any
      href?: string
      color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink'
    }>
    actions?: any
    searchPlaceholder?: string
  }

  let {
    title,
    subtitle = '',
    children,
    stats = [],
    actions = [],
    searchPlaceholder: _searchPlaceholder,
  }: Props = $props()
</script>

<div>
  <!-- 페이지 헤더 -->
  <ThemePageHeader {title} {subtitle} children={undefined} />

  <!-- 액션 버튼들 -->
  {#if actions.length > 0}
    <div class="mb-6 flex flex-wrap gap-3">
      {#each actions as action}
        <button
          type="button"
          onclick={action.onclick}
          class="theme-button theme-button-{action.variant || 'primary'} theme-button-md"
        >
          {#if action.icon}
            <action.icon size={18} class="mr-2" />
          {/if}
          {action.label}
        </button>
      {/each}
    </div>
  {/if}

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

<style>
  /* 추가 스타일이 필요한 경우 여기에 작성 */
</style>
