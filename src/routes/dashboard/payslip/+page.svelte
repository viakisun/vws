<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import type { User } from '$lib/auth/user-service'
  import PayslipPDFModal from '$lib/components/payslip/PayslipPDFModal.svelte'
  import { ArrowLeftIcon, FileTextIcon } from '@lucide/svelte'
  import { formatKoreanName } from '$lib/utils/format'
  import type { PageData } from './$types'
  import type { PayslipPDFData } from '$lib/types/payslip'

  const { data }: { data: PageData } = $props()

  // =============================================
  // Types
  // =============================================

  interface EmployeeInfo {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    department: string
    position: string
    hire_date: string
  }

  interface ExtendedUser extends User {
    employee?: EmployeeInfo
  }

  interface PayslipSummary {
    id: string
    period: string
    year: number
    month: number
    net_pay: number
    total_payments: number
    total_deductions: number
    payments?: Array<{ name: string; amount: number }>
    deductions?: Array<{ name: string; amount: number }>
  }

  // =============================================
  // State
  // =============================================

  const user: ExtendedUser | null = $state(data.user as ExtendedUser | null)
  let payslips = $state<PayslipSummary[]>([])
  let loading = $state(false)
  let selectedPayslip = $state<PayslipPDFData | null>(null)

  // =============================================
  // Computed Values
  // =============================================

  const hasEmployeeInfo = $derived(!!user?.employee)

  const displayName = $derived.by(() => {
    if (user?.employee?.last_name && user?.employee?.first_name) {
      return formatKoreanName(user.employee.last_name, user.employee.first_name)
    }
    return user?.name || '사용자'
  })

  // =============================================
  // Functions
  // =============================================

  async function loadPayslips() {
    if (!user?.employee?.id) return

    loading = true
    try {
      const response = await fetch(`/api/dashboard/payslip?employeeId=${user.employee.id}`)
      const result = await response.json()

      if (result.success) {
        payslips = result.data
      }
    } catch (error) {
      console.error('Error loading payslips:', error)
    } finally {
      loading = false
    }
  }

  function openPayslipPDF(payslip: PayslipSummary) {
    if (!user?.employee) return

    // PayslipPDFData 형식으로 변환
    const pdfData: PayslipPDFData = {
      employeeName: displayName,
      employeeId: user.employee.employee_id,
      department: user.employee.department,
      position: user.employee.position,
      year: payslip.year,
      month: payslip.month,
      payments: payslip.payments || [],
      deductions: payslip.deductions || [],
      totalPayments: payslip.total_payments,
      totalDeductions: payslip.total_deductions,
      netSalary: payslip.net_pay,
      companyName: '(주)비아',
    }

    selectedPayslip = pdfData
  }

  function closePDFModal() {
    selectedPayslip = null
  }

  function goBack() {
    goto('/dashboard')
  }

  function formatCurrency(amount: number): string {
    return Math.floor(amount).toLocaleString('ko-KR') + '원'
  }

  // =============================================
  // Lifecycle
  // =============================================

  onMount(() => {
    if (hasEmployeeInfo) {
      loadPayslips()
    }
  })
</script>

<svelte:head>
  <title>급여명세서 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={goBack}
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon size={20} />
          <span>대시보드</span>
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-900">급여명세서</h1>
      </div>
    </div>

    {#if !hasEmployeeInfo}
      <!-- No Employee Info Warning -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div class="flex items-center gap-3">
          <div class="text-4xl">⚠️</div>
          <div>
            <h3 class="text-lg font-semibold text-yellow-800 mb-1">
              급여명세서를 조회할 수 없습니다
            </h3>
            <p class="text-yellow-700">
              직원 정보가 등록되지 않아 급여명세서를 조회할 수 없습니다. 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    {:else if loading}
      <!-- Loading -->
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if payslips.length === 0}
      <!-- No Payslips -->
      <div class="bg-white rounded-lg shadow p-8 text-center">
        <div class="text-6xl mb-4">📄</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">발급된 급여명세서가 없습니다</h3>
        <p class="text-gray-600">
          아직 급여명세서가 생성되지 않았습니다. 급여 지급 후 확인해주세요.
        </p>
      </div>
    {:else}
      <!-- Payslips Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each payslips as payslip (payslip.id)}
          <button
            type="button"
            onclick={() => openPayslipPDF(payslip)}
            class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 text-left group"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">급여 기간</div>
                <div class="text-xl font-bold text-gray-900">
                  {payslip.year}년 {payslip.month}월
                </div>
              </div>
              <div
                class="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"
              >
                <FileTextIcon size={24} class="text-blue-600" />
              </div>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">총 지급액</span>
                <span class="font-medium text-gray-900"
                  >{formatCurrency(payslip.total_payments)}</span
                >
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">총 공제액</span>
                <span class="font-medium text-red-600"
                  >-{formatCurrency(payslip.total_deductions)}</span
                >
              </div>
            </div>

            <div
              class="pt-3 border-t border-gray-200 flex justify-between items-center"
            >
              <span class="text-sm font-medium text-gray-700">실지급액</span>
              <span class="text-lg font-bold text-blue-600"
                >{formatCurrency(payslip.net_pay)}</span
              >
            </div>

            <div class="mt-4 text-xs text-gray-400 text-center">
              클릭하여 상세 보기 및 출력
            </div>
          </button>
        {/each}
      </div>

      <!-- Info Note -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex gap-2">
          <div class="text-blue-600 mt-0.5">ℹ️</div>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">급여명세서 안내</p>
            <ul class="space-y-1 text-blue-700">
              <li>• 급여명세서를 클릭하면 상세 내역을 확인할 수 있습니다</li>
              <li>• PDF로 저장하거나 인쇄할 수 있습니다</li>
              <li>• 개인정보 보호를 위해 본인의 급여명세서만 조회 가능합니다</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- PDF Modal -->
{#if selectedPayslip}
  <PayslipPDFModal payslip={selectedPayslip} onClose={closePDFModal} />
{/if}
