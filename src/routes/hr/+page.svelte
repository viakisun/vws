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
  import JobTitleManagement from '$lib/components/hr/JobTitleManagement.svelte'
  import PositionManagement from '$lib/components/hr/PositionManagement.svelte'
  import DeleteConfirmModal from '$lib/components/ui/DeleteConfirmModal.svelte'
  import DepartmentModal from '$lib/components/ui/DepartmentModal.svelte'
  import EmployeeModal from '$lib/components/ui/EmployeeModal.svelte'
  import JobTitleModal from '$lib/components/ui/JobTitleModal.svelte'
  import OrganizationChart from '$lib/components/ui/OrganizationChart.svelte'
  import PositionModal from '$lib/components/ui/PositionModal.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { useHRManagement } from '$lib/hooks/hr/useHRManagement.svelte'
  import {
    AwardIcon,
    ChartBarIcon,
    BriefcaseIcon,
    BuildingIcon,
    NetworkIcon,
    TagIcon,
    UsersIcon,
  } from '@lucide/svelte'

  // Hook 사용
  const hr = useHRManagement()
  const { store } = hr

  // Stats for PageLayout
  const stats = $derived([
    {
      title: '총 직원수',
      value: hr.statistics.total,
      change: `재직중 ${hr.statistics.active}명`,
      trend: 'up' as const,
      icon: UsersIcon,
    },
    {
      title: '부서',
      value: hr.statistics.departmentCount,
      change: `평균 ${Math.round(hr.statistics.active / Math.max(hr.statistics.departmentCount, 1))}명`,
      icon: BuildingIcon,
    },
    {
      title: '직급',
      value: hr.statistics.positionCount,
      change: `평균 재직 ${hr.statistics.avgTenure}년`,
      icon: AwardIcon,
    },
    {
      title: '휴직/휴가',
      value: hr.statistics.onLeave,
      change: store.data.leaveRequests.filter((r) => r.status === 'pending').length + '건 대기중',
      icon: BriefcaseIcon,
    },
  ])

  // Tabs
  const tabs = [
    { id: 'overview', label: '대시보드', icon: ChartBarIcon },
    { id: 'employees', label: '직원관리', icon: UsersIcon },
    { id: 'departments', label: '부서관리', icon: BuildingIcon },
    { id: 'positions', label: '직급관리', icon: AwardIcon },
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
        employees={hr.filteredEmployees}
        departments={store.data.departments}
        positions={store.data.positions}
        jobTitles={store.data.jobTitles}
        searchTerm={store.filters.searchTerm}
        statusFilter={store.filters.status}
        departmentFilter={store.filters.department}
        positionFilter={store.filters.position}
        employmentTypeFilter={store.filters.employmentType}
        levelFilter={store.filters.level}
        onAdd={() => store.openEmployeeModal()}
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
    {:else if activeComponent === 'job-titles'}
      <JobTitleManagement
        jobTitles={store.data.jobTitles}
        employees={store.data.employees}
        onAdd={() => {
          // @ts-ignore - JobTitle modal methods exist in runtime
          store.openJobTitleModal()
        }}
        onEdit={(jobTitle) => {
          // @ts-ignore - JobTitle modal methods exist in runtime
          store.openJobTitleModal(jobTitle)
        }}
        onDelete={(jobTitle) => store.openDeleteConfirm('jobTitle', jobTitle)}
      />
    {:else if activeComponent === 'org-chart'}
      <OrganizationChart />
    {/if}
  </ThemeTabs>
</PageLayout>

<!-- Modals -->
{#if store.modals.showEmployeeModal}
  <EmployeeModal
    employee={(store.selected as any).editingEmployee}
    departments={store.data.departments as any}
    positions={store.data.positions as any}
    jobTitles={store.data.jobTitles as any}
    open={store.modals.showEmployeeModal}
    on:close={() => store.closeEmployeeModal()}
    on:save={(e) => {
      store.forms.employee = e.detail
      hr.handleSave('employee')
    }}
  />
{/if}

{#if store.modals.showDepartmentModal}
  <DepartmentModal
    department={(store.selected as any).editingDepartment}
    open={store.modals.showDepartmentModal}
    on:close={() => store.closeDepartmentModal()}
    on:save={() => hr.handleSave('department')}
  />
{/if}

{#if store.modals.showPositionModal}
  <PositionModal
    position={(store.selected as any).editingPosition}
    open={store.modals.showPositionModal}
    on:close={() => store.closePositionModal()}
    on:save={() => hr.handleSave('position')}
  />
{/if}

{#if store.modals.showJobTitleModal}
  <JobTitleModal
    jobTitle={(store.selected as any).editingJobTitle}
    open={store.modals.showJobTitleModal}
    on:close={() => {
      // @ts-ignore - JobTitle modal methods exist in runtime
      store.closeJobTitleModal()
    }}
    on:save={() => hr.handleSave('jobTitle')}
  />
{/if}

{#if store.modals.showDeleteConfirm && store.selected.itemToDelete}
  {@const item = store.selected.itemToDelete.item}
  {@const isEmployee = store.selected.itemToDelete.type === 'employee'}
  {@const displayName = item.name || `${item.last_name}${item.first_name}`}
  <DeleteConfirmModal
    open={store.modals.showDeleteConfirm}
    title="삭제 확인"
    message={`정말로 ${displayName}을(를) 삭제하시겠습니까?`}
    itemName={displayName}
    {...(isEmployee ? {
      confirmText: item.employee_id,
      confirmLabel: '직원 번호를 입력하여 삭제를 확인하세요'
    } : {})}
    showArchive={isEmployee}
    on:confirm={(e) => {
      // @ts-ignore - handleDelete accepts action parameter
      hr.handleDelete(e.detail.action)
    }}
    on:close={() => store.closeDeleteConfirm()}
  />
{/if}
