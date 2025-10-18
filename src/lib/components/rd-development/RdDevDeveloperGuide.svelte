<script lang="ts">
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import { ChevronDownIcon, ChevronUpIcon, CodeIcon, MapPinIcon } from 'lucide-svelte'

  interface Props {
    phases: any[]
    technicalSpecs: any[]
    testLocations: any[]
    viaRoles: any[]
    class?: string
  }

  let { phases, technicalSpecs, testLocations, viaRoles, class: className = '' }: Props = $props()

  let expandedPhases = $state<Set<string>>(new Set([phases[0]?.id]))

  function togglePhase(phaseId: string) {
    if (expandedPhases.has(phaseId)) {
      expandedPhases.delete(phaseId)
    } else {
      expandedPhases.add(phaseId)
    }
    expandedPhases = new Set(expandedPhases)
  }

  function getPhaseSpecs(phaseId: string) {
    return technicalSpecs.filter((spec: any) => spec.phase_id === phaseId)
  }

  function getPhaseViaRoles(phaseId: string) {
    return viaRoles.filter((role: any) => role.phase_id === phaseId)
  }
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <SectionHeader title="개발자 가이드" />

  {#if testLocations.length > 0}
    <div class="mb-6">
      <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
        테스트 환경
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each testLocations as location}
          <div
            class="p-4 rounded-lg border"
            style="background: var(--color-surface); border-color: var(--color-border)"
          >
            <div class="flex items-start gap-2 mb-2">
              <MapPinIcon size={16} class="mt-0.5" />
              <div class="flex-1">
                <div class="text-sm font-medium mb-1" style:color="var(--color-text-primary)">
                  {location.location_name}
                </div>
                {#if location.location_type}
                  <div class="text-xs mb-2" style:color="var(--color-text-secondary)">
                    {location.location_type}
                  </div>
                {/if}
                {#if location.address}
                  <div class="text-xs" style:color="var(--color-text-tertiary)">
                    {location.address}
                  </div>
                {/if}
              </div>
            </div>
            {#if location.facilities}
              <div class="mt-2 flex flex-wrap gap-1">
                {#each location.facilities as facility}
                  <span
                    class="px-2 py-0.5 text-xs rounded"
                    style:background="var(--color-blue-light)"
                    style:color="var(--color-blue)"
                  >
                    {facility}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if viaRoles.length > 0}
    <div class="mb-6">
      <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
        VIA 개발 역할
      </h3>

      {#if phases.length > 0}
        <div class="space-y-2">
          {#each phases as phase}
            {@const phaseRoles = getPhaseViaRoles(phase.id)}

            {#if phaseRoles.length > 0}
              <div
                class="rounded-lg border overflow-hidden"
                style:background="var(--color-surface)"
                style:border-color="var(--color-border)"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between p-4 transition hover:opacity-80"
                  style:background="var(--color-background)"
                  onclick={() => togglePhase(phase.id)}
                >
                  <div class="flex items-center gap-3">
                    <CodeIcon size={18} />
                    <span class="text-sm font-semibold" style:color="var(--color-text-primary)">
                      Phase {phase.phase_number}-Year {phase.year_number}
                    </span>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      style:background="var(--color-blue-light)"
                      style:color="var(--color-blue)"
                    >
                      {phaseRoles.length}개 역할
                    </span>
                  </div>
                  {#if expandedPhases.has(phase.id)}
                    <ChevronUpIcon size={18} />
                  {:else}
                    <ChevronDownIcon size={18} />
                  {/if}
                </button>

                {#if expandedPhases.has(phase.id)}
                  <div class="p-4 space-y-3">
                    {#each phaseRoles as role}
                      <div
                        class="p-4 rounded-lg border"
                        style:background="var(--color-surface)"
                        style:border-color="var(--color-border)"
                      >
                        <div class="flex items-start justify-between gap-3 mb-2">
                          <div class="text-sm font-medium" style:color="var(--color-text-primary)">
                            {role.role_title}
                          </div>
                          {#if role.role_category}
                            <span
                              class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                              style:background="var(--color-blue-light)"
                              style:color="var(--color-blue)"
                            >
                              {role.role_category}
                            </span>
                          {/if}
                        </div>
                        {#if role.role_description}
                          <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
                            {role.role_description}
                          </p>
                        {/if}
                        {#if role.technical_details}
                          <div class="flex flex-wrap gap-1">
                            {#each Object.entries(role.technical_details) as [key, value]}
                              {#if typeof value === 'string'}
                                <span
                                  class="px-2 py-0.5 text-xs rounded"
                                  style:background="var(--color-background)"
                                  style:color="var(--color-text-secondary)"
                                >
                                  {value}
                                </span>
                              {/if}
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="space-y-2">
          {#each viaRoles as role}
            <div
              class="p-4 rounded-lg border"
              style:background="var(--color-surface)"
              style:border-color="var(--color-border)"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="text-sm font-medium" style:color="var(--color-text-primary)">
                  {role.role_title}
                </div>
                {#if role.role_category}
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                    style:background="var(--color-blue-light)"
                    style:color="var(--color-blue)"
                  >
                    {role.role_category}
                  </span>
                {/if}
              </div>
              {#if role.role_description}
                <p class="text-xs" style:color="var(--color-text-secondary)">
                  {role.role_description}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if viaRoles.length === 0 && testLocations.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">
        아직 개발 가이드 정보가 없습니다.
      </p>
    </div>
  {/if}
</div>
