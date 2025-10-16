<script lang="ts">
  import AssetRequestForm from '$lib/components/asset/requests/AssetRequestForm.svelte'
  import AssetRequestList from '$lib/components/asset/requests/AssetRequestList.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { Asset, AssetRequest, DatabaseAssetCategory } from '$lib/types/asset'
  import { PlusIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  let requests: AssetRequest[] = $state([])
  let assets: Asset[] = $state([])
  let categories: DatabaseAssetCategory[] = $state([])
  let loading = $state(true)
  let showRequestForm = $state(false)

  // 자산 요청 목록 로드
  async function loadRequests() {
    try {
      const response = await fetch('/api/assets/requests')
      if (response.ok) {
        const data = await response.json()
        requests = data.data || []
      }
    } catch (error) {
      console.error('Failed to load asset requests:', error)
    }
  }

  // 자산 목록 로드 (요청 폼용)
  async function loadAssets() {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        assets = data.data || []
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  // 카테고리 목록 로드
  async function loadCategories() {
    try {
      const response = await fetch('/api/assets/categories')
      if (response.ok) {
        const data = await response.json()
        categories = data.data || []
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  // 새 요청 생성
  async function handleCreateRequest(requestData: Partial<AssetRequest>) {
    try {
      const response = await fetch('/api/assets/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        showRequestForm = false
        await loadRequests()
      } else {
        console.error('Failed to create asset request')
      }
    } catch (error) {
      console.error('Failed to create asset request:', error)
    }
  }

  onMount(async () => {
    await Promise.all([loadRequests(), loadAssets(), loadCategories()])
    loading = false
  })
</script>

<PageLayout title="자산 신청 관리">
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">자산 신청 관리</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          자산 사용 요청, 차량 예약, 신규 구매 요청을 관리합니다.
        </p>
      </div>
      <ThemeButton variant="primary" onclick={() => (showRequestForm = true)}>
        <PlusIcon class="w-4 h-4 mr-2" />
        새 요청
      </ThemeButton>
    </div>

    <!-- 요청 목록 -->
    <ThemeCard variant="default">
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
        </div>
      {:else}
        <AssetRequestList {requests} />
      {/if}
    </ThemeCard>

    <!-- 요청 생성 폼 모달 -->
    {#if showRequestForm}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">새 자산 요청</h3>
            <ThemeButton variant="ghost" onclick={() => (showRequestForm = false)}>✕</ThemeButton>
          </div>

          <AssetRequestForm
            availableAssets={assets}
            onSave={handleCreateRequest}
            onCancel={() => (showRequestForm = false)}
            isOpen={showRequestForm}
          />
        </div>
      </div>
    {/if}
  </div>
</PageLayout>
