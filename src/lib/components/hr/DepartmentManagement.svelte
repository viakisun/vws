<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Department, Employee } from '$lib/types/hr'
  import { formatDate } from '$lib/utils/format'
  import {
    BuildingIcon,
    EditIcon,
    PlusIcon,
    TrashIcon,
    UsersIcon,
  } from '@lucide/svelte'

  let {
    departments = [],
    employees = [],
    onAdd,
    onEdit,
    onDelete,
  }: {
    departments: Department[]
    employees?: Employee[]
    onAdd?: () => void
    onEdit?: (department: Department) => void
    onDelete?: (department: Department) => void
  } = $props()

  // 부서별 직원 수 계산
  function getEmployeeCount(departmentId: string): number {
    return employees.filter(
      (e) => e.department_id === departmentId && e.status === 'active'
    ).length
  }

  // 부서장 정보 가져오기
  function getManagerInfo(managerId?: string): string {
    if (!managerId) return '-'
    const manager = employees.find((e) => e.id === managerId)
    return manager ? manager.name : '-'
  }
</script>

<ThemeSpacer size={6}>
  <!-- 헤더 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <BuildingIcon class="w-6 h-6" style:color="var(--color-primary)" />
        <div>
          <h3 class="text-lg font-semibold" style:color="var(--color-text)">부서 관리</h3>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            총 {departments.length}개 부서
          </p>
        </div>
      </div>
      {#if onAdd}
        <ThemeButton onclick={onAdd}>
          <PlusIcon class="w-4 h-4 mr-2" />
          부서 추가
        </ThemeButton>
      {/if}
    </div>
  </ThemeCard>

  <!-- 부서 리스트 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each departments as department (department.id)}
      <ThemeCard class="p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center"
              style:background="var(--color-primary-light)"
            >
              <BuildingIcon class="w-6 h-6" style:color="var(--color-primary)" />
            </div>
            <div>
              <h4 class="font-semibold" style:color="var(--color-text)">
                {department.name}
              </h4>
              {#if department.code}
                <span class="text-sm" style:color="var(--color-text-secondary)">
                  {department.code}
                </span>
              {/if}
            </div>
          </div>
          <div class="flex gap-1">
            {#if onEdit}
              <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(department)}>
                <EditIcon class="w-4 h-4" />
              </ThemeButton>
            {/if}
            {#if onDelete}
              <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(department)}>
                <TrashIcon class="w-4 h-4" style:color="var(--color-error)" />
              </ThemeButton>
            {/if}
          </div>
        </div>

        <div class="space-y-2">
          {#if department.description}
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {department.description}
            </p>
          {/if}

          <div class="flex items-center gap-2">
            <UsersIcon class="w-4 h-4" style:color="var(--color-text-secondary)" />
            <span class="text-sm" style:color="var(--color-text)">
              {getEmployeeCount(department.id)}명
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm" style:color="var(--color-text-secondary)">부서장:</span>
            <span class="text-sm font-medium" style:color="var(--color-text)">
              {getManagerInfo(department.manager_id)}
            </span>
          </div>

          {#if department.parent_department_id}
            <div class="flex items-center gap-2">
              <span class="text-sm" style:color="var(--color-text-secondary)">상위부서:</span>
              <span class="text-sm font-medium" style:color="var(--color-text)">
                {departments.find((d) => d.id === department.parent_department_id)?.name || '-'}
              </span>
            </div>
          {/if}

          {#if department.created_at}
            <div class="flex items-center gap-2">
              <span class="text-sm" style:color="var(--color-text-secondary)">생성일:</span>
              <span class="text-sm" style:color="var(--color-text)">
                {formatDate(department.created_at)}
              </span>
            </div>
          {/if}

          {#if department.status}
            <div class="mt-2">
              <ThemeBadge variant={department.status === 'active' ? 'success' : 'secondary'}>
                {department.status === 'active' ? '활성' : '비활성'}
              </ThemeBadge>
            </div>
          {/if}
        </div>
      </ThemeCard>
    {:else}
      <ThemeCard class="col-span-full p-12 text-center">
        <BuildingIcon
          class="w-12 h-12 mx-auto mb-4"
          style:color="var(--color-text-secondary)"
        />
        <p style:color="var(--color-text-secondary)">등록된 부서가 없습니다.</p>
        {#if onAdd}
          <ThemeButton onclick={onAdd} class="mt-4">
            <PlusIcon class="w-4 h-4 mr-2" />
            첫 부서 추가하기
          </ThemeButton>
        {/if}
      </ThemeCard>
    {/each}
  </div>
</ThemeSpacer>