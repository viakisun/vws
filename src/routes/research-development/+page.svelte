<script lang="ts">
  import { browser } from '$app/environment'
  import PermissionGate from '$lib/components/auth/PermissionGate.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import RDProjectCreationForm from '$lib/components/research-development/RDProjectCreationForm.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import { PermissionAction, Resource } from '$lib/stores/permissions'
  import { formatCurrency } from '$lib/utils/format'
  import { logger } from '$lib/utils/logger'
  import { DollarSignIcon, FlaskConicalIcon, PercentIcon, UsersIcon } from '@lucide/svelte'
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

  // 상태 변수들
  let projects: any[] = $state([])
  let projectSummary: any = $state(null)
  let loading = $state(true)
  let showCreateProjectModal = $state(false)

  // 페이지 마운트 시 데이터 로드
  onMount(async () => {
    if (browser) {
      loading = true
      try {
        await Promise.all([loadProjectData(), loadProjectSummary()])
      } catch (err) {
        logger.error('데이터 로드 실패:', err)
      } finally {
        loading = false
      }
    }
  })

  // API 호출 함수들
  async function loadProjectData() {
    try {
      const response = await fetch('/api/research-development/projects')

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
      const response = await fetch('/api/research-development/summary')
      if (response.ok) {
        const data = await response.json()
        projectSummary = data.data
      }
    } catch (err) {
      logger.error('프로젝트 요약 로드 실패:', err)
    }
  }

  // 프로젝트 생성 완료 핸들러
  async function handleProjectCreated() {
    showCreateProjectModal = false
    await Promise.all([loadProjectData(), loadProjectSummary()])
  }

  // 상태별 레이블 변환
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return '진행중'
      case 'planning':
        return '기획'
      case 'completed':
        return '완료'
      default:
        return status
    }
  }

  // 상태별 그라데이션 스타일
  function getStatusGradient(status: string): string {
    switch (status) {
      case 'active':
        return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      case 'planning':
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      default:
        return ''
    }
  }

  // 상태별 강조 여부
  function isHighlightedStatus(status: string): boolean {
    return status === 'active' || status === 'planning'
  }

  // PageLayout stats 구성
  const stats = $derived([
    {
      title: '전체 프로젝트',
      value: projectSummary?.totalProjects || 0,
      icon: FlaskConicalIcon,
      color: 'blue' as const,
    },
    {
      title: '진행중',
      value: projectSummary?.activeProjects || 0,
      icon: FlaskConicalIcon,
      color: 'green' as const,
    },
    {
      title: '총 예산',
      value: formatCurrency(projectSummary?.totalBudget || 0),
      icon: DollarSignIcon,
      color: 'purple' as const,
    },
    {
      title: '참여 연구원',
      value: projectSummary?.totalMembers || 0,
      icon: UsersIcon,
      color: 'orange' as const,
    },
  ])

  // PageLayout actions 구성
  const actions = [
    {
      label: '참여율 관리',
      variant: 'secondary' as const,
      icon: PercentIcon,
      href: '/research-development/participation',
    },
    {
      label: '새 프로젝트',
      variant: 'primary' as const,
      icon: FlaskConicalIcon,
      onclick: () => (showCreateProjectModal = true),
    },
  ]
</script>

<PermissionGate resource={Resource.PROJECT_PROJECTS} action={PermissionAction.READ}>
  <PageLayout
    title="연구개발사업 관리"
    subtitle="연구개발 프로젝트 및 참여율 관리 시스템"
    {stats}
    {actions}
  >
    {#if browser}
      {#if loading}
        <div class="text-center py-12">
          <div style:color="var(--color-text-secondary)">로딩 중...</div>
        </div>
      {:else if projects.length === 0}
        <div class="text-center py-12">
          <p style:color="var(--color-text-secondary)">프로젝트가 없습니다.</p>
        </div>
      {:else}
        <!-- 프로젝트 카드 그리드 -->
        <ThemeGrid cols={1} mdCols={2} lgCols={3} gap={6}>
          {#each projects as project}
            {@const isHighlighted = isHighlightedStatus(project.status)}
            {@const bgStyle = getStatusGradient(project.status)}
            {@const textColor = isHighlighted ? '#ffffff' : 'var(--color-text-primary)'}
            {@const secondaryTextColor = isHighlighted
              ? 'rgba(255, 255, 255, 0.9)'
              : 'var(--color-text-secondary)'}
            {@const tertiaryTextColor = isHighlighted
              ? 'rgba(255, 255, 255, 0.7)'
              : 'var(--color-text-tertiary)'}
            {@const borderColor = isHighlighted
              ? 'rgba(255, 255, 255, 0.3)'
              : 'var(--color-border-light)'}
            {@const badgeColor = isHighlighted ? '#ffffff' : 'var(--color-primary-dark)'}
            {@const badgeBg = isHighlighted
              ? 'rgba(255, 255, 255, 0.2)'
              : 'var(--color-primary-light)'}
            {@const badgeBorder = isHighlighted
              ? 'rgba(255, 255, 255, 0.5)'
              : 'var(--color-primary)'}
            {@const statColor = isHighlighted ? '#ffffff' : 'var(--color-primary)'}

            <a href="/research-development/projects/{project.id}" class="block">
              <ThemeCard variant="default" hover clickable style="background: {bgStyle}">
                <!-- 프로젝트 이름 + 상태 뱃지 -->
                <div class="mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="text-xl font-bold" style:color={textColor}>
                      {project.title}
                    </h3>
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap"
                      style:background={badgeBg}
                      style:color={badgeColor}
                      style:border-color={badgeBorder}
                      style:opacity="0.9"
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <p class="text-xs font-mono" style:color={tertiaryTextColor}>
                    {project.code}
                  </p>
                </div>

                <!-- 설명 (2줄 말줄임) -->
                <div class="mb-6 h-10">
                  {#if project.description}
                    <p
                      class="text-sm line-clamp-2 leading-relaxed"
                      style:color={secondaryTextColor}
                    >
                      {project.description}
                    </p>
                  {/if}
                </div>

                <!-- 통계 -->
                <div
                  class="flex items-center gap-6 text-sm pt-4"
                  style:border-top="1px solid {borderColor}"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold" style:color={statColor}>
                      {formatCurrency(project.budget_total || 0)}
                    </span>
                    <span style:color={secondaryTextColor}>예산</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold" style:color={statColor}>
                      {project.member_count || 0}
                    </span>
                    <span style:color={secondaryTextColor}>팀원</span>
                  </div>
                </div>
              </ThemeCard>
            </a>
          {/each}
        </ThemeGrid>
      {/if}
    {/if}
  </PageLayout>
</PermissionGate>

<!-- 프로젝트 생성 모달 -->
{#if browser}
  <ThemeModal open={showCreateProjectModal} onclose={() => (showCreateProjectModal = false)}>
    <RDProjectCreationForm on:projectCreated={handleProjectCreated} />
  </ThemeModal>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
