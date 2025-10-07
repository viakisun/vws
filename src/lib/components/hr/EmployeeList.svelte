<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Employee, Department, Position, JobTitle } from '$lib/types/hr'
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
    jobTitles = [],
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
    jobTitles?: JobTitle[]
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

  // 직책명 가져오기
  function getJobTitleName(jobTitleId?: string): string {
    if (!jobTitleId) return '-'
    const jobTitle = jobTitles.find((jt) => jt.id === jobTitleId)
    return jobTitle?.name || '-'
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
        <div
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style:color="var(--color-text-secondary)"
        >
          <SearchIcon />
        </div>
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

  <!-- 직원 테이블 -->
  <ThemeCard class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b" style:border-color="var(--color-border)">
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >직원정보</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >부서</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >직급/직책</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >상태</th
            >
            <th class="px-4 py-3 text-left text-sm font-semibold" style:color="var(--color-text)"
              >연락처</th
            >
            <th class="px-4 py-3 text-center text-sm font-semibold" style:color="var(--color-text)"
              >작업</th
            >
          </tr>
        </thead>
        <tbody>
          {#each employees as employee (employee.id)}
            <tr
              class="border-b hover:bg-opacity-50 transition-colors"
              style:border-color="var(--color-border)"
              style:background="transparent"
            >
              <!-- 직원정보 (2줄) -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <!-- 1줄: 이름 -->
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style:background="var(--color-primary)"
                    >
                      {employee.last_name.charAt(0)}
                    </div>
                    <span class="font-medium" style:color="var(--color-text)">
                      {employee.last_name}{employee.first_name}
                    </span>
                  </div>
                  <!-- 2줄: 사번 / 입사일 -->
                  <div class="text-xs ml-10" style:color="var(--color-text-secondary)">
                    {employee.employee_id} · 입사 {formatDate(employee.hire_date)}
                  </div>
                </div>
              </td>

              <!-- 부서 -->
              <td class="px-4 py-3 text-sm" style:color="var(--color-text)">
                {employee.department || '-'}
              </td>

              <!-- 직급/직책 (2줄) -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <div class="text-sm" style:color="var(--color-text)">
                    {employee.position || '-'}
                  </div>
                  <div class="text-xs" style:color="var(--color-text-secondary)">
                    {getJobTitleName(employee.job_title_id)}
                  </div>
                </div>
              </td>

              <!-- 상태 -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <ThemeBadge variant={getStatusBadgeColor(employee.status) as any}>
                    {getStatusLabel(employee.status)}
                  </ThemeBadge>
                  <ThemeBadge
                    variant={getEmploymentTypeBadgeColor(employee.employment_type) as any}
                  >
                    {getEmploymentTypeLabel(employee.employment_type)}
                  </ThemeBadge>
                </div>
              </td>

              <!-- 연락처 (2줄) -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <!-- 이메일 -->
                  {#if employee.email}
                    <a
                      href={`mailto:${employee.email}`}
                      class="text-xs hover:underline truncate max-w-[200px]"
                      style:color="var(--color-primary)"
                      title={employee.email}
                    >
                      {employee.email}
                    </a>
                  {:else}
                    <span class="text-xs" style:color="var(--color-text-secondary)">-</span>
                  {/if}
                  <!-- 전화번호 -->
                  {#if employee.phone}
                    <a
                      href={`tel:${employee.phone}`}
                      class="text-xs hover:underline"
                      style:color="var(--color-primary)"
                    >
                      {employee.phone}
                    </a>
                  {:else}
                    <span class="text-xs" style:color="var(--color-text-secondary)">-</span>
                  {/if}
                </div>
              </td>

              <!-- 작업 -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  {#if onEdit}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onEdit(employee)}>
                      <EditIcon class="w-4 h-4" />
                    </ThemeButton>
                  {/if}
                  {#if onDelete}
                    <ThemeButton size="sm" variant="ghost" onclick={() => onDelete(employee)}>
                      <span style:color="var(--color-error)">
                        <TrashIcon class="w-4 h-4" />
                      </span>
                    </ThemeButton>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td
                colspan="6"
                class="px-4 py-12 text-center"
                style:color="var(--color-text-secondary)"
              >
                직원이 없습니다.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </ThemeCard>
</ThemeSpacer>
