<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { page } from '$app/stores'
  import { accountService, transactionService } from '$lib/finance/services'
  import { logger } from '$lib/utils/logger'
  import type {
    Account,
    CreateTransactionRequest,
    Transaction,
    TransactionCategory,
  } from '$lib/finance/types'
  import { getCurrentUTC } from '$lib/utils/date-handler'
  import { onMount } from 'svelte'

  // 새 유틸리티 함수
  import {
    convertToUTCTimestamp,
    convertToDateTimeLocal,
    getCurrentUTCTimestamp,
  } from '$lib/finance/utils/transaction-formatters'
  import { getDateRangePreset, type DateRangePreset } from '$lib/finance/utils/date-range'

  // 컴포넌트
  import TransactionStatistics from './TransactionStatistics.svelte'
  import TransactionFilters from './TransactionFilters.svelte'
  import AccountCard from './AccountCard.svelte'
  import TransactionForm from './TransactionForm.svelte'

  // ============================================================================
  // State: 데이터
  // ============================================================================

  let transactions = $state<Transaction[]>([])
  let accounts = $state<Account[]>([])
  let categories = $state<TransactionCategory[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)

  // 활성 계좌만 필터링 (비활성/폐쇄 계좌 제외)
  const activeAccounts = $derived(accounts.filter((account) => account.status === 'active'))

  // ============================================================================
  // State: 필터링
  // ============================================================================

  let searchTerm = $state('')
  let selectedAccount = $state('')
  let dateFrom = $state('')
  let dateTo = $state('')
  let selectedDateRange = $state<DateRangePreset>('1W')

  // 필터링된 데이터
  let filteredTransactions = $state<Transaction[]>([])
  let filteredAccounts = $state<Account[]>([])
  let totalIncome = $state(0)
  let totalExpense = $state(0)
  let netAmount = $state(0)

  // ============================================================================
  // State: 폼 및 모달
  // ============================================================================

  let showAddModal = $state(false)
  let showEditModal = $state(false)
  let editingTransaction = $state<Transaction | null>(null)

  // 폼 데이터
  let formData = $state<CreateTransactionRequest>({
    accountId: '',
    categoryId: '',
    amount: 0,
    type: 'expense',
    description: '',
    transactionDate: getCurrentUTCTimestamp(),
    referenceNumber: '',
    notes: '',
    tags: [],
  })

  // 날짜/시간 입력을 위한 별도 상태 (datetime-local 형식)
  let dateTimeInput = $state(convertToDateTimeLocal(getCurrentUTCTimestamp()))

  // ============================================================================
  // State: 인라인 편집
  // ============================================================================

  let editingTransactionId = $state<string | null>(null)
  let inlineEditingData = $state<{ description: string; categoryId: string }>({
    description: '',
    categoryId: '',
  })

  // ============================================================================
  // State: 계좌별 업로드/삭제
  // ============================================================================

  // 계좌별 업로드 상태 관리
  const accountUploadStates = $state<
    Record<
      string,
      {
        isUploading: boolean
        progress: number
        selectedFile: File | null
        uploadResult: any
      }
    >
  >({})

  // 계좌별 삭제 상태 관리
  const accountDeleteStates = $state<
    Record<
      string,
      {
        isDeleting: boolean
        confirmAccountNumber: string
        showDeleteConfirm: boolean
      }
    >
  >({})

  // AccountCard 컴포넌트를 위한 기본 상태
  const defaultUploadState = {
    selectedFile: null,
    isUploading: false,
    progress: 0,
    uploadResult: undefined,
  }

  const defaultDeleteState = {
    showDeleteConfirm: false,
    confirmAccountNumber: '',
    isDeleting: false,
  }

  // ============================================================================
  // Functions: 날짜 범위
  // ============================================================================

  /**
   * 날짜 범위 프리셋 설정
   * date-range 유틸리티를 사용하여 from/to 날짜 계산
   */
  function setDateRange(range: DateRangePreset) {
    selectedDateRange = range

    if (range === 'ALL') {
      dateFrom = ''
      dateTo = ''
    } else {
      const { from, to } = getDateRangePreset(range)
      dateFrom = from.split('T')[0]
      dateTo = to.split('T')[0]
    }
  }

  // ============================================================================
  // Functions: 데이터 로드
  // ============================================================================

  /**
   * 데이터 로드 (서버 사이드 필터링 적용)
   */
  async function loadData() {
    try {
      isLoading = true
      error = null

      // 서버 사이드 필터링을 위한 파라미터 구성
      const params: any = {}

      if (selectedAccount) {
        params.accountId = selectedAccount
      }

      if (dateFrom) {
        params.dateFrom = dateFrom + 'T00:00:00Z'
      }

      if (dateTo) {
        params.dateTo = dateTo + 'T23:59:59Z'
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      // 전체 계좌인 경우 리미트 해제, 특정 계좌인 경우 기본 리미트 적용
      if (!selectedAccount) {
        params.limit = 1000 // 전체는 더 많은 데이터 허용
      } else {
        params.limit = 100 // 특정 계좌는 기본 리미트
      }

      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        transactionService.getTransactions(params),
        accountService.getAccounts(),
        fetch('/api/finance/categories')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      transactions = transactionsData.transactions
      accounts = accountsData
      categories = categoriesData

      // 디버깅: 계좌 상태 확인
      logger.info(
        '로드된 계좌들:',
        accounts.map((a) => ({ name: a.name, status: a.status })),
      )
      logger.info('활성 계좌 수:', accounts.filter((a) => a.status === 'active').length)

      // 필터링된 데이터 업데이트 (클라이언트 사이드 추가 필터링)
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      logger.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Functions: 인라인 편집
  // ============================================================================

  /**
   * 인라인 편집 시작
   */
  function startInlineEdit(transaction: Transaction) {
    editingTransactionId = transaction.id
    inlineEditingData = {
      description: transaction.description || '',
      categoryId: transaction.categoryId || '',
    }
  }

  /**
   * 인라인 편집 취소
   */
  function cancelInlineEdit() {
    editingTransactionId = null
    inlineEditingData = { description: '', categoryId: '' }
  }

  /**
   * 인라인 편집 저장 (적요 및 카테고리만 수정)
   */
  async function saveInlineEdit() {
    if (!editingTransactionId) return

    try {
      // 적요와 카테고리만 업데이트
      const updateData = {
        id: editingTransactionId,
        description: inlineEditingData.description,
        categoryId: inlineEditingData.categoryId,
      }

      logger.info('인라인 편집 업데이트:', updateData)

      const updatedTransaction = await transactionService.updateTransaction(
        editingTransactionId,
        updateData,
      )

      logger.info('업데이트 완료:', updatedTransaction)

      // 로컬 상태 업데이트 - 새 배열로 교체하여 반응성 보장
      const index = transactions.findIndex((t) => t.id === editingTransactionId)
      if (index !== -1) {
        // 업데이트된 카테고리 정보 찾기
        const updatedCategory = categories.find((c) => c.id === inlineEditingData.categoryId)

        // 새 배열 생성하여 반응성 보장
        transactions = transactions.map((t, i) =>
          i === index
            ? {
                ...t,
                description: inlineEditingData.description,
                categoryId: inlineEditingData.categoryId,
                category: updatedCategory, // 카테고리 객체도 업데이트
              }
            : t,
        )

        logger.info('로컬 상태 업데이트 완료:', transactions[index])

        // 필터링된 데이터 업데이트
        updateFilteredData()
      }

      editingTransactionId = null
      inlineEditingData = { description: '', categoryId: '' }
    } catch (err) {
      logger.error('거래 업데이트 실패:', err)
      error = '거래 업데이트에 실패했습니다.'
    }
  }

  /**
   * 키보드 단축키 처리 (Esc: 취소, Ctrl+Enter: 저장)
   */
  function handleKeydown(event: KeyboardEvent) {
    if (editingTransactionId) {
      if (event.key === 'Escape') {
        cancelInlineEdit()
      } else if (event.key === 'Enter' && event.ctrlKey) {
        saveInlineEdit()
      }
    }
  }

  // ============================================================================
  // Functions: 거래 생성
  // ============================================================================

  /**
   * 새 거래 생성
   */
  async function createTransaction() {
    try {
      isLoading = true
      error = null

      await transactionService.createTransaction(formData)

      // 거래 생성 후 완전한 데이터 새로고침
      await loadData()

      // 폼 초기화
      formData = {
        accountId: '',
        categoryId: '',
        amount: 0,
        type: 'expense',
        description: '',
        transactionDate: getCurrentUTCTimestamp(),
        referenceNumber: '',
        notes: '',
        tags: [],
      }
      dateTimeInput = convertToDateTimeLocal(getCurrentUTCTimestamp())

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Functions: 거래 수정
  // ============================================================================

  /**
   * 거래 수정 모달 열기
   */
  function editTransaction(transaction: Transaction) {
    editingTransaction = transaction
    formData = {
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      transactionDate: transaction.transactionDate || getCurrentUTC(),
    }
    dateTimeInput = convertToDateTimeLocal(transaction.transactionDate || getCurrentUTC())
    showEditModal = true
  }

  /**
   * 거래 수정 저장
   */
  async function updateTransaction() {
    if (!editingTransaction) return

    try {
      isLoading = true
      error = null

      await transactionService.updateTransaction(editingTransaction.id, {
        ...formData,
        id: editingTransaction.id,
      })

      // 거래 수정 후 완전한 데이터 새로고침
      await loadData()

      showEditModal = false
      editingTransaction = null
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 수정에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Functions: 거래 삭제
  // ============================================================================

  /**
   * 거래 삭제 (확인 후 삭제)
   */
  async function deleteTransaction(transaction: Transaction) {
    if (!confirm(`거래 "${transaction.description}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    // 중복 요청 방지
    if (isLoading) {
      return
    }

    try {
      isLoading = true
      error = null

      await transactionService.deleteTransaction(transaction.id)

      // 거래 삭제 후 완전한 데이터 새로고침
      await loadData()
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Lifecycle: 초기화
  // ============================================================================

  /**
   * 컴포넌트 마운트 시 초기화 및 데이터 로드
   */
  onMount(() => {
    async function initialize() {
      // URL 파라미터에서 계좌 ID 확인
      const urlParams = new URLSearchParams($page.url.search)
      const accountParam = urlParams.get('account')

      // 기본 날짜 범위 설정 (1주일)
      setDateRange('1W')

      // 데이터 로드
      await loadData()

      // URL 파라미터가 있으면 해당 계좌로 필터링 (활성 계좌인 경우만)
      if (accountParam) {
        const isActiveAccount = accounts.some(
          (acc) => acc.id === accountParam && acc.status === 'active',
        )
        if (isActiveAccount) {
          selectedAccount = accountParam
          logger.info('URL에서 활성 계좌 ID 설정:', accountParam)
        } else {
          selectedAccount = '' // 비활성 계좌면 전체 계좌로 설정
          logger.info('URL의 계좌가 비활성이므로 전체 계좌로 설정')
        }
      } else {
        selectedAccount = '' // 전체 계좌 (기본값)
        logger.info('기본값으로 전체 계좌 설정')
      }

      // 필터링 적용
      updateFilteredData()
    }

    initialize()

    // 키보드 이벤트 리스너 추가
    document.addEventListener('keydown', handleKeydown)

    // cleanup 함수 반환
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  // ============================================================================
  // Functions: 필터링
  // ============================================================================

  /**
   * 필터링 및 통계 계산
   */
  function updateFilteredData() {
    // 계좌 필터링: 선택된 계좌가 있으면 해당 계좌만 표시
    filteredAccounts = selectedAccount
      ? activeAccounts.filter((account) => account.id === selectedAccount)
      : activeAccounts

    // 거래 필터링 (단순화)
    filteredTransactions = transactions.filter((transaction) => {
      // 검색어 필터
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      // 계좌 필터
      if (selectedAccount && transaction.accountId !== selectedAccount) {
        return false
      }
      return true
    })

    totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    netAmount = totalIncome - totalExpense
  }

  /**
   * 필터 변경 시 데이터 새로고침
   */
  async function handleFilterChange() {
    await loadData()
  }

  // ============================================================================
  // Functions: 계좌별 업로드
  // ============================================================================

  /**
   * 계좌별 파일 선택
   */
  function handleAccountFileSelect(accountId: string, file: File) {
    if (!accountUploadStates[accountId]) {
      accountUploadStates[accountId] = {
        isUploading: false,
        progress: 0,
        selectedFile: null,
        uploadResult: null,
      }
    }
    accountUploadStates[accountId].selectedFile = file
    accountUploadStates[accountId].uploadResult = null
  }

  /**
   * 계좌별 업로드 실행 (진행률 표시)
   */
  async function uploadAccountTransactions(accountId: string) {
    const uploadState = accountUploadStates[accountId]
    if (!uploadState || !uploadState.selectedFile) {
      pushToast('파일을 선택해주세요.', 'info')
      return
    }

    uploadState.isUploading = true
    uploadState.progress = 0

    const formData = new FormData()
    formData.append('file', uploadState.selectedFile)
    formData.append('replaceExisting', 'false')
    formData.append('accountId', accountId)

    try {
      const xhr = new XMLHttpRequest()

      // 진행률 업데이트
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          uploadState.progress = Math.round((event.loaded / event.total) * 100)
        }
      })

      // 응답 처리
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          uploadState.uploadResult = result
          if (result.success) {
            // 성공 시 데이터 새로고침
            loadData()
          }
        } else {
          uploadState.uploadResult = { success: false, message: '업로드 실패' }
        }
        uploadState.isUploading = false
      })

      xhr.addEventListener('error', () => {
        uploadState.uploadResult = { success: false, message: '업로드 중 오류 발생' }
        uploadState.isUploading = false
      })

      xhr.open('POST', '/api/finance/transactions/upload')
      xhr.send(formData)
    } catch (error: any) {
      uploadState.uploadResult = { success: false, message: error.message }
      uploadState.isUploading = false
    }
  }

  // ============================================================================
  // Functions: 계좌별 삭제
  // ============================================================================

  /**
   * 계좌 삭제 확인 모달 열기
   */
  function confirmAccountDeletion(accountId: string) {
    if (!accountDeleteStates[accountId]) {
      accountDeleteStates[accountId] = {
        isDeleting: false,
        confirmAccountNumber: '',
        showDeleteConfirm: false,
      }
    }
    accountDeleteStates[accountId].showDeleteConfirm = true
    accountDeleteStates[accountId].confirmAccountNumber = ''
  }

  /**
   * 계좌 및 모든 거래 내역 삭제 실행
   */
  async function deleteAccountTransactions(accountId: string) {
    const deleteState = accountDeleteStates[accountId]
    const account = accounts.find((a) => a.id === accountId)

    if (!deleteState || !account) return

    // 계좌번호 확인
    if (deleteState.confirmAccountNumber !== account.accountNumber) {
      pushToast('계좌번호가 일치하지 않습니다.', 'info')
      return
    }

    deleteState.isDeleting = true

    try {
      const response = await fetch(`/api/finance/accounts/${accountId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        pushToast('계좌와 모든 거래 내역이 삭제되었습니다.', 'success')
        // 데이터 새로고침
        await loadData()
      } else {
        pushToast(`삭제 실패: ${result.error}`, 'info')
      }
    } catch (error: any) {
      pushToast(`삭제 중 오류 발생: ${error.message}`, 'info')
    } finally {
      deleteState.isDeleting = false
      deleteState.showDeleteConfirm = false
      deleteState.confirmAccountNumber = ''
    }
  }

  /**
   * 계좌 삭제 취소
   */
  function cancelAccountDeletion(accountId: string) {
    if (accountDeleteStates[accountId]) {
      accountDeleteStates[accountId].showDeleteConfirm = false
      accountDeleteStates[accountId].confirmAccountNumber = ''
    }
  }

  // ============================================================================
  // Functions: 상태 변경 핸들러
  // ============================================================================

  /**
   * 인라인 편집 데이터 변경 핸들러
   */
  function handleInlineEditDataChange(field: string, value: string) {
    if (field === 'description') {
      inlineEditingData.description = value
    } else if (field === 'categoryId') {
      inlineEditingData.categoryId = value
    }
  }

  /**
   * 삭제 상태 변경 핸들러
   */
  function handleDeleteStateChange(accountId: string, field: string, value: string) {
    if (!accountDeleteStates[accountId]) {
      accountDeleteStates[accountId] = { ...defaultDeleteState }
    }
    if (field === 'confirmAccountNumber') {
      accountDeleteStates[accountId].confirmAccountNumber = value
    }
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">거래 내역 관리</h3>

      <!-- 인라인 편집 안내 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h4 class="text-sm font-medium text-blue-800">인라인 편집</h4>
            <p class="text-sm text-blue-700 mt-1">
              ✏️ 버튼을 클릭하여 적요와 카테고리를 직접 편집할 수 있습니다. 편집 중에는 <kbd
                class="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Esc</kbd
              >로 취소,
              <kbd class="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Ctrl+Enter</kbd>로
              저장하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 통계 -->
  <TransactionStatistics
    {totalIncome}
    {totalExpense}
    {netAmount}
    count={filteredTransactions.length}
  />

  <!-- 필터 -->
  <TransactionFilters
    {dateFrom}
    {dateTo}
    {selectedDateRange}
    {searchTerm}
    {selectedAccount}
    {accounts}
    onDateRangeChange={setDateRange}
    onDateFromChange={(value) => (dateFrom = value)}
    onDateToChange={(value) => (dateTo = value)}
    onSearchTermChange={(value) => (searchTerm = value)}
    onSelectedAccountChange={(value) => (selectedAccount = value)}
    onFilterChange={handleFilterChange}
  />

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 계좌별 거래 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">거래 내역을 불러오는 중...</span>
    </div>
  {:else if accounts.length > 0}
    <div class="space-y-6">
      {#each filteredAccounts as account}
        {@const accountTransactions = filteredTransactions.filter(
          (t) => t.accountId === account.id || t.account?.id === account.id,
        )}
        <AccountCard
          {account}
          transactions={accountTransactions}
          {categories}
          uploadState={accountUploadStates[account.id] || defaultUploadState}
          deleteState={accountDeleteStates[account.id] || defaultDeleteState}
          {editingTransactionId}
          editData={inlineEditingData}
          onFileSelect={handleAccountFileSelect}
          onUpload={uploadAccountTransactions}
          onConfirmDelete={confirmAccountDeletion}
          onDelete={deleteAccountTransactions}
          onCancelDelete={cancelAccountDeletion}
          onStartEditTransaction={startInlineEdit}
          onSaveEditTransaction={saveInlineEdit}
          onCancelEditTransaction={cancelInlineEdit}
          onDeleteTransaction={deleteTransaction}
          onEditDataChange={handleInlineEditDataChange}
          onDeleteStateChange={handleDeleteStateChange}
        />
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">계좌가 없습니다</h3>
      <p class="text-gray-500 mb-4">먼저 계좌를 추가해주세요.</p>
    </div>
  {/if}
</div>

<!-- 거래 추가 모달 -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 거래 추가</h3>
      <TransactionForm
        bind:formData
        {accounts}
        {categories}
        {isLoading}
        isEdit={false}
        onSubmit={createTransaction}
        onCancel={() => (showAddModal = false)}
        {dateTimeInput}
        onDateTimeChange={(value) => {
          dateTimeInput = value
          formData.transactionDate = convertToUTCTimestamp(value)
        }}
        onAmountChange={(value) => (formData.amount = value)}
      />
    </div>
  </div>
{/if}

<!-- 거래 수정 모달 -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">거래 수정</h3>
      <TransactionForm
        bind:formData
        {accounts}
        {categories}
        {isLoading}
        isEdit={true}
        onSubmit={updateTransaction}
        onCancel={() => (showEditModal = false)}
        {dateTimeInput}
        onDateTimeChange={(value) => {
          dateTimeInput = value
          formData.transactionDate = convertToUTCTimestamp(value)
        }}
        onAmountChange={(value) => (formData.amount = value)}
      />
    </div>
  </div>
{/if}
