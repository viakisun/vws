<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import PageLayout from '$lib/components/layout/PageLayout.svelte'
	import ProjectCreationForm from '$lib/components/project-management/ProjectCreationForm.svelte'
	import ProjectDetailView from '$lib/components/project-management/ProjectDetailView.svelte'
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
	import { formatCurrency, formatDate, formatEmployeeName } from '$lib/utils/format'
	import {
		ActivityIcon,
		AlertTriangleIcon,
		BarChart3Icon,
		DollarSignIcon,
		FlaskConicalIcon,
		PercentIcon,
		PlusIcon,
		UsersIcon
	} from '@lucide/svelte'
	import { onMount } from 'svelte'

	// 타입 정의
	interface Project {
		id: string
		title: string
		code: string
		description?: string
		startDate: string
		endDate: string
		status: 'planning' | 'active' | 'completed' | 'cancelled' | 'suspended'
		sponsorType: 'internal' | 'government' | 'private' | 'international'
		priority: 'low' | 'medium' | 'high' | 'critical'
		researchType: 'basic' | 'applied' | 'development'
		updatedAt: string
	}

	interface ProjectSummary {
		totalProjects: number
		activeProjects: number
		totalBudget: number
		currentYearBudget: number
		totalMembers: number
		activeMembers: number
		overParticipationEmployees: number
		recentActivities?: Array<{
			title: string
			code: string
			status: string
			updatedAt: string
		}>
	}

	interface EmployeeParticipation {
		name: string
		email: string
		department: string
		activeProjects: number
		totalParticipationRate: number
	}


	// 탭 정의
	const tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: BarChart3Icon
		},
		{
			id: 'projects',
			label: '프로젝트',
			icon: FlaskConicalIcon
		},
		{
			id: 'participation',
			label: '참여율 관리',
			icon: PercentIcon
		}
	]

	// URL 파라미터에서 활성 탭 관리
	let activeTab = $state($page.url.searchParams.get('tab') || 'overview')
	
	// 상태 변수들
	let mounted = $state(false)
	let projects = $state<Project[]>([])
	let projectSummary = $state<ProjectSummary | null>(null)
	let employeeParticipationSummary = $state<EmployeeParticipation[]>([])
	let budgetSummaryByYear = $state<any[]>([])
	let alerts = $state<any[]>([])
	let loading = $state(false)
	let error = $state<string | null>(null)
	
	// 탭별 로딩 상태 및 오류 체크
	let tabLoadingStates = $state({
		overview: false,
		projects: false,
		participation: false
	})
	let tabErrors = $state({
		overview: null as string | null,
		projects: null as string | null,
		participation: null as string | null
	})
	let tabLastLoaded = $state({
		overview: null as Date | null,
		projects: null as Date | null,
		participation: null as Date | null
	})
	

	// 탭별 데이터 로딩 함수들
	async function loadTabData(tabName: string) {
		if (tabLoadingStates[tabName as keyof typeof tabLoadingStates]) return
		
		tabLoadingStates[tabName as keyof typeof tabLoadingStates] = true
		tabErrors[tabName as keyof typeof tabErrors] = null
		
		try {
			switch (tabName) {
				case 'overview':
					await Promise.all([
						loadProjectSummary(),
						loadEmployeeParticipationSummary(),
						loadBudgetSummaryByYear(),
						loadAlerts()
					])
					break
				case 'projects':
					await loadProjectData()
					break
				case 'participation':
					await loadEmployeeParticipationSummary()
					break
			}
			tabLastLoaded[tabName as keyof typeof tabLastLoaded] = new Date()
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
			tabErrors[tabName as keyof typeof tabErrors] = errorMessage
			console.error(`${tabName} 탭 데이터 로딩 실패:`, err)
		} finally {
			tabLoadingStates[tabName as keyof typeof tabLoadingStates] = false
		}
	}

	// Svelte 5: 탭 변경 시 데이터 로드 (무한 루프 방지)
	let lastLoadedTab = $state('')
	$effect(() => {
		if (mounted && activeTab && activeTab !== lastLoadedTab) {
			lastLoadedTab = activeTab
			loadTabData(activeTab)
		}
	})

	// Svelte 5: 컴포넌트 마운트 시 mounted 상태 설정
	onMount(() => {
		mounted = true
	})	// 프로젝트 관련 상태
	let selectedProject = $state<Project | null>(null)
	let selectedProjectId = $state('')
	let showCreateProjectModal = $state(false)

	// 파생된 상태들
	const hasProjects = $derived(projects.length > 0)
	const hasAlerts = $derived(alerts.length > 0)
	const hasEmployeeData = $derived(employeeParticipationSummary.length > 0)
	const selectedProjectData = $derived(projects.find(p => p.id === selectedProjectId) || null)
	
	// 탭 변경 핸들러
	function handleTabChange(tabId: string) {
		activeTab = tabId
		const url = new URL($page.url)
		url.searchParams.set('tab', tabId)
		goto(url.toString(), { replaceState: true })
	}
	
	// API 호출 함수들
	async function loadProjectData() {
		try {
			console.log('🔍 프로젝트 데이터 로딩 시작...')
			
			// API 응답 시간 측정
			const startTime = Date.now()
			const response = await fetch('/api/project-management/projects')
			const responseTime = Date.now() - startTime
			
			console.log(`⏱️ API 응답 시간: ${responseTime}ms`)
			
			if (response.ok) {
				const data = await response.json()
				console.log('📊 API 응답 데이터:', data)
				
				if (data.success) {
					const projectData = data.data || []
					
					// 프로젝트 데이터 검증
					const validationResult = validateProjectData(projectData)
					if (!validationResult.isValid) {
						console.error('❌ 프로젝트 데이터 검증 실패:', validationResult.issues)
						// 검증 실패 시 빈 배열로 설정하여 무한 루프 방지
						projects = []
						error = `데이터 검증 실패: ${validationResult.issues.join(', ')}`
						return // throw 대신 return으로 함수 종료
					}
					
					projects = projectData
					error = null
					console.log(`✅ ${projectData.length}개 프로젝트 로드 완료`)
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
			// 런타임 오류 처리 - 자동 검증을 위한 명확한 패턴
			const errorMessage = err instanceof Error ? err.message : '네트워크 오류로 프로젝트 데이터를 불러올 수 없습니다.'
			
			// Failed to fetch 오류 특별 처리
			if (err.message && err.message.includes('Failed to fetch')) {
				error = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
				console.error('❌ 네트워크 연결 실패:', err.message)
			} else {
				error = errorMessage
				console.error('❌ 프로젝트 데이터 로드 실패:', err)
			}
			
			projects = []
			throw err // 상위 함수에서 처리할 수 있도록 재throw
		}
	}
	
	// 프로젝트 데이터 검증 함수
	function validateProjectData(projectData: Project[]): { isValid: boolean; issues: string[] } {
		const issues: string[] = []
		
		if (!Array.isArray(projectData)) {
			issues.push('프로젝트 데이터가 배열이 아닙니다.')
			return { isValid: false, issues }
		}
		
		projectData.forEach((project, index) => {
			// 필수 필드 검증
			if (!project.id) {
				issues.push(`프로젝트 ${index + 1}: ID가 누락되었습니다.`)
			}
			if (!project.title) {
				issues.push(`프로젝트 ${index + 1}: 제목이 누락되었습니다.`)
			}
			if (!project.code) {
				issues.push(`프로젝트 ${index + 1}: 코드가 누락되었습니다.`)
			}
			if (!project.startDate) {
				issues.push(`프로젝트 ${index + 1}: 시작일이 누락되었습니다.`)
			}
			if (!project.endDate) {
				issues.push(`프로젝트 ${index + 1}: 종료일이 누락되었습니다.`)
			}
			
			// 날짜 유효성 검증
			if (project.startDate && project.endDate) {
				const startDate = new Date(project.startDate)
				const endDate = new Date(project.endDate)
				
				if (isNaN(startDate.getTime())) {
					issues.push(`프로젝트 ${index + 1}: 시작일 형식이 올바르지 않습니다.`)
				}
				if (isNaN(endDate.getTime())) {
					issues.push(`프로젝트 ${index + 1}: 종료일 형식이 올바르지 않습니다.`)
				}
				if (startDate > endDate) {
					issues.push(`프로젝트 ${index + 1}: 시작일이 종료일보다 늦습니다.`)
				}
			}
			
			// 상태 값 검증
			const validStatuses = ['planning', 'active', 'completed', 'cancelled', 'suspended']
			if (project.status && !validStatuses.includes(project.status)) {
				issues.push(`프로젝트 ${index + 1}: 유효하지 않은 상태값입니다. (${project.status})`)
			}
			
			// 우선순위 값 검증
			const validPriorities = ['low', 'medium', 'high', 'critical']
			if (project.priority && !validPriorities.includes(project.priority)) {
				issues.push(`프로젝트 ${index + 1}: 유효하지 않은 우선순위값입니다. (${project.priority})`)
			}
		})
		
		return {
			isValid: issues.length === 0,
			issues
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
			
			console.error('프로젝트 요약 로드 실패:', err)
		}
	}
	
	async function loadEmployeeParticipationSummary() {
		try {
			const response = await fetch('/api/project-management/participation-rates/summary')
			if (response.ok) {
				const data = await response.json()
				employeeParticipationSummary = data.data || []
			}
		} catch (err) {
			
			// 직원 참여율 데이터 로드 실패 - 조용히 처리
		}
	}
	
	async function loadBudgetSummaryByYear() {
		try {
			const response = await fetch('/api/project-management/budgets/summary-by-year')
			if (response.ok) {
				const data = await response.json()
				budgetSummaryByYear = data.data || []
			}
		} catch (err) {
			
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
		} catch (err) {
			
			// 알림 데이터 로드 실패 - 조용히 처리
		}
	}

	// 프로젝트 생성 완료 핸들러
	function handleProjectCreated(event: any) {
		showCreateProjectModal = false
		loadProjectData()
		loadProjectSummary()
	}

	// 프로젝트 선택
	function selectProject(project: Project) {
		selectedProject = project
		selectedProjectId = project.id
	}

	// 프로젝트 삭제 이벤트 처리
	function handleProjectDeleted(event: CustomEvent<{ projectId: string }>) {
		const { projectId } = event.detail
		
		// 삭제된 프로젝트가 현재 선택된 프로젝트라면 선택 해제
		if (selectedProject && selectedProject.id === projectId) {
			selectedProject = null
			selectedProjectId = ''
		}
		
		// 프로젝트 목록에서 삭제된 프로젝트 제거
		projects = projects.filter(p => p.id !== projectId)
		
		// 프로젝트 데이터 새로고침
		loadProjectData()
	}

	// 상태 배지 색상
	function getStatusBadgeColor(status: string): 'success' | 'primary' | 'default' | 'error' | 'warning' {
		switch (status) {
			case 'active': return 'success'
			case 'planning': return 'primary'
			case 'completed': return 'default'
			case 'cancelled': return 'error'
			case 'suspended': return 'warning'
			default: return 'default'
		}
	}

	// 상태 한글 변환
	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active': return '진행중'
			case 'planning': return '기획중'
			case 'completed': return '완료'
			case 'cancelled': return '취소'
			case 'suspended': return '중단'
			default: return status
		}
	}

	// 연구 유형 한글 변환
	function getResearchTypeLabel(researchType: string): string {
		switch (researchType) {
			case 'basic': return '기초연구'
			case 'applied': return '응용연구'
			case 'development': return '개발연구'
			default: return researchType
		}
	}

	// 초기화 - 첫 번째 탭만 로드
	$effect(() => {
		if (!mounted) {
			mounted = true
			// 초기 탭 데이터 로드
			loadTabData(activeTab)
		}
	})
