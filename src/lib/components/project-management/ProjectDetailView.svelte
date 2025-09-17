<script lang="ts">
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
	import { formatCurrency, formatDate } from '$lib/utils/format'
	import { processKoreanName } from '$lib/utils/korean-name'
	import {
		AlertTriangleIcon,
		CalendarIcon,
		CheckIcon,
		ChevronDownIcon,
		ChevronUpIcon,
		DollarSignIcon,
		EditIcon,
		FileTextIcon,
		PlusIcon,
		TrashIcon,
		UserIcon,
		UsersIcon,
		XIcon
	} from '@lucide/svelte'
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher();

	let { selectedProject }: { selectedProject: any } = $props();

	// 모달 상태
	let showBudgetModal = $state(false);
	let showMemberModal = $state(false);
	let showEditProjectModal = $state(false);
	let showDeleteConfirmModal = $state(false);
	let isUpdating = $state(false);
	let editingBudget = $state<any>(null);
	let editingMember = $state<any>(null);
	let addingMember = $state(false);
	let isDeleting = $state(false);
	let deleteConfirmationCode = $state('');

	// 폼 데이터
	let budgetForm = $state({
		periodNumber: 1, // 연차 번호 (1연차, 2연차, ...)
		startDate: '', // 연차 시작일
		endDate: '', // 연차 종료일
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

	let projectForm = $state({
		title: '',
		code: '',
		description: '',
		startDate: '',
		endDate: '',
		status: 'active',
		sponsorType: 'internal',
		priority: 'medium',
		researchType: 'applied'
	});

	let memberForm = $state({
		employeeId: '',
		role: 'researcher',
		startDate: '',
		endDate: '',
		participationRate: 100, // 기본 참여율 100%
		monthlyAmount: '0', // 월간 금액
		contributionType: 'cash' // 'cash' or 'in_kind'
	});

	let calculatedMonthlyAmount = $state(0);
	let isCalculatingMonthlyAmount = $state(false);
	let isPersonnelSummaryExpanded = $state(false);

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
		// 필수 필드 검증
		if (!budgetForm.startDate || !budgetForm.endDate) {
			alert('연차 기간(시작일, 종료일)을 모두 입력해주세요.');
			return;
		}

		// 시작일이 종료일보다 늦은지 검증
		if (new Date(budgetForm.startDate) >= new Date(budgetForm.endDate)) {
			alert('시작일은 종료일보다 빨라야 합니다.');
			return;
		}

		try {
			// 시작일의 연도를 fiscal_year로 사용
			const fiscalYear = new Date(budgetForm.startDate).getFullYear();
			
			const response = await fetch('/api/project-management/project-budgets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId: selectedProject.id,
					fiscalYear: fiscalYear,
					periodNumber: budgetForm.periodNumber,
					startDate: budgetForm.startDate,
					endDate: budgetForm.endDate,
					contributionType: budgetForm.contributionType,
					// 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
					personnelCostCash: adjustPersonnelCost(fromThousands(budgetForm.personnelCostCash)),
					researchMaterialCostCash: fromThousands(budgetForm.researchMaterialCostCash),
					researchActivityCostCash: fromThousands(budgetForm.researchActivityCostCash),
					indirectCostCash: fromThousands(budgetForm.indirectCostCash),
					// 현물 비목들 (천원 단위를 원 단위로 변환)
					personnelCostInKind: fromThousands(budgetForm.personnelCostInKind),
					researchMaterialCostInKind: fromThousands(budgetForm.researchMaterialCostInKind),
					researchActivityCostInKind: fromThousands(budgetForm.researchActivityCostInKind),
					indirectCostInKind: fromThousands(budgetForm.indirectCostInKind),
					spentAmount: fromThousands(budgetForm.actualAmount)
				})
			});

			if (response.ok) {
				const result = await response.json();
				showBudgetModal = false;
				budgetForm = {
					periodNumber: 1,
					startDate: '',
					endDate: '',
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
				
				// 성공 메시지 표시
				if (result.message) {
					alert(result.message);
				}
			} else {
				const errorData = await response.json();
				alert(errorData.message || '사업비 추가에 실패했습니다.');
			}
		} catch (error) {
			console.error('사업비 추가 실패:', error);
			alert('사업비 추가 중 오류가 발생했습니다.');
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
				resetMemberForm();
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
		resetMemberForm();
	}

	// 멤버 수정 시작
	function editMember(member: any) {
		editingMember = member;
		
		// 날짜 형식 변환 (YYYY-MM-DD 형식으로)
		const formatDateForInput = (dateStr: string) => {
			if (!dateStr) return '';
			// 이미 YYYY-MM-DD 형식이면 그대로 반환
			if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
			// Date 객체로 변환 후 YYYY-MM-DD 형식으로 반환
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return '';
			return date.toISOString().split('T')[0];
		};
		
		memberForm = {
			employeeId: member.employee_id,
			role: member.role,
			startDate: formatDateForInput(member.start_date),
			endDate: formatDateForInput(member.end_date),
			participationRate: member.participation_rate.toString(),
			monthlyAmount: member.monthly_amount?.toString() || '0',
			contributionType: member.contribution_type
		};
		
		// 수정 시 월간금액 자동 계산
		updateMonthlyAmount();
	}

	// 멤버 폼 초기화
	function resetMemberForm() {
		memberForm = {
			employeeId: '',
			role: 'researcher',
			startDate: '',
			endDate: '',
			participationRate: 100,
			monthlyAmount: '0',
			contributionType: 'cash'
		};
		calculatedMonthlyAmount = 0;
	}

	// 멤버 수정 취소
	function cancelEditMember() {
		editingMember = null;
		resetMemberForm();
	}

	// 멤버 수정 완료
	async function updateMember() {
		if (!editingMember) return;

		// 참여율 검증
		if (memberForm.participationRate < 0 || memberForm.participationRate > 100) {
			alert('참여율은 0-100 사이의 값이어야 합니다.');
			return;
		}

		// 필수 필드 검증
		if (!memberForm.startDate || !memberForm.endDate) {
			alert('참여기간(시작일, 종료일)을 모두 입력해주세요.');
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
				const result = await response.json();
				editingMember = null;
				addingMember = false;
				resetMemberForm();
				await loadProjectMembers();
				dispatch('refresh');
				
				// 성공 메시지 표시
				if (result.message) {
					alert(result.message);
				}
			} else {
				const errorData = await response.json();
				alert(errorData.message || '연구원 정보 수정에 실패했습니다.');
			}
		} catch (error) {
			console.error('멤버 수정 실패:', error);
			alert('연구원 정보 수정 중 오류가 발생했습니다.');
		}
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
		
		// 날짜 형식 변환 (YYYY-MM-DD 형식으로)
		const formatDateForInput = (dateStr: string) => {
			if (!dateStr) return '';
			// 이미 YYYY-MM-DD 형식이면 그대로 반환
			if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
			// Date 객체로 변환 후 YYYY-MM-DD 형식으로 반환
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return '';
			return date.toISOString().split('T')[0];
		};
		
		budgetForm = {
			periodNumber: budget.period_number || 1,
			startDate: formatDateForInput(budget.start_date),
			endDate: formatDateForInput(budget.end_date),
			contributionType: budget.contribution_type || 'cash',
			// 현금 비목들 (천원 단위로 변환, 인건비는 조정된 값 표시)
			personnelCostCash: toThousands(budget.personnel_cost_cash || 0),
			researchMaterialCostCash: toThousands(budget.research_material_cost_cash || 0),
			researchActivityCostCash: toThousands(budget.research_activity_cost_cash || 0),
			indirectCostCash: toThousands(budget.indirect_cost_cash || 0),
			// 현물 비목들 (천원 단위로 변환)
			personnelCostInKind: toThousands(budget.personnel_cost_in_kind || 0),
			researchMaterialCostInKind: toThousands(budget.research_material_cost_in_kind || 0),
			researchActivityCostInKind: toThousands(budget.research_activity_cost_in_kind || 0),
			indirectCostInKind: toThousands(budget.indirect_cost_in_kind || 0),
			actualAmount: toThousands(budget.spent_amount || 0)
		};
		showBudgetModal = true;
	}

	// 사업비 업데이트
	async function updateBudget() {
		if (!editingBudget) return;

		// 필수 필드 검증
		if (!budgetForm.startDate || !budgetForm.endDate) {
			alert('연차 기간(시작일, 종료일)을 모두 입력해주세요.');
			return;
		}

		// 시작일이 종료일보다 늦은지 검증
		if (new Date(budgetForm.startDate) >= new Date(budgetForm.endDate)) {
			alert('시작일은 종료일보다 빨라야 합니다.');
			return;
		}

		try {
			// 시작일의 연도를 fiscal_year로 사용
			const fiscalYear = new Date(budgetForm.startDate).getFullYear();
			
			const response = await fetch(`/api/project-management/project-budgets/${editingBudget.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fiscalYear: fiscalYear,
					periodNumber: budgetForm.periodNumber,
					startDate: budgetForm.startDate,
					endDate: budgetForm.endDate,
					contributionType: budgetForm.contributionType,
					// 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
					personnelCostCash: adjustPersonnelCost(fromThousands(budgetForm.personnelCostCash)),
					researchMaterialCostCash: fromThousands(budgetForm.researchMaterialCostCash),
					researchActivityCostCash: fromThousands(budgetForm.researchActivityCostCash),
					indirectCostCash: fromThousands(budgetForm.indirectCostCash),
					// 현물 비목들 (천원 단위를 원 단위로 변환)
					personnelCostInKind: fromThousands(budgetForm.personnelCostInKind),
					researchMaterialCostInKind: fromThousands(budgetForm.researchMaterialCostInKind),
					researchActivityCostInKind: fromThousands(budgetForm.researchActivityCostInKind),
					indirectCostInKind: fromThousands(budgetForm.indirectCostInKind),
					spentAmount: fromThousands(budgetForm.actualAmount)
				})
			});

			if (response.ok) {
				const result = await response.json();
				showBudgetModal = false;
				editingBudget = null;
				budgetForm = {
					periodNumber: 1,
					startDate: '',
					endDate: '',
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
				
				// 성공 메시지 표시
				if (result.message) {
					alert(result.message);
				}
			} else {
				const errorData = await response.json();
				alert(errorData.message || '사업비 수정에 실패했습니다.');
			}
		} catch (error) {
			console.error('사업비 업데이트 실패:', error);
			alert('사업비 수정 중 오류가 발생했습니다.');
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

	// 프로젝트 수정 폼 초기화
	function initProjectForm() {
		if (selectedProject) {
			// 날짜 형식 변환 (ISO 문자열을 YYYY-MM-DD 형식으로)
			const formatDateForInput = (dateString: string) => {
				if (!dateString) return '';
				const date = new Date(dateString);
				return date.toISOString().split('T')[0];
			};

			projectForm = {
				title: selectedProject.title || '',
				code: selectedProject.code || '',
				description: selectedProject.description || '',
				startDate: formatDateForInput(selectedProject.start_date || selectedProject.startDate || ''),
				endDate: formatDateForInput(selectedProject.end_date || selectedProject.endDate || ''),
				status: selectedProject.status || 'active',
				sponsorType: selectedProject.sponsor_type || selectedProject.sponsorType || 'internal',
				priority: selectedProject.priority || 'medium',
				researchType: selectedProject.research_type || selectedProject.researchType || 'applied'
			};
		}
	}

	// 프로젝트 수정
	async function updateProject() {
		if (!selectedProject) return;
		
		isUpdating = true;
		try {
			const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(projectForm)
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
				// 프로젝트 정보 업데이트
				selectedProject = { ...selectedProject, ...result.data };
				showEditProjectModal = false;
				
				// 부모 컴포넌트에 프로젝트 업데이트 이벤트 전송
				dispatch('project-updated', { 
					projectId: selectedProject.id, 
					updatedProject: result.data 
				});
				
				alert('프로젝트가 성공적으로 수정되었습니다.');
			} else {
				alert(result.message || '프로젝트 수정에 실패했습니다.');
			}
		} catch (error) {
			console.error('프로젝트 수정 실패:', error);
			alert('프로젝트 수정 중 오류가 발생했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	// 삭제 확인 코드 검증
	function isDeleteCodeValid(): boolean {
		return deleteConfirmationCode === selectedProject?.code;
	}

	// 프로젝트 삭제
	async function deleteProject() {
		if (!selectedProject) return;
		
		// 삭제 확인 코드 검증
		if (!isDeleteCodeValid()) {
			alert('프로젝트 코드가 일치하지 않습니다. 정확한 코드를 입력해주세요.');
			return;
		}
		
		isDeleting = true;
		try {
			const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok && result.success) {
				showDeleteConfirmModal = false;
				deleteConfirmationCode = ''; // 삭제 후 코드 초기화
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
	function getStatusColor(status: string): 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary' | 'ghost' {
		switch (status) {
			case 'active': return 'success';
			case 'planning': return 'warning';
			case 'completed': return 'info';
			case 'cancelled': return 'error';
			case 'suspended': return 'default';
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
	function getPriorityColor(priority: string): 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary' | 'ghost' {
		switch (priority) {
			case 'critical': return 'error';
			case 'high': return 'warning';
			case 'medium': return 'info';
			case 'low': return 'default';
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

	// 연차 기간 계산 (개월 수)
	function calculatePeriodMonths(startDate: string, endDate: string): number {
		if (!startDate || !endDate) return 0;
		
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // 평균 월 일수
		
		return diffMonths;
	}

	// 천원 단위로 변환 (입력용)
	function toThousands(value: string | number): string {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return (num / 1000).toString();
	}

	// 천원 단위에서 원 단위로 변환 (저장용)
	function fromThousands(value: string): number {
		const num = parseFloat(value) || 0;
		return num * 1000;
	}

	// 사용률 계산 함수
	function calculateUsageRate(budgeted: number, spent: number): number {
		if (budgeted <= 0) return 0;
		return Math.min((spent / budgeted) * 100, 100);
	}

	// 사용률에 따른 색상 반환
	function getUsageRateColor(rate: number): string {
		if (rate >= 90) return 'text-red-600 bg-red-100';
		if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
		return 'text-green-600 bg-green-100';
	}

	// 인건비를 100만원 단위로 조정 (12로 나누어 떨어지게)
	function adjustPersonnelCost(amount: number): number {
		// 100만원 단위로 반올림
		const millionWon = Math.floor(amount / 1000000);
		// 12로 나누어 떨어지게 조정
		const adjustedMillionWon = Math.floor(millionWon / 12) * 12;
		return adjustedMillionWon * 1000000;
	}

	// 사업비 합계 계산
	function calculateBudgetTotals() {
		if (!projectBudgets || projectBudgets.length === 0) {
			return {
				personnelCash: 0,
				personnelInKind: 0,
				researchMaterialCash: 0,
				researchMaterialInKind: 0,
				researchActivityCash: 0,
				researchActivityInKind: 0,
				indirectCash: 0,
				indirectInKind: 0,
				totalCash: 0,
				totalInKind: 0,
				totalBudget: 0,
				totalSpent: 0
			};
		}

		const totals = projectBudgets.reduce((acc, budget) => {
			acc.personnelCash += parseFloat(budget.personnel_cost_cash) || 0;
			acc.personnelInKind += parseFloat(budget.personnel_cost_in_kind) || 0;
			acc.researchMaterialCash += parseFloat(budget.research_material_cost_cash) || 0;
			acc.researchMaterialInKind += parseFloat(budget.research_material_cost_in_kind) || 0;
			acc.researchActivityCash += parseFloat(budget.research_activity_cost_cash) || 0;
			acc.researchActivityInKind += parseFloat(budget.research_activity_cost_in_kind) || 0;
			acc.indirectCash += parseFloat(budget.indirect_cost_cash) || 0;
			acc.indirectInKind += parseFloat(budget.indirect_cost_in_kind) || 0;
			acc.totalBudget += parseFloat(budget.total_budget) || 0;
			acc.totalSpent += parseFloat(budget.spent_amount) || 0;
			return acc;
		}, {
			personnelCash: 0,
			personnelInKind: 0,
			researchMaterialCash: 0,
			researchMaterialInKind: 0,
			researchActivityCash: 0,
			researchActivityInKind: 0,
			indirectCash: 0,
			indirectInKind: 0,
			totalBudget: 0,
			totalSpent: 0
		});

		totals.totalCash = totals.personnelCash + totals.researchMaterialCash + totals.researchActivityCash + totals.indirectCash;
		totals.totalInKind = totals.personnelInKind + totals.researchMaterialInKind + totals.researchActivityInKind + totals.indirectInKind;

		return totals;
	}

	// 인건비 요약 계산 (해당 연차의 인건비 합계 및 월별 상세)
	function calculatePersonnelCostSummary() {
		if (!projectMembers || projectMembers.length === 0 || !projectBudgets || projectBudgets.length === 0) {
			return {
				totalCash: 0,
				totalInKind: 0,
				totalCost: 0,
				monthlyCosts: [],
				periodInfo: null
			};
		}

		// 현재 연차의 첫 번째 사업비 정보를 기준으로 기간 설정
		const currentBudget = projectBudgets[0];
		if (!currentBudget.start_date || !currentBudget.end_date) {
			return {
				totalCash: 0,
				totalInKind: 0,
				totalCost: 0,
				monthlyCosts: [],
				periodInfo: null
			};
		}

		const startDate = new Date(currentBudget.start_date);
		const endDate = new Date(currentBudget.end_date);
		
		let totalCash = 0;
		let totalInKind = 0;
		const monthlyCosts = [];
		
		// 월별 데이터 생성
		const currentDate = new Date(startDate);
		let monthIndex = 1;
		
		while (currentDate <= endDate) {
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth() + 1;
			const monthName = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
			
			let monthlyCash = 0;
			let monthlyInKind = 0;
			
			// 각 멤버의 해당 월 인건비 계산
			projectMembers.forEach(member => {
				const memberStartDate = new Date(member.start_date);
				const memberEndDate = new Date(member.end_date);
				const monthStart = new Date(year, month - 1, 1);
				const monthEnd = new Date(year, month, 0); // 해당 월의 마지막 날
				
				// 해당 월에 참여하는지 확인
				if (memberStartDate <= monthEnd && memberEndDate >= monthStart) {
					const memberMonthlyCost = parseFloat(member.monthly_amount) || 0;
					
					if (member.contribution_type === 'cash') {
						monthlyCash += memberMonthlyCost;
					} else {
						monthlyInKind += memberMonthlyCost;
					}
				}
			});
			
			monthlyCosts.push({
				month: monthIndex,
				year: year,
				monthNumber: month,
				monthName: monthName,
				cash: monthlyCash,
				inKind: monthlyInKind,
				total: monthlyCash + monthlyInKind
			});
			
			// 다음 달로 이동
			currentDate.setMonth(currentDate.getMonth() + 1);
			monthIndex++;
		}
		
		// 총합 계산
		totalCash = monthlyCosts.reduce((sum, month) => sum + month.cash, 0);
		totalInKind = monthlyCosts.reduce((sum, month) => sum + month.inKind, 0);
		const totalCost = totalCash + totalInKind;
		
		return {
			totalCash,
			totalInKind,
			totalCost,
			monthlyCosts,
			periodInfo: {
				startDate: currentBudget.start_date,
				endDate: currentBudget.end_date,
				periodNumber: currentBudget.period_number || 1
			}
		};
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
		<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
			<!-- 프로젝트 기본 정보 -->
			<div class="flex-1">
				<!-- 프로젝트 제목과 코드 -->
				<div class="flex items-center gap-3 mb-3">
					<h2 class="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
					<span class="text-sm text-gray-500 font-mono">{selectedProject.code}</span>
				</div>
				
				<!-- 상태 및 우선순위 태그 -->
				<div class="flex items-center gap-2 mb-3">
					<ThemeBadge variant={getStatusColor(selectedProject.status)} size="md">
						{getStatusText(selectedProject.status)}
					</ThemeBadge>
					<ThemeBadge variant={getPriorityColor(selectedProject.priority)} size="md">
						{getPriorityText(selectedProject.priority)}
					</ThemeBadge>
					<ThemeBadge variant="info" size="md">
						{getSponsorTypeText(selectedProject.sponsor_type || selectedProject.sponsorType)}
					</ThemeBadge>
					<ThemeBadge variant="primary" size="md">
						{getResearchTypeText(selectedProject.research_type || selectedProject.researchType)}
					</ThemeBadge>
				</div>
				
				{#if selectedProject.description}
					<p class="text-gray-700 mb-3">{selectedProject.description}</p>
				{/if}
				
				<!-- 프로젝트 기간 -->
				<div class="flex items-center text-sm text-gray-600">
					<CalendarIcon size={16} class="mr-2 text-orange-600" />
					<span>{formatDate(selectedProject.start_date || selectedProject.startDate)} ~ {formatDate(selectedProject.end_date || selectedProject.endDate)}</span>
				</div>
			</div>
			
			<!-- 액션 버튼 -->
			<div class="flex gap-2">
				<ThemeButton 
					variant="ghost" 
					size="sm" 
					onclick={() => {
						initProjectForm();
						showEditProjectModal = true;
					}}
				>
					<EditIcon size={16} class="mr-2" />
					수정
				</ThemeButton>
				<ThemeButton 
					variant="error" 
					size="sm" 
					onclick={() => showDeleteConfirmModal = true}
				>
					<TrashIcon size={16} class="mr-2" />
					삭제
				</ThemeButton>
			</div>
		</div>
	</ThemeCard>

	<!-- 연차별 사업비 관리 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">연구개발비</h3>
			<ThemeButton onclick={() => showBudgetModal = true} size="sm">
				<PlusIcon size={16} class="mr-2" />
				사업비 추가
			</ThemeButton>
		</div>
		
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200" style="min-width: 1200px;">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">연차 기간</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">인건비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">연구재료비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">연구활동비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">간접비</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">총 예산</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">실행액</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">증빙 내역</th>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">액션</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each projectBudgets as budget}
						{@const totalBudget = parseFloat(budget.total_budget) || 0}
						{@const spentAmount = parseFloat(budget.spent_amount) || 0}
						{@const usageRate = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0}
						{@const cashTotal = (parseFloat(budget.personnel_cost_cash) || 0) + (parseFloat(budget.research_material_cost_cash) || 0) + (parseFloat(budget.research_activity_cost_cash) || 0) + (parseFloat(budget.indirect_cost_cash) || 0)}
						{@const inKindTotal = (parseFloat(budget.personnel_cost_in_kind) || 0) + (parseFloat(budget.research_material_cost_in_kind) || 0) + (parseFloat(budget.research_activity_cost_in_kind) || 0) + (parseFloat(budget.indirect_cost_in_kind) || 0)}
						<tr class="hover:bg-gray-50">
							<!-- 연차 기간 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								<div 
									class="text-sm cursor-help" 
									title="기간: {budget.start_date ? formatDate(budget.start_date) : `${budget.fiscal_year}년`} ~ {budget.end_date ? formatDate(budget.end_date) : `${budget.fiscal_year}년`} ({budget.start_date && budget.end_date ? `${calculatePeriodMonths(budget.start_date, budget.end_date)}개월` : '1년'})"
								>
									{budget.period_number || 1}연차
								</div>
							</td>
							<!-- 인건비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-2">
									<div class="space-y-1">
										<div class="text-xs text-blue-600">현금: {formatCurrency(parseFloat(budget.personnel_cost_cash) || 0)}</div>
										<div class="text-xs text-green-600">현물: {formatCurrency(parseFloat(budget.personnel_cost_in_kind) || 0)}</div>
									</div>
									<div class="text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-500">사용률:</span>
											<span class="px-2 py-1 rounded text-xs font-medium {getUsageRateColor(calculateUsageRate((parseFloat(budget.personnel_cost_cash) || 0) + (parseFloat(budget.personnel_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0))}">
												{calculateUsageRate((parseFloat(budget.personnel_cost_cash) || 0) + (parseFloat(budget.personnel_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</td>
							<!-- 연구재료비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-2">
									<div class="space-y-1">
										<div class="text-xs text-blue-600">현금: {formatCurrency(parseFloat(budget.research_material_cost_cash) || 0)}</div>
										<div class="text-xs text-green-600">현물: {formatCurrency(parseFloat(budget.research_material_cost_in_kind) || 0)}</div>
									</div>
									<div class="text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-500">사용률:</span>
											<span class="px-2 py-1 rounded text-xs font-medium {getUsageRateColor(calculateUsageRate((parseFloat(budget.research_material_cost_cash) || 0) + (parseFloat(budget.research_material_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0))}">
												{calculateUsageRate((parseFloat(budget.research_material_cost_cash) || 0) + (parseFloat(budget.research_material_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</td>
							<!-- 연구활동비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-2">
									<div class="space-y-1">
										<div class="text-xs text-blue-600">현금: {formatCurrency(parseFloat(budget.research_activity_cost_cash) || 0)}</div>
										<div class="text-xs text-green-600">현물: {formatCurrency(parseFloat(budget.research_activity_cost_in_kind) || 0)}</div>
									</div>
									<div class="text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-500">사용률:</span>
											<span class="px-2 py-1 rounded text-xs font-medium {getUsageRateColor(calculateUsageRate((parseFloat(budget.research_activity_cost_cash) || 0) + (parseFloat(budget.research_activity_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0))}">
												{calculateUsageRate((parseFloat(budget.research_activity_cost_cash) || 0) + (parseFloat(budget.research_activity_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</td>
							<!-- 간접비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-2">
									<div class="space-y-1">
										<div class="text-xs text-blue-600">현금: {formatCurrency(parseFloat(budget.indirect_cost_cash) || 0)}</div>
										<div class="text-xs text-green-600">현물: {formatCurrency(parseFloat(budget.indirect_cost_in_kind) || 0)}</div>
									</div>
									<div class="text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-500">사용률:</span>
											<span class="px-2 py-1 rounded text-xs font-medium {getUsageRateColor(calculateUsageRate((parseFloat(budget.indirect_cost_cash) || 0) + (parseFloat(budget.indirect_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0))}">
												{calculateUsageRate((parseFloat(budget.indirect_cost_cash) || 0) + (parseFloat(budget.indirect_cost_in_kind) || 0), parseFloat(budget.spent_amount) || 0).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</td>
							<!-- 총 예산 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								<div class="space-y-2">
									<div class="space-y-1">
										<div class="text-xs text-blue-600 font-semibold">현금: {formatCurrency(cashTotal)}</div>
										<div class="text-xs text-green-600 font-semibold">현물: {formatCurrency(inKindTotal)}</div>
									</div>
									<div class="text-xs">
										<div class="flex items-center justify-between">
											<span class="text-gray-500 font-medium">전체 사용률:</span>
											<span class="px-2 py-1 rounded text-xs font-bold {getUsageRateColor(calculateUsageRate(cashTotal + inKindTotal, parseFloat(budget.spent_amount) || 0))}">
												{calculateUsageRate(cashTotal + inKindTotal, parseFloat(budget.spent_amount) || 0).toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</td>
							<!-- 실행액 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="font-medium">{formatCurrency(budget.spent_amount || 0)}</div>
									<div class="text-xs text-gray-500">
										예산 대비 {usageRate.toFixed(1)}% 사용
									</div>
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
								<div class="flex space-x-1 justify-center">
									<ThemeButton variant="ghost" size="sm" onclick={() => editBudget(budget)}>
										<EditIcon size={16} class="text-blue-600 mr-1" />
										수정
									</ThemeButton>
									<ThemeButton variant="ghost" size="sm" onclick={() => removeBudget(budget.id)}>
										<TrashIcon size={16} class="text-red-600 mr-1" />
										삭제
									</ThemeButton>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="px-6 py-12 text-center text-gray-500">
								<DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
								<p>등록된 사업비가 없습니다.</p>
							</td>
						</tr>
					{/each}
					
					<!-- 합계 행 -->
					{#if projectBudgets && projectBudgets.length > 0}
						{@const totals = calculateBudgetTotals()}
						{@const totalUsageRate = totals.totalBudget > 0 ? (totals.totalSpent / totals.totalBudget) * 100 : 0}
						<tr class="bg-gray-100 border-t-2 border-gray-300">
							<!-- 연차 기간 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="text-center">
									<div class="font-medium">합계</div>
									<div class="text-xs text-gray-600">{projectBudgets.length}개 연차</div>
								</div>
							</td>
							<!-- 인건비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(totals.personnelCash)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(totals.personnelInKind)}</div>
									<div class="text-xs text-gray-800 font-medium">소계: {formatCurrency(totals.personnelCash + totals.personnelInKind)}</div>
								</div>
							</td>
							<!-- 연구재료비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(totals.researchMaterialCash)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(totals.researchMaterialInKind)}</div>
									<div class="text-xs text-gray-800 font-medium">소계: {formatCurrency(totals.researchMaterialCash + totals.researchMaterialInKind)}</div>
								</div>
							</td>
							<!-- 연구활동비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(totals.researchActivityCash)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(totals.researchActivityInKind)}</div>
									<div class="text-xs text-gray-800 font-medium">소계: {formatCurrency(totals.researchActivityCash + totals.researchActivityInKind)}</div>
								</div>
							</td>
							<!-- 간접비 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(totals.indirectCash)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(totals.indirectInKind)}</div>
									<div class="text-xs text-gray-800 font-medium">소계: {formatCurrency(totals.indirectCash + totals.indirectInKind)}</div>
								</div>
							</td>
							<!-- 총 예산 (현금/현물) -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="space-y-1">
									<div class="text-xs text-blue-600">현금: {formatCurrency(totals.totalCash)}</div>
									<div class="text-xs text-green-600">현물: {formatCurrency(totals.totalInKind)}</div>
									<div class="text-sm text-gray-900 font-medium">총계: {formatCurrency(totals.totalBudget)}</div>
								</div>
							</td>
							<!-- 실행액 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="font-medium">{formatCurrency(totals.totalSpent)}</div>
							</td>
							<!-- 사용율 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="flex items-center">
									<div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
										<div class="bg-blue-600 h-2 rounded-full" style="width: {Math.min(totalUsageRate, 100)}%"></div>
									</div>
									<span class="text-xs text-gray-600 font-bold">{totalUsageRate.toFixed(1)}%</span>
								</div>
							</td>
							<!-- 증빙 내역 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
								<div class="text-xs text-gray-500 text-center">-</div>
							</td>
							<!-- 액션 -->
							<td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
								<div class="text-xs text-gray-500 text-center">-</div>
							</td>
						</tr>
					{/if}
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
			periodNumber: 1,
			startDate: '',
			endDate: '',
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
	size="lg"
>
	<div class="space-y-6">
		<!-- 모달 제목 -->
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-gray-900">
				{editingBudget ? "사업비 편집" : "사업비 추가"}
			</h3>
		</div>
		
		<!-- 기본 정보 -->
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div>
					<label for="pm-budget-period-number" class="block text-sm font-medium text-gray-700 mb-1">연차 번호 *</label>
					<input
						id="pm-budget-period-number"
						type="number"
						bind:value={budgetForm.periodNumber}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						min="1"
						max="10"
					/>
				</div>
				<div>
					<label for="pm-budget-start-date" class="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
					<input
						id="pm-budget-start-date"
						type="date"
						bind:value={budgetForm.startDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="pm-budget-end-date" class="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
					<input
						id="pm-budget-end-date"
						type="date"
						bind:value={budgetForm.endDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
			<div>
				<label for="pm-budget-actual-amount" class="block text-sm font-medium text-gray-700 mb-1">실행 금액 (천원)</label>
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
						<label for="pm-budget-personnel-cash" class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
						<input
							id="pm-budget-personnel-cash"
							type="number"
							bind:value={budgetForm.personnelCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-personnel-in-kind" class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
						<label for="pm-budget-research-material-cash" class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
						<input
							id="pm-budget-research-material-cash"
							type="number"
							bind:value={budgetForm.researchMaterialCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-research-material-in-kind" class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
						<label for="pm-budget-research-activity-cash" class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
						<input
							id="pm-budget-research-activity-cash"
							type="number"
							bind:value={budgetForm.researchActivityCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-research-activity-in-kind" class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
						<label for="pm-budget-indirect-cash" class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
						<input
							id="pm-budget-indirect-cash"
							type="number"
							bind:value={budgetForm.indirectCostCash}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>
					<div>
						<label for="pm-budget-indirect-in-kind" class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
				periodNumber: 1,
				startDate: '',
				endDate: '',
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

<!-- 프로젝트 멤버 관리 -->
<ThemeCard class="p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-gray-900">참여연구원</h3>
		<ThemeButton 
			onclick={() => addingMember = true} 
			size="sm" 
			disabled={addingMember || editingMember !== null}
		>
			<PlusIcon size={16} class="mr-2" />
			연구원 추가
		</ThemeButton>
	</div>
	
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200" style="min-width: 1000px;">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">연구원</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">참여율</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">월간금액</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">참여기간</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">기여 유형</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">액션</th>
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
									const target = e.target as HTMLInputElement;
									const value = parseInt(target.value);
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
					<tr class="hover:bg-gray-50 {editingMember && editingMember.id === member.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}">
						<td class="px-4 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<UserIcon size={20} class="text-gray-400 mr-3" />
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<div class="text-sm font-medium text-gray-900">{processKoreanName(member.employee_name)}</div>
										<ThemeBadge variant="info" size="sm">{member.role}</ThemeBadge>
									</div>
									<div class="text-xs text-gray-500">{member.employee_department} / {member.employee_position}</div>
								</div>
							</div>
						</td>
						<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
							{#if editingMember && editingMember.id === member.id}
								<input
									type="number"
									bind:value={memberForm.participationRate}
									class="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
									min="0"
									max="100"
									onchange={updateMonthlyAmount}
								/>
							{:else}
								{member.participation_rate}%
							{/if}
						</td>
						<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
							{#if editingMember && editingMember.id === member.id}
								<input
									type="number"
									bind:value={memberForm.monthlyAmount}
									class="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="0"
								/>
							{:else}
								{formatCurrency(member.monthly_amount || 0)}
							{/if}
						</td>
						<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
							{#if editingMember && editingMember.id === member.id}
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-xs text-gray-500 w-8">시작:</span>
										<input
											type="date"
											bind:value={memberForm.startDate}
											class="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
											onchange={updateMonthlyAmount}
										/>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-xs text-gray-500 w-8">종료:</span>
										<input
											type="date"
											bind:value={memberForm.endDate}
											class="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
											onchange={updateMonthlyAmount}
										/>
									</div>
								</div>
							{:else}
								<div class="space-y-1">
									<div class="text-xs text-gray-500">시작: {formatDate(member.start_date)}</div>
									<div class="text-xs text-gray-500">종료: {formatDate(member.end_date)}</div>
								</div>
							{/if}
						</td>
						<td class="px-4 py-4 whitespace-nowrap">
							{#if editingMember && editingMember.id === member.id}
								<select
									bind:value={memberForm.contributionType}
									class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value="cash">현금</option>
									<option value="in_kind">현물</option>
								</select>
							{:else}
								<ThemeBadge variant={member.contribution_type === 'cash' ? 'success' : 'warning'} size="sm">
									{member.contribution_type === 'cash' ? '현금' : '현물'}
								</ThemeBadge>
							{/if}
						</td>
						<td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
							<div class="flex space-x-1 justify-center">
								{#if editingMember && editingMember.id === member.id}
									<ThemeButton variant="ghost" size="sm" onclick={updateMember}>
										<CheckIcon size={14} class="text-green-600" />
									</ThemeButton>
									<ThemeButton variant="ghost" size="sm" onclick={cancelEditMember}>
										<XIcon size={14} class="text-red-600" />
									</ThemeButton>
								{:else}
									<ThemeButton 
										variant="ghost" 
										size="sm" 
										onclick={() => editMember(member)}
										disabled={editingMember !== null}
									>
										<EditIcon size={16} class="text-blue-600 mr-1" />
										수정
									</ThemeButton>
									<ThemeButton 
										variant="ghost" 
										size="sm" 
										onclick={() => removeMember(member.id)}
										disabled={editingMember !== null}
									>
										<TrashIcon size={16} class="text-red-600 mr-1" />
										삭제
									</ThemeButton>
								{/if}
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
		{@const personnelSummary = calculatePersonnelCostSummary()}
		<div class="mt-4 p-3 bg-gray-50 rounded-lg">
			<div class="flex items-center justify-between mb-2">
				<h4 class="text-sm font-medium text-gray-700">
					인건비 합계
					{#if personnelSummary.periodInfo}
						<span class="text-xs text-gray-500 ml-2">
							(Y{personnelSummary.periodInfo.periodNumber})
						</span>
					{/if}
				</h4>
				<button
					onclick={() => isPersonnelSummaryExpanded = !isPersonnelSummaryExpanded}
					class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
				>
					{#if isPersonnelSummaryExpanded}
						<ChevronUpIcon size={16} />
						접기
					{:else}
						<ChevronDownIcon size={16} />
						월별 상세
					{/if}
				</button>
			</div>
			
			<!-- 기본 요약 정보 -->
			<div class="grid grid-cols-3 gap-4">
				<div class="text-center">
					<div class="text-sm font-semibold text-green-600">
						{formatCurrency(personnelSummary.totalCash)}
					</div>
					<div class="text-xs text-gray-500">현금</div>
				</div>
				<div class="text-center">
					<div class="text-sm font-semibold text-orange-600">
						{formatCurrency(personnelSummary.totalInKind)}
					</div>
					<div class="text-xs text-gray-500">현물</div>
				</div>
				<div class="text-center">
					<div class="text-sm font-semibold text-blue-600">
						{formatCurrency(personnelSummary.totalCost)}
					</div>
					<div class="text-xs text-gray-500">합계</div>
				</div>
			</div>
			
			<!-- 월별 상세 정보 -->
			{#if isPersonnelSummaryExpanded}
				<div class="mt-4 pt-4 border-t border-gray-200">
					<h5 class="text-xs font-medium text-gray-600 mb-3">월별 인건비 상세</h5>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-100">
								<tr>
									<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">월</th>
									<th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">현금</th>
									<th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">현물</th>
									<th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">합계</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each personnelSummary.monthlyCosts as monthData}
									<tr class="hover:bg-gray-50">
										<td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
											{monthData.monthName}
										</td>
										<td class="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600">
											{formatCurrency(monthData.cash)}
										</td>
										<td class="px-3 py-2 whitespace-nowrap text-sm text-right text-orange-600">
											{formatCurrency(monthData.inKind)}
										</td>
										<td class="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
											{formatCurrency(monthData.total)}
										</td>
									</tr>
								{/each}
								<!-- 합계 행 -->
								<tr class="bg-gray-100 border-t-2 border-gray-300">
									<td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
										연차 합계
									</td>
									<td class="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-green-600">
										{formatCurrency(personnelSummary.totalCash)}
									</td>
									<td class="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-orange-600">
										{formatCurrency(personnelSummary.totalInKind)}
									</td>
									<td class="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-blue-600">
										{formatCurrency(personnelSummary.totalCost)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</ThemeCard>

<!-- 프로젝트 수정 모달 -->
{#if showEditProjectModal}
<ThemeModal open={showEditProjectModal} onclose={() => showEditProjectModal = false}>
	<div class="p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">프로젝트 수정</h3>
		
		<div class="space-y-4">
			<!-- 프로젝트 제목 -->
			<div>
				<label for="edit-project-title" class="block text-sm font-medium text-gray-700 mb-1">
					프로젝트 제목 *
				</label>
				<input
					id="edit-project-title"
					type="text"
					bind:value={projectForm.title}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="프로젝트 제목을 입력하세요"
					required
				/>
			</div>

			<!-- 프로젝트 코드 -->
			<div>
				<label for="edit-project-code" class="block text-sm font-medium text-gray-700 mb-1">
					프로젝트 코드 *
				</label>
				<input
					id="edit-project-code"
					type="text"
					bind:value={projectForm.code}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="프로젝트 코드를 입력하세요"
					required
				/>
			</div>

			<!-- 프로젝트 설명 -->
			<div>
				<label for="edit-project-description" class="block text-sm font-medium text-gray-700 mb-1">
					프로젝트 설명
				</label>
				<textarea
					id="edit-project-description"
					bind:value={projectForm.description}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="프로젝트 설명을 입력하세요"
				></textarea>
			</div>

			<!-- 프로젝트 기간 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="edit-project-start-date" class="block text-sm font-medium text-gray-700 mb-1">
						시작일 *
					</label>
					<input
						id="edit-project-start-date"
						type="date"
						bind:value={projectForm.startDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div>
					<label for="edit-project-end-date" class="block text-sm font-medium text-gray-700 mb-1">
						종료일 *
					</label>
					<input
						id="edit-project-end-date"
						type="date"
						bind:value={projectForm.endDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
			</div>

			<!-- 프로젝트 상태 및 우선순위 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="edit-project-status" class="block text-sm font-medium text-gray-700 mb-1">
						상태 *
					</label>
					<select
						id="edit-project-status"
						bind:value={projectForm.status}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="planning">계획</option>
						<option value="active">진행중</option>
						<option value="completed">완료</option>
						<option value="cancelled">취소</option>
						<option value="suspended">중단</option>
					</select>
				</div>
				<div>
					<label for="edit-project-priority" class="block text-sm font-medium text-gray-700 mb-1">
						우선순위 *
					</label>
					<select
						id="edit-project-priority"
						bind:value={projectForm.priority}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="low">낮음</option>
						<option value="medium">보통</option>
						<option value="high">높음</option>
						<option value="critical">긴급</option>
					</select>
				</div>
			</div>

			<!-- 후원기관 및 연구유형 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="edit-project-sponsor" class="block text-sm font-medium text-gray-700 mb-1">
						후원기관 *
					</label>
					<select
						id="edit-project-sponsor"
						bind:value={projectForm.sponsorType}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="internal">내부</option>
						<option value="government">정부</option>
						<option value="private">민간</option>
						<option value="international">국제</option>
					</select>
				</div>
				<div>
					<label for="edit-project-research-type" class="block text-sm font-medium text-gray-700 mb-1">
						연구유형 *
					</label>
					<select
						id="edit-project-research-type"
						bind:value={projectForm.researchType}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="basic">기초연구</option>
						<option value="applied">응용연구</option>
						<option value="development">개발연구</option>
					</select>
				</div>
			</div>
		</div>

		<div class="flex justify-end space-x-3 mt-6">
			<ThemeButton 
				variant="ghost" 
				onclick={() => showEditProjectModal = false}
				disabled={isUpdating}
			>
				취소
			</ThemeButton>
			<ThemeButton 
				onclick={updateProject}
				disabled={isUpdating}
			>
				{#if isUpdating}
					수정 중...
				{:else}
					수정
				{/if}
			</ThemeButton>
		</div>
	</div>
</ThemeModal>
{/if}

<!-- 프로젝트 삭제 확인 모달 -->
{#if showDeleteConfirmModal}
<ThemeModal open={showDeleteConfirmModal} onclose={() => {
	showDeleteConfirmModal = false;
	deleteConfirmationCode = ''; // 모달 닫을 때 코드 초기화
}}>
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
			
			<!-- 프로젝트 코드 입력 확인 -->
			<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p class="text-sm text-yellow-800 font-medium mb-3">
					🔒 삭제를 확인하려면 프로젝트 코드를 입력하세요
				</p>
				<div>
					<label for="delete-confirmation-code" class="block text-sm font-medium text-gray-700 mb-2">
						프로젝트 코드 입력
					</label>
					<input
						id="delete-confirmation-code"
						type="text"
						bind:value={deleteConfirmationCode}
						placeholder="프로젝트 코드를 정확히 입력하세요"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						autocomplete="off"
					/>
					{#if deleteConfirmationCode && !isDeleteCodeValid()}
						<p class="text-sm text-red-600 mt-1">❌ 코드가 일치하지 않습니다</p>
					{:else if isDeleteCodeValid()}
						<p class="text-sm text-green-600 mt-1">✅ 코드가 일치합니다</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end space-x-3">
			<ThemeButton 
				variant="ghost" 
				onclick={() => {
					showDeleteConfirmModal = false;
					deleteConfirmationCode = ''; // 모달 닫을 때 코드 초기화
				}}
				disabled={isDeleting}
			>
				취소
			</ThemeButton>
			<ThemeButton 
				variant="error" 
				onclick={deleteProject}
				disabled={isDeleting || !isDeleteCodeValid()}
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
