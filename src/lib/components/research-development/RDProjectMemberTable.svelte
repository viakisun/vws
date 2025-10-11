<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { formatDate, formatNumber } from '$lib/utils/format'
  import {
    CheckIcon,
    EditIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
    UsersIcon,
    XIcon,
  } from '@lucide/svelte'
  import * as calculationUtilsImported from './utils/calculationUtils'
  import * as dataTransformers from './utils/dataTransformers'
  import * as memberUtilsImported from './utils/memberUtils'

  const {
    projectMembers = [],
    selectedMember = null,
    memberForm,
    isManualMonthlyAmount: _isManualMonthlyAmount = false,
    loadingAddingMember = false,
    onStartAddMember,
    onEditMember,
    onCancelEditMember,
    onUpdateMember,
    onRemoveMember,
    onUpdateMonthlyAmount,
  }: {
    projectMembers: any[]
    selectedMember: any | null
    memberForm: any
    isManualMonthlyAmount?: boolean
    loadingAddingMember?: boolean
    onStartAddMember: () => void
    onEditMember: (member: any) => void
    onCancelEditMember: () => void
    onUpdateMember: () => void
    onRemoveMember: (memberId: number) => void
    onUpdateMonthlyAmount: () => void
  } = $props()

  // Local state for manual monthly amount tracking
  let isManualMonthlyAmount = $state(_isManualMonthlyAmount)
</script>

<div class="flex items-center justify-between mb-6">
  <h3 class="text-lg font-semibold text-gray-900">참여연구원 관리</h3>
  <div class="flex items-center gap-2">
    <ThemeButton
      onclick={onStartAddMember}
      size="sm"
      disabled={loadingAddingMember || selectedMember !== null}
    >
      <PlusIcon size={16} class="mr-2" />
      연구원 추가
    </ThemeButton>
  </div>
</div>

