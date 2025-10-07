<script lang="ts">
  import type { Account, Transaction, TransactionCategory } from '$lib/finance/types'
  import { formatCurrency } from '$lib/finance/utils'
  import TransactionTable from './TransactionTable.svelte'

  interface UploadState {
    selectedFile: File | null
    isUploading: boolean
    progress: number
    uploadResult?: {
      success: boolean
      message: string
    }
  }

  interface DeleteState {
    showDeleteConfirm: boolean
    confirmAccountNumber: string
    isDeleting: boolean
  }

  interface Props {
    account: Account
    transactions: Transaction[]
    categories: TransactionCategory[]
    uploadState: UploadState
    deleteState: DeleteState
    editingTransactionId: string | null
    editData: {
      description: string
      categoryId: string
    }
    onFileSelect: (accountId: string, file: File) => void
    onUpload: (accountId: string) => void
    onConfirmDelete: (accountId: string) => void
    onDelete: (accountId: string) => void
    onCancelDelete: (accountId: string) => void
    onStartEditTransaction: (transaction: Transaction) => void
    onSaveEditTransaction: () => void
    onCancelEditTransaction: () => void
    onDeleteTransaction: (transaction: Transaction) => void
    onEditDataChange: (field: string, value: string) => void
    onDeleteStateChange: (accountId: string, field: string, value: string) => void
  }

  const {
    account,
    transactions,
    categories,
    uploadState,
    deleteState,
    editingTransactionId,
    editData,
    onFileSelect,
    onUpload,
    onConfirmDelete,
    onDelete,
    onCancelDelete,
    onStartEditTransaction,
    onSaveEditTransaction,
    onCancelEditTransaction,
    onDeleteTransaction,
    onEditDataChange,
    onDeleteStateChange,
  }: Props = $props()

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      onFileSelect(account.id, input.files[0])
    }
  }

  function handleDeleteConfirmInput(e: Event) {
    const input = e.target as HTMLInputElement
    onDeleteStateChange(account.id, 'confirmAccountNumber', input.value)
  }

  const netIncome = $derived(
    transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
  )
</script>

<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
  <!-- 계좌 헤더 -->
  <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-lg font-medium text-gray-900">{account.name}</h4>
        <p class="text-sm text-gray-500">
          {account.bank?.name || '알 수 없음'} • {account.accountNumber} • 잔액: {formatCurrency(
            account.balance ?? 0,
          )}
        </p>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">거래 건수: {transactions.length}건</div>
        <div class="text-sm font-medium text-gray-900">
          순이익: {formatCurrency(netIncome)}
        </div>
      </div>
    </div>

    <!-- 업로드/삭제 컨트롤 -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center gap-4">
        <!-- 파일 업로드 -->
        <div class="flex items-center gap-2">
          <input
            type="file"
            id="file-{account.id}"
            accept=".xlsx,.xls,.csv"
            onchange={handleFileInput}
            class="hidden"
          />
          <label
            for="file-{account.id}"
            class="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
          >
            📁 파일 선택
          </label>

          {#if uploadState.selectedFile}
            <span class="text-sm text-gray-600">
              {uploadState.selectedFile.name}
            </span>
            <button
              type="button"
              onclick={() => onUpload(account.id)}
              disabled={uploadState.isUploading}
              class="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadState.isUploading ? '업로드 중...' : '⬆️ 업로드'}
            </button>
          {/if}

          {#if uploadState.isUploading}
            <div class="w-32 bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style:width="{uploadState.progress}%"
              ></div>
            </div>
            <span class="text-sm text-gray-600">{uploadState.progress}%</span>
          {/if}

          {#if uploadState.uploadResult}
            <div
              class="text-sm {uploadState.uploadResult.success ? 'text-green-600' : 'text-red-600'}"
            >
              {uploadState.uploadResult.success ? '✅ 성공' : '❌ 실패'}
              {uploadState.uploadResult.message}
            </div>
          {/if}
        </div>

        <!-- 계좌 삭제 -->
        <div class="flex items-center gap-2">
          {#if !deleteState.showDeleteConfirm}
            <button
              type="button"
              onclick={() => onConfirmDelete(account.id)}
              class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              🗑️ 계좌 삭제
            </button>
          {:else}
            <div class="flex items-center gap-2">
              <input
                type="text"
                placeholder="계좌번호 입력"
                value={deleteState.confirmAccountNumber}
                oninput={handleDeleteConfirmInput}
                class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="button"
                onclick={() => onDelete(account.id)}
                disabled={deleteState.isDeleting}
                class="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteState.isDeleting ? '삭제 중...' : '확인'}
              </button>
              <button
                type="button"
                onclick={() => onCancelDelete(account.id)}
                class="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                취소
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- 거래 목록 -->
  <div class="p-6">
    <TransactionTable
      {transactions}
      {categories}
      {editingTransactionId}
      {editData}
      onStartEdit={onStartEditTransaction}
      onSaveEdit={onSaveEditTransaction}
      onCancelEdit={onCancelEditTransaction}
      onDelete={onDeleteTransaction}
      {onEditDataChange}
    />
  </div>
</div>
