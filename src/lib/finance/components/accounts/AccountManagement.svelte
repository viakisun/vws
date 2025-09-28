<script lang="ts">
  import { accountService } from '$lib/finance/services'
  import type { Account, Bank, CreateAccountRequest } from '$lib/finance/types'
  import {
      formatAccountNumber,
      formatAccountStatus,
      formatAccountType,
      formatCurrency,
  } from '$lib/finance/utils'
  import { EditIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // State
  let accounts = $state<Account[]>([])
  let banks = $state<Bank[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)
  let selectedAccount = $state<Account | null>(null)
  let showEditModal = $state(false)

  // 폼 데이터
  let formData = $state<CreateAccountRequest>({
    name: '',
    accountNumber: '',
    bankId: '',
    accountType: 'checking',
    initialBalance: 0,
    description: '',
    isPrimary: false,
    alertThreshold: undefined,
  })

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [accountsData, banksData] = await Promise.all([
        accountService.getAccounts(),
        fetch('/api/finance/banks')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      accounts = accountsData
      banks = banksData

      // 통계 업데이트
      updateAccountStats()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 계좌 생성
  async function createAccount() {
    try {
      isLoading = true
      error = null

      const newAccount = await accountService.createAccount(formData)
      accounts = [...accounts, newAccount]

      // 폼 초기화
      formData = {
        name: '',
        accountNumber: '',
        bankId: '',
        accountType: 'checking',
        initialBalance: 0,
        description: '',
        isPrimary: false,
        alertThreshold: undefined,
      }

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '계좌 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 계좌 삭제
  async function deleteAccount(account: Account) {
    if (!confirm(`계좌 "${account.name}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      isLoading = true
      error = null

      await accountService.deleteAccount(account.id)
      accounts = accounts.filter((a) => a.id !== account.id)
    } catch (err) {
      error = err instanceof Error ? err.message : '계좌 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadData()
  })

  // 총 잔액 및 활성 계좌 수 계산
  let totalBalance = $state(0)
  let activeAccountsCount = $state(0)

  // 통계 계산 함수
  function updateAccountStats() {
    totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    activeAccountsCount = accounts.filter((account) => account.status === 'active').length
  }

  // 계좌 데이터 변경 시 통계 업데이트 (이벤트 기반)
  function handleAccountChange() {
    updateAccountStats()
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">계좌 관리</h3>
      <p class="text-sm text-gray-500">
        총 {accounts.length}개 계좌 • 활성 {activeAccountsCount}개 • 총 잔액 {formatCurrency(
          totalBalance,
        )}
      </p>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon size={16} class="mr-2" />
      새 계좌
    </button>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 계좌 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">계좌 정보를 불러오는 중...</span>
    </div>
  {:else if accounts.length > 0}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >계좌 정보</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >은행</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >타입</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >잔액</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >상태</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >액션</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each accounts as account}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{account.name}</div>
                    <div class="text-sm text-gray-500">
                      {formatAccountNumber(account.accountNumber)}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-3 h-3 rounded-full mr-2"
                      style="background-color: {account.bank?.color || '#6B7280'}"
                    ></div>
                    <div class="text-sm text-gray-900">{account.bank?.name || '알 수 없음'}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {formatAccountType(account.accountType)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {formatCurrency(account.balance)}
                  </div>
                  {#if account.isPrimary}
                    <div class="text-xs text-blue-600">주요 계좌</div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {account.status ===
                    'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'}"
                  >
                    {formatAccountStatus(account.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      onclick={() => {
                        selectedAccount = account
                        showEditModal = true
                      }}
                      class="text-blue-600 hover:text-blue-900"
                      title="수정"
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      onclick={() => deleteAccount(account)}
                      class="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">계좌가 없습니다</h3>
      <p class="text-gray-500 mb-4">새 계좌를 추가하여 자금 관리를 시작하세요.</p>
      <button
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon size={16} class="mr-2" />
        첫 번째 계좌 추가
      </button>
    </div>
  {/if}
</div>

<!-- 계좌 추가 모달 -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 계좌 추가</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          createAccount()
        }}
      >
        <div class="space-y-4">
          <!-- 계좌명 -->
          <div>
            <label for="account-name" class="block text-sm font-medium text-gray-700 mb-1">계좌명</label>
            <input
              id="account-name"
              type="text"
              bind:value={formData.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 하나은행 주거래계좌"
            />
          </div>

          <!-- 계좌번호 -->
          <div>
            <label for="account-number" class="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
            <input
              id="account-number"
              type="text"
              bind:value={formData.accountNumber}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 123-456-789"
            />
          </div>

          <!-- 은행 -->
          <div>
            <label for="account-bank" class="block text-sm font-medium text-gray-700 mb-1">은행</label>
            <select
              id="account-bank"
              bind:value={formData.bankId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">은행을 선택하세요</option>
              {#each banks as bank}
                <option value={bank.id}>{bank.name}</option>
              {/each}
            </select>
          </div>

          <!-- 계좌 타입 -->
          <div>
            <label for="account-type" class="block text-sm font-medium text-gray-700 mb-1">계좌 타입</label>
            <select
              id="account-type"
              bind:value={formData.accountType}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="checking">입출금</option>
              <option value="savings">예금</option>
              <option value="business">사업자</option>
              <option value="investment">투자</option>
              <option value="loan">대출</option>
            </select>
          </div>

          <!-- 초기 잔액 -->
          <div>
            <label for="account-balance" class="block text-sm font-medium text-gray-700 mb-1">초기 잔액</label>
            <input
              id="account-balance"
              type="number"
              bind:value={formData.initialBalance}
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 설명 -->
          <div>
            <label for="account-description" class="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
            <textarea
              id="account-description"
              bind:value={formData.description}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="계좌에 대한 추가 설명"
            ></textarea>
          </div>

          <!-- 주요 계좌 여부 -->
          <div class="flex items-center">
            <input
              id="account-primary"
              type="checkbox"
              bind:checked={formData.isPrimary}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="account-primary" class="ml-2 block text-sm text-gray-700">주요 계좌로 설정</label>
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
            {isLoading ? '추가 중...' : '계좌 추가'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
