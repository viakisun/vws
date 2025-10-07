<script lang="ts">
  /**
   * HR Management Page - Orchestrator
   *
   * Clean Architecture로 리팩토링된 인사 관리 페이지
   * - useHRManagement hook: 비즈니스 로직
   * - hrStore: 상태 관리
   * - hrService: API 호출
   * - Components: UI 렌더링
   */

  import { onMount } from 'svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import DepartmentManagement from '$lib/components/hr/DepartmentManagement.svelte'
  import EmployeeList from '$lib/components/hr/EmployeeList.svelte'
  import HROverviewTab from '$lib/components/hr/dashboard/HROverviewTab.svelte'
  import PositionManagement from '$lib/components/hr/PositionManagement.svelte'
  import DeleteConfirmModal from '$lib/components/ui/DeleteConfirmModal.svelte'
  import DepartmentModal from '$lib/components/ui/DepartmentModal.svelte'
  import EmployeeModal from '$lib/components/ui/EmployeeModal.svelte'
  import OrganizationChart from '$lib/components/ui/OrganizationChart.svelte'
  import PositionModal from '$lib/components/ui/PositionModal.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { useHRManagement } from '$lib/hooks/hr/useHRManagement.svelte'
  import {
    AwardIcon,
    BarChart3Icon,
    BriefcaseIcon,
    BuildingIcon,
    CrownIcon,
    NetworkIcon,
    TagIcon,
    UsersIcon,
  } from '@lucide/svelte'

  // Hook 사용
  const hr = useHRManagement()
  const { store, filteredEmployees, statistics } = hr

  // Stats for PageLayout
  const stats = $derived([
    {
      title: '총 직원수',
      value: statistics.total,
      change: `재직중 ${statistics.active}명`,
      trend: 'up' as const,
      icon: UsersIcon,
    },
    {
      title: '부서',
      value: statistics.departmentCount,
      change: `평균 ${Math.round(statistics.active / Math.max(statistics.departmentCount, 1))}명`,
      icon: BuildingIcon,
    },
    {
      title: '직급',
      value: statistics.positionCount,
      change: `평균 재직 ${statistics.avgTenure}년`,
      icon: AwardIcon,
    },
    {
      title: '휴직/휴가',
      value: statistics.onLeave,
      change: store.data.leaveRequests.filter((r) => r.status === 'pending').length + '건 대기중',
      icon: BriefcaseIcon,
    },
  ])

  // Tabs
  const tabs = [
    { id: 'overview', label: '대시보드', icon: BarChart3Icon },
    { id: 'employees', label: '직원관리', icon: UsersIcon },
    { id: 'departments', label: '부서관리', icon: BuildingIcon },
    { id: 'positions', label: '직급관리', icon: AwardIcon },
    { id: 'executives', label: '임원관리', icon: CrownIcon },
    { id: 'job-titles', label: '직책관리', icon: TagIcon },
    { id: 'org-chart', label: '조직도', icon: NetworkIcon },
  ]

  let activeTab = $state('overview')

  // 데이터 로드
  onMount(() => {
    hr.loadAllData()
  })

  // 탭별 컴포넌트 렌더링
  let activeComponent = $derived.by(() => {
    switch (activeTab) {
      case 'overview':
        return 'overview'
      case 'employees':
        return 'employees'
      case 'departments':
        return 'departments'
      case 'positions':
        return 'positions'
      case 'executives':
        return 'executives'
      case 'job-titles':
        return 'job-titles'
      case 'org-chart':
        return 'org-chart'
      default:
        return 'overview'
    }
  })
</script>

