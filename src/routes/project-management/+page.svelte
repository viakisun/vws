<script lang="ts">
  import { logger } from '$lib/utils/logger'

  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import AnnualBudgetForm from '$lib/components/project-management/AnnualBudgetForm.svelte'
  import ParticipationCard from '$lib/components/project-management/ParticipationCard.svelte'
  import ProjectCreationForm from '$lib/components/project-management/ProjectCreationForm.svelte'
  import ProjectListCard from '$lib/components/project-management/ProjectListCard.svelte'
  import ProjectOverviewCard from '$lib/components/project-management/ProjectOverviewCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { PermissionAction, Resource } from '$lib/stores/permissions'
  import { BarChart3Icon, FlaskConicalIcon, PercentIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  /**
   * @typedef {Object} Project
   * @property {string} id
   * @property {string} title
   * @property {string} code
   * @property {string} [description]
   * @property {string} [startDate]
   * @property {string} [endDate]
   * @property {'planning' | 'active' | 'completed'} status
   * @property {'internal' | 'government' | 'private' | 'international'} [sponsorType]
   * @property {'low' | 'medium' | 'high' | 'critical'} [priority]
   * @property {'basic' | 'applied' | 'development'} [researchType]
   * @property {string} [updatedAt]
   */

  /**
   * @typedef {Object} ProjectSummary
   * @property {number} totalProjects
   * @property {number} activeProjects
   * @property {number} totalBudget
   * @property {number} currentYearBudget
   * @property {number} totalMembers
   * @property {number} activeMembers
   * @property {number} overParticipationEmployees
   * @property {Array<{title: string, code: string, status: string, updatedAt: string}>} [recentActivities]
   */

  /**
   * @typedef {Object} EmployeeParticipation
   * @property {string} name
   * @property {string} email
   * @property {string} department
   * @property {number} activeProjects
   * @property {number} totalParticipationRate
   */

  // 탭 정의
  const tabs = [
    {
      id: 'overview',
      label: '개요',
      icon: BarChart3Icon,
    },
    {
      id: 'projects',
      label: '프로젝트',
      icon: FlaskConicalIcon,
    },
    {
      id: 'participation',
      label: '참여율 관리',
      icon: PercentIcon,
    },
  ]

  // URL 파라미터에서 활성 탭 관리
  let activeTab = $state('overview')

  // 페이지 마운트 후 URL 파라미터 처리
  onMount(() => {
    activeTab = page.url.searchParams.get('tab') || 'overview'
    loadInitialTabContent()
    updateData()
  })

  // 상태 변수들
  let mounted = $state(false)
  let projects: any[] = $state([])
  let projectSummary = $state(null)
  let employeeParticipationSummary = $state([])
  let alerts = $state([])

  // 탭별 로딩 상태 및 오류 체크
  const tabLoadingStates = $state({
    overview: false,
    projects: false,
    participation: false,
  })
  const tabErrors = $state({
    overview: null,
    projects: null,
    participation: null,
  })
  const tabLastLoaded = $state({
    overview: null,
    projects: null,
    participation: null,
  })

  // 탭별 데이터 로딩 함수들
  async function loadTabData(tabName) {
    if (tabLoadingStates[tabName]) return

    tabLoadingStates[tabName] = true
    tabErrors[tabName] = null

    try {
      switch (tabName) {
        case 'overview':
          await Promise.all([
            loadProjectSummary(),
            loadEmployeeParticipationSummary(),
            loadBudgetSummaryByYear(),
            loadAlerts(),
          ])
          break
        case 'projects':
          await loadProjectData()
          break
        case 'participation':
          await loadEmployeeParticipationSummary()
          break
      }
      tabLastLoaded[tabName] = new Date()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      tabErrors[tabName] = errorMessage
      logger.error(`${tabName} 탭 데이터 로딩 실패:`, err)
    } finally {
      tabLoadingStates[tabName] = false
    }
  }

  // Svelte 5: 탭 변경 시 데이터 로드 (무한 루프 방지)
  let lastLoadedTab = $state('')
  function updateData() {
    if (mounted && activeTab && activeTab !== lastLoadedTab) {
      lastLoadedTab = activeTab
      loadTabData(activeTab)
    }
  }

  // 프로젝트 관련 상태
  let selectedProject: any = $state(null)
  let selectedProjectId = $state('')
  let showCreateProjectModal = $state(false)
  let showBudgetModal = $state(false)
  let projectBudgets = $state<any[]>([])
  let budgetRefreshKey = $state(0) // ProjectDetailView refresh trigger

  // 탭 변경 핸들러
  function handleTabChange(tabId) {
    activeTab = tabId
    const url = new URL(page.url)
    url.searchParams.set('tab', tabId)
    goto(url.toString(), { replaceState: true })
    loadTabData(tabId)
  }

  // API 호출 함수들
  async function loadProjectData() {
    try {
      const response = await fetch('/api/project-management/projects')

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          const projectData = data.data || []

          // 프로젝트 데이터 검증
          const validationResult = validateProjectData(projectData)
          if (!validationResult.isValid) {
            logger.error('❌ 프로젝트 데이터 검증 실패:', validationResult.issues)
            // 검증 실패 시 빈 배열로 설정하여 무한 루프 방지
            projects = []
            return // throw 대신 return으로 함수 종료
          }

          projects = projectData
        } else {
          throw new Error(data.message || '프로젝트 데이터를 불러오는데 실패했습니다.')
        }
      } else if (response.status === 404) {
        throw new Error('프로젝트 관리 API가 아직 구현되지 않았습니다.')
      } else if (response.status === 500) {
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else if (response.status === 403) {
        throw new Error('프로젝트 데이터에 접근할 권한이 없습니다.')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      // Failed to fetch 오류 특별 처리
      if (err instanceof Error && err.message && err.message.includes('Failed to fetch')) {
        logger.error('❌ 네트워크 연결 실패:', err.message)
      } else {
        logger.error('❌ 프로젝트 데이터 로드 실패:', err)
      }

      projects = []
      throw err // 상위 함수에서 처리할 수 있도록 재throw
    }
  }

  // 개선된 프로젝트 데이터 검증 함수
  function validateProjectData(projectData: any) {
    const issues: string[] = []

    if (!Array.isArray(projectData)) {
      issues.push('프로젝트 데이터가 배열이 아닙니다.')
      return { isValid: false, issues }
    }

    projectData.forEach((project, index) => {
      const projectName = project.title || project.code || `프로젝트 ${index + 1}`

      // 모든 프로젝트에 공통으로 필요한 필수 필드
      if (!project.id) {
        issues.push(`${projectName}: ID가 누락되었습니다.`)
      }
      if (!project.title) {
        issues.push(`${projectName}: 제목이 누락되었습니다.`)
      }
      if (!project.code) {
        issues.push(`${projectName}: 코드가 누락되었습니다.`)
      }

      // 날짜 검증 제거:
      // - 프로젝트의 시작/종료일은 연차별 기간(annual_periods)에서 자동으로 계산됨
      // - DB에 start_date, end_date 컬럼이 없으므로 직접 검증할 필요 없음
      // - 연차별 기간 데이터가 있으면 자동으로 계산되고, 없으면 빈 값으로 표시됨

      // 상태 값 검증
      const validStatuses = ['planning', 'active', 'completed']
      if (project.status && !validStatuses.includes(project.status)) {
        issues.push(`${projectName}: 유효하지 않은 상태값입니다. (${project.status})`)
      }

      // 우선순위 값 검증 (있는 경우에만)
      if (project.priority) {
        const validPriorities = ['low', 'medium', 'high', 'critical']
        if (!validPriorities.includes(project.priority)) {
          issues.push(`${projectName}: 유효하지 않은 우선순위값입니다. (${project.priority})`)
        }
      }
    })

    return {
      isValid: issues.length === 0,
      issues,
    }
  }

  async function loadProjectSummary() {
    try {
      const response = await fetch('/api/project-management/summary')
      if (response.ok) {
        const data = await response.json()
        projectSummary = data.data
      }
    } catch (err) {
      logger.error('프로젝트 요약 로드 실패:', err)
    }
  }

  async function loadEmployeeParticipationSummary() {
    try {
      const response = await fetch('/api/project-management/participation-rates/summary')
      if (response.ok) {
        const data = await response.json()
        employeeParticipationSummary = data.data || []
      }
    } catch {
      // 직원 참여율 데이터 로드 실패 - 조용히 처리
    }
  }

  async function loadBudgetSummaryByYear() {
    try {
      const response = await fetch('/api/project-management/budgets/summary-by-year')
      if (response.ok) {
        // const data = await response.json()
        // budgetSummaryByYear = data.data || []
      }
    } catch {
      // 연도별 예산 데이터 로드 실패 - 조용히 처리
    }
  }

  async function loadAlerts() {
    try {
      const response = await fetch('/api/project-management/alerts')
      if (response.ok) {
        const data = await response.json()
        alerts = data.data || []
      }
    } catch {
      // 알림 데이터 로드 실패 - 조용히 처리
    }
  }

  // 프로젝트 생성 완료 핸들러
  function handleProjectCreated() {
    showCreateProjectModal = false
    loadProjectData()
    loadProjectSummary()
  }

  // 프로젝트 삭제 이벤트 처리
  function handleProjectDeleted(event: any) {
    const { projectId } = event.detail

    // 삭제된 프로젝트가 현재 선택된 프로젝트라면 선택 해제
    if (selectedProject && selectedProject.id === projectId) {
      selectedProject = null
      selectedProjectId = ''
    }

    // 프로젝트 목록에서 삭제된 프로젝트 제거
    projects = projects.filter((p) => p.id !== projectId)

    // 프로젝트 데이터 새로고침
    loadProjectData()
  }

  // 프로젝트 수정 이벤트 처리
  function handleProjectUpdated(event: any) {
    const { projectId, updatedProject } = event.detail

    // 프로젝트 목록에서 해당 프로젝트 업데이트
    const projectIndex = projects.findIndex((p) => p.id === projectId)
    if (projectIndex !== -1) {
      projects[projectIndex] = { ...projects[projectIndex], ...updatedProject }
    }

    // 현재 선택된 프로젝트가 수정된 프로젝트라면 업데이트
    if (selectedProject && selectedProject.id === projectId) {
      selectedProject = { ...selectedProject, ...updatedProject }
    }

    // 프로젝트 데이터 새로고침 (드롭다운 업데이트)
    loadProjectData()
  }

  // 프로젝트 예산 로드
  async function loadProjectBudgets(projectId: string) {
    try {
      const response = await fetch(`/api/project-management/projects/${projectId}/annual-budgets`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          projectBudgets = data.data.budgets || []
          logger.log(`프로젝트 예산 로드 완료: ${projectBudgets.length}개`)
        } else {
          projectBudgets = []
        }
      }
    } catch (error) {
      logger.error('프로젝트 예산 로드 실패:', error)
      projectBudgets = []
    }
  }

  // 프로젝트 선택 시 관련 데이터 모두 초기화
  async function handleProjectSelection(project: any) {
    // 1. 프로젝트 정보 업데이트
    selectedProject = project
    selectedProjectId = project.id

    // 2. 열려있는 모달 닫기
    showBudgetModal = false
    showCreateProjectModal = false

    // 3. 예산 데이터 로드 (annual-budgets API)
    await loadProjectBudgets(project.id)

    // 4. UI 새로고침 트리거
    // budgetRefreshKey를 증가시키면:
    // - ProjectDetailView의 externalRefreshTrigger가 변경됨
    // - ProjectDetailView가 내부 budgetRefreshTrigger를 동기화
    // - ProjectBudgetSummary가 refreshTrigger 변경 감지
    // - ProjectDetailView가 loadProjectBudgets() 호출 (project-budgets API)
    // - ProjectDetailView가 다른 종속 데이터들도 자동 로드 (onMount 또는 $effect)
    budgetRefreshKey++
  }

  // 초기화 - 첫 번째 탭만 로드
  function loadInitialTabContent() {
    if (!mounted && browser) {
      mounted = true
      // 초기 탭 데이터 로드
      loadTabData(activeTab)
    }
  }
