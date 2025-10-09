<script lang="ts">
  import { onMount } from 'svelte'
  import type { MemberRole, BandwidthAllocation } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'

  // =============================================
  // Props
  // =============================================

  interface Props {
    formationId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
  }

  let { formationId, isOpen, onClose, onSuccess }: Props = $props()

  // =============================================
  // State
  // =============================================

  let employees = $state<any[]>([])
  let selectedEmployeeId = $state('')
  let role = $state<MemberRole>('contributor')
  let bandwidth = $state<BandwidthAllocation>('partial')
  let loading = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Data Fetching
  // =============================================

  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees?status=active')
      const data = await res.json()
      if (data.success) {
        employees = data.employees || []
      }
    } catch (e) {
      console.error('Failed to load employees:', e)
    }
  }

  onMount(() => {
    if (isOpen) {
      loadEmployees()
    }
  })

  $effect(() => {
    if (isOpen) {
      loadEmployees()
    }
  })

  // =============================================
  // Actions
  // =============================================

  async function handleSubmit() {
    try {
      loading = true
      error = null

      if (!selectedEmployeeId) {
        error = '직원을 선택해주세요'
        return
      }

      const res = await fetch(`/api/planner/formations/${formationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          role,
          bandwidth,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || '멤버 추가 실패')
      }

      onSuccess()
      onClose()
    } catch (e) {
      error = e instanceof Error ? e.message : '멤버 추가 실패'
    } finally {
      loading = false
    }
  }

  function handleClose() {
    selectedEmployeeId = ''
    role = 'contributor'
    bandwidth = 'partial'
    error = null
    onClose()
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">멤버 추가</h3>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        {/if}

        <!-- Employee Selection -->
        <div>
          <label for="employee" class="block text-sm font-medium text-gray-700 mb-2">
            직원 <span class="text-red-500">*</span>
          </label>
          <select
            id="employee"
            bind:value={selectedEmployeeId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택하세요</option>
            {#each employees as employee}
              <option value={employee.id}>
                {formatKoreanName(employee.last_name, employee.first_name)} - {employee.position ||
                  employee.department}
              </option>
            {/each}
          </select>
        </div>

        <!-- Role -->
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-2"> 역할 </label>
          <select
            id="role"
            bind:value={role}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="driver">드라이버 - 이니셔티브를 주도</option>
            <option value="contributor">기여자 - 적극적으로 기여</option>
            <option value="advisor">자문 - 조언 제공</option>
            <option value="observer">참관자 - 정보 공유 대상</option>
          </select>
        </div>

        <!-- Bandwidth -->
        <div>
          <label for="bandwidth" class="block text-sm font-medium text-gray-700 mb-2">
            업무 할당
          </label>
          <select
            id="bandwidth"
            bind:value={bandwidth}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="full">전담 (100%)</option>
            <option value="partial">부분 (50%)</option>
            <option value="support">지원 (10%)</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
        <button
          type="button"
          onclick={handleClose}
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          취소
        </button>
        <button
          type="button"
          onclick={handleSubmit}
          disabled={loading}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '추가 중...' : '추가'}
        </button>
      </div>
    </div>
  </div>
{/if}
