<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type {
    ExternalLink,
    FormationWithMembers,
    MilestoneWithProduct,
    ProductWithOwner,
  } from '$lib/planner/types'
  import { PlusIcon, XIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  // =============================================
  // State
  // =============================================

  let title = $state('')
  let intent = $state('')
  let successCriteria = $state<string[]>([''])
  let horizon = $state('')
  let contextLinks = $state<ExternalLink[]>([])
  let formationId = $state('')
  let productId = $state('')
  let milestoneId = $state('')

  let products = $state<ProductWithOwner[]>([])
  let milestones = $state<MilestoneWithProduct[]>([])
  let formations = $state<FormationWithMembers[]>([])

  let loading = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Data Loading
  // =============================================

  async function loadProducts() {
    try {
      const res = await fetch('/api/planner/products')
      if (res.ok) {
        const data = await res.json()
        // Exclude archived and sunset products - only show products in active development
        products = (data.data || []).filter(
          (p) => p.status !== 'archived' && p.status !== 'sunset',
        )
        console.log('Loaded products:', products)
      } else {
        console.error('Failed to load products - status:', res.status)
        const errorData = await res.json()
        console.error('Error data:', errorData)
      }
    } catch (e) {
      console.error('Failed to load products:', e)
    }
  }

  async function loadMilestones() {
    if (!productId) {
      milestones = []
      milestoneId = ''
      return
    }

    try {
      const res = await fetch(`/api/planner/milestones?product_id=${productId}`)
      if (res.ok) {
        const data = await res.json()
        milestones = data.data || []
      }
    } catch (e) {
      console.error('Failed to load milestones:', e)
    }
  }

  async function loadFormations() {
    try {
      const res = await fetch('/api/planner/formations')
      if (res.ok) {
        const data = await res.json()
        formations = data.data || []
      }
    } catch (e) {
      console.error('Failed to load formations:', e)
    }
  }

  onMount(() => {
    loadProducts()
    loadFormations()

    // Check if product_id is in URL params
    const urlProductId = $page.url.searchParams.get('product_id')
    if (urlProductId) {
      productId = urlProductId
    }
  })

  $effect(() => {
    loadMilestones()
  })

  // =============================================
  // Actions
  // =============================================

  function addSuccessCriterion() {
    successCriteria = [...successCriteria, '']
  }

  function removeSuccessCriterion(index: number) {
    successCriteria = successCriteria.filter((_, i) => i !== index)
  }

  async function handleSubmit() {
    try {
      loading = true
      error = null

      // Validate
      if (!title || !intent) {
        error = '제목과 목적은 필수 입력 항목입니다'
        return
      }

      if (!productId) {
        error = '제품 선택은 필수입니다'
        return
      }

      // Filter out empty success criteria
      const filteredCriteria = successCriteria.filter((c) => c.trim() !== '')

      const response = await fetch('/api/planner/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          intent,
          success_criteria: filteredCriteria,
          // owner_id will be set to current user by API
          formation_id: formationId || undefined,
          horizon: horizon || undefined,
          context_links: contextLinks,
          product_id: productId || undefined,
          milestone_id: milestoneId || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '이니셔티브 생성 실패')
      }

      // Redirect to the new initiative
      goto(`/planner/initiatives/${data.data.id}`)
    } catch (e) {
      error = e instanceof Error ? e.message : '이니셔티브 생성 실패'
      console.error('Error creating initiative:', e)
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>새 이니셔티브 - 플래너</title>
</svelte:head>

<PageLayout title="새 이니셔티브" subtitle="새로운 이니셔티브를 생성합니다" backLink="/planner">
  {#if error}
    <ThemeCard variant="outlined" class="border-red-200 bg-red-50 mb-6">
      <p style:color="var(--color-error)">{error}</p>
    </ThemeCard>
  {/if}

  <ThemeCard variant="default">
    <form
      onsubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      class="space-y-6"
    >
      <!-- Product & Milestone -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="product"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-primary)"
          >
            제품 <span style:color="var(--color-error)">*</span>
          </label>
          <select
            id="product"
            bind:value={productId}
            required
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
          >
            <option value="">선택하세요</option>
            {#each products as product}
              <option value={product.id}>{product.name}</option>
            {/each}
          </select>
          <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
            이 이니셔티브가 속한 제품
          </p>
        </div>

        <div>
          <label
            for="milestone"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-primary)"
          >
            마일스톤
          </label>
          <select
            id="milestone"
            bind:value={milestoneId}
            disabled={!productId || milestones.length === 0}
            class="w-full px-3 py-2 rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
          >
            <option value="">선택하세요</option>
            {#each milestones as milestone}
              <option value={milestone.id}>{milestone.name}</option>
            {/each}
          </select>
          <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
            {#if !productId}
              먼저 제품을 선택하세요
            {:else if milestones.length === 0}
              이 제품에 마일스톤이 없습니다
            {:else}
              이 이니셔티브가 달성할 마일스톤
            {/if}
          </p>
        </div>
      </div>

      <!-- Title -->
      <div>
        <label
          for="title"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          제목 <span style:color="var(--color-error)">*</span>
        </label>
        <input
          type="text"
          id="title"
          bind:value={title}
          required
          placeholder="예: 재무 모듈에 실시간 협업 기능 구현"
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        />
      </div>

      <!-- Intent -->
      <div>
        <label
          for="intent"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          목적 (왜 중요한가?) <span style:color="var(--color-error)">*</span>
        </label>
        <textarea
          id="intent"
          bind:value={intent}
          required
          rows="4"
          placeholder="목적과 맥락을 설명하세요. 어떤 문제를 해결하나요? 왜 지금인가요?"
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        ></textarea>
      </div>

      <!-- Success Criteria -->
      <div>
        <div
          aria-label="성공 기준"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          성공 기준
        </div>
        <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
          이 이니셔티브가 성공했을 때 어떤 상태가 되나요?
        </p>
        <div class="space-y-2">
          {#each successCriteria as criterion, i}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={successCriteria[i]}
                placeholder="예: 사용자가 실시간으로 변경사항을 볼 수 있다"
                class="flex-1 px-3 py-2 rounded-lg border transition"
                style:border-color="var(--color-border)"
                style:background="var(--color-surface)"
                style:color="var(--color-text-primary)"
              />
              {#if successCriteria.length > 1}
                <button
                  type="button"
                  onclick={() => removeSuccessCriterion(i)}
                  class="px-3 py-2 rounded-lg transition hover:opacity-70"
                  style:color="var(--color-error)"
                  style:background="var(--color-error-light)"
                >
                  <XIcon size={16} />
                </button>
              {/if}
            </div>
          {/each}
        </div>
        <button
          type="button"
          onclick={addSuccessCriterion}
          class="mt-2 text-sm hover:opacity-70 transition"
          style:color="var(--color-primary)"
        >
          <PlusIcon size={16} class="inline" /> 기준 추가
        </button>
      </div>

      <!-- Horizon -->
      <div>
        <label
          for="horizon"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          목표일 (예상 완료 시점)
        </label>
        <input
          type="date"
          id="horizon"
          bind:value={horizon}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        />
        <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
          데드라인이 아닌, 완료를 예상하는 시점입니다
        </p>
      </div>

      <!-- Formation (Optional) -->
      <div>
        <label
          for="formation"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          팀 (선택사항)
        </label>
        <select
          id="formation"
          bind:value={formationId}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        >
          <option value="">선택하세요</option>
          {#each formations as formation}
            <option value={formation.id}>{formation.name}</option>
          {/each}
        </select>
        <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
          이 이니셔티브를 팀에 연결합니다
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4">
        <ThemeButton type="submit" variant="primary" disabled={loading}>
          {loading ? '생성 중...' : '이니셔티브 생성'}
        </ThemeButton>
        <ThemeButton href="/planner" variant="secondary">취소</ThemeButton>
      </div>
    </form>
  </ThemeCard>
</PageLayout>
