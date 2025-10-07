<script lang="ts">
  import { goto } from '$app/navigation'
  import type { User } from '$lib/auth/user-service'
  import PayslipViewer from '$lib/components/payslip/PayslipViewer.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { ArrowLeftIcon, FileTextIcon } from '@lucide/svelte'
  import type { PageData } from './$types'

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

  interface FeatureInfo {
    icon: string
    iconColor: string
    title: string
    description: string
  }

  interface EmployeeField {
    label: string
    value: string
  }

  // =============================================
  // State
  // =============================================

  const user: ExtendedUser | null = $state(data.user as ExtendedUser | null)
  let showPayslipViewer = $state(false)

  // =============================================
  // Constants
  // =============================================

  /**
   * Payslip feature information cards
   */
  const PAYSLIP_FEATURES: FeatureInfo[] = [
    {
      icon: '📅',
      iconColor: 'text-blue-500',
      title: '조회 기간',
      description: '지난달부터 최대 12개월까지',
    },
    {
      icon: '🔒',
      iconColor: 'text-green-500',
      title: '보안',
      description: '본인 급여명세서만 조회 가능',
    },
    {
      icon: '📄',
      iconColor: 'text-purple-500',
      title: '다운로드',
      description: 'PDF 형태로 다운로드 가능',
    },
    {
      icon: '🖨️',
      iconColor: 'text-orange-500',
      title: '인쇄',
      description: '브라우저 인쇄 기능 지원',
    },
  ]

  /**
   * Information notes for payslip access
   */
  const ACCESS_NOTES = [
    '지난달부터 최대 12개월까지 조회 가능',
    '급여명세서 인쇄 및 PDF 다운로드 지원',
    '개인정보 보호를 위해 본인 급여명세서만 조회 가능',
  ] as const

  /**
   * Warning messages for non-registered employees
   */
  const WARNING_NOTES = [
    '관리자에게 문의하여 직원 정보를 등록해주세요',
    '직원 정보 등록 후 급여명세서 조회가 가능합니다',
    '급여명세서는 개인정보이므로 본인만 조회할 수 있습니다',
  ] as const

  // =============================================
  // Computed Values
  // =============================================

  /**
   * Check if user has employee info
   */
  const hasEmployeeInfo = $derived(!!user?.employee)

  /**
   * Get user's full name
   */
  const fullName = $derived(() => {
    if (!user?.employee) return ''
    return `${user.employee.first_name} ${user.employee.last_name}`
  })

  /**
   * Get page description based on employee status
   */
  const pageDescription = $derived(() => {
    if (!user?.employee) {
      return '직원 정보가 등록되지 않아 급여명세서를 조회할 수 없습니다.'
    }
    return `${fullName()}님의 급여명세서를 조회할 수 있습니다.`
  })

  /**
   * Employee information fields for display
   */
  const employeeFields = $derived.by((): EmployeeField[] => {
    if (!user?.employee) return []

    return [
      { label: '성명', value: fullName() },
      { label: '사번', value: user.employee.employee_id },
      { label: '부서', value: user.employee.department },
      { label: '직급', value: user.employee.position },
      {
        label: '입사일',
        value: new Date(user.employee.hire_date).toLocaleDateString('ko-KR'),
      },
    ]
  })

  // =============================================
  // Event Handlers
  // =============================================

  function openPayslipViewer(): void {
    showPayslipViewer = true
  }

  function closePayslipViewer(): void {
    showPayslipViewer = false
  }

  function goBack(): void {
    goto('/dashboard')
  }
</script>

<svelte:head>
  <title>급여명세서 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-4xl mx-auto">
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center space-x-4">
        <ThemeButton variant="ghost" onclick={goBack} class="flex items-center space-x-2">
          <ArrowLeftIcon size={20} />
          <span>대시보드로 돌아가기</span>
        </ThemeButton>
      </div>
    </div>

    <!-- Page Title -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">급여명세서</h1>
      <p class="text-gray-600">{pageDescription}</p>
    </header>

    {#if hasEmployeeInfo}
      <!-- Payslip Access Card -->
      <section class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center space-x-4">
          <div class="text-4xl">💳</div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">급여명세서 조회</h2>
            <p class="text-gray-600 mb-4">
              지난달부터 현재까지의 급여명세서를 조회할 수 있습니다. 이번달 급여명세서는 아직
              생성되지 않았습니다.
            </p>
            <ul class="text-sm text-gray-500 space-y-1">
              {#each ACCESS_NOTES as note}
                <li>• {note}</li>
              {/each}
            </ul>
          </div>
          <div>
            <ThemeButton
              variant="primary"
              onclick={openPayslipViewer}
              class="flex items-center space-x-2"
            >
              <FileTextIcon size={20} />
              <span>급여명세서 조회</span>
            </ThemeButton>
          </div>
        </div>
      </section>

      <!-- Information Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Employee Information Card -->
        <section class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">직원 정보</h3>
          <div class="space-y-3">
            {#each employeeFields as field (field.label)}
              <div class="flex justify-between">
                <span class="text-gray-600">{field.label}:</span>
                <span class="font-medium">{field.value}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Payslip Features Card -->
        <section class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">급여명세서 안내</h3>
          <div class="space-y-3 text-sm text-gray-600">
            {#each PAYSLIP_FEATURES as feature (feature.title)}
              <div class="flex items-start space-x-2">
                <span class={feature.iconColor}>{feature.icon}</span>
                <div>
                  <p class="font-medium">{feature.title}</p>
                  <p>{feature.description}</p>
                </div>
              </div>
            {/each}
          </div>
        </section>
      </div>
    {:else}
      <!-- No Employee Info Warning -->
      <section class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class="text-xl font-semibold text-yellow-800 mb-4">급여명세서를 조회할 수 없습니다</h3>
        <p class="text-yellow-700 mb-6">
          직원 정보가 등록되지 않아 급여명세서를 조회할 수 없습니다.
        </p>
        <ul class="text-sm text-yellow-600 space-y-2">
          {#each WARNING_NOTES as note}
            <li>• {note}</li>
          {/each}
        </ul>
        <div class="mt-6">
          <ThemeButton variant="secondary" onclick={goBack}>대시보드로 돌아가기</ThemeButton>
        </div>
      </section>
    {/if}
  </div>
</div>

<!-- Payslip Viewer Modal -->
{#if hasEmployeeInfo && user?.employee}
  <PayslipViewer
    open={showPayslipViewer}
    employeeId={user.employee.id}
    onClose={closePayslipViewer}
  />
{/if}
