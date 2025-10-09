<script lang="ts">
  import { onMount } from 'svelte'
  import {
    PackageIcon,
    ZapIcon,
    UsersIcon,
    TargetIcon,
    TrendingUpIcon,
    ClockIcon,
  } from 'lucide-svelte'
  import type {
    InitiativeWithOwner,
    ThreadWithDetails,
    ProductWithOwner,
    FormationWithMembers,
  } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'

  // =============================================
  // State
  // =============================================

  let products = $state<ProductWithOwner[]>([])
  let activeInitiatives = $state<InitiativeWithOwner[]>([])
  let recentThreads = $state<ThreadWithDetails[]>([])
  let formations = $state<FormationWithMembers[]>([])
  let myInitiatives = $state<InitiativeWithOwner[]>([])
  let myThreads = $state<ThreadWithDetails[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let activeTab = $state('overview')

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData() {
    try {
      loading = true
      error = null

      // Get current user's employee_id from session
      const sessionRes = await fetch('/api/auth/session')
      let employeeId: string | undefined
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        employeeId = sessionData.user?.employee_id
      }

      // Load products
      const productsRes = await fetch('/api/planner/products?status=active')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        products = productsData.data || []
      }

      // Load active initiatives (exclude shipped and abandoned)
      const initiativesRes = await fetch(
        '/api/planner/initiatives?status=active&status=paused&status=inbox&limit=20',
      )
      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json()
        activeInitiatives = initiativesData.data || []
      }

      // Load recent thread activity
      const threadsRes = await fetch('/api/planner/threads?state=active&limit=30')
      if (threadsRes.ok) {
        const threadsData = await threadsRes.json()
        recentThreads = threadsData.data || []
      }

      // Load formations
      const formationsRes = await fetch('/api/planner/formations')
      if (formationsRes.ok) {
        const formationsData = await formationsRes.json()
        formations = formationsData.data || []
      }

      // Load my initiatives (filtered by current user)
      if (employeeId) {
        const myInitiativesRes = await fetch(
          `/api/planner/initiatives?owner_id=${employeeId}&limit=20`,
        )
        if (myInitiativesRes.ok) {
          const myInitiativesData = await myInitiativesRes.json()
          myInitiatives = myInitiativesData.data || []
        }

        // Load my threads (filtered by current user)
        const myThreadsRes = await fetch(
          `/api/planner/threads?state=active&owner_id=${employeeId}&limit=20`,
        )
        if (myThreadsRes.ok) {
          const myThreadsData = await myThreadsRes.json()
          myThreads = myThreadsData.data || []
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data'
      console.error('Error loading planner data:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadData()
  })

  // =============================================
  // Helpers
  // =============================================

  function getThreadCountText(initiative: InitiativeWithOwner): string {
    const counts = initiative.thread_counts
    const parts: string[] = []

    if (counts.blocks > 0) parts.push(`🔴 ${counts.blocks}`)
    if (counts.questions > 0) parts.push(`🟡 ${counts.questions}`)
    if (counts.decisions > 0) parts.push(`🟣 ${counts.decisions}`)

    return parts.join(' · ') || `${counts.total} threads`
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  function getDDay(targetDate: string): {
    text: string
    isOverdue: boolean
    daysRemaining: number
    colorLevel: 'normal' | 'warning' | 'urgent' | 'overdue'
  } {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let text: string
    let isOverdue = false
    let colorLevel: 'normal' | 'warning' | 'urgent' | 'overdue' = 'normal'

    if (diffDays === 0) {
      text = 'D-Day'
      colorLevel = 'urgent'
    } else if (diffDays > 0) {
      text = `D-${diffDays}`
      if (diffDays <= 3) {
        colorLevel = 'urgent'
      } else if (diffDays <= 14) {
        colorLevel = 'warning'
      }
    } else {
      text = `D+${Math.abs(diffDays)}`
      isOverdue = true
      colorLevel = 'overdue'
    }

    return { text, isOverdue, daysRemaining: diffDays, colorLevel }
  }

  function getStateColor(status: string): string {
    switch (status) {
      case 'inbox':
        return 'gray'
      case 'active':
        return 'blue'
      case 'paused':
        return 'orange'
      case 'shipped':
        return 'green'
      case 'abandoned':
        return 'red'
      default:
        return 'blue'
    }
  }

  function getStateText(status: string): string {
    switch (status) {
      case 'inbox':
        return 'INBOX'
      case 'active':
        return '진행중'
      case 'paused':
        return '일시중지'
      case 'shipped':
        return '완료'
      case 'abandoned':
        return '중단'
      default:
        return status
    }
  }

  function getShapeIcon(shape: string): string {
    switch (shape) {
      case 'block':
        return '🔴'
      case 'question':
        return '🟡'
      case 'decision':
        return '🟣'
      case 'build':
        return '🔵'
      case 'research':
        return '🟢'
      default:
        return '⚪'
    }
  }

  // Computed stats
  const totalProducts = $derived(products.length)
  const totalInitiatives = $derived(activeInitiatives.length)
  const totalThreads = $derived(recentThreads.length)
  const totalFormations = $derived(formations.length)

  // Tab configuration
  const tabs = [
    { id: 'overview', label: '개요', icon: TrendingUpIcon },
    { id: 'my-work', label: '내 작업', icon: ClockIcon },
    { id: 'activity', label: '활동', icon: ZapIcon },
  ]
</script>

<svelte:head>
  <title>플래너 - VWS</title>
</svelte:head>

<PageLayout
  title="플래너"
  subtitle="의도적인 업무를 위한 시스템"
  stats={[
    { title: '제품', value: totalProducts, icon: PackageIcon, color: 'blue' },
    { title: '활성 이니셔티브', value: totalInitiatives, icon: ZapIcon, color: 'purple' },
    { title: '활성 스레드', value: totalThreads, color: 'orange' },
    { title: '팀', value: totalFormations, icon: UsersIcon, color: 'green' },
  ]}
  actions={[
    {
      label: '제품 보기',
      variant: 'secondary' as const,
      icon: PackageIcon,
      href: '/planner/products',
    },
    {
      label: '마일스톤',
      variant: 'secondary' as const,
      icon: TargetIcon,
      href: '/planner/milestones',
    },
    {
      label: '팀 구성',
      variant: 'secondary' as const,
      icon: UsersIcon,
      href: '/planner/formations',
    },
    {
      label: '새 이니셔티브',
      variant: 'primary' as const,
      icon: ZapIcon,
      href: '/planner/initiatives/new',
    },
  ]}
>
  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if error}
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
      <p style:color="var(--color-error)">{error}</p>
    </ThemeCard>
  {:else}
    <ThemeTabs {tabs} bind:activeTab variant="underline">
      {#snippet children(tab)}
        {#if tab.id === 'overview'}
          <!-- Overview Tab -->
          <div class="space-y-6">
            <!-- Products -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">제품</h3>
                <a
                  href="/planner/products"
                  class="text-sm transition hover:opacity-70"
                  style:color="var(--color-primary)"
                >
                  모두 보기 →
                </a>
              </div>

              {#if products.length === 0}
                <ThemeCard variant="default">
                  <div class="text-center py-8">
                    <p class="text-sm" style:color="var(--color-text-tertiary)">
                      아직 제품이 없습니다.
                    </p>
                  </div>
                </ThemeCard>
              {:else}
                <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={4}>
                  {#each products.slice(0, 6) as product}
                    <a href="/planner/products/{product.id}" class="block">
                      <ThemeCard variant="default" hover clickable>
                        <h4 class="font-semibold mb-1" style:color="var(--color-text-primary)">
                          {product.name}
                        </h4>
                        <p class="text-xs mb-3 font-mono" style:color="var(--color-text-tertiary)">
                          {product.code}
                        </p>
                        <div
                          class="flex items-center gap-3 text-xs"
                          style:color="var(--color-text-secondary)"
                        >
                          <span>{product.initiative_count} 이니셔티브</span>
                          <span>{product.milestone_count} 마일스톤</span>
                        </div>
                      </ThemeCard>
                    </a>
                  {/each}
                </ThemeGrid>
              {/if}
            </div>

            <!-- Active Initiatives -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
                  진행 중인 이니셔티브
                </h3>
              </div>

              {#if activeInitiatives.length === 0}
                <ThemeCard variant="default">
                  <div class="text-center py-8">
                    <p class="text-sm" style:color="var(--color-text-tertiary)">
                      진행 중인 이니셔티브가 없습니다.
                    </p>
                  </div>
                </ThemeCard>
              {:else}
                <div class="space-y-3">
                  {#each activeInitiatives.slice(0, 8) as initiative}
                    {@const dday = initiative.horizon ? getDDay(initiative.horizon) : null}
                    {@const isOverdue =
                      dday?.colorLevel === 'overdue' && initiative.status !== 'shipped'}
                    {@const stateColor = getStateColor(initiative.status)}
                    {@const bgStyle = isOverdue
                      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                      : dday?.colorLevel === 'urgent' && initiative.status !== 'shipped'
                        ? 'linear-gradient(to bottom right, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.08))'
                        : dday?.colorLevel === 'warning' && initiative.status !== 'shipped'
                          ? 'linear-gradient(to bottom right, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.04))'
                          : ''}
                    {@const textColor = isOverdue ? '#ffffff' : 'var(--color-text-primary)'}
                    {@const secondaryTextColor = isOverdue
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'var(--color-text-secondary)'}
                    {@const tertiaryTextColor = isOverdue
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'var(--color-text-tertiary)'}
                    {@const badgeColor = isOverdue ? '#ffffff' : `var(--color-${stateColor})`}
                    {@const badgeBg = isOverdue
                      ? 'rgba(255, 255, 255, 0.2)'
                      : `var(--color-${stateColor}-light)`}
                    <a href="/planner/initiatives/{initiative.id}" class="block">
                      <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <!-- Product / Milestone / Title -->
                            {#if initiative.product || initiative.milestone}
                              <div
                                class="flex items-center gap-2 mb-1 text-xs"
                                style:color={tertiaryTextColor}
                              >
                                {#if initiative.product}
                                  <span>{initiative.product.name}</span>
                                {/if}
                                {#if initiative.milestone}
                                  <span>/</span>
                                  <span>{initiative.milestone.name}</span>
                                {/if}
                              </div>
                            {/if}
                            <h4 class="font-medium mb-1" style:color={textColor}>
                              {initiative.title}
                            </h4>
                            <div
                              class="flex items-center gap-3 text-xs"
                              style:color={secondaryTextColor}
                            >
                              <span>
                                {formatKoreanName(
                                  initiative.owner.last_name,
                                  initiative.owner.first_name,
                                )}
                              </span>
                              {#if initiative.horizon}
                                <span>목표: {formatDate(initiative.horizon)}</span>
                              {/if}
                              <span>{getThreadCountText(initiative)}</span>
                            </div>
                          </div>
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full"
                            style:background={badgeBg}
                            style:color={badgeColor}
                          >
                            {getStateText(initiative.status)}
                          </span>
                        </div>
                      </ThemeCard>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {:else if tab.id === 'my-work'}
          <!-- My Work Tab -->
          <div class="space-y-6">
            <!-- My Initiatives -->
            <div>
              <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
                내가 담당한 이니셔티브
              </h3>

              {#if myInitiatives.length === 0}
                <ThemeCard variant="default">
                  <div class="text-center py-8">
                    <p class="text-sm" style:color="var(--color-text-tertiary)">
                      담당한 이니셔티브가 없습니다.
                    </p>
                  </div>
                </ThemeCard>
              {:else}
                <div class="space-y-3">
                  {#each myInitiatives as initiative}
                    {@const dday = initiative.horizon ? getDDay(initiative.horizon) : null}
                    {@const isOverdue =
                      dday?.colorLevel === 'overdue' && initiative.status !== 'shipped'}
                    {@const stateColor = getStateColor(initiative.status)}
                    {@const bgStyle = isOverdue
                      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                      : dday?.colorLevel === 'urgent' && initiative.status !== 'shipped'
                        ? 'linear-gradient(to bottom right, rgba(251, 146, 60, 0.15), rgba(251, 146, 60, 0.08))'
                        : dday?.colorLevel === 'warning' && initiative.status !== 'shipped'
                          ? 'linear-gradient(to bottom right, rgba(234, 179, 8, 0.08), rgba(234, 179, 8, 0.04))'
                          : ''}
                    {@const textColor = isOverdue ? '#ffffff' : 'var(--color-text-primary)'}
                    {@const secondaryTextColor = isOverdue
                      ? 'rgba(255, 255, 255, 0.9)'
                      : 'var(--color-text-secondary)'}
                    {@const tertiaryTextColor = isOverdue
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'var(--color-text-tertiary)'}
                    {@const badgeColor = isOverdue ? '#ffffff' : `var(--color-${stateColor})`}
                    {@const badgeBg = isOverdue
                      ? 'rgba(255, 255, 255, 0.2)'
                      : `var(--color-${stateColor}-light)`}
                    <a href="/planner/initiatives/{initiative.id}" class="block">
                      <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <!-- Product / Milestone / Title -->
                            {#if initiative.product || initiative.milestone}
                              <div
                                class="flex items-center gap-2 mb-1 text-xs"
                                style:color={tertiaryTextColor}
                              >
                                {#if initiative.product}
                                  <span>{initiative.product.name}</span>
                                {/if}
                                {#if initiative.milestone}
                                  <span>/</span>
                                  <span>{initiative.milestone.name}</span>
                                {/if}
                              </div>
                            {/if}
                            <h4 class="font-medium mb-1" style:color={textColor}>
                              {initiative.title}
                            </h4>
                            <p class="text-xs" style:color={secondaryTextColor}>
                              {getThreadCountText(initiative)}
                            </p>
                          </div>
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full"
                            style:background={badgeBg}
                            style:color={badgeColor}
                          >
                            {getStateText(initiative.status)}
                          </span>
                        </div>
                      </ThemeCard>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- My Threads -->
            <div>
              <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
                내가 담당한 스레드
              </h3>

              {#if myThreads.length === 0}
                <ThemeCard variant="default">
                  <div class="text-center py-8">
                    <p class="text-sm" style:color="var(--color-text-tertiary)">
                      담당한 스레드가 없습니다.
                    </p>
                  </div>
                </ThemeCard>
              {:else}
                <div class="space-y-3">
                  {#each myThreads as thread}
                    <a href="/planner/threads/{thread.id}" class="block">
                      <ThemeCard variant="default" hover clickable>
                        <p class="text-sm font-medium" style:color="var(--color-text-primary)">
                          {getShapeIcon(thread.shape)}
                          {thread.title}
                        </p>
                      </ThemeCard>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {:else if tab.id === 'activity'}
          <!-- Activity Tab -->
          <div>
            <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
              최근 활동
            </h3>

            {#if recentThreads.length === 0}
              <ThemeCard variant="default">
                <div class="text-center py-8">
                  <p class="text-sm" style:color="var(--color-text-tertiary)">
                    최근 활동이 없습니다.
                  </p>
                </div>
              </ThemeCard>
            {:else}
              <div class="space-y-3">
                {#each recentThreads as thread}
                  <a href="/planner/threads/{thread.id}" class="block">
                    <ThemeCard variant="default" hover clickable>
                      <div class="flex items-start gap-3">
                        <span class="text-xl">{getShapeIcon(thread.shape)}</span>
                        <div class="flex-1">
                          <h4 class="font-medium mb-1" style:color="var(--color-text-primary)">
                            {thread.title}
                          </h4>
                          <p class="text-xs mb-2" style:color="var(--color-text-secondary)">
                            {thread.initiative_title}
                          </p>
                          <div
                            class="flex items-center gap-3 text-xs"
                            style:color="var(--color-text-tertiary)"
                          >
                            <span>
                              {formatKoreanName(thread.owner.last_name, thread.owner.first_name)}
                            </span>
                            {#if thread.reply_count > 0}
                              <span>💬 {thread.reply_count}</span>
                            {/if}
                            <span>{formatDate(thread.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </ThemeCard>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/snippet}
    </ThemeTabs>
  {/if}
</PageLayout>
