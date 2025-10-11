<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    ChevronDownIcon,
    ChevronRightIcon,
    EditIcon,
    FileTextIcon,
    PlusIcon,
  } from '@lucide/svelte'
  import * as budgetUtilsImported from './utils/budgetUtils'
  import * as dataTransformers from './utils/dataTransformers'
  import * as memberUtilsImported from './utils/memberUtils'

  let {
    projectBudgets = [],
    validationData,
    selectedEvidencePeriod = 1,
    loadingEvidence = false,
    expandedEvidenceSections = {},
    onAddEvidence,
    onOpenEvidenceDetail,
    onToggleSection,
  }: {
    projectBudgets: any[]
    validationData: any
    selectedEvidencePeriod?: number
    loadingEvidence?: boolean
    expandedEvidenceSections?: Record<string, boolean>
    onAddEvidence: () => void
    onOpenEvidenceDetail: (item: any) => void
    onToggleSection: (sectionType: string) => void
  } = $props()
</script>

<div class="flex items-center justify-between mb-6">
  <div class="flex items-center gap-4">
    <h3 class="text-lg font-semibold text-gray-900">증빙 관리</h3>
    {#if projectBudgets.length > 0}
      <select
        bind:value={selectedEvidencePeriod}
        class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each projectBudgets as budget, i (i)}
          <option value={budgetUtilsImported.getPeriodNumber(budget)}>
            {budgetUtilsImported.formatPeriodDisplay(budget)}
          </option>
        {/each}
      </select>
    {/if}
  </div>
  <ThemeButton onclick={onAddEvidence} size="sm">
    <PlusIcon size={16} class="mr-2" />
    증빙 추가
  </ThemeButton>
</div>

{#if projectBudgets.length > 0}
  {@const currentBudget =
    projectBudgets.find((b) => budgetUtilsImported.getPeriodNumber(b) === selectedEvidencePeriod) ||
    projectBudgets[0]}
  {@const budgetCategories = dataTransformers.transformBudgetToCategories(currentBudget)}

  {#if loadingEvidence}
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-500">증빙 데이터를 로드하는 중...</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each budgetCategories as budgetCategory, i (i)}
        {@const categoryItems = validationData.items.filter(
          (item) => item.category_name === budgetCategory.name,
        )}
        {@const totalAmount = budgetCategory.cash + budgetCategory.inKind}
        {@const totalItems = categoryItems.length}
        {@const completedItems = categoryItems.filter((item) => item.status === 'completed').length}
        {@const inProgressItems = categoryItems.filter(
          (item) => item.status === 'in_progress',
        ).length}
        {@const overallProgress =
          totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0}

        <div class="border border-gray-200 rounded-lg">
          <!-- 카테고리 헤더 -->
          <button
            type="button"
            class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 w-full text-left"
            onclick={() => onToggleSection(budgetCategory.type)}
            onkeydown={(e) => e.key === 'Enter' && onToggleSection(budgetCategory.type)}
          >
            <div class="flex items-center space-x-3">
              {#if expandedEvidenceSections[budgetCategory.type]}
                <ChevronDownIcon size={16} class="text-gray-500" />
              {:else}
                <ChevronRightIcon size={16} class="text-gray-500" />
              {/if}
              <div>
                <h4 class="text-md font-medium text-gray-900">
                  {budgetCategory.name}
                </h4>
                <div class="text-xs text-gray-500">
                  예산: {formatCurrency(totalAmount)} | 증빙: {totalItems}개 | 완료: {completedItems}개
                  | 진행중: {inProgressItems}개
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="flex items-center">
                <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    class="h-2 rounded-full {overallProgress >= 100
                      ? 'bg-green-600'
                      : overallProgress >= 70
                        ? 'bg-blue-600'
                        : overallProgress >= 30
                          ? 'bg-yellow-500'
                          : 'bg-red-500'}"
                    style:width="{Math.min(overallProgress, 100)}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-600">{overallProgress}%</span>
              </div>
              <ThemeButton
                variant="ghost"
                size="sm"
                onclick={() => onOpenEvidenceDetail(budgetCategory)}
              >
                <PlusIcon size={14} class="mr-1" />
                추가
              </ThemeButton>
            </div>
          </button>

          <!-- 카테고리 내용 -->
          {#if expandedEvidenceSections[budgetCategory.type]}
            <div class="p-4 border-t border-gray-200">
              {#if categoryItems.length > 0}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                          >증빙 항목</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                          >금액</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                          >담당자</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                          >진행률</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                          >마감일</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                          >상태</th
                        >
                        <th
                          class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                          >액션</th
                        >
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each categoryItems as item, i (i)}
                        {@const isOverdue =
                          new Date(item.due_date) < new Date() && item.status !== 'completed'}
                        <tr class="hover:bg-gray-50">
                          <!-- 증빙 항목 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>

                          <!-- 금액 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            <span class="font-medium">{formatCurrency(item.budget_amount)}</span>
                          </td>

                          <!-- 담당자 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            <span class="text-gray-600"
                              >{memberUtilsImported.formatAssigneeNameFromFields(item)}</span
                            >
                          </td>

                          <!-- 진행률 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div class="flex items-center">
                              <div class="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  class="h-2 rounded-full {item.progress >= 100
                                    ? 'bg-green-600'
                                    : item.progress >= 70
                                      ? 'bg-blue-600'
                                      : item.progress >= 30
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'}"
                                  style:width="{Math.min(item.progress, 100)}%"
                                ></div>
                              </div>
                              <span class="text-xs text-gray-600">{item.progress}%</span>
                            </div>
                          </td>

                          <!-- 마감일 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                            <span
                              class="text-xs {isOverdue
                                ? 'text-red-600 font-medium'
                                : 'text-gray-600'}"
                            >
                              {item.due_date ? formatDate(item.due_date) : '-'}
                            </span>
                          </td>

                          <!-- 상태 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                            <span
                              class="px-2 py-1 text-xs font-medium rounded-full {item.status ===
                              'completed'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.status === 'planned'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'}"
                            >
                              {item.status === 'completed'
                                ? '완료'
                                : item.status === 'in_progress'
                                  ? '진행중'
                                  : item.status === 'planned'
                                    ? '계획'
                                    : '검토중'}
                            </span>
                          </td>

                          <!-- 액션 -->
                          <td class="px-3 py-3 whitespace-nowrap text-sm font-medium text-center">
                            <div class="flex space-x-1 justify-center">
                              <ThemeButton
                                variant="ghost"
                                size="sm"
                                onclick={() => onOpenEvidenceDetail(item)}
                              >
                                <EditIcon size={12} class="mr-1" />
                                상세
                              </ThemeButton>
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <div class="text-center py-8 text-gray-500">
                  <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
                  <p>등록된 증빙 항목이 없습니다.</p>
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    class="mt-2"
                    onclick={() => onOpenEvidenceDetail(budgetCategory)}
                  >
                    <PlusIcon size={14} class="mr-1" />
                    첫 번째 증빙 추가
                  </ThemeButton>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{:else}
  <div class="text-center py-8 text-gray-500">
    <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
    <p>등록된 사업비가 없어 증빙을 관리할 수 없습니다.</p>
  </div>
{/if}
