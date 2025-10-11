<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeEmployeeDropdown from '$lib/components/ui/ThemeEmployeeDropdown.svelte'
  import type { InitiativeWithOwner } from '../types'
  import MilestoneSelector from './MilestoneSelector.svelte'

  interface Formation {
    id: string
    name: string
  }

  interface Props {
    initiative: InitiativeWithOwner | null
    onClose: () => void
    onSave: (data: {
      success_criteria?: string[]
      horizon?: string
      owner_id?: string
      formation_id?: string | null
      milestone_id?: string | null
    }) => Promise<void>
  }

  let { initiative, onClose, onSave }: Props = $props()

  let successCriteria = $state<string[]>([])
  let horizon = $state('')
  let ownerId = $state('')
  let formationId = $state<string | null>(null)
  let milestoneId = $state<string | null>(null)
  let saving = $state(false)

  let formations = $state<Formation[]>([])
  let loadingData = $state(false)
  let dataLoaded = $state(false)

  // Initialize form when modal opens
  $effect(() => {
    if (initiative) {
      successCriteria = initiative.success_criteria ? [...initiative.success_criteria] : []
      // Convert ISO date string to YYYY-MM-DD format for date input
      if (initiative.horizon) {
        const date = new Date(initiative.horizon)
        horizon = date.toISOString().split('T')[0]
      } else {
        horizon = ''
      }
      ownerId = initiative.owner_id
      formationId = initiative.formation_id || null
      milestoneId = initiative.milestone_id || null
    }
  })

  // Load formations once when modal opens
  $effect(() => {
    if (initiative && !dataLoaded) {
      dataLoaded = true
      loadingData = true
      fetch('/api/planner/formations')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            formations = data.data || []
          }
        })
        .catch(() => {
          // Failed to load data
        })
        .finally(() => {
          loadingData = false
        })
    } else if (!initiative && dataLoaded) {
      // Reset when modal closes
      dataLoaded = false
    }
  })

  function addCriterion() {
    successCriteria = [...successCriteria, '']
  }

  function removeCriterion(index: number) {
    successCriteria = successCriteria.filter((_, i) => i !== index)
  }

  function updateCriterion(index: number, value: string) {
    successCriteria = successCriteria.map((c, i) => (i === index ? value : c))
  }

  async function handleSubmit() {
    if (saving) return

    saving = true
    try {
      const updateData = {
        success_criteria: successCriteria.filter((c) => c.trim()),
        horizon: horizon || undefined,
        owner_id: ownerId,
        formation_id: formationId || null,
        milestone_id: milestoneId || null,
      }
      await onSave(updateData)
      onClose()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update details')
    } finally {
      saving = false
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
</script>

{#if initiative}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    onclick={handleBackdropClick}
    role="presentation"
  >
    <div
      class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border p-6"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">Edit Details</h2>
        <p class="text-sm mt-1" style:color="var(--color-text-tertiary); font-weight: 300;">
          {initiative.title}
        </p>
      </div>

      <div class="space-y-4">
        <!-- Owner -->
        <div>
          <label
            for="owner-select"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-secondary)"
          >
            Owner
          </label>
          <ThemeEmployeeDropdown
            id="owner-select"
            bind:value={ownerId}
            disabled={loadingData}
            placeholder="Select owner"
            showDepartment={false}
            showPosition={false}
          />
        </div>

        <!-- Team (Formation) -->
        <div>
          <label
            for="formation-select"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-secondary)"
          >
            포메이션
          </label>
          <select
            id="formation-select"
            bind:value={formationId}
            disabled={loadingData}
            class="w-full px-3 py-2 rounded border text-sm"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            style:border-color="var(--color-border)"
          >
            <option value={null}>포메이션 없음</option>
            {#each formations as formation}
              <option value={formation.id}>{formation.name}</option>
            {/each}
          </select>
        </div>

        <!-- Milestone -->
        {#if initiative?.product_id}
          <MilestoneSelector
            productId={initiative.product_id}
            bind:selectedMilestoneId={milestoneId}
            onSelect={(id) => {
              milestoneId = id
            }}
          />
        {/if}

        <!-- Success Criteria -->
        <div>
          <div class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
            Success Criteria
          </div>
          <div class="space-y-2">
            {#each successCriteria as criterion, index}
              <div class="flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  oninput={(e) => updateCriterion(index, e.currentTarget.value)}
                  placeholder="Enter success criterion"
                  class="flex-1 px-3 py-2 rounded border text-sm"
                  style:background="var(--color-surface)"
                  style:color="var(--color-text-primary)"
                  style:border-color="var(--color-border)"
                  aria-label="Success criterion {index + 1}"
                />
                <button
                  type="button"
                  onclick={() => removeCriterion(index)}
                  class="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            {/each}
            <ThemeButton variant="ghost" size="sm" onclick={addCriterion}>
              + Add Criterion
            </ThemeButton>
          </div>
        </div>

        <!-- Target Date -->
        <div>
          <label
            for="target-date"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-secondary)"
          >
            Target Date
          </label>
          <input
            id="target-date"
            type="date"
            bind:value={horizon}
            class="w-full px-3 py-2 rounded border text-sm"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            style:border-color="var(--color-border)"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 mt-6">
        <ThemeButton variant="ghost" onclick={onClose} disabled={saving}>Cancel</ThemeButton>
        <ThemeButton variant="primary" onclick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </ThemeButton>
      </div>
    </div>
  </div>
{/if}
