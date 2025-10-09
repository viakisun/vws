<script lang="ts">
  import { onMount } from 'svelte'
  import { PackageIcon, FilterIcon, SettingsIcon } from 'lucide-svelte'
  import type { ProductWithOwner } from '$lib/planner/types'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ProductModal from '$lib/planner/components/ProductModal.svelte'

  // =============================================
  // State
  // =============================================

  let products = $state<ProductWithOwner[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showProductModal = $state(false)
  let selectedCategory = $state<string>('all')

  // =============================================
  // Category Mapping
  // =============================================

  const CATEGORY_MAP: Record<string, string> = {
    workstream: 'Cloud Platforms',
    danngam: 'Cloud Platforms',
    farmflow: 'Cloud Platforms',
    'viahub-dev': 'Cloud Platforms',
    eidryon: 'GCS',
    floodeye: 'GCS',
    aprofleet: 'Deployed Services',
    craneeyes: 'Deployed Services',
    'cargolink-gcs': 'Deployed Services',
    'growth-analysis-robot': 'Robotics',
    whizlink: 'Robotics',
    newlearn: 'AI/Data Services',
    jb2: 'Web Services',
    fida: 'Web Services',
    kdsa: 'Web Services',
  }

  const CATEGORY_COLORS: Record<string, string> = {
    'Cloud Platforms': 'blue',
    GCS: 'purple',
    'Deployed Services': 'green',
    Robotics: 'orange',
    'AI/Data Services': 'pink',
    'Web Services': 'indigo',
  }

  const CATEGORIES = [
    { id: 'all', label: '전체', icon: PackageIcon },
    { id: 'Cloud Platforms', label: 'Cloud Platforms', icon: PackageIcon },
    { id: 'GCS', label: 'GCS', icon: PackageIcon },
    { id: 'Deployed Services', label: 'Deployed Services', icon: PackageIcon },
    { id: 'Robotics', label: 'Robotics', icon: PackageIcon },
    { id: 'AI/Data Services', label: 'AI/Data Services', icon: PackageIcon },
    { id: 'Web Services', label: 'Web Services', icon: PackageIcon },
  ]

  // =============================================
  // Data Fetching
  // =============================================

  async function loadProducts() {
    try {
      loading = true
      error = null

      const res = await fetch('/api/planner/products')
      if (!res.ok) throw new Error('Failed to load products')

      const data = await res.json()
      products = data.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load products'
      console.error('Error loading products:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadProducts()
  })

  // =============================================
  // Helpers
  // =============================================

  function getProductCategory(code: string): string {
    return CATEGORY_MAP[code] || 'Other'
  }

  function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] || 'gray'
  }

  // =============================================
  // Computed Values
  // =============================================

  const filteredProducts = $derived(
    selectedCategory === 'all'
      ? products
      : products.filter((p) => getProductCategory(p.code) === selectedCategory),
  )

  const totalProducts = $derived(products.length)
  const activeProducts = $derived(products.filter((p) => p.status === 'active').length)
  const totalInitiatives = $derived(
    products.reduce((sum, p) => sum + Number(p.initiative_count || 0), 0),
  )
  const totalMilestones = $derived(
    products.reduce((sum, p) => sum + Number(p.milestone_count || 0), 0),
  )

  const stats = $derived([
    { title: '전체 제품', value: totalProducts, icon: PackageIcon, color: 'blue' },
    { title: '활성 제품', value: activeProducts, icon: PackageIcon, color: 'green' },
    { title: '이니셔티브', value: totalInitiatives, color: 'purple' },
    { title: '마일스톤', value: totalMilestones, color: 'orange' },
  ])

  // Group products by category for display
  const productsByCategory = $derived(() => {
    const grouped: Record<string, ProductWithOwner[]> = {}
    filteredProducts.forEach((product) => {
      const category = getProductCategory(product.code)
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(product)
    })
    return grouped
  })
</script>

<svelte:head>
  <title>제품 - 플래너</title>
</svelte:head>

