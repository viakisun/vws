<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import LeaveCalendar from '$lib/components/leave/LeaveCalendar.svelte'
  import LeaveRequestModal from '$lib/components/leave/LeaveRequestModal.svelte'
  import { ArrowLeftIcon, CalendarIcon, PlusIcon } from 'lucide-svelte'

  // 상태 관리
  let loading = $state(false)
  let showRequestModal = $state(false)
  let selectedDate = $state<Date | null>(null)
  let currentYear = $state(new Date().getFullYear())
  let currentMonth = $state(new Date().getMonth() + 1)

  // 데이터
  let employee = $state<{ id: string; employeeId: string; name: string } | null>(null)
  let balance = $state<{
    year: number
    total_days: number
    used_days: number
    remaining_days: number
  } | null>(null)
  let requests = $state<any[]>([]) // 선택된 월의 연차 데이터
  let yearRequests = $state<any[]>([]) // 올해 전체 연차 데이터
  let leaveTypes = $state<any[]>([])

  /**
   * 연차 타입 조회
   */
  async function loadLeaveTypes() {
    try {
      const response = await fetch(
        `/api/dashboard/leave/types?date=${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      )

      if (response.ok) {
        const data = await response.json()
        leaveTypes = data.leaveTypes || []
      }
    } catch (error) {
      // 에러는 무시 (타입 로드 실패해도 기본 동작)
    }
  }

  /**
   * 올해 전체 연차 데이터 로드 (캘린더 월별 배지 표시용)
   */
  async function loadYearLeaveData() {
    try {
      const dateStr = `${currentYear}-01-01`
      const response = await fetch(`/api/dashboard/leave?date=${dateStr}&all=true`)

      if (response.ok) {
        const data = await response.json()
        yearRequests = data.requests || []
      }
    } catch (error) {
      // 에러 무시 (전체 데이터는 선택적)
    }
  }

  /**
   * 선택된 월의 연차 데이터 로드
   */
  async function loadLeaveData() {
    loading = true
    try {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const response = await fetch(`/api/dashboard/leave?date=${dateStr}`)

      if (response.ok) {
        const data = await response.json()
        employee = data.employee
        balance = data.balance
        requests = data.requests || []
      } else {
        const error = await response.json()
        pushToast(error.error || '데이터 로드 실패', 'error')
      }
    } catch (error) {
      pushToast('연차 데이터 조회에 실패했습니다.', 'error')
    } finally {
      loading = false
    }
  }

  // 날짜 클릭 핸들러
  function handleDateClick(date: Date) {
    selectedDate = date
    showRequestModal = true
  }

  // 월 변경 핸들러
  function handleMonthChange(date: Date) {
    currentYear = date.getFullYear()
    currentMonth = date.getMonth() + 1
    loadLeaveData()
  }

  /**
   * 연도 변경 핸들러
   */
  function handleYearChange(year: number) {
    currentYear = year
    loadYearLeaveData()
    loadLeaveData()
  }

  /**
   * 연차 신청 핸들러
   */
  async function handleLeaveSubmit(data: {
    leaveTypeId: string
    startDate: string
    endDate: string
    totalDays: number
    reason: string
    halfDayType?: 'morning' | 'afternoon'
  }) {
    try {
      const response = await fetch('/api/dashboard/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        pushToast(result.message || '연차 신청이 완료되었습니다.', 'success')
        showRequestModal = false
        selectedDate = null

        // 데이터 새로고침
        await loadYearLeaveData()
        await loadLeaveData()
      } else {
        const error = await response.json()
        pushToast(error.error || '연차 신청 실패', 'error')
      }
    } catch (error) {
      pushToast('연차 신청에 실패했습니다.', 'error')
    }
  }

  /**
   * 연차 취소 핸들러
   */
  async function handleCancelRequest(requestId: string) {
    if (!confirm('연차 신청을 취소하시겠습니까?')) return

    try {
      const response = await fetch(`/api/dashboard/leave/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        pushToast('연차 신청이 취소되었습니다.', 'success')
        await loadYearLeaveData()
        await loadLeaveData()
      } else {
        const error = await response.json()
        pushToast(error.error || '연차 취소 실패', 'error')
      }
    } catch (error) {
      pushToast('연차 취소에 실패했습니다.', 'error')
    }
  }

  /**
   * 날짜 포맷팅 (YYYY-MM-DD -> 한국 형식)
   */
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  /**
   * 대시보드로 이동
   */
  function goBack() {
    goto('/dashboard')
  }

  /**
   * 페이지 초기화
   */
  onMount(async () => {
    await loadLeaveTypes()
    await loadYearLeaveData()
    await loadLeaveData()
  })
