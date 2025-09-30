<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import type { AnnualBudget, AnnualBudgetFormData, BudgetSummary } from '$lib/types/project-budget'
  import { CheckIcon, PlusIcon, TrashIcon, XIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  // Props
  let {
    projectId = '',
    existingBudgets = [],
    readonly = false,
  } = $props<{
    projectId?: string
    existingBudgets?: AnnualBudget[]
    readonly?: boolean
  }>()

  // 폼 데이터 상태 - existingBudgets가 있으면 초기화, 없으면 빈 배열
  let budgetData = $state<AnnualBudgetFormData[]>([])
  let isSubmitting = $state(false)
  let validationErrors = $state<string[]>([])
  let initialized = $state(false)

  // 계산된 요약 정보
  let budgetSummary = $derived(calculateBudgetSummary(budgetData))

  // 연차 추가
  function addYear() {
    const nextYear = budgetData.length > 0 ? Math.max(...budgetData.map((b) => b.year)) + 1 : 1
    budgetData.push({
      year: nextYear,
      startDate: '',
      endDate: '',
      governmentFunding: 0,
      companyCash: 0,
      companyInKind: 0,
      notes: '',
    })
  }

  // 연차 삭제
  function removeYear(index: number) {
    if (budgetData.length > 1) {
      budgetData.splice(index, 1)
      // 연차 번호 재정렬
      budgetData.forEach((budget, idx) => {
        budget.year = idx + 1
      })
    }
  }

  // 예산 요약 계산
  function calculateBudgetSummary(budgets: AnnualBudgetFormData[]): BudgetSummary {
    const totalGovernmentFunding = budgets.reduce((sum, b) => sum + (b.governmentFunding || 0), 0)
    const totalCompanyCash = budgets.reduce((sum, b) => sum + (b.companyCash || 0), 0)
    const totalCompanyInKind = budgets.reduce((sum, b) => sum + (b.companyInKind || 0), 0)
    const totalCash = totalGovernmentFunding + totalCompanyCash
    const totalInKind = totalCompanyInKind
    const totalBudget = totalCash + totalInKind

    return {
      projectId,
      totalYears: budgets.length,
      totalBudget,
      totalGovernmentFunding,
      totalCompanyCash,
      totalCompanyInKind,
      totalCash,
      totalInKind,
      governmentFundingRatio: totalBudget > 0 ? (totalGovernmentFunding / totalBudget) * 100 : 0,
      companyBurdenRatio:
        totalBudget > 0 ? ((totalCompanyCash + totalCompanyInKind) / totalBudget) * 100 : 0,
      cashRatio: totalBudget > 0 ? (totalCash / totalBudget) * 100 : 0,
      inKindRatio: totalBudget > 0 ? (totalInKind / totalBudget) * 100 : 0,
    }
  }

  // 폼 검증
  function validateForm(): boolean {
    const errors: string[] = []

    if (budgetData.length === 0) {
      errors.push('최소 1개 연차의 예산을 입력해주세요.')
    }

    budgetData.forEach((budget) => {
      const yearLabel = `${budget.year}차년도`

      if (budget.governmentFunding < 0) {
        errors.push(`${yearLabel}: 지원금은 0 이상이어야 합니다.`)
      }

      if (budget.companyCash < 0) {
        errors.push(`${yearLabel}: 기업부담금(현금)은 0 이상이어야 합니다.`)
      }

      if (budget.companyInKind < 0) {
        errors.push(`${yearLabel}: 기업부담금(현물)은 0 이상이어야 합니다.`)
      }

      const yearTotal =
        (budget.governmentFunding || 0) + (budget.companyCash || 0) + (budget.companyInKind || 0)
      if (yearTotal === 0) {
        errors.push(`${yearLabel}: 총 예산이 0원입니다. 최소 하나의 예산 항목을 입력해주세요.`)
      }

      // 날짜 검증
      if (budget.startDate && budget.endDate) {
        const startDate = new Date(budget.startDate)
        const endDate = new Date(budget.endDate)
        if (startDate > endDate) {
          errors.push(`${yearLabel}: 시작일이 종료일보다 늦을 수 없습니다.`)
        }
      }
    })

    validationErrors = errors
    return errors.length === 0
  }

  // 저장
  async function saveBudgets() {
    if (!validateForm()) {
      return
    }

    isSubmitting = true

    try {
      const response = await window.fetch(
        `/api/project-management/projects/${projectId}/annual-budgets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budgets: budgetData }),
        },
      )

      const result = await response.json()

      if (result.success) {
        logger.log('예산 저장 성공')
        dispatch('budget-updated', result.data)
      } else {
        validationErrors = [result.error || '예산 저장에 실패했습니다.']
      }
    } catch (error) {
      logger.error('예산 저장 오류:', error)
      validationErrors = ['예산 저장 중 오류가 발생했습니다.']
    } finally {
      isSubmitting = false
    }
  }

  // 숫자 포맷팅
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  // Props 변경 시 데이터 동기화
  let lastProjectId = $state('')

  $effect(() => {
    // projectId가 변경되면 초기화 플래그 리셋
    if (projectId && projectId !== lastProjectId) {
      lastProjectId = projectId
      initialized = false

      if (existingBudgets && existingBudgets.length > 0) {
        budgetData = existingBudgets.map((budget) => ({
          year: budget.year,
          startDate: budget.startDate,
          endDate: budget.endDate,
          governmentFunding: budget.governmentFunding || 0,
          companyCash: budget.companyCash || 0,
          companyInKind: budget.companyInKind || 0,
          notes: budget.notes || '',
        }))
      } else {
        budgetData = []
        addYear()
      }
      initialized = true
    }
  })

  // 컴포넌트 마운트
  onMount(() => {
    // 초기화는 $effect에서 처리
  })
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">연차별 예산 계획</h2>

    <!-- 검증 오류 표시 -->
    {#if validationErrors.length > 0}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <XIcon class="w-5 h-5 text-red-500 mr-2" />
          <h3 class="text-sm font-medium text-red-800">검증 오류</h3>
        </div>
        <ul class="mt-2 text-sm text-red-700">
          {#each validationErrors as error (error)}
            <li>• {error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- 예산 요약 -->
    <div class="mb-8 p-4 bg-blue-50 rounded-lg">
      <h3 class="text-lg font-semibold text-blue-900 mb-4">예산 요약</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-blue-700 font-medium">전체 사업비</div>
          <div class="text-xl font-bold text-blue-900">
            {formatCurrency(budgetSummary.totalBudget)}원
          </div>
        </div>
        <div>
          <div class="text-green-700 font-medium">지원금 (현금)</div>
          <div class="text-lg font-semibold text-green-800">
            {formatCurrency(budgetSummary.totalGovernmentFunding)}원
            <span class="text-sm text-green-600"
              >({budgetSummary.governmentFundingRatio.toFixed(1)}%)</span
            >
          </div>
        </div>
        <div>
          <div class="text-orange-700 font-medium">기업부담금 (현금)</div>
          <div class="text-lg font-semibold text-orange-800">
            {formatCurrency(budgetSummary.totalCompanyCash)}원
          </div>
        </div>
        <div>
          <div class="text-purple-700 font-medium">기업부담금 (현물)</div>
          <div class="text-lg font-semibold text-purple-800">
            {formatCurrency(budgetSummary.totalCompanyInKind)}원
          </div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-blue-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-blue-700 font-medium">현금 총액:</span>
            <span class="ml-2 font-semibold"
              >{formatCurrency(budgetSummary.totalCash)}원 ({budgetSummary.cashRatio.toFixed(
                1,
              )}%)</span
            >
          </div>
          <div>
            <span class="text-blue-700 font-medium">현물 총액:</span>
            <span class="ml-2 font-semibold"
              >{formatCurrency(budgetSummary.totalInKind)}원 ({budgetSummary.inKindRatio.toFixed(
                1,
              )}%)</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 연차별 예산 입력 -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">연차별 세부 예산</h3>
        {#if !readonly}
          <button
            type="button"
            onclick={addYear}
            class="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            연차 추가
          </button>
        {/if}
      </div>

      {#each budgetData as budget, index (budget.year)}
        <div class="border border-gray-200 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900">
              {budget.year}차년도
            </h4>
            {#if !readonly && budgetData.length > 1}
              <button
                type="button"
                onclick={() => removeYear(index)}
                class="text-red-600 hover:text-red-800"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            {/if}
          </div>

          <!-- 날짜 입력 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label for="start-date-{index}" class="block text-sm font-medium text-gray-700 mb-1">
                시작일 (선택사항)
              </label>
              <input
                id="start-date-{index}"
                type="date"
                bind:value={budget.startDate}
                disabled={readonly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label for="end-date-{index}" class="block text-sm font-medium text-gray-700 mb-1">
                종료일 (선택사항)
              </label>
              <input
                id="end-date-{index}"
                type="date"
                bind:value={budget.endDate}
                disabled={readonly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <!-- 예산 입력 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                for="gov-funding-{index}"
                class="block text-sm font-medium text-green-700 mb-1"
              >
                지원금 (현금)
              </label>
              <input
                id="gov-funding-{index}"
                type="number"
                bind:value={budget.governmentFunding}
                min="0"
                step="1000"
                disabled={readonly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="company-cash-{index}"
                class="block text-sm font-medium text-orange-700 mb-1"
              >
                기업부담금 (현금)
              </label>
              <input
                id="company-cash-{index}"
                type="number"
                bind:value={budget.companyCash}
                min="0"
                step="1000"
                disabled={readonly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="company-inkind-{index}"
                class="block text-sm font-medium text-purple-700 mb-1"
              >
                기업부담금 (현물)
              </label>
              <input
                id="company-inkind-{index}"
                type="number"
                bind:value={budget.companyInKind}
                min="0"
                step="1000"
                disabled={readonly}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                placeholder="0"
              />
            </div>
          </div>

          <!-- 연차 소계 -->
          <div class="bg-gray-50 p-3 rounded-md mb-4">
            <div class="text-sm text-gray-600 space-y-1">
              <div class="flex justify-between">
                <span>현금 합계:</span>
                <span class="font-medium">
                  {formatCurrency((budget.governmentFunding || 0) + (budget.companyCash || 0))}원
                </span>
              </div>
              <div class="flex justify-between">
                <span>현물 합계:</span>
                <span class="font-medium">{formatCurrency(budget.companyInKind || 0)}원</span>
              </div>
              <div class="flex justify-between border-t pt-1 font-semibold text-gray-900">
                <span>{budget.year}차년도 사업비:</span>
                <span>
                  {formatCurrency(
                    (budget.governmentFunding || 0) +
                      (budget.companyCash || 0) +
                      (budget.companyInKind || 0),
                  )}원
                </span>
              </div>
            </div>
          </div>

          <!-- 메모 -->
          <div>
            <label for="notes-{index}" class="block text-sm font-medium text-gray-700 mb-1">
              메모 (선택사항)
            </label>
            <textarea
              id="notes-{index}"
              bind:value={budget.notes}
              disabled={readonly}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="연차별 특이사항이나 메모를 입력하세요"
            ></textarea>
          </div>
        </div>
      {/each}
    </div>

    <!-- 저장 버튼 -->
    {#if !readonly}
      <div class="flex justify-end mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onclick={saveBudgets}
          disabled={isSubmitting}
          class="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {#if isSubmitting}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            저장 중...
          {:else}
            <CheckIcon class="w-4 h-4 mr-2" />
            예산 저장
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