<PageLayout
  title="제품"
  subtitle="VIA의 모든 제품과 서비스를 관리합니다"
  {stats}
  actions={[
    {
      label: '카테고리 관리',
      variant: 'secondary' as const,
      icon: SettingsIcon,
      href: '/planner/settings/categories',
    },
    {
      label: '제품 추가',
      variant: 'primary' as const,
      icon: PackageIcon,
      onclick: () => (showProductModal = true),
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
  {:else if products.length === 0}
    <div class="text-center py-12">
      <p style:color="var(--color-text-secondary)">제품이 없습니다.</p>
    </div>
  {:else}
    <!-- Category Filter -->
    <ThemeTabs tabs={CATEGORIES} bind:activeTab={selectedCategory} variant="pills">
      {#snippet children(tab)}
        <div class="mt-8">
          {#if selectedCategory === 'all'}
            <!-- Show all categories with headers -->
            {#each Object.entries(productsByCategory()) as [category, categoryProducts]}
              {#if categoryProducts.length > 0}
                {@const badgeColor = getCategoryColor(category)}
                <div class="mb-12">
                  <div class="flex items-center gap-4 mb-6">
                    <h2 class="text-2xl font-bold" style:color="var(--color-text-primary)">
                      {category}
                    </h2>
                    <span
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg"
                      class:bg-blue-100={badgeColor === 'blue'}
                      class:text-blue-700={badgeColor === 'blue'}
                      class:bg-purple-100={badgeColor === 'purple'}
                      class:text-purple-700={badgeColor === 'purple'}
                      class:bg-green-100={badgeColor === 'green'}
                      class:text-green-700={badgeColor === 'green'}
                      class:bg-orange-100={badgeColor === 'orange'}
                      class:text-orange-700={badgeColor === 'orange'}
                      class:bg-pink-100={badgeColor === 'pink'}
                      class:text-pink-700={badgeColor === 'pink'}
                      class:bg-indigo-100={badgeColor === 'indigo'}
                      class:text-indigo-700={badgeColor === 'indigo'}
                    >
                      {categoryProducts.length}
                    </span>
                  </div>

                  <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={6}>
                    {#each categoryProducts as product}
                      <a href="/planner/products/{product.id}" class="block">
                        <ThemeCard variant="default" hover clickable>
                          <!-- Product Name -->
                          <div class="mb-4">
                            <h3
                              class="text-xl font-bold mb-2"
                              style:color="var(--color-text-primary)"
                            >
                              {product.name}
                            </h3>
                            <p class="text-xs font-mono" style:color="var(--color-text-tertiary)">
                              {product.code}
                            </p>
                          </div>

                          <!-- Description -->
                          <div class="mb-6 h-10">
                            {#if product.description}
                              <p
                                class="text-sm line-clamp-2 leading-relaxed"
                                style:color="var(--color-text-secondary)"
                              >
                                {product.description}
                              </p>
                            {/if}
                          </div>

                          <!-- Stats -->
                          <div
                            class="flex items-center gap-6 text-sm pt-4"
                            style:border-top="1px solid var(--color-border-light)"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-lg font-bold" style:color="var(--color-primary)">
                                {product.initiative_count || 0}
                              </span>
                              <span style:color="var(--color-text-secondary)">이니셔티브</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-lg font-bold" style:color="var(--color-purple)">
                                {product.milestone_count || 0}
                              </span>
                              <span style:color="var(--color-text-secondary)">마일스톤</span>
                            </div>
                          </div>
                        </ThemeCard>
                      </a>
                    {/each}
                  </ThemeGrid>
                </div>
              {/if}
            {/each}
          {:else}
            <!-- Show filtered category -->
            {@const categoryProducts = productsByCategory()[selectedCategory] || []}
            {#if categoryProducts.length > 0}
              <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={6}>
                {#each categoryProducts as product}
                  <a href="/planner/products/{product.id}" class="block">
                    <ThemeCard variant="default" hover clickable>
                      <!-- Product Name -->
                      <div class="mb-4">
                        <h3 class="text-xl font-bold mb-2" style:color="var(--color-text-primary)">
                          {product.name}
                        </h3>
                        <p class="text-xs font-mono" style:color="var(--color-text-tertiary)">
                          {product.code}
                        </p>
                      </div>

                      <!-- Description -->
                      <div class="mb-6 h-10">
                        {#if product.description}
                          <p
                            class="text-sm line-clamp-2 leading-relaxed"
                            style:color="var(--color-text-secondary)"
                          >
                            {product.description}
                          </p>
                        {/if}
                      </div>

                      <!-- Stats -->
                      <div
                        class="flex items-center gap-6 text-sm pt-4"
                        style:border-top="1px solid var(--color-border-light)"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold" style:color="var(--color-primary)">
                            {product.initiative_count || 0}
                          </span>
                          <span style:color="var(--color-text-secondary)">이니셔티브</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold" style:color="var(--color-purple)">
                            {product.milestone_count || 0}
                          </span>
                          <span style:color="var(--color-text-secondary)">마일스톤</span>
                        </div>
                      </div>
                    </ThemeCard>
                  </a>
                {/each}
              </ThemeGrid>
            {:else}
              <div class="text-center py-12">
                <p style:color="var(--color-text-secondary)">이 카테고리에는 제품이 없습니다.</p>
              </div>
            {/if}
          {/if}
        </div>
      {/snippet}
    </ThemeTabs>
  {/if}
</PageLayout>

<!-- Product Modal -->
<ProductModal
  bind:open={showProductModal}
  onclose={() => (showProductModal = false)}
  onsave={() => {
    showProductModal = false
    loadProducts()
  }}
/>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
