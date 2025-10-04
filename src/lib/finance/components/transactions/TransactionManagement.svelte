<script lang="ts">
  import { page } from '$app/stores'
  import { accountService, transactionService } from '$lib/finance/services'
  import type {
    Account,
    CreateTransactionRequest,
    Transaction,
    TransactionCategory,
  } from '$lib/finance/types'
  import { formatCurrency, formatDate } from '$lib/finance/utils'
  import {
    formatDateForDisplay,
    formatDateTimeForInput,
    getCurrentUTC,
    toUTC,
  } from '$lib/utils/date-handler'
  import { PlusIcon, SearchIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // 유틸리티 함수들 - 표준 날짜 처리 함수 사용
  function getCurrentUTCTimestamp(): string {
    return getCurrentUTC()
  }

  function formatAmountInput(value: number): string {
    return value.toLocaleString('ko-KR')
  }

  function _parseAmountInput(value: string): number {
    return parseInt(value.replace(/,/g, '')) || 0
  }

  function convertToUTCTimestamp(datetimeLocal: string): string {
    if (!datetimeLocal) return getCurrentUTCTimestamp()
    return toUTC(datetimeLocal)
  }

  function convertToDateTimeLocal(timestamp: string): string {
    if (!timestamp || timestamp === 'null' || timestamp === '') {
      return formatDateTimeForInput(getCurrentUTC())
    }
    return formatDateTimeForInput(timestamp)
  }

  function handleAmountInput(event: Event) {
    const target = event.target as HTMLInputElement
    const value = target.value.replace(/,/g, '')
    const numValue = parseInt(value) || 0
    formData.amount = numValue
    amountInput = formatAmountInput(numValue)
  }

  function handleDateTimeInput(event: Event) {
    const target = event.target as HTMLInputElement
    formData.transactionDate = convertToUTCTimestamp(target.value)
  }

  // 업로드/삭제 관련 함수들
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0]
      uploadResult = undefined
    }
  }

  function handleAccountFileSelect(event: Event, accountId: string) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      selectedFile = input.files[0]
      selectedAccountForUpload = accountId
      uploadResult = undefined
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      selectedFile = event.dataTransfer.files[0]
      uploadResult = undefined
    }
  }

  async function uploadTransactions() {
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }

    if (!selectedAccountForUpload) {
      alert('계좌를 선택해주세요.')
      return
    }

    isUploading = true
    uploadResult = undefined

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('replaceExisting', String(replaceExisting))
    formData.append('accountId', selectedAccountForUpload)

    try {
      const response = await fetch('/api/finance/transactions/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '파일 업로드 실패')
      }

      const data = await response.json()
      uploadResult = data

      // 성공 시 데이터 새로고침
      if (data.success) {
        await loadData()
      }
    } catch (error: any) {
      uploadResult = { success: false, message: error.message }
    } finally {
      isUploading = false
      showUploadModal = false
    }
  }

  async function deleteAccountTransactions(accountId: string, accountName: string) {
    if (
      !confirm(`${accountName}의 모든 거래내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/finance/accounts/${accountId}/transactions`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '거래내역 삭제 실패')
      }

      const data = await response.json()
      alert(data.message)

      // 데이터 새로고침
      await loadData()
    } catch (error: any) {
      alert(`거래내역 삭제 중 오류 발생: ${error.message}`)
    }
  }

  // 다중 파일 업로드 관련 함수들
  function handleMultiFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      selectedFiles = Array.from(input.files)
      multiUploadResults = []
    }
  }

  function handleMultiDrop(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      selectedFiles = Array.from(event.dataTransfer.files)
      multiUploadResults = []
    }
  }

  function detectBankFromFileName(fileName: string): string {
    console.log('=== 은행 감지 디버깅 ===')
    console.log('원본 파일명:', fileName)
    console.log('파일명 타입:', typeof fileName)
    console.log('파일명 길이:', fileName.length)

    const fileNameLower = fileName.toLowerCase()
    console.log('소문자 변환:', fileNameLower)

    // 공백 제거하여 검색
    const cleanFileName = fileNameLower.replace(/\s+/g, '')
    console.log('공백 제거:', cleanFileName)

    const hasHana1 = fileNameLower.includes('하나')
    const hasHana2 = fileNameLower.includes('hana')
    const hasHana3 = cleanFileName.includes('하나')
    const hasHana4 = cleanFileName.includes('hana')

    console.log('하나 포함 체크:', { hasHana1, hasHana2, hasHana3, hasHana4 })

    if (hasHana1 || hasHana2 || hasHana3 || hasHana4) {
      console.log('결과: 하나은행')
      return '하나은행'
    } else if (
      fileNameLower.includes('농협') ||
      fileNameLower.includes('nonghyup') ||
      cleanFileName.includes('농협') ||
      cleanFileName.includes('nonghyup')
    ) {
      console.log('결과: 농협은행')
      return '농협은행'
    }
    console.log('결과: 알 수 없음')
    return '알 수 없음'
  }

  async function uploadMultipleFiles() {
    if (selectedFiles.length === 0) {
      alert('업로드할 파일을 선택해주세요.')
      return
    }

    isMultiUploading = true
    multiUploadResults = []

    for (const file of selectedFiles) {
      try {
        const detectedBank = detectBankFromFileName(file.name)
        console.log(`파일: ${file.name}, 감지된 은행: ${detectedBank}`)

        // 파일명에서 계좌번호 추출 (하이픈 포함/미포함 모두 처리)
        const accountNumberMatch = file.name.match(/(\d{3}-?\d{3,6}-?\d{3,6}|\d{11,14})/)
        const fileAccountNumber = accountNumberMatch ? accountNumberMatch[0] : null
        console.log(`추출된 계좌번호: ${fileAccountNumber}`)

        let targetAccountId: string | null = null
        if (fileAccountNumber) {
          // 하이픈 제거하여 매칭
          const cleanFileAccountNumber = fileAccountNumber.replace(/-/g, '')
          console.log(`정리된 계좌번호: ${cleanFileAccountNumber}`)

          const account = accounts.find((acc) => {
            const accNum = acc.accountNumber.replace(/-/g, '')
            console.log(`비교: ${cleanFileAccountNumber} vs ${accNum}`)
            return accNum === cleanFileAccountNumber
          })
          if (account) {
            targetAccountId = account.id
            console.log(`매칭된 계좌: ${account.name} (ID: ${targetAccountId})`)
          }
        }

        if (!targetAccountId) {
          multiUploadResults.push({
            fileName: file.name,
            success: false,
            message: `파일에서 계좌번호를 찾을 수 없거나, 일치하는 계좌가 없습니다: ${fileAccountNumber || '없음'}`,
            detectedBank,
          })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('replaceExisting', String(replaceExisting))
        if (targetAccountId) {
          formData.append('accountId', targetAccountId)
        }

        const response = await fetch('/api/finance/transactions/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          multiUploadResults.push({
            fileName: file.name,
            success: false,
            message: errorData.message || '업로드 실패',
            detectedBank,
          })
          continue
        }

        const data = await response.json()
        multiUploadResults.push({
          fileName: file.name,
          success: true,
          data: data,
          detectedBank,
        })
      } catch (error: any) {
        multiUploadResults.push({
          fileName: file.name,
          success: false,
          message: error.message,
          detectedBank: detectBankFromFileName(file.name),
        })
      }
    }

    isMultiUploading = false

    // 성공한 업로드가 있으면 데이터 새로고침
    const hasSuccess = multiUploadResults.some((result) => result.success)
    if (hasSuccess) {
      await loadData()
    }
  }

  function formatTime(date: string): string {
    return formatDateForDisplay(date, 'SHORT')
  }

  // State
  let transactions = $state<Transaction[]>([])
  let accounts = $state<Account[]>([])
  let categories = $state<TransactionCategory[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)

  // 업로드/삭제 관련 상태
  let showUploadSection = $state(false)
  let showUploadModal = $state(false)
  let selectedFile = $state<File | null>(null)
  let selectedAccountForUpload = $state<string>('')
  let replaceExisting = $state(false)
  let isUploading = $state(false)
  let uploadResult = $state<any>(undefined)

  // 다중 파일 업로드 관련 상태
  let selectedFiles = $state<File[]>([])
  let isMultiUploading = $state(false)
  let multiUploadResults = $state<any[]>([])
  let showMultiUploadSection = $state(false)

  // 카테고리를 타입별로 그룹화
  let _groupedCategories = $state<Record<string, TransactionCategory[]>>({})

  // 카테고리 그룹화 함수
  function groupCategoriesByType(categories: TransactionCategory[]) {
    const grouped: Record<string, TransactionCategory[]> = {
      income: [],
      expense: [],
      transfer: [],
      adjustment: [],
    }

    categories.forEach((category) => {
      if (grouped[category.type]) {
        grouped[category.type].push(category)
      }
    })

    // 각 타입별로 이름순 정렬
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }

  // 필터
  let searchTerm = $state('')
  let selectedAccount = $state('')
  let dateFrom = $state('')
  let dateTo = $state('')

  // 날짜 범위 프리셋
  let selectedDateRange = $state('1W') // 기본값: 1주일

  // 날짜 범위 설정 함수
  function setDateRange(range: string) {
    selectedDateRange = range
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    switch (range) {
      case '1D':
        dateFrom = today
        dateTo = today
        break
      case '1W': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFrom = weekAgo.toISOString().split('T')[0]
        dateTo = today
        break
      }
      case '1M': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFrom = monthAgo.toISOString().split('T')[0]
        dateTo = today
        break
      }
      case '3M': {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFrom = threeMonthsAgo.toISOString().split('T')[0]
        dateTo = today
        break
      }
      case 'ALL':
        dateFrom = ''
        dateTo = ''
        break
    }
  }

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

  // 금액 입력을 위한 별도 상태 (포맷팅된 문자열)
  let amountInput = $state('0')

  // 날짜/시간 입력을 위한 별도 상태 (datetime-local 형식)
  let dateTimeInput = $state(convertToDateTimeLocal(getCurrentUTCTimestamp()))

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        transactionService.getTransactions({ limit: 100 }),
        accountService.getAccounts(),
        fetch('/api/finance/categories')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      transactions = transactionsData.transactions
      accounts = accountsData
      categories = categoriesData
      _groupedCategories = groupCategoriesByType(categories)

      // 필터링된 데이터 업데이트
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 거래 생성
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
      amountInput = '0'
      dateTimeInput = convertToDateTimeLocal(getCurrentUTCTimestamp())

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 거래 수정
  let showEditModal = $state(false)
  let editingTransaction = $state<Transaction | null>(null)

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
    amountInput = formatAmountInput(transaction.amount)
    dateTimeInput = convertToDateTimeLocal(transaction.transactionDate || getCurrentUTC())
    showEditModal = true
  }

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

  // 거래 삭제
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

  // 컴포넌트 마운트 시 데이터 로드
  onMount(async () => {
    // URL 파라미터에서 계좌 ID 확인
    const urlParams = new URLSearchParams($page.url.search)
    const accountParam = urlParams.get('account')

    // 기본 날짜 범위 설정 (1주일)
    setDateRange('1W')

    // 데이터 로드
    await loadData()

    // URL 파라미터가 있으면 해당 계좌로 필터링, 없으면 전체 계좌로 설정
    if (accountParam) {
      selectedAccount = accountParam
      console.log('URL에서 계좌 ID 설정:', accountParam)
    } else {
      selectedAccount = '' // 전체 계좌 (기본값)
      console.log('기본값으로 전체 계좌 설정')
    }

    // 필터링 적용
    updateFilteredData()
  })

  // 필터링된 거래 목록 및 통계
  let filteredTransactions = $state<Transaction[]>([])
  let totalIncome = $state(0)
  let totalExpense = $state(0)
  let netAmount = $state(0)

  // 필터링된 계좌 목록
  let filteredAccounts = $state<Account[]>([])

  // 필터링 및 통계 계산 함수
  function updateFilteredData() {
    // 계좌 필터링: 선택된 계좌가 있으면 해당 계좌만 표시
    filteredAccounts = selectedAccount
      ? accounts.filter((account) => account.id === selectedAccount)
      : accounts

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

  // 필터 변경 시 데이터 업데이트 (단순화)
  function handleFilterChange() {
    updateFilteredData()
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">거래 내역 관리</h3>
      <p class="text-sm text-gray-500">
        총 {filteredTransactions.length}건 • 수입 {formatCurrency(totalIncome)} • 지출 {formatCurrency(
          totalExpense,
        )} • 순이익 {formatCurrency(netAmount)}
      </p>
    </div>
    <div class="flex items-center space-x-2">
      <button
        onclick={() => {
          if (showUploadSection) {
            showUploadSection = false
            selectedFile = null
            selectedAccountForUpload = ''
            uploadResult = undefined
          } else {
            showMultiUploadSection = false
            selectedFiles = []
            multiUploadResults = []
            showUploadSection = true
          }
        }}
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {showUploadSection
          ? 'bg-blue-50 border-blue-300'
          : ''}"
      >
        📤 파일 업로드
      </button>
      <button
        onclick={() => {
          if (showMultiUploadSection) {
            showMultiUploadSection = false
            selectedFiles = []
            multiUploadResults = []
          } else {
            showUploadSection = false
            selectedFile = null
            selectedAccountForUpload = ''
            uploadResult = undefined
            showMultiUploadSection = true
          }
        }}
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {showMultiUploadSection
          ? 'bg-blue-50 border-blue-300'
          : ''}"
      >
        📁 다중 업로드
      </button>
      <button
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon size={16} class="mr-2" />
        새 거래
      </button>
    </div>
  </div>

  <!-- 개선된 필터 섹션 -->
  <div class="space-y-4">
    <!-- 날짜 범위 필터 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-700">날짜 범위</h4>
        <span class="text-xs text-gray-500">
          {dateFrom && dateTo ? `${dateFrom} ~ ${dateTo}` : '전체 기간'}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => {
            setDateRange('1D')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1D'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1일
        </button>
        <button
          onclick={() => {
            setDateRange('1W')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1W'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1주
        </button>
        <button
          onclick={() => {
            setDateRange('1M')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1M'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1개월
        </button>
        <button
          onclick={() => {
            setDateRange('3M')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '3M'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 3개월
        </button>
        <button
          onclick={() => {
            setDateRange('ALL')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          'ALL'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          전체
        </button>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="space-y-4">
        <!-- 검색창 -->
        <div class="relative">
          <SearchIcon
            size={20}
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            bind:value={searchTerm}
            oninput={handleFilterChange}
            placeholder="거래 설명으로 검색하세요..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>

        <!-- 계좌 필터 (단순화) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
          <select
            bind:value={selectedAccount}
            onchange={handleFilterChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 계좌</option>
            {#each accounts as account}
              <option value={account.id}>
                {account.bank?.name || '알 수 없음'} - {account.name} ({account.accountNumber})
              </option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 계좌별 업로드 섹션 -->
  {#if showUploadSection}
    <div class="bg-gray-50 rounded-lg p-6 mb-6">
      <h4 class="text-lg font-medium text-gray-900 mb-4">📤 계좌별 거래내역 업로드</h4>

      <!-- 계좌별 업로드 카드들 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {#each [...accounts].sort((a, b) => {
          // 은행별로 정렬, 같은 은행 내에서는 계좌명으로 정렬
          if (a.bank?.name !== b.bank?.name) {
            return (a.bank?.name || '').localeCompare(b.bank?.name || '')
          }
          return a.name.localeCompare(b.name)
        }) as account}
          <div class="bg-white rounded-lg border p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h5 class="font-medium text-gray-900">
                  {account.bank?.name || '알 수 없음'}-{account.accountNumber}
                </h5>
                <p class="text-sm text-gray-500">{account.name}</p>
                <p class="text-xs text-gray-400">잔액: {formatCurrency(account.balance)}</p>
              </div>
              <button
                onclick={() => {
                  selectedAccountForUpload = account.id
                  document.getElementById(`fileInput-${account.id}`)?.click()
                }}
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                📤 업로드
              </button>
            </div>

            <!-- 파일 선택 (숨김) -->
            <input
              type="file"
              id="fileInput-{account.id}"
              accept=".csv,.txt,.xlsx,.xls"
              class="hidden"
              onchange={(e) => handleAccountFileSelect(e, account.id)}
            />

            <!-- 선택된 파일 표시 -->
            {#if selectedAccountForUpload === account.id && selectedFile}
              <div class="mt-2 p-2 bg-blue-50 rounded border">
                <p class="text-sm text-blue-800">선택된 파일: {selectedFile.name}</p>
                <p class="text-xs text-blue-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <div class="mt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="replace-{account.id}"
                    bind:checked={replaceExisting}
                    class="h-3 w-3 text-blue-600"
                  />
                  <label for="replace-{account.id}" class="text-xs text-gray-700">
                    기존 데이터 대체
                  </label>
                </div>
                <button
                  onclick={() => uploadTransactions()}
                  disabled={isUploading}
                  class="mt-2 w-full py-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {#if isUploading}
                    ⏳ 업로드 중...
                  {:else}
                    ✅ 업로드 실행
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- 업로드 결과 -->
      {#if uploadResult !== undefined}
        <div
          class="mt-4 p-4 rounded-lg {uploadResult.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'}"
        >
          {#if uploadResult.success}
            <div class="text-green-800">
              <p class="font-medium">✅ 업로드 완료!</p>
              <p class="text-sm mt-1">은행: {uploadResult.bankName}</p>
              <p class="text-sm">계좌: {uploadResult.accountName || uploadResult.accountNumber}</p>
              <p class="text-sm">총 거래: {uploadResult.totalTransactions}건</p>
              <p class="text-sm">
                삽입: {uploadResult.insertedCount}건, 건너뜀: {uploadResult.skippedCount}건
              </p>
            </div>
          {:else}
            <div class="text-red-800">
              <p class="font-medium">❌ 업로드 실패</p>
              <p class="text-sm mt-1">{uploadResult.message}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 계좌별 삭제 버튼들 -->
      <div class="mt-6">
        <h5 class="text-md font-medium text-gray-900 mb-3">🗑️ 계좌별 거래내역 삭제</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {#each [...accounts].sort((a, b) => {
            // 은행별로 정렬, 같은 은행 내에서는 계좌명으로 정렬
            if (a.bank?.name !== b.bank?.name) {
              return (a.bank?.name || '').localeCompare(b.bank?.name || '')
            }
            return a.name.localeCompare(b.name)
          }) as account}
            <div class="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div>
                <p class="font-medium text-gray-900">
                  {account.bank?.name || '알 수 없음'}-{account.accountNumber}
                </p>
                <p class="text-sm text-gray-500">{account.name}</p>
                <p class="text-xs text-gray-400">잔액: {formatCurrency(account.balance)}</p>
              </div>
              <button
                onclick={() => deleteAccountTransactions(account.id, account.name)}
                class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                삭제
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- 다중 파일 업로드 섹션 -->
  {#if showMultiUploadSection}
    <div class="bg-blue-50 rounded-lg p-6 mb-6">
      <h4 class="text-lg font-medium text-gray-900 mb-4">📁 다중 파일 업로드 (자동 계좌 감지)</h4>
      <p class="text-sm text-gray-600 mb-4">
        여러 은행의 거래내역 파일을 한 번에 업로드합니다. 파일명에서 은행을 자동으로 감지하여 해당
        계좌에 업로드됩니다.
      </p>

      <!-- 다중 파일 업로드 영역 -->
      <div
        class="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors mb-4"
        role="button"
        tabindex="0"
        ondrop={handleMultiDrop}
        ondragover={(e) => e.preventDefault()}
        onclick={() => document.getElementById('multiFileInput')?.click()}
        onkeydown={(e) => e.key === 'Enter' && document.getElementById('multiFileInput')?.click()}
      >
        {#if selectedFiles.length > 0}
          <div class="text-blue-600">
            <div class="text-2xl mb-2">📁</div>
            <p class="font-medium">선택된 파일 {selectedFiles.length}개</p>
            <div class="mt-2 text-sm text-blue-700">
              {#each selectedFiles as file}
                <div class="flex items-center justify-between py-1">
                  <span>{file.name}</span>
                  <span class="text-xs text-blue-500">({detectBankFromFileName(file.name)})</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="text-blue-400">
            <div class="text-4xl mb-2">📁</div>
            <p class="text-blue-600">
              여러 파일을 여기에 끌어다 놓거나 <span class="font-medium">클릭하여 선택</span>
            </p>
            <p class="text-sm text-blue-500 mt-1">CSV 또는 TXT 파일만 지원합니다</p>
            <p class="text-xs text-blue-400 mt-1">
              파일명에 "하나" 또는 "농협"이 포함되어야 자동 감지됩니다
            </p>
          </div>
        {/if}
        <input
          type="file"
          id="multiFileInput"
          accept=".csv,.txt"
          multiple
          class="hidden"
          onchange={handleMultiFileSelect}
        />
      </div>

      <!-- 업로드 옵션 -->
      <div class="flex items-center mb-4">
        <input
          type="checkbox"
          id="multiReplaceExisting"
          bind:checked={replaceExisting}
          class="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label for="multiReplaceExisting" class="ml-2 text-sm text-gray-900">
          기존 거래내역을 업로드 파일로 대체
        </label>
      </div>

      <!-- 다중 업로드 버튼 -->
      <button
        onclick={uploadMultipleFiles}
        disabled={selectedFiles.length === 0 || isMultiUploading}
        class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {#if isMultiUploading}
          ⏳ 다중 업로드 중... ({selectedFiles.length}개 파일)
        {:else}
          📁 다중 파일 업로드 ({selectedFiles.length}개)
        {/if}
      </button>

      <!-- 다중 업로드 결과 -->
      {#if multiUploadResults.length > 0}
        <div class="mt-4 space-y-2">
          <h5 class="font-medium text-gray-900">업로드 결과:</h5>
          {#each multiUploadResults as result}
            <div
              class="p-3 rounded-lg {result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'}"
            >
              {#if result.success}
                <div class="text-green-800">
                  <p class="font-medium">✅ {result.fileName}</p>
                  <p class="text-sm">감지된 은행: {result.detectedBank}</p>
                  <p class="text-sm">계좌: {result.data.accountNumber}</p>
                  <p class="text-sm">
                    처리: {result.data.insertedCount}건 삽입, {result.data.skippedCount}건 건너뜀
                  </p>
                </div>
              {:else}
                <div class="text-red-800">
                  <p class="font-medium">❌ {result.fileName}</p>
                  <p class="text-sm">감지된 은행: {result.detectedBank}</p>
                  <p class="text-sm">오류: {result.message}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
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
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <!-- 계좌 헤더 -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-lg font-medium text-gray-900">{account.name}</h4>
                <p class="text-sm text-gray-500">
                  {account.bank?.name || '알 수 없음'} • {account.accountNumber} • 잔액: {formatCurrency(
                    account.balance,
                  )}
                </p>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">거래 건수: {accountTransactions.length}건</div>
                <div class="text-sm font-medium text-gray-900">
                  순이익: {formatCurrency(
                    accountTransactions.reduce(
                      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                      0,
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <!-- 거래 목록 -->
          {#if accountTransactions.length > 0}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >거래일시</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >적요</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >의뢰인/수취인</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >입금</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >출금</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >거래잔액</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >액션</th
                    >
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each accountTransactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()) as transaction, index}
                    <tr class="hover:bg-gray-50">
                      <!-- 거래일시 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatTime(transaction.transactionDate)}
                        </div>
                      </td>

                      <!-- 적요 -->
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">{transaction.description}</div>
                      </td>

                      <!-- 의뢰인/수취인 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {transaction.counterparty || transaction.description}
                        </div>
                      </td>

                      <!-- 입금 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        {#if transaction.deposits && transaction.deposits > 0}
                          <span class="text-sm font-medium text-green-600">
                            {formatCurrency(transaction.deposits)}
                          </span>
                        {:else}
                          <span class="text-sm text-gray-400">-</span>
                        {/if}
                      </td>

                      <!-- 출금 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        {#if transaction.withdrawals && transaction.withdrawals > 0}
                          <span class="text-sm font-medium text-red-600">
                            {formatCurrency(transaction.withdrawals)}
                          </span>
                        {:else}
                          <span class="text-sm text-gray-400">-</span>
                        {/if}
                      </td>

                      <!-- 거래잔액 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.balance || 0)}
                        </span>
                      </td>

                      <!-- 액션 -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                          <button
                            class="text-indigo-600 hover:text-indigo-900"
                            onclick={() => editTransaction(transaction)}
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              ></path>
                            </svg>
                          </button>
                          <button
                            class="text-red-600 hover:text-red-900"
                            onclick={() => deleteTransaction(transaction)}
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
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
        </div>
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

      <form
        onsubmit={(e) => {
          e.preventDefault()
          createTransaction()
        }}
      >
        <div class="space-y-4">
          <!-- 거래 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 설명</label>
            <input
              type="text"
              bind:value={formData.description}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 월급, 사무실 임대료"
            />
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
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
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 타입</label>
            <select
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
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
            <select
              bind:value={formData.accountId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
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
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 날짜/시간</label>
            <input
              type="datetime-local"
              bind:value={dateTimeInput}
              oninput={handleDateTimeInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- 참조번호 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">참조번호 (선택사항)</label>
            <input
              type="text"
              bind:value={formData.referenceNumber}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: T20241201001"
            />
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
            <textarea
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
            onclick={() => (showAddModal = false)}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '추가 중...' : '거래 추가'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 거래 수정 모달 -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">거래 수정</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          updateTransaction()
        }}
      >
        <div class="space-y-4">
          <!-- 거래 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 설명</label>
            <input
              type="text"
              bind:value={formData.description}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 월급, 사무실 임대료"
            />
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
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
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 타입</label>
            <select
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
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
            <select
              bind:value={formData.accountId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
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
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 날짜/시간</label>
            <input
              type="datetime-local"
              bind:value={dateTimeInput}
              oninput={handleDateTimeInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- 참조번호 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">참조번호 (선택사항)</label>
            <input
              type="text"
              bind:value={formData.referenceNumber}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: T20241201001"
            />
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
            <textarea
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
            onclick={() => (showEditModal = false)}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '수정 중...' : '거래 수정'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