<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
          >이름</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
          >기간</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
          >참여개월수</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
          >계약월급여</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
          >참여율</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
          >현금</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
          >현물</th
        >
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
          >액션</th
        >
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      {#each projectMembers as member, i (i)}
        <tr
          class="hover:bg-gray-50 {selectedMember && selectedMember.id === member.id
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm'
            : ''}"
        >
          <!-- 이름 -->
          <td class="px-4 py-4 whitespace-nowrap w-48">
            <div class="flex items-center">
              <UserIcon size={20} class="text-gray-400 mr-2" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <div class="text-sm font-medium text-gray-900 truncate">
                    {member.employee_name ||
                      memberUtilsImported.formatKoreanName(
                        memberUtilsImported.getMemberEmployeeName(member),
                      )}
                  </div>
                  <ThemeBadge variant="info" size="sm">{member.role}</ThemeBadge>
                </div>
                <div class="text-xs text-gray-500 truncate">
                  {member.employee_department || member.employeeDepartment} / {member.employee_position ||
                    member.employeePosition}
                </div>
              </div>
            </div>
          </td>

          <!-- 기간 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
            {#if selectedMember && selectedMember.id === member.id}
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-blue-700 w-8">시작:</span>
                  <input
                    type="date"
                    bind:value={memberForm.startDate}
                    class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    onchange={() => {
                      isManualMonthlyAmount = false
                      onUpdateMonthlyAmount()
                    }}
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-blue-700 w-8">종료:</span>
                  <input
                    type="date"
                    bind:value={memberForm.endDate}
                    class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    onchange={() => {
                      isManualMonthlyAmount = false
                      onUpdateMonthlyAmount()
                    }}
                  />
                </div>
              </div>
            {:else}
              <div class="space-y-1">
                <div class="text-xs text-gray-600">
                  {formatDate(memberUtilsImported.getMemberStartDate(member))}
                </div>
                <div class="text-xs text-gray-600">
                  {formatDate(memberUtilsImported.getMemberEndDate(member))}
                </div>
              </div>
            {/if}
          </td>

          <!-- 참여개월수 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24 text-center">
            {#if selectedMember && selectedMember.id === member.id}
              <input
                type="number"
                value={memberForm.participationMonths ||
                  calculationUtilsImported.calculatePeriodMonths(
                    memberUtilsImported.getMemberStartDate(member),
                    memberUtilsImported.getMemberEndDate(member),
                  )}
                oninput={(e) => {
                  const value = parseInt(e.currentTarget.value) || 0
                  memberForm.participationMonths = value
                }}
                class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-center"
                min="1"
                max="120"
              />
            {:else}
              {member.participationMonths ||
                calculationUtilsImported.calculatePeriodMonths(
                  memberUtilsImported.getMemberStartDate(member),
                  memberUtilsImported.getMemberEndDate(member),
                )}개월
            {/if}
          </td>

          <!-- 계약월급여 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
            {#if selectedMember && selectedMember.id === member.id}
              <input
                type="text"
                value={formatNumber(memberForm.contractMonthlySalary, false)}
                oninput={(e) => {
                  const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                  memberForm.contractMonthlySalary = rawValue || '0'
                  e.currentTarget.value = formatNumber(rawValue, false)

                  // 계약월급여 변경 시 현금/현물 자동 계산
                  const participationMonths =
                    memberForm.participationMonths ||
                    calculationUtilsImported.calculatePeriodMonths(
                      memberForm.startDate,
                      memberForm.endDate,
                    )

                  // 총 금액 계산 (Utils 사용)
                  const totalAmount = dataTransformers.calculateMemberContribution(
                    rawValue,
                    memberForm.participationRate,
                    participationMonths,
                  )

                  // 현금/현물 자동 분배 (Utils 사용)
                  const distributed = dataTransformers.distributeMemberAmount(
                    totalAmount,
                    memberForm.cashAmount,
                    memberForm.inKindAmount,
                  )
                  memberForm.cashAmount = distributed.cashAmount
                  memberForm.inKindAmount = distributed.inKindAmount
                }}
                class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                placeholder="0"
              />
            {:else}
              {formatNumber(calculationUtilsImported.calculateContractMonthlySalary(member), true)}
            {/if}
          </td>

          <!-- 참여율 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24">
            {#if selectedMember && selectedMember.id === member.id}
              <div class="relative">
                <input
                  type="number"
                  bind:value={memberForm.participationRate}
                  class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  min="0"
                  max="100"
                  step="0.1"
                  onchange={() => {
                    isManualMonthlyAmount = false
                    onUpdateMonthlyAmount()
                  }}
                />
                <span
                  class="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
                  >%</span
                >
              </div>
            {:else}
              <div class="text-center">
                {member.participation_rate || member.participationRate || 0}%
              </div>
            {/if}
          </td>

          <!-- 현금 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
            {#if selectedMember && selectedMember.id === member.id}
              <input
                type="text"
                value={formatNumber(memberForm.cashAmount || '0', false)}
                oninput={(e) => {
                  const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                  memberForm.cashAmount = rawValue || '0'
                  e.currentTarget.value = formatNumber(rawValue, false)
                }}
                class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                placeholder="0"
              />
            {:else}
              {formatNumber(
                dataTransformers.safeStringToNumber(dataTransformers.extractCashAmount(member), 0),
                true,
              )}
            {/if}
          </td>

          <!-- 현물 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
            {#if selectedMember && selectedMember.id === member.id}
              <input
                type="text"
                value={formatNumber(memberForm.inKindAmount || '0', false)}
                oninput={(e) => {
                  const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                  memberForm.inKindAmount = rawValue || '0'
                  e.currentTarget.value = formatNumber(rawValue, false)
                }}
                class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                placeholder="0"
              />
            {:else}
              {formatNumber(
                dataTransformers.safeStringToNumber(
                  dataTransformers.extractInKindAmount(member),
                  0,
                ),
                true,
              )}
            {/if}
          </td>
          <!-- 검증 상태 칼럼 제거 -->
          <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
            <div class="flex space-x-1 justify-center">
              {#if selectedMember && selectedMember.id === member.id}
                <div class="flex space-x-1">
                  <button
                    type="button"
                    onclick={onUpdateMember}
                    class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                    title="저장"
                  >
                    <CheckIcon size={14} />
                  </button>
                  <button
                    type="button"
                    onclick={onCancelEditMember}
                    class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                    title="취소"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              {:else}
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onclick={() => onEditMember(member)}
                  disabled={selectedMember !== null}
                >
                  <EditIcon size={16} class="text-blue-600 mr-1" />
                  수정
                </ThemeButton>
                <ThemeButton
                  variant="ghost"
                  size="sm"
                  onclick={() => onRemoveMember(member.id)}
                  disabled={selectedMember !== null}
                >
                  <TrashIcon size={16} class="text-red-600 mr-1" />
                  삭제
                </ThemeButton>
              {/if}
            </div>
          </td>
        </tr>
      {/each}

      {#if projectMembers.length === 0 && !loadingAddingMember}
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-gray-500">
            <UsersIcon size={48} class="mx-auto mb-2 text-gray-300" />
            <p>참여 연구원이 없습니다.</p>
          </td>
        </tr>
      {/if}

      <!-- 합계 행 -->
      {#if projectMembers.length > 0}
        {@const totals = calculationUtilsImported.calculateTableTotals(projectMembers)}
        <tr class="bg-gray-50 border-t-2 border-gray-300">
          <td class="px-4 py-3 text-sm font-semibold text-gray-900" colspan="5">
            <div class="flex items-center">
              <div class="text-sm font-bold text-gray-800">합계</div>
            </div>
          </td>

          <!-- 현금 합계 -->
          <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
            {formatNumber(totals.totalCashAmount, true)}
          </td>

          <!-- 현물 합계 -->
          <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
            {formatNumber(totals.totalInKindAmount, true)}
          </td>

          <!-- 액션 (합계 행에는 없음) -->
          <td class="px-4 py-3 text-sm text-gray-500">
            <div class="text-center">-</div>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