</script>

<PermissionGate resource={Resource.PROJECT_PROJECTS} action={PermissionAction.READ}>
  <PageLayout title="프로젝트 관리" subtitle="연구개발 프로젝트 및 참여율 관리 시스템">
    {#if browser}
      <!-- 탭 네비게이션 -->
      <ThemeTabs {tabs} {activeTab} onTabChange={handleTabChange} />

      <!-- 개요 탭 -->
      {#if activeTab === 'overview'}
        <!-- 프로젝트 개요 카드 -->
        <ProjectOverviewCard {projectSummary} {alerts} />
      {/if}

      <!-- 프로젝트 탭 -->
      {#if activeTab === 'projects'}
        <!-- 프로젝트 목록 카드 -->
        <ProjectListCard
          {projects}
          {selectedProject}
          {selectedProjectId}
          {budgetRefreshKey}
          loading={tabLoadingStates.projects}
          error={tabErrors.projects}
          on:create-project={() => (showCreateProjectModal = true)}
          on:project-deleted={handleProjectDeleted}
          on:project-updated={handleProjectUpdated}
          on:refresh={loadProjectData}
          on:project-selected={(e) => handleProjectSelection(e.detail.project)}
          on:show-budget-modal={() => {
            if (selectedProject?.id) {
              loadProjectBudgets(selectedProject.id)
            }
            showBudgetModal = true
          }}
        />
      {/if}

      <!-- 참여율 관리 탭 -->
      {#if activeTab === 'participation'}
        <!-- TODO::참여율 관리 카드 -->
        <ParticipationCard {employeeParticipationSummary} />
      {/if}
    {/if}
  </PageLayout>
</PermissionGate>

<!-- 프로젝트 생성 모달 -->
{#if browser}
  <ThemeModal open={showCreateProjectModal} onclose={() => (showCreateProjectModal = false)}>
    <ProjectCreationForm on:projectCreated={handleProjectCreated} />
  </ThemeModal>
{/if}

<!-- 예산 수정 모달 -->
{#if browser && selectedProject}
  <ThemeModal open={showBudgetModal} onclose={() => (showBudgetModal = false)}>
    <AnnualBudgetForm
      projectId={selectedProject.id}
      existingBudgets={projectBudgets}
      on:budget-updated={async () => {
        showBudgetModal = false

        // 프로젝트 데이터와 예산 데이터 모두 새로고침
        await loadProjectData()

        if (selectedProject?.id) {
          await loadProjectBudgets(selectedProject.id)
        }

        // ProjectDetailView에 refresh 신호 전달
        budgetRefreshKey++
      }}
    />
  </ThemeModal>
{/if}
