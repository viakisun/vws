<script lang="ts">
  import type { BudgetCategory, BudgetGoal } from '$lib/stores/budget'
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher()

  let {
    isOpen = $bindable(false),
    budgetItem = null,
    type = 'category', // 'category' | 'goal'
  } = $props<{
    isOpen?: boolean
    budgetItem?: BudgetCategory | BudgetGoal | null
    type?: 'category' | 'goal'
  }>()

  let formData = $state({
    name: '',
    amount: 0,
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    deadline: '',
    status: 'active' as 'active' | 'completed' | 'paused',
  })

  function initializeForm() {
    if (budgetItem) {
      if (type === 'category') {
        const category = budgetItem as BudgetCategory
        formData = {
          name: category.name,
          amount: category.amount,
          period: category.period,
          deadline: '',
          status: 'active',
        }
      } else {
        const goal = budgetItem as BudgetGoal
        formData = {
          name: goal.name,
          amount: goal.targetAmount,
          period: 'monthly',
          deadline: goal.deadline,
          status: goal.status,
        }
      }
    } else {
      formData = {
        name: '',
        amount: 0,
        period: 'monthly',
        deadline: '',
        status: 'active',
      }
    }
  }

  function handleSubmit() {
    if (!formData.name || !formData.amount) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    if (type === 'goal' && !formData.deadline) {
      alert('목표 마감일을 입력해주세요.')
      return
    }

    const itemData = {
      ...formData,
      amount: Number(formData.amount),
      id: budgetItem?.id || `${type}-${Date.now()}`,
      createdAt: budgetItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch('submit', itemData)
    closeModal()
  }

  function closeModal() {
    isOpen = false
    dispatch('close')
  }

  function resetForm() {
    formData = {
      name: '',
      amount: 0,
      period: 'monthly',
      deadline: '',
      status: 'active',
    }
  }

  function updateData() {
    if (isOpen) {
      initializeForm()
    } else {
      resetForm()
    }
  }

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 초기화 함수들 호출
  })
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div
      class="absolute inset-0 bg-black/40"
      role="button"
      tabindex="0"
      onclick={closeModal}
      onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}
    ></div>
    <div
      class="relative w-full max-w-2xl mx-4 rounded-xl bg-white shadow-lg border border-gray-200"
      role="dialog"
      aria-modal="true"
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">
            {type === 'category' ? '예산 카테고리' : '예산 목표'}
            {budgetItem ? '수정' : '추가'}
          </h2>
          <button
            type="button"
            onclick={closeModal}
            class="text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onsubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          class="space-y-4"
        >
          <!-- 이름 -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              {type === 'category' ? '카테고리명' : '목표명'} *
            </label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              placeholder={type === 'category' ? '예: 인건비, 마케팅' : '예: 분기 매출 목표'}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- 금액 -->
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
              {type === 'category' ? '예산 금액' : '목표 금액'} *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">₩</span>
              <input
                id="amount"
                type="number"
                bind:value={formData.amount}
                placeholder="0"
                min="0"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {#if type === 'category'}
            <!-- 기간 -->
            <div>
              <label for="period" class="block text-sm font-medium text-gray-700 mb-1">
                예산 기간
              </label>
              <select
                id="period"
                bind:value={formData.period}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">월간</option>
                <option value="quarterly">분기</option>
                <option value="yearly">연간</option>
              </select>
            </div>
          {:else}
            <!-- 마감일 -->
            <div>
              <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">
                목표 마감일 *
              </label>
              <input
                id="deadline"
                type="date"
                bind:value={formData.deadline}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <!-- 상태 -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                id="status"
                bind:value={formData.status}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">진행중</option>
                <option value="completed">완료</option>
                <option value="paused">일시정지</option>
              </select>
            </div>
          {/if}

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onclick={closeModal}
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {budgetItem ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