</script>

<svelte:head>
  <title>연차 관리 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Breadcrumb Navigation -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={goBack}
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon size={20} />
          <span>대시보드</span>
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-900">연차 관리</h1>
      </div>

      <!-- 연차 신청 버튼 -->
      {#if balance}
        <button
          type="button"
          onclick={() => {
            selectedDate = new Date()
            showRequestModal = true
          }}
          class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          <PlusIcon size={20} />
          <span>연차 신청하기</span>
        </button>
      {/if}
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else}
      {#if balance}
        <!-- 연차 현황 -->
        <div
          class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div class="flex items-center gap-2 text-blue-100 mb-6">
            <CalendarIcon size={20} />
            <span class="text-sm font-medium">{currentYear}년 연차 현황</span>
          </div>
          <div class="flex items-end justify-between">
            <div class="space-y-3">
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-blue-100">잔여</span>
                <span class="text-5xl font-bold tabular-nums"
                  >{parseFloat(balance?.remaining_days || 0)}</span
                >
                <span class="text-xl text-blue-100">일</span>
              </div>
              <div class="flex gap-4 text-sm text-blue-100">
                <span>총 {parseFloat(balance?.total_days || 0)}일</span>
                <span>|</span>
                <span>사용 {parseFloat(balance?.used_days || 0)}일</span>
              </div>
            </div>
            {#if employee}
              <div class="text-blue-100 text-sm text-right">
                {employee.name}<br />
                <span class="text-blue-200">({employee.employeeId})</span>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div
          class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white"
        >
          <div class="flex items-center gap-4">
            <div class="text-5xl">⚠️</div>
            <div>
              <h3 class="text-xl font-bold mb-2">연차 정보 없음</h3>
              <p class="text-amber-50">
                {currentYear}년도 연차 정보가 없습니다. 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- 캘린더 -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <LeaveCalendar
          {currentYear}
          {currentMonth}
          {requests}
          {yearRequests}
          onDateClick={handleDateClick}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />
      </div>

      <!-- 연차 신청 내역 -->
      {#if requests.length > 0}
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CalendarIcon size={24} />
            <span>이번 달 연차 신청 내역</span>
          </h2>
          <div class="space-y-4">
            {#each requests as request}
              <div
                class="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl hover:shadow-md transition-all border border-gray-200"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-base font-bold text-gray-900">
                      {request.leave_type_name}
                    </span>
                    <span
                      class="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-full"
                    >
                      {request.total_days}일
                    </span>
                    <span
                      class="inline-flex px-3 py-1 text-xs font-bold rounded-full {request.status ===
                      'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : request.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'}"
                    >
                      {request.status === 'approved'
                        ? '✓ 승인됨'
                        : request.status === 'pending'
                          ? '⏳ 대기중'
                          : '✕ 거부됨'}
                    </span>
                  </div>
                  <div class="text-sm font-medium text-gray-700 mb-1">
                    {formatDate(request.start_date)}
                    {#if request.start_date !== request.end_date}
                      ~ {formatDate(request.end_date)}
                    {/if}
                    {#if request.start_time && request.end_time}
                      <span class="text-gray-500 ml-2">
                        ({request.start_time} - {request.end_time})
                      </span>
                    {/if}
                  </div>
                  <div class="text-sm text-gray-600">{request.reason}</div>
                </div>
                <button
                  type="button"
                  onclick={() => handleCancelRequest(request.id)}
                  class="ml-4 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- 연차 신청 모달 -->
<LeaveRequestModal
  isOpen={showRequestModal}
  {selectedDate}
  {leaveTypes}
  {balance}
  onClose={() => {
    showRequestModal = false
    selectedDate = null
  }}
  onSubmit={handleLeaveSubmit}
/>
