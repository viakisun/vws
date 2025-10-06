<script lang="ts">
  import PayslipGenerator from '$lib/components/salary/PayslipGenerator.svelte'
  import { loadPayslips, payslips } from '$lib/stores/salary/salary-store'
  import type { Payslip } from '$lib/types/salary'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import { CalendarIcon, DownloadIcon, FileTextIcon, SearchIcon, UserIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  interface EmployeeOption {
    id: string
    name: string
  }

  let searchQuery = $state('')
  let selectedPeriod = $state('')
  let selectedEmployee = $state('')

  // 필터링된 급여명세서 목록
  const filteredPayslips = $derived<Payslip[]>(
    (() => {
      let filtered = [...$payslips]

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (payroll) =>
            payroll.employeeName.toLowerCase().includes(query) ||
            payroll.employeeIdNumber.toLowerCase().includes(query) ||
            payroll.department.toLowerCase().includes(query),
        )
      }

      if (selectedPeriod) {
        filtered = filtered.filter((payroll) => payroll.payDate.startsWith(selectedPeriod))
      }

      if (selectedEmployee) {
        filtered = filtered.filter((payroll) => payroll.employeeId === selectedEmployee)
      }

      return filtered.sort((a, b) => b.payDate.localeCompare(a.payDate))
    })(),
  )

  // 기간 옵션
  const periodOptions = $derived<string[]>(
    (() => {
      const periods = new Set<string>()
      $payslips.forEach((payslip) => {
        const period = payslip.period
        periods.add(period)
      })
      return Array.from(periods).sort().reverse()
    })(),
  )

  // 직원 옵션
  const employeeOptions = $derived<EmployeeOption[]>(
    (() => {
      const employees = new Map<string, EmployeeOption>()
      $payslips.forEach((payslip) => {
        employees.set(payslip.employeeId, {
          id: payslip.employeeId,
          name: payslip.employeeName,
        })
      })
      return Array.from(employees.values()).sort((a, b) => a.name.localeCompare(b.name))
    })(),
  )

  onMount(() => {
    void (async () => {
      await loadPayslips()
    })()
  })

  // 상태별 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'calculated':
        return 'text-blue-600 bg-blue-100'
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'paid':
        return 'text-purple-600 bg-purple-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  // 상태별 라벨
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'calculated':
        return '계산완료'
      case 'approved':
        return '승인완료'
      case 'paid':
        return '지급완료'
      case 'error':
        return '오류'
      default:
        return '알수없음'
    }
  }
</script>

<svelte:head>
  <title>급여명세서 - VWS</title>
  <meta name="description" content="급여명세서 생성 및 다운로드" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div class="space-y-6">
      <!-- 헤더 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">급여명세서</h1>
          <p class="mt-2 text-gray-600">급여명세서 생성 및 다운로드</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DownloadIcon size={16} class="mr-2" />
            일괄 다운로드
          </button>
        </div>
      </div>

      <!-- 검색 및 필터 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="relative">
            <SearchIcon size={20} class="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="직원명, 사번, 부서로 검색..."
              bind:value={searchQuery}
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="relative">
            <CalendarIcon size={20} class="absolute left-3 top-3 text-gray-400" />
            <select
              bind:value={selectedPeriod}
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 기간</option>
              {#each periodOptions as period, i (i)}
                <option value={period}>{period}</option>
              {/each}
            </select>
          </div>

          <div class="relative">
            <UserIcon size={20} class="absolute left-3 top-3 text-gray-400" />
            <select
              bind:value={selectedEmployee}
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 직원</option>
              {#each employeeOptions as employee, i (i)}
                <option value={employee.id}>{employee.name}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- 급여명세서 목록 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  직원 정보
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  부서/직위
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  지급 기간
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  실지급액
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  상태
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  급여명세서
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredPayslips as payroll, i (i)}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div
                          class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                        >
                          <span class="text-sm font-medium text-blue-600">
                            {payroll.employeeName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {payroll.employeeName}
                        </div>
                        <div class="text-sm text-gray-500">
                          {payroll.employeeIdNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {payroll.department}
                    </div>
                    <div class="text-sm text-gray-500">{payroll.position}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payroll.payDate)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {formatCurrency(payroll.netSalary)}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(
                        payroll.status || '',
                      )}"
                    >
                      {getStatusLabel(payroll.status || '')}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <PayslipGenerator {payroll} />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- 결과가 없을 때 -->
        {#if filteredPayslips.length === 0}
          <div class="text-center py-12">
            <FileTextIcon size={48} class="mx-auto text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">급여명세서가 없습니다</h3>
            <p class="mt-1 text-sm text-gray-500">검색 조건을 변경하거나 급여를 계산해보세요.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
