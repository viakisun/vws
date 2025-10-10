<script lang="ts">
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import ProductModal from '$lib/planner/components/ProductModal.svelte'
  import type { ProductWithOwner } from '$lib/planner/types'
  import { PackageIcon, SettingsIcon, TargetIcon, UsersIcon, ZapIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  // =============================================
  // State
  // =============================================

  let products = $state<ProductWithOwner[]>([])
  let categories = $state<
    Array<{ id: string; name: string; code: string; color: string; product_count: number }>
  >([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let selectedCategory = $state<string>('all')
  let showProductModal = $state(false)

  // =============================================
  // Category Colors (fallback)
  // =============================================

  const CATEGORY_COLOR_DEFAULTS: string[] = [
    'blue',
    'purple',
    'green',
    'orange',
    'pink',
    'indigo',
    'red',
    'yellow',
  ]

  // =============================================
  // Data Fetching
  // =============================================

  async function loadCategories() {
    try {
      const res = await fetch('/api/planner/categories')
      if (!res.ok) throw new Error('Failed to load categories')

      const data = await res.json()
      categories = data.data.map(
        (
          cat: { id: string; name: string; code: string; color?: string; product_count: number },
          index: number,
        ) => ({
          id: cat.code,
          name: cat.name,
          code: cat.code,
          color: cat.color || CATEGORY_COLOR_DEFAULTS[index % CATEGORY_COLOR_DEFAULTS.length],
          product_count: cat.product_count,
        }),
      )
    } catch (e) {
      console.error('Error loading categories:', e)
    }
  }

  async function loadProducts() {
    try {
      loading = true
      error = null

      const res = await fetch('/api/planner/products')
      if (!res.ok) throw new Error('Failed to load products')

      const data = await res.json()
      // Exclude archived and sunset products
      products = (data.data || []).filter(
        (p) => p.status !== 'archived' && p.status !== 'sunset',
      )
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load products'
      console.error('Error loading products:', e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadCategories()
    loadProducts()
  })

  // =============================================
  // Helpers
  // =============================================

  function getProductCategory(product: ProductWithOwner): string | null {
    return product.category || null
  }

  function getCategoryInfo(code: string | null) {
    if (!code) return { name: 'Other', color: 'gray' }
    const category = categories.find((c) => c.code === code)
    return category
      ? { name: category.name, color: category.color }
      : { name: 'Other', color: 'gray' }
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

  // =============================================
  // Computed Values
  // =============================================

  const categoryTabs = $derived([
    { id: 'all', label: '전체', icon: PackageIcon },
    ...categories.map((cat) => ({
      id: cat.code,
      label: cat.name,
      icon: PackageIcon,
    })),
  ])

  const filteredProducts = $derived(
    selectedCategory === 'all'
      ? products
      : products.filter((p) => getProductCategory(p) === selectedCategory),
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
    { title: '전체 제품', value: totalProducts, icon: PackageIcon, color: 'blue' as const },
    { title: '활성 제품', value: activeProducts, icon: PackageIcon, color: 'green' as const },
    { title: '이니셔티브', value: totalInitiatives, color: 'purple' as const },
    { title: '마일스톤', value: totalMilestones, color: 'orange' as const },
  ])

  // Group products by category for display with proper ordering
  const productsByCategory = $derived(() => {
    // Create a map to preserve category order
    const categoryOrderMap = new Map<string, number>()
    categories.forEach((cat, index) => {
      categoryOrderMap.set(cat.name, index)
    })

    const grouped: Record<string, ProductWithOwner[]> = {}
    filteredProducts.forEach((product) => {
      const categoryCode = getProductCategory(product)
      const categoryInfo = getCategoryInfo(categoryCode)
      const categoryName = categoryInfo.name

      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(product)
    })

    // Sort the entries by category order, then return as sorted array
    return Object.entries(grouped).sort(([nameA], [nameB]) => {
      const orderA = categoryOrderMap.get(nameA) ?? 999
      const orderB = categoryOrderMap.get(nameB) ?? 999
      return orderA - orderB
    })
  })
</script>

<svelte:head>
  <title>플래너 - VIA</title>
</svelte:head>

<PageLayout
  title="플래너"
  subtitle="VIA의 모든 제품과 이니셔티브를 한눈에"
  {stats}
  actions={[
    {
      label: '전체 마일스톤',
      variant: 'secondary' as const,
      icon: TargetIcon,
      href: '/planner/milestones',
    },
    {
      label: '포메이션 관리',
      variant: 'secondary' as const,
      icon: UsersIcon,
      href: '/planner/formations',
    },
    {
      label: '카테고리 관리',
      variant: 'secondary' as const,
      icon: SettingsIcon,
      href: '/planner/settings/categories',
    },
    {
      label: '새 제품',
      variant: 'primary' as const,
      icon: PackageIcon,
      onclick: () => (showProductModal = true),
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
  {:else if products.length === 0}
    <div class="text-center py-12">
      <p style:color="var(--color-text-secondary)">제품이 없습니다.</p>
    </div>
  {:else}
    <!-- Category Filter -->
    <ThemeTabs tabs={categoryTabs} bind:activeTab={selectedCategory} variant="pills">
      {#snippet children(tab)}
        <div class="mt-8">
          {#if selectedCategory === 'all'}
            <!-- Show all categories with headers -->
            {#each productsByCategory() as [categoryName, categoryProducts]}
              {#if categoryProducts.length > 0}
                {@const firstProduct = categoryProducts[0]}
                {@const categoryCode = getProductCategory(firstProduct)}
                {@const categoryInfo = getCategoryInfo(categoryCode)}
                {@const badgeColor = categoryInfo.color}
                <div class="mb-12">
                  <div class="flex items-center gap-4 mb-6">
                    <h2 class="text-2xl font-thin" style:color="var(--color-text-primary)">
                      {categoryName}
                    </h2>
                    <span
                      class="px-3 py-1.5 text-sm font-medium rounded-lg border"
                      style:background="var(--color-background)"
                      style:color="var(--color-text-secondary)"
                      style:border-color="var(--color-border)"
                    >
                      {categoryProducts.length}
                    </span>
                  </div>

                  <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={6}>
                    {#each categoryProducts as product}
                      {@const isDevelopment = product.status === 'development'}
                      {@const isBeta = product.status === 'beta'}
                      {@const isActive = product.status === 'active'}
                      {@const isHighlighted = isDevelopment || isBeta || isActive}
                      {@const statusColor = getProductStatusColor(product.status)}
                      {@const bgStyle = isDevelopment
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : isBeta
                          ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
                          : isActive
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : ''}
                      {@const textColor = isHighlighted ? '#ffffff' : 'var(--color-text-primary)'}
                      {@const secondaryTextColor = isHighlighted
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'var(--color-text-secondary)'}
                      {@const tertiaryTextColor = isHighlighted
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'var(--color-text-tertiary)'}
                      {@const borderColor = isHighlighted
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'var(--color-border-light)'}
                      {@const badgeColor = isHighlighted
                        ? '#ffffff'
                        : `var(--color-${statusColor}-dark)`}
                      {@const badgeBg = isHighlighted
                        ? 'rgba(255, 255, 255, 0.2)'
                        : `var(--color-${statusColor}-light)`}
                      {@const badgeBorder = isHighlighted
                        ? 'rgba(255, 255, 255, 0.5)'
                        : `var(--color-${statusColor})`}
                      {@const statColor1 = isHighlighted ? '#ffffff' : 'var(--color-primary)'}
                      {@const statColor2 = isHighlighted ? '#ffffff' : 'var(--color-purple)'}
                      <a href="/planner/products/{product.id}" class="block">
                        <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
                          <!-- Product Name -->
                          <div class="mb-4">
                            <div class="flex items-center gap-2 mb-2">
                              <h3 class="text-xl font-bold" style:color={textColor}>
                                {product.name}
                              </h3>
                              <span
                                class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
                                style:background={badgeBg}
                                style:color={badgeColor}
                                style:border-color={badgeBorder}
                                style:opacity="0.9"
                              >
                                {getProductStatusText(product.status)}
                              </span>
                            </div>
                            <p class="text-xs font-mono" style:color={tertiaryTextColor}>
                              {product.code}
                            </p>
                          </div>

                          <!-- Description -->
                          <div class="mb-6 h-10">
                            {#if product.description}
                              <p
                                class="text-sm line-clamp-2 leading-relaxed"
                                style:color={secondaryTextColor}
                              >
                                {product.description}
                              </p>
                            {/if}
                          </div>

                          <!-- Stats -->
                          <div
                            class="flex items-center gap-6 text-sm pt-4"
                            style:border-top="1px solid {borderColor}"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-lg font-bold" style:color={statColor1}>
                                {product.initiative_count || 0}
                              </span>
                              <span style:color={secondaryTextColor}>이니셔티브</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-lg font-bold" style:color={statColor2}>
                                {product.milestone_count || 0}
                              </span>
                              <span style:color={secondaryTextColor}>마일스톤</span>
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
                  {@const isDevelopment = product.status === 'development'}
                  {@const isBeta = product.status === 'beta'}
                  {@const isActive = product.status === 'active'}
                  {@const isHighlighted = isDevelopment || isBeta || isActive}
                  {@const statusColor = getProductStatusColor(product.status)}
                  {@const bgStyle = isDevelopment
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : isBeta
                      ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
                      : isActive
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : ''}
                  {@const textColor = isHighlighted ? '#ffffff' : 'var(--color-text-primary)'}
                  {@const secondaryTextColor = isHighlighted
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'var(--color-text-secondary)'}
                  {@const tertiaryTextColor = isHighlighted
                    ? 'rgba(255, 255, 255, 0.7)'
                    : 'var(--color-text-tertiary)'}
                  {@const borderColor = isHighlighted
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'var(--color-border-light)'}
                  {@const badgeColor = isHighlighted
                    ? '#ffffff'
                    : `var(--color-${statusColor}-dark)`}
                  {@const badgeBg = isHighlighted
                    ? 'rgba(255, 255, 255, 0.2)'
                    : `var(--color-${statusColor}-light)`}
                  {@const badgeBorder = isHighlighted
                    ? 'rgba(255, 255, 255, 0.5)'
                    : `var(--color-${statusColor})`}
                  {@const statColor1 = isHighlighted ? '#ffffff' : 'var(--color-primary)'}
                  {@const statColor2 = isHighlighted ? '#ffffff' : 'var(--color-purple)'}
                  <a href="/planner/products/{product.id}" class="block">
                    <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
                      <!-- Product Name -->
                      <div class="mb-4">
                        <div class="flex items-center gap-2 mb-2">
                          <h3 class="text-xl font-bold" style:color={textColor}>
                            {product.name}
                          </h3>
                          <span
                            class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
                            style:background={badgeBg}
                            style:color={badgeColor}
                            style:border-color={badgeBorder}
                            style:opacity="0.9"
                          >
                            {getProductStatusText(product.status)}
                          </span>
                        </div>
                        <p class="text-xs font-mono" style:color={tertiaryTextColor}>
                          {product.code}
                        </p>
                      </div>

                      <!-- Description -->
                      <div class="mb-6 h-10">
                        {#if product.description}
                          <p
                            class="text-sm line-clamp-2 leading-relaxed"
                            style:color={secondaryTextColor}
                          >
                            {product.description}
                          </p>
                        {/if}
                      </div>

                      <!-- Stats -->
                      <div
                        class="flex items-center gap-6 text-sm pt-4"
                        style:border-top="1px solid {borderColor}"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold" style:color={statColor1}>
                            {product.initiative_count || 0}
                          </span>
                          <span style:color={secondaryTextColor}>이니셔티브</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold" style:color={statColor2}>
                            {product.milestone_count || 0}
                          </span>
                          <span style:color={secondaryTextColor}>마일스톤</span>
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
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
