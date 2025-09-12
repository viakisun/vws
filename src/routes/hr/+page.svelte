<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import SimpleChart from '$lib/components/ui/SimpleChart.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	
	// HR 스토어들
	import { 
		employees, 
		employmentContracts, 
		jobDescriptions,
		getActiveEmployees,
		getEmployeesByDepartment
	} from '$lib/stores/hr';
	
	import { 
		onboardingProcesses, 
		offboardingProcesses,
		getOnboardingProgress,
		getOffboardingProgress
	} from '$lib/stores/onboarding';
	
	import { 
		attendanceRecords, 
		leaveRequests, 
		leaveBalances,
		calculateMonthlyAttendance
	} from '$lib/stores/attendance';
	
	import { 
		jobPostings, 
		candidates, 
		interviewSchedules,
		getRecruitmentStats
	} from '$lib/stores/recruitment';
	
	import { 
		performanceReviews, 
		feedback360,
		getPerformanceReviewsByEmployee,
		calculateAverageFeedback360
	} from '$lib/stores/performance';
	
	import { 
		payrolls, 
		bonuses, 
		welfareApplications,
		calculateAnnualCompensation
	} from '$lib/stores/benefits';
	
	import { 
		hrPolicies, 
		faqs, 
		guidelines,
		getPopularFAQs
	} from '$lib/stores/policies';

	// 반응형 데이터
	let totalEmployees = $derived(getActiveEmployees($employees).length);
	let totalDepartments = $derived([...new Set($employees.map(emp => emp.department))].length);
	let activeRecruitments = $derived($jobPostings.filter(job => job.status === 'published').length);
	let pendingOnboardings = $derived($onboardingProcesses.filter(process => process.status === 'in-progress').length);

	// 차트 데이터
	let departmentChartData = $derived(() => {
		const deptCounts = $employees.reduce((acc, emp) => {
			acc[emp.department] = (acc[emp.department] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return Object.entries(deptCounts).map(([department, count]) => ({
			label: department,
			value: count,
			color: getDepartmentColor(department)
		}));
	});

	let employmentTypeChartData = $derived(() => {
		const typeCounts = $employees.reduce((acc, emp) => {
			acc[emp.employmentType] = (acc[emp.employmentType] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return Object.entries(typeCounts).map(([type, count]) => ({
			label: type === 'full-time' ? '정규직' : type === 'part-time' ? '계약직' : type === 'contract' ? '계약직' : '인턴',
			value: count,
			color: getEmploymentTypeColor(type)
		}));
	});

	let recruitmentStatusData = $derived(() => {
		const stats = $jobPostings.reduce((acc, job) => {
			const jobStats = getRecruitmentStats(job.id, $candidates);
			acc.total += jobStats.totalApplications;
			acc.hired += jobStats.hiredCount;
			acc.inProgress += jobStats.interviewCount + jobStats.offerCount;
			return acc;
		}, { total: 0, hired: 0, inProgress: 0 });
		
		return [
			{ label: '채용완료', value: stats.hired, color: '#10B981' },
			{ label: '진행중', value: stats.inProgress, color: '#F59E0B' },
			{ label: '지원자', value: stats.total - stats.hired - stats.inProgress, color: '#6B7280' }
		];
	});

	// 최근 활동
	let recentActivities = $derived(() => {
		const activities: Array<{
			type: string;
			title: string;
			description: string;
			time: string;
			icon: string;
			color: string;
		}> = [];

		// 최근 입사자
		$employees
			.filter(emp => emp.status === 'active')
			.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
			.slice(0, 3)
			.forEach(emp => {
				activities.push({
					type: 'hire',
					title: '신규 입사',
					description: `${emp.name}님이 ${emp.department}에 입사했습니다.`,
					time: emp.hireDate,
					icon: '👋',
					color: 'text-green-600'
				});
			});

		// 최근 휴가 신청
		$leaveRequests
			.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
			.slice(0, 3)
			.forEach(request => {
				const employee = $employees.find(emp => emp.id === request.employeeId);
				if (employee) {
					activities.push({
						type: 'leave',
						title: '휴가 신청',
						description: `${employee.name}님이 ${request.days}일 휴가를 신청했습니다.`,
						time: request.requestedAt,
						icon: '🏖️',
						color: 'text-blue-600'
					});
				}
			});

		// 최근 성과 평가
		$performanceReviews
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 3)
			.forEach(review => {
				const employee = $employees.find(emp => emp.id === review.employeeId);
				if (employee) {
					activities.push({
						type: 'review',
						title: '성과 평가',
						description: `${employee.name}님의 ${review.reviewType} 평가가 완료되었습니다.`,
						time: review.completedAt || review.createdAt,
						icon: '📊',
						color: 'text-purple-600'
					});
				}
			});

		return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
	});

	// 인기 FAQ
	let popularFAQs = $derived(getPopularFAQs($faqs, 5));

	// 유틸리티 함수들
	function getDepartmentColor(department: string): string {
		const colors: Record<string, string> = {
			'개발팀': '#3B82F6',
			'마케팅팀': '#10B981',
			'영업팀': '#F59E0B',
			'인사팀': '#EF4444',
			'재무팀': '#8B5CF6',
			'디자인팀': '#EC4899'
		};
		return colors[department] || '#6B7280';
	}

	function getEmploymentTypeColor(type: string): string {
		const colors: Record<string, string> = {
			'full-time': '#3B82F6',
			'part-time': '#10B981',
			'contract': '#F59E0B',
			'intern': '#8B5CF6'
		};
		return colors[type] || '#6B7280';
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		
		if (days === 0) return '오늘';
		if (days === 1) return '어제';
		if (days < 7) return `${days}일 전`;
		if (days < 30) return `${Math.floor(days / 7)}주 전`;
		return `${Math.floor(days / 30)}개월 전`;
	}

	onMount(() => {
		// 초기 데이터 로드 시 필요한 작업들
	});
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- 헤더 -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">인사관리 대시보드</h1>
			<p class="text-gray-600 mt-2">전체 인사 현황 및 주요 지표를 한눈에 확인하세요</p>
		</div>

		<!-- 주요 지표 카드 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<Card>
				<div class="p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-blue-100">
							<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">총 직원 수</p>
							<p class="text-2xl font-bold text-gray-900">{totalEmployees}</p>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-green-100">
							<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">부서 수</p>
							<p class="text-2xl font-bold text-gray-900">{totalDepartments}</p>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-yellow-100">
							<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">진행중인 채용</p>
							<p class="text-2xl font-bold text-gray-900">{activeRecruitments}</p>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<div class="flex items-center">
						<div class="p-3 rounded-full bg-purple-100">
							<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">온보딩 진행중</p>
							<p class="text-2xl font-bold text-gray-900">{pendingOnboardings}</p>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- 차트 섹션 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">부서별 직원 분포</h3>
					<SimpleChart 
						data={departmentChartData()} 
						type="pie" 
						height={300}
					/>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">고용 형태별 분포</h3>
					<SimpleChart 
						data={employmentTypeChartData()} 
						type="pie" 
						height={300}
					/>
				</div>
			</Card>
		</div>

		<!-- 채용 현황 및 최근 활동 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">채용 현황</h3>
					<SimpleChart 
						data={recruitmentStatusData()} 
						type="bar" 
						height={250}
					/>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
					<div class="space-y-4">
						{#each recentActivities().slice(0, 5) as activity}
							<div class="flex items-start space-x-3">
								<div class="flex-shrink-0">
									<span class="text-2xl">{activity.icon}</span>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900">{activity.title}</p>
									<p class="text-sm text-gray-600">{activity.description}</p>
									<p class="text-xs text-gray-500">{formatTimeAgo(activity.time)}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		</div>

		<!-- 인기 FAQ 및 빠른 링크 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">인기 FAQ</h3>
					<div class="space-y-3">
						{#each popularFAQs as faq}
							<div class="border-l-4 border-blue-500 pl-4">
								<p class="text-sm font-medium text-gray-900">{faq.question}</p>
								<p class="text-xs text-gray-500 mt-1">조회수: {faq.viewCount}</p>
							</div>
						{/each}
					</div>
				</div>
			</Card>

			<Card>
				<div class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">빠른 링크</h3>
					<div class="grid grid-cols-2 gap-4">
						<a href="/hr/employees" class="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
							<div class="text-center">
								<div class="text-2xl mb-2">👥</div>
								<p class="text-sm font-medium text-blue-900">직원 관리</p>
							</div>
						</a>
						<a href="/hr/attendance" class="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
							<div class="text-center">
								<div class="text-2xl mb-2">⏰</div>
								<p class="text-sm font-medium text-green-900">근태 관리</p>
							</div>
						</a>
						<a href="/hr/recruitment" class="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
							<div class="text-center">
								<div class="text-2xl mb-2">🎯</div>
								<p class="text-sm font-medium text-yellow-900">채용 관리</p>
							</div>
						</a>
						<a href="/hr/performance" class="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
							<div class="text-center">
								<div class="text-2xl mb-2">📊</div>
								<p class="text-sm font-medium text-purple-900">성과 평가</p>
							</div>
						</a>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>