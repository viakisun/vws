<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { JobTitle, Employee } from '$lib/types/hr'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import { TagIcon, EditIcon, PlusIcon, TrashIcon, UsersIcon } from '@lucide/svelte'

  let {
    jobTitles = [],
    employees = [],
    onAdd,
    onEdit,
    onDelete,
  }: {
    jobTitles: JobTitle[]
    employees?: Employee[]
    onAdd?: () => void
    onEdit?: (jobTitle: JobTitle) => void
    onDelete?: (jobTitle: JobTitle) => void
  } = $props()

  // 직책별 직원 수 계산
  function getEmployeeCount(jobTitleId: string): number {
    return employees.filter((e) => e.job_title_id === jobTitleId && e.status === 'active').length
  }
</script>

<ThemeSpacer size={6}>
  <!-- 헤더 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-6 h-6" style:color="var(--color-primary)">
          <TagIcon />
        </div>
        <div>
          <h3 class="text-lg font-semibold" style:color="var(--color-text)">직책 관리 (직책수당)</h3>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            총 {jobTitles.length}개 직책
          </p>
        </div>
      </div>
      {#if onAdd}
        <ThemeButton onclick={onAdd}>
          <PlusIcon class="w-4 h-4 mr-2" />
          직책 추가
        </ThemeButton>
      {/if}
    </div>
  </ThemeCard>

  <!-- 직책 테이블 -->
  <ThemeCard class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b" style:border-color="var(--color-border)">
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">직책명</th>
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">설명</th>
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">레벨</th>
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">인원</th>
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">직책수당</th>
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)">상태</th>
            <th class="px-4 py-3 text-center text-sm font-semibold" style:color="var(--color-text)">작업</th>
          </tr>
        </thead>
        <tbody>
          {#each jobTitles as jobTitle (jobTitle.id)}
            <tr class="border-b hover:bg-opacity-50 transition-colors" style:border-color="var(--color-border)">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style:background="var(--color-info-light)"
                  >
                    <div class="w-4 h-4" style:color="var(--color-info)">
                      <TagIcon />
                    </div>
                  </div>
                  <span class="font-medium" style:color="var(--color-text)">
                    {jobTitle.name}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text-secondary)">
                {jobTitle.description || '-'}
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {jobTitle.level || '-'}
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {getEmployeeCount(jobTitle.id)}명
              </td>
              <td class="px-4 py-3 text-sm font-medium" style:color="var(--color-success)">
                {jobTitle.allowance ? formatCurrency(jobTitle.allowance) : '-'}
              </td>
              <td class="px-4 py-3">
                <ThemeBadge variant={jobTitle.status === 'active' ? 'success' : 'secondary'}>
                  {jobTitle.status === 'active' ? '활성' : '비활성'}
                </ThemeBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  {#if onEdit}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(jobTitle)}>
                      <EditIcon class="w-4 h-4" />
                    </ThemeButton>
                  {/if}
                  {#if onDelete}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(jobTitle)}>
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
              <td colspan="7" class="px-4 py-12 text-center" style:color="var(--color-text-secondary)">
                등록된 직책이 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </ThemeCard>
</ThemeSpacer>
