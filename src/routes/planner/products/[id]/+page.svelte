<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import {
    PackageIcon,
    ArrowLeftIcon,
    TargetIcon,
    ZapIcon,
    LinkIcon,
    GithubIcon,
    FileTextIcon,
  } from 'lucide-svelte'
  import type {
    ProductWithOwner,
    MilestoneWithProduct,
    InitiativeWithOwner,
  } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemePageHeader from '$lib/components/ui/ThemePageHeader.svelte'
  import MilestoneModal from '$lib/planner/components/MilestoneModal.svelte'

  // =============================================
  // State
  // =============================================

  let product = $state<ProductWithOwner | null>(null)
  let milestones = $state<MilestoneWithProduct[]>([])
  let initiatives = $state<InitiativeWithOwner[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let activeTab = $state('overview')
  let showMilestoneModal = $state(false)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData() {
    try {
      loading = true
      error = null

      const id = $page.params.id

      // Load product
      const productRes = await fetch(`/api/planner/products/${id}`)
      if (!productRes.ok) throw new Error('Failed to load product')
      const productData = await productRes.json()
      product = productData.data

      // Load milestones
      await loadMilestones()

      // Load initiatives
      const initiativesRes = await fetch(`/api/planner/initiatives?product_id=${id}`)
      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json()
        initiatives = initiativesData.data
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data'
      console.error('Error loading product:', e)
    } finally {
      loading = false
    }
  }

  async function loadMilestones() {
    const id = $page.params.id
    const milestonesRes = await fetch(`/api/planner/milestones?product_id=${id}`)
    if (milestonesRes.ok) {
      const milestonesData = await milestonesRes.json()
      milestones = milestonesData.data
    }
  }

  onMount(() => {
    loadData()
  })

  // =============================================
  // Helpers
  // =============================================

  function getMilestoneStatusColor(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'blue'
      case 'in_progress':
        return 'orange'
      case 'achieved':
        return 'green'
      case 'missed':
        return 'red'
      default:
        return 'blue'
    }
  }

  function getMilestoneStatusText(status: string): string {
    switch (status) {
      case 'upcoming':
        return '예정'
      case 'in_progress':
        return '진행 중'
      case 'achieved':
        return '달성'
      case 'missed':
        return '미달성'
      default:
        return status
    }
  }

  function getInitiativeStateColor(state: string): string {
    switch (state) {
      case 'shaping':
        return 'purple'
      case 'active':
        return 'blue'
      case 'shipped':
        return 'green'
      case 'paused':
        return 'yellow'
      case 'abandoned':
        return 'red'
      default:
        return 'blue'
    }
  }

  function getInitiativeStateText(state: string): string {
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

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Tab configuration
  const tabs = [
    { id: 'overview', label: '개요', icon: PackageIcon },
    { id: 'roadmap', label: '로드맵', icon: TargetIcon, badge: milestones.length },
    { id: 'initiatives', label: '이니셔티브', icon: ZapIcon, badge: initiatives.length },
  ]
</script>

<svelte:head>
  <title>{product?.name || '제품'} - 플래너</title>
</svelte:head>

{#if loading}
  <div class="max-w-7xl mx-auto px-4 py-12">
    <div class="text-center" style:color="var(--color-text-secondary)">로딩 중...</div>
  </div>
{:else if error || !product}
  <div class="max-w-7xl mx-auto px-4 py-12">
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50">
      <p style:color="var(--color-error)">{error || '제품을 찾을 수 없습니다'}</p>
    </ThemeCard>
  </div>
{:else}
  <!-- Header -->
  <div>
    <div class="flex items-center gap-3 mb-4">
      <a href="/planner/products" class="flex items-center gap-2 transition hover:opacity-70">
        <ArrowLeftIcon size={16} style="color: var(--color-text-secondary);" />
        <span class="text-sm" style:color="var(--color-text-secondary)">제품 목록</span>
      </a>
    </div>

    <ThemePageHeader title={product.name} subtitle={product.code} children={undefined} />

    <!-- Product Info -->
    <ThemeCard variant="default" class="mb-6">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          {#if product.description}
            <p class="text-base leading-relaxed" style:color="var(--color-text-secondary)">
              {product.description}
            </p>
          {/if}
        </div>

        <span
          class="ml-4 px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap"
          style:background={product.status === 'active'
            ? 'var(--color-green-light)'
            : 'var(--color-surface-elevated)'}
          style:color={product.status === 'active'
            ? 'var(--color-green)'
            : 'var(--color-text-secondary)'}
        >
          {product.status === 'active' ? '활성' : '보관'}
        </span>
      </div>

      <div
        class="flex items-center gap-6 pt-4"
        style:border-top="1px solid var(--color-border-light)"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">책임자</span>
          <span class="text-sm font-medium" style:color="var(--color-text-primary)">
            {formatKoreanName(product.owner.last_name, product.owner.first_name)}
          </span>
        </div>

        {#if product.repository_url}
          <a
            href={product.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-sm transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            <GithubIcon size={16} />
            <span>저장소</span>
          </a>
        {/if}
        {#if product.documentation_url}
          <a
            href={product.documentation_url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-sm transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            <FileTextIcon size={16} />
            <span>문서</span>
          </a>
        {/if}
      </div>
    </ThemeCard>
  </div>

  <!-- Tabs -->
  <ThemeTabs {tabs} bind:activeTab variant="underline">
    {#snippet children(tab)}
      {#if tab.id === 'overview'}
        <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={6}>
          <ThemeCard variant="default">
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style:background="var(--color-blue-light)"
              >
                <ZapIcon size={20} style="color: var(--color-blue);" />
              </div>
              <div>
                <p class="text-xs" style:color="var(--color-text-tertiary)">이니셔티브</p>
                <p class="text-2xl font-semibold" style:color="var(--color-text-primary)">
                  {product.initiative_count}
                </p>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard variant="default">
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style:background="var(--color-orange-light)"
              >
                <TargetIcon size={20} style="color: var(--color-orange);" />
              </div>
              <div>
                <p class="text-xs" style:color="var(--color-text-tertiary)">마일스톤</p>
                <p class="text-2xl font-semibold" style:color="var(--color-text-primary)">
                  {product.milestone_count}
                </p>
              </div>
            </div>
          </ThemeCard>

          <ThemeCard variant="default">
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style:background="var(--color-green-light)"
              >
                <ZapIcon size={20} style="color: var(--color-green);" />
              </div>
              <div>
                <p class="text-xs" style:color="var(--color-text-tertiary)">활성 이니셔티브</p>
                <p class="text-2xl font-semibold" style:color="var(--color-text-primary)">
                  {product.active_initiative_count}
                </p>
              </div>
            </div>
          </ThemeCard>
        </ThemeGrid>
      {:else if tab.id === 'roadmap'}
        <ThemeCard variant="default">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">마일스톤</h3>
            <button
              type="button"
              class="text-sm transition hover:opacity-70"
              style:color="var(--color-primary)"
              onclick={() => (showMilestoneModal = true)}
            >
              + 마일스톤 추가
            </button>
          </div>

          {#if milestones.length === 0}
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">
                아직 마일스톤이 없습니다.
              </p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each milestones as milestone}
                {@const statusColor = getMilestoneStatusColor(milestone.status)}
                <div
                  class="p-4 rounded-lg"
                  style:background="var(--color-surface-elevated)"
                  style:border="1px solid var(--color-border)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="text-sm font-medium" style:color="var(--color-text-primary)">
                      {milestone.name}
                    </h4>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded-full"
                      style:background="var(--color-{statusColor}-light)"
                      style:color="var(--color-{statusColor})"
                    >
                      {getMilestoneStatusText(milestone.status)}
                    </span>
                  </div>
                  {#if milestone.description}
                    <p class="text-xs mb-2" style:color="var(--color-text-secondary)">
                      {milestone.description}
                    </p>
                  {/if}
                  <div
                    class="flex items-center gap-4 text-xs"
                    style:color="var(--color-text-tertiary)"
                  >
                    <span>목표일: {formatDate(milestone.target_date)}</span>
                    <span>{milestone.initiative_count}개 이니셔티브</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </ThemeCard>
      {:else if tab.id === 'initiatives'}
        <ThemeCard variant="default">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold" style:color="var(--color-text-primary)">
              이니셔티브
            </h3>
            <a
              href="/planner/initiatives/new?product_id={product.id}"
              class="text-sm transition hover:opacity-70"
              style:color="var(--color-primary)"
            >
              + 이니셔티브 추가
            </a>
          </div>

          {#if initiatives.length === 0}
            <div class="text-center py-8">
              <p class="text-sm" style:color="var(--color-text-tertiary)">
                아직 이니셔티브가 없습니다.
              </p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each initiatives as initiative}
                {@const stateColor = getInitiativeStateColor(initiative.state)}
                <a href="/planner/initiatives/{initiative.id}" class="block">
                  <div
                    class="p-4 rounded-lg transition hover:opacity-80"
                    style:background="var(--color-surface-elevated)"
                    style:border="1px solid var(--color-border)"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h4 class="text-sm font-medium" style:color="var(--color-text-primary)">
                          {initiative.title}
                        </h4>
                        <p
                          class="text-xs mt-1 line-clamp-2"
                          style:color="var(--color-text-secondary)"
                        >
                          {initiative.intent}
                        </p>
                      </div>
                      <span
                        class="ml-3 px-2 py-1 text-xs font-medium rounded-full"
                        style:background="var(--color-{stateColor}-light)"
                        style:color="var(--color-{stateColor})"
                      >
                        {getInitiativeStateText(initiative.state)}
                      </span>
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </ThemeCard>
      {/if}
    {/snippet}
  </ThemeTabs>
{/if}

<!-- Milestone Modal -->
{#if product}
  <MilestoneModal
    bind:open={showMilestoneModal}
    productId={product.id}
    onclose={() => (showMilestoneModal = false)}
    onsave={() => {
      showMilestoneModal = false
      loadMilestones()
    }}
  />
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
