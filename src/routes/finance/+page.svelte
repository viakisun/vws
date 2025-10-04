<script lang="ts">
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import AccountManagement from '$lib/finance/components/accounts/AccountManagement.svelte'
  import BudgetManagement from '$lib/finance/components/budgets/BudgetManagement.svelte'
  import CategoryManagement from '$lib/finance/components/categories/CategoryManagement.svelte'
  import FinanceDashboard from '$lib/finance/components/dashboard/FinanceDashboard.svelte'
  import RecipientManagement from '$lib/finance/components/email/RecipientManagement.svelte'
  import TransactionManagement from '$lib/finance/components/transactions/TransactionManagement.svelte'
  import { onMount } from 'svelte'

  // 상태 관리
  let activeTab = $state('dashboard')
  let isLoading = $state(false)
  let isInitialized = $state(false)

  // 탭 구성
  const tabs = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'accounts', label: '계좌관리' },
    { id: 'transactions', label: '거래내역' },
    { id: 'categories', label: '카테고리 관리' },
    { id: 'budgets', label: '예산관리' },
    { id: 'email', label: '이메일 관리' },
    { id: 'reports', label: '리포트' },
  ]

  // 데이터베이스 초기화
  async function initializeDatabase() {
    try {
      isLoading = true
      const response = await fetch('/api/finance/setup', { method: 'POST' })
      const result = await response.json()

      if (result.success) {
        console.log('데이터베이스 초기화 완료:', result.message)
        isInitialized = true
      } else {
        console.error('데이터베이스 초기화 실패:', result.error)
      }
    } catch (err) {
      console.error('데이터베이스 초기화 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 초기화 확인
  onMount(async () => {
    // 데이터베이스가 초기화되어 있는지 확인
    try {
      const response = await fetch('/api/finance/dashboard')
      if (response.ok) {
        isInitialized = true
      } else {
        // 데이터베이스가 초기화되지 않은 경우 초기화
        await initializeDatabase()
      }
    } catch (err) {
      console.error('초기화 확인 실패:', err)
      await initializeDatabase()
    }
  })
</script>

<PageLayout title="자금 관리" subtitle="기업 자금 흐름 및 재무 현황 통합 관리 시스템">
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">로딩 중...</span>
    </div>
  {:else}
    <!-- 탭 네비게이션 -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex space-x-8">
        {#each tabs as tab}
          <button
            type="button"
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab ===
            tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>
    <!-- 탭 콘텐츠 -->
    {#if !isInitialized}
      <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">자금 관리 시스템 초기화</h3>
        <p class="text-gray-500 mb-4">
          기업 자금 관리 시스템의 데이터베이스를 초기화하고 샘플 데이터를 생성합니다.
        </p>
        <button
          type="button"
          onclick={initializeDatabase}
          disabled={isLoading}
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '초기화 중...' : '시스템 초기화'}
        </button>
      </div>
    {:else if activeTab === 'dashboard'}
      <FinanceDashboard />
    {:else if activeTab === 'accounts'}
      <AccountManagement />
    {:else if activeTab === 'transactions'}
      <TransactionManagement />
    {:else if activeTab === 'categories'}
      <CategoryManagement />
    {:else if activeTab === 'budgets'}
      <BudgetManagement />
    {:else if activeTab === 'email'}
      <RecipientManagement />
    {:else if activeTab === 'reports'}
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">리포트 관리</h3>
        <div class="text-center py-8 text-gray-400">
          <p>리포트 관리 시스템이 곧 구현됩니다</p>
        </div>
      </div>
    {/if}
  {/if}
</PageLayout>
