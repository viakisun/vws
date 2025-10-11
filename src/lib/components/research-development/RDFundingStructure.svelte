<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { BudgetSummary } from '$lib/types/project-budget'
  import { formatDate } from '$lib/utils/format'
  import { DollarSignIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import RDEditableNumberCell from './RDEditableNumberCell.svelte'
  import { formatRDCurrency } from './utils/rd-format-utils'

  const {
    projectId,
    compact = false,
    refreshTrigger = 0,
  } = $props<{
    projectId: string
    compact?: boolean
    refreshTrigger?: number
  }>()

  // 예산 데이터 상태
  let budgetSummary = $state<BudgetSummary | null>(null)
  let budgetDetails = $state<any[] | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  // 노션 스타일 편집 상태
  let editingCell = $state<{ index: number; field: string } | null>(null)
  let hoveredRow = $state<number | null>(null)
  let isSaving = $state(false)
  let editingStartDate = $state('')
  let editingEndDate = $state('')

  // 숫자 언포맷팅 함수 (콤마 제거)
  function unformatNumber(value: string): number {
    if (!value) return 0
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  // 날짜 편집 시작
  function startEditingDates(index: number) {
    if (budgetDetails && budgetDetails[index]) {
      editingStartDate = budgetDetails[index].startDate || ''
      editingEndDate = budgetDetails[index].endDate || ''
      editingCell = { index, field: 'dates' }
    }
  }

  // 날짜 저장
  function saveDateChanges(index: number) {
    if (!budgetDetails) return

    // 로컬 상태 업데이트
    budgetDetails[index] = {
      ...budgetDetails[index],
      startDate: editingStartDate,
      endDate: editingEndDate,
    }

    stopEditingCell()

    // 저장
    saveAllBudgets()
  }

  // 예산 데이터 로드
  async function loadBudgetSummary() {
    if (!projectId) return

    try {
      loading = true
      error = null

      const response = await window.fetch(
        `/api/research-development/projects/${projectId}/annual-budgets`,
      )
      const result = await response.json()

      if (result.success && result.data) {
        budgetSummary = result.data.summary || null
        budgetDetails = result.data.budgets || null
      } else {
        budgetSummary = null
        budgetDetails = null
      }
    } catch (err) {
      logger.error('예산 요약 로드 실패:', err)
      error = '예산 정보를 불러올 수 없습니다.'
    } finally {
      loading = false
    }
  }

  // 프로젝트 ID 변경 시 또는 refreshTrigger 변경 시 데이터 로드
  function _updateData() {
    if (projectId) {
      loadBudgetSummary()
    }
    // refreshTrigger가 변경될 때마다 데이터 다시 로드
    if (refreshTrigger > 0) {
      loadBudgetSummary()
    }
  }

  // refreshTrigger 변경 시 데이터 새로고침
  $effect(() => {
    // refreshTrigger 값을 명시적으로 참조하여 변경 감지
    const _ = refreshTrigger
    // refreshTrigger가 0보다 클 때만 로드 (초기값 0은 제외)
    if (refreshTrigger > 0) {
      loadBudgetSummary()
    }
  })

  // 셀 클릭 - 편집 모드로 전환
  function startEditingCell(index: number, field: string) {
    editingCell = { index, field }
  }

  // 셀 편집 종료
  function stopEditingCell() {
    editingCell = null
  }

  // 값 변경 시 저장 (Enter 키 또는 blur 시 호출됨)
  function handleValueChange(index: number, field: string, value: any) {
    if (!budgetDetails) return

    // 숫자 필드인 경우 콤마 제거하여 숫자로 변환
    const numericValue = typeof value === 'string' ? unformatNumber(value) : value

    // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
    budgetDetails[index] = {
      ...budgetDetails[index],
      [field]: numericValue,
    }

    // 금액 필드인 경우 총액 재계산
    if (['governmentFunding', 'companyCash', 'companyInKind'].includes(field)) {
      const budget = budgetDetails[index]
      const govFunding = parseFloat(String(budget.governmentFunding)) || 0
      const companyCash = parseFloat(String(budget.companyCash)) || 0
      const companyInKind = parseFloat(String(budget.companyInKind)) || 0

      budgetDetails[index].totalCash = govFunding + companyCash
      budgetDetails[index].totalInKind = companyInKind
      budgetDetails[index].yearlyTotal =
        budgetDetails[index].totalCash + budgetDetails[index].totalInKind
    }

    // 즉시 저장
    saveAllBudgets()
  }

  // 전체 예산 저장
  async function saveAllBudgets() {
    if (!budgetDetails || budgetDetails.length === 0) return

    try {
      isSaving = true
      error = null

      // 데이터 검증
      for (const budget of budgetDetails) {
        if (!budget.startDate || !budget.endDate) {
          error = '모든 연차의 사업기간을 입력해주세요.'
          return
        }
        if (budget.year < 1) {
          error = '연차는 1 이상이어야 합니다.'
          return
        }
      }

      // API 형식에 맞게 데이터 변환
      const budgetsToSave = budgetDetails.map((b) => ({
        year: b.year,
        startDate: b.startDate,
        endDate: b.endDate,
        governmentFunding: parseFloat(String(b.governmentFunding)) || 0,
        companyCash: parseFloat(String(b.companyCash)) || 0,
        companyInKind: parseFloat(String(b.companyInKind)) || 0,
      }))

      const response = await fetch(
        `/api/research-development/projects/${projectId}/annual-budgets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets: budgetsToSave }),
        },
      )

      const result = await response.json()

      if (result.success) {
        // 성공 시 데이터 새로고침
        await loadBudgetSummary()

        if (result.data?.warnings && result.data.warnings.length > 0) {
          logger.warn('예산 저장 경고:', result.data.warnings)
        }
      } else {
        error = result.error || '예산 저장에 실패했습니다.'
        // 실패 시 데이터 다시 로드하여 원래 상태로 복구
        await loadBudgetSummary()
      }
    } catch (err) {
      logger.error('예산 저장 실패:', err)
      error = '예산 저장 중 오류가 발생했습니다.'
      // 실패 시 데이터 다시 로드하여 원래 상태로 복구
      await loadBudgetSummary()
    } finally {
      isSaving = false
    }
  }

  // 새 연차 추가
  async function addNewYear() {
    if (!budgetDetails) {
      budgetDetails = []
    }

    const nextYear =
      budgetDetails.length > 0 ? Math.max(...budgetDetails.map((b) => b.year)) + 1 : 1
    const lastBudget = budgetDetails[budgetDetails.length - 1]

    // 이전 연차의 종료일 다음날을 시작일로 설정
    let startDate = ''
    let endDate = ''

    if (lastBudget && lastBudget.endDate) {
      const lastEndDate = new Date(lastBudget.endDate)
      lastEndDate.setDate(lastEndDate.getDate() + 1)
      startDate = lastEndDate.toISOString().split('T')[0]

      // 1년 후를 종료일로 설정
      const newEndDate = new Date(startDate)
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      newEndDate.setDate(newEndDate.getDate() - 1)
      endDate = newEndDate.toISOString().split('T')[0]
    }

    // 이전 연차의 재원 구성 복사 (없으면 0)
    const governmentFunding = lastBudget ? lastBudget.governmentFunding || 0 : 0
    const companyCash = lastBudget ? lastBudget.companyCash || 0 : 0
    const companyInKind = lastBudget ? lastBudget.companyInKind || 0 : 0
    const totalCash = governmentFunding + companyCash
    const totalInKind = companyInKind
    const yearlyTotal = totalCash + totalInKind

    budgetDetails = [
      ...budgetDetails,
      {
        year: nextYear,
        startDate,
        endDate,
        governmentFunding,
        companyCash,
        companyInKind,
        totalCash,
        totalInKind,
        yearlyTotal,
        isNew: true,
      },
    ]

    // 즉시 저장
    await saveAllBudgets()
  }

  // 연차 삭제
  async function deleteYear(index: number) {
    if (!budgetDetails) return

    const confirmed = confirm(`${budgetDetails[index].year}차년도 예산을 삭제하시겠습니까?`)
    if (!confirmed) return

    budgetDetails = budgetDetails.filter((_, i) => i !== index)

    // 즉시 저장
    await saveAllBudgets()
  }

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    loadBudgetSummary()
  })
</script>

{#if loading}
  <div class="flex items-center justify-center py-4">
    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    <span class="ml-2 text-sm text-gray-500">예산 로딩 중...</span>
  </div>
{:else if error}
  <div class="py-2 text-sm text-gray-500 text-center">
    {error}
  </div>
{:else if budgetSummary}
  {#if compact}
    <!-- 연차별 사업비 구성 표 -->
    <div class="space-y-4">
      <!-- 에러 메시지 & 저장 상태 표시 -->
      <div class="flex items-center justify-between min-h-[24px]">
        {#if error}
          <div class="text-sm text-red-600">
            {error}
          </div>
        {:else}
          <div></div>
        {/if}

        {#if isSaving}
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>저장 중...</span>
          </div>
        {/if}
      </div>

      <!-- 연차별 예산 구성 표 -->
      {#if budgetDetails && budgetDetails.length > 0}
        <!-- 단위 표시 -->
        <div class="text-right text-sm text-gray-500 mb-2">단위: 원</div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-700 border-b min-w-[80px]"
                  >연차</th
                >
                <th class="px-4 py-3 text-center font-medium text-gray-700 border-b min-w-[200px]"
                  >사업기간</th
                >
                <th class="px-4 py-3 text-right font-medium text-green-700 border-b min-w-[120px]"
                  >정부지원금</th
                >
                <th class="px-4 py-3 text-right font-medium text-orange-700 border-b min-w-[130px]"
                  >기업부담금(현금)</th
                >
                <th class="px-4 py-3 text-right font-medium text-purple-700 border-b min-w-[130px]"
                  >기업부담금(현물)</th
                >
                <th class="px-4 py-3 text-right font-medium text-blue-700 border-b min-w-[120px]"
                  >합계 현금</th
                >
                <th class="px-4 py-3 text-right font-medium text-purple-700 border-b min-w-[120px]"
                  >합계 현물</th
                >
                <th class="px-4 py-3 text-right font-medium text-gray-900 border-b min-w-[120px]"
                  >총 합계</th
                >
                <th class="px-4 py-3 text-center font-medium text-gray-700 border-b min-w-[60px]"
                ></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each budgetDetails as budget, i (i)}
                <tr
                  class="group hover:bg-gray-50 transition-colors"
                  onmouseenter={() => (hoveredRow = i)}
                  onmouseleave={() => (hoveredRow = null)}
                >
                  <td class="px-4 py-3 font-medium text-gray-900">{budget.year}차년도</td>

                  <!-- 사업기간 -->
                  <td class="px-4 py-3 text-center text-gray-700 text-xs">
                    {#if editingCell?.index === i && editingCell?.field === 'dates'}
                      <div class="flex flex-col gap-1">
                        <input
                          type="date"
                          bind:value={editingStartDate}
                          onblur={() => saveDateChanges(i)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveDateChanges(i)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              stopEditingCell()
                            }
                          }}
                          class="px-2 py-1 text-xs border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <input
                          type="date"
                          bind:value={editingEndDate}
                          onblur={() => saveDateChanges(i)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveDateChanges(i)
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              stopEditingCell()
                            }
                          }}
                          class="px-2 py-1 text-xs border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    {:else}
                      <button
                        onclick={() => startEditingDates(i)}
                        class="w-full text-center hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                      >
                        {#if budget.startDate && budget.endDate}
                          {formatDate(budget.startDate)} ~ {formatDate(budget.endDate)}
                        {:else}
                          <span class="text-gray-400">날짜 입력</span>
                        {/if}
                      </button>
                    {/if}
                  </td>

                  <!-- 정부지원금 -->
                  <td class="px-4 py-3 text-right text-green-800">
                    <RDEditableNumberCell
                      value={budget.governmentFunding}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'governmentFunding'}
                      onStartEdit={() => startEditingCell(i, 'governmentFunding')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'governmentFunding', value)}
                      textColor="text-green-800"
                      className="text-right"
                    />
                  </td>

                  <!-- 기업부담금(현금) -->
                  <td class="px-4 py-3 text-right text-orange-800">
                    <RDEditableNumberCell
                      value={budget.companyCash}
                      isEditing={editingCell?.index === i && editingCell?.field === 'companyCash'}
                      onStartEdit={() => startEditingCell(i, 'companyCash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'companyCash', value)}
                      textColor="text-orange-800"
                      className="text-right"
                    />
                  </td>

                  <!-- 기업부담금(현물) -->
                  <td class="px-4 py-3 text-right text-purple-800">
                    <RDEditableNumberCell
                      value={budget.companyInKind}
                      isEditing={editingCell?.index === i && editingCell?.field === 'companyInKind'}
                      onStartEdit={() => startEditingCell(i, 'companyInKind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'companyInKind', value)}
                      textColor="text-purple-800"
                      className="text-right"
                    />
                  </td>

                  <td class="px-4 py-3 text-right text-blue-800 font-medium"
                    >{formatRDCurrency(budget.totalCash)}</td
                  >
                  <td class="px-4 py-3 text-right text-purple-800 font-medium"
                    >{formatRDCurrency(budget.totalInKind)}</td
                  >
                  <td class="px-4 py-3 text-right text-gray-900 font-bold"
                    >{formatRDCurrency(budget.yearlyTotal)}</td
                  >

                  <!-- 삭제 버튼 (hover 시 표시) -->
                  <td class="px-4 py-3 text-center">
                    {#if hoveredRow === i}
                      <button
                        onclick={() => deleteYear(i)}
                        class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="삭제"
                      >
                        <TrashIcon size={16} />
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
              <!-- 총합계 행 -->
              <tr class="bg-blue-50 font-bold">
                <td class="px-4 py-3 text-gray-900">총계</td>
                <td class="px-4 py-3 text-center text-gray-700 text-xs">
                  {#if budgetDetails.length > 0}
                    {@const firstBudget = budgetDetails[0]}
                    {@const lastBudget = budgetDetails[budgetDetails.length - 1]}
                    {#if firstBudget.startDate && lastBudget.endDate}
                      {formatDate(firstBudget.startDate)} ~ {formatDate(lastBudget.endDate)}
                    {:else}
                      전체 기간
                    {/if}
                  {:else}
                    전체 기간
                  {/if}
                </td>
                <td class="px-4 py-3 text-right text-green-800"
                  >{formatRDCurrency(budgetSummary.totalGovernmentFunding)}</td
                >
                <td class="px-4 py-3 text-right text-orange-800"
                  >{formatRDCurrency(budgetSummary.totalCompanyCash)}</td
                >
                <td class="px-4 py-3 text-right text-purple-800"
                  >{formatRDCurrency(budgetSummary.totalCompanyInKind)}</td
                >
                <td class="px-4 py-3 text-right text-blue-800"
                  >{formatRDCurrency(budgetSummary.totalCash)}</td
                >
                <td class="px-4 py-3 text-right text-purple-800"
                  >{formatRDCurrency(budgetSummary.totalInKind)}</td
                >
                <td class="px-4 py-3 text-right text-gray-900"
                  >{formatRDCurrency(budgetSummary.totalBudget)}</td
                >
                <td class="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 다음 연차 추가 버튼 -->
        <div class="flex justify-center">
          <ThemeButton variant="ghost" size="sm" onclick={addNewYear}>
            <PlusIcon size={16} class="mr-1" />
            다음 연차 추가
          </ThemeButton>
        </div>

        <!-- 불일치 경고 섹션 -->
        {#if budgetDetails && budgetDetails.some((b) => b.hasMismatch)}
          <div class="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div class="text-sm text-red-700">
              <span class="font-medium">!</span>
              {budgetDetails
                .filter((b) => b.hasMismatch)
                .map((b) => `${b.year}차년도`)
                .join(', ')}
              예산과 연구개발비가 일치하지 않습니다. 연구개발비를 수정해주세요.
            </div>
          </div>
        {/if}

        <!-- 비율 요약 -->
        <div class="grid grid-cols-2 gap-3 text-xs text-center mt-3">
          <div class="p-2 bg-green-50 rounded">
            <span class="text-green-700"
              >지원금 비율: {budgetSummary.governmentFundingRatio.toFixed(1)}%</span
            >
          </div>
          <div class="p-2 bg-orange-50 rounded">
            <span class="text-orange-700"
              >기업부담 비율: {budgetSummary.companyBurdenRatio.toFixed(1)}%</span
            >
          </div>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          <p class="text-sm mb-3">연차별 예산 데이터가 없습니다.</p>
          <ThemeButton variant="primary" size="sm" onclick={addNewYear}>
            <PlusIcon size={16} class="mr-1" />
            첫 연차 추가
          </ThemeButton>
        </div>
      {/if}
    </div>
  {:else}
    <!-- 상세한 예산 요약 -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <DollarSignIcon class="w-5 h-5 text-blue-600 mr-2" />
          <h4 class="font-semibold text-blue-900">예산 구조</h4>
        </div>
        <span class="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
          {budgetSummary.totalYears}년차 사업
        </span>
      </div>

      <!-- 총 사업비 -->
      <div class="mb-4 text-center">
        <div class="text-2xl font-bold text-blue-900">
          {formatRDCurrency(budgetSummary.totalBudget)}
        </div>
        <div class="text-sm text-blue-600">전체 사업비</div>
      </div>

      <!-- 자금 구조 -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
          <div class="text-lg font-semibold text-green-700">
            {formatRDCurrency(budgetSummary.totalGovernmentFunding)}
          </div>
          <div class="text-xs text-green-600">
            지원금 ({budgetSummary.governmentFundingRatio.toFixed(1)}%)
          </div>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-orange-700">
            {formatRDCurrency(budgetSummary.totalCompanyCash + budgetSummary.totalCompanyInKind)}
          </div>
          <div class="text-xs text-orange-600">
            기업부담금 ({budgetSummary.companyBurdenRatio.toFixed(1)}%)
          </div>
        </div>
      </div>

      <!-- 현금/현물 구조 -->
      <div class="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
        <div class="text-center">
          <div class="text-sm font-medium text-blue-700">
            {formatRDCurrency(budgetSummary.totalCash)}
          </div>
          <div class="text-xs text-blue-600">
            현금 ({budgetSummary.cashRatio.toFixed(1)}%)
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium text-purple-700">
            {formatRDCurrency(budgetSummary.totalInKind)}
          </div>
          <div class="text-xs text-purple-600">
            현물 ({budgetSummary.inKindRatio.toFixed(1)}%)
          </div>
        </div>
      </div>

      <!-- 세부 기업부담금 구조 -->
      {#if budgetSummary.totalCompanyCash > 0 || budgetSummary.totalCompanyInKind > 0}
        <div class="mt-3 pt-3 border-t border-blue-200">
          <div class="text-xs text-blue-600 mb-2">기업부담금 상세</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">현금:</span>
              <span class="font-medium">{formatRDCurrency(budgetSummary.totalCompanyCash)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">현물:</span>
              <span class="font-medium">{formatRDCurrency(budgetSummary.totalCompanyInKind)}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
{:else}
  <div class="py-4 text-center">
    <div class="text-sm text-gray-500 mb-2">예산이 설정되지 않았습니다</div>
    <div class="text-xs text-gray-400">프로젝트 상세에서 예산을 설정해주세요</div>
  </div>
{/if}
