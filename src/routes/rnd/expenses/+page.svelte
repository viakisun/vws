<script lang="ts">
  import { onMount } from 'svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import {
    expenseItems,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    createExpenseRequest,
    searchExpenseItems,
    getProjectExpenseStatistics,
    getPendingApprovalExpenses
  } from '$lib/stores/rnd/expense-workflow'
  import {
    activeBudgetCategories,
    getRequiredDocuments,
    generateDocumentChecklist
  } from '$lib/stores/rnd/budget-categories'
  import { currentUser } from '$lib/stores/rnd/rbac'
  import type { ExpenseItem, UUID } from '$lib/stores/rnd/types'

  // 상태 관리
  let selectedTab = $state('all')
  let searchQuery = $state('')
  let statusFilter = $state('all')
  let categoryFilter = $state('all')
  let projectFilter = $state('all')
  let showCreateModal = $state(false)
  let showDetailModal = $state(false)
  let selectedExpense: ExpenseItem | null = $state(null)

  // 폼 데이터
  let expenseForm = $state({
    projectId: '',
    categoryCode: '',
    amount: 0,
    currency: 'KRW' as const,
    description: '',
    deptOwner: ''
  })

  // 통계 데이터
  let statistics = $state({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  })

  // 필터링된 지출 항목
  let filteredExpenses = $derived(() => {
    let items: ExpenseItem[] = []
    expenseItems.subscribe(value => (items = value))()

    let filtered = items

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.description.toLowerCase().includes(query) ||
          item.categoryCode.toLowerCase().includes(query)
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.categoryCode === categoryFilter)
    }

    // 프로젝트 필터
    if (projectFilter !== 'all') {
      filtered = filtered.filter(item => item.projectId === projectFilter)
    }

    return filtered
  })

  // 탭별 데이터
  let tabData = $derived(() => {
    switch (selectedTab) {
      case 'pending':
        return $pendingExpenses
      case 'approved':
        return $approvedExpenses
      case 'rejected':
        return $rejectedExpenses
      default:
        return filteredExpenses()
    }
  })

  // 통계 업데이트
  function updateStatistics() {
    let items: ExpenseItem[] = []
    expenseItems.subscribe(value => (items = value))()

    statistics = {
      total: items.length,
      pending: items.filter(item => item.status === 'pending_approval' || item.status === 'draft')
        .length,
      approved: items.filter(
        item =>
          item.status === 'approved' || item.status === 'executed' || item.status === 'completed'
      ).length,
      rejected: items.filter(item => item.status === 'rejected').length,
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0)
    }
  }

  // 지출 요청 생성
  function handleCreateExpense() {
    if (!expenseForm.projectId || !expenseForm.categoryCode || !expenseForm.amount) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    let user: any = null
    currentUser.subscribe(value => (user = value))()

    if (!user) {
      alert('사용자 정보를 찾을 수 없습니다.')
      return
    }

    createExpenseRequest({
      projectId: expenseForm.projectId,
      categoryCode: expenseForm.categoryCode,
      requesterId: user.id,
      amount: expenseForm.amount,
      currency: expenseForm.currency,
      description: expenseForm.description,
      deptOwner: expenseForm.deptOwner
    })

    // 폼 초기화
    expenseForm = {
      projectId: '',
      categoryCode: '',
      amount: 0,
      currency: 'KRW',
      description: '',
      deptOwner: ''
    }

    showCreateModal = false
    updateStatistics()
  }

  // 지출 항목 상세 보기
  function showExpenseDetail(expense: ExpenseItem) {
    selectedExpense = expense
    showDetailModal = true
  }

  // 상태별 색상
  function getStatusColor(status: string) {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'pending_approval':
        return 'warning'
      case 'approved':
        return 'success'
      case 'executed':
        return 'success'
      case 'completed':
        return 'success'
      case 'rejected':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  // 상태별 텍스트
  function getStatusText(status: string) {
    switch (status) {
      case 'draft':
        return '초안'
      case 'pending_approval':
        return '승인대기'
      case 'approved':
        return '승인됨'
      case 'executed':
        return '집행됨'
      case 'completed':
        return '완료'
      case 'rejected':
        return '반려됨'
      default:
        return status
    }
  }

  // 금액 포맷팅
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 카테고리명 가져오기
  function getCategoryName(code: string) {
    let categories: any[] = []
    activeBudgetCategories.subscribe(value => (categories = value))()
    const category = categories.find(cat => cat.code === code)
    return category ? category.nameKo : code
  }

  onMount(() => {
    updateStatistics()
  })
</script>

<div class="space-y-6">
  <!-- 페이지 헤더 -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">지출 관리</h1>
      <p class="mt-2 text-gray-600">지출 요청, 증빙 관리, 결재 워크플로우</p>
    </div>
    <button
      onclick={() => (showCreateModal = true)}
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      새 지출 요청
    </button>
  </div>

  <!-- 통계 카드 -->
  <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
    <Card>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">전체</p>
            <p class="text-2xl font-bold text-gray-900">{statistics.total}</p>
          </div>
          <div class="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-gray-600 font-bold">📋</span>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">승인대기</p>
            <p class="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
          </div>
          <div class="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span class="text-yellow-600 font-bold">⏳</span>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">승인됨</p>
            <p class="text-2xl font-bold text-green-600">{statistics.approved}</p>
          </div>
          <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-green-600 font-bold">✅</span>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">반려됨</p>
            <p class="text-2xl font-bold text-red-600">{statistics.rejected}</p>
          </div>
          <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <span class="text-red-600 font-bold">❌</span>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">총 지출액</p>
            <p class="text-2xl font-bold text-blue-600">{formatCurrency(statistics.totalAmount)}</p>
          </div>
          <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-blue-600 font-bold">💰</span>
          </div>
        </div>
      </div>
    </Card>
  </div>

  <!-- 필터 및 검색 -->
  <div class="bg-white p-6 rounded-lg shadow">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">검색</label>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="설명 또는 카테고리 검색..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
        <select
          bind:value={statusFilter}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          <option value="draft">초안</option>
          <option value="pending_approval">승인대기</option>
          <option value="approved">승인됨</option>
          <option value="executed">집행됨</option>
          <option value="completed">완료</option>
          <option value="rejected">반려됨</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
        <select
          bind:value={categoryFilter}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          {#each $activeBudgetCategories as category}
            <option value={category.code}>{category.nameKo}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">프로젝트</label>
        <select
          bind:value={projectFilter}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체</option>
          <option value="proj-001">AI 프로젝트</option>
          <option value="proj-002">블록체인 프로젝트</option>
          <option value="proj-003">IoT 프로젝트</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 탭 메뉴 -->
  <div class="bg-white rounded-lg shadow">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8 px-6">
        <button
          onclick={() => (selectedTab = 'all')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
						{selectedTab === 'all'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          전체 ({statistics.total})
        </button>
        <button
          onclick={() => (selectedTab = 'pending')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
						{selectedTab === 'pending'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          승인대기 ({statistics.pending})
        </button>
        <button
          onclick={() => (selectedTab = 'approved')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
						{selectedTab === 'approved'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          승인됨 ({statistics.approved})
        </button>
        <button
          onclick={() => (selectedTab = 'rejected')}
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
						{selectedTab === 'rejected'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          반려됨 ({statistics.rejected})
        </button>
      </nav>
    </div>

    <!-- 지출 항목 목록 -->
    <div class="p-6">
      {#if tabData().length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📋</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">지출 항목이 없습니다</h3>
          <p class="text-gray-500">새 지출 요청을 생성해보세요.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each tabData() as expense}
            <div
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onclick={() => showExpenseDetail(expense)}
              onkeydown={e => e.key === 'Enter' && showExpenseDetail(expense)}
              role="button"
              tabindex="0"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-medium text-gray-900">{expense.description}</h3>
                    <Badge variant={getStatusColor(expense.status)}>
                      {getStatusText(expense.status)}
                    </Badge>
                  </div>
                  <div class="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                    <span>카테고리: {getCategoryName(expense.categoryCode)}</span>
                    <span>금액: {formatCurrency(expense.amount)}</span>
                    <span>담당부서: {expense.deptOwner}</span>
                    <span>생성일: {formatDate(expense.createdAt)}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button class="p-2 text-gray-400 hover:text-gray-600" aria-label="상세보기">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 지출 요청 생성 모달 -->
<Modal bind:open={showCreateModal} title="새 지출 요청">
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label>
      <select
        bind:value={expenseForm.projectId}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">프로젝트 선택</option>
        <option value="proj-001">AI 프로젝트</option>
        <option value="proj-002">블록체인 프로젝트</option>
        <option value="proj-003">IoT 프로젝트</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
      <select
        bind:value={expenseForm.categoryCode}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">카테고리 선택</option>
        {#each $activeBudgetCategories as category}
          <option value={category.code}>{category.nameKo}</option>
        {/each}
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">금액 *</label>
        <input
          type="number"
          bind:value={expenseForm.amount}
          placeholder="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">통화</label>
        <select
          bind:value={expenseForm.currency}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="KRW">KRW (원)</option>
          <option value="USD">USD (달러)</option>
          <option value="EUR">EUR (유로)</option>
        </select>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">설명 *</label>
      <textarea
        bind:value={expenseForm.description}
        rows="3"
        placeholder="지출 목적 및 상세 내용을 입력하세요"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">담당부서</label>
      <input
        type="text"
        bind:value={expenseForm.deptOwner}
        placeholder="담당 부서명"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>

  <div class="flex justify-end space-x-3 mt-6">
    <button
      onclick={() => (showCreateModal = false)}
      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
    >
      취소
    </button>
    <button
      onclick={handleCreateExpense}
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      생성
    </button>
  </div>
</Modal>

<!-- 지출 항목 상세 모달 -->
<Modal bind:open={showDetailModal} title="지출 항목 상세">
  {#if selectedExpense}
    <div class="space-y-6">
      <!-- 기본 정보 -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-500">설명</label>
            <p class="text-sm text-gray-900">{selectedExpense.description}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">상태</label>
            <Badge variant={getStatusColor(selectedExpense.status)}>
              {getStatusText(selectedExpense.status)}
            </Badge>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">카테고리</label>
            <p class="text-sm text-gray-900">{getCategoryName(selectedExpense.categoryCode)}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">금액</label>
            <p class="text-sm text-gray-900">{formatCurrency(selectedExpense.amount)}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">담당부서</label>
            <p class="text-sm text-gray-900">{selectedExpense.deptOwner}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500">생성일</label>
            <p class="text-sm text-gray-900">{formatDate(selectedExpense.createdAt)}</p>
          </div>
        </div>
      </div>

      <!-- 필수 문서 체크리스트 -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">필수 문서</h3>
        <div class="space-y-2">
          {#each getRequiredDocuments(selectedExpense.categoryCode) as doc}
            <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div class="flex-shrink-0">
                {#if doc.required}
                  <span class="text-red-500">*</span>
                {:else}
                  <span class="text-gray-400">○</span>
                {/if}
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{doc.description}</p>
                <p class="text-xs text-gray-500">{doc.type}</p>
              </div>
              <div class="flex-shrink-0">
                <Badge variant="secondary">미업로드</Badge>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- 결재 워크플로우 -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">결재 워크플로우</h3>
        <div class="space-y-2">
          <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-600 text-sm font-bold">1</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">PM 승인</p>
              <p class="text-xs text-gray-500">과제책임자 1차 승인</p>
            </div>
            <div class="flex-shrink-0">
              <Badge variant="warning">대기중</Badge>
            </div>
          </div>
          <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span class="text-gray-600 text-sm font-bold">2</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">경영지원 승인</p>
              <p class="text-xs text-gray-500">경영지원팀 최종 승인</p>
            </div>
            <div class="flex-shrink-0">
              <Badge variant="secondary">대기중</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-3 mt-6">
      <button
        onclick={() => (showDetailModal = false)}
        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
      >
        닫기
      </button>
      {#if selectedExpense.status === 'pending_approval'}
        <button
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          승인
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          반려
        </button>
      {/if}
    </div>
  {/if}
</Modal>
