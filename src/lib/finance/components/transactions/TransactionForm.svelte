<script lang="ts">
  import type { Account, TransactionCategory } from '$lib/finance/types'
  import { formatAmountInput, parseAmountInput } from '$lib/finance/utils/transaction-formatters'

  interface FormData {
    description: string
    amount: number
    type: 'income' | 'expense' | 'transfer' | 'adjustment'
    accountId: string
    categoryId: string
    transactionDate: string
    referenceNumber?: string
    notes?: string
  }

  interface Props {
    formData: FormData
    accounts: Account[]
    categories: TransactionCategory[]
    isLoading?: boolean
    isEdit?: boolean
    onSubmit: (e: Event) => void
    onCancel: () => void
    dateTimeInput: string
    onDateTimeChange: (value: string) => void
    onAmountChange: (value: number) => void
  }

  const {
    formData = $bindable(),
    accounts,
    categories,
    isLoading = false,
    isEdit = false,
    onSubmit,
    onCancel,
    dateTimeInput,
    onDateTimeChange,
    onAmountChange,
  }: Props = $props()

  let amountInput = $state(formatAmountInput(formData.amount))

  function handleAmountInput(event: Event) {
    const target = event.target as HTMLInputElement
    const value = target.value.replace(/,/g, '')
    const numValue = parseInt(value) || 0
    onAmountChange(numValue)
    amountInput = formatAmountInput(numValue)
  }

  function handleDateTimeInput(event: Event) {
    const target = event.target as HTMLInputElement
    onDateTimeChange(target.value)
  }

  const activeAccounts = $derived(accounts.filter((acc) => acc.status === 'active'))
</script>

<form onsubmit={onSubmit} class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- 거래 설명 -->
    <div>
      <label for="transaction-description" class="block text-sm font-medium text-gray-700 mb-1"
        >거래 설명</label
      >
      <input
        id="transaction-description"
        type="text"
        bind:value={formData.description}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="예: 월급, 사무실 임대료"
      />
    </div>

    <!-- 금액 -->
    <div>
      <label for="transaction-amount" class="block text-sm font-medium text-gray-700 mb-1"
        >금액</label
      >
      <input
        id="transaction-amount"
        type="text"
        bind:value={amountInput}
        oninput={handleAmountInput}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="0"
      />
    </div>

    <!-- 거래 타입 -->
    <div>
      <label for="transaction-type" class="block text-sm font-medium text-gray-700 mb-1"
        >거래 타입</label
      >
      <select
        id="transaction-type"
        bind:value={formData.type}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="income">수입</option>
        <option value="expense">지출</option>
        <option value="transfer">이체</option>
        <option value="adjustment">조정</option>
      </select>
    </div>

    <!-- 계좌 -->
    <div>
      <label for="transaction-account" class="block text-sm font-medium text-gray-700 mb-1"
        >계좌</label
      >
      <select
        id="transaction-account"
        bind:value={formData.accountId}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">계좌를 선택하세요</option>
        {#each activeAccounts as account}
          <option value={account.id}>
            {account.bank?.name || '알 수 없음'} - {account.name} ({account.accountNumber})
          </option>
        {/each}
      </select>
    </div>

    <!-- 카테고리 -->
    <div>
      <label for="transaction-category" class="block text-sm font-medium text-gray-700 mb-1"
        >카테고리</label
      >
      <select
        id="transaction-category"
        bind:value={formData.categoryId}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">카테고리를 선택하세요</option>
        {#each categories as category}
          <option value={category.id}>
            {category.name}
            {#if category.accountingCode}
              ({category.accountingCode})
            {/if}
          </option>
        {/each}
      </select>
    </div>

    <!-- 거래 날짜 -->
    <div>
      <label for="transaction-date" class="block text-sm font-medium text-gray-700 mb-1"
        >거래 날짜/시간</label
      >
      <input
        id="transaction-date"
        type="datetime-local"
        value={dateTimeInput}
        oninput={handleDateTimeInput}
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <!-- 참조번호 -->
    <div>
      <label for="transaction-reference" class="block text-sm font-medium text-gray-700 mb-1"
        >참조번호 (선택사항)</label
      >
      <input
        id="transaction-reference"
        type="text"
        bind:value={formData.referenceNumber}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="예: T20241201001"
      />
    </div>

    <!-- 메모 -->
    <div>
      <label for="transaction-notes" class="block text-sm font-medium text-gray-700 mb-1"
        >메모 (선택사항)</label
      >
      <textarea
        id="transaction-notes"
        bind:value={formData.notes}
        rows="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="거래에 대한 추가 메모"
      ></textarea>
    </div>
  </div>

  <!-- 버튼 -->
  <div class="flex justify-end space-x-3 mt-6">
    <button
      type="button"
      onclick={onCancel}
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
    >
      취소
    </button>
    <button
      type="submit"
      disabled={isLoading}
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isLoading ? (isEdit ? '수정 중...' : '추가 중...') : isEdit ? '거래 수정' : '거래 추가'}
    </button>
  </div>
</form>
