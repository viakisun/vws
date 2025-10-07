<script lang="ts">
  import { EditIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // 상태 관리
  let categories = $state<any[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)

  // 편집 모드 상태
  let editingCategoryId = $state<string | null>(null)
  let editingCategory = $state<any>({})

  // 새 카테고리 생성 모드
  let isCreatingNew = $state(false)
  let newCategory = $state({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    code: '',
    description: '',
  })

  // 카테고리 타입 옵션
  const categoryTypes = [
    { value: 'income', label: '수입', color: '#10B981' },
    { value: 'expense', label: '지출', color: '#EF4444' },
  ]

  // 기본 색상 팔레트
  const colorPalette = [
    '#EF4444',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#6366F1',
  ]

  // 데이터 로드
  async function loadCategories() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/categories')
      const result = await response.json()

      if (result.success) {
        categories = result.data || []
      } else {
        error = result.error || '카테고리를 불러올 수 없습니다.'
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '카테고리를 불러올 수 없습니다.'
      console.error('카테고리 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 카테고리 생성
  async function createCategory() {
    try {
      const response = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      })

      const result = await response.json()

      if (result.success) {
        await loadCategories()
        resetNewCategory()
        isCreatingNew = false
      } else {
        error = result.error || '카테고리 생성에 실패했습니다.'
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '카테고리 생성에 실패했습니다.'
      console.error('카테고리 생성 실패:', err)
    }
  }

  // 카테고리 수정
  async function updateCategory() {
    try {
      const response = await fetch(`/api/finance/categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCategory),
      })

      const result = await response.json()

      if (result.success) {
        await loadCategories()
        cancelEdit()
      } else {
        error = result.error || '카테고리 수정에 실패했습니다.'
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '카테고리 수정에 실패했습니다.'
      console.error('카테고리 수정 실패:', err)
    }
  }

  // 카테고리 삭제
  async function deleteCategory(categoryId: string, categoryName: string) {
    if (
      !confirm(
        `'${categoryName}' 카테고리를 삭제하시겠습니까?\n\n이 카테고리를 사용하는 거래가 있다면 삭제할 수 없습니다.`,
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/finance/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadCategories()
      } else {
        error = result.error || '카테고리 삭제에 실패했습니다.'
      }
    } catch (err) {
      error = err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다.'
      console.error('카테고리 삭제 실패:', err)
    }
  }

  // 편집 시작
  function startEdit(category: any) {
    editingCategoryId = category.id
    editingCategory = { ...category }
  }

  // 편집 취소
  function cancelEdit() {
    editingCategoryId = null
    editingCategory = {}
  }

  // 새 카테고리 생성 취소
  function resetNewCategory() {
    newCategory = {
      name: '',
      type: 'expense',
      color: '#3B82F6',
      code: '',
      description: '',
    }
    isCreatingNew = false
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadCategories()
  })
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">카테고리 관리</h2>
      <p class="text-gray-600">거래 분류를 위한 카테고리를 관리합니다</p>
    </div>
    <button
      type="button"
      onclick={() => (isCreatingNew = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon class="w-4 h-4 mr-2" />
      새 카테고리
    </button>
  </div>

  <!-- 에러 메시지 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">오류 발생</h3>
          <div class="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- 새 카테고리 생성 폼 -->
  {#if isCreatingNew}
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 카테고리 생성</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
          <input
            type="text"
            bind:value={newCategory.name}
            placeholder="예: 인건비, 공과금, 임대료"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">타입</label>
          <select
            bind:value={newCategory.type}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each categoryTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">회계코드</label>
          <input
            type="text"
            bind:value={newCategory.code}
            placeholder="예: 5201"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">색상</label>
          <div class="flex items-center space-x-2">
            <input
              type="color"
              bind:value={newCategory.color}
              class="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <div class="flex space-x-1">
              {#each colorPalette as color}
                <button
                  type="button"
                  onclick={() => (newCategory.color = color)}
                  class="w-6 h-6 rounded border-2 {newCategory.color === color
                    ? 'border-gray-800'
                    : 'border-gray-300'}"
                  style:background-color={color}
                ></button>
              {/each}
            </div>
          </div>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
          <input
            type="text"
            bind:value={newCategory.description}
            placeholder="카테고리 설명"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end space-x-2">
        <button
          type="button"
          onclick={resetNewCategory}
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onclick={createCategory}
          disabled={!newCategory.name.trim()}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          생성
        </button>
      </div>
    </div>
  {/if}

  <!-- 카테고리 목록 -->
  <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
    {#if isLoading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-500">카테고리를 불러오는 중...</p>
      </div>
    {:else if categories.length === 0}
      <div class="p-8 text-center text-gray-500">
        <p>등록된 카테고리가 없습니다.</p>
        <p class="text-sm mt-1">새 카테고리를 생성해보세요.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >카테고리</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >타입</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >회계코드</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >설명</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >액션</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each categories as category}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if editingCategoryId === category.id}
                    <input
                      type="text"
                      bind:value={editingCategory.name}
                      class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  {:else}
                    <div class="flex items-center">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style:background-color={category.color}
                      >
                        {category.name}
                      </span>
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if editingCategoryId === category.id}
                    <select
                      bind:value={editingCategory.type}
                      class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {#each categoryTypes as type}
                        <option value={type.value}>{type.label}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="text-sm text-gray-900">
                      {categoryTypes.find((t) => t.value === category.type)?.label || category.type}
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if editingCategoryId === category.id}
                    <input
                      type="text"
                      bind:value={editingCategory.code}
                      placeholder="예: 5201"
                      class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                    />
                  {:else}
                    <div class="flex flex-col">
                      <span class="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {category.code || '-'}
                      </span>
                      {#if category.accountCode}
                        <span class="text-xs text-gray-500 mt-1">
                          {category.accountCode}
                        </span>
                      {/if}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  {#if editingCategoryId === category.id}
                    <input
                      type="text"
                      bind:value={editingCategory.description}
                      class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  {:else}
                    <span class="text-sm text-gray-900">{category.description || '-'}</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {#if editingCategoryId === category.id}
                    <div class="flex space-x-2">
                      <button
                        type="button"
                        onclick={updateCategory}
                        class="text-green-600 hover:text-green-900"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onclick={cancelEdit}
                        class="text-gray-600 hover:text-gray-900"
                      >
                        취소
                      </button>
                    </div>
                  {:else}
                    <div class="flex space-x-2">
                      <button
                        type="button"
                        onclick={() => startEdit(category)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <EditIcon class="w-4 h-4" />
                      </button>
                      {#if !category.isSystem}
                        <button
                          type="button"
                          onclick={() => deleteCategory(category.id, category.name)}
                          class="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      {/if}
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
