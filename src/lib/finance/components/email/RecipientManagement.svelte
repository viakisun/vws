<script lang="ts">
  import type { EmailRecipient } from '$lib/finance/services/email/email-service'
  import { BellIcon, EditIcon, MailIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // State
  let recipients = $state<EmailRecipient[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)
  let showEditModal = $state(false)
  let _editingRecipient = $state<EmailRecipient | null>(null)

  // 폼 데이터
  let formData = $state({
    name: '',
    email: '',
    role: 'other' as 'ceo' | 'cfo' | 'accountant' | 'manager' | 'other',
    isActive: true,
    preferences: {
      dailyReport: true,
      weeklyReport: true,
      monthlyReport: true,
      budgetAlerts: true,
      urgentAlerts: true,
    },
  })

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/email/recipients')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '수신자 목록을 불러올 수 없습니다.')
      }

      recipients = result.data
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 수신자 추가
  async function addRecipient() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/email/recipients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '수신자 추가에 실패했습니다.')
      }

      recipients = [result.data, ...recipients]

      // 폼 초기화
      formData = {
        name: '',
        email: '',
        role: 'other',
        isActive: true,
        preferences: {
          dailyReport: true,
          weeklyReport: true,
          monthlyReport: true,
          budgetAlerts: true,
          urgentAlerts: true,
        },
      }

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '수신자 추가에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 수신자 삭제
  async function deleteRecipient(recipient: EmailRecipient) {
    if (!confirm(`수신자 "${recipient.name}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      isLoading = true
      error = null

      const response = await fetch(`/api/finance/email/recipients/${recipient.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '수신자 삭제에 실패했습니다.')
      }

      recipients = recipients.filter((r) => r.id !== recipient.id)
    } catch (err) {
      error = err instanceof Error ? err.message : '수신자 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 수신자 편집 모달 열기
  function openEditModal(recipient: EmailRecipient) {
    _editingRecipient = recipient
    formData = {
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
      isActive: recipient.isActive,
      preferences: { ...recipient.preferences },
    }
    showEditModal = true
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadData()
  })

  // 역할별 색상
  function getRoleColor(role: string): string {
    const colors = {
      ceo: 'text-purple-600',
      cfo: 'text-blue-600',
      accountant: 'text-green-600',
      manager: 'text-orange-600',
      other: 'text-gray-600',
    }
    return colors[role as keyof typeof colors] || 'text-gray-600'
  }

  function getRoleBgColor(role: string): string {
    const colors = {
      ceo: 'bg-purple-50',
      cfo: 'bg-blue-50',
      accountant: 'bg-green-50',
      manager: 'bg-orange-50',
      other: 'bg-gray-50',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-50'
  }

  // 역할명 변환
  function getRoleName(role: string): string {
    const names = {
      ceo: '대표이사',
      cfo: 'CFO',
      accountant: '회계 담당자',
      manager: '매니저',
      other: '기타',
    }
    return names[role as keyof typeof names] || '기타'
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">이메일 수신자 관리</h3>
      <p class="text-sm text-gray-500">
        총 {recipients.length}명의 수신자 • 활성 {recipients.filter((r) => r.isActive).length}명
      </p>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon size={16} class="mr-2" />
      새 수신자
    </button>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 수신자 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">수신자 목록을 불러오는 중...</span>
    </div>
  {:else if recipients.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each recipients as recipient}
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <MailIcon size={20} class="mr-3 text-gray-400" />
              <div>
                <h4 class="text-lg font-medium text-gray-900">{recipient.name}</h4>
                <div class="text-sm text-gray-500">{recipient.email}</div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                onclick={() => openEditModal(recipient)}
                class="text-blue-600 hover:text-blue-900"
                title="편집"
              >
                <EditIcon size={16} />
              </button>
              <button
                onclick={() => deleteRecipient(recipient)}
                class="text-red-600 hover:text-red-900"
                title="삭제"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>

          <!-- 역할 및 상태 -->
          <div class="flex items-center justify-between mb-4">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleBgColor(
                recipient.role,
              )} {getRoleColor(recipient.role)}"
            >
              {getRoleName(recipient.role)}
            </span>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {recipient.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'}"
            >
              {recipient.isActive ? '활성' : '비활성'}
            </span>
          </div>

          <!-- 알림 설정 -->
          <div class="space-y-2">
            <div class="flex items-center text-sm">
              <BellIcon size={14} class="mr-2 text-gray-400" />
              <span class="text-gray-600">알림 설정:</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2 {recipient.preferences.dailyReport
                    ? 'bg-green-500'
                    : 'bg-gray-300'}"
                ></div>
                <span class="text-gray-600">일일 리포트</span>
              </div>
              <div class="flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2 {recipient.preferences.weeklyReport
                    ? 'bg-green-500'
                    : 'bg-gray-300'}"
                ></div>
                <span class="text-gray-600">주간 리포트</span>
              </div>
              <div class="flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2 {recipient.preferences.monthlyReport
                    ? 'bg-green-500'
                    : 'bg-gray-300'}"
                ></div>
                <span class="text-gray-600">월간 리포트</span>
              </div>
              <div class="flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2 {recipient.preferences.budgetAlerts
                    ? 'bg-green-500'
                    : 'bg-gray-300'}"
                ></div>
                <span class="text-gray-600">예산 알림</span>
              </div>
              <div class="flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2 {recipient.preferences.urgentAlerts
                    ? 'bg-green-500'
                    : 'bg-gray-300'}"
                ></div>
                <span class="text-gray-600">긴급 알림</span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <MailIcon size={48} class="mx-auto" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">수신자가 없습니다</h3>
      <p class="text-gray-500 mb-4">새 수신자를 추가하여 이메일 알림을 설정하세요.</p>
      <button
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon size={16} class="mr-2" />
        첫 번째 수신자 추가
      </button>
    </div>
  {/if}
</div>

<!-- 수신자 추가/편집 모달 -->
{#if showAddModal || showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {showAddModal ? '새 수신자 추가' : '수신자 편집'}
      </h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          addRecipient()
        }}
      >
        <div class="space-y-4">
          <!-- 이름 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              bind:value={formData.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="홍길동"
            />
          </div>

          <!-- 이메일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              bind:value={formData.email}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@company.com"
            />
          </div>

          <!-- 역할 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select
              bind:value={formData.role}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ceo">대표이사</option>
              <option value="cfo">CFO</option>
              <option value="accountant">회계 담당자</option>
              <option value="manager">매니저</option>
              <option value="other">기타</option>
            </select>
          </div>

          <!-- 활성 상태 -->
          <div class="flex items-center">
            <input
              type="checkbox"
              bind:checked={formData.isActive}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-700">활성 상태</label>
          </div>

          <!-- 알림 설정 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">알림 설정</label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.preferences.dailyReport}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-700">일일 리포트</label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.preferences.weeklyReport}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-700">주간 리포트</label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.preferences.monthlyReport}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-700">월간 리포트</label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.preferences.budgetAlerts}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-700">예산 알림</label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.preferences.urgentAlerts}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-700">긴급 알림</label>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={() => {
              showAddModal = false
              showEditModal = false
            }}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '저장 중...' : showAddModal ? '수신자 추가' : '수정 저장'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
