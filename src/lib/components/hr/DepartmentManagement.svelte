<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Department, Employee } from '$lib/types/hr'
  import { BuildingIcon, EditIcon, PlusIcon, TrashIcon } from '@lucide/svelte'

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
    const dept = departments.find((d) => d.id === departmentId)
    if (!dept) return 0
    return employees.filter((e) => e.department === dept.name && e.status === 'active').length
  }

  // 부서장 정보 가져오기
  function getManagerInfo(managerId?: string): string {
    if (!managerId) return '-'
    const manager = employees.find((e) => e.id === managerId)
    return manager ? manager.name || '-' : '-'
  }
</script>

<ThemeSpacer size={6}>
  <!-- 헤더 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-6 h-6" style:color="var(--color-primary)">
          <BuildingIcon />
        </div>
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

  <!-- 부서 테이블 -->
  <ThemeCard class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b" style:border-color="var(--color-border)">
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >부서명</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >부서코드</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >설명</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >인원</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >부서장</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >상태</th
            >
            <th class="px-4 py-3 text-center text-sm font-semibold" style:color="var(--color-text)"
              >작업</th
            >
          </tr>
        </thead>
        <tbody>
          {#each departments as department (department.id)}
            <tr
              class="border-b hover:bg-opacity-50 transition-colors"
              style:border-color="var(--color-border)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style:background="var(--color-primary-light)"
                  >
                    <div class="w-4 h-4" style:color="var(--color-primary)">
                      <BuildingIcon />
                    </div>
                  </div>
                  <span class="font-medium" style:color="var(--color-text)">
                    {department.name}
                  </span>
                </div>
              </td>
              <!-- <td class="px-4 py-3 text-sm" style:color="var(--color-text-secondary)">
                {department.code || '-'}
              </td> -->
              <td class="px-4 py-3 text-sm" style:color="var(--color-text-secondary)">
                {department.description || '-'}
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {getEmployeeCount(department.id)}명
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {getManagerInfo(department.manager_id)}
              </td>
              <td class="px-4 py-3">
                <ThemeBadge variant={department.status === 'active' ? 'success' : 'default'}>
                  {department.status === 'active' ? '활성' : '비활성'}
                </ThemeBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  {#if onEdit}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(department)}>
                      <EditIcon class="w-4 h-4" />
                    </ThemeButton>
                  {/if}
                  {#if onDelete}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(department)}>
                      <div class="w-4 h-4" style:color="var(--color-error)">
                        <TrashIcon />
                      </div>
                    </ThemeButton>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td
                colspan="7"
                class="px-4 py-12 text-center"
                style:color="var(--color-text-secondary)"
              >
                등록된 부서가 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </ThemeCard>
</ThemeSpacer>
