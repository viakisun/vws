<script lang="ts">
  import type { InitiativeWithOwner } from '../types'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

  interface Employee {
    id: string
    first_name: string
    last_name: string
  }

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
    }) => Promise<void>
  }

  let { initiative, onClose, onSave }: Props = $props()

  let successCriteria = $state<string[]>([])
  let horizon = $state('')
  let ownerId = $state('')
  let formationId = $state<string | null>(null)
  let saving = $state(false)

  let employees = $state<Employee[]>([])
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
      formationId = initiative.formation_id
    }
  })

  // Load employees and formations once when modal opens
  $effect(() => {
    if (initiative && !dataLoaded) {
      dataLoaded = true
      loadingData = true
      Promise.all([fetch('/api/employees'), fetch('/api/planner/formations')])
        .then(async ([employeesRes, formationsRes]) => {
          if (employeesRes.ok) {
            const data = await employeesRes.json()
            // Filter active employees only and use 'employees' key
            const allEmployees = data.employees || []
            employees = allEmployees.filter((emp: any) => emp.status === 'active')
          }

          if (formationsRes.ok) {
            const data = await formationsRes.json()
            formations = data.data || []
          }
        })
        .catch((e) => {
          console.error('Failed to load data:', e)
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
      await onSave({
        success_criteria: successCriteria.filter((c) => c.trim()),
        horizon: horizon || undefined,
        owner_id: ownerId,
        formation_id: formationId || null,
      })
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
      </div>

      <div class="space-y-4">
        <!-- Owner -->
        <div>
          <label class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
            Owner
          </label>
          <select
            bind:value={ownerId}
            disabled={loadingData}
            class="w-full px-3 py-2 rounded border text-sm"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            style:border-color="var(--color-border)"
          >
            <option value="">Select owner</option>
            {#each employees as employee}
              <option value={employee.id}>{employee.last_name} {employee.first_name}</option>
            {/each}
          </select>
        </div>

        <!-- Team (Formation) -->
        <div>
          <label class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
            Team
          </label>
          <select
            bind:value={formationId}
            disabled={loadingData}
            class="w-full px-3 py-2 rounded border text-sm"
            style:background="var(--color-surface)"
            style:color="var(--color-text-primary)"
            style:border-color="var(--color-border)"
          >
            <option value={null}>No team</option>
            {#each formations as formation}
              <option value={formation.id}>{formation.name}</option>
            {/each}
          </select>
        </div>

        <!-- Success Criteria -->
        <div>
          <label class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
            Success Criteria
          </label>
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
          <label class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
            Target Date
          </label>
          <input
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
