<script lang="ts">
  import type { MemberRole, BandwidthAllocation } from '$lib/planner/types'

  // =============================================
  // Props
  // =============================================

  interface Props {
    formationId: string
    member: {
      id: string
      employee_id: string
      role: MemberRole
      bandwidth: BandwidthAllocation
      employee: {
        first_name: string
        last_name: string
        position?: string
        department?: string
      }
    } | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    onDelete: () => void
  }

  let { formationId, member, isOpen, onClose, onSuccess, onDelete }: Props = $props()

  // =============================================
  // State
  // =============================================

  let role = $state<MemberRole>('contributor')
  let bandwidth = $state<BandwidthAllocation>('partial')
  let loading = $state(false)
  let error = $state<string | null>(null)
  let showDeleteConfirm = $state(false)

  // =============================================
  // Effects
  // =============================================

  $effect(() => {
    if (member && isOpen) {
      role = member.role
      bandwidth = member.bandwidth
    }
  })

  // =============================================
  // Actions
  // =============================================

  async function handleSubmit() {
    if (!member) return

    try {
      loading = true
      error = null

      const res = await fetch(`/api/planner/formations/${formationId}/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          bandwidth,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || '멤버 수정 실패')
      }

      onSuccess()
      onClose()
    } catch (e) {
      error = e instanceof Error ? e.message : '멤버 수정 실패'
    } finally {
      loading = false
    }
  }

  async function handleDelete() {
    if (!member) return

    try {
      loading = true
      error = null

      const res = await fetch(
        `/api/planner/formations/${formationId}/members?employee_id=${member.employee_id}`,
        {
          method: 'DELETE',
        },
      )

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || '멤버 삭제 실패')
      }

      onDelete()
      onClose()
    } catch (e) {
      error = e instanceof Error ? e.message : '멤버 삭제 실패'
    } finally {
      loading = false
    }
  }

  function handleClose() {
    showDeleteConfirm = false
    error = null
    onClose()
  }
</script>

{#if isOpen && member}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">멤버 수정</h3>
        <p class="text-sm text-gray-600 mt-1">
          {member.employee.last_name}{member.employee.first_name} - {member.employee.position ||
            member.employee.department}
        </p>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        {/if}

        {#if showDeleteConfirm}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-900 font-medium mb-2">정말 삭제하시겠습니까?</p>
            <p class="text-xs text-yellow-700 mb-3">
              이 작업은 되돌릴 수 없습니다. 멤버를 포메이션에서 제거합니다.
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={() => {
                  showDeleteConfirm = false
                }}
                class="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onclick={handleDelete}
                disabled={loading}
                class="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        {:else}
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
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-between">
        {#if !showDeleteConfirm}
          <button
            type="button"
            onclick={() => {
              showDeleteConfirm = true
            }}
            class="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            삭제
          </button>
          <div class="flex gap-3">
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
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        {:else}
          <div></div>
        {/if}
      </div>
    </div>
  </div>
{/if}
