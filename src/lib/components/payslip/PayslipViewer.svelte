<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  interface PayslipData {
    id: string
    employee_id: string
    employee_name: string
    department: string
    position: string
    period: string
    year: number
    month: number
    basic_salary: number
    overtime_pay: number
    bonus: number
    allowances: number
    gross_pay: number
    income_tax: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    long_term_care_insurance: number
    total_deductions: number
    net_pay: number
    working_days: number
    overtime_hours: number
    created_at: string
  }

  interface MonthOption {
    year: number
    month: number
    label: string
    value: string
  }

  interface Props {
    open: boolean
    employeeId?: string
    onClose: () => void
  }

  let { open, employeeId, onClose }: Props = $props()

  // State
  let payslips = $state<PayslipData[]>([])
  let selectedPayslip = $state<PayslipData | null>(null)
  let loading = $state(false)
  let error = $state<string | null>(null)

  // Constants
  const MAX_MONTHS_TO_SHOW = 12
  const ERROR_MESSAGES = {
    FETCH_FAILED: '급여명세서를 불러오는데 실패했습니다.',
    FETCH_ERROR: '급여명세서를 불러오는 중 오류가 발생했습니다.',
    DOWNLOAD_FAILED: '급여명세서 다운로드에 실패했습니다.',
  } as const

  // =============================================
  // Computed Values
  // =============================================

  /**
   * Generate list of available months (last month to 12 months ago)
   */
  let availableMonths = $derived.by(() => {
    const months: MonthOption[] = []
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth() // 0-based month

    // Start from last month
    if (month === 0) {
      year -= 1
      month = 11
    } else {
      month -= 1
    }

    for (let i = 0; i < MAX_MONTHS_TO_SHOW; i++) {
      const monthNumber = month + 1 // Convert to 1-based
      months.push({
        year,
        month: monthNumber,
        label: `${year}년 ${monthNumber}월`,
        value: `${year}-${monthNumber.toString().padStart(2, '0')}`,
      })

      month -= 1
      if (month < 0) {
        year -= 1
        month = 11
      }
    }

    return months
  })

  let selectedMonth = $state('')

  // Initialize selected month when available months change
  $effect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      selectedMonth = availableMonths[0].value
    }
  })

  /**
   * Find payslip for selected month
   */
  let currentPayslip = $derived.by(() => {
    if (!selectedMonth || payslips.length === 0) return null

    const [yearStr, monthStr] = selectedMonth.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    return payslips.find((p) => p.year === year && p.month === month) || null
  })

  /**
   * Parse selected month for display
   */
  let selectedMonthDisplay = $derived.by(() => {
    if (!selectedMonth) return '선택된 월'
    const [year, month] = selectedMonth.split('-')
    return `${year}년 ${month}월`
  })

  // =============================================
  // API Functions
  // =============================================
  // =============================================
  // API Functions
  // =============================================

  /**
   * Fetch payslips for the employee
   */
  async function fetchPayslips() {
    if (!employeeId) return

    loading = true
    error = null

    try {
      const response = await fetch(`/api/dashboard/payslip?employeeId=${employeeId}`)
      const result = await response.json()

      if (result.success) {
        payslips = result.data || []
        logger.log('Payslips loaded:', payslips.length)
      } else {
        error = result.error || ERROR_MESSAGES.FETCH_FAILED
      }
    } catch (err) {
      logger.error('Error fetching payslips:', err)
      error = ERROR_MESSAGES.FETCH_ERROR
    } finally {
      loading = false
    }
  }

  /**
   * Download payslip as PDF
   */
  async function downloadPayslip() {
    if (!currentPayslip) return

    try {
      const response = await fetch(`/api/dashboard/payslip/${currentPayslip.id}/download`)
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const filename = generatePayslipFilename(currentPayslip)

      downloadFile(url, filename)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      logger.error('Error downloading payslip:', err)
      alert(ERROR_MESSAGES.DOWNLOAD_FAILED)
    }
  }

  // =============================================
  // Helper Functions
  // =============================================

  /**
   * Generate filename for payslip download
   */
  function generatePayslipFilename(payslip: PayslipData): string {
    return `급여명세서_${payslip.employee_name}_${payslip.year}년${payslip.month}월.pdf`
  }

  /**
   * Trigger file download
   */
  function downloadFile(url: string, filename: string): void {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  /**
   * Print current payslip
   */
  function printPayslip(): void {
    if (!currentPayslip) return
    window.print()
  }

  // =============================================
  // Lifecycle
  // =============================================

  onMount(() => {
    if (open && employeeId) {
      fetchPayslips()
    }
  })

  // Refresh data when modal opens
  $effect(() => {
    if (open && employeeId) {
      fetchPayslips()
    }
  })
</script>

<ThemeModal {open}>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">급여명세서</h2>
      <ThemeButton variant="ghost" onclick={onClose}>✕</ThemeButton>
    </div>

    {#if loading}
      <!-- Loading State -->
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">급여명세서를 불러오는 중...</span>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{error}</p>
      </div>
    {:else}
      <!-- Month Selector -->
      <div class="mb-6">
        <label for="month-select" class="block text-sm font-medium text-gray-700 mb-2">
          조회할 월을 선택하세요
        </label>
        <select
          id="month-select"
          bind:value={selectedMonth}
          class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {#each availableMonths as monthOption (monthOption.value)}
            <option value={monthOption.value}>{monthOption.label}</option>
          {/each}
        </select>
      </div>

      {#if currentPayslip}
        <!-- Payslip Detail -->
        <div
          class="bg-white border border-gray-200 rounded-lg p-6 print:border-none print:shadow-none"
        >
          <!-- Header -->
          <div class="text-center mb-8 print:mb-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">급여명세서</h1>
            <p class="text-gray-600">{currentPayslip.year}년 {currentPayslip.month}월</p>
          </div>

          <!-- Employee and Work Information -->
          <div class="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            <!-- Employee Info -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">직원 정보</h3>
              <div class="space-y-2">
                {#each [{ label: '성명', value: currentPayslip.employee_name }, { label: '사번', value: currentPayslip.employee_id }, { label: '부서', value: currentPayslip.department }, { label: '직급', value: currentPayslip.position }] as item}
                  <div class="flex justify-between">
                    <span class="text-gray-600">{item.label}:</span>
                    <span class="font-medium">{item.value}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Work Info -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">근무 정보</h3>
              <div class="space-y-2">
                {#each [{ label: '근무일수', value: `${currentPayslip.working_days}일` }, { label: '연장근무', value: `${currentPayslip.overtime_hours}시간` }, { label: '급여지급일', value: formatDate(currentPayslip.created_at) }] as item}
                  <div class="flex justify-between">
                    <span class="text-gray-600">{item.label}:</span>
                    <span class="font-medium">{item.value}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            <!-- Payments -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">지급 내역</h3>
              <div class="space-y-2">
                {#each [{ label: '기본급', value: currentPayslip.basic_salary }, { label: '연장근무수당', value: currentPayslip.overtime_pay }, { label: '상여금', value: currentPayslip.bonus }, { label: '제수당', value: currentPayslip.allowances }] as item}
                  <div class="flex justify-between">
                    <span class="text-gray-600">{item.label}:</span>
                    <span class="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                {/each}
                <div class="border-t pt-2 mt-2">
                  <div class="flex justify-between font-semibold text-lg">
                    <span>지급총액:</span>
                    <span>{formatCurrency(currentPayslip.gross_pay)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deductions -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">공제 내역</h3>
              <div class="space-y-2">
                {#each [{ label: '소득세', value: currentPayslip.income_tax }, { label: '국민연금', value: currentPayslip.national_pension }, { label: '건강보험', value: currentPayslip.health_insurance }, { label: '고용보험', value: currentPayslip.employment_insurance }, { label: '장기요양보험', value: currentPayslip.long_term_care_insurance }] as item}
                  <div class="flex justify-between">
                    <span class="text-gray-600">{item.label}:</span>
                    <span class="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                {/each}
                <div class="border-t pt-2 mt-2">
                  <div class="flex justify-between font-semibold text-lg">
                    <span>공제총액:</span>
                    <span>{formatCurrency(currentPayslip.total_deductions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Net Pay -->
          <div
            class="bg-blue-50 border border-blue-200 rounded-lg p-4 print:bg-gray-50 print:border-gray-300"
          >
            <div class="flex justify-between items-center">
              <span class="text-xl font-semibold text-blue-900 print:text-gray-900">실지급액:</span>
              <span class="text-2xl font-bold text-blue-900 print:text-gray-900">
                {formatCurrency(currentPayslip.net_pay)}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center space-x-4 mt-8 print:hidden">
            <ThemeButton variant="secondary" onclick={printPayslip}>🖨️ 인쇄</ThemeButton>
            <ThemeButton variant="primary" onclick={downloadPayslip}>📄 PDF 다운로드</ThemeButton>
          </div>
        </div>
      {:else}
        <!-- No Payslip Found -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div class="text-4xl mb-4">📄</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {selectedMonthDisplay}의 급여명세서가 없습니다
          </h3>
          <p class="text-gray-600">
            해당 월의 급여명세서가 아직 생성되지 않았거나 조회 권한이 없습니다.
          </p>
        </div>
      {/if}
    {/if}
  </div>
</ThemeModal>

<style>
  @media print {
    .print\:hidden {
      display: none !important;
    }

    .print\:border-none {
      border: none !important;
    }

    .print\:shadow-none {
      box-shadow: none !important;
    }

    .print\:mb-6 {
      margin-bottom: 1.5rem !important;
    }

    .print\:bg-gray-50 {
      background-color: #f9fafb !important;
    }

    .print\:border-gray-300 {
      border-color: #d1d5db !important;
    }

    .print\:text-gray-900 {
      color: #111827 !important;
    }
  }
</style>
