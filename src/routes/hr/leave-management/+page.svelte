<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import type { LeaveRequest, LeaveStats } from '$lib/types/dashboard'
  import { logger } from '$lib/utils/logger'

  const { data: _data }: { data: PageData } = $props()

  // 상태 관리
  let currentTab = $state('approval')
  let requests = $state<LeaveRequest[]>([])
  let stats = $state<LeaveStats>({
    departmentStats: [],
    monthlyStats: [],
  })
  let loading = $state(false)
  let selectedRequest = $state<LeaveRequest | null>(null)
  let showApprovalModal = $state(false)
  let approvalAction = $state('')
  let rejectionReason = $state('')

  // 필터
  let statusFilter = $state('pending')
  let departmentFilter = $state('')
  let employeeNameFilter = $state('')

  // 페이지네이션
  let currentPage = $state(1)
  let totalPages = $state(1)
  let totalCount = $state(0)

  // 탭 변경
  function switchTab(tab: string) {
    currentTab = tab
    if (tab === 'approval') {
      loadApprovalRequests()
    } else if (tab === 'stats') {
      loadStatistics()
    }
  }

  // 승인 요청 목록 로드
  async function loadApprovalRequests() {
    loading = true
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
      })

      if (departmentFilter) params.append('department', departmentFilter)
      if (employeeNameFilter) params.append('employeeName', employeeNameFilter)

      const response = await fetch(`/api/hr/leave-approval?${params}`)
      const result = await response.json()

      if (result.success) {
        requests = result.data.requests
        totalPages = result.data.pagination.totalPages
        totalCount = result.data.pagination.total
        stats = result.data.stats
      }
    } catch (error) {
      logger.error('Error loading approval requests:', error)
    } finally {
      loading = false
    }
  }

  // 통계 로드
  async function loadStatistics() {
    loading = true
    try {
      const response = await fetch('/api/hr/leave-stats')
      const result = await response.json()

      if (result.success) {
        stats = result.data
      }
    } catch (error) {
      logger.error('Error loading statistics:', error)
    } finally {
      loading = false
    }
  }

  // 승인/반려 처리
  async function handleApproval() {
    if (!selectedRequest) return

    try {
      const response = await fetch('/api/hr/leave-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: approvalAction,
          rejectionReason: approvalAction === 'reject' ? rejectionReason : null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showApprovalModal = false
        selectedRequest = null
        approvalAction = ''
        rejectionReason = ''
        loadApprovalRequests()
      } else {
        pushToast(result.message, 'info')
      }
    } catch (error) {
      logger.error('Error processing approval:', error)
      pushToast('처리 중 오류가 발생했습니다.', 'error')
    }
  }

  // 승인 모달 열기
  function openApprovalModal(request: any, action: string) {
    selectedRequest = request
    approvalAction = action
    showApprovalModal = true
  }

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 상태 라벨
  function getStatusLabel(status: string) {
    const labels = {
      pending: '대기중',
      approved: '승인',
      rejected: '반려',
      cancelled: '취소',
    }
    return labels[status] || status
  }

  // 상태 색상
  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // 휴가 타입 라벨
  function getLeaveTypeLabel(type: string) {
    const labels = {
      annual: '연차',
      sick: '병가',
      personal: '개인사유',
      maternity: '출산휴가',
      paternity: '육아휴가',
      bereavement: '경조사',
      military: '군입대',
      other: '기타',
    }
    return labels[type] || type
  }

  // 초기 로드
  onMount(() => {
    loadApprovalRequests()
  })
</script>

