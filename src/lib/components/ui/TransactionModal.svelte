<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ExpectedTransaction } from '$lib/stores/funds'

  const dispatch = createEventDispatcher()

  let { isOpen = $bindable(false), transaction = {} } = $props<{
    isOpen?: boolean
    transaction?: Partial<ExpectedTransaction>
  }>()

  let formData = $state({
    date: transaction.date || new Date().toISOString().split('T')[0],
    description: transaction.description || '',
    amount: transaction.amount || 0,
    type: transaction.type || 'income',
    category: transaction.category || '',
    status: transaction.status || 'pending',
    probability: transaction.probability || 100,
    notes: transaction.notes || ''
  })

  const categories = {
    income: ['프로젝트 수주', '프로젝트 완료', '상품 판매', '서비스 수익', '기타 수입'],
    expense: ['인건비', '임대료', '사무용품', '마케팅', '개발비', '기타 지출']
  }

  function handleSubmit() {
    if (!formData.description || !formData.amount || !formData.category) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    dispatch('submit', {
      ...formData,
      amount: Number(formData.amount)
    })

    closeModal()
  }

  function closeModal() {
    isOpen = false
    dispatch('close')
  }

  function resetForm() {
    formData = {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'income',
      category: '',
      status: 'pending',
      probability: 100,
      notes: ''
    }
  }

  $effect(() => {
    if (!isOpen) {
      resetForm()
    }
  })
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/40"
      role="button"
      tabindex="0"
      onclick={closeModal}
      onkeydown={e => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}
    ></div>
    <div
      class="relative w-full max-w-2xl mx-4 rounded-xl bg-white shadow-lg border border-gray-200"
      role="dialog"
      aria-modal="true"
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">예상 거래 추가</h2>
          <button onclick={closeModal} class="text-gray-400 hover:text-gray-600" aria-label="닫기">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form
          onsubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          class="space-y-4"
        >
          <!-- 날짜 -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
              예상일 *
            </label>
            <input
              id="date"
              type="date"
              bind:value={formData.date}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- 거래 유형 -->
          <div>
            <fieldset>
              <legend class="block text-sm font-medium text-gray-700 mb-2"> 거래 유형 * </legend>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input type="radio" bind:group={formData.type} value="income" class="mr-2" />
                  <span class="text-green-600 font-medium">수입</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" bind:group={formData.type} value="expense" class="mr-2" />
                  <span class="text-red-600 font-medium">지출</span>
                </label>
              </div>
            </fieldset>
          </div>

          <!-- 설명 -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <input
              id="description"
              type="text"
              bind:value={formData.description}
              placeholder="거래 내용을 입력하세요"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- 분류 -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              분류 *
            </label>
            <select
              id="category"
              bind:value={formData.category}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">분류를 선택하세요</option>
              {#each categories[formData.type as keyof typeof categories] as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <!-- 금액 -->
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
              금액 *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₩</span>
              <input
                id="amount"
                type="number"
                bind:value={formData.amount}
                placeholder="0"
                min="0"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <!-- 확률 -->
          <div>
            <label for="probability" class="block text-sm font-medium text-gray-700 mb-1">
              발생 확률 (%)
            </label>
            <input
              id="probability"
              type="range"
              min="0"
              max="100"
              bind:value={formData.probability}
              class="w-full"
            />
            <div class="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span class="font-medium">{formData.probability}%</span>
              <span>100%</span>
            </div>
          </div>

          <!-- 상태 -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1"> 상태 </label>
            <select
              id="status"
              bind:value={formData.status}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">대기</option>
              <option value="confirmed">확정</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          <!-- 메모 -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1"> 메모 </label>
            <textarea
              id="notes"
              bind:value={formData.notes}
              placeholder="추가 정보나 메모를 입력하세요"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onclick={closeModal}
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
