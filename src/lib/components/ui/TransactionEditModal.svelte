<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Transaction, BankAccount } from '$lib/stores/funds'

  const dispatch = createEventDispatcher()

  let {
    isOpen = $bindable(false),
    transaction = null,
    bankAccounts = []
  } = $props<{
    isOpen?: boolean
    transaction?: Transaction | null
    bankAccounts?: BankAccount[]
  }>()

  let formData = $state({
    date: '',
    description: '',
    amount: 0,
    type: 'income' as 'income' | 'expense',
    category: '',
    accountId: '',
    reference: ''
  })

  const categories = {
    income: ['프로젝트 수주', '프로젝트 완료', '상품 판매', '서비스 수익', '기타 수입'],
    expense: ['인건비', '임대료', '사무용품', '마케팅', '개발비', '기타 지출']
  }

  function initializeForm() {
    if (transaction) {
      formData = {
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        accountId: transaction.accountId,
        reference: transaction.reference || ''
      }
    } else {
      formData = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'income',
        category: '',
        accountId: bankAccounts[0]?.id || '',
        reference: ''
      }
    }
  }

  function handleSubmit() {
    if (!formData.description || !formData.amount || !formData.category || !formData.accountId) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    const transactionData = {
      ...formData,
      amount: Number(formData.amount),
      id: transaction?.id || `transaction-${Date.now()}`,
      createdAt: transaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    dispatch('submit', transactionData)
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
      accountId: bankAccounts[0]?.id || '',
      reference: ''
    }
  }

  $effect(() => {
    if (isOpen) {
      initializeForm()
    } else {
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
          <h2 class="text-xl font-semibold">{transaction ? '거래 수정' : '거래 추가'}</h2>
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
              거래일 *
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

          <!-- 계좌 선택 -->
          <div>
            <label for="accountId" class="block text-sm font-medium text-gray-700 mb-1">
              계좌 *
            </label>
            <select
              id="accountId"
              bind:value={formData.accountId}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">계좌를 선택하세요</option>
              {#each bankAccounts as account}
                <option value={account.id}>{account.name} ({account.bankName})</option>
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

          <!-- 참조번호 -->
          <div>
            <label for="reference" class="block text-sm font-medium text-gray-700 mb-1">
              참조번호
            </label>
            <input
              id="reference"
              type="text"
              bind:value={formData.reference}
              placeholder="송장번호, 계약번호 등"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {transaction ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
