<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Employee, Department, Position } from '$lib/types/hr'
  import { formatDate, formatEmployeeName } from '$lib/utils/format'
  import {
    getEmploymentTypeBadgeColor,
    getEmploymentTypeLabel,
    getLevelLabel,
    getStatusBadgeColor,
    getStatusLabel,
  } from '$lib/utils/hr'
  import {
    EditIcon,
    EyeIcon,
    MailIcon,
    PhoneIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
    UserPlusIcon,
  } from '@lucide/svelte'

  let {
    employees = [],
    departments = [],
    positions = [],
    searchTerm = '',
    statusFilter = 'all',
    departmentFilter = 'all',
    positionFilter = 'all',
    employmentTypeFilter = 'all',
    levelFilter = 'all',
    onAdd,
    onView,
    onEdit,
    onDelete,
    onSearchChange,
    onStatusFilterChange,
    onDepartmentFilterChange,
    onPositionFilterChange,
    onEmploymentTypeFilterChange,
    onLevelFilterChange,
  }: {
    employees: Employee[]
    departments?: Department[]
    positions?: Position[]
    searchTerm?: string
    statusFilter?: string
    departmentFilter?: string
    positionFilter?: string
    employmentTypeFilter?: string
    levelFilter?: string
    onAdd?: () => void
    onView?: (employee: Employee) => void
    onEdit?: (employee: Employee) => void
    onDelete?: (employee: Employee) => void
    onSearchChange?: (value: string) => void
    onStatusFilterChange?: (value: string) => void
    onDepartmentFilterChange?: (value: string) => void
    onPositionFilterChange?: (value: string) => void
    onEmploymentTypeFilterChange?: (value: string) => void
    onLevelFilterChange?: (value: string) => void
  } = $props()

  // 부서명 가져오기
  function getDepartmentName(departmentId: string): string {
    const dept = departments.find((d) => d.id === departmentId)
    return dept?.name || '-'
  }

  // 직급명 가져오기
  function getPositionName(positionId: string): string {
    const pos = positions.find((p) => p.id === positionId)
    return pos?.name || '-'
  }
</script>

