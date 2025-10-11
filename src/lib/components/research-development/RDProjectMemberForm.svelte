<script lang="ts">
  import { CheckIcon, XIcon } from '@lucide/svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeCard from '../ui/ThemeCard.svelte'
  import ThemeEmployeeDropdown from '../ui/ThemeEmployeeDropdown.svelte'

  interface MemberForm {
    employeeId: string
    role: string
    startDate: string
    endDate: string
    participationRate: number
    monthlyAmount: string
    contractMonthlySalary: string
    participationMonths: number
    cashAmount: string
    inKindAmount: string
  }

  interface Props {
    visible: boolean
    memberForm: MemberForm
    availableEmployees: any[]
    isManualMonthlyAmount: boolean
    formatNumber: (value: string | number, isInput: boolean) => string
    oncancel: () => void
    onsubmit: () => void
    onupdateMonthlyAmount: () => void
  }

  let {
    visible = $bindable(),
    memberForm = $bindable(),
    availableEmployees,
    isManualMonthlyAmount = $bindable(),
    formatNumber,
    oncancel,
    onsubmit,
    onupdateMonthlyAmount,
  }: Props = $props()

  // 직원 선택 변경 핸들러
  function handleEmployeeChange(employeeId: string) {
    memberForm.employeeId = employeeId
    isManualMonthlyAmount = false
    onupdateMonthlyAmount()
  }
</script>

{#if visible}
  <ThemeCard class="p-6 mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
    <div class="flex items-center mb-4">
      <div class="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
      <h3 class="text-lg font-semibold text-green-800">연구원 추가</h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 연구원 선택 -->
      <div>
        <label for="member-employee-select" class="block text-sm font-medium text-gray-700 mb-2"
          >연구원</label
        >
        <ThemeEmployeeDropdown
          id="member-employee-select"
          bind:value={memberForm.employeeId}
          employees={availableEmployees}
          placeholder="👥 연구원 선택 ({availableEmployees.length}명)"
          showDepartment={true}
          showPosition={false}
          onchange={handleEmployeeChange}
          class="border-green-300 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <!-- 역할 -->
      <div>
        <label for="member-role-select" class="block text-sm font-medium text-gray-700 mb-2"
          >역할</label
        >
        <select
          id="member-role-select"
          bind:value={memberForm.role}
          class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
        >
          <option value="researcher">👨‍🔬 연구원</option>
          <option value="lead">👑 연구책임자</option>
          <option value="support">🤝 지원</option>
        </select>
      </div>

      <!-- 참여율 -->
      <div>
        <label for="member-participation-rate" class="block text-sm font-medium text-gray-700 mb-2"
          >참여율</label
        >
        <div class="relative">
          <input
            id="member-participation-rate"
            type="number"
            bind:value={memberForm.participationRate}
            class="w-full px-3 py-2 pr-8 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
            min="0"
            max="100"
            step="0.1"
            placeholder="100"
            oninput={(e: Event & { currentTarget: HTMLInputElement }) => {
              const value = parseFloat(e.currentTarget.value)
              if (value < 0) memberForm.participationRate = 0
              if (value > 100) memberForm.participationRate = 100
              isManualMonthlyAmount = false
              onupdateMonthlyAmount()
            }}
          />
          <span
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
            >%</span
          >
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <!-- 현금 금액 -->
      <div>
        <label for="member-cash-amount" class="block text-sm font-medium text-gray-700 mb-2"
          >현금 (원)</label
        >
        <input
          id="member-cash-amount"
          type="text"
          value={formatNumber(memberForm.cashAmount, false)}
          oninput={(e) => {
            const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
            memberForm.cashAmount = rawValue || '0'
            e.currentTarget.value = formatNumber(rawValue, false)

            // 현금에 금액이 있으면 현물은 0으로 설정
            if (parseInt(rawValue || '0') > 0) {
              memberForm.inKindAmount = '0'
            }
          }}
          class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
          placeholder="0"
        />
      </div>

      <!-- 현물 금액 -->
      <div>
        <label for="member-in-kind-amount" class="block text-sm font-medium text-gray-700 mb-2"
          >현물 (원)</label
        >
        <input
          id="member-in-kind-amount"
          type="text"
          value={formatNumber(memberForm.inKindAmount, false)}
          oninput={(e) => {
            const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
            memberForm.inKindAmount = rawValue || '0'
            e.currentTarget.value = formatNumber(rawValue, false)

            // 현물에 금액이 있으면 현금은 0으로 설정
            if (parseInt(rawValue || '0') > 0) {
              memberForm.cashAmount = '0'
            }
          }}
          class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
          placeholder="0"
        />
      </div>

      <!-- 참여기간 -->
      <div>
        <div class="block text-sm font-medium text-gray-700 mb-2">참여기간</div>
        <div class="flex space-x-2">
          <div class="flex-1">
            <label for="member-start-date" class="sr-only">시작일</label>
            <input
              id="member-start-date"
              type="date"
              bind:value={memberForm.startDate}
              class="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
              onchange={() => {
                isManualMonthlyAmount = false
                onupdateMonthlyAmount()
              }}
            />
          </div>
          <div class="flex-1">
            <label for="member-end-date" class="sr-only">종료일</label>
            <input
              id="member-end-date"
              type="date"
              bind:value={memberForm.endDate}
              class="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
              onchange={() => {
                isManualMonthlyAmount = false
                onupdateMonthlyAmount()
              }}
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 폼 검증 메시지 -->
    {#if !memberForm.employeeId || !memberForm.startDate || !memberForm.endDate}
      <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-center">
          <div class="w-5 h-5 text-amber-600 mr-2">⚠️</div>
          <div class="text-sm text-amber-800">
            {#if !memberForm.employeeId}
              연구원을 선택해주세요.
            {:else if !memberForm.startDate || !memberForm.endDate}
              참여기간을 입력해주세요.
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- 액션 버튼 -->
    <div class="flex justify-end space-x-3 mt-6">
      <ThemeButton variant="secondary" onclick={oncancel} class="px-6 py-2">
        <XIcon size={16} class="mr-2" />
        취소
      </ThemeButton>
      <ThemeButton
        variant="primary"
        onclick={onsubmit}
        disabled={!memberForm.employeeId || !memberForm.startDate || !memberForm.endDate}
        class="px-6 py-2"
      >
        <CheckIcon size={16} class="mr-2" />
        추가
      </ThemeButton>
    </div>
  </ThemeCard>
{/if}
