<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Position, Employee } from '$lib/types/hr'
  import { formatCurrency } from '$lib/utils/format'
  import { AwardIcon, EditIcon, PlusIcon, TrashIcon } from '@lucide/svelte'

  const {
    positions = [],
    employees = [],
    onAdd,
    onEdit,
    onDelete,
  }: {
    positions: Position[]
    employees?: Employee[]
    onAdd?: () => void
    onEdit?: (position: Position) => void
    onDelete?: (position: Position) => void
  } = $props()

  // 직급별 직원 수 계산
  function getEmployeeCount(positionId: string): number {
    const pos = positions.find((p) => p.id === positionId)
    if (!pos) return 0
    return employees.filter((e) => e.position === pos.name && e.status === 'active').length
  }

  // 직급 레벨 색상
  function getLevelColor(level?: number): string {
    if (!level) return 'secondary'
    if (level >= 7) return 'error' // 임원급
    if (level >= 5) return 'warning' // 매니저급
    if (level >= 3) return 'info' // 시니어급
    return 'success' // 주니어급
  }

  // 직급 레벨 라벨
  function getLevelLabel(level?: number): string {
    if (!level) return '미정'
    if (level >= 7) return '임원급'
    if (level >= 5) return '매니저급'
    if (level >= 3) return '시니어급'
    return '주니어급'
  }
</script>

<ThemeSpacer size={6}>
  <!-- 헤더 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-6 h-6" style:color="var(--color-primary)">
          <AwardIcon />
        </div>
        <div>
          <h3 class="text-lg font-semibold" style:color="var(--color-text)">직급/직책 관리</h3>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            총 {positions.length}개 직급/직책
          </p>
        </div>
      </div>
      {#if onAdd}
        <ThemeButton onclick={onAdd}>
          <PlusIcon class="w-4 h-4 mr-2" />
          직급/직책 추가
        </ThemeButton>
      {/if}
    </div>
  </ThemeCard>

  <!-- 직급 테이블 -->
  <ThemeCard class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b" style:border-color="var(--color-border)">
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >직급명</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >직급코드</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >설명</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >레벨</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >인원</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >급여범위</th
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
          {#each [...positions].sort((a, b) => (b.level || 0) - (a.level || 0)) as position (position.id)}
            <tr
              class="border-b hover:bg-opacity-50 transition-colors"
              style:border-color="var(--color-border)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style:background="var(--color-{getLevelColor(position.level)}-light)"
                  >
                    <div class="w-4 h-4" style:color="var(--color-{getLevelColor(position.level)})">
                      <AwardIcon />
                    </div>
                  </div>
                  <span class="font-medium" style:color="var(--color-text)">
                    {position.name}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text-secondary)">
                {position.code || '-'}
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text-secondary)">
                {position.description || '-'}
              </td>
              <td class="px-4 py-3">
                {#if position.level}
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium" style:color="var(--color-text)">
                      {position.level}
                    </span>
                    <ThemeBadge variant={getLevelColor(position.level) as any}>
                      {getLevelLabel(position.level)}
                    </ThemeBadge>
                  </div>
                {:else}
                  <span class="text-sm" style:color="var(--color-text-secondary)">-</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {getEmployeeCount(position.id)}명
              </td>
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {#if position.min_salary || position.max_salary}
                  {position.min_salary ? formatCurrency(position.min_salary) : ''}
                  {position.min_salary && position.max_salary ? ' ~ ' : ''}
                  {position.max_salary ? formatCurrency(position.max_salary) : ''}
                {:else}
                  -
                {/if}
              </td>
              <td class="px-4 py-3">
                <ThemeBadge variant={position.status === 'active' ? 'success' : 'default'}>
                  {position.status === 'active' ? '활성' : '비활성'}
                </ThemeBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  {#if onEdit}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(position)}>
                      <EditIcon class="w-4 h-4" />
                    </ThemeButton>
                  {/if}
                  {#if onDelete}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(position)}>
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
                colspan="8"
                class="px-4 py-12 text-center"
                style:color="var(--color-text-secondary)"
              >
                등록된 직급이 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </ThemeCard>
</ThemeSpacer>
