<script lang="ts">
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

  // =============================================
  // Props
  // =============================================

  interface Props {
    open: boolean
    formationId: string
    initiativeId: string
    initiativeTitle: string
    currentAllocation?: number
    onclose: () => void
    onsave: () => void
  }

  let {
    open = $bindable(),
    formationId,
    initiativeId,
    initiativeTitle,
    currentAllocation = 100,
    onclose,
    onsave,
  }: Props = $props()

  // =============================================
  // State
  // =============================================

  let allocation = $state(currentAllocation)
  let saving = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Effects
  // =============================================

  $effect(() => {
    allocation = currentAllocation
  })

  // =============================================
  // Handlers
  // =============================================

  async function handleSave() {
    try {
      saving = true
      error = null

      const res = await fetch(`/api/planner/formations/${formationId}/initiatives`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiative_id: initiativeId,
          allocation_percentage: allocation,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update allocation')
      }

      onsave()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update allocation'
    } finally {
      saving = false
    }
  }

  function handleClose() {
    allocation = currentAllocation
    error = null
    onclose()
  }
</script>

<ThemeModal {open} onclose={handleClose} size="sm">
  <div class="p-6">
    <h3 class="text-lg font-semibold mb-2" style:color="var(--color-text-primary)">
      할당 비율 수정
    </h3>
    <p class="text-sm mb-4" style:color="var(--color-text-secondary)">
      {initiativeTitle}
    </p>

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
      <!-- Allocation Slider -->
      <div>
        <label
          for="allocation"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-secondary)"
        >
          할당 비율: <strong>{allocation}%</strong>
        </label>
        <input
          id="allocation"
          type="range"
          bind:value={allocation}
          min="0"
          max="100"
          step="5"
          class="w-full"
          style="accent-color: var(--color-primary);"
        />
        <div class="flex justify-between text-xs mt-1" style:color="var(--color-text-tertiary)">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Allocation Input -->
      <div>
        <label
          for="allocation-input"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-secondary)"
        >
          정확한 값 입력
        </label>
        <input
          id="allocation-input"
          type="number"
          bind:value={allocation}
          min="0"
          max="100"
          class="w-full px-3 py-2 rounded-lg border transition"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        />
      </div>

      <p class="text-xs" style:color="var(--color-text-tertiary)">
        이 팀이 해당 이니셔티브에 투입하는 전체 팀 역량의 비율입니다.
      </p>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <ThemeButton variant="ghost" onclick={handleClose} disabled={saving}>취소</ThemeButton>
      <ThemeButton onclick={handleSave} disabled={saving}>
        {#if saving}
          저장 중...
        {:else}
          저장
        {/if}
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
