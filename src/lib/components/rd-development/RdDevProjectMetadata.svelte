<script lang="ts">
  import { ChevronDownIcon, ChevronUpIcon } from 'lucide-svelte'

  interface Props {
    project: any
    institutions: any[]
    viaRoles: any[]
    technicalSpecs: any[]
    class?: string
  }

  let { project, institutions, viaRoles, technicalSpecs, class: className = '' }: Props = $props()

  let isExpanded = $state(false)

  function formatCurrency(amount?: number): string {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const totalBudget = $derived(
    (project.government_funding || 0) + (project.institution_funding || 0),
  )
</script>

<div
  class="p-6 rounded-lg border {className}"
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <div class="flex items-center justify-between mb-4">
    <button
      type="button"
      class="flex-1 flex items-center"
      onclick={() => (isExpanded = !isExpanded)}
    >
      <h3 class="text-xl font-light" style:color="var(--color-text-primary)">프로젝트 상세 정보</h3>
    </button>
    {#if isExpanded}
      <ChevronUpIcon size={20} />
    {:else}
      <ChevronDownIcon size={20} />
    {/if}
  </div>

  {#if isExpanded}
    <div class="mt-6 space-y-6">
      <!-- Budget Info -->
      <div>
        <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
          예산 정보
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 rounded-lg" style:background="var(--color-background)">
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              정부지원
            </div>
            <div class="text-lg font-bold" style:color="var(--color-primary)">
              {formatCurrency(project.government_funding)}
            </div>
          </div>
          <div class="p-4 rounded-lg" style:background="var(--color-background)">
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              기관부담
            </div>
            <div class="text-lg font-bold" style:color="var(--color-blue)">
              {formatCurrency(project.institution_funding)}
            </div>
          </div>
          <div class="p-4 rounded-lg" style:background="var(--color-background)">
            <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
              총 예산
            </div>
            <div class="text-lg font-bold" style:color="var(--color-text-primary)">
              {formatCurrency(totalBudget)}
            </div>
          </div>
        </div>
      </div>

      <!-- Institutions -->
      {#if institutions.length > 0}
        <div>
          <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
            참여기관 ({institutions.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each institutions as institution}
              <div
                class="p-4 rounded-lg border"
                style:background="var(--color-surface)"
                style:border-color="var(--color-border)"
              >
                <div class="text-sm font-medium mb-1" style:color="var(--color-text-primary)">
                  {institution.institution_name}
                </div>
                {#if institution.institution_type}
                  <div class="text-xs" style:color="var(--color-text-secondary)">
                    {institution.institution_type}
                  </div>
                {/if}
                {#if institution.role_description}
                  <div class="text-xs mt-2" style:color="var(--color-text-tertiary)">
                    {institution.role_description}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- VIA Roles -->
      {#if viaRoles.length > 0}
        <div>
          <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
            VIA 역할 ({viaRoles.length})
          </h3>
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
        </div>
      {/if}

      <!-- Phase Durations -->
      <div>
        <h3 class="text-base font-medium mb-3" style:color="var(--color-text-primary)">
          단계별 기간
        </h3>
        <div class="grid grid-cols-3 gap-4">
          {#if project.phase_1_duration_months}
            <div class="p-4 rounded-lg" style:background="var(--color-background)">
              <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
                Phase 1
              </div>
              <div class="text-lg font-bold" style:color="var(--color-text-primary)">
                {project.phase_1_duration_months}개월
              </div>
            </div>
          {/if}
          {#if project.phase_2_duration_months}
            <div class="p-4 rounded-lg" style:background="var(--color-background)">
              <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
                Phase 2
              </div>
              <div class="text-lg font-bold" style:color="var(--color-text-primary)">
                {project.phase_2_duration_months}개월
              </div>
            </div>
          {/if}
          {#if project.phase_3_duration_months}
            <div class="p-4 rounded-lg" style:background="var(--color-background)">
              <div class="text-xs font-semibold mb-1" style:color="var(--color-text-tertiary)">
                Phase 3
              </div>
              <div class="text-lg font-bold" style:color="var(--color-text-primary)">
                {project.phase_3_duration_months}개월
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