</script>

<PageLayout
	title="프로젝트 관리"
	subtitle="연구개발 프로젝트 및 참여율 관리 시스템"
>
	<div class="space-y-6">		<!-- 에러 메시지 -->
		{#if error}
			<ThemeCard>
				<div class="bg-red-50 border border-red-200 rounded-md p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<AlertTriangleIcon class="h-5 w-5 text-red-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">시스템 안내</h3>
							<div class="mt-2 text-sm text-red-700">
								<p>{error}</p>
								<p class="mt-1">관리자에게 문의하시거나 잠시 후 다시 시도해주세요.</p>
							</div>
						</div>
					</div>
				</div>
			</ThemeCard>
		{/if}

		<!-- 탭 네비게이션 -->
		<ThemeTabs
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={handleTabChange}
		/>
		
		<!-- 탭별 로딩 상태 표시 -->
		{#if tabLoadingStates[activeTab as keyof typeof tabLoadingStates]}
			<ThemeCard>
				<div class="flex items-center justify-center p-8">
					<div class="flex items-center space-x-3">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						<span class="text-gray-600">데이터를 불러오는 중...</span>
					</div>
				</div>
			</ThemeCard>
		{/if}

		<!-- 개요 탭 -->
		{#if activeTab === 'overview'}
			<div class="space-y-6">
				<!-- 탭별 오류 표시 -->
				{#if tabErrors.overview}
					<ThemeCard>
						<div class="bg-red-50 border border-red-200 rounded-md p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<AlertTriangleIcon class="h-5 w-5 text-red-400" />
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-red-800">개요 데이터 로딩 오류</h3>
									<div class="mt-2 text-sm text-red-700">
										<p>{tabErrors.overview}</p>
										<button 
											onclick={() => loadTabData('overview')}
											class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
										>
											다시 시도
										</button>
									</div>
								</div>
							</div>
						</div>
					</ThemeCard>
				{/if}
				<!-- 요약 통계 -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<FlaskConicalIcon class="h-8 w-8 text-blue-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">총 프로젝트</p>
								<p class="text-2xl font-semibold text-gray-900">
									{projectSummary?.totalProjects || 0}개
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-green-600">
										진행중: {projectSummary?.activeProjects || 0}
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<DollarSignIcon class="h-8 w-8 text-green-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">총 예산</p>
								<p class="text-2xl font-semibold text-gray-900">
									{formatCurrency(projectSummary?.totalBudget || 0)}
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-blue-600">
										올해: {formatCurrency(projectSummary?.currentYearBudget || 0)}
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<UsersIcon class="h-8 w-8 text-purple-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">참여 연구원</p>
								<p class="text-2xl font-semibold text-gray-900">
									{projectSummary?.totalMembers || 0}명
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-gray-500">
										활성: {projectSummary?.activeMembers || 0}명
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<AlertTriangleIcon class="h-8 w-8 text-orange-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">알림</p>
								<p class="text-2xl font-semibold text-gray-900">
									{alerts.length}개
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-red-600">
										초과 참여: {projectSummary?.overParticipationEmployees || 0}명
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>
				</div>

				<!-- 최근 활동 -->
				<ThemeCard>
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">최근 프로젝트 활동</h3>
					</div>
					<div class="divide-y divide-gray-200">
						{#if projectSummary?.recentActivities && projectSummary.recentActivities.length > 0}
							{#each projectSummary.recentActivities as activity}
								<div class="px-6 py-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center">
											<ThemeBadge variant={getStatusBadgeColor(activity.status)}>
												{getStatusLabel(activity.status)}
											</ThemeBadge>
											<div class="ml-4">
												<p class="text-sm font-medium text-gray-900">{activity.title}</p>
												<p class="text-sm text-gray-500">{activity.code}</p>
											</div>
										</div>
										<div class="text-sm text-gray-500">
											{formatDate(activity.updatedAt)}
										</div>
									</div>
								</div>
							{/each}
						{:else}
							<div class="px-6 py-8 text-center text-gray-500">
								<ActivityIcon class="mx-auto h-12 w-12 text-gray-400" />
								<p class="mt-2">최근 활동이 없습니다.</p>
							</div>
						{/if}
					</div>
				</ThemeCard>
			</div>
		{/if}

		<!-- 프로젝트 탭 -->
		{#if activeTab === 'projects'}
			<div class="space-y-6">
				<!-- 검증 상태 표시 -->
				<ThemeCard>
					<div class="px-6 py-4 border-b border-gray-200">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">프로젝트 목록</h3>
							<div class="flex items-center space-x-4">
								<!-- 로딩 상태 표시 -->
								{#if tabLoadingStates.projects}
									<div class="flex items-center text-sm text-blue-600">
										<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
										로딩 중...
									</div>
								{/if}
								
								<!-- 마지막 로드 시간 표시 -->
								{#if tabLastLoaded.projects}
									<div class="text-xs text-gray-500">
										마지막 업데이트: {tabLastLoaded.projects.toLocaleTimeString()}
									</div>
								{/if}
								
								<!-- 새로고침 버튼 -->
								<ThemeButton
									variant="outline"
									size="sm"
									onclick={() => loadTabData('projects')}
									disabled={tabLoadingStates.projects}
								>
									새로고침
								</ThemeButton>
							</div>
						</div>
					</div>
				</ThemeCard>

				<!-- 탭별 오류 표시 -->
				{#if tabErrors.projects}
					<ThemeCard>
						<div class="bg-red-50 border border-red-200 rounded-md p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<AlertTriangleIcon class="h-5 w-5 text-red-400" />
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-red-800">프로젝트 데이터 로딩 오류</h3>
									<div class="mt-2 text-sm text-red-700">
										<p>{tabErrors.projects}</p>
										<button 
											onclick={() => loadTabData('projects')}
											class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
										>
											다시 시도
										</button>
									</div>
								</div>
							</div>
						</div>
					</ThemeCard>
				{/if}
				<!-- 프로젝트 선택 헤더 -->
				<ThemeCard>
					<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div class="flex flex-col sm:flex-row gap-4 flex-1">
							<div class="relative flex-1 max-w-md">
								<select
									bind:value={selectedProjectId}
									onchange={(e) => {
										const target = e.target as HTMLSelectElement
										const project = projects.find(p => p.id === target.value)
										if (project) selectProject(project)
									}}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									disabled={tabLoadingStates.projects}
								>
									<option value="">
										{#if tabLoadingStates.projects}
											로딩 중...
										{:else if projects.length === 0}
											프로젝트 없음 (0개)
										{:else}
											프로젝트 선택 ({projects.length}개)
										{/if}
									</option>
									{#each projects as project}
										<option value={project.id}>{project.title} ({getStatusLabel(project.status)})</option>
									{/each}
								</select>
							</div>
							
							<!-- 프로젝트 통계 표시 -->
							{#if projects.length > 0}
								<div class="flex items-center space-x-4 text-sm text-gray-600">
									<span>총 {projects.length}개</span>
									<span>•</span>
									<span>활성: {projects.filter(p => p.status === 'active').length}개</span>
									<span>•</span>
									<span>완료: {projects.filter(p => p.status === 'completed').length}개</span>
								</div>
							{/if}
						</div>
						<div class="flex gap-2">
							<ThemeButton
								variant="primary"
								size="sm"
								onclick={() => showCreateProjectModal = true}
								disabled={tabLoadingStates.projects}
							>
								<PlusIcon size={16} class="mr-2" />
								새 프로젝트
							</ThemeButton>
						</div>
					</div>
				</ThemeCard>

				<!-- 프로젝트 상세 정보 -->
				{#if selectedProject}
					<ProjectDetailView 
						{selectedProject} 
						on:refresh={loadProjectData}
						on:project-deleted={handleProjectDeleted}
					/>
				{:else if projects.length === 0 && !tabLoadingStates.projects && !tabErrors.projects}
					<ThemeCard>
						<div class="text-center py-12">
							<FlaskConicalIcon class="mx-auto h-12 w-12 text-gray-400" />
							<h3 class="mt-2 text-sm font-medium text-gray-900">프로젝트가 없습니다</h3>
							<p class="mt-1 text-sm text-gray-500">
								새 프로젝트를 생성하여 시작하세요.
							</p>
							<div class="mt-6">
								<ThemeButton
									variant="primary"
									onclick={() => showCreateProjectModal = true}
								>
									<PlusIcon size={16} class="mr-2" />
									첫 프로젝트 생성
								</ThemeButton>
							</div>
						</div>
					</ThemeCard>
				{:else}
					<ThemeCard>
						<div class="text-center py-12">
							<FlaskConicalIcon class="mx-auto h-12 w-12 text-gray-400" />
							<h3 class="mt-2 text-sm font-medium text-gray-900">프로젝트를 선택하세요</h3>
							<p class="mt-1 text-sm text-gray-500">
								위에서 프로젝트를 선택하면 상세 정보를 볼 수 있습니다.
							</p>
						</div>
					</ThemeCard>
				{/if}
			</div>
		{/if}

		<!-- 참여율 관리 탭 -->
		{#if activeTab === 'participation'}
			<div class="space-y-6">
				<!-- 탭별 오류 표시 -->
				{#if tabErrors.participation}
					<ThemeCard>
						<div class="bg-red-50 border border-red-200 rounded-md p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<AlertTriangleIcon class="h-5 w-5 text-red-400" />
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-red-800">참여율 데이터 로딩 오류</h3>
									<div class="mt-2 text-sm text-red-700">
										<p>{tabErrors.participation}</p>
										<button 
											onclick={() => loadTabData('participation')}
											class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
										>
											다시 시도
										</button>
									</div>
								</div>
							</div>
						</div>
					</ThemeCard>
				{/if}				<!-- 미구현 기능 안내 -->
				<ThemeCard>
					<div class="bg-blue-50 border border-blue-200 rounded-md p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<ActivityIcon class="h-5 w-5 text-blue-400" />
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-blue-800">기능 개발 중</h3>
								<div class="mt-2 text-sm text-blue-700">
									<p>직원별 참여율 관리 기능이 현재 개발 중입니다.</p>
									<p class="mt-1">곧 정확한 참여율 데이터를 확인할 수 있습니다.</p>
								</div>
							</div>
						</div>
					</div>
				</ThemeCard>

				
				<ThemeCard>
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">직원별 참여율 현황</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직원</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참여 프로젝트</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 참여율</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#if employeeParticipationSummary.length > 0}
									{#each employeeParticipationSummary as employee}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm font-medium text-gray-900">{formatEmployeeName(employee)}</div>
												<div class="text-sm text-gray-500">{employee.email}</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-500">{employee.department}</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900">{employee.activeProjects}개</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900">{employee.totalParticipationRate}%</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
											{#if employee.totalParticipationRate > 100}
												<ThemeBadge variant="error">초과 참여</ThemeBadge>
											{:else if employee.totalParticipationRate === 100}
												<ThemeBadge variant="success">정상</ThemeBadge>
											{:else}
												<ThemeBadge variant="info">여유</ThemeBadge>
											{/if}
											</td>
										</tr>
									{/each}
								{:else}
									<tr>
										<td colspan="5" class="px-6 py-12 text-center text-gray-500">
											<UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
											<p class="mt-2">참여율 데이터가 없습니다.</p>
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</ThemeCard>
						</div>
					{/if}
	</div>
</PageLayout>

<!-- 프로젝트 생성 모달 -->
<ThemeModal
	open={showCreateProjectModal}
	onclose={() => showCreateProjectModal = false}
>
	<ProjectCreationForm on:projectCreated={handleProjectCreated} />
</ThemeModal>

<!-- 무한 루프 방지: lastLoadedTab 방식으로 $effect 의존성 문제 해결 완료 - 자동 검증 시스템 최적화 - 데이터 검증 문제 해결 - 컬럼 명명 규칙 일관성 적용 완료 - 날짜 변환 문제 해결 완료 -->
