<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
	import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte';
	import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import EmployeeModal from '$lib/components/ui/EmployeeModal.svelte';
	import DeleteConfirmModal from '$lib/components/ui/DeleteConfirmModal.svelte';
	import DepartmentModal from '$lib/components/ui/DepartmentModal.svelte';
	import PositionModal from '$lib/components/ui/PositionModal.svelte';
	import OrganizationChart from '$lib/components/ui/OrganizationChart.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		UsersIcon, 
		BuildingIcon, 
		UserPlusIcon, 
		ClipboardListIcon,
		TrendingUpIcon,
		CalendarIcon,
		FileTextIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		UserCheckIcon,
		GraduationCapIcon,
		TargetIcon,
		BarChart3Icon,
		FileSpreadsheetIcon,
		DownloadIcon,
		AlertCircleIcon,
		CheckCircleIcon,
		MailIcon,
		PhoneIcon,
		DollarSignIcon,
		CrownIcon,
		BriefcaseIcon
	} from 'lucide-svelte';
	
	// HR 스토어들
	import { 
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

	// 데이터베이스 직원 데이터
	let employees = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// 직원 데이터 가져오기 (활성 직원만)
	async function fetchEmployees() {
		try {
			loading = true;
			error = null;
			const response = await fetch('/api/employees?status=active');
			if (response.ok) {
				const result = await response.json();
				employees = result.data || result.employees || [];
			} else {
				error = '직원 데이터를 불러오는데 실패했습니다.';
			}
		} catch (err) {
			error = '직원 데이터를 불러오는데 실패했습니다.';
			console.error('Error fetching employees:', err);
		} finally {
			loading = false;
		}
	}

	// 부서 데이터 가져오기
	async function fetchDepartments() {
		try {
			const response = await fetch('/api/departments');
			if (response.ok) {
				const result = await response.json();
				departments = result.data || result.departments || [];
			}
		} catch (err) {
			console.error('Error fetching departments:', err);
		}
	}

	// 직급 데이터 가져오기
	async function fetchPositions() {
		try {
			const response = await fetch('/api/positions');
			if (response.ok) {
				const result = await response.json();
				positions = result.data || result.positions || [];
			}
		} catch (err) {
			console.error('Error fetching positions:', err);
		}
	}

	// 이사 데이터 가져오기
	async function fetchExecutives() {
		try {
			executiveLoading = true;
			const response = await fetch('/api/executives');
			if (response.ok) {
				const result = await response.json();
				executives = result.data || result.executives || [];
			}
		} catch (err) {
			console.error('Error fetching executives:', err);
		} finally {
			executiveLoading = false;
		}
	}

	// 직책 데이터 가져오기
	async function fetchJobTitles() {
		try {
			jobTitleLoading = true;
			const response = await fetch('/api/job-titles');
			if (response.ok) {
				const result = await response.json();
				jobTitles = result.data || result.jobTitles || [];
			}
		} catch (err) {
			console.error('Error fetching job titles:', err);
		} finally {
			jobTitleLoading = false;
		}
	}


	// 직급을 카테고리별로 분류
	function getPositionsByCategory() {
		const categories = {
			'연구원': positions.filter(p => p.department === '연구개발'),
			'디자이너': positions.filter(p => p.department === '디자인'),
			'행정원': positions.filter(p => p.department === '행정')
		};
		return categories;
	}

	// 직책을 레벨별로 분류
	function getJobTitlesByLevel() {
		const levels = {
			'C-Level': jobTitles.filter(jt => jt.level === 1),
			'Management': jobTitles.filter(jt => jt.level === 2),
			'Specialist': jobTitles.filter(jt => jt.level === 3)
		};
		return levels;
	}

	// 반응형 데이터 (데이터베이스 기반)
	let totalEmployees = $derived(() => {
		const activeEmployeeCount = employees?.filter((emp: any) => emp.status === 'active').length || 0;
		const executiveCount = executives?.length || 0;
		return activeEmployeeCount + executiveCount;
	});
	let totalDepartments = $derived(() => [...new Set(employees?.map((emp: any) => emp.department) || [])].length);
	let activeRecruitments = $derived(() => $jobPostings.filter(job => job.status === 'published').length);
	let pendingOnboardings = $derived(() => $onboardingProcesses.filter(process => process.status === 'in-progress').length);

	// 탭 정의
	const tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: BarChart3Icon
		},
		{
			id: 'employees',
			label: '직원관리',
			icon: UsersIcon
		},
		{
			id: 'recruitment',
			label: '채용관리',
			icon: UserPlusIcon
		},
		{
			id: 'onboarding',
			label: '온보딩',
			icon: GraduationCapIcon
		},
		{
			id: 'performance',
			label: '성과관리',
			icon: TargetIcon
		},
		{
			id: 'departments',
			label: '부서관리',
			icon: BuildingIcon
		},
		{
			id: 'positions',
			label: '직급관리',
			icon: UserCheckIcon
		},
		{
			id: 'executives',
			label: '이사관리',
			icon: CrownIcon
		},
		{
			id: 'job-titles',
			label: '직책관리',
			icon: BriefcaseIcon
		},
		{
			id: 'org-chart',
			label: '조직도',
			icon: BuildingIcon
		}
	];

	let activeTab = $state('overview');
	
	
	// 업로드 관련 상태
	let showUploadModal = $state(false);
	let uploadFile = $state<File | null>(null);
	let uploadStatus = $state<'idle' | 'uploading' | 'success' | 'error'>('idle');
	let uploadMessage = $state('');
	let uploadProgress = $state(0);
	let isDragOver = $state(false);
	
	// 직원 관리 관련 상태
	let showEmployeeModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedEmployee = $state<any>(null);
	let employeeLoading = $state(false);
	let deleteLoading = $state(false);

	// 조직 관리 관련 상태
	let departments = $state<any[]>([]);
	let positions = $state<any[]>([]);
	let showDepartmentModal = $state(false);
	let showPositionModal = $state(false);
	let selectedDepartment = $state<any>(null);
	let selectedPosition = $state<any>(null);
	let departmentLoading = $state(false);
	let positionLoading = $state(false);

	// 이사 관리 관련 상태
	let executives = $state<any[]>([]);
	let jobTitles = $state<any[]>([]);
	let showExecutiveModal = $state(false);
	let showJobTitleModal = $state(false);
	let selectedExecutive = $state<any>(null);
	let selectedJobTitle = $state<any>(null);
	let executiveLoading = $state(false);
	let jobTitleLoading = $state(false);

	// 직원 검색 및 필터링 상태
	let searchQuery = $state('');
	let departmentFilter = $state('');
	let statusFilter = $state('');
	let currentPage = $state(1);
	let itemsPerPage = 20;

	// 필터링된 직원 목록
	let filteredEmployees = $derived((() => {
		let filtered = employees || [];
		
		// 검색 필터
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(emp => 
				`${emp.last_name}${emp.first_name}`.toLowerCase().includes(query) ||
				emp.email.toLowerCase().includes(query) ||
				emp.employee_id.toLowerCase().includes(query) ||
				emp.department.toLowerCase().includes(query) ||
				emp.position.toLowerCase().includes(query)
			);
		}
		
		// 부서 필터
		if (departmentFilter) {
			filtered = filtered.filter(emp => emp.department === departmentFilter);
		}
		
		// 상태 필터
		if (statusFilter) {
			filtered = filtered.filter(emp => emp.status === statusFilter);
		}
		
		return filtered;
	})());

	// 팀별로 그룹화된 직원 목록
	let groupedEmployees = $derived((() => {
		const groups: { [key: string]: any[] } = {};
		
		filteredEmployees.forEach((employee: any) => {
			const team = employee.department || '기타';
			if (!groups[team]) {
				groups[team] = [];
			}
			groups[team].push(employee);
		});
		
		return groups;
	})());

	// 페이지네이션 계산 (직원 수 기준)
	let totalPages = $derived(Math.ceil(filteredEmployees.length / itemsPerPage));
	let paginatedEmployees = $derived((() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return filteredEmployees.slice(start, end);
	})());

	// 팀 리더인지 확인하는 함수
	function isTeamLead(employee: any): boolean {
		return employee.job_title_name === 'Team Lead' || employee.position === 'Team Lead';
	}

	// 직원을 정렬하는 함수 (팀 리더 우선)
	function sortEmployees(employees: any[]): any[] {
		return employees.sort((a, b) => {
			const aIsTeamLead = isTeamLead(a);
			const bIsTeamLead = isTeamLead(b);
			
			// 팀 리더가 아닌 직원보다 팀 리더를 앞에 배치
			if (aIsTeamLead && !bIsTeamLead) return -1;
			if (!aIsTeamLead && bIsTeamLead) return 1;
			
			// 둘 다 팀 리더이거나 둘 다 일반 직원인 경우 이름순 정렬
			const aName = a.last_name + a.first_name;
			const bName = b.last_name + b.first_name;
			return aName.localeCompare(bName);
		});
	}

	// 페이지네이션된 직원들을 팀별로 그룹화 (팀 리더 우선 정렬)
	let paginatedGroupedEmployees = $derived((() => {
		const groups: { [key: string]: any[] } = {};
		
		paginatedEmployees.forEach((employee: any) => {
			const team = employee.department || '기타';
			if (!groups[team]) {
				groups[team] = [];
			}
			groups[team].push(employee);
		});
		
		// 각 팀 내에서 팀 리더를 우선 정렬
		Object.keys(groups).forEach(team => {
			groups[team] = sortEmployees(groups[team]);
		});
		
		return groups;
	})());

	// 통계 데이터
	let stats = $derived((() => {
		const statsData = [
			{
				title: '총 직원 수',
				value: totalEmployees(),
				change: '+5%',
				changeType: 'positive' as const,
				icon: UsersIcon
			},
			{
				title: '부서 수',
				value: totalDepartments(),
				change: '0%',
				changeType: 'neutral' as const,
				icon: BuildingIcon
			},
			{
				title: '진행중인 채용',
				value: activeRecruitments(),
				change: '+2',
				changeType: 'positive' as const,
				icon: UserPlusIcon
			},
			{
				title: '온보딩 진행중',
				value: pendingOnboardings(),
				change: '-1',
				changeType: 'negative' as const,
				icon: ClipboardListIcon
			}
		];
		
		
		return statsData;
	})());

	// 액션 버튼들
	const actions = [
		{
			label: '직원 추가',
			icon: PlusIcon,
			onclick: () => console.log('Add employee'),
			variant: 'primary' as const
		},
		{
			label: '채용 공고',
			icon: FileTextIcon,
			onclick: () => console.log('Create job posting'),
			variant: 'success' as const
		}
	];

	// 최근 활동 데이터
	let recentActivities = $derived(() => {
		const activities: Array<{
			type: string;
			title: string;
			description: string;
			time: string;
			icon: any;
			color: string;
		}> = [];

		// 최근 입사자
		employees
			.filter((emp: any) => emp.status === 'active')
			.sort((a: any, b: any) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
			.slice(0, 3)
			.forEach((emp: any) => {
				activities.push({
					type: 'hire',
					title: '신규 입사',
					description: `${emp.first_name} ${emp.last_name}님이 ${emp.department}에 입사했습니다.`,
					time: emp.hire_date,
					icon: UserPlusIcon,
					color: 'text-green-600'
				});
			});

		// 최근 휴가 신청
		$leaveRequests
			.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
			.slice(0, 3)
			.forEach((request: any) => {
				const employee = employees.find((emp: any) => emp.id === request.employeeId);
				if (employee) {
					activities.push({
						type: 'leave',
						title: '휴가 신청',
						description: `${employee.first_name} ${employee.last_name}님이 ${request.days}일 휴가를 신청했습니다.`,
						time: request.requestedAt,
						icon: CalendarIcon,
						color: 'text-blue-600'
					});
				}
			});

		return activities.slice(0, 5);
	});

	// 부서별 직원 데이터
	let departmentData = $derived(() => {
		if (!employees || employees.length === 0) return [];
		const deptCounts = employees.reduce((acc: any, emp: any) => {
			acc[emp.department] = (acc[emp.department] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return Object.entries(deptCounts).map(([department, count]) => ({
			department,
			count: count as number,
			percentage: Math.round((count as number / totalEmployees()) * 100)
		}));
	});

	// 최근 채용 공고
	let recentJobPostings = $derived(() => {
		return $jobPostings
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 5);
	});

	// 성과 평가 데이터
	let performanceData = $derived(() => {
		return $performanceReviews
			.filter(review => review.status === 'completed')
			.slice(0, 5);
	});

	
	// 컴포넌트 마운트 시 데이터 로드
	onMount(() => {
		fetchEmployees();
		fetchDepartments();
		fetchPositions();
		fetchExecutives();
		fetchJobTitles();
	});

	// 탭 변경 시 해당 탭의 데이터 로드
	$effect(() => {
		// activeTab 변경을 감지하여 데이터 로드
		const currentTab = activeTab;
		console.log('Tab changed to:', currentTab);
		
		switch (currentTab) {
			case 'employees':
				console.log('Loading employees data...');
				fetchEmployees();
				break;
			case 'departments':
				console.log('Loading departments data...');
				fetchDepartments();
				break;
			case 'positions':
				console.log('Loading positions data...');
				fetchPositions();
				break;
			case 'executives':
				console.log('Loading executives data...');
				fetchExecutives();
				break;
			case 'job-titles':
				console.log('Loading job titles data...');
				fetchJobTitles();
				break;
		}
	});
	
	// 파일 업로드 처리
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			validateAndSetFile(file);
		}
	}

	// 드래그 앤 드롭 핸들러
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			validateAndSetFile(file);
		}
	}

	// 파일 검증 및 설정
	function validateAndSetFile(file: File) {
		// 파일 크기 검증 (10MB 제한)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			uploadMessage = '파일 크기는 10MB를 초과할 수 없습니다.';
			uploadStatus = 'error';
			return;
		}

		// 파일 형식 검증
		const allowedTypes = [
			'text/csv',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		];
		const allowedExtensions = ['.csv', '.xlsx', '.xls'];
		
		const isValidType = allowedTypes.includes(file.type);
		const isValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
		
		if (!isValidType && !isValidExtension) {
			uploadMessage = 'CSV 또는 Excel 파일만 업로드 가능합니다.';
			uploadStatus = 'error';
			return;
		}

		uploadFile = file;
		uploadStatus = 'idle';
		uploadMessage = '';
	}

	// 엑셀 업로드 실행
	async function uploadExcel() {
		if (!uploadFile) return;

		uploadStatus = 'uploading';
		uploadProgress = 0;
		uploadMessage = '파일을 업로드하는 중...';

		try {
			const formData = new FormData();
			formData.append('file', uploadFile);

			// 업로드 진행률 시뮬레이션
			const progressInterval = setInterval(() => {
				uploadProgress += 10;
				if (uploadProgress >= 90) {
					clearInterval(progressInterval);
				}
			}, 200);

			const response = await fetch('/api/employees/upload', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressInterval);
			uploadProgress = 100;

			if (response.ok) {
				const result = await response.json();
				uploadStatus = 'success';
				uploadMessage = `성공적으로 ${result.count}명의 직원이 업로드되었습니다.`;
				
				// 직원 목록 새로고침
				await fetchEmployees();
				
				setTimeout(() => {
					showUploadModal = false;
					uploadStatus = 'idle';
					uploadFile = null;
					uploadProgress = 0;
					uploadMessage = '';
				}, 2000);
			} else {
				throw new Error('업로드 실패');
			}
		} catch (error) {
			uploadStatus = 'error';
			uploadMessage = '업로드 중 오류가 발생했습니다. 파일 형식을 확인해주세요.';
			console.error('Upload error:', error);
		}
	}

	// 업로드 모달 열기
	function openUploadModal() {
		showUploadModal = true;
		uploadStatus = 'idle';
		uploadFile = null;
		uploadProgress = 0;
		uploadMessage = '';
	}

	// 업로드 모달 닫기
	function closeUploadModal() {
		showUploadModal = false;
		uploadStatus = 'idle';
		uploadFile = null;
		uploadProgress = 0;
		uploadMessage = '';
	}
	
	// 직원 추가/수정
	async function handleEmployeeSave(event: any) {
		try {
			const employeeData = event.detail;
			employeeLoading = true;
			
			const url = selectedEmployee?.id 
				? `/api/employees/${selectedEmployee.id}` 
				: '/api/employees';
			const method = selectedEmployee?.id ? 'PUT' : 'POST';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(employeeData)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchEmployees(); // 데이터 새로고침
				showEmployeeModal = false;
				selectedEmployee = null;
			} else {
				alert(result.error || '직원 저장에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error saving employee:', error);
			alert('직원 저장 중 오류가 발생했습니다.');
		} finally {
			employeeLoading = false;
		}
	}
	
	// 직원 삭제/아카이브
	async function handleEmployeeDelete(action: 'delete' | 'archive') {
		if (!selectedEmployee) return;
		
		try {
			deleteLoading = true;
			
			const url = `/api/employees/${selectedEmployee.id}${action === 'archive' ? '?archive=true' : ''}`;
			const response = await fetch(url, {
				method: 'DELETE'
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchEmployees(); // 데이터 새로고침
				showDeleteModal = false;
				selectedEmployee = null;
			} else {
				alert(result.error || '직원 삭제에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error deleting employee:', error);
			alert('직원 삭제 중 오류가 발생했습니다.');
		} finally {
			deleteLoading = false;
		}
	}
	
	// 페이지네이션 함수들
	function setCurrentPage(page: number) {
		currentPage = page;
	}

	// 검색/필터 변경 시 첫 페이지로 이동
	$effect(() => {
		searchQuery;
		departmentFilter;
		statusFilter;
		currentPage = 1;
	});
	
	// 직원 추가 모달 열기
	function openAddEmployeeModal() {
		selectedEmployee = null;
		showEmployeeModal = true;
	}
	
	// 직원 수정 모달 열기
	function openEditEmployeeModal(employee: any) {
		selectedEmployee = employee;
		showEmployeeModal = true;
	}
	
	// 직원 삭제 모달 열기
	function openDeleteEmployeeModal(employee: any) {
		selectedEmployee = employee;
		showDeleteModal = true;
	}

	// 직원 템플릿 다운로드
	async function downloadEmployeeTemplate() {
		try {
			const response = await fetch('/api/templates/employees');
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'employee_template.csv';
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert('템플릿 다운로드에 실패했습니다.');
			}
		} catch (error) {
			console.error('템플릿 다운로드 에러:', error);
			alert('템플릿 다운로드 중 오류가 발생했습니다.');
		}
	}

	// 부서 관리 함수들
	async function handleDepartmentSave(event: any) {
		try {
			const departmentData = event.detail;
			departmentLoading = true;
			
			const url = selectedDepartment?.id 
				? `/api/departments/${selectedDepartment.id}` 
				: '/api/departments';
			const method = selectedDepartment?.id ? 'PUT' : 'POST';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(departmentData)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchDepartments();
				showDepartmentModal = false;
				selectedDepartment = null;
			} else {
				alert(result.error || '부서 저장에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error saving department:', error);
			alert('부서 저장 중 오류가 발생했습니다.');
		} finally {
			departmentLoading = false;
		}
	}

	async function handleDepartmentDelete(department: any, hardDelete = false) {
		try {
			const url = `/api/departments/${department.id}${hardDelete ? '?hard=true' : ''}`;
			const response = await fetch(url, {
				method: 'DELETE'
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchDepartments();
			} else {
				alert(result.error || '부서 삭제에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error deleting department:', error);
			alert('부서 삭제 중 오류가 발생했습니다.');
		}
	}

	function openAddDepartmentModal() {
		selectedDepartment = null;
		showDepartmentModal = true;
	}

	function openEditDepartmentModal(department: any) {
		selectedDepartment = department;
		showDepartmentModal = true;
	}

	// 직급 관리 함수들
	async function handlePositionSave(event: any) {
		try {
			const positionData = event.detail;
			positionLoading = true;
			
			const url = selectedPosition?.id 
				? `/api/positions/${selectedPosition.id}` 
				: '/api/positions';
			const method = selectedPosition?.id ? 'PUT' : 'POST';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(positionData)
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchPositions();
				showPositionModal = false;
				selectedPosition = null;
			} else {
				alert(result.error || '직급 저장에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error saving position:', error);
			alert('직급 저장 중 오류가 발생했습니다.');
		} finally {
			positionLoading = false;
		}
	}

	async function handlePositionDelete(position: any, hardDelete = false) {
		try {
			const url = `/api/positions/${position.id}${hardDelete ? '?hard=true' : ''}`;
			const response = await fetch(url, {
				method: 'DELETE'
			});
			
			const result = await response.json();
			
			if (result.success) {
				await fetchPositions();
			} else {
				alert(result.error || '직급 삭제에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error deleting position:', error);
			alert('직급 삭제 중 오류가 발생했습니다.');
		}
	}

	function openAddPositionModal(category?: string) {
		selectedPosition = null;
		showPositionModal = true;
		// 카테고리 정보를 모달에 전달할 수 있도록 설정
		if (category) {
			// 모달에서 카테고리 정보를 사용할 수 있도록 상태 설정
			// 이는 PositionModal 컴포넌트에서 활용할 수 있습니다
		}
	}

	// 이사 관리 함수들
	function openAddExecutiveModal() {
		selectedExecutive = null;
		showExecutiveModal = true;
	}

	function openEditExecutiveModal(executive: any) {
		selectedExecutive = executive;
		showExecutiveModal = true;
	}

	async function handleExecutiveDelete(executive: any) {
		if (confirm(`정말로 ${executive.first_name} ${executive.last_name} 이사를 삭제하시겠습니까?`)) {
			try {
				const response = await fetch(`/api/executives/${executive.id}`, {
					method: 'DELETE'
				});
				
				if (response.ok) {
					await fetchExecutives();
					alert('이사가 성공적으로 삭제되었습니다.');
				} else {
					const result = await response.json();
					alert(result.error || '이사 삭제 중 오류가 발생했습니다.');
				}
			} catch (error) {
				console.error('Error deleting executive:', error);
				alert('이사 삭제 중 오류가 발생했습니다.');
			}
		}
	}

	// 직책 관리 함수들
	function openAddJobTitleModal(level?: string) {
		selectedJobTitle = null;
		showJobTitleModal = true;
		// 레벨 정보를 모달에 전달할 수 있도록 설정
		if (level) {
			// 모달에서 레벨 정보를 사용할 수 있도록 상태 설정
		}
	}

	function openEditJobTitleModal(jobTitle: any) {
		selectedJobTitle = jobTitle;
		showJobTitleModal = true;
	}

	async function handleJobTitleDelete(jobTitle: any) {
		if (confirm(`정말로 ${jobTitle.name} 직책을 삭제하시겠습니까?`)) {
			try {
				const response = await fetch(`/api/job-titles/${jobTitle.id}`, {
					method: 'DELETE'
				});
				
				if (response.ok) {
					await fetchJobTitles();
					alert('직책이 성공적으로 삭제되었습니다.');
				} else {
					const result = await response.json();
					alert(result.error || '직책 삭제 중 오류가 발생했습니다.');
				}
			} catch (error) {
				console.error('Error deleting job title:', error);
				alert('직책 삭제 중 오류가 발생했습니다.');
			}
		}
	}


	function openEditPositionModal(position: any) {
		selectedPosition = position;
		showPositionModal = true;
	}

</script>

<PageLayout
	title="인사관리"
	subtitle="직원 정보, 채용, 성과 관리"
	{stats}
	{actions}
	searchPlaceholder="직원명, 부서, 직급으로 검색..."
>
	<!-- 탭 시스템 -->
	<ThemeTabs
		{tabs}
		bind:activeTab
		variant="underline"
		size="md"
		class="mb-6"
	>
		{#snippet children(tab: any)}
			{#if tab.id === 'overview'}
				<!-- 개요 탭 -->
				<ThemeSpacer size={6}>
					<!-- 메인 대시보드 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 부서별 직원 현황 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="부서별 직원 현황" />
			<ThemeSpacer size={4}>
				{#each departmentData() as dept}
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
						<div class="flex items-center gap-3">
							<BuildingIcon size={20} style="color: var(--color-primary);" />
							<div>
								<h4 class="font-medium" style="color: var(--color-text);">{dept.department}</h4>
								<p class="text-sm" style="color: var(--color-text-secondary);">{dept.count}명</p>
		</div>
						</div>
						<ThemeBadge variant="info">{dept.percentage}%</ThemeBadge>
					</div>
				{/each}
			</ThemeSpacer>
		</ThemeCard>

		<!-- 최근 활동 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="최근 활동" />
			<ThemeSpacer size={4}>
				{#each recentActivities() as activity}
					<ThemeActivityItem
						title={activity.title}
						time={activity.time}
						icon={activity.icon}
					/>
				{/each}
			</ThemeSpacer>
		</ThemeCard>
	</ThemeGrid>

	<!-- 차트 섹션 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 부서별 분포 차트 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="부서별 직원 분포" />
			<ThemeChartPlaceholder
				title="부서별 직원 수"
				icon={TrendingUpIcon}
			/>
		</ThemeCard>

		<!-- 채용 현황 차트 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="채용 현황" />
			<ThemeChartPlaceholder
				title="월별 채용 현황"
				icon={UserPlusIcon}
			/>
		</ThemeCard>
	</ThemeGrid>

	<!-- 최근 채용 공고 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">최근 채용 공고</h3>
			<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
				<PlusIcon size={16} />
				새 공고
			</ThemeButton>
						</div>

		<div class="space-y-4">
			{#each recentJobPostings() as job}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<h4 class="font-medium" style="color: var(--color-text);">{job.title}</h4>
						<p class="text-sm" style="color: var(--color-text-secondary);">{job.department} • {job.employmentType}</p>
						<div class="flex items-center gap-2 mt-2">
							<ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
								{job.status === 'published' ? '모집중' : '마감'}
							</ThemeBadge>
							<span class="text-xs" style="color: var(--color-text-secondary);">
								{formatDate(job.createdAt)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<ThemeButton variant="ghost" size="sm">
							<EyeIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<EditIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<TrashIcon size={16} />
						</ThemeButton>
				</div>
				</div>
			{/each}
		</div>
	</ThemeCard>

	<!-- 성과 평가 현황 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">성과 평가 현황</h3>
			<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
				<PlusIcon size={16} />
				새 평가
			</ThemeButton>
						</div>
		
		<div class="space-y-4">
			{#each performanceData() as review}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<h4 class="font-medium" style="color: var(--color-text);">{(review as any).employeeName}</h4>
						<p class="text-sm" style="color: var(--color-text-secondary);">{(review as any).department} • {(review as any).position}</p>
						<div class="flex items-center gap-2 mt-2">
							<ThemeBadge variant={review.overallRating >= 4 ? 'success' : review.overallRating >= 3 ? 'warning' : 'error'}>
								{review.overallRating}/5
							</ThemeBadge>
							<span class="text-xs" style="color: var(--color-text-secondary);">
								{formatDate((review as any).reviewDate)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<ThemeButton variant="ghost" size="sm">
							<EyeIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<EditIcon size={16} />
						</ThemeButton>
				</div>
				</div>
			{/each}
		</div>
	</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'employees'}
				<!-- 직원관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">직원 목록</h3>
							<div class="flex items-center gap-2">
								<ThemeButton 
									variant="primary" 
									size="sm" 
									class="flex items-center gap-2"
									onclick={openAddEmployeeModal}
								>
									<PlusIcon size={16} />
									직원 추가
								</ThemeButton>
								<button 
									type="button" 
									onclick={openUploadModal}
									class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
								>
									<FileSpreadsheetIcon size={16} />
									엑셀 업로드
								</button>
						</div>
						</div>
						

						{#if loading}
							<div class="flex items-center justify-center py-8">
								<div class="text-sm" style="color: var(--color-text-secondary);">직원 데이터를 불러오는 중...</div>
				</div>
						{:else if error}
							<div class="flex items-center justify-center py-8">
								<div class="text-sm text-red-500">{error}</div>
				</div>
						{:else if !employees || employees.length === 0}
							<div class="flex items-center justify-center py-8">
								<div class="text-sm" style="color: var(--color-text-secondary);">등록된 직원이 없습니다.</div>
							</div>
						{:else}
							<!-- 검색 및 필터 -->
							<div class="mb-6 space-y-4">
								<div class="flex flex-col sm:flex-row gap-4">
									<div class="flex-1">
										<input
											type="text"
											bind:value={searchQuery}
											placeholder="이름, 이메일, 부서로 검색..."
											class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											style="border-color: var(--color-border); background: var(--color-input-background); color: var(--color-text);"
										/>
									</div>
									<div class="flex gap-2">
										<select
											bind:value={departmentFilter}
											class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											style="border-color: var(--color-border); background: var(--color-input-background); color: var(--color-text);"
										>
											<option value="">전체 부서</option>
											{#each departments as dept}
												<option value={dept.name}>{dept.name}</option>
											{/each}
										</select>
										<select
											bind:value={statusFilter}
											class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											style="border-color: var(--color-border); background: var(--color-input-background); color: var(--color-text);"
										>
											<option value="">전체 상태</option>
											<option value="active">재직중</option>
											<option value="on-leave">휴직중</option>
											<option value="terminated">퇴사</option>
										</select>
									</div>
								</div>
							</div>

							<!-- 팀별 직원 카드 그리드 -->
							<div class="space-y-8">
								{#each Object.keys(paginatedGroupedEmployees) as teamName}
									<div class="space-y-4">
										<!-- 팀 헤더 -->
										<div class="flex items-center gap-3 pb-2 border-b" style="border-color: var(--color-border);">
											<BuildingIcon size={20} style="color: var(--color-primary);" />
											<h3 class="text-lg font-semibold" style="color: var(--color-text);">{teamName}</h3>
											<span class="text-sm px-2 py-1 rounded-full" style="background: var(--color-primary-light); color: var(--color-primary);">
												{paginatedGroupedEmployees[teamName]?.length || 0}명
											</span>
						</div>
										
										<!-- 팀 내 직원 카드 그리드 -->
										<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{#each paginatedGroupedEmployees[teamName] || [] as employee}
									<div class="p-4 rounded-lg border transition-all hover:shadow-md {isTeamLead(employee) ? 'ring-2 ring-yellow-400/50 shadow-lg' : ''}" style="border-color: {isTeamLead(employee) ? 'var(--color-warning)' : 'var(--color-border)'}; background: {isTeamLead(employee) ? 'linear-gradient(135deg, var(--color-surface-elevated) 0%, rgba(251, 191, 36, 0.05) 100%)' : 'var(--color-surface-elevated)'};">
										<!-- 직원 헤더 -->
										<div class="flex items-start justify-between mb-3">
											<div class="flex items-center gap-3">
												<div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
													{employee.last_name.charAt(0)}
						</div>
												<div>
													<div class="flex items-center gap-2">
														<h4 class="font-semibold text-lg" style="color: var(--color-text);">
															{employee.last_name}{employee.first_name}
														</h4>
														{#if isTeamLead(employee)}
															<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm">
																👑 팀 리더
															</span>
														{/if}
					</div>
													<p class="text-sm" style="color: var(--color-text-secondary);">{employee.employee_id}</p>
				</div>
				</div>
											<div class="flex flex-col gap-1 items-end">
												<ThemeBadge variant={employee.status === 'active' ? 'success' : employee.status === 'terminated' ? 'error' : 'warning'}>
													{employee.status === 'active' ? '재직중' : 
													 employee.status === 'terminated' ? '퇴사' :
													 employee.status === 'on-leave' ? '휴직' : '비활성'}
												</ThemeBadge>
											</div>
		</div>

										<!-- 직원 정보 -->
										<div class="space-y-2 mb-4">
											<div class="flex items-center gap-2">
												<BuildingIcon size={16} style="color: var(--color-text-secondary);" />
												<span class="text-sm" style="color: var(--color-text);">{employee.department}</span>
				</div>
											<div class="flex items-center gap-2">
												<UserCheckIcon size={16} style="color: var(--color-text-secondary);" />
												<span class="text-sm" style="color: var(--color-text);">
													{employee.job_title_name || employee.position}
												</span>
											</div>
											<div class="flex items-center gap-2">
												<MailIcon size={16} style="color: var(--color-text-secondary);" />
												<span class="text-sm" style="color: var(--color-text-secondary);">{employee.email}</span>
											</div>
											{#if employee.phone}
												<div class="flex items-center gap-2">
													<PhoneIcon size={16} style="color: var(--color-text-secondary);" />
													<span class="text-sm" style="color: var(--color-text-secondary);">{employee.phone}</span>
												</div>
											{/if}
											<div class="flex items-center gap-2">
												<DollarSignIcon size={16} style="color: var(--color-text-secondary);" />
												<span class="text-sm font-medium" style="color: var(--color-primary);">
													{Math.round(Number(employee.salary) / 10000)}만원
												</span>
											</div>
										</div>

										<!-- 액션 버튼 -->
										<div class="flex items-center gap-2 pt-3 border-t" style="border-color: var(--color-border);">
											<ThemeButton 
												variant="ghost" 
												size="sm"
												class="flex-1"
												onclick={() => openEditEmployeeModal(employee)}
											>
												<EditIcon size={16} />
												수정
											</ThemeButton>
											<ThemeButton 
												variant="ghost" 
												size="sm"
												class="flex-1"
												onclick={() => openDeleteEmployeeModal(employee)}
											>
												<TrashIcon size={16} />
												삭제
											</ThemeButton>
				</div>
									</div>
											{/each}
										</div>
									</div>
								{/each}
		</div>

							<!-- 페이지네이션 -->
							{#if totalPages > 1}
								<div class="flex items-center justify-center gap-2 mt-6">
									<ThemeButton 
										variant="ghost" 
										size="sm"
										disabled={currentPage === 1}
										onclick={() => setCurrentPage(currentPage - 1)}
									>
										이전
									</ThemeButton>
									{#each Array.from({length: totalPages}, (_, i) => i + 1) as page}
										<ThemeButton 
											variant={page === currentPage ? 'primary' : 'ghost'} 
											size="sm"
											onclick={() => setCurrentPage(page)}
										>
											{page}
										</ThemeButton>
									{/each}
									<ThemeButton 
										variant="ghost" 
										size="sm"
										disabled={currentPage === totalPages}
										onclick={() => setCurrentPage(currentPage + 1)}
									>
										다음
									</ThemeButton>
				</div>
							{/if}
						{/if}
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'recruitment'}
				<!-- 채용관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">채용 공고</h3>
							<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
								<PlusIcon size={16} />
								공고 등록
							</ThemeButton>
						</div>
						
					<div class="space-y-4">
							{#each recentJobPostings() as job}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<h4 class="font-medium" style="color: var(--color-text);">{job.title}</h4>
										<p class="text-sm" style="color: var(--color-text-secondary);">{job.department} • {job.employmentType}</p>
										<div class="flex items-center gap-2 mt-2">
											<ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
												{job.status === 'published' ? '모집중' : '마감'}
											</ThemeBadge>
											<span class="text-xs" style="color: var(--color-text-secondary);">
												{formatDate(job.createdAt)}
											</span>
								</div>
				</div>
									<div class="flex items-center gap-2">
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
								</div>
							</div>
						{/each}
					</div>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'onboarding'}
				<!-- 온보딩 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="온보딩 진행 현황" />
						<ThemeChartPlaceholder
							title="온보딩 진행률"
							icon={GraduationCapIcon}
						/>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'performance'}
				<!-- 성과관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="성과 평가 현황" />
						<div class="space-y-4">
							{#each performanceData() as review}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<h4 class="font-medium" style="color: var(--color-text);">{(review as any).employeeName}</h4>
										<p class="text-sm" style="color: var(--color-text-secondary);">{(review as any).department} • {(review as any).position}</p>
										<div class="flex items-center gap-2 mt-2">
											<ThemeBadge variant={review.overallRating >= 4 ? 'success' : review.overallRating >= 3 ? 'warning' : 'error'}>
												{review.overallRating}/5
											</ThemeBadge>
											<span class="text-xs" style="color: var(--color-text-secondary);">
												{formatDate((review as any).reviewDate)}
											</span>
				</div>
		</div>
									<div class="flex items-center gap-2">
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
				</div>
								</div>
							{/each}
								</div>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'departments'}
				<!-- 부서관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeGrid cols={1} lgCols={2} gap={6}>
						<!-- 부서 관리 -->
						<ThemeCard class="p-6">
							<div class="flex items-center justify-between mb-6">
								<h3 class="text-lg font-semibold" style="color: var(--color-text);">부서 관리</h3>
								<ThemeButton 
									variant="primary" 
									size="sm" 
									class="flex items-center gap-2"
									onclick={openAddDepartmentModal}
								>
									<PlusIcon size={16} />
									부서 추가
								</ThemeButton>
							</div>
							
					<div class="space-y-3">
								{#each departments as department}
									<div class="flex items-center justify-between p-3 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
										<div class="flex items-center gap-3">
											<BuildingIcon size={20} style="color: var(--color-primary);" />
											<div>
												<h4 class="font-medium" style="color: var(--color-text);">{department.name}</h4>
												{#if department.description}
													<p class="text-sm" style="color: var(--color-text-secondary);">{department.description}</p>
												{/if}
											</div>
										</div>
										<div class="flex items-center gap-2">
											<ThemeBadge variant={department.status === 'active' ? 'success' : 'warning'}>
												{department.status === 'active' ? '활성' : '비활성'}
											</ThemeBadge>
											<ThemeButton 
												variant="ghost" 
												size="sm"
												onclick={() => openEditDepartmentModal(department)}
											>
												<EditIcon size={16} />
											</ThemeButton>
											<ThemeButton 
												variant="ghost" 
												size="sm"
												onclick={() => handleDepartmentDelete(department)}
											>
												<TrashIcon size={16} />
											</ThemeButton>
										</div>
							</div>
						{/each}
								
								{#if departments.length === 0}
									<div class="text-center py-8">
										<BuildingIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
										<p class="text-sm" style="color: var(--color-text-secondary);">등록된 부서가 없습니다.</p>
					</div>
								{/if}
				</div>
						</ThemeCard>

					</ThemeGrid>

					<!-- 부서 관리 안내 -->
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="부서 관리 안내" />
						<div class="space-y-3">
							<h4 class="font-medium" style="color: var(--color-text);">부서 관리 규칙</h4>
							<ul class="text-sm space-y-2" style="color: var(--color-text-secondary);">
								<li>• 부서명은 중복될 수 없습니다</li>
								<li>• 부서를 삭제하면 해당 부서의 직원들에게 영향을 줄 수 있습니다</li>
								<li>• 비활성화된 부서는 새 직원 배치 시 선택할 수 없습니다</li>
								<li>• 부서 설명은 선택사항이며, 부서의 역할과 책임을 명시할 수 있습니다</li>
							</ul>
							</div>
					</ThemeCard>
				</ThemeSpacer>
			{:else if tab.id === 'positions'}
				<!-- 직급관리 탭 -->
				<ThemeSpacer size={6}>
					<div class="space-y-6">
						<!-- 직급 카테고리별 관리 -->
						{#each Object.entries(getPositionsByCategory()) as [category, categoryPositions]}
							<ThemeCard class="p-6">
								<div class="flex items-center justify-between mb-6">
									<div class="flex items-center gap-3">
										{#if category === '연구원'}
											<GraduationCapIcon size={24} style="color: var(--color-primary);" />
										{:else if category === '디자이너'}
											<UsersIcon size={24} style="color: var(--color-primary);" />
										{:else if category === '행정원'}
											<BuildingIcon size={24} style="color: var(--color-primary);" />
										{/if}
										<div>
											<h3 class="text-xl font-semibold" style="color: var(--color-text);">{category} 직급 관리</h3>
											<p class="text-sm" style="color: var(--color-text-secondary);">{categoryPositions.length}개 직급</p>
							</div>
							</div>
									<ThemeButton 
										variant="primary" 
										size="sm" 
										class="flex items-center gap-2"
										onclick={() => openAddPositionModal(category)}
									>
										<PlusIcon size={16} />
										{category} 직급 추가
									</ThemeButton>
							</div>
								
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each categoryPositions as position}
										<div class="p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
											<div class="flex items-start justify-between mb-3">
												<div class="flex-1">
													<h4 class="font-medium" style="color: var(--color-text);">{position.name}</h4>
													<p class="text-sm" style="color: var(--color-text-secondary);">{position.department}</p>
													<div class="flex items-center gap-2 mt-2">
														<ThemeBadge variant="default" size="sm">
															레벨 {position.level}
														</ThemeBadge>
														<ThemeBadge variant={position.status === 'active' ? 'success' : 'warning'} size="sm">
															{position.status === 'active' ? '활성' : '비활성'}
														</ThemeBadge>
					</div>
				</div>
												<div class="flex items-center gap-1">
													<ThemeButton 
														variant="ghost" 
														size="sm"
														onclick={() => openEditPositionModal(position)}
													>
														<EditIcon size={14} />
													</ThemeButton>
													<ThemeButton 
														variant="ghost" 
														size="sm"
														onclick={() => handlePositionDelete(position)}
													>
														<TrashIcon size={14} />
													</ThemeButton>
		</div>
	</div>
											{#if position.description}
												<p class="text-xs" style="color: var(--color-text-secondary);">{position.description}</p>
											{/if}
</div>
									{/each}
									
									{#if categoryPositions.length === 0}
										<div class="col-span-full text-center py-8">
											{#if category === '연구원'}
												<GraduationCapIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{:else if category === '디자이너'}
												<UsersIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{:else if category === '행정원'}
												<BuildingIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{/if}
											<p class="text-sm" style="color: var(--color-text-secondary);">{category} 직급이 등록되지 않았습니다.</p>
										</div>
									{/if}
								</div>
							</ThemeCard>
						{/each}

						<!-- 직급 관리 안내 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="직급 관리 안내" />
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<GraduationCapIcon size={16} style="color: var(--color-primary);" />
										연구원 직급
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• 연구원 → 주임연구원</li>
										<li>• 선임연구원 → 책임연구원</li>
										<li>• 수석연구원</li>
									</ul>
								</div>
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<UsersIcon size={16} style="color: var(--color-primary);" />
										디자이너 직급
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• 디자이너 → 주임디자이너</li>
										<li>• 선임디자이너 → 책임디자이너</li>
										<li>• 수석디자이너</li>
									</ul>
								</div>
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<BuildingIcon size={16} style="color: var(--color-primary);" />
										행정원 직급
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• 행정원 → 주임행정원</li>
										<li>• 선임행정원 → 책임행정원</li>
										<li>• 수석행정원</li>
									</ul>
								</div>
							</div>
						</ThemeCard>
					</div>
				</ThemeSpacer>
			{:else if tab.id === 'executives'}
				<!-- 이사관리 탭 -->
				<ThemeSpacer size={6}>
					<div class="space-y-6">
						<!-- 이사 목록 -->
						<ThemeCard class="p-6">
							<div class="flex items-center justify-between mb-6">
								<h3 class="text-lg font-semibold" style="color: var(--color-text);">이사 명부</h3>
								<ThemeButton
									variant="primary"
									size="sm"
									class="flex items-center gap-2"
									onclick={() => openAddExecutiveModal()}
								>
									<PlusIcon size={16} />
									이사 추가
								</ThemeButton>
							</div>

							<div class="space-y-4">
								{#if executiveLoading}
									<div class="flex items-center justify-center py-8">
										<div class="text-sm" style="color: var(--color-text-secondary);">이사 데이터를 불러오는 중...</div>
									</div>
								{:else if executives.length === 0}
									<div class="text-center py-8">
										<CrownIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
										<p class="text-sm" style="color: var(--color-text-secondary);">등록된 이사가 없습니다.</p>
									</div>
								{:else}
									{#each executives as executive}
										<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
											<div class="flex items-center gap-4">
												<div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
													<span class="text-white font-semibold text-lg">
														{executive.first_name.charAt(0)}
													</span>
												</div>
												<div>
													<h4 class="font-medium" style="color: var(--color-text);">
														{executive.first_name} {executive.last_name}
													</h4>
													<p class="text-sm" style="color: var(--color-text-secondary);">
														{executive.job_title_name} • {executive.department}
													</p>
													<div class="flex items-center gap-2 mt-1">
														<ThemeBadge variant={executive.status === 'active' ? 'success' : 'warning'} size="sm">
															{executive.status === 'active' ? '활성' : '비활성'}
														</ThemeBadge>
														<span class="text-xs" style="color: var(--color-text-secondary);">
															레벨 {executive.job_title_level}
														</span>
													</div>
												</div>
											</div>
											<div class="flex items-center gap-2">
												<ThemeButton
													variant="ghost"
													size="sm"
													onclick={() => openEditExecutiveModal(executive)}
												>
													<EditIcon size={16} />
												</ThemeButton>
												<ThemeButton
													variant="ghost"
													size="sm"
													onclick={() => handleExecutiveDelete(executive)}
												>
													<TrashIcon size={16} />
												</ThemeButton>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</ThemeCard>

						<!-- 이사 관리 안내 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="이사 관리 안내" />
							<div class="space-y-3">
								<h4 class="font-medium" style="color: var(--color-text);">이사 관리 규칙</h4>
								<ul class="text-sm space-y-2" style="color: var(--color-text-secondary);">
									<li>• C-Level 임원진은 회사의 최고 경영진입니다</li>
									<li>• 이사는 직급이 아닌 직책으로 관리됩니다</li>
									<li>• 이사 임기는 별도로 관리되며, 연장이 가능합니다</li>
									<li>• 이사 정보는 회사 대표 정보로 활용됩니다</li>
								</ul>
							</div>
						</ThemeCard>
					</div>
				</ThemeSpacer>
			{:else if tab.id === 'job-titles'}
				<!-- 직책관리 탭 -->
				<ThemeSpacer size={6}>
					<div class="space-y-6">
						<!-- 직책 레벨별 관리 -->
						{#each Object.entries(getJobTitlesByLevel()) as [level, levelJobTitles]}
							<ThemeCard class="p-6">
								<div class="flex items-center justify-between mb-6">
									<div class="flex items-center gap-3">
										{#if level === 'C-Level'}
											<CrownIcon size={24} style="color: var(--color-primary);" />
										{:else if level === 'Management'}
											<BriefcaseIcon size={24} style="color: var(--color-primary);" />
										{:else if level === 'Specialist'}
											<UserCheckIcon size={24} style="color: var(--color-primary);" />
										{/if}
										<div>
											<h3 class="text-xl font-semibold" style="color: var(--color-text);">{level} 직책</h3>
											<p class="text-sm" style="color: var(--color-text-secondary);">{levelJobTitles.length}개 직책</p>
										</div>
									</div>
									<ThemeButton
										variant="primary"
										size="sm"
										class="flex items-center gap-2"
										onclick={() => openAddJobTitleModal(level)}
									>
										<PlusIcon size={16} />
										{level} 직책 추가
									</ThemeButton>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each levelJobTitles as jobTitle}
										<div class="p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
											<div class="flex items-start justify-between mb-3">
												<div class="flex-1">
													<h4 class="font-medium" style="color: var(--color-text);">{jobTitle.name}</h4>
													<p class="text-sm" style="color: var(--color-text-secondary);">{jobTitle.category}</p>
													<div class="flex items-center gap-2 mt-2">
														<ThemeBadge variant="default" size="sm">
															레벨 {jobTitle.level}
														</ThemeBadge>
														<ThemeBadge variant={jobTitle.is_active ? 'success' : 'warning'} size="sm">
															{jobTitle.is_active ? '활성' : '비활성'}
														</ThemeBadge>
													</div>
												</div>
												<div class="flex items-center gap-1">
													<ThemeButton
														variant="ghost"
														size="sm"
														onclick={() => openEditJobTitleModal(jobTitle)}
													>
														<EditIcon size={14} />
													</ThemeButton>
													<ThemeButton
														variant="ghost"
														size="sm"
														onclick={() => handleJobTitleDelete(jobTitle)}
													>
														<TrashIcon size={14} />
													</ThemeButton>
												</div>
											</div>
											{#if jobTitle.description}
												<p class="text-xs" style="color: var(--color-text-secondary);">{jobTitle.description}</p>
											{/if}
										</div>
									{/each}

									{#if levelJobTitles.length === 0}
										<div class="col-span-full text-center py-8">
											{#if level === 'C-Level'}
												<CrownIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{:else if level === 'Management'}
												<BriefcaseIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{:else if level === 'Specialist'}
												<UserCheckIcon size={48} class="mx-auto mb-4" style="color: var(--color-text-secondary);" />
											{/if}
											<p class="text-sm" style="color: var(--color-text-secondary);">{level} 직책이 등록되지 않았습니다.</p>
										</div>
									{/if}
								</div>
							</ThemeCard>
						{/each}

						<!-- 직책 관리 안내 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="직책 관리 안내" />
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<CrownIcon size={16} style="color: var(--color-primary);" />
										C-Level 직책
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• CEO (대표이사)</li>
										<li>• CTO (연구소장, 기술이사)</li>
										<li>• CFO (상무이사)</li>
									</ul>
								</div>
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<BriefcaseIcon size={16} style="color: var(--color-primary);" />
										Management 직책
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• Director (이사)</li>
										<li>• Managing Director (상무)</li>
									</ul>
								</div>
								<div class="space-y-3">
									<h4 class="font-medium flex items-center gap-2" style="color: var(--color-text);">
										<UserCheckIcon size={16} style="color: var(--color-primary);" />
										Specialist 직책
									</h4>
									<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
										<li>• Team Lead (팀장)</li>
										<li>• Senior Manager (부장)</li>
										<li>• Manager (과장)</li>
									</ul>
								</div>
							</div>
						</ThemeCard>
					</div>
				</ThemeSpacer>
			{:else if tab.id === 'org-chart'}
				<!-- 조직도 탭 -->
				<OrganizationChart />
			{/if}
		{/snippet}
	</ThemeTabs>

	<!-- 엑셀 업로드 모달 -->
	<ThemeModal
		open={showUploadModal}
		onclose={closeUploadModal}
		size="md"
	>
		<div class="space-y-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--color-text);">직원 정보 엑셀 업로드</h2>
			<!-- 파일 선택 -->
			<div>
				<label for="employee-file-input" class="block text-sm font-medium mb-2" style="color: var(--color-text);">
					엑셀 파일 선택
				</label>
				
				<!-- 드래그 앤 드롭 영역 -->
				<div
					class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
					class:drag-over={isDragOver}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					onclick={() => document.getElementById('employee-file-input')?.click()}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('employee-file-input')?.click(); } }}
					role="button"
					tabindex="0"
					aria-label="파일 업로드 영역 - 클릭하거나 파일을 드래그하여 업로드하세요"
					style="border-color: var(--color-border); background: var(--color-surface);"
				>
					{#if uploadFile}
						<div class="flex items-center justify-center space-x-2">
							<FileSpreadsheetIcon size={24} style="color: var(--color-primary);" />
							<span style="color: var(--color-text);">{uploadFile.name}</span>
						</div>
					{:else}
						<div class="space-y-2">
							<FileSpreadsheetIcon size={48} class="mx-auto" style="color: var(--color-text-secondary);" />
							<p style="color: var(--color-text);">파일을 여기에 드래그하거나 클릭하여 선택하세요</p>
							<p class="text-sm" style="color: var(--color-text-secondary);">CSV, XLSX, XLS 파일 지원</p>
						</div>
					{/if}
				</div>
				
				<!-- 숨겨진 파일 입력 -->
				<input
					id="employee-file-input"
					type="file"
					accept=".xlsx,.xls,.csv"
					onchange={handleFileSelect}
					class="hidden"
				/>
			</div>

			<!-- 선택된 파일 정보 -->
			{#if uploadFile}
				<div class="p-3 rounded-lg" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
					<div class="flex items-center gap-2">
						<FileSpreadsheetIcon size={16} style="color: var(--color-primary);" />
						<span class="text-sm font-medium" style="color: var(--color-text);">{uploadFile.name}</span>
						<span class="text-xs" style="color: var(--color-text-secondary);">
							({(uploadFile.size / 1024).toFixed(1)} KB)
						</span>
					</div>
				</div>
			{/if}

			<!-- 업로드 진행률 -->
			{#if uploadStatus === 'uploading'}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span style="color: var(--color-text-secondary);">업로드 진행률</span>
						<span style="color: var(--color-text);">{uploadProgress}%</span>
							</div>
					<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div 
							class="h-2 rounded-full transition-all duration-300" 
							style="width: {uploadProgress}%; background: var(--color-primary);"
						></div>
					</div>
				</div>
			{/if}

			<!-- 상태 메시지 -->
			{#if uploadMessage}
				<div class="flex items-center gap-2 p-3 rounded-lg" style="background: {uploadStatus === 'success' ? 'var(--color-success-light)' : uploadStatus === 'error' ? 'var(--color-error-light)' : 'var(--color-info-light)'}; border: 1px solid {uploadStatus === 'success' ? 'var(--color-success)' : uploadStatus === 'error' ? 'var(--color-error)' : 'var(--color-info)'};">
					{#if uploadStatus === 'success'}
						<CheckCircleIcon size={16} style="color: var(--color-success);" />
					{:else if uploadStatus === 'error'}
						<AlertCircleIcon size={16} style="color: var(--color-error);" />
					{/if}
					<span class="text-sm" style="color: {uploadStatus === 'success' ? 'var(--color-success)' : uploadStatus === 'error' ? 'var(--color-error)' : 'var(--color-info)'};">
						{uploadMessage}
					</span>
				</div>
			{/if}

			<!-- 엑셀 템플릿 다운로드 -->
			<div class="p-4 rounded-lg" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
				<h4 class="text-sm font-medium mb-2" style="color: var(--color-text);">엑셀 템플릿</h4>
				<p class="text-xs mb-3" style="color: var(--color-text-secondary);">
					직원 데이터를 업로드하기 전에 템플릿을 다운로드하여 올바른 형식으로 데이터를 입력하세요.
				</p>
				<ThemeButton variant="ghost" size="sm" onclick={downloadEmployeeTemplate}>
					<DownloadIcon size={16} class="mr-2" />
					템플릿 다운로드
				</ThemeButton>
			</div>
		</div>

		<!-- 모달 액션 버튼 -->
		<div class="flex justify-end gap-2 pt-4 border-t" style="border-color: var(--color-border);">
			<ThemeButton variant="ghost" onclick={closeUploadModal}>
				취소
			</ThemeButton>
			<ThemeButton 
				variant="primary" 
				onclick={uploadExcel}
				disabled={!uploadFile || uploadStatus === 'uploading'}
			>
				{uploadStatus === 'uploading' ? '업로드 중...' : '업로드'}
			</ThemeButton>
		</div>
	</ThemeModal>
</PageLayout>

<!-- 직원 추가/수정 모달 -->
<EmployeeModal
	open={showEmployeeModal}
	employee={selectedEmployee}
	loading={employeeLoading}
	departments={departments}
	positions={positions}
	jobTitles={jobTitles}
	on:close={() => {
		showEmployeeModal = false;
		selectedEmployee = null;
	}}
	on:save={handleEmployeeSave}
/>

<!-- 직원 삭제 확인 모달 -->
<DeleteConfirmModal
	open={showDeleteModal}
	title="직원 삭제"
	message="이 직원을 삭제하시겠습니까?"
	itemName={selectedEmployee ? `${selectedEmployee.last_name}${selectedEmployee.first_name} (${selectedEmployee.department})` : ''}
	loading={deleteLoading}
	showArchive={true}
	on:close={() => {
		showDeleteModal = false;
		selectedEmployee = null;
	}}
	on:confirm={(event) => handleEmployeeDelete(event.detail.action)}
/>

<!-- 부서 관리 모달 -->
<DepartmentModal
	open={showDepartmentModal}
	department={selectedDepartment}
	loading={departmentLoading}
	on:close={() => {
		showDepartmentModal = false;
		selectedDepartment = null;
	}}
	on:save={handleDepartmentSave}
/>

<!-- 직급 관리 모달 -->
<PositionModal
        open={showPositionModal}
        position={selectedPosition}
        departments={departments}
        loading={positionLoading}
        on:close={() => {
                showPositionModal = false;
                selectedPosition = null;
        }}
        on:save={handlePositionSave}
/>


<style>
	.drag-over {
		border-color: var(--color-primary) !important;
		background: var(--color-primary-light) !important;
	}
</style>