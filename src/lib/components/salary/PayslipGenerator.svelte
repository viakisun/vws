<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatCurrency, formatNumber } from '$lib/utils/format'
  import {
    AlertCircleIcon,
    EditIcon,
    PlusIcon,
    PrinterIcon,
    SaveIcon,
    UserIcon,
  } from '@lucide/svelte'

  // Local types for this component
  type Employee = {
    id?: string
    employeeId?: string
    name?: string
    department?: string
    position?: string
    hireDate?: string
  }

  type Allowance = {
    id?: string
    name?: string
    amount?: number
    type?: string
    isTaxable?: boolean
  }

  type Deduction = {
    id?: string
    name?: string
    amount?: number
    rate?: number
    type?: string
    isMandatory?: boolean
  }

  type PayslipData = {
    month?: number
    year?: number
    employeeId?: string
    employeeName?: string
    baseSalary?: number
    allowances?: Allowance[]
    deductions?: Deduction[]
    totalAllowances?: number
    totalDeductions?: number
    netSalary?: number
    status?: string
    label?: string
    hasData?: boolean
    isLocked?: boolean
    isBeforeHire?: boolean
    payslip?: {
      baseSalary?: number
      totalPayments?: number
      totalDeductions?: number
      netSalary?: number
    }
    employeeInfo?: {
      name?: string
    }
    period?: string
    totalPayments?: number
  }

  let { payroll = undefined }: { payroll?: PayslipData } = $props()

  let employeeList = $state<Employee[]>([])
  let selectedEmployeeId = $state('')
  let selectedYear = $state(new Date().getFullYear())
  let payslipData = $state<PayslipData[]>([])
  let isLoadingPayslipData = $state(false)
  let editingMonth = $state<number | null>(null)
  let editingPayslip = $state<PayslipData | null>(null)
  let employeeContract = $state<any>(null)
  let isLoadingContract = $state(false)

  // 급여명세서 데이터 로드 (월별)
  async function loadPayslipData() {
    if (!selectedEmployeeId) {
      payslipData = [] as any
      return
    }

    isLoadingPayslipData = true
    try {
      const response = await fetch(
        `/api/salary/payslips/employee/${selectedEmployeeId}?year=${selectedYear}`,
      )
      const result = await response.json()

      // 현재 날짜 기준으로 허용 가능한 월 계산
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1 // 1-12

      // 선택된 직원의 입사일 확인
      const selectedEmployee = employeeList.find((emp) => emp.id === selectedEmployeeId)
      const hireDate = selectedEmployee?.hireDate ? new Date(selectedEmployee.hireDate) : null
      const hireYear = hireDate ? hireDate.getFullYear() : null
      const hireMonth = hireDate ? hireDate.getMonth() + 1 : null

      if (result.success && result.data) {
        // 월별로 정리
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1
          const period = `${selectedYear}-${String(month).padStart(2, '0')}`

          // API 응답이 배열인지 단일 객체인지 확인
          let payslip = null
          if (Array.isArray(result.data)) {
            payslip = result.data.find((p: any) => p.period === period)
          } else if (result.data.period === period) {
            payslip = result.data
          }

          // 미래 월인지 확인 (다음 달부터만 잠금)
          const isFutureMonth =
            selectedYear > currentYear || (selectedYear === currentYear && month > currentMonth + 1)

          // 입사일 이전 월인지 확인
          const isBeforeHire =
            hireDate &&
            hireYear &&
            hireMonth &&
            (selectedYear < hireYear || (selectedYear === hireYear && month < hireMonth))

          return {
            month,
            period,
            label: `${month}월`,
            payslip: payslip || null,
            hasData: !!payslip,
            isFutureMonth,
            isBeforeHire,
            isLocked: isFutureMonth || isBeforeHire,
          }
        })

        payslipData = monthlyData as any
      } else {
        // 데이터가 없어도 12개월 구조 생성
        payslipData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1
          const isFutureMonth =
            selectedYear > currentYear || (selectedYear === currentYear && month > currentMonth + 1)

          // 입사일 이전 월인지 확인
          const isBeforeHire =
            hireDate &&
            hireYear &&
            hireMonth &&
            (selectedYear < hireYear || (selectedYear === hireYear && month < hireMonth))

          return {
            month,
            period: `${selectedYear}-${String(month).padStart(2, '0')}`,
            label: `${month}월`,
            payslip: null,
            hasData: false,
            isFutureMonth,
            isBeforeHire,
            isLocked: isFutureMonth || isBeforeHire,
          }
        }) as any
      }
    } catch (error) {
      console.error('급여명세서 데이터 로드 실패:', error)
      payslipData = [] as any
      alert('급여명세서 데이터를 불러올 수 없습니다. 데이터베이스 연결을 확인하세요.')
    } finally {
      isLoadingPayslipData = false
    }
  }

  // 직원 목록 로드
  async function loadEmployeeList() {
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      if (result.success) {
        employeeList = result.data.map((emp: any) => ({
          id: emp.id,
          employeeId: emp.employee_id,
          name: `${emp.last_name}${emp.first_name} (${emp.position})`,
          department: emp.department || '부서없음',
          position: emp.position,
          hireDate: emp.hire_date,
        }))
      }
    } catch (error) {
      console.error('직원 목록 로드 실패:', error)
      employeeList = []
      alert('직원 목록을 불러올 수 없습니다. 데이터베이스 연결을 확인하세요.')
    }
  }

  // 직원의 급여 계약 정보 로드 (특정 기간 내 유효한 계약)
  async function loadEmployeeContract(employeeId: string, year?: number, month?: number) {
    if (!employeeId) {
      employeeContract = null
      return
    }

    isLoadingContract = true
    try {
      // 해당 기간에 유효한 계약 정보를 가져오기 위한 API 호출
      const targetDate = year && month ? `${year}-${String(month).padStart(2, '0')}-01` : undefined
      const url = targetDate
        ? `/api/salary/contracts/employee/${employeeId}?date=${targetDate}`
        : `/api/salary/contracts/employee/${employeeId}`

      const response = await fetch(url)
      const result = await response.json()

      console.log('API 응답 전체:', result)
      console.log('API URL:', url)

      if (result.success && result.data?.currentContract) {
        employeeContract = result.data.currentContract
        console.log(`계약 정보 로드 성공 (${targetDate || '현재'}):`, employeeContract)
        console.log('계약 월급:', employeeContract.monthlySalary)
        console.log('계약 연봉:', employeeContract.annualSalary)
        console.log('모든 필드:', Object.keys(employeeContract))
      } else {
        employeeContract = null
        console.log('해당 기간의 계약 정보를 찾을 수 없습니다.')
        console.log('API 응답:', result)
      }
    } catch (error) {
      console.error('계약 정보 로드 실패:', error)
      employeeContract = null
      alert('급여 계약 정보를 불러올 수 없습니다. 데이터베이스 연결을 확인하세요.')
    } finally {
      isLoadingContract = false
    }
  }

  // 계약 정보를 기반으로 기본 급여 항목 생성
  function createDefaultAllowances() {
    const monthlySalary = employeeContract ? employeeContract.monthlySalary || 0 : 0

    return [
      {
        id: 'basic_salary',
        name: '기본급',
        type: 'basic',
        amount: monthlySalary,
        isTaxable: true,
      },
      {
        id: 'position_allowance',
        name: '직책수당',
        type: 'allowance',
        amount: 0,
        isTaxable: true,
      },
      {
        id: 'bonus',
        name: '상여금',
        type: 'bonus',
        amount: 0,
        isTaxable: true,
      },
      {
        id: 'meal_allowance',
        name: '식대',
        type: 'allowance',
        amount: 0,
        isTaxable: false,
      },
      {
        id: 'vehicle_maintenance',
        name: '차량유지',
        type: 'allowance',
        amount: 0,
        isTaxable: false,
      },
      {
        id: 'annual_leave_allowance',
        name: '연차수당',
        type: 'allowance',
        amount: 0,
        isTaxable: true,
      },
      {
        id: 'year_end_settlement',
        name: '연말정산',
        type: 'settlement',
        amount: 0,
        isTaxable: true,
      },
    ]
  }

  // 급여명세서 편집 모드 진입
  async function enterEditMode(month: number, payslip?: any) {
    // 해당 월의 계약 정보를 먼저 로드
    await loadEmployeeContract(selectedEmployeeId, selectedYear, month)

    // 계약 기간 내에 있는지 확인
    if (!isWithinContractPeriod(selectedYear, month)) {
      alert(
        `해당 월(${month}월)은 현재 급여 계약 기간(${employeeContract?.startDate} ~ ${employeeContract?.contractEndDisplay}) 밖에 있습니다.`,
      )
      return
    }

    editingMonth = month
    if (payslip) {
      // 기존 급여명세서 데이터를 편집 가능한 형태로 변환
      const existingAllowances = createDefaultAllowances()

      // 기존 데이터가 있으면 매핑
      if (payslip.baseSalary) {
        const basicSalaryIndex = existingAllowances.findIndex((a) => a.id === 'basic_salary')
        if (basicSalaryIndex !== -1) {
          existingAllowances[basicSalaryIndex].amount = Number(payslip.baseSalary)
        }
      }

      // 기존 payments 배열에서 각 항목을 매핑
      if (payslip.payments && Array.isArray(payslip.payments)) {
        payslip.payments.forEach((payment: any) => {
          const allowanceIndex = existingAllowances.findIndex((a) => a.id === payment.id)
          if (allowanceIndex !== -1) {
            existingAllowances[allowanceIndex].amount = Number(payment.amount || 0)
          }
        })
      }

      editingPayslip = {
        ...payslip,
        allowances: existingAllowances,
        deductions: payslip.deductions || [
          {
            id: 'health_insurance',
            name: '건강보험',
            rate: 0.034,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'long_term_care',
            name: '장기요양보험',
            rate: 0.0034,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'national_pension',
            name: '국민연금',
            rate: 0.045,
            type: 'pension',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'employment_insurance',
            name: '고용보험',
            rate: 0.008,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'income_tax',
            name: '갑근세',
            rate: 0.13,
            type: 'tax',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'local_tax',
            name: '주민세',
            rate: 0.013,
            type: 'tax',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'other',
            name: '기타',
            rate: 0,
            type: 'other',
            amount: 0,
            isMandatory: false,
          },
        ],
      }
    } else {
      // 새 급여명세서 생성
      editingPayslip = {
        period: `${selectedYear}-${String(month).padStart(2, '0')}`,
        allowances: createDefaultAllowances(),
        deductions: [
          {
            id: 'health_insurance',
            name: '건강보험',
            rate: 0.034,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'long_term_care',
            name: '장기요양보험',
            rate: 0.0034,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'national_pension',
            name: '국민연금',
            rate: 0.045,
            type: 'pension',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'employment_insurance',
            name: '고용보험',
            rate: 0.008,
            type: 'insurance',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'income_tax',
            name: '갑근세',
            rate: 0.13,
            type: 'tax',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'local_tax',
            name: '주민세',
            rate: 0.013,
            type: 'tax',
            amount: 0,
            isMandatory: true,
          },
          {
            id: 'other',
            name: '기타',
            rate: 0,
            type: 'other',
            amount: 0,
            isMandatory: false,
          },
        ],
        totalPayments: 0,
        totalDeductions: 0,
        netSalary: 0,
      }
    }
  }

  // 편집 모드 취소
  function cancelEdit() {
    editingMonth = null
    editingPayslip = null
  }

  // 총액 재계산
  function recalculateTotals() {
    if (!editingPayslip) return

    console.log('재계산 전 allowances:', editingPayslip.allowances)

    editingPayslip.totalPayments = (editingPayslip.allowances || []).reduce(
      (sum: number, item) => sum + Number(item.amount || 0),
      0,
    )
    editingPayslip.totalDeductions = (editingPayslip.deductions || []).reduce(
      (sum: number, item) => sum + Number(item.amount || 0),
      0,
    )
    editingPayslip.netSalary = editingPayslip.totalPayments - editingPayslip.totalDeductions

    console.log('재계산 후 totalPayments:', editingPayslip.totalPayments)
  }

  // 급여 총액 검증 (기본급 + 차량유지 + 식대 = 계약 급여)
  function validateSalaryAmount(): {
    isValid: boolean
    coreSalaryTotal: number
    contractSalary: number
    difference: number
  } | null {
    if (!editingPayslip || !employeeContract) {
      console.log('검증 불가: editingPayslip 또는 employeeContract가 없음')
      console.log('editingPayslip:', editingPayslip)
      console.log('employeeContract:', employeeContract)
      return null
    }

    const basicSalary = Number(
      (editingPayslip.allowances || []).find((a) => a.id === 'basic_salary')?.amount || 0,
    )
    const vehicleMaintenance = Number(
      (editingPayslip.allowances || []).find((a) => a.id === 'vehicle_maintenance')?.amount || 0,
    )
    const mealAllowance = Number(
      (editingPayslip.allowances || []).find((a) => a.id === 'meal_allowance')?.amount || 0,
    )

    const coreSalaryTotal = basicSalary + vehicleMaintenance + mealAllowance
    const contractSalary = employeeContract.monthlySalary || 0

    console.log('급여 검증:', {
      basicSalary,
      vehicleMaintenance,
      mealAllowance,
      coreSalaryTotal,
      contractSalary,
      monthlySalaryRaw: employeeContract.monthlySalary,
    })

    // 1천원 단위 오차는 허용
    const tolerance = 1000
    const isValid = Math.abs(coreSalaryTotal - contractSalary) <= tolerance

    return {
      isValid,
      coreSalaryTotal,
      contractSalary,
      difference: coreSalaryTotal - contractSalary,
    }
  }

  // 급여 검증 결과 표시
  function getSalaryValidationMessage() {
    const validation = validateSalaryAmount()
    if (!validation) return null

    if (validation.isValid) {
      return {
        type: 'success',
        message: '✅ 급여 총액이 계약 조건과 일치합니다.',
      }
    } else {
      const diffText = formatNumber(Math.abs(validation.difference), true, '원')

      return {
        type: 'error',
        message: `⚠️ 급여 총액 불일치: 계약 급여(${formatNumber(validation.contractSalary, true, '원')})와 차이 ${diffText}`,
      }
    }
  }

  // 급여명세서 저장
  async function savePayslip() {
    if (!editingPayslip || !editingMonth) return

    try {
      // 총액 재계산
      recalculateTotals()

      // 급여 총액 검증
      const validation = validateSalaryAmount()
      if (validation && !validation.isValid) {
        const confirmSave = confirm(
          `${getSalaryValidationMessage()?.message}\n\n그래도 저장하시겠습니까?`,
        )
        if (!confirmSave) return
      }

      // 기본급 계산 (지급사항에서 기본급 찾기)
      const basicSalary = Number(
        (editingPayslip.allowances || []).find((a) => a.id === 'basic_salary')?.amount || 0,
      )

      // 지급일 설정 (해당 월의 마지막 날)
      const [year, month] = (editingPayslip.period || '').split('-')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const payDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`

      const response = await fetch('/api/salary/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          period: editingPayslip.period,
          payDate: payDate,
          baseSalary: basicSalary,
          totalPayments: editingPayslip.totalPayments,
          totalDeductions: editingPayslip.totalDeductions,
          netSalary: editingPayslip.netSalary,
          payments: editingPayslip.allowances || [],
          deductions: editingPayslip.deductions || [],
          status: 'draft',
          isGenerated: false,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert('급여명세서가 저장되었습니다.')
        cancelEdit()
        loadPayslipData()
      } else {
        alert(`저장에 실패했습니다: ${result.error}`)
      }
    } catch (_error) {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  // 누락된 급여명세서 개수 계산 (잠금된 월 제외)
  function getMissingPayslipCount() {
    return payslipData.filter((month) => !month.hasData && !month.isLocked).length
  }

  // 계약 기간 내 누락된 급여명세서 확인 (잠금된 월 제외)
  function getContractPeriodMissingPayslips() {
    if (!selectedEmployeeId) return []

    const selectedEmployee = employeeList.find((emp) => emp.id === selectedEmployeeId)
    if (!selectedEmployee?.hireDate) return []

    const hireDate = new Date(selectedEmployee.hireDate)
    const currentDate = new Date()
    const missingPeriods: any[] = []

    // 입사일부터 현재까지의 월별 확인
    let current = new Date(hireDate.getFullYear(), hireDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    while (current <= end) {
      const period = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      const monthData = payslipData.find((month) => month.period === period)

      // 잠금되지 않고 데이터가 없는 경우만 누락으로 간주
      if (monthData && !(monthData.hasData ?? false) && !(monthData.isLocked ?? false)) {
        missingPeriods.push({
          period,
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          label: `${current.getFullYear()}년 ${current.getMonth() + 1}월`,
        })
      }

      current.setMonth(current.getMonth() + 1)
    }

    return missingPeriods
  }

  // 특정 월이 계약 기간 내에 있는지 확인
  function isWithinContractPeriod(year: number, month: number) {
    if (!employeeContract) return true // 계약 정보가 없으면 허용

    const contractStartDate = new Date(employeeContract.startDate)
    const contractEndDate = employeeContract.endDate ? new Date(employeeContract.endDate) : null

    const targetDate = new Date(year, month - 1, 1) // month는 1-12이므로 0-11로 변환

    // 계약 시작일 이전이면 false
    if (targetDate < contractStartDate) return false

    // 계약 종료일이 있고 그 이후면 false
    if (contractEndDate && targetDate > contractEndDate) return false

    return true
  }

  $effect(() => {
    void (async () => {
      await loadEmployeeList()
    })()
  })

  // selectedEmployeeId나 selectedYear가 변경될 때마다 급여명세서 데이터 로드
  $effect(() => {
    if (selectedEmployeeId) {
      // 기본적으로 현재 날짜 기준 계약 정보 로드
      loadEmployeeContract(selectedEmployeeId)
      loadPayslipData()
    } else {
      payslipData = [] as any
      employeeContract = null
    }
  })
</script>

{#if !payroll}
  <!-- 급여명세서 월별 관리 -->
  <div class="space-y-6">
    <!-- 직원 선택 및 연도 선택 -->
    <div class="flex items-center space-x-4">
      <div class="flex-1">
        <label for="employee-select" class="block text-sm font-medium text-gray-700 mb-2"
          >직원 선택</label
        >
        <select
          id="employee-select"
          bind:value={selectedEmployeeId}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">직원을 선택하세요</option>
          {#each employeeList as employee, i (i)}
            <option value={employee.id}>{employee.name}</option>
          {/each}
        </select>
      </div>
      <div class="w-32">
        <label for="year-select" class="block text-sm font-medium text-gray-700 mb-2">연도</label>
        <select
          id="year-select"
          bind:value={selectedYear}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i) as year (year)}
            <option value={year}>{year}년</option>
          {/each}
        </select>
      </div>
    </div>

    {#if selectedEmployeeId}
      {@const selectedEmployee = employeeList.find((emp) => emp.id === selectedEmployeeId)}
      {@const missingCount = getMissingPayslipCount()}
      {@const contractMissingPeriods = getContractPeriodMissingPayslips()}

      <!-- 계약 정보 표시 -->
      {#if employeeContract}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-blue-800 mb-2">현재 급여 계약 정보</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-blue-700">월급:</span>
                  <span class="ml-2 font-semibold text-blue-900"
                    >{formatCurrency(employeeContract.monthlySalary || 0)}</span
                  >
                </div>
                <div>
                  <span class="font-medium text-blue-700">연봉:</span>
                  <span class="ml-2 font-semibold text-blue-900"
                    >{formatCurrency(employeeContract.annualSalary || 0)}</span
                  >
                </div>
                <div>
                  <span class="font-medium text-blue-700">계약 시작:</span>
                  <span class="ml-2 text-blue-900">{employeeContract.startDate}</span>
                </div>
                <div>
                  <span class="font-medium text-blue-700">계약 종료:</span>
                  <span class="ml-2 text-blue-900">{employeeContract.contractEndDisplay}</span>
                </div>
              </div>
              <p class="text-blue-600 text-sm mt-2">
                💡 급여 수정 시 기본급은 계약된 월급으로 자동 설정됩니다.
              </p>
              <div class="text-xs text-blue-500 mt-1">
                디버그: monthlySalary = {employeeContract.monthlySalary}
              </div>
            </div>
          </div>
        </div>
      {:else if isLoadingContract}
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            <span class="text-gray-600">계약 정보를 불러오는 중...</span>
          </div>
        </div>
      {:else}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-800 mb-2">❌ 급여 계약 정보 로드 실패</h3>
              <p class="text-red-700 text-sm">해당 직원의 급여 계약 정보를 불러올 수 없습니다.</p>
              <p class="text-red-600 text-xs mt-1">
                데이터베이스 연결을 확인하거나 서버 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- 누락된 급여명세서 안내 -->
      {#if missingCount > 0 || contractMissingPeriods.length > 0}
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div class="flex items-start">
            <AlertCircleIcon size={24} class="text-amber-600 mr-3 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-amber-800 mb-2">급여명세서 작성 필요</h3>
              <p class="text-amber-700 mb-4">
                {selectedEmployee?.name}님의 {selectedYear}년 급여명세서 중
                <strong>{missingCount}개월</strong>이 누락되었습니다.
                {#if contractMissingPeriods.length > 0}
                  <br />계약 기간 내 누락된 급여명세서:
                  <strong>{contractMissingPeriods.length}개월</strong>
                {/if}
              </p>
              <p class="text-amber-600 text-sm">
                아래 표에서 빨간색으로 표시된 월을 클릭하여 급여명세서를 작성해주세요.
                <br />회색으로 표시된 월은 입사일 이전이거나 미래 월로 잠금되어 있습니다.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- 월별 급여명세서 표 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {selectedYear}년 월별 급여명세서
            {#if selectedEmployee}
              - {selectedEmployee.name}
            {/if}
          </h3>
        </div>

        {#if isLoadingPayslipData}
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">로딩 중...</span>
          </div>
        {:else if payslipData.length === 0}
          <div class="text-center py-12 bg-red-50 rounded-lg border border-red-200">
            <h3 class="text-lg font-semibold text-red-800 mb-2">❌ 급여명세서 데이터 로드 실패</h3>
            <p class="text-red-600 mb-2">급여명세서 정보를 불러올 수 없습니다.</p>
            <p class="text-red-500 text-sm">데이터베이스 연결을 확인하세요.</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >월</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >기본급</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >수당</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >지급총액</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >공제총액</th
                  >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >실지급액</th
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
                {#each payslipData as monthData, i (i)}
                  {#if editingMonth === (monthData.month ?? 0)}
                    <!-- 편집 모드 행 -->
                    <tr class="bg-blue-50 border-2 border-blue-200">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                        {monthData.label ?? 'Unknown'} (편집 중)
                      </td>
                      <td colspan="7" class="px-6 py-4">
                        <div class="space-y-4">
                          <!-- 지급사항 편집 -->
                          <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">지급사항</h4>
                            <div class="grid grid-cols-2 gap-2">
                              {#each editingPayslip?.allowances || [] as allowance, index (index)}
                                <div class="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={allowance.name}
                                    oninput={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.allowances?.[index]) {
                                        editingPayslip.allowances[index].name =
                                          e.currentTarget.value
                                      }
                                      recalculateTotals()
                                    }}
                                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={allowance.amount
                                      ? allowance.amount.toLocaleString('ko-KR')
                                      : ''}
                                    oninput={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.allowances?.[index]) {
                                        const value = e.currentTarget.value.replace(/[^0-9]/g, '')
                                        const amount = value === '' ? 0 : Number(value) || 0
                                        console.log(
                                          `입력: ${allowance.name}, 값: ${value}, 변환: ${amount}`,
                                        )
                                        editingPayslip.allowances[index].amount = amount
                                      }
                                      recalculateTotals()
                                    }}
                                    onblur={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.allowances?.[index]) {
                                        const value = e.currentTarget.value.replace(/[^0-9]/g, '')
                                        editingPayslip.allowances[index].amount =
                                          value === '' ? 0 : Number(value) || 0
                                        e.currentTarget.value =
                                          editingPayslip.allowances[index].amount.toLocaleString(
                                            'ko-KR',
                                          )
                                      }
                                    }}
                                    class="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                    placeholder="0"
                                  />
                                </div>
                              {/each}
                            </div>
                          </div>

                          <!-- 공제사항 편집 -->
                          <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">공제사항</h4>
                            <div class="grid grid-cols-2 gap-2">
                              {#each editingPayslip?.deductions || [] as deduction, index (index)}
                                <div class="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={deduction.name}
                                    oninput={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.deductions?.[index]) {
                                        editingPayslip.deductions[index].name =
                                          e.currentTarget.value
                                      }
                                      recalculateTotals()
                                    }}
                                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={deduction.amount
                                      ? deduction.amount.toLocaleString('ko-KR')
                                      : ''}
                                    oninput={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.deductions?.[index]) {
                                        const value = e.currentTarget.value.replace(/[^0-9]/g, '')
                                        // 빈 문자열이거나 숫자가 아닌 경우 0으로 처리
                                        editingPayslip.deductions[index].amount =
                                          value === '' ? 0 : Number(value) || 0
                                      }
                                      recalculateTotals()
                                    }}
                                    onblur={(
                                      e: Event & {
                                        currentTarget: HTMLInputElement
                                      },
                                    ) => {
                                      if (editingPayslip?.deductions?.[index]) {
                                        const value = e.currentTarget.value.replace(/[^0-9]/g, '')
                                        editingPayslip.deductions[index].amount =
                                          value === '' ? 0 : Number(value) || 0
                                        e.currentTarget.value =
                                          editingPayslip.deductions[index].amount.toLocaleString(
                                            'ko-KR',
                                          )
                                      }
                                    }}
                                    class="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                    placeholder="0"
                                  />
                                </div>
                              {/each}
                            </div>
                          </div>

                          <!-- 총액 표시 -->
                          <div class="bg-gray-50 p-3 rounded border">
                            <div class="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span class="font-medium">지급총액:</span>
                                <span class="ml-2 font-semibold text-green-600"
                                  >{formatNumber(
                                    editingPayslip?.totalPayments || 0,
                                    true,
                                    '원',
                                  )}</span
                                >
                              </div>
                              <div>
                                <span class="font-medium">공제총액:</span>
                                <span class="ml-2 font-semibold text-red-600"
                                  >{formatNumber(
                                    editingPayslip?.totalDeductions || 0,
                                    true,
                                    '원',
                                  )}</span
                                >
                              </div>
                              <div>
                                <span class="font-medium">실지급액:</span>
                                <span class="ml-2 font-semibold text-blue-600"
                                  >{formatNumber(editingPayslip?.netSalary || 0, true, '원')}</span
                                >
                              </div>
                            </div>
                          </div>

                          <!-- 급여 검증 메시지 -->
                          {#if employeeContract}
                            {@const validationMessage = getSalaryValidationMessage()}
                            {#if validationMessage}
                              <div
                                class="p-3 rounded border {validationMessage.type === 'success'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-yellow-50 border-yellow-200'}"
                              >
                                <p
                                  class="text-sm {validationMessage.type === 'success'
                                    ? 'text-green-800'
                                    : 'text-yellow-800'}"
                                >
                                  {validationMessage.message}
                                </p>
                                {#if validationMessage.type === 'error'}
                                  {@const validation = validateSalaryAmount()}
                                  <p class="text-xs text-yellow-700 mt-1">
                                    기본급 + 차량유지 + 식대 = {formatNumber(
                                      validation?.coreSalaryTotal || 0,
                                      true,
                                      '원',
                                    )}
                                    (계약 급여: {formatNumber(
                                      validation?.contractSalary || 0,
                                      true,
                                      '원',
                                    )})
                                  </p>
                                {/if}
                              </div>
                            {/if}
                          {/if}

                          <!-- 액션 버튼 -->
                          <div class="flex justify-end space-x-2">
                            <ThemeButton variant="ghost" size="sm" onclick={cancelEdit}>
                              취소
                            </ThemeButton>
                            <ThemeButton
                              size="sm"
                              onclick={savePayslip}
                              class="bg-blue-600 hover:bg-blue-700"
                            >
                              <SaveIcon size={16} class="mr-1" />
                              저장
                            </ThemeButton>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {:else}
                    <!-- 일반 표시 행 -->
                    {@const isOutsideContract = !isWithinContractPeriod(
                      selectedYear,
                      monthData.month || 1,
                    )}
                    <tr
                      class="hover:bg-gray-50"
                      class:bg-gray-100={monthData.isLocked ?? false}
                      class:bg-red-50={!(monthData.hasData ?? false) &&
                        !(monthData.isLocked ?? false)}
                      class:bg-orange-50={isOutsideContract && !(monthData.isLocked ?? false)}
                    >
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium {(monthData.isLocked ??
                        false)
                          ? 'text-gray-400'
                          : 'text-gray-900'}"
                      >
                        {monthData.label ?? 'Unknown'}
                        {#if monthData.isLocked ?? false}
                          <span class="ml-2 text-xs text-gray-500">
                            {(monthData.isBeforeHire ?? false) ? '(입사전)' : '(잠금)'}
                          </span>
                        {:else if isOutsideContract}
                          <span class="ml-2 text-xs text-orange-600"> (계약기간외) </span>
                        {/if}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {(monthData.isLocked ?? false)
                          ? 'text-gray-400'
                          : 'text-gray-500'}"
                      >
                        {(monthData.hasData ?? false)
                          ? formatCurrency(monthData.payslip?.baseSalary ?? 0)
                          : (monthData.isLocked ?? false)
                            ? '잠금'
                            : '-'}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {(monthData.isLocked ?? false)
                          ? 'text-gray-400'
                          : 'text-gray-500'}"
                      >
                        {(monthData.hasData ?? false)
                          ? formatCurrency(
                              (monthData.payslip?.totalPayments ?? 0) -
                                (monthData.payslip?.baseSalary ?? 0),
                            )
                          : (monthData.isLocked ?? false)
                            ? '잠금'
                            : '-'}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {(monthData.isLocked ?? false)
                          ? 'text-gray-400'
                          : 'text-gray-500'}"
                      >
                        {(monthData.hasData ?? false)
                          ? formatNumber(monthData.payslip?.totalPayments ?? 0, true, '원')
                          : (monthData.isLocked ?? false)
                            ? '잠금'
                            : '-'}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {(monthData.isLocked ?? false)
                          ? 'text-gray-400'
                          : 'text-gray-500'}"
                      >
                        {(monthData.hasData ?? false)
                          ? formatCurrency(monthData.payslip?.totalDeductions || 0)
                          : (monthData.isLocked ?? false)
                            ? '잠금'
                            : '-'}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium {(monthData.isLocked ??
                        false)
                          ? 'text-gray-400'
                          : 'text-gray-900'}"
                      >
                        {(monthData.hasData ?? false)
                          ? formatCurrency(monthData.payslip?.netSalary || 0)
                          : (monthData.isLocked ?? false)
                            ? '잠금'
                            : '-'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {#if monthData.isLocked ?? false}
                          <span
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600"
                          >
                            {monthData.isBeforeHire ? '입사전' : '잠금'}
                          </span>
                        {:else if isOutsideContract}
                          <span
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800"
                          >
                            계약기간외
                          </span>
                        {:else if monthData.hasData ?? false}
                          <span
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                          >
                            완료
                          </span>
                        {:else}
                          <span
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                          >
                            미작성
                          </span>
                        {/if}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {#if monthData.isLocked ?? false}
                          <span class="text-gray-400 text-sm">
                            {monthData.isBeforeHire ? '입사전' : '잠금됨'}
                          </span>
                        {:else if isOutsideContract}
                          <span class="text-orange-600 text-sm"> 계약기간외 </span>
                        {:else if monthData.hasData ?? false}
                          <ThemeButton
                            variant="ghost"
                            size="sm"
                            onclick={() =>
                              enterEditMode(monthData.month || 1, monthData.payslip || undefined)}
                          >
                            <EditIcon size={16} class="mr-1" />
                            편집
                          </ThemeButton>
                        {:else}
                          <ThemeButton
                            variant="ghost"
                            size="sm"
                            onclick={() => enterEditMode(monthData.month || 1)}
                            class="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <PlusIcon size={16} class="mr-1" />
                            작성
                          </ThemeButton>
                        {/if}
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {:else if employeeList.length === 0}
      <div class="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <UserIcon size={48} class="mx-auto text-red-400 mb-4" />
        <h3 class="text-lg font-semibold text-red-800 mb-2">❌ 데이터베이스 연결 실패</h3>
        <p class="text-red-600 mb-2">직원 목록을 불러올 수 없습니다.</p>
        <p class="text-red-500 text-sm">서버 관리자에게 문의하세요.</p>
      </div>
    {:else}
      <div class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <UserIcon size={48} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500">급여명세서를 조회하려면 직원을 선택해주세요.</p>
      </div>
    {/if}
  </div>
{:else}
  <!-- payroll prop이 있는 경우 (급여 이력에서 클릭한 경우) -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">급여명세서</h3>
        <p class="text-sm text-gray-500">
          {payroll.employeeInfo?.name || payroll.employeeName} - {payroll.period}
        </p>
      </div>
      <ThemeButton onclick={() => window.print()}>
        <PrinterIcon size={16} class="mr-1" />
        출력
      </ThemeButton>
    </div>
  </div>
{/if}
