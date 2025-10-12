<script lang="ts">
  import { CrmDocumentType } from '$lib/constants/crm'
  import { EvidenceCategoryCode } from '$lib/constants/evidence-category-codes'
  import { downloadCrmDocument } from '$lib/services/s3/s3-crm.service'
  import type { EvidenceDocument } from '$lib/types/document.types'
  import { logger } from '$lib/utils/logger'
  import { CalendarIcon, DownloadIcon, EditIcon, FileTextIcon, PlusIcon } from '@lucide/svelte'
  import CommonPayslipModal from '../payslip/CommonPayslipModal.svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeModal from '../ui/ThemeModal.svelte'
  import RDDocumentList from './RDDocumentList.svelte'
  import RDFileUpload from './RDFileUpload.svelte'
  import * as memberUtilsImported from './utils/rd-member-utils'

  interface EvidenceItem {
    id?: string
    name: string
    budget_amount: number
    progress: number
    due_date?: string
    status: string
    category_id?: string
    category_name?: string
    category_code?: string
    assignee_first_name?: string
    assignee_last_name?: string
    assignee_korean_name?: string
    customer_id?: string
    customer_name?: string
    customer_business_number?: string
    customer_representative?: string
    business_registration_s3_key?: string
    bank_account_s3_key?: string
    documents?: Array<{
      document_type: string
      document_name: string
      file_size?: number
      status: string
    }>
    schedules?: Array<{
      task_name: string
      description?: string
      due_date: string
      assignee_name?: string
      status: string
      priority?: string
    }>
  }

  interface EvidenceCategory {
    id: string
    code: string
    name: string
    is_active: boolean
  }

  interface Props {
    visible: boolean
    selectedItem: EvidenceItem | null
    formatRDCurrency: (amount: number) => string
    formatDate: (date: string) => string
    onclose: () => void
    onUpdate?: () => void
  }

  let {
    visible = $bindable(),
    selectedItem,
    formatRDCurrency,
    formatDate,
    onclose,
    onUpdate,
  }: Props = $props()

  let activeTab = $state<'info' | 'documents' | 'schedules'>('info')
  let categories = $state<EvidenceCategory[]>([])
  let documents = $state<EvidenceDocument[]>([])
  let editingCategory = $state(false)
  let selectedCategoryId = $state<string>('')
  let loadingDocuments = $state(false)
  let savingCategory = $state(false)

  // 고객 관련 state
  interface Customer {
    id: string
    name: string
    business_number: string
    representative_name: string
  }
  let customers = $state<Customer[]>([])
  let selectedCustomerId = $state<string>('')
  let loadingCustomers = $state(false)
  let savingCustomer = $state(false)

  // 급여명세서 관련 state
  interface PayslipInfo {
    exists: boolean
    payslipId?: string
    employeeId?: string
    period?: string
    employeeName?: string
  }
  let payslipInfo = $state<PayslipInfo | null>(null)
  let loadingPayslip = $state(false)
  let showPayslipModal = $state(false)

  // 인건비 카테고리 여부
  const isPersonnelEvidence = $derived(
    selectedItem?.category_code === EvidenceCategoryCode.PERSONNEL,
  )

  // 고객 목록 로드
  async function loadCustomers() {
    try {
      loadingCustomers = true
      const response = await fetch('/api/crm/customers')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          customers = result.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            business_number: c.business_number,
            representative_name: c.representative_name,
          }))
        }
      }
    } catch (error) {
      logger.error('Failed to load customers:', error)
    } finally {
      loadingCustomers = false
    }
  }

  // 고객 선택 변경
  async function handleCustomerChange() {
    if (!selectedItem?.id || !selectedCustomerId) return

    try {
      savingCustomer = true
      const response = await fetch(`/api/research-development/evidence/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomerId || null }),
      })

      if (!response.ok) {
        throw new Error('고객 정보 업데이트 실패')
      }

      logger.log('Customer updated for evidence item', {
        evidenceId: selectedItem.id,
        customerId: selectedCustomerId,
      })
      onUpdate?.()
    } catch (error) {
      logger.error('Failed to update customer:', error)
      alert('고객 정보 업데이트에 실패했습니다.')
    } finally {
      savingCustomer = false
    }
  }

  // 고객 문서 다운로드
  async function downloadCustomerDocument(documentType: CrmDocumentType) {
    if (!selectedCustomerId) return

    try {
      await downloadCrmDocument(selectedCustomerId, documentType)
    } catch (error) {
      logger.error('Failed to download customer document:', error)
      alert('문서 다운로드에 실패했습니다.')
    }
  }

  // 인건비 증빙: 항목명에서 직원명/기간 파싱
  function parsePersonnelName(name: string): { employeeName: string; period: string } | null {
    // "박기선 (2025-01)" 형식 파싱
    const match = name.match(/^(.+?)\s*\((\d{4}-\d{2})\)$/)
    if (match) {
      return { employeeName: match[1].trim(), period: match[2] }
    }
    return null
  }

  // 급여명세서 확인
  async function checkPayslip(employeeName: string, period: string): Promise<PayslipInfo> {
    try {
      loadingPayslip = true
      const response = await fetch(
        `/api/research-development/evidence/payslip-check?employeeName=${encodeURIComponent(employeeName)}&period=${period}`,
      )
      if (response.ok) {
        const result = await response.json()
        return result.data
      }
      return { exists: false }
    } catch (error) {
      logger.error('Failed to check payslip:', error)
      return { exists: false }
    } finally {
      loadingPayslip = false
    }
  }

  // 급여명세서 출력 모달 열기
  function openPayslipModal() {
    if (payslipInfo?.exists && payslipInfo?.payslipId) {
      showPayslipModal = true
    }
  }

  // 카테고리 목록 로드
  async function loadCategories() {
    try {
      const response = await fetch('/api/research-development/evidence-categories')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          categories = result.data.filter((c: EvidenceCategory) => c.is_active)
        }
      }
    } catch (error) {
      logger.error('Failed to load categories:', error)
    }
  }

  // 문서 목록 로드
  async function loadDocuments() {
    if (!selectedItem?.id) return

    try {
      loadingDocuments = true
      const response = await fetch(
        `/api/research-development/evidence/${selectedItem.id}/documents`,
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          documents = result.data
        }
      }
    } catch (error) {
      logger.error('Failed to load documents:', error)
    } finally {
      loadingDocuments = false
    }
  }

  // 카테고리 변경 저장
  async function handleCategoryChange() {
    if (!selectedItem?.id || !selectedCategoryId) return

    try {
      savingCategory = true
      const response = await fetch(`/api/research-development/evidence/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCategoryId }),
      })

      if (!response.ok) {
        throw new Error('카테고리 변경 실패')
      }

      logger.log('Category updated', {
        evidenceId: selectedItem.id,
        categoryId: selectedCategoryId,
      })
      editingCategory = false
      onUpdate?.()
    } catch (error) {
      logger.error('Failed to update category:', error)
      alert('카테고리 변경에 실패했습니다.')
    } finally {
      savingCategory = false
    }
  }

  // 모달이 열릴 때 데이터 로드
  $effect(() => {
    if (visible && selectedItem?.id) {
      loadCategories()
      loadDocuments()
      selectedCategoryId = selectedItem.category_id || ''
      activeTab = 'info'
      editingCategory = false

      // 인건비가 아닌 경우 고객 목록 로드
      if (!isPersonnelEvidence) {
        loadCustomers()
        selectedCustomerId = selectedItem.customer_id || ''
      }

      // 인건비인 경우 급여명세서 정보 로드
      if (isPersonnelEvidence && selectedItem.name) {
        const parsed = parsePersonnelName(selectedItem.name)
        if (parsed) {
          checkPayslip(parsed.employeeName, parsed.period).then((info) => {
            payslipInfo = info
          })
        } else {
          payslipInfo = null
        }
      }
    }
  })
