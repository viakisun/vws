<script lang="ts">
  import { logger } from '$lib/utils/logger'

  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import {
    AlertTriangleIcon,
    CheckCircleIcon,
    RefreshCwIcon,
    SettingsIcon,
    UserIcon,
    WrenchIcon,
    XCircleIcon,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // Props
  const {
    projectId,
    members = [],
    onMemberUpdate = () => {},
  }: {
    projectId: string
    members?: any[]
    onMemberUpdate?: (_memberId: string, _updates: any) => void
  } = $props()

  // State
  const validationState = $state({
    isValidating: false,
    isValid: false,
    lastValidated: null as string | null,
    issues: [] as any[],
    summary: {
      totalMembers: 0,
      validMembers: 0,
      invalidMembers: 0,
    },
  })

  let showValidationDetails = $state(false)
  let selectedMember = $state<any>(null)

  // 검증 상태 아이콘
  function getValidationIcon() {
    if (validationState.isValidating) {
      return RefreshCwIcon
    }
    return validationState.isValid ? CheckCircleIcon : AlertTriangleIcon
  }

  // 검증 상태 색상
  function getValidationColor() {
    if (validationState.isValidating) {
      return 'text-blue-600'
    }
    return validationState.isValid ? 'text-green-600' : 'text-red-600'
  }

  // 검증 상태 텍스트
  function getValidationText() {
    if (validationState.isValidating) {
      return '검증 중...'
    }
    return validationState.isValid
      ? '검증 완료'
      : `${validationState.summary.invalidMembers}개 이슈 발견`
  }

  // 멤버별 검증 상태
  function getMemberValidationStatus(member: any) {
    const memberIssues = validationState.issues.filter((issue) => issue.memberId === member.id)

    if (memberIssues.length === 0) {
      return {
        status: 'valid',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        text: '정상',
      }
    }

    const hasErrors = memberIssues.some((issue) => issue.severity === 'error')
    return {
      status: hasErrors ? 'error' : 'warning',
      icon: hasErrors ? XCircleIcon : AlertTriangleIcon,
      color: hasErrors ? 'text-red-600' : 'text-yellow-600',
      text: hasErrors ? '오류' : '주의',
    }
  }

  // 참여율 색상
  function getParticipationRateColor(rate: number) {
    if (rate > 100) return 'danger'
    if (rate >= 80) return 'success'
    if (rate >= 50) return 'warning'
    return 'secondary'
  }

  // 검증 실행
  async function runValidation() {
    if (!projectId) return

    validationState.isValidating = true

    try {
      const response = await fetch(
        `/api/research-development/researcher-validation?projectId=${projectId}`,
      )
      const result = await response.json()

      if (result.success) {
        validationState.isValid = result.data.validation.isValid
        validationState.issues = result.data.validation.issues
        validationState.summary = result.data.validation.summary
        validationState.lastValidated = new Date().toISOString()
      } else {
        logger.error('검증 실패:', result.error)
      }
    } catch (error) {
      logger.error('검증 오류:', error)
    } finally {
      validationState.isValidating = false
    }
  }

  // 자동 수정 실행
  async function runAutoFix() {
    if (!projectId) return

    // 수정 가능한 이슈들 수집
    const fixes = validationState.issues
      .filter((issue) => issue.type === 'participation_rate_excess')
      .map((issue) => ({
        type: 'participation_rate_adjustment',
        memberId: issue.memberId,
        oldValue: issue.data?.participationRate || 100,
        newValue: 100,
      }))

    if (fixes.length === 0) {
      return
    }

    try {
      const response = await fetch('/api/research-development/researcher-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          fixes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 수정 완료 후 재검증
        await runValidation()

        // 멤버 데이터 새로고침
        onMemberUpdate('refresh', {})
      }
    } catch (error) {
      logger.error('자동 수정 오류:', error)
    }
  }

  // 멤버 상세 정보 보기
  function showMemberDetails(member: any) {
    selectedMember = member
    showValidationDetails = true
  }

  // 날짜 포맷팅
  function formatDate(dateString: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 금액 포맷팅
  function formatCurrency(amount: number) {
    if (!amount) return '0원'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // 컴포넌트 마운트 시 자동 검증
  onMount(() => {
    if (projectId && members.length > 0) {
      runValidation()
    }
  })

  // 멤버 데이터 변경 시 재검증
  function _updateData() {
    if (projectId && members.length > 0 && !validationState.isValidating) {
      runValidation()
    }
  }
</script>

<div class="space-y-4">
  <!-- 검증 상태 헤더 -->
  <ThemeCard>
    <div class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          {#if true}
            {@const ValidationIcon = getValidationIcon()}
            <ValidationIcon size={24} class={getValidationColor()} />
          {/if}
          <div>
            <h3 class="text-lg font-semibold" style:color="var(--color-text)">
              참여연구원 검증 상태
            </h3>
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {getValidationText()}
              {#if validationState.lastValidated}
                • 마지막 검증: {new Date(validationState.lastValidated).toLocaleString('ko-KR')}
              {/if}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if !validationState.isValid && validationState.issues.some((issue) => issue.type === 'participation_rate_excess')}
            <ThemeButton
              variant="warning"
              size="sm"
              onclick={runAutoFix}
              disabled={validationState.isValidating}
            >
              <WrenchIcon size={16} class="mr-1" />
              자동 수정
            </ThemeButton>
          {/if}

          <ThemeButton
            variant="secondary"
            size="sm"
            onclick={runValidation}
            disabled={validationState.isValidating}
          >
            <RefreshCwIcon
              size={16}
              class="mr-1 {validationState.isValidating ? 'animate-spin' : ''}"
            />
            다시 검증
          </ThemeButton>
        </div>
      </div>

      <!-- 검증 요약 -->
      {#if validationState.summary.totalMembers > 0}
        <div class="mt-4 grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              {validationState.summary.totalMembers}
            </div>
            <div class="text-sm text-gray-600">전체 연구원</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {validationState.summary.validMembers}
            </div>
            <div class="text-sm text-gray-600">정상</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">
              {validationState.summary.invalidMembers}
            </div>
            <div class="text-sm text-gray-600">이슈 있음</div>
          </div>
        </div>
      {/if}
    </div>
  </ThemeCard>

  <!-- 참여연구원 테이블 -->
  <ThemeCard>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b" style:border-color="var(--color-border)">
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">연구원</th>
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">참여율</th>
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">월간금액</th
            >
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">참여기간</th
            >
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">
              기여 유형
            </th>
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">
              검증 상태
            </th>
            <th class="text-left py-3 px-4 font-medium" style:color="var(--color-text)">액션</th>
          </tr>
        </thead>
        <tbody>
          {#each members as member, i (i)}
            {@const validationStatus = getMemberValidationStatus(member)}
            <tr class="border-b hover:bg-opacity-50" style:border-color="var(--color-border)">
              <!-- 연구원 정보 -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <UserIcon size={16} style="color: var(--color-primary);" />
                  <div>
                    <div class="font-medium" style:color="var(--color-text)">
                      {member.employee_name}
                    </div>
                    <div class="text-sm" style:color="var(--color-text-secondary)">
                      {member.employee_department} / {member.employee_position}
                    </div>
                  </div>
                </div>
              </td>

              <!-- 참여율 -->
              <td class="py-3 px-4">
                <ThemeBadge
                  variant={getParticipationRateColor(
                    parseFloat(member.participation_rate) || 0,
                  ) as any}
                >
                  {member.participation_rate}%
                </ThemeBadge>
              </td>

              <!-- 월간금액 -->
              <td class="py-3 px-4" style:color="var(--color-text)">
                {formatCurrency(parseFloat(member.monthly_amount) || 0)}
              </td>

              <!-- 참여기간 -->
              <td class="py-3 px-4" style:color="var(--color-text)">
                <div class="text-sm">
                  <div>시작: {formatDate(member.start_date)}</div>
                  <div>종료: {formatDate(member.end_date)}</div>
                </div>
              </td>

              <!-- 기여 유형 -->
              <td class="py-3 px-4">
                <ThemeBadge variant="success">
                  {member.contribution_type === 'cash' ? '현금' : member.contribution_type}
                </ThemeBadge>
              </td>

              <!-- 검증 상태 -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  {#if true}
                    {@const StatusIcon = validationStatus.icon}
                    <StatusIcon size={16} class={validationStatus.color} />
                  {/if}
                  <span class="text-sm" style:color="var(--color-text)">
                    {validationStatus.text}
                  </span>
                </div>
              </td>

              <!-- 액션 -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <ThemeButton
                    variant="secondary"
                    size="sm"
                    onclick={() => showMemberDetails(member)}
                  >
                    <SettingsIcon size={14} class="mr-1" />
                    상세
                  </ThemeButton>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </ThemeCard>

  <!-- 검증 상세 모달 -->
  {#if showValidationDetails && selectedMember}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {selectedMember.employee_name} 검증 상세
          </h3>
          <button
            type="button"
            onclick={() => (showValidationDetails = false)}
            class="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon size={24} />
          </button>
        </div>

        <!-- 멤버 기본 정보 -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">기본 정보</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">부서/직급:</span>
              <span class="ml-2">
                {selectedMember.employee_department} / {selectedMember.employee_position}
              </span>
            </div>
            <div>
              <span class="text-gray-600">참여율:</span>
              <span class="ml-2">{selectedMember.participation_rate}%</span>
            </div>
            <div>
              <span class="text-gray-600">월간금액:</span>
              <span class="ml-2">
                {formatCurrency(parseFloat(selectedMember.monthly_amount) || 0)}
              </span>
            </div>
            <div>
              <span class="text-gray-600">참여기간:</span>
              <span class="ml-2">
                {formatDate(selectedMember.start_date)} ~ {formatDate(selectedMember.end_date)}
              </span>
            </div>
          </div>
        </div>

        <!-- 검증 이슈 -->
        {#if validationState.issues.filter((issue) => issue.memberId === selectedMember.id).length > 0}
          {@const memberIssues = validationState.issues.filter(
            (issue) => issue.memberId === selectedMember.id,
          )}
          <div class="space-y-3">
            <h4 class="font-medium text-gray-900">발견된 이슈</h4>
            {#each memberIssues as issue, i (i)}
              <div
                class="p-3 rounded-lg border {issue.severity === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'}"
              >
                <div class="flex items-start gap-2">
                  {#if true}
                    {@const IssueIcon =
                      issue.severity === 'error' ? XCircleIcon : AlertTriangleIcon}
                    <IssueIcon
                      size={20}
                      class={issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}
                    />
                  {/if}
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{issue.message}</div>
                    {#if issue.suggestedFix}
                      <div class="text-sm text-gray-600 mt-1">
                        💡 {issue.suggestedFix}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8">
            <CheckCircleIcon size={48} class="text-green-600 mx-auto mb-2" />
            <div class="text-lg font-medium text-gray-900">검증 통과</div>
            <div class="text-sm text-gray-600">이 연구원의 모든 검증 항목이 정상입니다.</div>
          </div>
        {/if}

        <div class="flex justify-end gap-2 mt-6">
          <ThemeButton variant="secondary" onclick={() => (showValidationDetails = false)}>
            닫기
          </ThemeButton>
        </div>
      </div>
    </div>
  {/if}
</div>
