<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatNumber } from '$lib/utils/format'
  import { DollarSignIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import RDEditableNumberCell from './RDEditableNumberCell.svelte'
  import * as budgetUtilsImported from './utils/rd-budget-utils'
  import * as calculationUtilsImported from './utils/rd-calculation-utils'
  import { formatRDCurrency } from './utils/rd-format-utils'

  const {
    projectId,
    refreshTrigger = 0,
  }: {
    projectId: string
    refreshTrigger?: number
  } = $props()

  // 예산 데이터 상태
  let projectBudgets = $state<any[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let evidencePeriod = $state(1) // 불일치 경고용

  // 노션 스타일 편집 상태
  let editingCell = $state<{ index: number; field: string } | null>(null)
  let hoveredRow = $state<number | null>(null)
  let isSaving = $state(false)

  // 숫자 언포맷팅 함수 (콤마 제거)
  function unformatNumber(value: string): number {
    if (!value) return 0
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  // 예산 데이터 로드
  async function loadProjectBudgets() {
    if (!projectId) return

    try {
      loading = true
      error = null

      const response = await fetch(
        `/api/research-development/project-budgets?projectId=${projectId}`,
      )
      const result = await response.json()

      if (result.success && result.data) {
        projectBudgets = result.data || []
      } else {
        projectBudgets = []
      }
    } catch (err) {
      logger.error('집행 계획 로드 실패:', err)
      error = '집행 계획을 불러올 수 없습니다.'
    } finally {
      loading = false
    }
  }

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
    if (!projectBudgets) return

    // 숫자 필드인 경우 콤마 제거하여 숫자로 변환
    const numericValue = typeof value === 'string' ? unformatNumber(value) : value

    // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
    projectBudgets[index] = {
      ...projectBudgets[index],
      [field]: numericValue,
    }

    // 즉시 저장
    saveBudget(projectBudgets[index])
  }

  // 단일 예산 저장
  async function saveBudget(budget: any) {
    if (!budget || !budget.id) return

    try {
      isSaving = true
      error = null

      const response = await fetch(`/api/research-development/project-budgets/${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodNumber: budget.period_number,
          startDate: budget.start_date,
          endDate: budget.end_date,
          personnelCostCash: parseFloat(String(budget.personnel_cost_cash)) || 0,
          researchMaterialCostCash: parseFloat(String(budget.research_material_cost_cash)) || 0,
          researchActivityCostCash: parseFloat(String(budget.research_activity_cost_cash)) || 0,
          researchStipendCash: parseFloat(String(budget.research_stipend_cash)) || 0,
          indirectCostCash: parseFloat(String(budget.indirect_cost_cash)) || 0,
          personnelCostInKind: parseFloat(String(budget.personnel_cost_in_kind)) || 0,
          researchMaterialCostInKind:
            parseFloat(String(budget.research_material_cost_in_kind)) || 0,
          researchActivityCostInKind:
            parseFloat(String(budget.research_activity_cost_in_kind)) || 0,
          researchStipendInKind: parseFloat(String(budget.research_stipend_in_kind)) || 0,
          indirectCostInKind: parseFloat(String(budget.indirect_cost_in_kind)) || 0,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 성공 시 데이터 새로고침
        await loadProjectBudgets()
      } else {
        error = result.error || '예산 저장에 실패했습니다.'
        // 실패 시 데이터 다시 로드하여 원래 상태로 복구
        await loadProjectBudgets()
      }
    } catch (err) {
      logger.error('예산 저장 실패:', err)
      error = '예산 저장 중 오류가 발생했습니다.'
      // 실패 시 데이터 다시 로드하여 원래 상태로 복구
      await loadProjectBudgets()
    } finally {
      isSaving = false
    }
  }

  // 새 연차 추가
  async function addNewYear() {
    try {
      isSaving = true
      error = null

      const nextPeriod =
        projectBudgets.length > 0 ? Math.max(...projectBudgets.map((b) => b.period_number)) + 1 : 1
      const lastBudget = projectBudgets[projectBudgets.length - 1]

      // 이전 연차의 종료일 다음날을 시작일로 설정
      let startDate = ''
      let endDate = ''

      if (lastBudget && lastBudget.end_date) {
        const lastEndDate = new Date(lastBudget.end_date)
        lastEndDate.setDate(lastEndDate.getDate() + 1)
        startDate = lastEndDate.toISOString().split('T')[0]

        // 1년 후를 종료일로 설정
        const newEndDate = new Date(startDate)
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)
        newEndDate.setDate(newEndDate.getDate() - 1)
        endDate = newEndDate.toISOString().split('T')[0]
      }

      const response = await fetch(`/api/research-development/project-budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          periodNumber: nextPeriod,
          startDate,
          endDate,
          personnelCostCash: 0,
          researchMaterialCostCash: 0,
          researchActivityCostCash: 0,
          researchStipendCash: 0,
          indirectCostCash: 0,
          personnelCostInKind: 0,
          researchMaterialCostInKind: 0,
          researchActivityCostInKind: 0,
          researchStipendInKind: 0,
          indirectCostInKind: 0,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadProjectBudgets()
      } else {
        error = result.error || '연차 추가에 실패했습니다.'
      }
    } catch (err) {
      logger.error('연차 추가 실패:', err)
      error = '연차 추가 중 오류가 발생했습니다.'
    } finally {
      isSaving = false
    }
  }

  // 연차 삭제
  async function deleteYear(index: number) {
    if (!projectBudgets) return

    const budget = projectBudgets[index]
    const confirmed = confirm(`${budget.period_number}차년도 예산을 삭제하시겠습니까?`)
    if (!confirmed) return

    try {
      isSaving = true
      error = null

      const response = await fetch(`/api/research-development/project-budgets/${budget.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadProjectBudgets()
      } else {
        error = result.error || '예산 삭제에 실패했습니다.'
      }
    } catch (err) {
      logger.error('예산 삭제 실패:', err)
      error = '예산 삭제 중 오류가 발생했습니다.'
    } finally {
      isSaving = false
    }
  }

  // refreshTrigger 변경 시 데이터 새로고침
  $effect(() => {
    const _ = refreshTrigger
    if (refreshTrigger > 0) {
      loadProjectBudgets()
    }
  })

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    loadProjectBudgets()
  })
</script>

{#if loading}
  <div class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span class="ml-3 text-gray-500">로딩 중...</span>
  </div>
{:else}
  <!-- 헤더 & 저장 상태 -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">집행 계획</h3>

    {#if isSaving}
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        <span>저장 중...</span>
      </div>
    {/if}
  </div>

  <!-- 에러 메시지 -->
  {#if error}
    <div class="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded text-sm text-red-700">
      {error}
    </div>
  {/if}

  <!-- 단위 안내 -->
  <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-700">
        <span class="font-medium">금액 단위: 원</span>
        <span class="ml-4 text-gray-600"> (현금) | (현물) </span>
      </div>
      <div class="text-xs text-gray-600">클릭하여 바로 편집</div>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-sm border border-gray-200 rounded-lg">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left font-medium text-gray-700 border-b w-24">연차</th>
          <th class="px-4 py-3 text-right font-medium text-blue-700 border-b">인건비</th>
          <th class="px-4 py-3 text-right font-medium text-green-700 border-b">연구재료비</th>
          <th class="px-4 py-3 text-right font-medium text-orange-700 border-b">연구활동비</th>
          <th class="px-4 py-3 text-right font-medium text-purple-700 border-b">연구수당</th>
          <th class="px-4 py-3 text-right font-medium text-pink-700 border-b">간접비</th>
          <th class="px-4 py-3 text-right font-medium text-gray-900 border-b">총 예산</th>
          <th class="px-4 py-3 text-center font-medium text-gray-700 border-b w-16"></th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#if projectBudgets && projectBudgets.length > 0}
          {#each projectBudgets as budget, i (budget.id || i)}
            {@const personnelCash = Number(budgetUtilsImported.getPersonnelCostCash(budget)) || 0}
            {@const materialCash =
              Number(budgetUtilsImported.getResearchMaterialCostCash(budget)) || 0}
            {@const activityCash =
              Number(budgetUtilsImported.getResearchActivityCostCash(budget)) || 0}
            {@const stipendCash = Number(budgetUtilsImported.getResearchStipendCash(budget)) || 0}
            {@const indirectCash = Number(budgetUtilsImported.getIndirectCostCash(budget)) || 0}
            {@const cashTotal =
              personnelCash + materialCash + activityCash + stipendCash + indirectCash}
            {@const personnelInKind =
              Number(budgetUtilsImported.getPersonnelCostInKind(budget)) || 0}
            {@const materialInKind =
              Number(budgetUtilsImported.getResearchMaterialCostInKind(budget)) || 0}
            {@const activityInKind =
              Number(budgetUtilsImported.getResearchActivityCostInKind(budget)) || 0}
            {@const stipendInKind =
              Number(budgetUtilsImported.getResearchStipendInKind(budget)) || 0}
            {@const indirectInKind = Number(budgetUtilsImported.getIndirectCostInKind(budget)) || 0}
            {@const inKindTotal =
              personnelInKind + materialInKind + activityInKind + stipendInKind + indirectInKind}
            {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
              budget,
              projectBudgets,
              evidencePeriod,
            )}
            <tr
              class="group hover:bg-gray-50 transition-colors {mismatchInfo?.hasMismatch
                ? 'bg-red-50 border-l-4 border-red-400'
                : ''}"
              onmouseenter={() => (hoveredRow = i)}
              onmouseleave={() => (hoveredRow = null)}
            >
              <!-- 연차 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                <div
                  class="text-sm cursor-help"
                  title={budgetUtilsImported.formatPeriodTooltip(budget)}
                >
                  <div class="flex items-center gap-2">
                    <span class="font-medium"
                      >{budgetUtilsImported.formatPeriodDisplay(budget)}</span
                    >
                    {#if mismatchInfo?.hasMismatch}
                      <span class="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded font-medium">
                        !
                      </span>
                    {/if}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">현금 | 현물</div>
                </div>
              </td>
              <!-- 인건비 (현금/현물) -->
              <td class="px-4 py-4 text-sm text-right">
                <div class="flex flex-col gap-2">
                  <!-- 현금 -->
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.personnel_cost_cash}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'personnel_cost_cash'}
                      onStartEdit={() => startEditingCell(i, 'personnel_cost_cash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'personnel_cost_cash', value)}
                      textColor="text-blue-700"
                    />
                  </div>

                  <!-- 현물 -->
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.personnel_cost_in_kind}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'personnel_cost_in_kind'}
                      onStartEdit={() => startEditingCell(i, 'personnel_cost_in_kind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'personnel_cost_in_kind', value)}
                      textColor="text-blue-500"
                    />
                  </div>
                </div>
              </td>
              <!-- 연구재료비 (현금/현물) -->
              <td class="px-4 py-4 text-sm text-right">
                <div class="flex flex-col gap-2">
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_material_cost_cash}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_material_cost_cash'}
                      onStartEdit={() => startEditingCell(i, 'research_material_cost_cash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) =>
                        handleValueChange(i, 'research_material_cost_cash', value)}
                      textColor="text-green-700"
                    />
                  </div>
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_material_cost_in_kind}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_material_cost_in_kind'}
                      onStartEdit={() => startEditingCell(i, 'research_material_cost_in_kind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) =>
                        handleValueChange(i, 'research_material_cost_in_kind', value)}
                      textColor="text-green-500"
                    />
                  </div>
                </div>
              </td>
              <!-- 연구활동비 (현금/현물) -->
              <td class="px-4 py-4 text-sm text-right">
                <div class="flex flex-col gap-2">
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_activity_cost_cash}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_activity_cost_cash'}
                      onStartEdit={() => startEditingCell(i, 'research_activity_cost_cash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) =>
                        handleValueChange(i, 'research_activity_cost_cash', value)}
                      textColor="text-orange-700"
                    />
                  </div>
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_activity_cost_in_kind}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_activity_cost_in_kind'}
                      onStartEdit={() => startEditingCell(i, 'research_activity_cost_in_kind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) =>
                        handleValueChange(i, 'research_activity_cost_in_kind', value)}
                      textColor="text-orange-500"
                    />
                  </div>
                </div>
              </td>
              <!-- 연구수당 (현금/현물) -->
              <td class="px-4 py-4 text-sm text-right">
                <div class="flex flex-col gap-2">
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_stipend_cash}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_stipend_cash'}
                      onStartEdit={() => startEditingCell(i, 'research_stipend_cash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'research_stipend_cash', value)}
                      textColor="text-purple-700"
                    />
                  </div>
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.research_stipend_in_kind}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'research_stipend_in_kind'}
                      onStartEdit={() => startEditingCell(i, 'research_stipend_in_kind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'research_stipend_in_kind', value)}
                      textColor="text-purple-500"
                    />
                  </div>
                </div>
              </td>
              <!-- 간접비 (현금/현물) -->
              <td class="px-4 py-4 text-sm text-right">
                <div class="flex flex-col gap-2">
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.indirect_cost_cash}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'indirect_cost_cash'}
                      onStartEdit={() => startEditingCell(i, 'indirect_cost_cash')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'indirect_cost_cash', value)}
                      textColor="text-pink-700"
                    />
                  </div>
                  <div class="min-h-[2rem] flex items-center justify-end">
                    <RDEditableNumberCell
                      value={budget.indirect_cost_in_kind}
                      isEditing={editingCell?.index === i &&
                        editingCell?.field === 'indirect_cost_in_kind'}
                      onStartEdit={() => startEditingCell(i, 'indirect_cost_in_kind')}
                      onStopEdit={stopEditingCell}
                      onChange={(value) => handleValueChange(i, 'indirect_cost_in_kind', value)}
                      textColor="text-pink-500"
                    />
                  </div>
                </div>
              </td>
              <!-- 총 예산 (현금/현물) -->
              <td class="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                <div class="flex flex-col gap-2">
                  <div
                    class="min-h-[2rem] flex items-center justify-end text-blue-600 font-semibold"
                  >
                    {formatRDCurrency(cashTotal)}
                  </div>
                  <div
                    class="min-h-[2rem] flex items-center justify-end text-gray-600 font-semibold"
                  >
                    {formatRDCurrency(inKindTotal)}
                  </div>
                </div>
              </td>
              <!-- 삭제 버튼 (hover 시 표시) -->
              <td class="px-4 py-4 text-center">
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
        {:else}
          <tr>
            <td colspan="8" class="px-4 py-12 text-center text-gray-500">
              <DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
              <p class="mb-3">등록된 사업비가 없습니다.</p>
              <ThemeButton variant="primary" size="sm" onclick={addNewYear}>
                <PlusIcon size={16} class="mr-1" />
                첫 연차 추가
              </ThemeButton>
            </td>
          </tr>
        {/if}

        <!-- 합계 행 -->
        {#if projectBudgets && projectBudgets.length > 0}
          {@const totals = calculationUtilsImported.calculateBudgetTotals(projectBudgets)}
          <tr class="bg-gray-100 border-t-2 border-gray-300">
            <!-- 연차 -->
            <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900 w-24">
              <div class="text-center">
                <div class="font-medium">합계</div>
                <div class="text-xs text-gray-600">
                  {projectBudgets.length}개 연차
                </div>
              </div>
            </td>
            <!-- 인건비 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-blue-700 font-medium">
                  {formatRDCurrency(totals.personnelCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-blue-500">
                  {formatRDCurrency(totals.personnelInKind)}
                </div>
                <div class="text-sm text-gray-800 font-medium border-t pt-2">
                  소계: {formatRDCurrency(
                    (totals.personnelCash || 0) + (totals.personnelInKind || 0),
                  )}
                </div>
              </div>
            </td>
            <!-- 연구재료비 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-green-700 font-medium">
                  {formatRDCurrency(totals.researchMaterialCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-green-500">
                  {formatRDCurrency(totals.researchMaterialInKind)}
                </div>
                <div class="text-sm text-gray-800 font-medium border-t pt-2">
                  소계: {formatRDCurrency(
                    (totals.researchMaterialCash || 0) + (totals.researchMaterialInKind || 0),
                  )}
                </div>
              </div>
            </td>
            <!-- 연구활동비 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-orange-700 font-medium">
                  {formatRDCurrency(totals.researchActivityCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-orange-500">
                  {formatRDCurrency(totals.researchActivityInKind)}
                </div>
                <div class="text-sm text-gray-800 font-medium border-t pt-2">
                  소계: {formatRDCurrency(
                    (totals.researchActivityCash || 0) + (totals.researchActivityInKind || 0),
                  )}
                </div>
              </div>
            </td>
            <!-- 연구수당 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-purple-700 font-medium">
                  {formatRDCurrency(totals.researchStipendCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-purple-500">
                  {formatRDCurrency(totals.researchStipendInKind)}
                </div>
                <div class="text-sm text-gray-800 font-medium border-t pt-2">
                  소계: {formatRDCurrency(
                    (totals.researchStipendCash || 0) + (totals.researchStipendInKind || 0),
                  )}
                </div>
              </div>
            </td>
            <!-- 간접비 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-pink-700 font-medium">
                  {formatRDCurrency(totals.indirectCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-pink-500">
                  {formatRDCurrency(totals.indirectInKind)}
                </div>
                <div class="text-sm text-gray-800 font-medium border-t pt-2">
                  소계: {formatRDCurrency(
                    (totals.indirectCash || 0) + (totals.indirectInKind || 0),
                  )}
                </div>
              </div>
            </td>
            <!-- 총 예산 (현금/현물) -->
            <td class="px-4 py-4 text-sm text-gray-900 text-right">
              <div class="flex flex-col gap-2">
                <div class="min-h-[2rem] flex items-center justify-end text-blue-600 font-medium">
                  {formatRDCurrency(totals.totalCash)}
                </div>
                <div class="min-h-[2rem] flex items-center justify-end text-gray-600">
                  {formatRDCurrency(totals.totalInKind)}
                </div>
                <div class="text-base text-gray-900 font-bold border-t-2 pt-2">
                  총계: {formatRDCurrency(totals.totalBudget)}
                </div>
              </div>
            </td>
            <!-- 빈 컬럼 -->
            <td class="px-4 py-4"></td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- 다음 연차 추가 버튼 -->
  {#if projectBudgets && projectBudgets.length > 0}
    <div class="flex justify-center mt-4">
      <ThemeButton variant="ghost" size="sm" onclick={addNewYear}>
        <PlusIcon size={16} class="mr-1" />
        다음 연차 추가
      </ThemeButton>
    </div>
  {/if}

  <!-- 불일치 경고 섹션 -->
  {#if projectBudgets.some((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, evidencePeriod)?.hasMismatch)}
    <div class="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
      <div class="text-sm text-red-700">
        <span class="font-medium">!</span>
        다음 연차의 예산과 연구개발비가 일치하지 않습니다:
        <div class="mt-2 space-y-1">
          {#each projectBudgets.filter((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, evidencePeriod)?.hasMismatch) as budget}
            {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
              budget,
              projectBudgets,
              evidencePeriod,
            )}
            <div class="text-xs text-red-600">
              {budgetUtilsImported.formatPeriodDisplay(budget)}: 예산 {formatNumber(
                mismatchInfo?.annualBudgetTotal || 0,
                true,
              )} vs 연구개발비 {formatNumber(mismatchInfo?.researchCostTotal || 0, true)}
              <div class="ml-2 mt-1 text-gray-500">
                현금: {formatNumber(mismatchInfo?.annualBudgetCash || 0, true)} vs {formatNumber(
                  mismatchInfo?.researchCostCash || 0,
                  true,
                )}
              </div>
              <div class="ml-2 text-gray-500">
                현물: {formatNumber(mismatchInfo?.annualBudgetInKind || 0, true)} vs {formatNumber(
                  mismatchInfo?.researchCostInKind || 0,
                  true,
                )}
              </div>
            </div>
          {/each}
        </div>
        <div class="mt-2 text-xs text-red-600 font-medium">
          해당 연차의 연구개발비를 수정해주세요.
        </div>
      </div>
    </div>
  {/if}
{/if}
