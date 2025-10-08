<script lang="ts">
  import { getWorkingDays } from '$lib/utils/holidays'

  interface LeaveType {
    id: string
    name: string
    description: string
  }

  interface Balance {
    total_days: number
    used_days: number
    remaining_days: number
  }

  interface Props {
    isOpen: boolean
    selectedDate: Date | null
    leaveTypes: LeaveType[]
    balance: Balance | null
    onClose: () => void
    onSubmit: (data: {
      leaveTypeId: string
      startDate: string
      endDate: string
      totalDays: number
      reason: string
      halfDayType?: '10-15' | '15-19'
      quarterDayType?: '10-12' | '13-15' | '15-17' | '17-19'
    }) => Promise<void>
  }

  let { isOpen, selectedDate, leaveTypes, balance, onClose, onSubmit }: Props = $props()

  let leaveTypeId = $state('')
  let startDate = $state('')
  let endDate = $state('')
  let halfDayType = $state<'10-15' | '15-19'>('10-15') // 반차 시간대
  let quarterDayType = $state<'10-12' | '13-15' | '15-17' | '17-19'>('10-12') // 반반차 시간대
  let reasonType = $state('') // 사유 종류
  let customReason = $state('') // 기타 사유 직접 입력
  let isSubmitting = $state(false)

  // 연차 사유 목록 (연차/반차/반반차용)
  const leaveReasons = [
    { value: '가족 행사', label: '가족 행사' },
    { value: '병원 진료', label: '병원 진료' },
    { value: '자녀 학교 행사', label: '자녀 학교 행사' },
    { value: '휴식', label: '휴식' },
    { value: '여행', label: '여행' },
    { value: '기타', label: '기타 (직접 입력)' },
  ]

  // 최종 사유 (reasonType이 '기타'면 customReason 사용)
  const finalReason = $derived(reasonType === '기타' ? customReason : reasonType)

  // 선택된 날짜가 변경되면 시작/종료일 자동 설정
  $effect(() => {
    if (selectedDate && isOpen) {
      // 로컬 시간대를 유지하면서 YYYY-MM-DD 형식으로 변환
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      startDate = dateStr
      endDate = dateStr
    }
  })

  // 선택된 연차 타입
  const selectedLeaveType = $derived(leaveTypes.find((t) => t.id === leaveTypeId))

  // 연차 일수 계산 (휴일 제외한 실제 근무일)
  const calculatedDays = $derived.by(() => {
    if (!selectedLeaveType) return 0

    switch (selectedLeaveType.name) {
      case '연차':
        if (!startDate || !endDate) return 0
        // 휴일 제외한 실제 근무일 수 계산
        return getWorkingDays(startDate, endDate)
      case '반차':
        return 0.5
      case '반반차':
        return 0.25
      case '경조사':
      case '예비군/민방위':
        if (!startDate || !endDate) return 0
        return getWorkingDays(startDate, endDate)
      default:
        return 0
    }
  })

  // 전체 기간 (휴일 포함)
  const totalPeriodDays = $derived.by(() => {
    if (!selectedLeaveType || selectedLeaveType.name !== '연차') return 0
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  })

  // 잔여 연차 부족 여부
  const isInsufficientBalance = $derived(balance ? calculatedDays > balance.remaining_days : false)

  async function handleSubmit(e: Event) {
    e.preventDefault()

    if (!leaveTypeId || !startDate || !endDate) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    // 연차/반차/반반차는 사유 필수
    const leaveTypeName = selectedLeaveType?.name
    if (leaveTypeName === '연차' || leaveTypeName === '반차' || leaveTypeName === '반반차') {
      if (!reasonType) {
        alert('사유를 선택해주세요.')
        return
      }
      if (reasonType === '기타' && !customReason.trim()) {
        alert('기타 사유를 입력해주세요.')
        return
      }
    }

    if (isInsufficientBalance) {
      alert('연차가 부족합니다.')
      return
    }

    try {
      isSubmitting = true
      await onSubmit({
        leaveTypeId,
        startDate,
        endDate,
        totalDays: calculatedDays,
        reason: finalReason || '경영지원팀 서류 제출', // 경조사 등은 기본 사유
        halfDayType: selectedLeaveType?.name === '반차' ? halfDayType : undefined,
        quarterDayType: selectedLeaveType?.name === '반반차' ? quarterDayType : undefined,
      })

      // 초기화
      leaveTypeId = ''
      startDate = ''
      endDate = ''
      halfDayType = '10-15'
      quarterDayType = '10-12'
      reasonType = ''
      customReason = ''
    } catch (error) {
      // 에러는 상위에서 처리
    } finally {
      isSubmitting = false
    }
  }

  function handleClose() {
    leaveTypeId = ''
    startDate = ''
    endDate = ''
    halfDayType = '10-15'
    quarterDayType = '10-12'
    reasonType = ''
    customReason = ''
    onClose()
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- 오버레이 -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      onclick={handleClose}
    ></div>

    <!-- 모달 -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative bg-white rounded-lg shadow-xl max-w-md w-full"
        onclick={(e) => e.stopPropagation()}
      >
        <!-- 헤더 -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">연차 신청</h3>
          <button
            type="button"
            onclick={handleClose}
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- 본문 -->
        <form onsubmit={handleSubmit}>
          <div class="px-6 py-4 space-y-4">
            <!-- 연차 잔액 표시 -->
            {#if balance}
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-blue-900">잔여 연차</span>
                  <span class="text-2xl font-bold text-blue-600">
                    {balance.remaining_days}일
                  </span>
                </div>
                <div class="mt-2 text-xs text-blue-700">
                  총 {balance.total_days}일 중 {balance.used_days}일 사용
                </div>
              </div>
            {/if}

            <!-- 연차 타입 선택 -->
            <div>
              <label for="leaveType" class="block text-sm font-medium text-gray-700 mb-2">
                연차 종류 *
              </label>
              <select
                id="leaveType"
                bind:value={leaveTypeId}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택해주세요</option>
                {#each leaveTypes as type}
                  <option value={type.id}>{type.name} - {type.description}</option>
                {/each}
              </select>
            </div>

            <!-- 날짜 선택 -->
            {#if selectedLeaveType?.name === '연차' || selectedLeaveType?.name === '경조사' || selectedLeaveType?.name === '예비군/민방위'}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    bind:value={startDate}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                    종료일 *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    bind:value={endDate}
                    min={startDate}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            {:else if selectedLeaveType}
              <div>
                <label for="singleDate" class="block text-sm font-medium text-gray-700 mb-2">
                  날짜 *
                </label>
                <input
                  type="date"
                  id="singleDate"
                  bind:value={startDate}
                  onchange={() => (endDate = startDate)}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            {/if}

            <!-- 반차 시간대 선택 -->
            {#if selectedLeaveType?.name === '반차'}
              <div>
                <label for="halfDayType" class="block text-sm font-medium text-gray-700 mb-2">
                  시간대 *
                </label>
                <select
                  id="halfDayType"
                  bind:value={halfDayType}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10-15">10:00 - 15:00</option>
                  <option value="15-19">15:00 - 19:00</option>
                </select>
                <div class="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-800">
                    {#if halfDayType === '10-15'}
                      <strong>오전 반차:</strong> 10:00 - 15:00 (오후 3시 출근)
                    {:else}
                      <strong>오후 반차:</strong> 15:00 - 19:00 (오전 정상 출근)
                    {/if}
                  </p>
                </div>
              </div>
            {/if}

            <!-- 반반차 시간대 선택 -->
            {#if selectedLeaveType?.name === '반반차'}
              <div>
                <label for="quarterDayType" class="block text-sm font-medium text-gray-700 mb-2">
                  시간대 *
                </label>
                <select
                  id="quarterDayType"
                  bind:value={quarterDayType}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10-12">10:00 - 12:00</option>
                  <option value="13-15">13:00 - 15:00</option>
                  <option value="15-17">15:00 - 17:00</option>
                  <option value="17-19">17:00 - 19:00</option>
                </select>
                <div class="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-800">
                    {#if quarterDayType === '10-12'}
                      <strong>오전:</strong> 10:00 - 12:00 (점심시간 전)
                    {:else if quarterDayType === '13-15'}
                      <strong>점심 후:</strong> 13:00 - 15:00
                    {:else if quarterDayType === '15-17'}
                      <strong>오후:</strong> 15:00 - 17:00
                    {:else}
                      <strong>저녁:</strong> 17:00 - 19:00
                    {/if}
                  </p>
                </div>
              </div>
            {/if}

            <!-- 사용 일수 표시 -->
            {#if calculatedDays > 0}
              <div
                class="bg-gray-50 border border-gray-200 rounded-lg p-3 {isInsufficientBalance
                  ? 'border-red-300 bg-red-50'
                  : ''}"
              >
                {#if selectedLeaveType?.name === '연차' && totalPeriodDays > calculatedDays}
                  <div class="mb-2 text-xs text-gray-600">
                    전체 기간: {totalPeriodDays}일 (휴일 제외 실제 근무일: {calculatedDays}일)
                  </div>
                {/if}
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">사용 연차</span>
                  <span
                    class="text-lg font-bold {isInsufficientBalance
                      ? 'text-red-600'
                      : 'text-gray-900'}"
                  >
                    {calculatedDays}일
                  </span>
                </div>
                {#if isInsufficientBalance}
                  <p class="mt-1 text-sm text-red-600">연차가 부족합니다.</p>
                {/if}
              </div>
            {/if}

            <!-- 사유 선택 (연차/반차/반반차만 해당) -->
            {#if selectedLeaveType && (selectedLeaveType.name === '연차' || selectedLeaveType.name === '반차' || selectedLeaveType.name === '반반차')}
              <div>
                <label for="reasonType" class="block text-sm font-medium text-gray-700 mb-2">
                  사유 *
                </label>
                <select
                  id="reasonType"
                  bind:value={reasonType}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택해주세요</option>
                  {#each leaveReasons as reason}
                    <option value={reason.value}>{reason.label}</option>
                  {/each}
                </select>
              </div>

              <!-- 기타 사유 직접 입력 -->
              {#if reasonType === '기타'}
                <div>
                  <label for="customReason" class="block text-sm font-medium text-gray-700 mb-2">
                    상세 사유 *
                  </label>
                  <textarea
                    id="customReason"
                    bind:value={customReason}
                    required
                    rows="3"
                    placeholder="사유를 입력해주세요."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
              {/if}
            {/if}

            <!-- 경조사/예비군 등 기타 휴가 안내 -->
            {#if selectedLeaveType && (selectedLeaveType.name === '경조사' || selectedLeaveType.name === '예비군/민방위')}
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-800">
                  <strong>{selectedLeaveType.name}</strong> 신청 후 경영지원팀에 관련 서류를 제출해주세요.
                </p>
              </div>
            {/if}
          </div>

          <!-- 푸터 -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onclick={handleClose}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficientBalance}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
