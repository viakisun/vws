<script lang="ts">
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import InitiativeCard from '$lib/planner/components/InitiativeCard.svelte'
  import MilestoneModal from '$lib/planner/components/MilestoneModal.svelte'
  import ProductEditModal from '$lib/planner/components/ProductEditModal.svelte'
  import ProductReferencesSection from '$lib/planner/components/ProductReferencesSection.svelte'
  import type {
    InitiativeWithOwner,
    MilestoneWithProduct,
    ProductWithOwner,
  } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import { FileTextIcon, GithubIcon, PencilIcon } from 'lucide-svelte'
  import type { PageData } from './$types'

  const { data }: { data: PageData } = $props()

  // =============================================
  // State
  // =============================================

  let product = $state<ProductWithOwner | null>(null)
  let milestones = $state<MilestoneWithProduct[]>([])
  let initiatives = $state<InitiativeWithOwner[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showMilestoneModal = $state(false)
  let editingMilestone = $state<MilestoneWithProduct | null>(null)
  let showProductEditModal = $state(false)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadData(id: string) {
    try {
      loading = true
      error = null

      if (!id) {
        throw new Error('Product ID is missing')
      }

      // Load product
      const productRes = await fetch(`/api/planner/products/${id}`)
      if (!productRes.ok) throw new Error('Failed to load product')
      const productData = await productRes.json()
      product = productData.data

      // Load milestones
      await loadMilestones(id)

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

  async function loadMilestones(id: string) {
    if (!id) return

    const milestonesRes = await fetch(`/api/planner/milestones?product_id=${id}`)
    if (milestonesRes.ok) {
      const milestonesData = await milestonesRes.json()
      milestones = milestonesData.data
    }
  }

  // Load data when productId changes
  $effect(() => {
    const id = data.productId
    console.log('Effect running, productId from data:', id)
    if (id) {
      console.log('Loading data for product:', id)
      loadData(id)
    } else {
      console.log('No productId available in data')
      error = 'Product ID is missing from URL'
      loading = false
    }
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

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function getProductStatusText(status: string): string {
    switch (status) {
      case 'planning':
        return '기획'
      case 'development':
        return '개발'
      case 'beta':
        return '베타'
      case 'active':
        return '운영'
      case 'maintenance':
        return '유지보수'
      case 'sunset':
        return '종료예정'
      case 'archived':
        return '종료'
      default:
        return status
    }
  }

  function getProductStatusColor(status: string): string {
    switch (status) {
      case 'planning':
        return 'gray'
      case 'development':
        return 'blue'
      case 'beta':
        return 'purple'
      case 'active':
        return 'green'
      case 'maintenance':
        return 'orange'
      case 'sunset':
        return 'red'
      case 'archived':
        return 'gray'
      default:
        return 'gray'
    }
  }
</script>

<svelte:head>
  <title>{product?.name || '제품'} - 플래너</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 space-y-6">
  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if error || !product}
    <div class="p-4 rounded-lg border border-red-200 bg-red-50" style:color="var(--color-error)">
      {error || '제품을 찾을 수 없습니다'}
    </div>
  {:else}
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm" style:color="var(--color-text-tertiary)">
      <a href="/planner" class="hover:underline">플래너</a>
      <span>/</span>
      <span style:color="var(--color-text-secondary)">{product.name}</span>
    </div>

    <!-- Product Header -->
    <div
      class="rounded-lg border p-6"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold" style:color="var(--color-text-primary)">
              {product.name}
            </h1>
            {#if product}
              {@const statusColor = getProductStatusColor(product.status)}
              <span
                class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
                style:background="var(--color-{statusColor}-light)"
                style:color="var(--color-{statusColor}-dark)"
                style:border-color="var(--color-{statusColor})"
                style:opacity="0.9"
              >
                {getProductStatusText(product.status)}
              </span>
            {/if}
          </div>
          {#if product.description}
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {product.description}
            </p>
          {/if}
        </div>
        <div class="flex items-center gap-2 ml-4">
          <button
            type="button"
            onclick={() => (showProductEditModal = true)}
            class="p-2 rounded-lg transition hover:opacity-70"
            style:background="var(--color-surface-elevated)"
            style:color="var(--color-text-secondary)"
            title="제품 편집"
          >
            <PencilIcon size={16} />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-6 pt-4" style:border-top="1px solid var(--color-border)">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold" style:color="var(--color-text-tertiary)">책임자</span>
          <span class="text-sm font-medium" style:color="var(--color-text-primary)">
            {formatKoreanName(product.owner.last_name, product.owner.first_name)}
          </span>
        </div>

        {#if product.repository_url}
          <a
            href={product.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-xs transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            <GithubIcon size={14} />
            <span>저장소</span>
          </a>
        {/if}
        {#if product.documentation_url}
          <a
            href={product.documentation_url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-xs transition hover:opacity-70"
            style:color="var(--color-primary)"
          >
            <FileTextIcon size={14} />
            <span>문서</span>
          </a>
        {/if}
      </div>
    </div>

    <!-- References Section -->
    <ProductReferencesSection productId={product.id} canEdit={true} />

    <!-- Milestones Section -->
    <div>
      <SectionHeader title="Milestones" count={milestones.length}>
        <SectionActionButton
          onclick={() => {
            editingMilestone = null
            showMilestoneModal = true
          }}
        >
          + Add Milestone
        </SectionActionButton>
      </SectionHeader>

      {#if milestones.length === 0}
        <div
          class="text-center py-12 rounded-lg border"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
        >
          <p class="text-sm" style:color="var(--color-text-tertiary)">아직 마일스톤이 없습니다.</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each milestones as milestone}
            {@const statusColor = getMilestoneStatusColor(milestone.status)}
            {@const isAchieved = milestone.status === 'achieved'}
            {@const isInProgress = milestone.status === 'in_progress'}
            {@const isUpcoming = milestone.status === 'upcoming'}
            <div
              class="p-4 rounded-lg transition"
              class:border-2={isInProgress}
              class:border={!isInProgress}
              class:bg-green-50={isInProgress}
              class:border-green-500={isInProgress}
              class:bg-gray-100={isAchieved}
              class:border-gray-400={isAchieved}
              style:background={!isInProgress && !isAchieved ? 'var(--color-surface)' : undefined}
              style:border-color={!isInProgress && !isAchieved ? 'var(--color-border)' : undefined}
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <h4
                      class="text-base font-medium"
                      class:line-through={isAchieved}
                      class:text-gray-500={isAchieved}
                      style:color={!isAchieved ? 'var(--color-text-primary)' : undefined}
                    >
                      {#if isAchieved}
                        <span class="mr-2 text-green-600">✓</span>
                      {/if}
                      {milestone.name}
                    </h4>
                    <span class="text-gray-400">/</span>
                    {#if milestone.description}
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {milestone.description}
                      </p>
                    {/if}
                  </div>
                  <div
                    class="flex items-center gap-4 text-xs"
                    style:color="var(--color-text-tertiary)"
                  >
                    <span>목표일: {formatDate(milestone.target_date)}</span>
                    <span>{milestone.initiative_count}개 이니셔티브</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    style:background="var(--color-{statusColor}-light)"
                    style:color="var(--color-{statusColor})"
                  >
                    {getMilestoneStatusText(milestone.status)}
                  </span>
                  <button
                    type="button"
                    class="text-xs transition hover:opacity-70"
                    style:color="var(--color-primary)"
                    onclick={() => {
                      editingMilestone = milestone
                      showMilestoneModal = true
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Initiatives Section -->
    <div>
      <SectionHeader title="Initiatives" count={initiatives.length}>
        <SectionActionButton>
          <a href="/planner/initiatives/new?product_id={product.id}">+ Add Initiative</a>
        </SectionActionButton>
      </SectionHeader>

      {#if initiatives.length === 0}
        <div
          class="text-center py-12 rounded-lg border"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
        >
          <p class="text-sm" style:color="var(--color-text-tertiary)">
            아직 이니셔티브가 없습니다.
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each initiatives as initiative}
            <InitiativeCard {initiative} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Milestone Modal -->
{#if product}
  <MilestoneModal
    bind:open={showMilestoneModal}
    milestone={editingMilestone}
    productId={product.id}
    onclose={() => {
      showMilestoneModal = false
      editingMilestone = null
    }}
    onsave={() => {
      showMilestoneModal = false
      editingMilestone = null
      if (data.productId) loadMilestones(data.productId)
    }}
  />

  <!-- Product Edit Modal -->
  <ProductEditModal
    bind:open={showProductEditModal}
    {product}
    onclose={() => {
      showProductEditModal = false
    }}
    onsave={() => {
      showProductEditModal = false
      if (data.productId) loadData(data.productId)
    }}
  />
{/if}
