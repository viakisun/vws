<script lang="ts">
  import type { Transaction, TransactionCategory } from '$lib/finance/types'
  import TransactionRow from './TransactionRow.svelte'

  interface Props {
    transactions: Transaction[]
    categories: TransactionCategory[]
    editingTransactionId: string | null
    editData: {
      description: string
      categoryId: string
    }
    onStartEdit: (transaction: Transaction) => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    onDelete: (transaction: Transaction) => void
    onEditDataChange: (field: string, value: string) => void
  }

  const {
    transactions,
    categories,
    editingTransactionId,
    editData,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onEditDataChange,
  }: Props = $props()

  const sortedTransactions = $derived(
    [...transactions].sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    ),
  )
</script>

{#if transactions.length > 0}
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            거래일시
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            카테고리
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            적요
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            의뢰인/수취인
          </th>
          <th
            class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            입금
          </th>
          <th
            class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            출금
          </th>
          <th
            class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            거래잔액
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            액션
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each sortedTransactions as transaction (transaction.id)}
          <TransactionRow
            {transaction}
            {categories}
            isEditing={editingTransactionId === transaction.id}
            {editData}
            onStartEdit={() => onStartEdit(transaction)}
            {onSaveEdit}
            {onCancelEdit}
            onDelete={() => onDelete(transaction)}
            {onEditDataChange}
          />
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="text-center py-8">
    <div class="text-gray-400 text-lg mb-2">📊</div>
    <p class="text-gray-500">이 계좌에 거래 내역이 없습니다.</p>
  </div>
{/if}
