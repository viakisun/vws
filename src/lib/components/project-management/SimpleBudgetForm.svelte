<script lang="ts">
  import type { AnnualBudgetFormData } from '$lib/types/project-budget'
  import { toUTC } from '$lib/utils/date-handler'
  import { formatDateForInput } from '$lib/utils/format'
  import { CheckIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let { projectId } = $props<{
    projectId: string
  }>()

  // 간단한 연차별 예산 데이터 (기간 포함)
  let budgets = $state<AnnualBudgetFormData[]>([
    {
      year: 1,
      startDate: '',
      endDate: '',
      governmentFunding: 0,
      companyCash: 0,
      companyInKind: 0
    }
  ])

  let isSubmitting = $state(false)
  let validationErrors = $state<string[]>([])
  let isLoading = $state(true)

  // 기존 예산 데이터 로드
  async function loadExistingBudgets() {
    if (!projectId) return

    try {
      isLoading = true
      const response = await fetch(`/api/project-management/projects/${projectId}/annual-budgets`)
      const result = await response.json()

      if (result.success && result.data?.budgets && result.data.budgets.length > 0) {
        // 기존 예산 데이터가 있으면 로드 (UTC 날짜 처리 함수 사용)
        console.log('기존 예산 데이터 로드:', result.data.budgets)
        budgets = result.data.budgets.map(budget => ({
          year: budget.year,
          startDate: budget.startDate ? formatDateForInput(budget.startDate) : '',
          endDate: budget.endDate ? formatDateForInput(budget.endDate) : '',
          governmentFunding: budget.governmentFunding || 0,
          companyCash: budget.companyCash || 0,
          companyInKind: budget.companyInKind || 0,
          notes: budget.notes || ''
        }))
        console.log('변환된 예산 데이터:', budgets)
      } else {
        console.log('기존 예산 데이터 없음 - 기본값 사용')
      }
    } catch (error) {
      console.error('기존 예산 데이터 로드 실패:', error)
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 기존 데이터 로드
  $effect(() => {
    if (projectId) {
      loadExistingBudgets()
    }
  })

  // 연차 추가
  function addYear() {
    const nextYear = budgets.length + 1
    const lastBudget = budgets[budgets.length - 1]

    // 이전 연차의 종료일 다음날을 시작일로 설정
    let startDate = ''
    let endDate = ''

    if (lastBudget?.endDate) {
      // UTC 기준으로 날짜 계산
      const lastEndUTC = toUTC(lastBudget.endDate)
      const lastEndDate = new Date(lastEndUTC)

      // 다음날을 시작일로 설정
      const nextStartDate = new Date(lastEndDate)
      nextStartDate.setUTCDate(nextStartDate.getUTCDate() + 1)
      startDate = formatDateForInput(nextStartDate.toISOString())

      // 1년 후를 종료일로 설정
      const nextEndDate = new Date(nextStartDate)
      nextEndDate.setUTCFullYear(nextEndDate.getUTCFullYear() + 1)
      nextEndDate.setUTCDate(nextEndDate.getUTCDate() - 1)
      endDate = formatDateForInput(nextEndDate.toISOString())
    }

    budgets.push({
      year: nextYear,
      startDate,
      endDate,
      governmentFunding: 0,
      companyCash: 0,
      companyInKind: 0
    })
  }

  // 연차 삭제
  function removeYear(index: number) {
    if (budgets.length > 1) {
      budgets.splice(index, 1)
      // 연차 번호 재정렬
      budgets.forEach((budget, idx) => {
        budget.year = idx + 1
      })
    }
  }

  // 총액 계산
  function calculateTotal(budget: AnnualBudgetFormData): number {
    return (budget.governmentFunding || 0) + (budget.companyCash || 0) + (budget.companyInKind || 0)
  }

  // 전체 총액 계산
  function calculateGrandTotal(): number {
    return budgets.reduce((sum, budget) => sum + calculateTotal(budget), 0)
  }

  // 전체 사업 기간 계산 (UTC 기준)
  function calculateProjectPeriod(): { startDate: string | null; endDate: string | null } {
    const validBudgets = budgets.filter(b => b.startDate && b.endDate)
    if (validBudgets.length === 0) {
      return { startDate: null, endDate: null }
    }

    // UTC 기준으로 날짜 변환
    const startDatesUTC = validBudgets.map(b => new Date(toUTC(b.startDate!)))
    const endDatesUTC = validBudgets.map(b => new Date(toUTC(b.endDate!)))

    const projectStartDate = new Date(Math.min(...startDatesUTC.map(d => d.getTime())))
    const projectEndDate = new Date(Math.max(...endDatesUTC.map(d => d.getTime())))

    return {
      startDate: formatDateForInput(projectStartDate.toISOString()),
      endDate: formatDateForInput(projectEndDate.toISOString())
    }
  }

  // 검증
  function validateForm(): boolean {
    const errors: string[] = []

    budgets.forEach((budget, index) => {
      const yearLabel = `${budget.year}차년도`

      // 기간 검증
      if (!budget.startDate) {
        errors.push(`${yearLabel}: 시작일을 입력해주세요.`)
      }
      if (!budget.endDate) {
        errors.push(`${yearLabel}: 종료일을 입력해주세요.`)
      }

      // 날짜 순서 검증 (UTC 기준)
      if (budget.startDate && budget.endDate) {
        const startDateUTC = new Date(toUTC(budget.startDate))
        const endDateUTC = new Date(toUTC(budget.endDate))
        if (startDateUTC > endDateUTC) {
          errors.push(`${yearLabel}: 시작일이 종료일보다 늦을 수 없습니다.`)
        }
      }

      // 예산 검증
      const total = calculateTotal(budget)
      if (total === 0) {
        errors.push(`${yearLabel}: 예산을 입력해주세요.`)
      }
    })

    // 연차 간 기간 중복 검증
    for (let i = 0; i < budgets.length - 1; i++) {
      const current = budgets[i]
      const next = budgets[i + 1]

      if (current.endDate && next.startDate) {
        const currentEndUTC = new Date(toUTC(current.endDate))
        const nextStartUTC = new Date(toUTC(next.startDate))

        if (currentEndUTC >= nextStartUTC) {
          errors.push(`${current.year}차년도와 ${next.year}차년도 기간이 중복됩니다.`)
        }
      }
    }

    validationErrors = errors
    return errors.length === 0
  }

  // 저장
  async function saveBudgets() {
    if (!validateForm()) return

    isSubmitting = true

    try {
      // 전체 사업 기간 계산
      const projectPeriod = calculateProjectPeriod()

      const response = await fetch(`/api/project-management/projects/${projectId}/annual-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          budgets,
          projectPeriod // 전체 사업 기간도 함께 전송
        })
      })

      const result = await response.json()

      if (result.success) {
        dispatch('budgetSaved', result.data)
      } else {
        validationErrors = [result.error || '예산 저장에 실패했습니다.']
      }
    } catch (error) {
      console.error('예산 저장 오류:', error)
      validationErrors = ['예산 저장 중 오류가 발생했습니다.']
    } finally {
      isSubmitting = false
    }
  }

  // 숫자 포맷팅
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('ko-KR').format(num)
  }
</script>

<div class="space-y-6">
  <div class="text-center">
    <h3 class="text-lg font-semibold text-gray-900">연차별 연구개발비 예산</h3>
    <p class="text-sm text-gray-600 mt-1">지원금, 기업부담금, 현물지원을 연차별로 입력하세요</p>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">기존 예산 데이터를 불러오는 중...</span>
    </div>
  {:else}
    <!-- 검증 오류 표시 -->
    {#if validationErrors.length > 0}
      <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
        <ul class="text-sm text-red-700">
          {#each validationErrors as error}
            <li>• {error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- 연차별 예산 입력 -->
    <div class="space-y-4">
      {#each budgets as budget, index}
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900">{budget.year}차년도</h4>
            {#if budgets.length > 1}
              <button
                type="button"
                onclick={() => removeYear(index)}
                class="text-red-600 hover:text-red-800"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            {/if}
          </div>

          <!-- 기간 설정 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="start-date-{index}" class="block text-sm font-medium text-gray-700 mb-1">
                시작일 *
              </label>
              <input
                id="start-date-{index}"
                type="date"
                bind:value={budget.startDate}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="end-date-{index}" class="block text-sm font-medium text-gray-700 mb-1">
                종료일 *
              </label>
              <input
                id="end-date-{index}"
                type="date"
                bind:value={budget.endDate}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- 예산 입력 -->
          <div class="space-y-3">
            <!-- 단위 안내 -->
            <div class="text-xs text-gray-500 text-center bg-gray-50 py-1 rounded">
              금액 단위: 천원 (예: 1000 입력 = 1,000천원)
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  for="gov-funding-{index}"
                  class="block text-sm font-medium text-green-700 mb-1"
                >
                  지원금
                </label>
                <div class="relative">
                  <input
                    id="gov-funding-{index}"
                    type="number"
                    bind:value={budget.governmentFunding}
                    min="0"
                    step="1000"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                  <div
                    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  >
                    <span class="text-gray-500 text-sm">천원</span>
                  </div>
                </div>
              </div>
              <div>
                <label
                  for="company-cash-{index}"
                  class="block text-sm font-medium text-orange-700 mb-1"
                >
                  기업부담금
                </label>
                <div class="relative">
                  <input
                    id="company-cash-{index}"
                    type="number"
                    bind:value={budget.companyCash}
                    min="0"
                    step="1000"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                  <div
                    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  >
                    <span class="text-gray-500 text-sm">천원</span>
                  </div>
                </div>
              </div>
              <div>
                <label
                  for="company-inkind-{index}"
                  class="block text-sm font-medium text-purple-700 mb-1"
                >
                  현물 지원
                </label>
                <div class="relative">
                  <input
                    id="company-inkind-{index}"
                    type="number"
                    bind:value={budget.companyInKind}
                    min="0"
                    step="1000"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <div
                    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  >
                    <span class="text-gray-500 text-sm">천원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 연차 소계 -->
          <div class="mt-3 p-3 bg-gray-50 rounded-md">
            <div class="text-sm font-medium text-gray-900">
              {budget.year}차년도 사업비: {formatNumber(calculateTotal(budget))}원
            </div>
            <div class="text-xs text-gray-500 mt-1">
              지원금 {formatNumber(budget.governmentFunding || 0)}천원 + 기업부담금 {formatNumber(
                budget.companyCash || 0
              )}천원 + 현물지원 {formatNumber(budget.companyInKind || 0)}천원
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- 연차 추가 버튼 -->
    <div class="text-center">
      <button
        type="button"
        onclick={addYear}
        class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        {budgets.length + 1}차년도 추가
      </button>
    </div>

    <!-- 전체 합계 및 사업 기간 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="text-center space-y-3">
        <!-- 전체 사업비 -->
        <div>
          <div class="text-sm text-blue-700 mb-1">전체 사업비</div>
          <div class="text-2xl font-bold text-blue-900">
            {formatNumber(calculateGrandTotal())}원
          </div>
          <div class="text-sm text-blue-600">
            {budgets.length}년차 사업 총액
          </div>
          <!-- 세부 내역 -->
          <div class="mt-2 text-xs text-blue-500 space-y-1">
            <div>
              지원금: {formatNumber(
                budgets.reduce((sum, b) => sum + (b.governmentFunding || 0), 0)
              )}천원
            </div>
            <div>
              기업부담금: {formatNumber(
                budgets.reduce((sum, b) => sum + (b.companyCash || 0), 0)
              )}천원
            </div>
            <div>
              현물지원: {formatNumber(
                budgets.reduce((sum, b) => sum + (b.companyInKind || 0), 0)
              )}천원
            </div>
          </div>
        </div>

        <!-- 전체 사업 기간 -->
        {#if calculateProjectPeriod().startDate && calculateProjectPeriod().endDate}
          {@const period = calculateProjectPeriod()}
          <div class="pt-3 border-t border-blue-200">
            <div class="text-sm text-blue-700 mb-1">전체 사업 기간</div>
            <div class="text-lg font-semibold text-blue-900">
              {period.startDate} ~ {period.endDate}
            </div>
            <div class="text-sm text-blue-600">연차별 기간으로부터 자동 계산</div>
          </div>
        {:else}
          <div class="pt-3 border-t border-blue-200">
            <div class="text-sm text-gray-500">
              연차별 기간을 설정하면 전체 사업 기간이 자동 계산됩니다
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- 저장 버튼 -->
    <div class="flex justify-center">
      <button
        type="button"
        onclick={saveBudgets}
        disabled={isSubmitting || calculateGrandTotal() === 0}
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
