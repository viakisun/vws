<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { Asset, DatabaseAssetCategory } from '$lib/types/asset'
  import { XIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  // Props
  interface Props {
    asset?: Asset | null
    categories: DatabaseAssetCategory[]
    onSave: (asset: Partial<Asset>) => void
    onCancel: () => void
    isOpen: boolean
  }

  let { asset, categories, onSave, onCancel, isOpen }: Props = $props()

  // 폼 데이터
  let formData = $state({
    name: '',
    categoryId: '',
    serialNumber: '',
    purchaseDate: '',
    acquisitionCost: '',
    currentValue: '',
    location: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance' | 'disposed' | 'lost',
    assignedTo: '',
    assignedDate: '',
    returnDate: '',
    notes: '',
  })

  // 폼 유효성 검사
  let errors = $state<Record<string, string>>({})

  // 폼 초기화
  function initializeForm() {
    if (asset) {
      formData = {
        name: asset.name || '',
        categoryId: asset.category_id || '',
        serialNumber: asset.serial_number || '',
        purchaseDate: asset.purchase_date || '',
        acquisitionCost: asset.purchase_price?.toString() || '',
        currentValue: asset.purchase_price?.toString() || '',
        location: asset.location || '',
        status: asset.status || 'available',
        assignedTo: '',
        assignedDate: '',
        returnDate: '',
        notes: asset.notes || '',
      }
    } else {
      formData = {
        name: '',
        categoryId: '',
        serialNumber: '',
        purchaseDate: '',
        acquisitionCost: '',
        currentValue: '',
        location: '',
        status: 'available',
        assignedTo: '',
        assignedDate: '',
        returnDate: '',
        notes: '',
      }
    }
    errors = {}
  }

  // 폼 유효성 검사
  function validateForm() {
    errors = {}

    if (!formData.name.trim()) {
      errors.name = '자산명은 필수입니다.'
    }

    if (!formData.categoryId) {
      errors.categoryId = '카테고리는 필수입니다.'
    }

    if (formData.acquisitionCost && isNaN(Number(formData.acquisitionCost))) {
      errors.acquisitionCost = '구매가격은 숫자여야 합니다.'
    }

    if (formData.currentValue && isNaN(Number(formData.currentValue))) {
      errors.currentValue = '현재가치는 숫자여야 합니다.'
    }

    return Object.keys(errors).length === 0
  }

  // 폼 제출
  function handleSubmit() {
    if (!validateForm()) return

    const submitData: Partial<Asset> = {
      name: formData.name.trim(),
      category_id: formData.categoryId,
      serial_number: formData.serialNumber.trim() || undefined,
      purchase_date: formData.purchaseDate || undefined,
      purchase_price: formData.acquisitionCost ? Number(formData.acquisitionCost) : undefined,
      location: formData.location.trim() || undefined,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
    }

    onSave(submitData)
  }

  // 컴포넌트 마운트 시 폼 초기화
  onMount(() => {
    initializeForm()
  })

  // asset이 변경될 때마다 폼 초기화
  $effect(() => {
    if (isOpen) {
      initializeForm()
    }
  })
</script>

{#if isOpen}
  <!-- 모달 오버레이 -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          {asset ? '자산 수정' : '새 자산 추가'}
        </h3>
        <button onclick={onCancel} class="text-gray-400 hover:text-gray-600 :text-gray-300">
          <XIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- 모달 본문 -->
      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        <!-- 기본 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 자산명 -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              자산명 *
            </label>
            <input
              id="name"
              bind:value={formData.name}
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.name
                ? 'border-red-500'
                : ''}"
              placeholder="자산명을 입력하세요"
            />
            {#if errors.name}
              <p class="mt-1 text-sm text-red-600">{errors.name}</p>
            {/if}
          </div>

          <!-- 카테고리 -->
          <div>
            <label for="categoryId" class="block text-sm font-medium text-gray-700 mb-1">
              카테고리 *
            </label>
            <select
              id="categoryId"
              bind:value={formData.categoryId}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.categoryId
                ? 'border-red-500'
                : ''}"
            >
              <option value="">카테고리를 선택하세요</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
            {#if errors.categoryId}
              <p class="mt-1 text-sm text-red-600">{errors.categoryId}</p>
            {/if}
          </div>
        </div>

        <!-- 시리얼번호 및 위치 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="serialNumber" class="block text-sm font-medium text-gray-700 mb-1">
              시리얼번호
            </label>
            <input
              id="serialNumber"
              bind:value={formData.serialNumber}
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="시리얼번호를 입력하세요"
            />
          </div>

          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
              위치
            </label>
            <input
              id="location"
              bind:value={formData.location}
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="자산 위치를 입력하세요"
            />
          </div>
        </div>

        <!-- 구매 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="purchaseDate" class="block text-sm font-medium text-gray-700 mb-1">
              구매일
            </label>
            <input
              id="purchaseDate"
              bind:value={formData.purchaseDate}
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label for="acquisitionCost" class="block text-sm font-medium text-gray-700 mb-1">
              구매가격
            </label>
            <input
              id="acquisitionCost"
              bind:value={formData.acquisitionCost}
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.acquisitionCost
                ? 'border-red-500'
                : ''}"
              placeholder="0"
            />
            {#if errors.acquisitionCost}
              <p class="mt-1 text-sm text-red-600">{errors.acquisitionCost}</p>
            {/if}
          </div>

          <div>
            <label for="currentValue" class="block text-sm font-medium text-gray-700 mb-1">
              현재가치
            </label>
            <input
              id="currentValue"
              bind:value={formData.currentValue}
              type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.currentValue
                ? 'border-red-500'
                : ''}"
              placeholder="0"
            />
            {#if errors.currentValue}
              <p class="mt-1 text-sm text-red-600">{errors.currentValue}</p>
            {/if}
          </div>
        </div>

        <!-- 상태 및 할당 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1"> 상태 </label>
            <select
              id="status"
              bind:value={formData.status}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">사용 가능</option>
              <option value="assigned">사용 중</option>
              <option value="in_repair">수리 중</option>
              <option value="disposed">폐기</option>
            </select>
          </div>

          <div>
            <label for="assignedDate" class="block text-sm font-medium text-gray-700 mb-1">
              할당일
            </label>
            <input
              id="assignedDate"
              bind:value={formData.assignedDate}
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label for="returnDate" class="block text-sm font-medium text-gray-700 mb-1">
              반납예정일
            </label>
            <input
              id="returnDate"
              bind:value={formData.returnDate}
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- 메모 -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1"> 메모 </label>
          <textarea
            id="notes"
            bind:value={formData.notes}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="자산에 대한 추가 정보나 메모를 입력하세요"
          ></textarea>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <ThemeButton type="button" variant="secondary" onclick={onCancel}>취소</ThemeButton>
          <ThemeButton type="submit" variant="primary">
            {asset ? '수정' : '추가'}
          </ThemeButton>
        </div>
      </form>
    </div>
  </div>
{/if}
