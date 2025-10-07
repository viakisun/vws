<script lang="ts">
  import type { Transaction, TransactionCategory } from '$lib/finance/types'
  import { formatCurrency, formatDate } from '$lib/finance/utils'

  interface Props {
    transaction: Transaction
    categories: TransactionCategory[]
    isEditing: boolean
    editData?: {
      description: string
      categoryId: string
    }
    onStartEdit: () => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    onDelete: () => void
    onEditDataChange?: (field: string, value: string) => void
  }

  const {
    transaction,
    categories,
    isEditing,
    editData = { description: '', categoryId: '' },
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onEditDataChange,
  }: Props = $props()

  function handleDescriptionChange(e: Event) {
    const target = e.target as HTMLInputElement
    onEditDataChange?.('description', target.value)
  }

  function handleCategoryChange(e: Event) {
    const target = e.target as HTMLSelectElement
    onEditDataChange?.('categoryId', target.value)
  }
</script>

<tr class="hover:bg-gray-50">
  <!-- 거래일시 -->
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="text-sm text-gray-900">
      {formatDate(transaction.transactionDate, 'datetime')}
    </div>
  </td>

  <!-- 카테고리 -->
  <td class="px-6 py-4 whitespace-nowrap">
    {#if isEditing}
      <select
        value={editData.categoryId}
        onchange={handleCategoryChange}
        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">카테고리 선택</option>
        {#each categories as category}
          <option value={category.id}>
            {category.name}
            {#if category.accountingCode}
              ({category.accountingCode})
            {/if}
          </option>
        {/each}
      </select>
    {:else if transaction.category}
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style:background-color={transaction.category.color || '#6B7280'}
        style:color="white"
      >
        {transaction.category.name}
      </span>
    {:else}
      <span class="text-sm text-gray-500">미분류</span>
    {/if}
  </td>

  <!-- 적요 -->
  <td class="px-6 py-4">
    {#if isEditing}
      <input
        type="text"
        value={editData.description}
        oninput={handleDescriptionChange}
        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="적요를 입력하세요"
      />
    {:else}
      <div class="text-sm text-gray-900">{transaction.description}</div>
    {/if}
  </td>

  <!-- 의뢰인/수취인 -->
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="text-sm text-gray-900">
      {transaction.counterparty || transaction.description}
    </div>
  </td>

  <!-- 입금 -->
  <td class="px-6 py-4 whitespace-nowrap text-right">
    {#if transaction.deposits && transaction.deposits > 0}
      <span class="text-sm font-medium text-green-600">
        {formatCurrency(transaction.deposits)}
      </span>
    {:else}
      <span class="text-sm text-gray-400">-</span>
    {/if}
  </td>

  <!-- 출금 -->
  <td class="px-6 py-4 whitespace-nowrap text-right">
    {#if transaction.withdrawals && transaction.withdrawals > 0}
      <span class="text-sm font-medium text-red-600">
        {formatCurrency(transaction.withdrawals)}
      </span>
    {:else}
      <span class="text-sm text-gray-400">-</span>
    {/if}
  </td>

  <!-- 거래잔액 -->
  <td class="px-6 py-4 whitespace-nowrap text-right">
    <span class="text-sm font-medium text-gray-900">
      {formatCurrency(transaction.balance || 0)}
    </span>
  </td>

  <!-- 액션 -->
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center space-x-2">
      {#if isEditing}
        <!-- 편집 모드 -->
        <button
          type="button"
          class="text-green-600 hover:text-green-900"
          onclick={onSaveEdit}
          title="저장 (Ctrl+Enter)"
          aria-label="저장"
        >
          ✅
        </button>
        <button
          type="button"
          class="text-red-600 hover:text-red-900"
          onclick={onCancelEdit}
          title="취소 (Esc)"
          aria-label="취소"
        >
          ❌
        </button>
      {:else}
        <!-- 일반 모드 -->
        <button
          type="button"
          class="text-indigo-600 hover:text-indigo-900"
          onclick={onStartEdit}
          title="편집"
          aria-label="편집"
        >
          ✏️
        </button>
        <button
          type="button"
          class="text-red-600 hover:text-red-900"
          onclick={onDelete}
          title="삭제"
          aria-label="삭제"
        >
          🗑️
        </button>
      {/if}
    </div>
  </td>
</tr>
