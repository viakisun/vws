<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Position, Employee } from '$lib/types/hr'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    AwardIcon,
    EditIcon,
    PlusIcon,
    TrashIcon,
    UsersIcon,
  } from '@lucide/svelte'

  let {
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
    return employees.filter(
      (e) => e.position_id === positionId && e.status === 'active'
    ).length
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
        <AwardIcon class="w-6 h-6" style:color="var(--color-primary)" />
        <div>
          <h3 class="text-lg font-semibold" style:color="var(--color-text)">직급 관리</h3>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            총 {positions.length}개 직급
          </p>
        </div>
      </div>
      {#if onAdd}
        <ThemeButton onclick={onAdd}>
          <PlusIcon class="w-4 h-4 mr-2" />
          직급 추가
        </ThemeButton>
      {/if}
    </div>
  </ThemeCard>

  <!-- 직급 리스트 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each positions.sort((a, b) => (b.level || 0) - (a.level || 0)) as position (position.id)}
      <ThemeCard class="p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center"
              style:background="var(--color-{getLevelColor(position.level)}-light)"
            >
              <AwardIcon
                class="w-6 h-6"
                style:color="var(--color-{getLevelColor(position.level)})"
              />
            </div>
            <div>
              <h4 class="font-semibold" style:color="var(--color-text)">
                {position.name}
              </h4>
              {#if position.code}
                <span class="text-sm" style:color="var(--color-text-secondary)">
                  {position.code}
                </span>
              {/if}
            </div>
          </div>
          <div class="flex gap-1">
            {#if onEdit}
              <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(position)}>
                <EditIcon class="w-4 h-4" />
              </ThemeButton>
            {/if}
            {#if onDelete}
              <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(position)}>
                <TrashIcon class="w-4 h-4" style:color="var(--color-error)" />
              </ThemeButton>
            {/if}
          </div>
        </div>

        <div class="space-y-2">
          {#if position.description}
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {position.description}
            </p>
          {/if}

          <div class="flex items-center gap-2">
            <UsersIcon class="w-4 h-4" style:color="var(--color-text-secondary)" />
            <span class="text-sm" style:color="var(--color-text)">
              {getEmployeeCount(position.id)}명
            </span>
          </div>

          {#if position.level}
            <div class="flex items-center gap-2">
              <span class="text-sm" style:color="var(--color-text-secondary)">레벨:</span>
              <span class="text-sm font-medium" style:color="var(--color-text)">
                {position.level}
              </span>
              <ThemeBadge variant={getLevelColor(position.level) as any}>
                {getLevelLabel(position.level)}
              </ThemeBadge>
            </div>
          {/if}

          {#if position.min_salary || position.max_salary}
            <div class="flex items-center gap-2">
              <span class="text-sm" style:color="var(--color-text-secondary)">급여범위:</span>
              <span class="text-sm font-medium" style:color="var(--color-text)">
                {position.min_salary ? formatCurrency(position.min_salary) : ''}
                {position.min_salary && position.max_salary ? ' ~ ' : ''}
                {position.max_salary ? formatCurrency(position.max_salary) : ''}
              </span>
            </div>
          {/if}

          {#if position.created_at}
            <div class="flex items-center gap-2">
              <span class="text-sm" style:color="var(--color-text-secondary)">생성일:</span>
              <span class="text-sm" style:color="var(--color-text)">
                {formatDate(position.created_at)}
              </span>
            </div>
          {/if}

          {#if position.status}
            <div class="mt-2">
              <ThemeBadge variant={position.status === 'active' ? 'success' : 'secondary'}>
                {position.status === 'active' ? '활성' : '비활성'}
              </ThemeBadge>
            </div>
          {/if}
        </div>
      </ThemeCard>
    {:else}
      <ThemeCard class="col-span-full p-12 text-center">
        <AwardIcon class="w-12 h-12 mx-auto mb-4" style:color="var(--color-text-secondary)" />
        <p style:color="var(--color-text-secondary)">등록된 직급이 없습니다.</p>
        {#if onAdd}
          <ThemeButton onclick={onAdd} class="mt-4">
            <PlusIcon class="w-4 h-4 mr-2" />
            첫 직급 추가하기
          </ThemeButton>
        {/if}
      </ThemeCard>
    {/each}
  </div>
</ThemeSpacer>