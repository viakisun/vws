<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { processKoreanName } from '$lib/utils/korean-name';
	import {
		UsersIcon,
		DollarSignIcon,
		CalendarIcon,
		UserIcon,
		PlusIcon,
		EditIcon,
		TrashIcon,
		BuildingIcon,
		TargetIcon,
		FileTextIcon,
		AlertTriangleIcon,
		CheckIcon,
		XIcon
	} from '@lucide/svelte';

	const dispatch = createEventDispatcher();

	let { selectedProject }: { selectedProject: any } = $props();

	// 모달 상태
	let showBudgetModal = $state(false);
	let showMemberModal = $state(false);
	let showEditProjectModal = $state(false);
	let showDeleteConfirmModal = $state(false);
	let editingBudget = $state<any>(null);
	let editingMember = $state<any>(null);
	let addingMember = $state(false);
	let isDeleting = $state(false);

	// 폼 데이터
	let budgetForm = $state({
		fiscalYear: new Date().getFullYear(),
		contributionType: 'cash', // 'cash' or 'in_kind'
		// 현금 비목들
		personnelCostCash: '',
		researchMaterialCostCash: '',
		researchActivityCostCash: '',
		indirectCostCash: '',
		// 현물 비목들
		personnelCostInKind: '',
		researchMaterialCostInKind: '',
		researchActivityCostInKind: '',
		indirectCostInKind: '',
		actualAmount: ''
	});

	let memberForm = $state({
		employeeId: '',
		role: 'researcher',
		startDate: '',
		endDate: '',
		participationRate: 100, // 기본 참여율 100%
		contributionType: 'cash' // 'cash' or 'in_kind'
	});

	let calculatedMonthlyAmount = $state(0);
	let isCalculatingMonthlyAmount = $state(false);

	// 증빙 내역 관리 상태
	let showEvidenceModal = $state(false);
	let selectedBudgetForEvidence = $state(null);
	let evidenceList = $state([]);
	let evidenceTypes = $state([]);

	let editProjectForm = $state({
		title: '',
		description: '',
		sponsorType: '',
		sponsorName: '',
		startDate: '',
		endDate: '',
		budgetTotal: '',
		researchType: '',
		priority: '',
		status: ''
	});

	// 데이터
	let projectMembers = $state<any[]>([]);
	let projectBudgets = $state<any[]>([]);
	let budgetCategories = $state<any[]>([]);
	let availableEmployees = $state<any[]>([]);

	// 프로젝트 멤버 로드
	async function loadProjectMembers() {
		try {
			const response = await fetch(`/api/project-management/project-members?projectId=${selectedProject.id}`);
			if (response.ok) {
				const data = await response.json();
				projectMembers = data.data || [];
			}
		} catch (error) {
			console.error('프로젝트 멤버 로드 실패:', error);
		}
	}

	// 프로젝트 사업비 로드
	async function loadProjectBudgets() {
		try {
			const response = await fetch(`/api/project-management/project-budgets?projectId=${selectedProject.id}`);
			if (response.ok) {
				const data = await response.json();
				projectBudgets = data.data || [];
			}
		} catch (error) {
			console.error('프로젝트 사업비 로드 실패:', error);
		}
	}

	// 사업비 항목 로드
	async function loadBudgetCategories() {
		try {
			const response = await fetch('/api/project-management/budget-categories');
			if (response.ok) {
				const data = await response.json();
				budgetCategories = data.data || [];
			}
		} catch (error) {
			console.error('사업비 항목 로드 실패:', error);
		}
	}

	// 사용 가능한 직원 로드
	async function loadAvailableEmployees() {
		try {
			console.log('직원 목록 로딩 시작, 프로젝트 ID:', selectedProject.id);
			const response = await fetch(`/api/project-management/employees?excludeProjectMembers=true&projectId=${selectedProject.id}`);
			console.log('직원 목록 API 응답 상태:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('직원 목록 API 응답 데이터:', data);
				availableEmployees = data.data || [];
				console.log('로드된 직원 수:', availableEmployees.length);
			} else {
				console.error('직원 목록 API 오류:', response.status, response.statusText);
				const errorData = await response.text();
				console.error('오류 상세:', errorData);
			}
		} catch (error) {
			console.error('직원 목록 로드 실패:', error);
		}
	}

	// 사업비 추가
	async function addBudget() {
		try {
			const response = await fetch('/api/project-management/project-budgets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId: selectedProject.id,
					fiscalYear: budgetForm.fiscalYear,
					contributionType: budgetForm.contributionType,
					// 현금 비목들
					personnelCostCash: parseFloat(budgetForm.personnelCostCash) || 0,
					researchMaterialCostCash: parseFloat(budgetForm.researchMaterialCostCash) || 0,
					researchActivityCostCash: parseFloat(budgetForm.researchActivityCostCash) || 0,
					indirectCostCash: parseFloat(budgetForm.indirectCostCash) || 0,
					// 현물 비목들
					personnelCostInKind: parseFloat(budgetForm.personnelCostInKind) || 0,
					researchMaterialCostInKind: parseFloat(budgetForm.researchMaterialCostInKind) || 0,
					researchActivityCostInKind: parseFloat(budgetForm.researchActivityCostInKind) || 0,
					indirectCostInKind: parseFloat(budgetForm.indirectCostInKind) || 0,
					spentAmount: parseFloat(budgetForm.actualAmount) || 0
				})
			});

			if (response.ok) {
				showBudgetModal = false;
				budgetForm = {
					fiscalYear: new Date().getFullYear(),
					contributionType: 'cash',
					personnelCostCash: '',
					researchMaterialCostCash: '',
					researchActivityCostCash: '',
					indirectCostCash: '',
					personnelCostInKind: '',
					researchMaterialCostInKind: '',
					researchActivityCostInKind: '',
					indirectCostInKind: '',
					actualAmount: ''
				};
				await loadProjectBudgets();
				dispatch('refresh');
			}
		} catch (error) {
			console.error('사업비 추가 실패:', error);
		}
	}

	// 멤버 추가
	async function addMember() {
		// 참여율 검증
		if (memberForm.participationRate < 0 || memberForm.participationRate > 100) {
			alert('참여율은 0-100 사이의 값이어야 합니다.');
			return;
		}

		try {
			const response = await fetch('/api/project-management/project-members', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId: selectedProject.id,
					employeeId: memberForm.employeeId,
					role: memberForm.role,
					startDate: memberForm.startDate,
					endDate: memberForm.endDate,
					participationRate: memberForm.participationRate,
					contributionType: memberForm.contributionType
				})
			});

			if (response.ok) {
				addingMember = false;
				memberForm = {
					employeeId: '',
					role: 'researcher',
					startDate: '',
					endDate: '',
					participationRate: 100,
					contributionType: 'cash'
				};
				await loadProjectMembers();
				dispatch('refresh');
			} else {
				const errorData = await response.json();
				alert(errorData.message || '멤버 추가에 실패했습니다.');
			}
		} catch (error) {
			console.error('멤버 추가 실패:', error);
			alert('멤버 추가 중 오류가 발생했습니다.');
		}
	}

	// 멤버 추가 취소
	function cancelAddMember() {
		addingMember = false;
		memberForm = {
			employeeId: '',
			role: 'researcher',
			startDate: '',
			endDate: '',
			participationRate: 100,
			contributionType: 'cash'
		};
	}

	// 멤버 수정 시작
	function editMember(member: any) {
		editingMember = member;
		memberForm = {
			employeeId: member.employee_id,
			role: member.role,
			startDate: member.start_date,
			endDate: member.end_date,
			participationRate: member.participation_rate,
			contributionType: member.contribution_type
		};
		addingMember = true; // 인라인 편집 모드로 전환
	}

	// 멤버 수정 완료
	async function updateMember() {
		if (!editingMember) return;

		// 참여율 검증
		if (memberForm.participationRate < 0 || memberForm.participationRate > 100) {
			alert('참여율은 0-100 사이의 값이어야 합니다.');
			return;
		}

		try {
			const response = await fetch(`/api/project-management/project-members/${editingMember.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role: memberForm.role,
					startDate: memberForm.startDate,
					endDate: memberForm.endDate,
					participationRate: memberForm.participationRate,
					contributionType: memberForm.contributionType
				})
			});

			if (response.ok) {
				editingMember = null;
				addingMember = false;
				memberForm = {
					employeeId: '',
					role: 'researcher',
					startDate: '',
					endDate: '',
					participationRate: 100,
					contributionType: 'cash'
				};
				await loadProjectMembers();
				dispatch('refresh');
			}
		} catch (error) {
			console.error('멤버 수정 실패:', error);
		}
	}

	// 멤버 수정 취소
	function cancelEditMember() {
		editingMember = null;
		addingMember = false;
		memberForm = {
			employeeId: '',
			role: 'researcher',
			startDate: '',
			endDate: '',
			participationRate: 100,
			contributionType: 'cash'
		};
	}

	// 멤버 삭제
	async function removeMember(memberId: string) {
		if (!confirm('정말로 이 멤버를 제거하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/project-management/project-members/${memberId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadProjectMembers();
				dispatch('refresh');
			}
		} catch (error) {
			console.error('멤버 삭제 실패:', error);
		}
	}

	// 사업비 편집
	function editBudget(budget: any) {
		editingBudget = budget;
		budgetForm = {
			fiscalYear: budget.fiscal_year,
			contributionType: budget.contribution_type || 'cash',
			// 현금 비목들
			personnelCostCash: (budget.personnel_cost_cash || 0).toString(),
			researchMaterialCostCash: (budget.research_material_cost_cash || 0).toString(),
			researchActivityCostCash: (budget.research_activity_cost_cash || 0).toString(),
			indirectCostCash: (budget.indirect_cost_cash || 0).toString(),
			// 현물 비목들
			personnelCostInKind: (budget.personnel_cost_in_kind || 0).toString(),
			researchMaterialCostInKind: (budget.research_material_cost_in_kind || 0).toString(),
			researchActivityCostInKind: (budget.research_activity_cost_in_kind || 0).toString(),
			indirectCostInKind: (budget.indirect_cost_in_kind || 0).toString(),
			actualAmount: (budget.spent_amount || 0).toString()
		};
		showBudgetModal = true;
	}

	// 사업비 업데이트
	async function updateBudget() {
		if (!editingBudget) return;

		try {
			const response = await fetch(`/api/project-management/project-budgets/${editingBudget.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fiscalYear: budgetForm.fiscalYear,
					contributionType: budgetForm.contributionType,
					// 현금 비목들
					personnelCostCash: parseFloat(budgetForm.personnelCostCash) || 0,
					researchMaterialCostCash: parseFloat(budgetForm.researchMaterialCostCash) || 0,
					researchActivityCostCash: parseFloat(budgetForm.researchActivityCostCash) || 0,
					indirectCostCash: parseFloat(budgetForm.indirectCostCash) || 0,
					// 현물 비목들
					personnelCostInKind: parseFloat(budgetForm.personnelCostInKind) || 0,
					researchMaterialCostInKind: parseFloat(budgetForm.researchMaterialCostInKind) || 0,
					researchActivityCostInKind: parseFloat(budgetForm.researchActivityCostInKind) || 0,
					indirectCostInKind: parseFloat(budgetForm.indirectCostInKind) || 0,
					spentAmount: parseFloat(budgetForm.actualAmount) || 0
				})
			});

			if (response.ok) {
				showBudgetModal = false;
				editingBudget = null;
				budgetForm = {
					fiscalYear: new Date().getFullYear(),
					contributionType: 'cash',
					personnelCostCash: '',
					researchMaterialCostCash: '',
					researchActivityCostCash: '',
					indirectCostCash: '',
					personnelCostInKind: '',
					researchMaterialCostInKind: '',
					researchActivityCostInKind: '',
					indirectCostInKind: '',
					actualAmount: ''
				};
				await loadProjectBudgets();
				dispatch('refresh');
			}
		} catch (error) {
			console.error('사업비 업데이트 실패:', error);
		}
	}

	// 사업비 삭제
	async function removeBudget(budgetId: string) {
		if (!confirm('정말로 이 사업비 항목을 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/project-management/project-budgets/${budgetId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadProjectBudgets();
				dispatch('refresh');
			}
		} catch (error) {
			console.error('사업비 삭제 실패:', error);
		}
	}

	// 프로젝트 삭제
	async function deleteProject() {
		if (!selectedProject) return;

		isDeleting = true;
		try {
			const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok && result.success) {
				showDeleteConfirmModal = false;
				dispatch('project-deleted', { projectId: selectedProject.id });
				dispatch('refresh');
			} else {
				alert(result.message || '프로젝트 삭제에 실패했습니다.');
			}
		} catch (error) {
			console.error('프로젝트 삭제 실패:', error);
			alert('프로젝트 삭제 중 오류가 발생했습니다.');
		} finally {
			isDeleting = false;
		}
	}

	// 월간금액 자동 계산 (참여기간 내 계약 정보 기반)
	async function calculateMonthlyAmount(employeeId: string, participationRate: number | string, startDate?: string, endDate?: string): Promise<number> {
		console.log('calculateMonthlyAmount 호출:', { employeeId, participationRate, startDate, endDate, type: typeof participationRate });
		
		// participationRate를 숫자로 변환
		const rate = typeof participationRate === 'string' ? parseFloat(participationRate) : participationRate;
		
		if (!employeeId || !rate || isNaN(rate)) {
			console.log('employeeId 또는 participationRate가 없거나 유효하지 않음:', { employeeId, rate });
			return 0;
		}

		// 참여기간이 없으면 기본값 사용
		if (!startDate || !endDate) {
			console.log('참여기간이 설정되지 않음');
			return 0;
		}
		
		try {
			// 참여기간 내의 계약 정보 조회
			const response = await fetch(`/api/project-management/employees/${employeeId}/contract?startDate=${startDate}&endDate=${endDate}`);
			if (!response.ok) {
				console.log('계약 정보 조회 실패:', response.status);
				return 0;
			}
			
			const contractData = await response.json();
			console.log('계약 정보:', contractData);
			
			if (!contractData.success || !contractData.data) {
				console.log('계약 정보가 없음:', contractData.message);
				if (contractData.debug) {
					console.log('디버그 정보:', contractData.debug);
				}
				return 0;
			}
			
			const contract = contractData.data;
			const annualSalary = parseFloat(contract.annual_salary) || 0;
			console.log('계약 연봉 (원본):', contract.annual_salary);
			console.log('계약 연봉 (변환):', annualSalary);
			
			if (annualSalary === 0) {
				console.log('연봉이 0원임');
				return 0;
			}
			
			// 글로벌 팩터에서 급여 배수 가져오기 (기본값 1.15)
			const salaryMultiplier = 1.15; // TODO: 글로벌 팩터에서 가져오기
			
			// 연봉 * 급여 배수 * 참여율 / 12개월
			const monthlyAmount = (annualSalary * salaryMultiplier * rate / 100) / 12;
			console.log('계산된 월간금액:', monthlyAmount);
			
			return Math.round(monthlyAmount);
		} catch (error) {
			console.error('월간금액 계산 중 오류:', error);
			return 0;
		}
	}

	// 월간금액 계산 및 업데이트
	async function updateMonthlyAmount() {
		if (!memberForm.employeeId || !memberForm.participationRate || !memberForm.startDate || !memberForm.endDate) {
			calculatedMonthlyAmount = 0;
			return;
		}

		isCalculatingMonthlyAmount = true;
		try {
			const amount = await calculateMonthlyAmount(
				memberForm.employeeId, 
				memberForm.participationRate, 
				memberForm.startDate, 
				memberForm.endDate
			);
			calculatedMonthlyAmount = amount;
		} catch (error) {
			console.error('월간금액 계산 실패:', error);
			calculatedMonthlyAmount = 0;
		} finally {
			isCalculatingMonthlyAmount = false;
		}
	}

	// 증빙 내역 모달 표시
	function openEvidenceModal(budget) {
		selectedBudgetForEvidence = budget;
		showEvidenceModal = true;
		loadEvidenceList(budget.id);
	}

	// 증빙 내역 목록 로드
	async function loadEvidenceList(budgetId) {
		try {
			const response = await fetch(`/api/project-management/budget-evidence?projectBudgetId=${budgetId}`);
			if (response.ok) {
				const data = await response.json();
				evidenceList = data.data || [];
			}
		} catch (error) {
			console.error('증빙 내역 로드 실패:', error);
		}
	}

	// 증빙 유형 목록 로드
	async function loadEvidenceTypes() {
		try {
			const response = await fetch('/api/project-management/evidence-types');
			if (response.ok) {
				const data = await response.json();
				evidenceTypes = data.data || [];
			}
		} catch (error) {
			console.error('증빙 유형 로드 실패:', error);
		}
	}

	// 상태별 색상 반환
	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'success';
			case 'planning': return 'warning';
			case 'completed': return 'info';
			case 'cancelled': return 'error';
			case 'suspended': return 'secondary';
			default: return 'default';
		}
	}

	// 상태별 텍스트 반환
	function getStatusText(status: string) {
		switch (status) {
			case 'active': return '진행중';
			case 'planning': return '계획중';
			case 'completed': return '완료';
			case 'cancelled': return '취소';
			case 'suspended': return '중단';
			default: return status;
		}
	}

	// 우선순위별 색상 반환
	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'critical': return 'error';
			case 'high': return 'warning';
			case 'medium': return 'info';
			case 'low': return 'secondary';
			default: return 'default';
		}
	}

	// 우선순위별 텍스트 반환
	function getPriorityText(priority: string) {
		switch (priority) {
			case 'critical': return '긴급';
			case 'high': return '높음';
			case 'medium': return '보통';
			case 'low': return '낮음';
			default: return priority;
		}
	}

	// 스폰서 유형별 텍스트 반환
	function getSponsorTypeText(sponsorType: string) {
		switch (sponsorType) {
			case 'government': return '정부';
			case 'private': return '민간';
			case 'internal': return '내부';
			default: return sponsorType;
		}
	}

	// 연구 유형별 텍스트 반환
	function getResearchTypeText(researchType: string) {
		switch (researchType) {
			case 'basic': return '기초연구';
			case 'applied': return '응용연구';
			case 'development': return '개발연구';
			default: return researchType;
		}
	}

	// 초기화
	$effect(() => {
		if (selectedProject && selectedProject.id) {
			loadProjectMembers();
			loadProjectBudgets();
			loadBudgetCategories();
			loadAvailableEmployees();
			loadEvidenceTypes();
		}
	});
