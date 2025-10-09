<script lang="ts">
  import { XIcon } from 'lucide-svelte'
  import type { FormationWithMembers, CadenceType, EnergyState } from '$lib/planner/types'

  interface Props {
    open: boolean
    formation: FormationWithMembers
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(false), formation, onclose, onsave }: Props = $props()

  let formData = $state({
    name: formation.name,
    description: formation.description || '',
    cadence_type: formation.cadence_type,
    cadence_anchor_time: formation.cadence_anchor_time || '',
    energy_state: formation.energy_state,
  })

  let saving = $state(false)
  let error = $state<string | null>(null)

  // Update formData when formation changes
  $effect(() => {
    if (open && formation) {
      formData = {
        name: formation.name,
        description: formation.description || '',
        cadence_type: formation.cadence_type,
        cadence_anchor_time: formation.cadence_anchor_time || '',
        energy_state: formation.energy_state,
      }
    }
  })

  async function handleSubmit() {
    try {
      saving = true
      error = null

      console.log('Saving formation:', formData)
      const response = await fetch(`/api/planner/formations/${formation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to save:', data)
        throw new Error(data.error || '포메이션 수정 실패')
      }

      const result = await response.json()
      console.log('Saved successfully:', result)
      onsave()
    } catch (e) {
      error = e instanceof Error ? e.message : '포메이션 수정 실패'
      console.error('Error saving formation:', e)
    } finally {
      saving = false
    }
  }

  function handleClose() {
    if (!saving) {
      onclose()
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style:background="rgba(0, 0, 0, 0.5)"
    onclick={handleClose}
  >
    <div
      class="w-full max-w-2xl rounded-lg shadow-lg"
      style:background="var(--color-surface)"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b"
        style:border-color="var(--color-border)"
      >
        <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">포메이션 편집</h2>
        <button
          type="button"
          onclick={handleClose}
          disabled={saving}
          class="transition hover:opacity-70"
          style:color="var(--color-text-tertiary)"
        >
          <XIcon size={20} />
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={(e) => (e.preventDefault(), handleSubmit())} class="p-6 space-y-4">
        {#if error}
          <div
            class="p-3 rounded-lg border border-red-200 bg-red-50 text-sm"
            style:color="var(--color-error)"
          >
            {error}
          </div>
        {/if}

        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            이름 *
          </label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="예: VWS-CORE-TF"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            설명
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="이 포메이션의 목적에 대한 간단한 설명"
          ></textarea>
        </div>

        <!-- Cadence Type -->
        <div>
          <label for="cadence" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            주기
          </label>
          <select
            id="cadence"
            bind:value={formData.cadence_type}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          >
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="biweekly">격주</option>
            <option value="async">비동기</option>
          </select>
          <p class="mt-1 text-xs" style:color="var(--color-text-tertiary)">
            이 포메이션의 싱크 주기는 얼마나 되나요?
          </p>
        </div>

        <!-- Cadence Anchor Time -->
        {#if formData.cadence_type !== 'async'}
          <div>
            <label for="anchor-time" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
              싱크 시간 (선택)
            </label>
            <input
              type="datetime-local"
              id="anchor-time"
              bind:value={formData.cadence_anchor_time}
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style:background="var(--color-surface)"
              style:border-color="var(--color-border)"
              style:color="var(--color-text-primary)"
            />
            <p class="mt-1 text-xs" style:color="var(--color-text-tertiary)">
              싱크가 일반적으로 언제 이루어지나요?
            </p>
          </div>
        {/if}

        <!-- Energy State -->
        <div>
          <label for="energy" class="block text-sm font-medium mb-1.5" style:color="var(--color-text-secondary)">
            에너지 상태
          </label>
          <select
            id="energy"
            bind:value={formData.energy_state}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
          >
            <option value="aligned">🟢 정렬됨 - 모든 것이 순조롭게 진행 중</option>
            <option value="healthy">🔵 양호 - 정상적인 작업 상태</option>
            <option value="strained">🟠 부담 - 용량 우려 있음</option>
            <option value="blocked">🔴 차단 - 진행 불가</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={handleClose}
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70"
            style:background="var(--color-surface-elevated)"
            style:color="var(--color-text-secondary)"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            style:background="var(--color-primary)"
            style:color="white"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