<ThemeSpacer size={6}>
  <!-- 필터 및 검색 -->
  <ThemeCard class="p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">직원 목록</h3>
      {#if onAdd}
        <ThemeButton onclick={onAdd}>
          <UserPlusIcon class="w-4 h-4 mr-2" />
          직원 추가
        </ThemeButton>
      {/if}
    </div>

    <!-- 검색 바 -->
    <div class="mb-4">
      <div class="relative">
        <SearchIcon
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style:color="var(--color-text-secondary)"
        />
        <ThemeInput
          type="search"
          placeholder="이름, 사번, 이메일, 전화번호로 검색..."
          value={searchTerm}
          onchange={(e) => onSearchChange?.(e.currentTarget.value)}
          class="pl-10"
        />
      </div>
    </div>

    <!-- 필터 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <select
        class="px-3 py-2 rounded-lg border"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
        value={statusFilter}
        onchange={(e) => onStatusFilterChange?.(e.currentTarget.value)}
      >
        <option value="all">전체 상태</option>
        <option value="active">재직중</option>
        <option value="inactive">비활성</option>
        <option value="on-leave">휴직중</option>
        <option value="terminated">퇴사</option>
      </select>

      <select
        class="px-3 py-2 rounded-lg border"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
        value={departmentFilter}
        onchange={(e) => onDepartmentFilterChange?.(e.currentTarget.value)}
      >
        <option value="all">전체 부서</option>
        {#each departments as dept (dept.id)}
          <option value={dept.id}>{dept.name}</option>
        {/each}
      </select>

      <select
        class="px-3 py-2 rounded-lg border"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
        value={positionFilter}
        onchange={(e) => onPositionFilterChange?.(e.currentTarget.value)}
      >
        <option value="all">전체 직급</option>
        {#each positions as pos (pos.id)}
          <option value={pos.id}>{pos.name}</option>
        {/each}
      </select>

      <select
        class="px-3 py-2 rounded-lg border"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
        value={employmentTypeFilter}
        onchange={(e) => onEmploymentTypeFilterChange?.(e.currentTarget.value)}
      >
        <option value="all">전체 고용형태</option>
        <option value="full-time">정규직</option>
        <option value="part-time">파트타임</option>
        <option value="contract">계약직</option>
        <option value="intern">인턴</option>
      </select>

      <select
        class="px-3 py-2 rounded-lg border"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
        value={levelFilter}
        onchange={(e) => onLevelFilterChange?.(e.currentTarget.value)}
      >
        <option value="all">전체 레벨</option>
        <option value="intern">인턴</option>
        <option value="junior">주니어</option>
        <option value="mid">미드</option>
        <option value="senior">시니어</option>
        <option value="lead">리드</option>
        <option value="manager">매니저</option>
        <option value="director">디렉터</option>
      </select>
    </div>
  </ThemeCard>

  <!-- 직원 리스트 -->
  <div class="space-y-4">
    {#each employees as employee (employee.id)}
      <ThemeCard class="p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="text-lg font-semibold" style:color="var(--color-text)">
                {formatEmployeeName(employee.name)}
              </h4>
              <span class="text-sm" style:color="var(--color-text-secondary)">
                {employee.employee_id}
              </span>
              <ThemeBadge variant={getStatusBadgeColor(employee.status) as any}>
                {getStatusLabel(employee.status)}
              </ThemeBadge>
              <ThemeBadge variant={getEmploymentTypeBadgeColor(employee.employment_type) as any}>
                {getEmploymentTypeLabel(employee.employment_type)}
              </ThemeBadge>
              {#if employee.level}
                <ThemeBadge variant="primary">
                  {getLevelLabel(employee.level)}
                </ThemeBadge>
              {/if}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm" style:color="var(--color-text-secondary)">부서:</span>
                <span class="text-sm font-medium" style:color="var(--color-text)">
                  {getDepartmentName(employee.department_id)}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm" style:color="var(--color-text-secondary)">직급:</span>
                <span class="text-sm font-medium" style:color="var(--color-text)">
                  {getPositionName(employee.position_id)}
                </span>
              </div>
              {#if employee.email}
                <div class="flex items-center gap-2">
                  <MailIcon class="w-4 h-4" style:color="var(--color-text-secondary)" />
                  <a
                    href={`mailto:${employee.email}`}
                    class="text-sm hover:underline"
                    style:color="var(--color-primary)"
                  >
                    {employee.email}
                  </a>
                </div>
              {/if}
              {#if employee.phone}
                <div class="flex items-center gap-2">
                  <PhoneIcon class="w-4 h-4" style:color="var(--color-text-secondary)" />
                  <a
                    href={`tel:${employee.phone}`}
                    class="text-sm hover:underline"
                    style:color="var(--color-primary)"
                  >
                    {employee.phone}
                  </a>
                </div>
              {/if}
              <div class="flex items-center gap-2">
                <span class="text-sm" style:color="var(--color-text-secondary)">입사일:</span>
                <span class="text-sm font-medium" style:color="var(--color-text)">
                  {formatDate(employee.hire_date)}
                </span>
              </div>
              {#if employee.job_title}
                <div class="flex items-center gap-2">
                  <span class="text-sm" style:color="var(--color-text-secondary)">직책:</span>
                  <span class="text-sm font-medium" style:color="var(--color-text)">
                    {employee.job_title}
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            {#if onView}
              <ThemeButton size="sm" variant="secondary" onclick={() => onView(employee)}>
                <EyeIcon class="w-4 h-4" />
              </ThemeButton>
            {/if}
            {#if onEdit}
              <ThemeButton size="sm" variant="secondary" onclick={() => onEdit(employee)}>
                <EditIcon class="w-4 h-4" />
              </ThemeButton>
            {/if}
            {#if onDelete}
              <ThemeButton size="sm" variant="danger" onclick={() => onDelete(employee)}>
                <TrashIcon class="w-4 h-4" />
              </ThemeButton>
            {/if}
          </div>
        </div>
      </ThemeCard>
    {:else}
      <ThemeCard class="p-12 text-center">
        <p style:color="var(--color-text-secondary)">직원이 없습니다.</p>
      </ThemeCard>
    {/each}
  </div>
</ThemeSpacer>