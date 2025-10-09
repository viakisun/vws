<script lang="ts">
  import { onMount } from 'svelte'
  import {
    PackageIcon,
    ZapIcon,
    UsersIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    TrendingUpIcon,
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
    </div>
  {/if}
</PageLayout>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