<svelte:head>
  <title>연차 관리 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- 페이지 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">연차 관리</h1>
    <p class="text-gray-600">직원들의 연차 신청을 승인하고 통계를 확인할 수 있습니다.</p>
  </div>

  <!-- 탭 네비게이션 -->
  <div class="bg-white rounded-lg shadow">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8 px-6">
        <button
          type="button"
          class="py-4 px-1 border-b-2 font-medium text-sm {currentTab === 'approval'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          onclick={() => switchTab('approval')}
        >
          승인 관리
        </button>
        <button
          type="button"
          class="py-4 px-1 border-b-2 font-medium text-sm {currentTab === 'stats'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          onclick={() => switchTab('stats')}
        >
          통계 현황
        </button>
      </nav>
    </div>

    <!-- 승인 관리 탭 -->
    {#if currentTab === 'approval'}
      <div class="p-6">
        <!-- 필터 -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2"
              >상태</label
            >
            <select
              id="status-filter"
              bind:value={statusFilter}
              onchange={loadApprovalRequests}
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="pending">대기중</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div>
            <label for="department-filter" class="block text-sm font-medium text-gray-700 mb-2"
              >부서</label
            >
            <input
              id="department-filter"
              type="text"
              bind:value={departmentFilter}
              placeholder="부서명"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label for="employee-name-filter" class="block text-sm font-medium text-gray-700 mb-2"
              >직원명</label
            >
            <input
              id="employee-name-filter"
              type="text"
              bind:value={employeeNameFilter}
              placeholder="직원명"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div class="flex items-end">
            <button
              type="button"
              onclick={loadApprovalRequests}
              class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              검색
            </button>
          </div>
        </div>

        <!-- 통계 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-gray-900">{stats.totalRequests || 0}</div>
            <div class="text-sm text-gray-600">총 신청</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-yellow-600">{stats.pendingRequests || 0}</div>
            <div class="text-sm text-gray-600">대기중</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">{stats.approvedRequests || 0}</div>
            <div class="text-sm text-gray-600">승인</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-red-600">{stats.rejectedRequests || 0}</div>
            <div class="text-sm text-gray-600">반려</div>
          </div>
        </div>

        <!-- 연차 신청 목록 -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >직원</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >휴가 유형</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >기간</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >일수</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >상태</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >신청일</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >액션</th
                  >
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each requests as request}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{request.employee_name}</div>
                        <div class="text-sm text-gray-500">
                          {request.department} • {request.position}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getLeaveTypeLabel(request.leave_type)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(request.start_date)} ~ {formatDate(request.end_date)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.days}일
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(
                          request.status,
                        )}"
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {#if request.status === 'pending'}
                        <div class="flex space-x-2">
                          <button
                            type="button"
                            onclick={() => openApprovalModal(request, 'approve')}
                            class="text-green-600 hover:text-green-900"
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            onclick={() => openApprovalModal(request, 'reject')}
                            class="text-red-600 hover:text-red-900"
                          >
                            반려
                          </button>
                        </div>
                      {:else}
                        <span class="text-gray-400">처리완료</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          {#if totalPages > 1}
            <div
              class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
            >
              <div class="flex-1 flex justify-between sm:hidden">
                <button
                  type="button"
                  onclick={() => {
                    currentPage = Math.max(1, currentPage - 1)
                    loadApprovalRequests()
                  }}
                  disabled={currentPage === 1}
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  type="button"
                  onclick={() => {
                    currentPage = Math.min(totalPages, currentPage + 1)
                    loadApprovalRequests()
                  }}
                  disabled={currentPage === totalPages}
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    총 <span class="font-medium">{totalCount}</span>개 중
                    <span class="font-medium">{(currentPage - 1) * 20 + 1}</span>-<span
                      class="font-medium">{Math.min(currentPage * 20, totalCount)}</span
                    >개 표시
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      type="button"
                      onclick={() => {
                        currentPage = Math.max(1, currentPage - 1)
                        loadApprovalRequests()
                      }}
                      disabled={currentPage === 1}
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        currentPage = Math.min(totalPages, currentPage + 1)
                        loadApprovalRequests()
                      }}
                      disabled={currentPage === totalPages}
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- 통계 현황 탭 -->
    {#if currentTab === 'stats'}
      <div class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 부서별 연차 사용 현황 -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">부서별 연차 사용 현황</h3>
            <div class="space-y-4">
              {#each stats.departmentStats || [] as dept}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium text-gray-900">{dept.department || '미지정'}</h4>
                    <span class="text-sm text-gray-500">{dept.total_employees}명</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div class="text-gray-600">연차 사용</div>
                      <div class="font-medium">{dept.used_annual_days}일</div>
                    </div>
                    <div>
                      <div class="text-gray-600">병가 사용</div>
                      <div class="font-medium">{dept.used_sick_days}일</div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- 월별 연차 사용 현황 -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">월별 연차 사용 현황</h3>
            <div class="space-y-3">
              {#each stats.monthlyStats || [] as month}
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                  <span class="text-sm font-medium text-gray-900">{month.month}월</span>
                  <div class="text-sm text-gray-600">
                    연차: {month.annual_days}일, 병가: {month.sick_days}일
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- 승인/반려 모달 -->
{#if showApprovalModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {approvalAction === 'approve' ? '연차 승인' : '연차 반려'}
        </h3>

        {#if selectedRequest}
          <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">
              <div><strong>직원:</strong> {selectedRequest.employee_name}</div>
              <div>
                <strong>기간:</strong>
                {formatDate(selectedRequest.start_date)} ~ {formatDate(selectedRequest.end_date)}
              </div>
              <div><strong>일수:</strong> {selectedRequest.days}일</div>
              <div><strong>사유:</strong> {selectedRequest.reason}</div>
            </div>
          </div>
        {/if}

        {#if approvalAction === 'reject'}
          <div class="mb-4">
            <label for="rejection-reason" class="block text-sm font-medium text-gray-700 mb-2"
              >반려 사유</label
            >
            <textarea
              id="rejection-reason"
              bind:value={rejectionReason}
              placeholder="반려 사유를 입력해주세요"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
            ></textarea>
          </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            onclick={() => {
              showApprovalModal = false
              selectedRequest = null
              approvalAction = ''
              rejectionReason = ''
            }}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onclick={handleApproval}
            class="px-4 py-2 {approvalAction === 'approve'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'} text-white rounded-md"
          >
            {approvalAction === 'approve' ? '승인' : '반려'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
