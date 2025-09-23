<script lang="ts">
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import { payslips, isLoading, error, loadPayslips } from '$lib/stores/salary/salary-store'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    FilterIcon,
    CalendarIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    MinusIcon,
    UserIcon,
    ClockIcon
  } from '@lucide/svelte'

  let mounted = $state(false)
  let showFilters = $state(false)
  let selectedEmployee = $state('')
  let selectedDepartment = $state('')
  let selectedContractType = $state('')
  let selectedStatus = $state('')

  // 직원 목록
  let employees = $state<any[]>([])

  // 월별 옵션 동적 생성 (최근 12개월)
  function generateMonthOptions() {
    const options = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const period = `${year}-${month}`
      const label = `${year}년 ${month}월`
      options.push({ value: period, label })
    }

    return options
  }

  const monthOptions = generateMonthOptions()

  $effect(async () => {
    if (!mounted) {
      mounted = true
      await loadPayslips() // 모든 급여명세서 데이터 로드
      await loadEmployees()
    }
  })

  // 직원 목록 로드
  async function loadEmployees() {
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      if (result.success) {
        employees = [
          { id: '', name: '전체 직원', department: '' },
          ...result.data.map((emp: any) => ({
            id: emp.id,
            name: `${emp.last_name}${emp.first_name} (${emp.position})`,
            department: emp.department || '부서없음',
            position: emp.position
          }))
        ]
      }
    } catch (error) {}
  }

  // 필터링된 급여명세서 데이터 목록 (로컬 필터)
  const localFilteredPayslips = $derived(() => {
    let filtered = $payslips

    // 직원 필터
    if (selectedEmployee) {
      filtered = filtered.filter(payroll => payroll.employeeId === selectedEmployee)
    }

    // 부서 필터
    if (selectedDepartment) {
      filtered = filtered.filter(payroll => payroll.department === selectedDepartment)
    }

    // 상태 필터
    if (selectedStatus) {
      filtered = filtered.filter(payroll => payroll.status === selectedStatus)
    }

    return filtered
  })

  // 직원별 급여 이력 그룹화
  const salaryHistoryByEmployee = $derived(() => {
    const historyMap: Record<string, any[]> = {}

    localFilteredPayslips.forEach(payslip => {
      if (!historyMap[payslip.employeeId]) {
        historyMap[payslip.employeeId] = []
      }
      historyMap[payslip.employeeId].push(payslip)
    })

    // 각 직원별로 급여를 지급일 기준으로 정렬 (최신순)
    Object.keys(historyMap).forEach(employeeId => {
      historyMap[employeeId].sort(
        (a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
      )
    })

    return historyMap
  })

  // 선택된 직원의 급여 이력
  const selectedEmployeeHistory = $derived(() => {
    if (!selectedEmployee) {
      // 직원이 선택되지 않았으면 모든 급여 이력을 평면화하여 반환
      const result = localFilteredPayrolls.sort(
        (a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime()
      )
      return result
    }
    const result = salaryHistoryByEmployee[selectedEmployee] || []
    return result
  })

  // 필터 초기화
  function clearFilters() {
    selectedEmployee = ''
    selectedDepartment = ''
    selectedContractType = ''
    selectedStatus = ''
  }

  // 급여 변화 계산
  function calculateSalaryChange(
    payslips: any[],
    index: number
  ): { change: number; percentage: number; direction: 'up' | 'down' | 'same' } {
    if (index === 0) {
      return { change: 0, percentage: 0, direction: 'same' }
    }

    const currentSalary = parseFloat(String(payslips[index].netSalary))
    const previousSalary = parseFloat(String(payslips[index - 1].netSalary))
    const change = currentSalary - previousSalary
    const percentage = previousSalary > 0 ? (change / previousSalary) * 100 : 0

    return {
      change,
      percentage: Math.abs(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    }
  }

  // 상태별 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case 'calculated':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'paid':
        return 'bg-emerald-100 text-emerald-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 상태 표시명
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'calculated':
        return '계산완료'
      case 'approved':
        return '승인완료'
      case 'paid':
        return '지급완료'
      case 'pending':
        return '대기중'
      case 'error':
        return '오류'
      default:
        return status
    }
  }

  // 직원 선택
  function selectEmployee(employeeId: string) {
    selectedEmployee = employeeId
  }

  // 필터 적용
  function applyFilter() {
  // 필터가 변경되면 자동으로 반영됨 (reactive)
  }
</script>

<div class="space-y-6">
  <!-- 헤더 및 필터 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <ThemeSectionHeader title="급여 이력 추적" />
      <div class="flex items-center space-x-3">
        <ThemeButton
          variant="outline"
          size="sm"
          onclick={() => (showFilters = !showFilters)}>
          <FilterIcon
            size={16}
            class="mr-2" />
          필터
        </ThemeButton>
      </div>
    </div>

    <!-- 직원 선택 -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">직원 선택</label>
      <div class="flex flex-wrap gap-2">
        {#each employees as employee, i (i)}
          <button type="button"
            onclick={() => selectEmployee(employee.id)}
            class="px-4 py-2 rounded-lg border transition-colors {selectedEmployee === employee.id
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
          >
            {employee.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- 필터 영역 -->
    {#if showFilters}
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
      >
        <div>
          <label
            for="history-department"
            class="block text-sm font-medium text-gray-700 mb-1"
          >부서</label
          >
          <select
            id="history-department"
            bind:value={selectedDepartment}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="대표">대표</option>
            <option value="연구소">연구소</option>
            <option value="전략기획실">전략기획실</option>
            <option value="경영기획팀">경영기획팀</option>
            <option value="GRIT팀">GRIT팀</option>
            <option value="PSR팀">PSR팀</option>
            <option value="개발팀">개발팀</option>
            <option value="경영지원팀">경영지원팀</option>
            <option value="부서없음">부서없음</option>
          </select>
        </div>
        <div>
          <label
            for="history-period"
            class="block text-sm font-medium text-gray-700 mb-1"
          >급여 기간</label
          >
          <select
            id="history-period"
            bind:value={selectedContractType}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {#each monthOptions as option, i (i)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label
            for="history-status"
            class="block text-sm font-medium text-gray-700 mb-1"
          >상태</label
          >
          <select
            id="history-status"
            bind:value={selectedStatus}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="calculated">계산완료</option>
            <option value="approved">승인완료</option>
            <option value="paid">지급완료</option>
            <option value="pending">대기중</option>
          </select>
        </div>
        <div class="flex items-end space-x-2">
          <ThemeButton
            variant="outline"
            size="sm"
            onclick={clearFilters}>초기화</ThemeButton>
        </div>
      </div>
    {/if}
  </ThemeCard>

  <!-- 급여 이력 목록 -->
  {#if $isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">로딩 중...</span>
    </div>
  {:else if $error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <span class="text-red-800">{$error}</span>
    </div>
  {:else if selectedEmployeeHistory.length === 0}
    <div class="text-center py-12">
      <ClockIcon
        size={48}
        class="mx-auto text-gray-400 mb-4" />
      <p class="text-gray-500">
        {selectedEmployee ? '선택한 직원의 급여 이력이 없습니다.' : '급여 이력이 없습니다.'}
      </p>
    </div>
  {:else}
    <!-- 선택된 직원의 급여 이력 -->
    {#each selectedEmployeeHistory as payroll, index, i (i)}
      <ThemeCard class="p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-4 mb-4">
              <div class="flex items-center space-x-2">
                <CalendarIcon
                  size={20}
                  class="text-gray-400" />
                <span class="text-lg font-semibold text-gray-900">
                  {formatDate(payroll.payDate)} 지급분
                </span>
              </div>
              {#if !selectedEmployee}
                <div class="flex items-center space-x-2">
                  <UserIcon
                    size={16}
                    class="text-gray-400" />
                  <span class="text-sm text-gray-600"
                  >{payroll.employeeName} ({payroll.department})</span
                  >
                </div>
              {/if}
              <ThemeBadge class={getStatusColor(payroll.status)}>
                {getStatusLabel(payroll.status)}
              </ThemeBadge>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="space-y-2">
                <div class="text-sm text-gray-500">기본급</div>
                <div class="text-xl font-bold text-gray-900">
                  {formatCurrency(payroll.baseSalary)}
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-gray-500">총 지급액</div>
                <div class="text-xl font-semibold text-gray-900">
                  {formatCurrency(payroll.grossSalary)}
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-gray-500">총 공제액</div>
                <div class="text-lg font-semibold text-red-600">
                  {formatCurrency(payroll.totalDeductions)}
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-gray-500">실지급액</div>
                <div class="text-2xl font-bold text-green-600">
                  {formatCurrency(payroll.netSalary)}
                </div>
              </div>
            </div>

            <!-- 급여 변화 표시 -->
            {#if index > 0}
              {@const change = calculateSalaryChange(selectedEmployeeHistory, index)}
              <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-500 mb-2">이전 급여 대비 변화</div>
                <div class="flex items-center space-x-2">
                  {#if change.direction === 'up'}
                    <TrendingUpIcon
                      size={20}
                      class="text-green-500" />
                    <span class="text-green-600 font-semibold">
                      +{formatCurrency(change.change)} (+{change.percentage.toFixed(1)}%)
                    </span>
                  {:else if change.direction === 'down'}
                    <TrendingDownIcon
                      size={20}
                      class="text-red-500" />
                    <span class="text-red-600 font-semibold">
                      -{formatCurrency(Math.abs(change.change))} (-{change.percentage.toFixed(1)}%)
                    </span>
                  {:else}
                    <MinusIcon
                      size={20}
                      class="text-gray-500" />
                    <span class="text-gray-500 font-semibold">변화 없음</span>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </ThemeCard>
    {/each}

    <!-- 급여 변화 요약 -->
    {#if selectedEmployeeHistory.length > 1}
      {@const firstContract = selectedEmployeeHistory[0]}
      {@const lastContract = selectedEmployeeHistory[selectedEmployeeHistory.length - 1]}
      {@const totalChange = lastContract.annualSalary - firstContract.annualSalary}
      {@const totalPercentage =
        firstContract.annualSalary > 0 ? (totalChange / firstContract.annualSalary) * 100 : 0}
      <ThemeCard class="p-6">
        <ThemeSectionHeader title="급여 변화 요약" />
        <div class="mt-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600">첫 계약 연봉</div>
              <div class="text-xl font-bold text-gray-900">
                {formatCurrency(firstContract.annualSalary)}
              </div>
              <div class="text-xs text-gray-500">{formatDate(firstContract.startDate)}</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600">현재 연봉</div>
              <div class="text-xl font-bold text-gray-900">
                {formatCurrency(lastContract.annualSalary)}
              </div>
              <div class="text-xs text-gray-500">{formatDate(lastContract.startDate)}</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600">총 변화</div>
              <div class="flex items-center justify-center space-x-1">
                {#if totalChange > 0}
                  <TrendingUpIcon
                    size={20}
                    class="text-green-500" />
                  <span class="text-xl font-bold text-green-600">
                    +{formatCurrency(totalChange)}
                  </span>
                {:else if totalChange < 0}
                  <TrendingDownIcon
                    size={20}
                    class="text-red-500" />
                  <span class="text-xl font-bold text-red-600">
                    -{formatCurrency(Math.abs(totalChange))}
                  </span>
                {:else}
                  <MinusIcon
                    size={20}
                    class="text-gray-500" />
                  <span class="text-xl font-bold text-gray-500">변화 없음</span>
                {/if}
              </div>
              <div class="text-xs text-gray-500">
                {totalChange > 0 ? '+' : ''}{totalPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </ThemeCard>
    {/if}
  {/if}
</div>
