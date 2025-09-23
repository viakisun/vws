<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import { FilterIcon, RefreshCwIcon, SearchIcon, SettingsIcon } from '@lucide/svelte'

  interface Props {
    title: string
    subtitle?: string
    children?: any
    showSearch?: boolean
    showFilters?: boolean
    showActions?: boolean
    searchPlaceholder?: string
    actions?: any[]
    stats?: Array<{
      title: string
      value: string | number
      badge?: string
      icon?: any
      href?: string
      color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink'
    }>
  }

  let {
    title,
    subtitle = '',
    children,
    showSearch = true,
    showFilters = true,
    showActions = true,
    searchPlaceholder = '검색...',
    actions = [],
    stats = []
  }: Props = $props()

  let searchTerm = $state('')
  let selectedFilter = $state('all')
  let showFiltersDropdown = $state(false)

  const defaultActions = [
    {
      label: '새로고침',
      icon: RefreshCwIcon,
      onclick: () => window.location.reload(),
      variant: 'ghost' as const
    },
    {
      label: '설정',
      icon: SettingsIcon,
      onclick: () => logger.log('Settings clicked'),
      variant: 'ghost' as const
    }
  ]

  const allActions = [...defaultActions, ...actions]
</script>

import {logger} from '$lib/utils/logger';

<div>
  <!-- 페이지 헤더 -->
  <ThemePageHeader {title} {subtitle} children={undefined} />

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
  {/if}

  <!-- 검색 및 필터 섹션 -->
  {#if showSearch || showFilters || showActions}
    <ThemeCard class="p-4">
      <div>
        <!-- 검색 및 필터 -->
        <div>
          {#if showSearch}
            <div>
              <SearchIcon
                size={20}
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <ThemeInput
                type="text"
                placeholder={searchPlaceholder}
                bind:value={searchTerm}
                class="pl-10"
              />
            </div>
          {/if}

          {#if showFilters}
            <div>
              <ThemeButton
                variant="ghost"
                size="sm"
                onclick={() => (showFiltersDropdown = !showFiltersDropdown)}
                class="flex items-center gap-2"
              >
                <FilterIcon size={16} />
                필터
              </ThemeButton>

              {#if showFiltersDropdown}
                <div
                  style:background="var(--color-surface)"
                  style:border-color="var(--color-border)"
                >
                  <div>
                    <button
                      type="button"
                      onclick={() => {
                        selectedFilter = 'all'
                        showFiltersDropdown = false
                      }}
                      class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                      class:bg-blue-50={selectedFilter === 'all'}
                      class:dark:bg-blue-900={selectedFilter === 'all'}
                      style:color="var(--color-text)"
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        selectedFilter = 'active'
                        showFiltersDropdown = false
                      }}
                      class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                      class:bg-blue-50={selectedFilter === 'active'}
                      class:dark:bg-blue-900={selectedFilter === 'active'}
                      style:color="var(--color-text)"
                    >
                      활성
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        selectedFilter = 'inactive'
                        showFiltersDropdown = false
                      }}
                      class="block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                      class:bg-blue-50={selectedFilter === 'inactive'}
                      class:dark:bg-blue-900={selectedFilter === 'inactive'}
                      style:color="var(--color-text)"
                    >
                      비활성
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- 액션 버튼들 -->
        {#if showActions && allActions.length > 0}
          <div class="flex gap-2">
            {#each allActions as action (action.label)}
              <ThemeButton
                variant={action.variant || 'primary'}
                size="sm"
                onclick={action.onclick}
                class="flex items-center gap-2"
              >
                {#if action.icon}
                  <action.icon size={16} />
                {/if}
                {action.label}
              </ThemeButton>
            {/each}
          </div>
        {/if}
      </div>
    </ThemeCard>
  {/if}

  <!-- 메인 콘텐츠 -->
  <ThemeSpacer size={6}>
    {@render children()}
  </ThemeSpacer>
</div>

<style>
  /* 추가 스타일이 필요한 경우 여기에 작성 */
</style>
