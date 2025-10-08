<script lang="ts">
  import { pushToast } from '$lib/stores/toasts'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import PayslipPDFModal from '$lib/components/payslip/PayslipPDFModal.svelte'
  import { formatNumber } from '$lib/utils/format'
  import { EditIcon, PlusIcon, PrinterIcon, SaveIcon, UserIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import type {
    Employee,
    EmployeeContract,
    PayslipData,
    PayslipPDFData,
    CompanyInfo,
    PayrollProp,
  } from './types'
  import PayslipHeader from './components/PayslipHeader.svelte'
  import ContractInfo from './components/ContractInfo.svelte'
  import MissingPayslipAlert from './components/MissingPayslipAlert.svelte'
  import EditableAmountInput from './components/EditableAmountInput.svelte'
  import {
    fetchEmployeeList,
    fetchEmployeeContract,
    fetchPayslipData,
    savePayslip as savePayslipService,
    fetchCompanyInfo,
  } from './services'
  import {
    calculateTotals,
    validateSalaryAmount,
    getSalaryValidationMessage,
    isWithinContractPeriod,
    getContractPeriodMissingPayslips,
    getMissingPayslipCount,
    createEditablePayslip,
    createNewPayslip,
    mapPayslipToPDFData,
    getCellDisplayValue,
    getRowClasses,
    getCellTextClasses,
    getStatusBadge,
    getActionButton,
  } from './utils'

  const { payroll = undefined }: { payroll?: PayrollProp } = $props()

  let employeeList = $state<Employee[]>([])
  let allEmployees = $state<Employee[]>([])
  let selectedEmployeeId = $state('')
  let selectedYear = $state(new Date().getFullYear())
  let showOnlyActive = $state(true)
  let payslipData = $state<PayslipData[]>([])
  let isLoadingPayslipData = $state(false)
  let editingMonth = $state<number | null>(null)
  let editingPayslip = $state<PayslipData | null>(null)
  let employeeContract = $state<EmployeeContract | null>(null)
  let isLoadingContract = $state(false)
  let showPDFModal = $state(false)
  let selectedPayslipForPDF = $state<PayslipPDFData | null>(null)
  let companyInfo = $state<CompanyInfo | null>(null)

  const selectedEmployee = $derived(
    employeeList.find((emp) => emp.id === selectedEmployeeId) || null,
  )

  function handleEmployeeChange() {
    if (selectedEmployeeId) {
      loadEmployeeContract(selectedEmployeeId)
      loadPayslipData()
    }
  }

  async function loadPayslipData() {
    if (!selectedEmployeeId) {
      payslipData = []
      return
    }

    isLoadingPayslipData = true
    try {
      payslipData = await fetchPayslipData(
        selectedEmployeeId,
        selectedYear,
        selectedEmployee?.hireDate,
      )
    } catch (error) {
      payslipData = []
      pushToast('급여명세서 데이터를 불러올 수 없습니다.', 'error')
    } finally {
      isLoadingPayslipData = false
    }
  }

  async function loadEmployeeList() {
    try {
      allEmployees = await fetchEmployeeList(100)
      updateEmployeeList()
    } catch (error) {
      allEmployees = []
      employeeList = []
      pushToast('직원 목록을 불러올 수 없습니다.', 'error')
    }
  }

  function updateEmployeeList() {
    if (showOnlyActive) {
      employeeList = allEmployees.filter((emp) => emp.status === 'active')
    } else {
      employeeList = allEmployees
    }
  }

  function toggleActiveFilter() {
    showOnlyActive = !showOnlyActive
    updateEmployeeList()
  }

  async function loadEmployeeContract(employeeId: string) {
    if (!employeeId) {
      employeeContract = null
      return
    }

    isLoadingContract = true
    try {
      employeeContract = await fetchEmployeeContract(employeeId)
    } catch (error) {
      employeeContract = null
      pushToast('급여 계약 정보를 불러올 수 없습니다.', 'error')
    } finally {
      isLoadingContract = false
    }
  }

  async function enterEditMode(
    month: number,
    payslip?: PayslipData['payslip'] & { baseSalary?: number },
  ) {
    await loadEmployeeContract(selectedEmployeeId)

    if (!isWithinContractPeriod(employeeContract, selectedYear, month)) {
      alert(
        `해당 월(${month}월)은 현재 급여 계약 기간(${employeeContract?.startDate} ~ ${employeeContract?.contractEndDisplay}) 밖에 있습니다.`,
      )
      return
    }

    editingMonth = month
    editingPayslip = payslip
      ? createEditablePayslip(payslip, employeeContract)
      : createNewPayslip(selectedYear, month, employeeContract)
  }

  function cancelEdit() {
    editingMonth = null
    editingPayslip = null
  }

  function recalculateTotals() {
    if (!editingPayslip) return

    const totals = calculateTotals(editingPayslip.allowances || [], editingPayslip.deductions || [])
    editingPayslip.totalPayments = totals.totalPayments
    editingPayslip.totalDeductions = totals.totalDeductions
    editingPayslip.netSalary = totals.netSalary
  }

  async function savePayslip() {
    if (!editingPayslip || !editingMonth) return

    try {
      recalculateTotals()

      const validation = validateSalaryAmount(editingPayslip.allowances || [], employeeContract)
      if (validation && !validation.isValid) {
        const validationMsg = getSalaryValidationMessage(validation, formatNumber)
        const confirmSave = confirm(`${validationMsg?.message}\n\n그래도 저장하시겠습니까?`)
        if (!confirmSave) return
      }

      const basicSalary = Number(
        (editingPayslip.allowances || []).find((a) => a.id === 'basic_salary')?.amount || 0,
      )

      const [year, month] = (editingPayslip.period || '').split('-')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const payDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`

      const result = await savePayslipService({
        employeeId: selectedEmployeeId,
        period: editingPayslip.period || '',
        payDate,
        baseSalary: basicSalary,
        totalPayments: editingPayslip.totalPayments || 0,
        totalDeductions: editingPayslip.totalDeductions || 0,
        netSalary: editingPayslip.netSalary || 0,
        payments: editingPayslip.allowances || [],
        deductions: editingPayslip.deductions || [],
        status: 'draft',
        isGenerated: false,
      })

      if (result.success) {
        pushToast('급여명세서가 저장되었습니다.', 'info')
        cancelEdit()
        loadPayslipData()
      } else {
        pushToast(`저장에 실패했습니다: ${result.error}`, 'info')
      }
    } catch {
      pushToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  function openPDFModal(monthData: PayslipData) {
    if (!selectedEmployee || !monthData.payslip) return

    selectedPayslipForPDF = mapPayslipToPDFData(
      monthData,
      selectedEmployee,
      selectedYear,
      companyInfo?.name || '비아허브',
      companyInfo?.ceoName || '',
    )

    showPDFModal = true
  }

  function closePDFModal() {
    showPDFModal = false
    selectedPayslipForPDF = null
  }

  async function loadCompanyInfo() {
    try {
      companyInfo = await fetchCompanyInfo()
    } catch (error) {
      pushToast('회사 정보를 불러올 수 없습니다.', 'error')
    }
  }

  onMount(() => {
    loadEmployeeList()
    loadCompanyInfo()
  })
</script>

{#if !payroll}
  <!-- 급여명세서 월별 관리 -->
  <div class="space-y-6">
    <PayslipHeader
      {employeeList}
      bind:selectedEmployeeId
      bind:selectedYear
      bind:showOnlyActive
      onEmployeeChange={handleEmployeeChange}
      onYearChange={() => loadPayslipData()}
      onToggleActiveFilter={toggleActiveFilter}
    />

    {#if selectedEmployeeId}
      {@const missingCount = getMissingPayslipCount(payslipData)}
      {@const contractMissingPeriods = getContractPeriodMissingPayslips(
        selectedEmployee || null,
        payslipData,
      )}

      <ContractInfo contract={employeeContract} isLoading={isLoadingContract} />

      <MissingPayslipAlert
        employeeName={selectedEmployee?.name || ''}
        year={selectedYear}
        {missingCount}
        {contractMissingPeriods}
      />

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
                                <EditableAmountInput
                                  bind:name={allowance.name}
                                  bind:amount={allowance.amount}
                                  onNameChange={() => recalculateTotals()}
                                  onAmountChange={() => recalculateTotals()}
                                />
                              {/each}
                            </div>
                          </div>

                          <!-- 공제사항 편집 -->
                          <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">공제사항</h4>
                            <div class="grid grid-cols-2 gap-2">
                              {#each editingPayslip?.deductions || [] as deduction, index (index)}
                                <EditableAmountInput
                                  bind:name={deduction.name}
                                  bind:amount={deduction.amount}
                                  onNameChange={() => recalculateTotals()}
                                  onAmountChange={() => recalculateTotals()}
                                />
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
                          {#if employeeContract && editingPayslip}
                            {@const validation = validateSalaryAmount(
                              editingPayslip.allowances || [],
                              employeeContract,
                            )}
                            {@const validationMessage = getSalaryValidationMessage(
                              validation,
                              formatNumber,
                            )}
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
                      employeeContract,
                      selectedYear,
                      monthData.month || 1,
                    )}
                    {@const statusBadge = getStatusBadge(monthData, isOutsideContract)}
                    {@const actionBtn = getActionButton(monthData, isOutsideContract)}
                    <tr class={getRowClasses(monthData, isOutsideContract)}>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium {getCellTextClasses(
                          monthData.isLocked,
                          'text-gray-900',
                        )}"
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
                        class="px-6 py-4 whitespace-nowrap text-sm {getCellTextClasses(
                          monthData.isLocked,
                        )}"
                      >
                        {getCellDisplayValue(
                          monthData.hasData,
                          monthData.isLocked,
                          monthData.payslip?.baseSalary,
                          (v) => formatNumber(v, true, '원'),
                        )}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {getCellTextClasses(
                          monthData.isLocked,
                        )}"
                      >
                        {getCellDisplayValue(
                          monthData.hasData,
                          monthData.isLocked,
                          (monthData.payslip?.totalPayments ?? 0) -
                            (monthData.payslip?.baseSalary ?? 0),
                          (v: number) => formatNumber(v, true, '원'),
                        )}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {getCellTextClasses(
                          monthData.isLocked,
                        )}"
                      >
                        {getCellDisplayValue(
                          monthData.hasData,
                          monthData.isLocked,
                          monthData.payslip?.totalPayments,
                          (v: number) => formatNumber(v, true, '원'),
                        )}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm {getCellTextClasses(
                          monthData.isLocked,
                        )}"
                      >
                        {getCellDisplayValue(
                          monthData.hasData,
                          monthData.isLocked,
                          monthData.payslip?.totalDeductions,
                          (v: number) => formatNumber(v, true, '원'),
                        )}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm font-medium {getCellTextClasses(
                          monthData.isLocked,
                          'text-gray-900',
                        )}"
                      >
                        {getCellDisplayValue(
                          monthData.hasData,
                          monthData.isLocked,
                          monthData.payslip?.netSalary,
                          (v: number) => formatNumber(v, true, '원'),
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {statusBadge.colorClasses}"
                        >
                          {statusBadge.text}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {#if actionBtn?.type === 'disabled'}
                          <span class="{actionBtn.textColor} text-sm">
                            {actionBtn.text}
                          </span>
                        {:else if actionBtn?.type === 'edit'}
                          {#if actionBtn.hasData}
                            <div class="flex items-center justify-end gap-2">
                              <ThemeButton
                                variant="ghost"
                                size="sm"
                                onclick={() =>
                                  enterEditMode(
                                    monthData.month || 1,
                                    monthData.payslip || undefined,
                                  )}
                              >
                                <EditIcon size={16} class="mr-1" />
                                편집
                              </ThemeButton>
                              <ThemeButton
                                variant="ghost"
                                size="sm"
                                onclick={() => openPDFModal(monthData)}
                              >
                                <PrinterIcon size={16} class="mr-1" />
                                출력
                              </ThemeButton>
                            </div>
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

<!-- PDF 출력 모달 -->
{#if showPDFModal && selectedPayslipForPDF}
  <PayslipPDFModal payslip={selectedPayslipForPDF} onClose={closePDFModal} />
{/if}
