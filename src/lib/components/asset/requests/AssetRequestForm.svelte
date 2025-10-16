<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { Asset, AssetRequest } from '$lib/types/asset'
  import { XIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  // Props
  interface Props {
    request?: AssetRequest | null
    availableAssets: Asset[]
    onSave: (request: Partial<AssetRequest>) => void
    onCancel: () => void
    isOpen: boolean
  }

  let { request, availableAssets, onSave, onCancel, isOpen }: Props = $props()

  // 폼 데이터
  let formData = $state({
    requestType: 'equipment_assignment' as
      | 'vehicle_reservation'
      | 'equipment_assignment'
      | 'equipment_return'
      | 'new_purchase'
      | 'disposal',
    assetId: '',
    purpose: '',
    startDate: '',
    endDate: '',
    reason: '',
    // 새 구매 신청용
    assetName: '',
    assetCategory: '',
    estimatedCost: '',
  })

  // 폼 유효성 검사
  let errors = $state<Record<string, string>>({})

  // 폼 초기화
  function initializeForm() {
    if (request) {
      formData = {
        requestType: request.request_type || 'equipment_assignment',
        assetId: request.asset_id || '',
        purpose: request.purpose || '',
        startDate: request.start_datetime || '',
        endDate: request.end_datetime || '',
        reason: request.purpose || '',
        assetName: '',
        assetCategory: '',
        estimatedCost: '',
      }
    } else {
      formData = {
        requestType: 'equipment_assignment',
        assetId: '',
        purpose: '',
        startDate: '',
        endDate: '',
        reason: '',
        assetName: '',
        assetCategory: '',
        estimatedCost: '',
      }
    }
    errors = {}
  }

  // 폼 유효성 검사
  function validateForm() {
    errors = {}

    if (!formData.purpose.trim()) {
      errors.purpose = '사용 목적은 필수입니다.'
    }

    if (formData.requestType === 'equipment_assignment' && !formData.assetId) {
      errors.assetId = '자산을 선택해주세요.'
    }

    if (formData.requestType === 'vehicle_reservation') {
      if (!formData.startDate) {
        errors.startDate = '시작일은 필수입니다.'
      }
      if (!formData.endDate) {
        errors.endDate = '종료일은 필수입니다.'
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = '종료일은 시작일보다 늦어야 합니다.'
      }
    }

    if (formData.requestType === 'new_purchase') {
      if (!formData.assetName.trim()) {
        errors.assetName = '자산명은 필수입니다.'
      }
      if (!formData.assetCategory.trim()) {
        errors.assetCategory = '카테고리는 필수입니다.'
      }
      if (formData.estimatedCost && isNaN(Number(formData.estimatedCost))) {
        errors.estimatedCost = '예상 비용은 숫자여야 합니다.'
      }
    }

    return Object.keys(errors).length === 0
  }

  // 폼 제출
  function handleSubmit() {
    if (!validateForm()) return

    const submitData: Partial<AssetRequest> = {
      request_type: formData.requestType,
      asset_id: formData.assetId || undefined,
      purpose: formData.purpose.trim(),
      start_datetime:
        formData.requestType === 'vehicle_reservation' ? formData.startDate : undefined,
      end_datetime: formData.requestType === 'vehicle_reservation' ? formData.endDate : undefined,
    }

    onSave(submitData)
  }

  // 컴포넌트 마운트 시 폼 초기화
  onMount(() => {
    initializeForm()
  })

  // isOpen이 변경될 때마다 폼 초기화
  $effect(() => {
    if (isOpen) {
      initializeForm()
    }
  })

  // 요청 유형에 따른 자산 필터링
  let filteredAssets = $derived(() => {
    if (formData.requestType === 'vehicle_reservation') {
      return availableAssets.filter(
        (asset) =>
          asset.category?.name?.toLowerCase().includes('차량') ||
          asset.category?.name?.toLowerCase().includes('vehicle'),
      )
    }
    return availableAssets.filter((asset) => asset.status === 'available')
  })
</script>

{#if isOpen}
  <!-- 모달 오버레이 -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- 모달 헤더 -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {request ? '자산 신청 수정' : '새 자산 신청'}
        </h3>
        <button
          onclick={onCancel}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- 모달 본문 -->
      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        <!-- 신청 유형 -->
        <div>
          <label
            for="requestType"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            신청 유형 *
          </label>
          <select
            id="requestType"
            bind:value={formData.requestType}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="issue">자산 사용 신청</option>
            <option value="return">자산 반납 신청</option>
            <option value="vehicle_reservation">차량 예약 신청</option>
            <option value="new_purchase">신규 구매 신청</option>
            <option value="repair">수리 신청</option>
          </select>
        </div>

        <!-- 자산 선택 (자산 사용 신청인 경우) -->
        {#if formData.requestType === 'equipment_assignment' || formData.requestType === 'vehicle_reservation'}
          <div>
            <label
              for="assetId"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              자산 선택 *
            </label>
            <select
              id="assetId"
              bind:value={formData.assetId}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.assetId
                ? 'border-red-500'
                : ''}"
            >
              <option value="">자산을 선택하세요</option>
              {#each filteredAssets() as asset}
                <option value={asset.id}>
                  {asset.name} - {asset.serial_number || '시리얼번호 없음'} ({asset.location ||
                    '위치 없음'})
                </option>
              {/each}
            </select>
            {#if errors.assetId}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assetId}</p>
            {/if}
          </div>
        {/if}

        <!-- 사용 목적 -->
        <div>
          <label
            for="purpose"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {formData.requestType === 'new_purchase' ? '구매 사유' : '사용 목적'} *
          </label>
          <textarea
            id="purpose"
            bind:value={formData.purpose}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.purpose
              ? 'border-red-500'
              : ''}"
            placeholder="사용 목적이나 구매 사유를 자세히 입력해주세요"
          ></textarea>
          {#if errors.purpose}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.purpose}</p>
          {/if}
        </div>

        <!-- 차량 예약 기간 -->
        {#if formData.requestType === 'vehicle_reservation'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="startDate"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                시작일시 *
              </label>
              <input
                id="startDate"
                bind:value={formData.startDate}
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.startDate
                  ? 'border-red-500'
                  : ''}"
              />
              {#if errors.startDate}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              {/if}
            </div>

            <div>
              <label
                for="endDate"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                종료일시 *
              </label>
              <input
                id="endDate"
                bind:value={formData.endDate}
                type="datetime-local"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.endDate
                  ? 'border-red-500'
                  : ''}"
              />
              {#if errors.endDate}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- 신규 구매 정보 -->
        {#if formData.requestType === 'new_purchase'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="assetName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                자산명 *
              </label>
              <input
                id="assetName"
                bind:value={formData.assetName}
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.assetName
                  ? 'border-red-500'
                  : ''}"
                placeholder="구매할 자산명을 입력하세요"
              />
              {#if errors.assetName}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assetName}</p>
              {/if}
            </div>

            <div>
              <label
                for="assetCategory"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                카테고리 *
              </label>
              <input
                id="assetCategory"
                bind:value={formData.assetCategory}
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.assetCategory
                  ? 'border-red-500'
                  : ''}"
                placeholder="자산 카테고리를 입력하세요"
              />
              {#if errors.assetCategory}
                <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assetCategory}</p>
              {/if}
            </div>
          </div>

          <div>
            <label
              for="estimatedCost"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              예상 비용
            </label>
            <input
              id="estimatedCost"
              bind:value={formData.estimatedCost}
              type="number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.estimatedCost
                ? 'border-red-500'
                : ''}"
              placeholder="0"
            />
            {#if errors.estimatedCost}
              <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.estimatedCost}</p>
            {/if}
          </div>
        {/if}

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ThemeButton type="button" variant="secondary" onclick={onCancel}>취소</ThemeButton>
          <ThemeButton type="submit" variant="primary">
            {request ? '수정' : '신청'}
          </ThemeButton>
        </div>
      </form>
    </div>
  </div>
{/if}
