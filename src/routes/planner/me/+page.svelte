<script lang="ts">
  import { onMount } from 'svelte'
  import {
    PackageIcon,
    ZapIcon,
    UsersIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    CircleIcon,
    MessageSquareIcon,
  } from 'lucide-svelte'
  import type {
    ProductWithOwner,
    InitiativeWithOwner,
    FormationWithMembers,
    ThreadWithDetails,
  } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import InitiativeCard from '$lib/planner/components/InitiativeCard.svelte'

  // =============================================
  // State
  // =============================================

  let myProducts = $state<ProductWithOwner[]>([])
  let myInitiatives = $state<InitiativeWithOwner[]>([])
  let myFormations = $state<any[]>([])
  let myThreads = $state<ThreadWithDetails[]>([])
  let allocationData = $state<any>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData() {
    try {
      loading = true
      error = null

      // Get current user's employee_id from session
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        error = 'Failed to get user session'
        return
      }
      const sessionData = await sessionRes.json()
      const employeeId = sessionData.user?.employee_id

      if (!employeeId) {
        error = 'User session not found'
        return
      }

      // Load allocation data first (most important)
      const allocationRes = await fetch('/api/planner/me/allocation')
      if (allocationRes.ok) {
        const data = await allocationRes.json()
        allocationData = data.data
        myFormations = data.data.formations || []
      }

      // Load my products (owner) - filtered by current user
      const productsRes = await fetch(`/api/planner/products?owner_id=${employeeId}`)
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        myProducts = productsData.data || []
      }

      // Load my initiatives (owner) - filtered by current user
      const initiativesRes = await fetch(`/api/planner/initiatives?owner_id=${employeeId}`)
      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json()
        myInitiatives = initiativesData.data || []
      }

      // Load my threads (owner or contributor) - filtered by current user
      const threadsRes = await fetch(
        `/api/planner/threads?state=active&owner_id=${employeeId}&limit=10`,
      )
      if (threadsRes.ok) {
        const threadsData = await threadsRes.json()
        myThreads = threadsData.data || []
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data'
      console.error('Error loading dashboard data:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadData()
  })

  // =============================================
  // Computed Values
  // =============================================

  const totalAllocation = $derived(allocationData?.total_allocation || 0)

  const isOverAllocated = $derived(allocationData?.is_over_allocated || false)

  // 마일스톤이 임박한 이니셔티브 (D-10 이내)
  const upcomingMilestoneInitiatives = $derived.by(() => {
    const now = new Date()
    return myInitiatives
      .filter((initiative) => {
        if (!initiative.milestone?.target_date) return false
        const targetDate = new Date(initiative.milestone.target_date)
        const diffTime = targetDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 10 && diffDays >= -30 // D-10부터 D+30까지 (지난 것도 포함)
      })
      .sort((a, b) => {
        const dateA = new Date(a.milestone!.target_date!)
        const dateB = new Date(b.milestone!.target_date!)
        return dateA.getTime() - dateB.getTime()
      })
  })

  // D-Day 계산
  function getDDay(targetDate: string): { text: string; isOverdue: boolean } {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'D-Day', isOverdue: false }
    if (diffDays > 0) return { text: `D-${diffDays}`, isOverdue: false }
    return { text: `D+${Math.abs(diffDays)}`, isOverdue: true }
  }

  const stats = $derived([
    { title: '내 제품', value: myProducts.length, icon: PackageIcon, color: 'blue' },
    {
      title: '내 이니셔티브',
      value: myInitiatives.length,
      icon: ZapIcon,
      color: 'purple',
    },
    { title: '소속 팀', value: myFormations.length, icon: UsersIcon, color: 'green' },
    {
      title: '총 할당',
      value: `${totalAllocation}%`,
      icon: isOverAllocated ? AlertCircleIcon : CheckCircleIcon,
      color: isOverAllocated ? 'red' : 'green',
    },
  ])

  // =============================================
  // Helpers
  // =============================================

  function getStateColor(state: string): string {
    switch (state) {
      case 'shaping':
        return 'purple'
      case 'active':
        return 'blue'
      case 'shipped':
        return 'green'
      case 'paused':
        return 'orange'
      case 'abandoned':
        return 'red'
      default:
        return 'blue'
    }
  }

  function getStateText(state: string): string {
    switch (state) {
      case 'shaping':
        return '구체화'
      case 'active':
        return '진행 중'
      case 'shipped':
        return '완료'
      case 'paused':
        return '일시중지'
      case 'abandoned':
        return '중단'
      default:
        return state
    }
  }

  function getShapeText(shape: string): string {
    switch (shape) {
      case 'block':
        return '차단'
      case 'question':
        return '질문'
      case 'decision':
        return '결정'
      case 'build':
        return '개발'
      case 'research':
        return '리서치'
      default:
        return shape
    }
  }

  function getShapeColor(shape: string): string {
    switch (shape) {
      case 'block':
        return 'red'
      case 'question':
        return 'yellow'
      case 'decision':
        return 'purple'
      case 'build':
        return 'blue'
      case 'research':
        return 'green'
      default:
        return 'gray'
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }
</script>

<svelte:head>
  <title>내 대시보드 - 플래너</title>
</svelte:head>

<PageLayout title="내 대시보드" subtitle="내가 담당하는 작업과 활동 현황" {stats}>
  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if error}
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
      <p style:color="var(--color-error)">{error}</p>
    </ThemeCard>
  {:else}
    <div class="space-y-6">
      <!-- Allocation Warning -->
      {#if isOverAllocated}
        <ThemeCard variant="outlined" class="border-orange-200 bg-orange-50">
          <div class="flex items-start gap-3">
            <AlertCircleIcon size={20} style="color: var(--color-orange);" />
            <div>
              <h3 class="font-semibold mb-1" style:color="var(--color-orange)">할당 초과 경고</h3>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                현재 총 할당 비율이 {totalAllocation}%로 100%를 초과했습니다. 팀 리더와 상의하여
                업무 부담을 조정하세요.
              </p>
            </div>
          </div>
        </ThemeCard>
      {/if}

      <!-- Upcoming Milestone Initiatives -->
      {#if upcomingMilestoneInitiatives.length > 0}
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
              마일스톤 임박 이니셔티브
            </h3>
          </div>

          <div class="space-y-3">
            {#each upcomingMilestoneInitiatives as initiative}
              {@const dday = getDDay(initiative.milestone.target_date)}
              <div class="relative">
                <a href="/planner/initiatives/{initiative.id}" class="block">
                  <div
                    class="rounded-lg transition-all hover:shadow-md"
                    style:background={dday.isOverdue
                      ? 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))'
                      : 'linear-gradient(to bottom right, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.06))'}
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <h4 class="font-medium mb-1" style:color="var(--color-text-primary)">
                            {initiative.title}
                          </h4>
                          <p
                            class="text-xs mb-2 line-clamp-2"
                            style:color="var(--color-text-secondary)"
                          >
                            {initiative.intent}
                          </p>
                          <div class="flex items-center gap-3 text-xs">
                            <span style:color="var(--color-text-tertiary)">
                              {initiative.milestone.name}
                            </span>
                            <span style:color="var(--color-text-tertiary)">
                              목표: {new Date(initiative.milestone.target_date).toLocaleDateString(
                                'ko-KR',
                              )}
                            </span>
                          </div>
                        </div>
                        <span
                          class="ml-3 px-3 py-1.5 text-sm font-bold rounded-lg border-2 whitespace-nowrap"
                          style:background={dday.isOverdue
                            ? 'var(--color-red-light)'
                            : 'var(--color-yellow-light)'}
                          style:color={dday.isOverdue
                            ? 'var(--color-red)'
                            : 'var(--color-yellow-dark)'}
                          style:border-color={dday.isOverdue
                            ? 'var(--color-red)'
                            : 'var(--color-yellow)'}
                        >
                          {dday.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- My Products -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
            내가 책임지는 제품
          </h3>
          <a
            href="/planner/products"
            class="text-sm transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            모두 보기 →
          </a>
        </div>

        {#if myProducts.length === 0}
          <ThemeCard variant="default">
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">
                책임지는 제품이 없습니다.
              </p>
            </div>
          </ThemeCard>
        {:else}
          <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={4}>
            {#each myProducts as product}
              <a href="/planner/products/{product.id}" class="block">
                <ThemeCard variant="default" hover clickable>
                  <div class="mb-3">
                    <h4 class="font-semibold mb-1" style:color="var(--color-text-primary)">
                      {product.name}
                    </h4>
                    <p class="text-xs font-mono" style:color="var(--color-text-tertiary)">
                      {product.code}
                    </p>
                  </div>
                  <div
                    class="flex items-center gap-4 text-xs pt-3"
                    style:border-top="1px solid var(--color-border-light)"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold" style:color="var(--color-primary)">
                        {product.initiative_count || 0}
                      </span>
                      <span style:color="var(--color-text-secondary)">이니셔티브</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold" style:color="var(--color-purple)">
                        {product.milestone_count || 0}
                      </span>
                      <span style:color="var(--color-text-secondary)">마일스톤</span>
                    </div>
                  </div>
                </ThemeCard>
              </a>
            {/each}
          </ThemeGrid>
        {/if}
      </div>

      <!-- My Initiatives -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
            내가 담당하는 이니셔티브
          </h3>
          <a
            href="/planner/initiatives/new"
            class="text-sm transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            + 새 이니셔티브
          </a>
        </div>

        {#if myInitiatives.length === 0}
          <ThemeCard variant="default">
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">
                담당하는 이니셔티브가 없습니다.
              </p>
            </div>
          </ThemeCard>
        {:else}
          <div class="space-y-3">
            {#each myInitiatives as initiative}
              {@const stateColor = getStateColor(initiative.state)}
              <a href="/planner/initiatives/{initiative.id}" class="block">
                <ThemeCard variant="default" hover clickable>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h4 class="font-medium mb-1" style:color="var(--color-text-primary)">
                        {initiative.title}
                      </h4>
                      <p class="text-xs line-clamp-2" style:color="var(--color-text-secondary)">
                        {initiative.intent}
                      </p>
                    </div>
                    <span
                      class="ml-3 px-2 py-1 text-xs font-medium rounded-full"
                      style:background="var(--color-{stateColor}-light)"
                      style:color="var(--color-{stateColor})"
                    >
                      {getStateText(initiative.state)}
                    </span>
                  </div>
                </ThemeCard>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <!-- My Formations -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
            내가 속한 팀
          </h3>
          <a
            href="/planner/formations"
            class="text-sm transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            모두 보기 →
          </a>
        </div>

        {#if myFormations.length === 0}
          <ThemeCard variant="default">
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">소속된 팀이 없습니다.</p>
            </div>
          </ThemeCard>
        {:else}
          <ThemeGrid cols={1} mdCols={2} gap={4}>
            {#each myFormations as formation}
              <a href="/planner/formations/{formation.formation_id}" class="block">
                <ThemeCard variant="default" hover clickable>
                  <h4 class="font-semibold mb-2" style:color="var(--color-text-primary)">
                    {formation.formation_name}
                  </h4>
                  <div
                    class="flex items-center gap-3 text-xs mb-2"
                    style:color="var(--color-text-secondary)"
                  >
                    <span>{formation.initiatives?.length || 0}개 이니셔티브</span>
                    <span
                      class="font-semibold"
                      style:color={formation.total_allocation > 100
                        ? 'var(--color-orange)'
                        : 'var(--color-green)'}
                    >
                      할당: {formation.total_allocation}%
                    </span>
                  </div>
                  {#if formation.initiatives && formation.initiatives.length > 0}
                    <div class="text-xs" style:color="var(--color-text-tertiary)">
                      {#each formation.initiatives.slice(0, 2) as init, idx}
                        {init.initiative_title}
                        {#if idx < Math.min(1, formation.initiatives.length - 1)},
                        {/if}
                      {/each}
                      {#if formation.initiatives.length > 2}
                        외 {formation.initiatives.length - 2}개
                      {/if}
                    </div>
                  {/if}
                </ThemeCard>
              </a>
            {/each}
          </ThemeGrid>
        {/if}
      </div>

      <!-- My Recent Threads -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
            최근 내 활동
          </h3>
        </div>

        {#if myThreads.length === 0}
          <ThemeCard variant="default">
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">최근 활동이 없습니다.</p>
            </div>
          </ThemeCard>
        {:else}
          <div class="space-y-3">
            {#each myThreads as thread}
              {@const shapeColor = getShapeColor(thread.shape)}
              <a href="/planner/threads/{thread.id}" class="block">
                <ThemeCard variant="default" hover clickable>
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-medium" style:color="var(--color-text-primary)">
                          {thread.title}
                        </h4>
                        <span
                          class="px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap"
                          style:background="var(--color-{shapeColor}-light)"
                          style:color="var(--color-{shapeColor}-dark)"
                          style:border-color="var(--color-{shapeColor})"
                        >
                          {getShapeText(thread.shape)}
                        </span>
                      </div>
                      <p class="text-xs mb-2" style:color="var(--color-text-secondary)">
                        {thread.initiative_title}
                      </p>
                      <div
                        class="flex items-center gap-3 text-xs"
                        style:color="var(--color-text-tertiary)"
                      >
                        {#if thread.reply_count > 0}
                          <div class="flex items-center gap-1">
                            <MessageSquareIcon size={12} />
                            <span>{thread.reply_count}</span>
                          </div>
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
    </div>
  {/if}
</PageLayout>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
