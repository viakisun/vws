<script lang="ts">
  import { onMount } from 'svelte'
  import { CheckIcon, TagIcon } from 'lucide-svelte'
  import type { InitiativeWithOwner } from '$lib/planner/types'

  // =============================================
  // Props
  // =============================================

  interface Props {
    formationId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
  }

  let { formationId, isOpen, onClose, onSuccess }: Props = $props()

  // =============================================
  // State
  // =============================================

  let initiatives = $state<InitiativeWithOwner[]>([])
  let linkedFormations = $state<Map<string, { formationId: string; formationName: string }[]>>(
    new Map(),
  )
  let selectedInitiativeIds = $state<Set<string>>(new Set())
  let loading = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadInitiatives() {
    try {
      const [initiativesRes, formationsRes] = await Promise.all([
        fetch('/api/planner/initiatives'),
        fetch('/api/planner/formations'),
      ])

      const initiativesData = await initiativesRes.json()
      const formationsData = await formationsRes.json()

      if (initiativesData.success) {
        // Filter to only show active and shaping initiatives
        initiatives = initiativesData.data.filter(
          (i: InitiativeWithOwner) => i.state === 'active' || i.state === 'shaping',
        )
      }

      // Build map of initiative -> formations
      if (formationsData.success) {
        const linksMap = new Map<string, { formationId: string; formationName: string }[]>()

        for (const formation of formationsData.data) {
          if (formation.initiatives) {
            for (const initiative of formation.initiatives) {
              if (!linksMap.has(initiative.id)) {
                linksMap.set(initiative.id, [])
              }
              linksMap.get(initiative.id)!.push({
                formationId: formation.id,
                formationName: formation.name,
              })
            }
          }
        }

        linkedFormations = linksMap
      }
    } catch (e) {
      console.error('Failed to load initiatives:', e)
    }
  }

  onMount(() => {
    if (isOpen) {
      loadInitiatives()
    }
  })

  $effect(() => {
    if (isOpen) {
      loadInitiatives()
    }
  })

  // =============================================
  // Computed
  // =============================================

  // Group initiatives by product (excluding already linked to current formation)
  const initiativesByProduct = $derived(() => {
    const grouped = new Map<
      string,
      { productName: string; productId: string; initiatives: InitiativeWithOwner[] }
    >()

    for (const initiative of initiatives) {
      // Skip if already linked to current formation
      if (isLinkedToCurrentFormation(initiative.id)) {
        continue
      }

      const productKey = initiative.product_id || 'no-product'
      const productName = initiative.product_name || '제품 없음'

      if (!grouped.has(productKey)) {
        grouped.set(productKey, {
          productId: initiative.product_id || '',
          productName,
          initiatives: [],
        })
      }

      grouped.get(productKey)!.initiatives.push(initiative)
    }

    // Filter out empty product groups
    const nonEmptyGroups = Array.from(grouped.values()).filter(
      (group) => group.initiatives.length > 0,
    )

    // Sort: Products with initiatives first, then by name
    return nonEmptyGroups.sort((a, b) => {
      if (a.productId === '' && b.productId !== '') return 1
      if (a.productId !== '' && b.productId === '') return -1
      return a.productName.localeCompare(b.productName, 'ko')
    })
  })

  // =============================================
  // Actions
  // =============================================

  function toggleInitiative(initiativeId: string) {
    // Don't allow selection if already linked to any formation
    const links = linkedFormations.get(initiativeId) || []
    if (links.length > 0) {
      return
    }

    const newSet = new Set(selectedInitiativeIds)
    if (newSet.has(initiativeId)) {
      newSet.delete(initiativeId)
    } else {
      newSet.add(initiativeId)
    }
    selectedInitiativeIds = newSet
  }

  function isLinkedToCurrentFormation(initiativeId: string): boolean {
    const links = linkedFormations.get(initiativeId) || []
    return links.some((link) => link.formationId === formationId)
  }

  function isLinkedToOtherFormation(initiativeId: string): boolean {
    const links = linkedFormations.get(initiativeId) || []
    return links.length > 0 && !links.some((link) => link.formationId === formationId)
  }

  function getLinkedFormationNames(initiativeId: string): string {
    const links = linkedFormations.get(initiativeId) || []
    return links.map((link) => link.formationName).join(', ')
  }

  async function handleSubmit() {
    try {
      loading = true
      error = null

      if (selectedInitiativeIds.size === 0) {
        error = '이니셔티브를 선택해주세요'
        return
      }

      // Link each selected initiative
      const promises = Array.from(selectedInitiativeIds).map((initiativeId) =>
        fetch(`/api/planner/formations/${formationId}/initiatives`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initiative_id: initiativeId,
          }),
        }),
      )

      const results = await Promise.all(promises)

      // Check for any failures
      for (const res of results) {
        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error || '이니셔티브 연결 실패')
        }
      }

      onSuccess()
      onClose()
    } catch (e) {
      error = e instanceof Error ? e.message : '이니셔티브 연결 실패'
    } finally {
      loading = false
    }
  }

  function handleClose() {
    selectedInitiativeIds = new Set()
    error = null
    onClose()
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

  function getHorizonText(horizon: string): string {
    switch (horizon) {
      case 'current':
        return '현재'
      case 'next':
        return '다음'
      case 'future':
        return '미래'
      default:
        return horizon
    }
  }

  function getHorizonColor(horizon: string): string {
    switch (horizon) {
      case 'current':
        return 'blue'
      case 'next':
        return 'purple'
      case 'future':
        return 'gray'
      default:
        return 'gray'
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">이니셔티브 연결</h3>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4 overflow-y-auto flex-1">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        {/if}

        <!-- Selection Count -->
        {#if selectedInitiativeIds.size > 0}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
            {selectedInitiativeIds.size}개 이니셔티브 선택됨
          </div>
        {/if}

        <!-- Initiative Selection by Product -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            이니셔티브 선택 <span class="text-red-500">*</span>
          </label>
          {#if initiatives.length === 0}
            <div class="text-center py-8 text-gray-500">
              <p class="text-sm">연결 가능한 이니셔티브가 없습니다.</p>
              <p class="text-xs mt-1">진행 중이거나 구체화 중인 이니셔티브만 연결할 수 있습니다.</p>
            </div>
          {:else}
            <div class="space-y-6">
              {#each initiativesByProduct() as productGroup}
                <!-- Product Header -->
                <div>
                  <h4 class="text-lg font-light mb-3" style:color="var(--color-gray-700)">
                    {productGroup.productName}
                  </h4>

                  <!-- Initiatives in this product -->
                  <div class="space-y-2">
                    {#each productGroup.initiatives as initiative}
                      {@const isLinkedToCurrent = isLinkedToCurrentFormation(initiative.id)}
                      {@const isLinkedToOther = isLinkedToOtherFormation(initiative.id)}
                      {@const isSelected = selectedInitiativeIds.has(initiative.id)}
                      {@const isDisabled = isLinkedToCurrent || isLinkedToOther}

                      <button
                        type="button"
                        onclick={() => toggleInitiative(initiative.id)}
                        disabled={isDisabled}
                        class="w-full text-left p-3 border rounded-lg transition {isDisabled
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                          : isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <!-- Title and State -->
                            <div class="flex items-start gap-2 mb-1">
                              <div class="flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                  {#if productGroup.productName !== '제품 없음'}
                                    <span
                                      class="text-sm font-light"
                                      style:color="var(--color-gray-500)"
                                    >
                                      {productGroup.productName}
                                    </span>
                                    <span
                                      class="text-sm font-light"
                                      style:color="var(--color-gray-400)"
                                    >
                                      /
                                    </span>
                                  {/if}
                                  <h5 class="text-sm font-medium text-gray-900">
                                    {initiative.title}
                                  </h5>
                                </div>
                              </div>
                              <span
                                class="px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                                style:background={initiative.state === 'active'
                                  ? 'var(--color-green-light)'
                                  : 'var(--color-gray-light)'}
                                style:color={initiative.state === 'active'
                                  ? 'var(--color-green-dark)'
                                  : 'var(--color-gray-dark)'}
                              >
                                {getStateText(initiative.state)}
                              </span>
                            </div>

                            <!-- Tags/Categories -->
                            <div class="flex flex-wrap gap-1.5 mb-2">
                              <!-- Horizon Tag -->
                              <span
                                class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                                style:background="var(--color-{getHorizonColor(
                                  initiative.horizon,
                                )}-light)"
                                style:color="var(--color-{getHorizonColor(
                                  initiative.horizon,
                                )}-dark)"
                              >
                                <TagIcon class="w-3 h-3" />
                                {getHorizonText(initiative.horizon)}
                              </span>

                              <!-- Owner Tag -->
                              {#if initiative.owner}
                                <span
                                  class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded"
                                  style:background="var(--color-gray-light)"
                                  style:color="var(--color-gray-dark)"
                                >
                                  {initiative.owner.last_name}{initiative.owner.first_name}
                                </span>
                              {/if}
                            </div>

                            <!-- Intent -->
                            <p class="text-xs text-gray-600 line-clamp-2">
                              {initiative.intent}
                            </p>

                            <!-- Formation Status -->
                            {#if isLinkedToCurrent}
                              <div class="mt-2 text-xs text-blue-600">✓ 이미 이 팀에 배정됨</div>
                            {:else if isLinkedToOther}
                              <div class="mt-2 text-xs text-amber-600">
                                다른 팀에 배정됨: {getLinkedFormationNames(initiative.id)}
                              </div>
                            {/if}
                          </div>

                          <!-- Checkbox -->
                          {#if !isDisabled}
                            <div class="flex-shrink-0 mt-0.5">
                              {#if isSelected}
                                <div
                                  class="w-5 h-5 rounded flex items-center justify-center"
                                  style:background="var(--color-blue-base)"
                                >
                                  <CheckIcon class="w-4 h-4 text-white" />
                                </div>
                              {:else}
                                <div class="w-5 h-5 rounded border-2 border-gray-300"></div>
                              {/if}
                            </div>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
        <button
          type="button"
          onclick={handleClose}
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          취소
        </button>
        <button
          type="button"
          onclick={handleSubmit}
          disabled={loading || selectedInitiativeIds.size === 0}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading
            ? '연결 중...'
            : selectedInitiativeIds.size > 0
              ? `연결 (${selectedInitiativeIds.size})`
              : '연결'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
