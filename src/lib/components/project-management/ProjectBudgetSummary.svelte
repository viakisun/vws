<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import type { BudgetSummary } from '$lib/types/project-budget'
  import { formatDate } from '$lib/utils/format'
  import { DollarSignIcon } from '@lucide/svelte'

  let {
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

  // 예산 데이터 로드
  async function loadBudgetSummary() {
    if (!projectId) return

    try {
      loading = true
      error = null

      const response = await window.fetch(
        `/api/project-management/projects/${projectId}/annual-budgets`,
      )
      const result = await response.json()

      if (result.success && result.data) {
        budgetSummary = result.data.summary || null
        budgetDetails = result.data.budgets || null

        // 디버깅: 받은 데이터 확인
        logger.log('ProjectBudgetSummary - 받은 데이터:', {
          summary: budgetSummary,
          budgets: budgetDetails,
          첫번째예산: budgetDetails?.[0],
        })
      } else {
        budgetSummary = null
        budgetDetails = null
        logger.log('ProjectBudgetSummary - 데이터 로드 실패:', result)
      }
    } catch (err) {
      logger.error('예산 요약 로드 실패:', err)
      error = '예산 정보를 불러올 수 없습니다.'
    } finally {
      loading = false
    }
  }

  // 프로젝트 ID 변경 시 또는 refreshTrigger 변경 시 데이터 로드
  function updateData() {

    if (projectId) {
      loadBudgetSummary()
    }
    // refreshTrigger가 변경될 때마다 데이터 다시 로드
    if (refreshTrigger > 0) {
      loadBudgetSummary()
    }
  
}

  // 숫자 포맷팅 (천원 단위)
  function formatCurrency(amount: number): string {
    const thousands = amount / 1000
    return thousands.toLocaleString()
  }

  // 비율 색상
  // function getRatioColor(ratio: number): string {
  //   if (ratio >= 70) return 'text-green-600'
  //   if (ratio >= 50) return 'text-blue-600'
  //   if (ratio >= 30) return 'text-orange-600'
  //   return 'text-red-600'
  // }


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
      <!-- 연차별 예산 구성 표 -->
      {#if budgetDetails && budgetDetails.length > 0}
        <!-- 단위 표시 -->
        <div class="text-right text-sm text-gray-500 mb-2">단위: 천원</div>
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
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each budgetDetails as budget, i (i)}
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{budget.year}차년도</td>
                  <td class="px-4 py-3 text-center text-gray-700 text-xs">
                    {#if budget.startDate && budget.endDate}
                      {formatDate(budget.startDate)} ~ {formatDate(budget.endDate)}
                    {:else}
                      미정
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-right text-green-800"
                    >{formatCurrency(budget.governmentFunding)}</td
                  >
                  <td class="px-4 py-3 text-right text-orange-800"
                    >{formatCurrency(budget.companyCash)}</td
                  >
                  <td class="px-4 py-3 text-right text-purple-800"
                    >{formatCurrency(budget.companyInKind)}</td
                  >
                  <td class="px-4 py-3 text-right text-blue-800 font-medium"
                    >{formatCurrency(budget.totalCash)}</td
                  >
                  <td class="px-4 py-3 text-right text-purple-800 font-medium"
                    >{formatCurrency(budget.totalInKind)}</td
                  >
                  <td class="px-4 py-3 text-right text-gray-900 font-bold"
                    >{formatCurrency(budget.yearlyTotal)}</td
                  >
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
                  >{formatCurrency(budgetSummary.totalGovernmentFunding)}</td
                >
                <td class="px-4 py-3 text-right text-orange-800"
                  >{formatCurrency(budgetSummary.totalCompanyCash)}</td
                >
                <td class="px-4 py-3 text-right text-purple-800"
                  >{formatCurrency(budgetSummary.totalCompanyInKind)}</td
                >
                <td class="px-4 py-3 text-right text-blue-800"
                  >{formatCurrency(budgetSummary.totalCash)}</td
                >
                <td class="px-4 py-3 text-right text-purple-800"
                  >{formatCurrency(budgetSummary.totalInKind)}</td
                >
                <td class="px-4 py-3 text-right text-gray-900"
                  >{formatCurrency(budgetSummary.totalBudget)}</td
                >
              </tr>
            </tbody>
          </table>
        </div>

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
        <div class="text-center py-4 text-gray-500">
          <p class="text-sm">연차별 예산 데이터가 없습니다.</p>
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
          {formatCurrency(budgetSummary.totalBudget)}
        </div>
        <div class="text-sm text-blue-600">전체 사업비</div>
      </div>

      <!-- 자금 구조 -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
          <div class="text-lg font-semibold text-green-700">
            {formatCurrency(budgetSummary.totalGovernmentFunding)}
          </div>
          <div class="text-xs text-green-600">
            지원금 ({budgetSummary.governmentFundingRatio.toFixed(1)}%)
          </div>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-orange-700">
            {formatCurrency(budgetSummary.totalCompanyCash + budgetSummary.totalCompanyInKind)}
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
            {formatCurrency(budgetSummary.totalCash)}
          </div>
          <div class="text-xs text-blue-600">
            현금 ({budgetSummary.cashRatio.toFixed(1)}%)
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium text-purple-700">
            {formatCurrency(budgetSummary.totalInKind)}
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
              <span class="font-medium">{formatCurrency(budgetSummary.totalCompanyCash)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">현물:</span>
              <span class="font-medium">{formatCurrency(budgetSummary.totalCompanyInKind)}</span>
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
