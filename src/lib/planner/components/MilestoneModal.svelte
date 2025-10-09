<script lang="ts">
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import type { MilestoneWithProduct } from '$lib/planner/types'

  // =============================================
  // Props
  // =============================================

  interface Props {
    open: boolean
    milestone?: MilestoneWithProduct | null
    productId: string
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(), milestone = null, productId, onclose, onsave }: Props = $props()

  // =============================================
  // State
  // =============================================

  let name = $state('')
  let description = $state('')
  let target_date = $state('')
  let status = $state<'upcoming' | 'in_progress' | 'achieved' | 'missed'>('upcoming')

  let saving = $state(false)
  let error = $state<string | null>(null)

  // Is this edit mode?
  const isEdit = $derived(!!milestone)

  // =============================================
  // Effects
  // =============================================

  $effect(() => {
    if (milestone) {
      name = milestone.name
      description = milestone.description || ''
      // Convert ISO date to YYYY-MM-DD format for date input
      if (milestone.target_date) {
        const date = new Date(milestone.target_date)
        target_date = date.toISOString().split('T')[0]
      } else {
        target_date = ''
      }
      status = milestone.status
    } else {
      resetForm()
    }
  })

  // =============================================
  // Handlers
  // =============================================

  function resetForm() {
    name = ''
    description = ''
    target_date = ''
    status = 'upcoming'
    error = null
  }

  async function handleSave() {
    if (!name.trim()) {
      error = '마일스톤명은 필수입니다'
      return
    }

    try {
      saving = true
      error = null

      const url = isEdit ? `/api/planner/milestones/${milestone!.id}` : '/api/planner/milestones'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          name: name.trim(),
          description: description.trim() || undefined,
          target_date: target_date || undefined,
          status,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save milestone')
      }

      resetForm()
      onsave()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save milestone'
    } finally {
      saving = false
    }
  }

  function handleClose() {
    resetForm()
    onclose()
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'upcoming':
        return '예정'
      case 'in_progress':
        return '진행 중'
      case 'achieved':
        return '달성'
      case 'missed':
        return '미달성'
      default:
        return status
    }
  }
</script>

<ThemeModal {open} onclose={handleClose} size="md">
  <div class="p-6">
    <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text-primary)">
      {isEdit ? '마일스톤 수정' : '새 마일스톤 만들기'}
    </h3>

    {#if error}
      <div
        class="mb-4 p-3 rounded-lg"
        style:background="var(--color-error-light)"
        style:color="var(--color-error)"
      >
        {error}
      </div>
    {/if}

    <div class="space-y-4">
      <!-- Milestone Name -->
      <div>
        <label
          for="milestone-name"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          마일스톤명 *
        </label>
        <input
          id="milestone-name"
          type="text"
          bind:value={name}
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="예: v1.0 출시"
          required
        />
      </div>

      <!-- Description -->
      <div>
        <label
          for="milestone-description"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          설명
        </label>
        <textarea
          id="milestone-description"
          bind:value={description}
          rows="3"
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          placeholder="마일스톤에 대한 설명을 입력하세요"
        ></textarea>
      </div>

      <!-- Target Date & Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="milestone-date"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-secondary)"
          >
            목표일
          </label>
          <input
            id="milestone-date"
            type="date"
            bind:value={target_date}
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
          />
        </div>

        <div>
          <label
            for="milestone-status"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-secondary)"
          >
            상태 *
          </label>
          <select
            id="milestone-status"
            bind:value={status}
            class="w-full px-3 py-2 rounded-lg border transition"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            required
          >
            <option value="upcoming">{getStatusText('upcoming')}</option>
            <option value="in_progress">{getStatusText('in_progress')}</option>
            <option value="achieved">{getStatusText('achieved')}</option>
            <option value="missed">{getStatusText('missed')}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <ThemeButton variant="ghost" onclick={handleClose} disabled={saving}>취소</ThemeButton>
      <ThemeButton onclick={handleSave} disabled={saving}>
        {#if saving}
          저장 중...
        {:else if isEdit}
          수정
        {:else}
          만들기
        {/if}
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