</script>

<!-- 증빙 상세 모달 -->
{#if visible}
  <ThemeModal open={visible} {onclose} size="xl">
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-xl font-semibold text-gray-900">
          {selectedItem?.name || '증빙 관리'}
        </h3>
      </div>

      {#if selectedItem}
        <!-- 탭 메뉴 -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'info')}
            >
              기본 정보
            </button>
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'documents')}
            >
              증빙 서류 ({documents.length})
            </button>
            <button
              type="button"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
              'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              onclick={() => (activeTab = 'schedules')}
            >
              일정 ({selectedItem.schedules?.length || 0})
            </button>
          </nav>
        </div>

        <!-- 탭 콘텐츠 -->
        <div class="space-y-6">
          {#if activeTab === 'info'}
            <!-- 기본 정보 탭 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">예산액</div>
                  <div class="text-base font-semibold text-gray-900">
                    {formatRDCurrency(selectedItem.budget_amount || 0)}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">담당자</div>
                  <div class="text-base text-gray-900">
                    {memberUtilsImported.formatAssigneeNameFromFields(selectedItem, '미지정')}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">진행률</div>
                  <div class="flex items-center space-x-3">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full"
                        style:width="{selectedItem.progress || 0}%"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-900"
                      >{selectedItem.progress || 0}%</span
                    >
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">마감일</div>
                  <div class="text-base text-gray-900">
                    {selectedItem.due_date ? formatDate(selectedItem.due_date) : '미설정'}
                  </div>
                </div>

                <div>
                  <div class="block text-sm font-medium text-gray-700 mb-1">상태</div>
                  <div>
                    {#if selectedItem.status === 'completed'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        완료
                      </span>
                    {:else if selectedItem.status === 'in_progress'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                      >
                        진행중
                      </span>
                    {:else if selectedItem.status === 'planned'}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        계획
                      </span>
                    {:else}
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {selectedItem.status}
                      </span>
                    {/if}
                  </div>
                </div>

                <div class="col-span-2">
                  <div class="block text-sm font-medium text-gray-700 mb-1">카테고리</div>
                  {#if !editingCategory}
                    <div class="flex items-center space-x-2">
                      <span class="text-base font-medium text-gray-900"
                        >{selectedItem.category_name}</span
                      >
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => (editingCategory = true)}
                      >
                        <EditIcon size={14} class="mr-1" />
                        변경
                      </ThemeButton>
                    </div>
                  {:else}
                    <div class="flex items-center space-x-2">
                      <select
                        bind:value={selectedCategoryId}
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {#each categories as category}
                          <option value={category.id}>{category.name}</option>
                        {/each}
                      </select>
                      <ThemeButton
                        onclick={handleCategoryChange}
                        disabled={savingCategory || !selectedCategoryId}
                        size="sm"
                      >
                        {savingCategory ? '저장 중...' : '저장'}
                      </ThemeButton>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => {
                          editingCategory = false
                          selectedCategoryId = selectedItem.category_id || ''
                        }}
                      >
                        취소
                      </ThemeButton>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- 고객 정보 섹션 (인건비 제외) -->
            {#if !isPersonnelEvidence}
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">고객 정보</h4>

                <div class="space-y-4">
                  <div>
                    <label
                      for="customer-select"
                      class="block text-sm font-medium text-gray-700 mb-2">고객 선택</label
                    >
                    <select
                      id="customer-select"
                      bind:value={selectedCustomerId}
                      onchange={handleCustomerChange}
                      disabled={loadingCustomers || savingCustomer}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">선택하지 않음</option>
                      {#each customers as customer}
                        <option value={customer.id}>
                          {customer.name} ({customer.business_number} / {customer.representative_name})
                        </option>
                      {/each}
                    </select>
                    {#if savingCustomer}
                      <p class="text-sm text-gray-500 mt-1">저장 중...</p>
                    {/if}
                  </div>

                  {#if selectedCustomerId && selectedItem.business_registration_s3_key !== undefined}
                    <div class="border-t pt-4">
                      <h5 class="text-sm font-medium text-gray-700 mb-3">첨부 파일</h5>

                      <div class="space-y-2">
                        <!-- 사업자등록증 -->
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div class="flex items-center gap-2">
                            <FileTextIcon size={16} class="text-gray-600" />
                            <span class="text-sm font-medium text-gray-700">사업자등록증</span>
                          </div>
                          {#if selectedItem.business_registration_s3_key}
                            <button
                              type="button"
                              onclick={() =>
                                downloadCustomerDocument(CrmDocumentType.BUSINESS_REGISTRATION)}
                              class="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                              <DownloadIcon size={14} />
                              다운로드
                            </button>
                          {:else}
                            <span class="text-xs text-gray-500">비어있음</span>
                          {/if}
                        </div>

                        <!-- 통장사본 -->
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div class="flex items-center gap-2">
                            <FileTextIcon size={16} class="text-gray-600" />
                            <span class="text-sm font-medium text-gray-700">통장사본</span>
                          </div>
                          {#if selectedItem.bank_account_s3_key}
                            <button
                              type="button"
                              onclick={() => downloadCustomerDocument(CrmDocumentType.BANK_ACCOUNT)}
                              class="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                              <DownloadIcon size={14} />
                              다운로드
                            </button>
                          {:else}
                            <span class="text-xs text-gray-500">비어있음</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- 급여명세서 섹션 (인건비만) -->
            {#if isPersonnelEvidence}
              {@const parsed = parsePersonnelName(selectedItem.name)}
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">급여명세서</h4>

                {#if parsed}
                  <div class="space-y-3">
                    <div class="text-sm text-gray-600">
                      <span class="font-medium">{parsed.employeeName}</span>님의
                      <span class="font-medium">{parsed.period}</span> 급여명세서
                    </div>

                    {#if loadingPayslip}
                      <div class="flex items-center gap-2 text-sm text-gray-500">
                        <div
                          class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"
                        ></div>
                        확인 중...
                      </div>
                    {:else if payslipInfo?.exists && payslipInfo?.payslipId}
                      <button
                        type="button"
                        onclick={openPayslipModal}
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        급여명세서 출력
                      </button>
                    {:else}
                      <div class="space-y-2">
                        <p class="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                          아직 급여명세서가 등록되지 않았습니다.
                        </p>
                        <a
                          href="/salary"
                          class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          급여 관리 페이지에서 등록하기 →
                        </a>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <p class="text-sm text-gray-500">
                    증빙 항목명을 "이름 (YYYY-MM)" 형식으로 입력하면 급여명세서를 확인할 수
                    있습니다.
                  </p>
                {/if}
              </div>
            {/if}
          {:else if activeTab === 'documents'}
            <!-- 증빙 서류 탭 -->
            <div class="space-y-6">
              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-4">파일 업로드</h4>
                <RDFileUpload evidenceId={selectedItem.id || ''} onUploadComplete={loadDocuments} />
              </div>

              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-4">업로드된 서류</h4>
                {#if loadingDocuments}
                  <div class="text-center py-8">
                    <div
                      class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    ></div>
                    <p class="mt-2 text-sm text-gray-500">로딩 중...</p>
                  </div>
                {:else}
                  <RDDocumentList
                    evidenceId={selectedItem.id || ''}
                    bind:documents
                    onRefresh={loadDocuments}
                  />
                {/if}
              </div>
            </div>
          {:else if activeTab === 'schedules'}
            <!-- 일정 탭 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-medium text-gray-900">증빙 일정</h4>
                <ThemeButton size="sm">
                  <PlusIcon size={14} class="mr-1" />
                  일정 추가
                </ThemeButton>
              </div>

              <div class="space-y-2">
                {#if selectedItem.schedules && selectedItem.schedules.length > 0}
                  {#each selectedItem.schedules as schedule, i (i)}
                    <div
                      class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div class="flex-1">
                        <div class="font-medium text-sm text-gray-900">
                          {schedule.task_name}
                        </div>
                        {#if schedule.description}
                          <div class="text-xs text-gray-600 mt-1">
                            {schedule.description}
                          </div>
                        {/if}
                        <div class="text-xs text-gray-500 mt-2">
                          마감일: {formatDate(schedule.due_date)}
                          {#if schedule.assignee_name}
                            | 담당자: {memberUtilsImported.formatAssigneeName(
                              schedule.assignee_name,
                              '미할당',
                            )}
                          {/if}
                        </div>
                      </div>
                      <div class="flex items-center space-x-2 ml-4">
                        {#if schedule.status === 'completed'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                          >
                            완료
                          </span>
                        {:else if schedule.status === 'in_progress'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
                          >
                            진행중
                          </span>
                        {:else if schedule.status === 'overdue'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                          >
                            지연
                          </span>
                        {:else}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                          >
                            대기
                          </span>
                        {/if}
                        {#if schedule.priority === 'high'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                          >
                            높음
                          </span>
                        {:else if schedule.priority === 'urgent'}
                          <span
                            class="px-2 py-1 text-xs font-medium rounded-full bg-red-200 text-red-900"
                          >
                            긴급
                          </span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-12 text-gray-500">
                    <CalendarIcon class="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>등록된 증빙 일정이 없습니다.</p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- 하단 액션 버튼 -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <ThemeButton variant="ghost" onclick={onclose}>닫기</ThemeButton>
        </div>
      {/if}
    </div>
  </ThemeModal>
{/if}

<!-- 급여명세서 출력 모달 -->
{#if showPayslipModal && payslipInfo?.payslipId}
  <CommonPayslipModal
    payslipId={payslipInfo.payslipId}
    onClose={() => {
      showPayslipModal = false
    }}
  />
{/if}
