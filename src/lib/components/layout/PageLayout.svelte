<script lang="ts">
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

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
    stats = [],
    actions = [],
    searchPlaceholder: _searchPlaceholder,
    backLink,
  }: Props = $props()
</script>

<div>
  <!-- 페이지 헤더 -->
  <ThemePageHeader {title} {subtitle} children={undefined} />

  <!-- 액션 버튼들 -->
  {#if actions.length > 0}
    <div class="mb-6 flex flex-wrap gap-3">
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
