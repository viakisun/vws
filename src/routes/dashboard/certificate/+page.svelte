<script lang="ts">
  import { goto } from '$app/navigation'
  import type { User } from '$lib/auth/user-service'
  import CertificatePDFModal from '$lib/components/certificate/CertificatePDFModal.svelte'
  import { ArrowLeftIcon, FileTextIcon } from '@lucide/svelte'
  import { formatKoreanName } from '$lib/utils/format'
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

  interface CertificateData {
    employeeName: string
    employeeId: string
    department: string
    position: string
    hireDate: string
    purpose: string
    companyName: string
  }

  // =============================================
  // State
  // =============================================

  const user: ExtendedUser | null = $state(data.user as ExtendedUser | null)
  let selectedCertificate = $state<CertificateData | null>(null)
  let purpose = $state('')

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

  const formattedHireDate = $derived.by(() => {
    if (!user?.employee?.hire_date) return ''
    return new Date(user.employee.hire_date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  // =============================================
  // Functions
  // =============================================

  function openCertificatePDF(purposeText: string) {
    if (!user?.employee) return

    const certData: CertificateData = {
      employeeName: displayName,
      employeeId: user.employee.employee_id,
      department: user.employee.department,
      position: user.employee.position,
      hireDate: formattedHireDate,
      purpose: purposeText,
      companyName: '(주)비아',
    }

    selectedCertificate = certData
  }

  function closePDFModal() {
    selectedCertificate = null
    purpose = ''
  }

  function goBack() {
    goto('/dashboard')
  }

  // 빠른 발급용 목적 템플릿
  const purposeTemplates = ['금융기관 제출용', '관공서 제출용', '비자 발급용', '기타 제출용']
</script>

<svelte:head>
  <title>재직증명서 - VWS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-4xl mx-auto space-y-6">
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
        <h1 class="text-2xl font-bold text-gray-900">재직증명서</h1>
      </div>
    </div>

    {#if !hasEmployeeInfo}
      <!-- No Employee Info Warning -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div class="flex items-center gap-3">
          <div class="text-4xl">⚠️</div>
          <div>
            <h3 class="text-lg font-semibold text-yellow-800 mb-1">
              재직증명서를 발급할 수 없습니다
            </h3>
            <p class="text-yellow-700">
              직원 정보가 등록되지 않아 재직증명서를 발급할 수 없습니다. 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    {:else}
      <!-- Employee Info Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-1">직원 정보</h2>
            <p class="text-sm text-gray-600">재직증명서에 표시될 정보입니다</p>
          </div>
          <div class="text-4xl">👤</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <div class="text-sm text-gray-600 mb-1">성명</div>
              <div class="text-lg font-medium text-gray-900">{displayName}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">사번</div>
              <div class="text-lg font-medium text-gray-900">{user?.employee?.employee_id}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">부서</div>
              <div class="text-lg font-medium text-gray-900">{user?.employee?.department}</div>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <div class="text-sm text-gray-600 mb-1">직급</div>
              <div class="text-lg font-medium text-gray-900">{user?.employee?.position}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">입사일</div>
              <div class="text-lg font-medium text-gray-900">{formattedHireDate}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Certificate Issue Form -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">재직증명서 발급</h2>

        <div class="space-y-4">
          <!-- Purpose Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              발급 목적 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={purpose}
              placeholder="예: 금융기관 제출용"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Quick Templates -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">빠른 선택</label>
            <div class="grid grid-cols-2 gap-2">
              {#each purposeTemplates as template}
                <button
                  type="button"
                  onclick={() => (purpose = template)}
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {template}
                </button>
              {/each}
            </div>
          </div>

          <!-- Issue Button -->
          <button
            type="button"
            onclick={() => openCertificatePDF(purpose)}
            disabled={!purpose.trim()}
            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <FileTextIcon size={20} />
            <span>재직증명서 발급</span>
          </button>
        </div>
      </div>

      <!-- Info Note -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex gap-2">
          <div class="text-blue-600 mt-0.5">ℹ️</div>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">재직증명서 안내</p>
            <ul class="space-y-1 text-blue-700">
              <li>• 발급 목적을 입력하고 "재직증명서 발급" 버튼을 클릭하세요</li>
              <li>• PDF로 저장하거나 인쇄할 수 있습니다</li>
              <li>• 발급된 증명서는 공식 문서로 사용 가능합니다</li>
              <li>• 직인이 필요한 경우 인사담당자에게 문의하세요</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- PDF Modal -->
{#if selectedCertificate}
  <CertificatePDFModal certificate={selectedCertificate} onClose={closePDFModal} />
{/if}