<PageLayout title="인사 관리" {stats}>
  <ThemeTabs {tabs} bind:activeTab>
    {#if activeComponent === 'overview'}
      <HROverviewTab />
    {:else if activeComponent === 'employees'}
      <EmployeeList
        employees={filteredEmployees}
        departments={store.data.departments}
        positions={store.data.positions}
        searchTerm={store.filters.searchTerm}
        statusFilter={store.filters.status}
        departmentFilter={store.filters.department}
        positionFilter={store.filters.position}
        employmentTypeFilter={store.filters.employmentType}
        levelFilter={store.filters.level}
        onAdd={() => store.openEmployeeModal()}
        onView={(employee) => {
          store.selected.employee = employee
          store.modals.showDetailView = true
        }}
        onEdit={(employee) => store.openEmployeeModal(employee)}
        onDelete={(employee) => store.openDeleteConfirm('employee', employee)}
        onSearchChange={(value) => store.setSearchTerm(value)}
        onStatusFilterChange={(value) => store.setStatusFilter(value as any)}
        onDepartmentFilterChange={(value) => store.setDepartmentFilter(value)}
        onPositionFilterChange={(value) => store.setPositionFilter(value)}
        onEmploymentTypeFilterChange={(value) => store.setEmploymentTypeFilter(value as any)}
        onLevelFilterChange={(value) => store.setLevelFilter(value as any)}
      />
    {:else if activeComponent === 'departments'}
      <DepartmentManagement
        departments={store.data.departments}
        employees={store.data.employees}
        onAdd={() => store.openDepartmentModal()}
        onEdit={(department) => store.openDepartmentModal(department)}
        onDelete={(department) => store.openDeleteConfirm('department', department)}
      />
    {:else if activeComponent === 'positions'}
      <PositionManagement
        positions={store.data.positions}
        employees={store.data.employees}
        onAdd={() => store.openPositionModal()}
        onEdit={(position) => store.openPositionModal(position)}
        onDelete={(position) => store.openDeleteConfirm('position', position)}
      />
    {:else if activeComponent === 'executives'}
      <ThemeCard class="p-12 text-center">
        <div class="w-12 h-12 mx-auto mb-4" style:color="var(--color-text-secondary)">
          <CrownIcon />
        </div>
        <p style:color="var(--color-text-secondary)">임원 관리 기능은 준비 중입니다.</p>
      </ThemeCard>
    {:else if activeComponent === 'job-titles'}
      <ThemeCard class="p-12 text-center">
        <div class="w-12 h-12 mx-auto mb-4" style:color="var(--color-text-secondary)">
          <TagIcon />
        </div>
        <p style:color="var(--color-text-secondary)">직책 관리 기능은 준비 중입니다.</p>
      </ThemeCard>
    {:else if activeComponent === 'org-chart'}
      <OrganizationChart
        employees={store.data.employees as any}
        departments={store.data.departments as any}
      />
    {/if}
  </ThemeTabs>
</PageLayout>

<!-- Modals -->
{#if store.modals.showEmployeeModal}
  <EmployeeModal
    employee={store.selected.employee as any}
    departments={store.data.departments as any}
    positions={store.data.positions as any}
    open={store.modals.showEmployeeModal}
    onclose={() => store.closeEmployeeModal()}
    onsave={() => hr.handleSave('employee')}
  />
{/if}

{#if store.modals.showDepartmentModal}
  <DepartmentModal
    department={store.selected.department as any}
    departments={store.data.departments as any}
    employees={store.data.employees as any}
    open={store.modals.showDepartmentModal}
    onclose={() => store.closeDepartmentModal()}
    onsave={() => hr.handleSave('department')}
  />
{/if}

{#if store.modals.showPositionModal}
  <PositionModal
    position={store.selected.position as any}
    open={store.modals.showPositionModal}
    onclose={() => store.closePositionModal()}
    onsave={() => hr.handleSave('position')}
  />
{/if}

{#if store.modals.showDeleteConfirm && store.selected.itemToDelete}
  <DeleteConfirmModal
    open={store.modals.showDeleteConfirm}
    title="삭제 확인"
    message={`정말로 ${store.selected.itemToDelete.item.name}을(를) 삭제하시겠습니까?`}
    itemName={store.selected.itemToDelete.item.name}
    onconfirm={() => hr.handleDelete()}
    onclose={() => store.closeDeleteConfirm()}
  />
{/if}