</script>

{#if selectedProject}
<div class="space-y-6">
	<!-- 프로젝트 기본 정보 -->
	<ThemeCard class="p-6">
		<div class="flex items-start justify-between mb-4">
			<div class="flex-1">
				<h2 class="text-2xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
				<p class="text-gray-600 mb-4">{selectedProject.description || '설명이 없습니다.'}</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div class="flex items-center text-sm text-gray-600">
						<FileTextIcon size={16} class="mr-2" />
						<span>코드: {selectedProject.code}</span>
					</div>
					<div class="flex items-center text-sm text-gray-600">
						<BuildingIcon size={16} class="mr-2" />
						<span>{getSponsorTypeText(selectedProject.sponsorType)}</span>
					</div>
					<div class="flex items-center text-sm text-gray-600">
						<TargetIcon size={16} class="mr-2" />
						<span>{getResearchTypeText(selectedProject.researchType)}</span>
					</div>
					<div class="flex items-center text-sm text-gray-600">
						<CalendarIcon size={16} class="mr-2" />
						<span>{formatDate(selectedProject.startDate)} ~ {formatDate(selectedProject.endDate)}</span>
					</div>
				</div>
			</div>
			
			<div class="flex flex-col items-end space-y-2">
				<div class="flex items-center space-x-2">
					<ThemeBadge variant={getStatusColor(selectedProject.status)} size="md">
						{getStatusText(selectedProject.status)}
					</ThemeBadge>
					<ThemeBadge variant={getPriorityColor(selectedProject.priority)} size="md">
						{getPriorityText(selectedProject.priority)}
					</ThemeBadge>
				</div>
				<div class="flex items-center space-x-2">
					<ThemeButton 
						variant="ghost" 
						size="sm" 
						onclick={() => showEditProjectModal = true}
					>
						<EditIcon size={16} class="mr-1" />
						수정
					</ThemeButton>
					<ThemeButton 
						variant="destructive" 
						size="sm" 
						onclick={() => showDeleteConfirmModal = true}
					>
						<TrashIcon size={16} class="mr-1" />
						삭제
					</ThemeButton>
				</div>
			</div>
		</div>
	</ThemeCard>

	<!-- 프로젝트 멤버 관리 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">참여 연구원</h3>
			<ThemeButton onclick={() => addingMember = true} size="sm" disabled={addingMember}>
				<PlusIcon size={16} class="mr-2" />
				연구원 추가
			</ThemeButton>
		</div>
		
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">연구원</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">역할</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">참여율</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">월간금액</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">참여기간</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">기여 유형</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">액션</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					<!-- 인라인 추가 행 -->
					{#if addingMember}
						<tr class="bg-blue-50">
							<!-- 연구원 -->
							<td class="px-4 py-4 whitespace-nowrap">
								{#if editingMember}
									<div class="text-sm text-gray-500">
										{processKoreanName(memberForm.employeeId ? availableEmployees.find(e => e.id === memberForm.employeeId)?.name || '' : '')}
									</div>
								{:else}
									<select
										bind:value={memberForm.employeeId}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
										onchange={updateMonthlyAmount}
									>
										<option value="">연구원 선택 ({availableEmployees.length}명)</option>
										{#each availableEmployees as employee}
											<option value={employee.id}>{processKoreanName(employee.name)} ({employee.department})</option>
										{/each}
									</select>
								{/if}
							</td>
							<!-- 역할 -->
							<td class="px-4 py-4 whitespace-nowrap">
								<select
									bind:value={memberForm.role}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								>
									<option value="researcher">연구원</option>
									<option value="lead">연구책임자</option>
									<option value="support">지원</option>
								</select>
							</td>
							<!-- 참여율 -->
							<td class="px-4 py-4 whitespace-nowrap">
								<input
									type="number"
									bind:value={memberForm.participationRate}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
									min="0"
									max="100"
									step="1"
									placeholder="100"
									oninput={(e) => {
										const value = parseInt(e.target.value);
										if (value < 0) memberForm.participationRate = 0;
										if (value > 100) memberForm.participationRate = 100;
										updateMonthlyAmount();
									}}
								/>
							</td>
							<!-- 월간금액 (자동 계산) -->
							<td class="px-4 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{#if isCalculatingMonthlyAmount}
										<div class="flex items-center">
											<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
											계산 중...
										</div>
									{:else if calculatedMonthlyAmount > 0}
										{formatCurrency(calculatedMonthlyAmount)}
									{:else if memberForm.employeeId && memberForm.participationRate && memberForm.startDate && memberForm.endDate}
										<span class="text-gray-500">계산 가능</span>
									{:else}
										<span class="text-gray-400">자동 계산</span>
									{/if}
								</div>
							</td>
							<!-- 참여기간 (시작일/종료일) -->
							<td class="px-4 py-4 whitespace-nowrap">
								<div class="space-y-2">
									<div class="text-xs text-gray-500">시작일</div>
									<input
										type="date"
										bind:value={memberForm.startDate}
										class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="시작일"
										onchange={updateMonthlyAmount}
									/>
									<div class="text-xs text-gray-500">종료일</div>
									<input
										type="date"
										bind:value={memberForm.endDate}
										class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
										placeholder="종료일"
										onchange={updateMonthlyAmount}
									/>
								</div>
							</td>
							<!-- 기여 유형 -->
							<td class="px-4 py-4 whitespace-nowrap">
								<select
									bind:value={memberForm.contributionType}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
								>
									<option value="cash">현금</option>
									<option value="in_kind">현물</option>
								</select>
							</td>
							<!-- 액션 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex space-x-2">
									{#if editingMember}
										<ThemeButton variant="ghost" size="sm" onclick={updateMember}>
											<CheckIcon size={14} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm" onclick={cancelEditMember}>
											<XIcon size={14} />
										</ThemeButton>
									{:else}
										<ThemeButton variant="ghost" size="sm" onclick={addMember}>
											<CheckIcon size={14} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm" onclick={cancelAddMember}>
											<XIcon size={14} />
										</ThemeButton>
									{/if}
								</div>
							</td>
						</tr>
					{/if}
					
					{#each projectMembers as member}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<UserIcon size={20} class="text-gray-400 mr-3" />
									<div>
										<div class="text-sm font-medium text-gray-900">{processKoreanName(member.employee_name)}</div>
										<div class="text-xs text-gray-500">{member.employee_department} / {member.employee_position}</div>
									</div>
								</div>
							</td>
							<td class="px-4 py-4 whitespace-nowrap">
								<ThemeBadge variant="info" size="sm">{member.role}</ThemeBadge>
							</td>
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								{member.participation_rate}%
							</td>
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								{formatCurrency(member.monthly_amount || 0)}
							</td>
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-gray-500">시작: {formatDate(member.start_date)}</div>
									<div class="text-xs text-gray-500">종료: {formatDate(member.end_date)}</div>
								</div>
							</td>
							<td class="px-4 py-4 whitespace-nowrap">
								<ThemeBadge variant={member.contribution_type === 'cash' ? 'success' : 'warning'} size="sm">
									{member.contribution_type === 'cash' ? '현금' : '현물'}
								</ThemeBadge>
							</td>
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex space-x-2">
									<ThemeButton variant="ghost" size="sm" onclick={() => editMember(member)}>
										<EditIcon size={14} />
									</ThemeButton>
									<ThemeButton variant="ghost" size="sm" onclick={() => removeMember(member.id)}>
										<TrashIcon size={14} />
									</ThemeButton>
								</div>
							</td>
						</tr>
					{/each}
					
					{#if projectMembers.length === 0 && !addingMember}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-gray-500">
								<UsersIcon size={48} class="mx-auto mb-2 text-gray-300" />
								<p>참여 연구원이 없습니다.</p>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
		
		<!-- 인건비 요약 -->
		{#if projectMembers.length > 0}
			<div class="mt-4 p-4 bg-gray-50 rounded-lg">
				<h4 class="text-sm font-medium text-gray-700 mb-3">인건비 요약</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{formatCurrency(projectMembers.filter(m => m.contribution_type === 'cash').reduce((sum, m) => sum + (m.monthly_amount || 0), 0))}
						</div>
						<div class="text-sm text-gray-500">현금 인건비</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-orange-600">
							{formatCurrency(projectMembers.filter(m => m.contribution_type === 'in_kind').reduce((sum, m) => sum + (m.monthly_amount || 0), 0))}
						</div>
						<div class="text-sm text-gray-500">현물 인건비</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">
							{formatCurrency(projectMembers.reduce((sum, m) => sum + (m.monthly_amount || 0), 0))}
						</div>
						<div class="text-sm text-gray-500">총 인건비</div>
					</div>
				</div>
			</div>
		{/if}
	</ThemeCard>

	<!-- 연차별 사업비 관리 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">연차별 사업비 (국가연구개발비 기준)</h3>
			<ThemeButton onclick={() => showBudgetModal = true} size="sm">
				<PlusIcon size={16} class="mr-2" />
				사업비 추가
			</ThemeButton>
		</div>
		
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">연차</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">인건비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">연구재료비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">연구활동비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">간접비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">총 예산</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">실행액</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">사용율</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">증빙 내역</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">액션</th>
					</tr>
					<tr>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">현금/현물</th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">현금/현물</th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">현금/현물</th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">현금/현물</th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">현금/현물</th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
						<th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each projectBudgets as budget}
						{@const totalBudget = (budget.personnel_cost_cash || 0) + (budget.personnel_cost_in_kind || 0) + 
											(budget.research_material_cost_cash || 0) + (budget.research_material_cost_in_kind || 0) + 
											(budget.research_activity_cost_cash || 0) + (budget.research_activity_cost_in_kind || 0) + 
											(budget.indirect_cost_cash || 0) + (budget.indirect_cost_in_kind || 0)}
						{@const spentAmount = budget.spent_amount || 0}
						{@const usageRate = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0}
						{@const cashTotal = (budget.personnel_cost_cash || 0) + (budget.research_material_cost_cash || 0) + (budget.research_activity_cost_cash || 0) + (budget.indirect_cost_cash || 0)}
						{@const inKindTotal = (budget.personnel_cost_in_kind || 0) + (budget.research_material_cost_in_kind || 0) + (budget.research_activity_cost_in_kind || 0) + (budget.indirect_cost_in_kind || 0)}
						<tr class="hover:bg-gray-50">
							<!-- 연차 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{budget.fiscal_year}년
							</td>
							<!-- 인건비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(budget.personnel_cost_cash || 0)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(budget.personnel_cost_in_kind || 0)}</div>
								</div>
							</td>
							<!-- 연구재료비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(budget.research_material_cost_cash || 0)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(budget.research_material_cost_in_kind || 0)}</div>
								</div>
							</td>
							<!-- 연구활동비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(budget.research_activity_cost_cash || 0)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(budget.research_activity_cost_in_kind || 0)}</div>
								</div>
							</td>
							<!-- 간접비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(budget.indirect_cost_cash || 0)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(budget.indirect_cost_in_kind || 0)}</div>
								</div>
							</td>
							<!-- 총 예산 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600 font-semibold">현금: {formatCurrency(cashTotal)}</div>
									<div class="text-xs text-green-600 font-semibold">현물: {formatCurrency(inKindTotal)}</div>
								</div>
							</td>
							<!-- 실행액 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								{formatCurrency(budget.spent_amount || 0)}
							</td>
							<!-- 사용율 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="flex items-center">
									<div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
										<div class="bg-blue-600 h-2 rounded-full" style="width: {Math.min(usageRate, 100)}%"></div>
									</div>
									<span class="text-xs text-gray-600">{usageRate.toFixed(1)}%</span>
								</div>
							</td>
							<!-- 증빙 내역 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<ThemeButton variant="ghost" size="sm" onclick={() => openEvidenceModal(budget)}>
									<FileTextIcon size={14} class="mr-1" />
									증빙 관리
								</ThemeButton>
							</td>
							<!-- 액션 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex space-x-2">
									<ThemeButton variant="ghost" size="sm" onclick={() => editBudget(budget)}>
										<EditIcon size={14} />
									</ThemeButton>
									<ThemeButton variant="ghost" size="sm" onclick={() => removeBudget(budget.id)}>
										<TrashIcon size={14} />
									</ThemeButton>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="10" class="px-6 py-12 text-center text-gray-500">
								<DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
								<p>등록된 사업비가 없습니다.</p>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</ThemeCard>
</div>

<!-- 사업비 추가/편집 모달 -->
<ThemeModal
	open={showBudgetModal}
	onclose={() => {
		showBudgetModal = false;
		editingBudget = null;
		budgetForm = {
			fiscalYear: new Date().getFullYear(),
			contributionType: 'cash',
			personnelCostCash: '',
			researchMaterialCostCash: '',
			researchActivityCostCash: '',
			indirectCostCash: '',
			personnelCostInKind: '',
			researchMaterialCostInKind: '',
			researchActivityCostInKind: '',
			indirectCostInKind: '',
			actualAmount: ''
		};
	}}
	title={editingBudget ? "사업비 편집" : "사업비 추가"}
	size="lg"
>
	<div class="space-y-6">
		<!-- 기본 정보 -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="pm-budget-fiscal-year" class="block text-sm font-medium text-gray-700 mb-1">연차 *</label>
				<input
					id="pm-budget-fiscal-year"
					type="number"
					bind:value={budgetForm.fiscalYear}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					min="2020"
					max="2030"
				/>
			</div>
			<div>
				<label for="pm-budget-actual-amount" class="block text-sm font-medium text-gray-700 mb-1">실행 금액</label>
				<input
					id="pm-budget-actual-amount"
					type="number"
					bind:value={budgetForm.actualAmount}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0"
				/>
			</div>
		</div>

		<!-- 직접비 -->
		<div class="space-y-4">
			<h4 class="text-lg font-medium text-gray-900">직접비</h4>
			
			<!-- 인건비 -->
			<div class="space-y-2">
				<div class="block text-sm font-medium text-gray-700">인건비</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="pm-budget-personnel-cash" class="block text-xs text-gray-500 mb-1">현금</label>
						<input
							id="pm-budget-personnel-cash"
							type="number"
							bind:value={budgetForm.personnelCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-personnel-in-kind" class="block text-xs text-gray-500 mb-1">현물</label>
						<input
							id="pm-budget-personnel-in-kind"
							type="number"
							bind:value={budgetForm.personnelCostInKind}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
				</div>
			</div>

			<!-- 연구재료비 -->
			<div class="space-y-2">
				<div class="block text-sm font-medium text-gray-700">연구재료비</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="pm-budget-research-material-cash" class="block text-xs text-gray-500 mb-1">현금</label>
						<input
							id="pm-budget-research-material-cash"
							type="number"
							bind:value={budgetForm.researchMaterialCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-research-material-in-kind" class="block text-xs text-gray-500 mb-1">현물</label>
						<input
							id="pm-budget-research-material-in-kind"
							type="number"
							bind:value={budgetForm.researchMaterialCostInKind}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
				</div>
			</div>

			<!-- 연구활동비 -->
			<div class="space-y-2">
				<div class="block text-sm font-medium text-gray-700">연구활동비</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="pm-budget-research-activity-cash" class="block text-xs text-gray-500 mb-1">현금</label>
						<input
							id="pm-budget-research-activity-cash"
							type="number"
							bind:value={budgetForm.researchActivityCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-research-activity-in-kind" class="block text-xs text-gray-500 mb-1">현물</label>
						<input
							id="pm-budget-research-activity-in-kind"
							type="number"
							bind:value={budgetForm.researchActivityCostInKind}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- 간접비 -->
		<div class="space-y-4">
			<h4 class="text-lg font-medium text-gray-900">간접비</h4>
			<div class="space-y-2">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="pm-budget-indirect-cash" class="block text-xs text-gray-500 mb-1">현금</label>
						<input
							id="pm-budget-indirect-cash"
							type="number"
							bind:value={budgetForm.indirectCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-indirect-in-kind" class="block text-xs text-gray-500 mb-1">현물</label>
						<input
							id="pm-budget-indirect-in-kind"
							type="number"
							bind:value={budgetForm.indirectCostInKind}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="flex justify-end space-x-3 mt-6">
		<ThemeButton variant="ghost" onclick={() => {
			showBudgetModal = false;
			editingBudget = null;
			budgetForm = {
				fiscalYear: new Date().getFullYear(),
				contributionType: 'cash',
				personnelCostCash: '',
				researchMaterialCostCash: '',
				researchActivityCostCash: '',
				indirectCostCash: '',
				personnelCostInKind: '',
				researchMaterialCostInKind: '',
				researchActivityCostInKind: '',
				indirectCostInKind: '',
				actualAmount: ''
			};
		}}>
			취소
		</ThemeButton>
		<ThemeButton onclick={editingBudget ? updateBudget : addBudget}>
			{editingBudget ? '수정' : '추가'}
		</ThemeButton>
	</div>
</ThemeModal>

<!-- 프로젝트 삭제 확인 모달 -->
{#if showDeleteConfirmModal}
<ThemeModal open={showDeleteConfirmModal} onclose={() => showDeleteConfirmModal = false}>
	<div class="p-6">
		<div class="flex items-center mb-4">
			<AlertTriangleIcon class="h-6 w-6 text-red-500 mr-3" />
			<h3 class="text-lg font-medium text-gray-900">프로젝트 삭제 확인</h3>
		</div>
		
		<div class="mb-6">
			<p class="text-sm text-gray-600 mb-4">
				다음 프로젝트를 완전히 삭제하시겠습니까?
			</p>
			<div class="bg-gray-50 p-4 rounded-lg">
				<p class="font-medium text-gray-900">{selectedProject?.title}</p>
				<p class="text-sm text-gray-600">코드: {selectedProject?.code}</p>
			</div>
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-sm text-red-800 font-medium mb-2">⚠️ 삭제될 데이터:</p>
				<ul class="text-sm text-red-700 space-y-1">
					<li>• 참여연구원 정보 ({projectMembers.length}명)</li>
					<li>• 프로젝트 사업비 정보 ({projectBudgets.length}개 연차)</li>
					<li>• 참여율 이력 데이터</li>
					<li>• 프로젝트 마일스톤</li>
					<li>• 프로젝트 위험 요소</li>
				</ul>
				<p class="text-sm text-red-800 font-medium mt-3">
					이 작업은 되돌릴 수 없습니다.
				</p>
			</div>
		</div>

		<div class="flex justify-end space-x-3">
			<ThemeButton 
				variant="ghost" 
				onclick={() => showDeleteConfirmModal = false}
				disabled={isDeleting}
			>
				취소
			</ThemeButton>
			<ThemeButton 
				variant="destructive" 
				onclick={deleteProject}
				disabled={isDeleting}
			>
				{#if isDeleting}
					삭제 중...
				{:else}
					삭제
				{/if}
			</ThemeButton>
		</div>
	</div>
</ThemeModal>
{/if}

{/if}
