<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  // 상태 관리
  let leaveData = $state(null)
  let loading = $state(false)
  let showRequestModal = $state(false)

  // 휴가 신청 폼
  let leaveType = $state('annual')
  let startDate = $state('')
  let endDate = $state('')
  let startTime = $state('')
  let endTime = $state('')
  let days = $state(1)
  let reason = $state('')

  // 연차 데이터 로드
  async function loadLeaveData() {
    loading = true
    try {
      const response = await fetch('/api/dashboard/leave')
      const result = await response.json()

      if (result.success) {
        leaveData = result.data
      }
    } catch (error) {
      console.error('Error loading leave data:', error)
    } finally {
      loading = false
    }
  }

  // 휴가 신청
  async function submitLeaveRequest() {
    if (!startDate || !endDate || !reason) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/dashboard/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          startTime: startTime || null,
          endTime: endTime || null,
          days,
          reason,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showRequestModal = false
        resetForm()
        await loadLeaveData()
        alert('휴가 신청이 완료되었습니다.')
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      alert('휴가 신청에 실패했습니다.')
    }
  }

  // 폼 초기화
  function resetForm() {
    leaveType = 'annual'
    startDate = ''
    endDate = ''
    startTime = ''
    endTime = ''
    days = 1
    reason = ''
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

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 초기 로드
  onMount(() => {
    loadLeaveData()
  })
</script>

<svelte:head>
  <title>연차 현황 - VWS</title>
</svelte:head>

<div class="space-y-6">
  <!-- 페이지 헤더 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">연차 현황</h1>
        <p class="text-gray-600">연차 잔여일수와 휴가 신청 내역을 확인할 수 있습니다.</p>
      </div>
      <button
        onclick={() => (showRequestModal = true)}
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        휴가 신청
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if leaveData}
    <!-- 연차 잔여일수 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">연차 현황</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div>
              <div class="text-sm text-blue-600">총 연차</div>
              <div class="text-2xl font-bold text-blue-900">{leaveData.balance.annual.total}일</div>
            </div>
            <div class="text-4xl">📅</div>
          </div>
          <div class="flex justify-between items-center p-4 bg-green-50 rounded-lg">
            <div>
              <div class="text-sm text-green-600">사용 연차</div>
              <div class="text-2xl font-bold text-green-900">{leaveData.balance.annual.used}일</div>
            </div>
          </div>
          <div class="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
            <div>
              <div class="text-sm text-orange-600">잔여 연차</div>
              <div class="text-2xl font-bold text-orange-900">
                {leaveData.balance.annual.remaining}일
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">병가 현황</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 bg-red-50 rounded-lg">
            <div>
              <div class="text-sm text-red-600">총 병가</div>
              <div class="text-2xl font-bold text-red-900">{leaveData.balance.sick.total}일</div>
            </div>
            <div class="text-4xl">🏥</div>
          </div>
          <div class="flex justify-between items-center p-4 bg-green-50 rounded-lg">
            <div>
              <div class="text-sm text-green-600">사용 병가</div>
              <div class="text-2xl font-bold text-green-900">{leaveData.balance.sick.used}일</div>
            </div>
          </div>
          <div class="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
            <div>
              <div class="text-sm text-orange-600">잔여 병가</div>
              <div class="text-2xl font-bold text-orange-900">
                {leaveData.balance.sick.remaining}일
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이번 달 통계 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">이번 달 통계</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-sm text-blue-600">총 신청</div>
          <div class="text-2xl font-bold text-blue-900">
            {leaveData.monthlyStats.totalRequests}건
          </div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-sm text-yellow-600">대기중</div>
          <div class="text-2xl font-bold text-yellow-900">
            {leaveData.monthlyStats.pendingRequests}건
          </div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-sm text-green-600">승인</div>
          <div class="text-2xl font-bold text-green-900">
            {leaveData.monthlyStats.approvedRequests}건
          </div>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <div class="text-sm text-orange-600">승인 일수</div>
          <div class="text-2xl font-bold text-orange-900">
            {leaveData.monthlyStats.approvedDays}일
          </div>
        </div>
      </div>
    </div>

    <!-- 휴가 신청 내역 -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">휴가 신청 내역</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
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
                >승인자</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each leaveData.requests as request}
              <tr class="hover:bg-gray-50">
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.approver_name || '-'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- 휴가 신청 모달 -->
{#if showRequestModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">휴가 신청</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">휴가 유형</label>
            <select
              bind:value={leaveType}
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="annual">연차</option>
              <option value="sick">병가</option>
              <option value="personal">개인사유</option>
              <option value="maternity">출산휴가</option>
              <option value="paternity">육아휴가</option>
              <option value="bereavement">경조사</option>
              <option value="military">군입대</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                bind:value={startDate}
                class="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                bind:value={endDate}
                class="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">시작 시간 (선택)</label>
              <input
                type="time"
                bind:value={startTime}
                class="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">종료 시간 (선택)</label>
              <input
                type="time"
                bind:value={endTime}
                class="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">휴가 일수</label>
            <input
              type="number"
              bind:value={days}
              min="0.25"
              step="0.25"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p class="text-xs text-gray-500 mt-1">0.25 = 반반차, 0.5 = 반차, 1 = 1일</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사유</label>
            <textarea
              bind:value={reason}
              placeholder="휴가 사유를 입력해주세요"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            onclick={() => {
              showRequestModal = false
              resetForm()
            }}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            취소
          </button>
          <button
            onclick={submitLeaveRequest}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            신청
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
