<script lang="ts">
  import { goto } from '$app/navigation'
  import LeaveCalendar from '$lib/components/leave/LeaveCalendar.svelte'
  import LeaveRequestModal from '$lib/components/leave/LeaveRequestModal.svelte'
  import { pushToast } from '$lib/stores/toasts'
  import { ArrowLeftIcon, CalendarIcon, PlusIcon } from 'lucide-svelte'
  import { onMount } from 'svelte'

  // 상태 관리
  let loading = $state(false)
  let showRequestModal = $state(false)
  let selectedDate = $state<Date | null>(null)
  let editingRequestId = $state<string | null>(null)
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
  let needsPromotion = $state(false) // 연차 촉진 대상 여부

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
        needsPromotion = data.needsPromotion || false
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
  function handleDateClick(date: Date, existingLeave?: any) {
    if (existingLeave) {
      // 기존 연차가 있으면 상세 정보 표시
      handleShowLeaveDetail(existingLeave)
    } else {
      // 새 연차 신청
      selectedDate = date
      editingRequestId = null
      showRequestModal = true
    }
  }

  // 연차 상세 정보 표시 핸들러
  let showLeaveDetailModal = $state(false)
  let selectedLeaveDetail = $state<any>(null)

  function handleShowLeaveDetail(leave: any) {
    selectedLeaveDetail = leave
    showLeaveDetailModal = true
  }

  function closeLeaveDetailModal() {
    showLeaveDetailModal = false
    selectedLeaveDetail = null
  }

  async function handleQuickCancel(requestId: string) {
    await handleCancelRequest(requestId)
    closeLeaveDetailModal()
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
    halfDayType?: '10-15' | '15-19'
    quarterDayType?: '10-12' | '13-15' | '15-17' | '17-19'
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
   * 연차 수정 핸들러
   */
  function handleEditRequest(request: any) {
    if (!request || !request.start_date) {
      pushToast('연차 정보를 찾을 수 없습니다.', 'error')
      return
    }

    // 날짜 확인
    if (!canModifyLeave(request.start_date)) {
      const isPast = isPastLeave(request.start_date)
      pushToast(
        isPast ? '지난 연차는 수정할 수 없습니다.' : '오늘 시작하는 연차는 수정할 수 없습니다.',
        'error',
      )
      return
    }

    // 연차 정보로 모달 채우기
    selectedDate = new Date(formatDate(request.start_date))
    editingRequestId = request.id

    // 모달 열기 전에 연차 타입 설정
    setTimeout(() => {
      showRequestModal = true
    }, 0)

    pushToast('연차 수정은 취소 후 재신청해주세요.', 'info')
  }

  /**
   * 연차 취소 핸들러
   */
  async function handleCancelRequest(requestId: string) {
    // 해당 연차 찾기
    const request = [...requests, ...yearRequests].find((r) => r.id === requestId)

    if (!request) {
      pushToast('연차 정보를 찾을 수 없습니다.', 'error')
      return
    }

    // 날짜 확인
    if (!canModifyLeave(request.start_date)) {
      const isPast = isPastLeave(request.start_date)
      pushToast(
        isPast ? '지난 연차는 취소할 수 없습니다.' : '오늘 시작하는 연차는 취소할 수 없습니다.',
        'error',
      )
      return
    }

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
   * 날짜 포맷팅 (KST 문자열에서 날짜 부분만 추출)
   * 예: "2025-10-11 11:09:00+09" → "2025-10-11"
   */
  function formatDate(dateString: string) {
    if (!dateString) return ''
    return dateString.substring(0, 10)
  }

  /**
   * 시간 포맷팅 (KST 문자열에서 시간 부분만 추출)
   * 예: "2025-10-11 11:09:00+09" → "11:09"
   */
  function formatTime(dateString: string) {
    if (!dateString) return ''
    return dateString.substring(11, 16)
  }

  /**
   * KST 기준 오늘 날짜 (YYYY-MM-DD)
   */
  function getTodayKST(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 연차 시작일이 오늘 이전인지 확인 (지난 연차인지)
   */
  function isPastLeave(startDateString: string): boolean {
    if (!startDateString) return false
    const today = getTodayKST()
    const startDate = formatDate(startDateString)
    return startDate < today // 오늘보다 이전이면 true
  }

  /**
   * 연차 수정/취소 가능 여부 (오늘 이후만 가능)
   */
  function canModifyLeave(startDateString: string): boolean {
    if (!startDateString) return false
    const today = getTodayKST()
    const startDate = formatDate(startDateString)
    return startDate > today // 오늘보다 미래면 true
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
      <!-- 연차 촉진 알림 -->
      {#if needsPromotion}
        <div
          class="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white flex items-center gap-4"
        >
          <div class="text-4xl">⚠️</div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">연차 사용 촉진 대상입니다</h3>
            <p class="text-orange-50">
              올해 연차 소진율이 50% 이하입니다. 연말까지 남은 연차를 적극적으로 사용해주세요.
            </p>
          </div>
        </div>
      {/if}

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
                  >{parseFloat(String(balance?.remaining_days || 0))}</span
                >
                <span class="text-xl text-blue-100">일</span>
              </div>
              <div class="flex gap-4 text-sm text-blue-100">
                <span>총 {parseFloat(String(balance?.total_days || 0))}일</span>
                <span>|</span>
                <span>사용 {parseFloat(String(balance?.used_days || 0))}일</span>
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
                    {#if formatDate(request.start_date) !== formatDate(request.end_date)}
                      ~ {formatDate(request.end_date)}
                    {/if}
                    <span class="text-gray-500 ml-2">
                      ({formatTime(request.start_date)} ~ {formatTime(request.end_date)})
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">{request.reason}</div>
                </div>

                <!-- 액션 버튼 -->
                <div class="ml-4 flex gap-2">
                  {#if request.status === 'pending' || request.status === 'approved'}
                    {#if canModifyLeave(request.start_date)}
                      <!-- 수정 버튼 (오늘 이후만) -->
                      <button
                        type="button"
                        onclick={() => handleEditRequest(request)}
                        class="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        수정
                      </button>

                      <!-- 취소 버튼 (오늘 이후만) -->
                      <button
                        type="button"
                        onclick={() => handleCancelRequest(request.id)}
                        class="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    {:else}
                      <!-- 지난 연차는 수정/취소 불가 -->
                      <span class="px-4 py-2 text-sm text-gray-400 italic"> 수정/취소 불가 </span>
                    {/if}
                  {/if}
                </div>
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

<!-- 연차 상세 모달 -->
{#if showLeaveDetailModal && selectedLeaveDetail}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={(e) => {
      if (e.target === e.currentTarget) closeLeaveDetailModal()
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') closeLeaveDetailModal()
    }}
    role="button"
    tabindex="0"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all"
    >
      <!-- 헤더 -->
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-2xl font-bold">연차 상세 정보</h3>
          <button
            type="button"
            onclick={closeLeaveDetailModal}
            class="text-white hover:text-gray-200 text-2xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>
        <p class="text-purple-100">연차 신청 내역을 확인하고 관리할 수 있습니다</p>
      </div>

      <!-- 컨텐츠 -->
      <div class="p-6 space-y-4">
        <!-- 연차 타입 -->
        <div
          class="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
        >
          <span class="text-3xl">
            {#if selectedLeaveDetail.leave_type_name === '연차'}
              📅
            {:else if selectedLeaveDetail.leave_type_name === '반차'}
              🌤️
            {:else if selectedLeaveDetail.leave_type_name.includes('반반차')}
              🌅
            {:else if selectedLeaveDetail.leave_type_name === '경조사'}
              💐
            {:else if selectedLeaveDetail.leave_type_name === '예비군/민방위'}
              🪖
            {:else}
              📋
            {/if}
          </span>
          <div>
            <div class="text-sm text-gray-600 font-medium">연차 종류</div>
            <div class="text-lg font-bold text-gray-900">{selectedLeaveDetail.leave_type_name}</div>
          </div>
        </div>

        <!-- 기간 -->
        <div class="space-y-2">
          <div class="text-sm text-gray-600 font-medium">연차 기간</div>
          <div class="flex items-center gap-2 text-gray-900">
            <span class="font-semibold">{formatDate(selectedLeaveDetail.start_date)}</span>
            {#if formatDate(selectedLeaveDetail.start_date) !== formatDate(selectedLeaveDetail.end_date)}
              <span class="text-gray-400">~</span>
              <span class="font-semibold">{formatDate(selectedLeaveDetail.end_date)}</span>
            {/if}
          </div>
          <div class="text-sm text-gray-500">
            {formatTime(selectedLeaveDetail.start_date)} ~ {formatTime(
              selectedLeaveDetail.end_date,
            )}
          </div>
        </div>

        <!-- 총 일수 -->
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span class="text-sm text-gray-600 font-medium">사용 일수</span>
          <span class="text-lg font-bold text-blue-600">{selectedLeaveDetail.total_days}일</span>
        </div>

        <!-- 사유 -->
        {#if selectedLeaveDetail.reason}
          <div class="space-y-2">
            <div class="text-sm text-gray-600 font-medium">사유</div>
            <div class="p-3 bg-gray-50 rounded-lg text-gray-900">{selectedLeaveDetail.reason}</div>
          </div>
        {/if}

        <!-- 상태 -->
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span class="text-sm text-gray-600 font-medium">상태</span>
          <span
            class="px-3 py-1 rounded-full text-sm font-semibold {selectedLeaveDetail.status ===
            'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : selectedLeaveDetail.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'}"
          >
            {selectedLeaveDetail.status === 'approved'
              ? '✓ 승인됨'
              : selectedLeaveDetail.status === 'pending'
                ? '⏳ 대기중'
                : '✕ 거부됨'}
          </span>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="p-6 bg-gray-50 flex gap-3">
        {#if selectedLeaveDetail.status === 'pending' || selectedLeaveDetail.status === 'approved'}
          {#if canModifyLeave(selectedLeaveDetail.start_date)}
            <!-- 미래 연차: 수정/취소 가능 -->
            <button
              type="button"
              onclick={() => {
                closeLeaveDetailModal()
                handleEditRequest(selectedLeaveDetail)
              }}
              class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              수정하기
            </button>
            <button
              type="button"
              onclick={() => handleQuickCancel(selectedLeaveDetail.id)}
              class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              취소하기
            </button>
          {:else}
            <!-- 오늘 또는 지난 연차: 수정/취소 불가 -->
            <div class="flex-1 text-center">
              <p class="text-sm text-gray-500 mb-2">
                {isPastLeave(selectedLeaveDetail.start_date)
                  ? '지난 연차는 수정/취소할 수 없습니다.'
                  : '오늘 시작하는 연차는 수정/취소할 수 없습니다.'}
              </p>
              <button
                type="button"
                onclick={closeLeaveDetailModal}
                class="w-full px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          {/if}
        {:else}
          <button
            type="button"
            onclick={closeLeaveDetailModal}
            class="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            닫기
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
