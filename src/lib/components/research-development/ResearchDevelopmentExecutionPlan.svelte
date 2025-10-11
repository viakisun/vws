<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatCurrency, formatNumber } from '$lib/utils/format'
  import { DollarSignIcon, EditIcon, TrashIcon } from '@lucide/svelte'
  import * as budgetUtilsImported from './utils/budgetUtils'
  import * as calculationUtilsImported from './utils/calculationUtils'

  const {
    projectBudgets = [],
    budgetUpdateKey = 0,
    evidencePeriod = 1,
    onEditBudget,
    onRemoveBudget,
    onAddBudget,
  }: {
    projectBudgets: any[]
    budgetUpdateKey?: number
    evidencePeriod?: number
    onEditBudget: (budget: any) => void
    onRemoveBudget: (budgetId: number) => void
    onAddBudget?: () => void
  } = $props()
</script>

<div class="flex items-center justify-between mb-6">
  <h3 class="text-lg font-semibold text-gray-900">집행 계획</h3>
  <div class="flex items-center gap-2">
    {#if onAddBudget}
      <ThemeButton variant="primary" size="sm" onclick={onAddBudget}>
        <DollarSignIcon size={16} class="mr-1" />
        새 연차 추가
      </ThemeButton>
    {/if}
  </div>
</div>

<!-- 단위 안내 -->
<div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
  <div class="flex items-center justify-between">
    <div class="text-sm text-gray-700">
      <span class="font-medium">금액 단위: 천원</span>
      <span class="ml-4 text-gray-600"> (현금) | (현물) </span>
    </div>
    <div class="text-xs text-gray-600">예: 1,000 = 1,000천원</div>
  </div>
</div>

<div class="overflow-x-auto">
  <table class="w-full divide-y divide-gray-200" style:min-width="100%">
    <thead class="bg-gray-50">
      <tr>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
          >연차</th
        >
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>인건비</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>연구재료비</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>연구활동비</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>연구수당</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>간접비</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          <div>총 예산</div>
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
          >액션</th
        >
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#key budgetUpdateKey}
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
          {@const personnelInKind = Number(budgetUtilsImported.getPersonnelCostInKind(budget)) || 0}
          {@const materialInKind =
            Number(budgetUtilsImported.getResearchMaterialCostInKind(budget)) || 0}
          {@const activityInKind =
            Number(budgetUtilsImported.getResearchActivityCostInKind(budget)) || 0}
          {@const stipendInKind = Number(budgetUtilsImported.getResearchStipendInKind(budget)) || 0}
          {@const indirectInKind = Number(budgetUtilsImported.getIndirectCostInKind(budget)) || 0}
          {@const inKindTotal =
            personnelInKind + materialInKind + activityInKind + stipendInKind + indirectInKind}
          {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
            budget,
            projectBudgets,
            evidencePeriod,
          )}
          <tr
            class="hover:bg-gray-50 {mismatchInfo?.hasMismatch
              ? 'bg-red-50 border-l-4 border-red-400'
              : ''}"
          >
            <!-- 연차 -->
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
              <div
                class="text-sm cursor-help"
                title={budgetUtilsImported.formatPeriodTooltip(budget)}
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium">{budgetUtilsImported.formatPeriodDisplay(budget)}</span>
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
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-medium">
                  {formatCurrency(personnelCash, false)}
                </div>
                <div class="text-sm text-gray-600">
                  {formatCurrency(personnelInKind, false)}
                </div>
              </div>
            </td>
            <!-- 연구재료비 (현금/현물) -->
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-medium">
                  {formatCurrency(materialCash, false)}
                </div>
                <div class="text-sm text-gray-600">
                  {formatCurrency(materialInKind, false)}
                </div>
              </div>
            </td>
            <!-- 연구활동비 (현금/현물) -->
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-medium">
                  {formatCurrency(activityCash, false)}
                </div>
                <div class="text-sm text-gray-600">
                  {formatCurrency(activityInKind, false)}
                </div>
              </div>
            </td>
            <!-- 연구수당 (현금/현물) -->
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-medium">
                  {formatCurrency(stipendCash, false)}
                </div>
                <div class="text-sm text-gray-600">
                  {formatCurrency(stipendInKind, false)}
                </div>
              </div>
            </td>
            <!-- 간접비 (현금/현물) -->
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-medium">
                  {formatCurrency(indirectCash, false)}
                </div>
                <div class="text-sm text-gray-600">
                  {formatCurrency(indirectInKind, false)}
                </div>
              </div>
            </td>
            <!-- 총 예산 (현금/현물) -->
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
              <div class="space-y-2">
                <div class="text-sm text-blue-600 font-semibold">
                  {formatCurrency(cashTotal, false)}
                </div>
                <div class="text-sm text-gray-600 font-semibold">
                  {formatCurrency(inKindTotal, false)}
                </div>
              </div>
            </td>
            <!-- 액션 -->
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
              <div class="flex space-x-1 justify-center">
                <ThemeButton variant="ghost" size="sm" onclick={() => onEditBudget(budget)}>
                  <EditIcon size={16} class="text-blue-600 mr-1" />
                  수정
                </ThemeButton>
                <ThemeButton variant="ghost" size="sm" onclick={() => onRemoveBudget(budget.id)}>
                  <TrashIcon size={16} class="text-red-600 mr-1" />
                  삭제
                </ThemeButton>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="px-4 py-12 text-center text-gray-500">
              <DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
              <p>등록된 사업비가 없습니다.</p>
            </td>
          </tr>
        {/each}
      {/key}

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
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.personnelCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.personnelInKind, false)}
              </div>
              <div class="text-sm text-gray-800 font-medium border-t pt-2">
                소계: {formatCurrency(
                  (totals.personnelCash || 0) + (totals.personnelInKind || 0),
                  false,
                )}
              </div>
            </div>
          </td>
          <!-- 연구재료비 (현금/현물) -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.researchMaterialCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.researchMaterialInKind, false)}
              </div>
              <div class="text-sm text-gray-800 font-medium border-t pt-2">
                소계: {formatCurrency(
                  (totals.researchMaterialCash || 0) + (totals.researchMaterialInKind || 0),
                  false,
                )}
              </div>
            </div>
          </td>
          <!-- 연구활동비 (현금/현물) -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.researchActivityCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.researchActivityInKind, false)}
              </div>
              <div class="text-sm text-gray-800 font-medium border-t pt-2">
                소계: {formatCurrency(
                  (totals.researchActivityCash || 0) + (totals.researchActivityInKind || 0),
                  false,
                )}
              </div>
            </div>
          </td>
          <!-- 연구수당 (현금/현물) -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.researchStipendCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.researchStipendInKind, false)}
              </div>
              <div class="text-sm text-gray-800 font-medium border-t pt-2">
                소계: {formatCurrency(
                  (totals.researchStipendCash || 0) + (totals.researchStipendInKind || 0),
                  false,
                )}
              </div>
            </div>
          </td>
          <!-- 간접비 (현금/현물) -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.indirectCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.indirectInKind, false)}
              </div>
              <div class="text-sm text-gray-800 font-medium border-t pt-2">
                소계: {formatCurrency(
                  (totals.indirectCash || 0) + (totals.indirectInKind || 0),
                  false,
                )}
              </div>
            </div>
          </td>
          <!-- 총 예산 (현금/현물) -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
            <div class="space-y-2">
              <div class="text-sm text-blue-600 font-medium">
                {formatCurrency(totals.totalCash, false)}
              </div>
              <div class="text-sm text-gray-600">
                {formatCurrency(totals.totalInKind, false)}
              </div>
              <div class="text-base text-gray-900 font-bold border-t-2 pt-2">
                총계: {formatCurrency(totals.totalBudget, false)}
              </div>
            </div>
          </td>
          <!-- 액션 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
            <div class="text-sm text-gray-500 text-center">-</div>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

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
