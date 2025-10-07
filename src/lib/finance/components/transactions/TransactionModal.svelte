<script lang="ts">
  import type {
    Account,
    CreateTransactionRequest,
    Transaction,
    TransactionCategory,
  } from '$lib/finance/types'
  import TransactionForm from './TransactionForm.svelte'
  import { convertToUTCTimestamp } from '$lib/finance/utils/transaction-formatters'

  interface Props {
    isOpen: boolean
    isEdit: boolean
    formData: CreateTransactionRequest
    accounts: Account[]
    categories: TransactionCategory[]
    isLoading: boolean
    dateTimeInput: string
    onSubmit: () => void
    onCancel: () => void
    onDateTimeChange: (value: string) => void
    onAmountChange: (value: number) => void
    onFormDataChange: (data: CreateTransactionRequest) => void
  }

  let {
    isOpen,
    isEdit,
    formData = $bindable(),
    accounts,
    categories,
    isLoading,
    dateTimeInput = $bindable(),
    onSubmit,
    onCancel,
    onDateTimeChange,
    onAmountChange,
  }: Props = $props()
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {isEdit ? '거래 수정' : '새 거래 추가'}
      </h3>
      <TransactionForm
        bind:formData
        {accounts}
        {categories}
        {isLoading}
        {isEdit}
        {onSubmit}
        {onCancel}
        {dateTimeInput}
        onDateTimeChange={(value) => {
          dateTimeInput = value
          formData.transactionDate = convertToUTCTimestamp(value)
          onDateTimeChange(value)
        }}
        onAmountChange={(value) => {
          formData.amount = value
          onAmountChange(value)
        }}
      />
    </div>
  </div>
{/if}
