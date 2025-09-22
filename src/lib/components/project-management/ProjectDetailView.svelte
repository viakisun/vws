<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import { formatCurrency, formatDate, formatDateForInput } from '$lib/utils/format'
  import { isKoreanName } from '$lib/utils/korean-name'
  import { calculateMonthlySalary } from '$lib/utils/salary-calculator'
  import {
  	AlertTriangleIcon,
  	CalendarIcon,
  	CheckCircleIcon,
  	CheckIcon,
  	ChevronDownIcon,
  	ChevronRightIcon,
  	ChevronUpIcon,
  	DollarSignIcon,
  	EditIcon,
  	FileTextIcon,
  	PlusIcon,
  	RefreshCwIcon,
  	ShieldAlertIcon,
  	ShieldCheckIcon,
  	TrashIcon,
  	UserIcon,
  	UsersIcon,
  	XCircleIcon,
  	XIcon
  } from '@lucide/svelte'
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher();

  // 예산 데이터 필드 접근 유틸리티 함수들
  function getBudgetField(budget: any, camelCase: string, snakeCase: string, defaultValue: any = null) {
    return budget[camelCase] || budget[snakeCase] || defaultValue;
  }

  function getPeriodNumber(budget: any): number {
    return getBudgetField(budget, 'periodNumber', 'period_number', 1);
  }

  function getStartDate(budget: any): string {
    return getBudgetField(budget, 'startDate', 'start_date');
  }

  function getEndDate(budget: any): string {
    return getBudgetField(budget, 'endDate', 'end_date');
  }

  function getFiscalYear(budget: any): string {
    return getBudgetField(budget, 'fiscalYear', 'fiscal_year');
  }

  function getPersonnelCost(budget: any): number {
    return getBudgetField(budget, 'personnelCost', 'personnel_cost', 0);
  }

  function getPersonnelCostCash(budget: any): number {
    return getBudgetField(budget, 'personnelCostCash', 'personnel_cost_cash', 0);
  }

  function getResearchMaterialCost(budget: any): number {
    return getBudgetField(budget, 'researchMaterialCost', 'research_material_cost', 0);
  }

  function getResearchMaterialCostCash(budget: any): number {
    return getBudgetField(budget, 'researchMaterialCostCash', 'research_material_cost_cash', 0);
  }

  function getResearchActivityCost(budget: any): number {
    return getBudgetField(budget, 'researchActivityCost', 'research_activity_cost', 0);
  }

  function getResearchActivityCostCash(budget: any): number {
    return getBudgetField(budget, 'researchActivityCostCash', 'research_activity_cost_cash', 0);
  }

  function getResearchStipend(budget: any): number {
    return getBudgetField(budget, 'researchStipend', 'research_stipend', 0);
  }
  function getResearchStipendCash(budget: any): number {
    return getBudgetField(budget, 'researchStipendCash', 'research_stipend_cash', 0);
  }
  function getResearchStipendInKind(budget: any): number {
    return getBudgetField(budget, 'researchStipendInKind', 'research_stipend_in_kind', 0);
  }

  function getIndirectCost(budget: any): number {
    return getBudgetField(budget, 'indirectCost', 'indirect_cost', 0);
  }
  function getIndirectCostCash(budget: any): number {
    return getBudgetField(budget, 'indirectCostCash', 'indirect_cost_cash', 0);
  }

  function getPersonnelCostInKind(budget: any): number {
    return getBudgetField(budget, 'personnelCostInKind', 'personnel_cost_in_kind', 0);
  }

  function getResearchMaterialCostInKind(budget: any): number {
    return getBudgetField(budget, 'researchMaterialCostInKind', 'research_material_cost_in_kind', 0);
  }

  function getResearchActivityCostInKind(budget: any): number {
    return getBudgetField(budget, 'researchActivityCostInKind', 'research_activity_cost_in_kind', 0);
  }

  function getIndirectCostInKind(budget: any): number {
    return getBudgetField(budget, 'indirectCostInKind', 'indirect_cost_in_kind', 0);
  }


  function formatPeriodDisplay(budget: any): string {
    return `Y${getPeriodNumber(budget)}`;
  }

  function formatPeriodTooltip(budget: any): string {
    const startDate = getStartDate(budget);
    const endDate = getEndDate(budget);
    const fiscalYear = getFiscalYear(budget);

    const startDisplay = startDate ? formatDate(startDate) : `${fiscalYear}년`;
    const endDisplay = endDate ? formatDate(endDate) : `${fiscalYear}년`;
    const monthsDisplay = startDate && endDate ? `${calculatePeriodMonths(startDate, endDate)}개월` : '1년';

    return `기간: ${startDisplay} ~ ${endDisplay} (${monthsDisplay})`;
  }

  // 날짜 처리 유틸리티 함수들 (표준화된 함수 사용)
  
  // 연차 정보 기반 프로젝트 기간 계산
  async function updateProjectPeriodFromBudgets() {
    if (!selectedProject?.id) return;
    
    try {
      const response = await fetch(`/api/project-management/projects/${selectedProject.id}/annual-budgets`);
      const result = await response.json();
      
      if (result.success && result.data?.budgets && result.data.budgets.length > 0) {
        const budgets = result.data.budgets;
        const firstBudget = budgets[0];
        const lastBudget = budgets[budgets.length - 1];
        
        if (firstBudget.startDate && lastBudget.endDate) {
          const periodElement = document.getElementById('project-period');
          if (periodElement) {
            periodElement.textContent = `${formatDate(firstBudget.startDate)} ~ ${formatDate(lastBudget.endDate)}`;
          }
        } else {
          const periodElement = document.getElementById('project-period');
          if (periodElement) {
            periodElement.textContent = '연차별 기간 정보 없음';
          }
        }
      } else {
        const periodElement = document.getElementById('project-period');
        if (periodElement) {
          periodElement.textContent = '연차별 예산 정보 없음';
        }
      }
    } catch (error) {
      console.error('프로젝트 기간 업데이트 실패:', error);
      const periodElement = document.getElementById('project-period');
      if (periodElement) {
        periodElement.textContent = '기간 정보 로드 실패';
      }
    }
  }

  // 멤버 데이터 필드 접근 유틸리티 함수들
  function getMemberField(member: any, camelCase: string, snakeCase: string, defaultValue: any = null) {
    return member[camelCase] || member[snakeCase] || defaultValue;
  }

  function getMemberStartDate(member: any): string {
    return getMemberField(member, 'startDate', 'start_date', '');
  }

  function getMemberEndDate(member: any): string {
    return getMemberField(member, 'endDate', 'end_date', '');
  }

  function getMemberEmployeeId(member: any): string {
    return getMemberField(member, 'employeeId', 'employee_id');
  }

  function getMemberParticipationRate(member: any): number {
    return getMemberField(member, 'participationRate', 'participation_rate', 0);
  }

  function getMemberMonthlyAmount(member: any): number {
    return getMemberField(member, 'monthlyAmount', 'monthly_amount', 0);
  }

  function getMemberContributionType(member: any): string {
    return getMemberField(member, 'contributionType', 'contribution_type', 'cash');
  }

  function getMemberEmployeeName(member: any): string {
    return getMemberField(member, 'employeeName', 'employee_name');
  }

  // 한국식 이름 처리 유틸리티 함수 (통합된 유틸리티 사용)
  function formatKoreanName(name: string): string {
    if (!name) return '';

    const trimmed = name.trim();

    // 이미 표준 형식인 경우 (띄어쓰기 없음)
    if (!trimmed.includes(' ')) {
      return trimmed;
    }

    // 한국 이름인 경우 표준 형식으로 변환
    if (isKoreanName(trimmed)) {
      const parts = trimmed.split(/\s+/);
      if (parts.length === 2) {
        const [first, second] = parts;

        // 일반적으로 성은 1글자, 이름은 2글자 이상
        if (first.length >= 2 && second.length === 1) {
          // "지은 차" -> "차지은" (이름 성 -> 성 이름)
          return `${second}${first}`;
        } else if (first.length === 1 && second.length >= 2) {
          // "차 지은" -> "차지은" (이미 올바른 순서)
          return `${first}${second}`;
        }
      }
    }

    // 한국 이름이 아닌 경우 원본 반환
    return trimmed;
  }

  // 담당자 이름 처리 통일된 유틸리티 함수들
  function formatAssigneeName(assigneeName: string | null | undefined, fallback: string = '미할당'): string {
    if (!assigneeName) return fallback;
    // 데이터베이스에서 "지은 차" 형식으로 저장된 것을 "차지은" 형식으로 변환
    return formatKoreanName(assigneeName);
  }

  function formatAssigneeNameFromFields(item: any, fallback: string = '미할당'): string {
    const name = item.assignee_full_name || item.assignee_name;
    return formatAssigneeName(name, fallback);
  }

  function createAssigneeNameFromEmployee(employee: any): string {
    if (!employee) return '';
    return formatKoreanName(`${employee.last_name}${employee.first_name}`);
  }

  function formatEmployeeForSelect(employee: any): string {
    return createAssigneeNameFromEmployee(employee);
  }

  // 프로젝트 데이터 필드 접근 유틸리티 함수들
  function getProjectField(project: any, camelCase: string, snakeCase: string, defaultValue: any = null) {
    return project[camelCase] || project[snakeCase] || defaultValue;
  }

  function getProjectStartDate(project: any): string {
    return getProjectField(project, 'startDate', 'start_date');
  }

  function getProjectEndDate(project: any): string {
    return getProjectField(project, 'endDate', 'end_date');
  }

  function getProjectCode(project: any): string {
    return getProjectField(project, 'code', 'code');
  }

  function getProjectDescription(project: any): string {
    return getProjectField(project, 'description', 'description');
  }

  function getProjectStatus(project: any): string {
    return getProjectField(project, 'status', 'status', 'active');
  }

  function getProjectSponsorType(project: any): string {
    return getProjectField(project, 'sponsorType', 'sponsor_type', 'internal');
  }

  let { selectedProject }: { selectedProject: any } = $props();
  
  // 프로젝트 변경 시 기간 업데이트
  $effect(() => {
    if (selectedProject?.id) {
      updateProjectPeriodFromBudgets();
    }
  });

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
  let budgetRefreshTrigger = $state(0);

  // 폼 데이터
  let budgetForm = $state({
    periodNumber: 1, // 연차 번호 (1연차, 2연차, ...)
    startDate: '', // 연차 시작일
    endDate: '', // 연차 종료일
    // 현금 비목들
    personnelCostCash: '',
    researchMaterialCostCash: '',
    researchActivityCostCash: '',
    researchStipendCash: '',
    indirectCostCash: '',
    // 현물 비목들
    personnelCostInKind: '',
    researchMaterialCostInKind: '',
    researchActivityCostInKind: '',
    researchStipendInKind: '',
    indirectCostInKind: ''
  });

  let projectForm = $state({
    title: '',
    code: '',
    description: '',
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

  // 사용자가 수동으로 월간금액을 입력했는지 추적
  let isManualMonthlyAmount = $state(false);

  let calculatedMonthlyAmount = $state(0);
  let isCalculatingMonthlyAmount = $state(false);
  let isPersonnelSummaryExpanded = $state(false);

  // 증빙 내역 관리 상태
  let showEvidenceModal = $state(false);
  let selectedBudgetForEvidence = $state(null);
  let evidenceList = $state([]);
  let selectedEvidencePeriod = $state(1);
  let showEvidenceDetailModal = $state(false);
  let selectedEvidenceItem = $state(null);
  let evidenceTypes = $state([]);
  let expandedEvidenceSections = $state({
    personnel: true,
    material: true,
    activity: true,
    indirect: true
  });

  // 검증 및 자동화 상태
  let showValidationModal = $state(false);
  let validationResults = $state<any>(null);
  let isRunningValidation = $state(false);
  let validationHistory = $state<any[]>([]);
  let autoValidationEnabled = $state(true);
  let evidenceCategories = $state([]);
  let evidenceItems = $state([]);
  let isLoadingEvidence = $state(false);

  // 증빙 추가 폼
  let newEvidenceForm = $state({
    categoryId: '',
    name: '',
    description: '',
    budgetAmount: '',
    assigneeId: '',
    dueDate: ''
  });

  // 증빙 등록 검증 상태
  let evidenceValidation = $state<any>(null);
  let isValidatingEvidence = $state(false);

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


  // 참여연구원 검증 상태 (테이블용)
  let memberValidation = $state<any>(null);
  let isValidatingMembers = $state(false);
  let memberValidationLastChecked = $state<Date | null>(null);

  // 개별 멤버 검증 상태
  let memberValidationStatuses = $state<Record<string, any>>({});


  // 컴포넌트 마운트 시 초기화
  onMount(async () => {
    if (selectedProject?.id) {
      await loadProjectBudgets();
      await loadProjectMembers();
      await loadEvidenceCategories();
    }
  });



  // 증빙 등록 시 재직 기간 검증 함수
  async function validateEvidenceRegistration() {
    if (!newEvidenceForm.assigneeId || !newEvidenceForm.dueDate || !selectedBudgetForEvidence?.id) {
      evidenceValidation = null;
      return;
    }

    // 인건비 카테고리인 경우에만 검증
    const selectedCategory = evidenceCategories.find(cat => cat.id === newEvidenceForm.categoryId);
    if (selectedCategory?.name !== '인건비') {
      evidenceValidation = null;
      return;
    }

    isValidatingEvidence = true;
    try {
      const response = await fetch('/api/project-management/evidence-items/validate-employment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId: newEvidenceForm.assigneeId,
          dueDate: newEvidenceForm.dueDate,
          projectBudgetId: selectedBudgetForEvidence.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        evidenceValidation = data;
      } else {
        console.error('증빙 등록 검증 실패:', response.statusText);
        evidenceValidation = null;
      }
    } catch (error) {
      console.error('증빙 등록 검증 중 오류:', error);
      evidenceValidation = null;
    } finally {
      isValidatingEvidence = false;
    }
  }

  // 참여연구원 검증 함수 (테이블용)
  async function validateMembers() {
    if (!selectedProject?.id) return;

    isValidatingMembers = true;
    try {
      const response = await fetch(`/api/project-management/researcher-validation?projectId=${selectedProject.id}`);
      if (response.ok) {
        const data = await response.json();
        memberValidation = data;
        memberValidationLastChecked = new Date();
        
        // 개별 멤버 검증 상태 업데이트
        if (data.success && data.data?.validation?.issues) {
          updateMemberValidationStatuses(data.data.validation.issues);
        }
      } else {
        console.error('참여연구원 검증 실패:', response.statusText);
      }
    } catch (error) {
      console.error('참여연구원 검증 중 오류:', error);
    } finally {
      isValidatingMembers = false;
    }
  }

  // 개별 멤버 검증 상태 업데이트
  function updateMemberValidationStatuses(issues: any[]) {
    // 초기화
    memberValidationStatuses = {};
    
    // 각 멤버별로 검증 상태 설정
    projectMembers.forEach(member => {
      const memberIssues = issues.filter(issue => issue.memberId === member.id);
      
      if (memberIssues.length === 0) {
        memberValidationStatuses[member.id] = {
          status: 'valid',
          message: '검증 완료',
          issues: []
        };
      } else {
        const hasErrors = memberIssues.some(issue => issue.severity === 'error');
        const hasWarnings = memberIssues.some(issue => issue.severity === 'warning');
        const errorCount = memberIssues.filter(i => i.severity === 'error').length;
        const warningCount = memberIssues.filter(i => i.severity === 'warning').length;
        
        // 더 자세한 메시지 생성
        let detailedMessage = '';
        if (hasErrors && hasWarnings) {
          detailedMessage = `${errorCount}개 오류, ${warningCount}개 경고`;
        } else if (hasErrors) {
          detailedMessage = `${errorCount}개 오류`;
        } else {
          detailedMessage = `${warningCount}개 경고`;
        }
        
        memberValidationStatuses[member.id] = {
          status: hasErrors ? 'error' : 'warning',
          message: detailedMessage,
          issues: memberIssues.map(issue => ({
            ...issue,
            // API에서 제공하는 실제 메시지 사용
            priority: issue.severity === 'error' ? 'high' : 'medium'
          }))
        };
      }
    });
  }



  // 프로젝트 멤버 로드
  async function loadProjectMembers() {
    try {
      console.log('참여연구원 목록 로드 시작, 프로젝트 ID:', selectedProject.id);
      const response = await fetch(`/api/project-management/project-members?projectId=${selectedProject.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('참여연구원 목록 로드 성공:', data.data?.length, '명');
        projectMembers = data.data || [];
        console.log('참여연구원 상태 업데이트 완료:', projectMembers.length, '명');
        
        // 자동 검증 제거 - 수작업으로만 검증 실행
      } else {
        console.error('참여연구원 목록 로드 실패, 응답 상태:', response.status);
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
      const response = await fetch('/api/project-management/project-budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          periodNumber: budgetForm.periodNumber,
          startDate: budgetForm.startDate,
          endDate: budgetForm.endDate,
          // 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
          personnelCostCash: fromThousands(budgetForm.personnelCostCash),
          researchMaterialCostCash: fromThousands(budgetForm.researchMaterialCostCash),
          researchActivityCostCash: fromThousands(budgetForm.researchActivityCostCash),
          researchStipendCash: fromThousands(budgetForm.researchStipendCash),
          indirectCostCash: fromThousands(budgetForm.indirectCostCash),
          // 현물 비목들 (천원 단위를 원 단위로 변환)
          personnelCostInKind: fromThousands(budgetForm.personnelCostInKind),
          researchMaterialCostInKind: fromThousands(budgetForm.researchMaterialCostInKind),
          researchActivityCostInKind: fromThousands(budgetForm.researchActivityCostInKind),
          researchStipendInKind: fromThousands(budgetForm.researchStipendInKind),
          indirectCostInKind: fromThousands(budgetForm.indirectCostInKind)
        })
      });

      if (response.ok) {
        const result = await response.json();
        showBudgetModal = false;
        budgetForm = {
          periodNumber: 1,
          startDate: '',
          endDate: '',
          personnelCostCash: '',
          researchMaterialCostCash: '',
          researchActivityCostCash: '',
          researchStipendCash: '',
          indirectCostCash: '',
          personnelCostInKind: '',
          researchMaterialCostInKind: '',
          researchActivityCostInKind: '',
          researchStipendInKind: '',
          indirectCostInKind: ''
        };
        await loadProjectBudgets();
        // 예산 추가 후 프로젝트 기간 정보 업데이트
        updateProjectPeriodFromBudgets();
        // 예산 요약 새로고침
        budgetRefreshTrigger++;
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

  // 멤버 추가 시작
  function startAddMember() {
    addingMember = true;
    editingMember = null;
    resetMemberForm();
  }

  // 멤버 추가 취소
  function cancelAddMember() {
    addingMember = false;
    resetMemberForm();
  }

  // 멤버 수정 시작
  function editMember(member: any) {
    editingMember = member;

    // 디버깅: 멤버 데이터 확인
    console.log('editMember - member data:', member);
    console.log('editMember - startDate raw:', getMemberStartDate(member));
    console.log('editMember - endDate raw:', getMemberEndDate(member));

    // 날짜 데이터 확인 및 안전한 처리
    const rawStartDate = getMemberStartDate(member);
    const rawEndDate = getMemberEndDate(member);
    
    memberForm = {
      employeeId: getMemberEmployeeId(member),
      role: member.role,
      startDate: rawStartDate ? formatDateForInput(rawStartDate) : '',
      endDate: rawEndDate ? formatDateForInput(rawEndDate) : '',
      participationRate: getMemberParticipationRate(member) || 0,
      monthlyAmount: (getMemberMonthlyAmount(member) || 0).toString(),
      contributionType: getMemberContributionType(member)
    };

    // 디버깅: memberForm 확인
    console.log('editMember - memberForm after setting:', memberForm);

    // 수정 시 월간금액 자동 계산 (수동 입력 플래그 초기화)
    isManualMonthlyAmount = false;
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
    isManualMonthlyAmount = false;
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

    // 디버깅: 필드 값 확인
    console.log('updateMember - memberForm:', memberForm);
    console.log('updateMember - startDate:', memberForm.startDate, 'type:', typeof memberForm.startDate);
    console.log('updateMember - endDate:', memberForm.endDate, 'type:', typeof memberForm.endDate);

    // 필수 필드 검증
    if (!memberForm.startDate || !memberForm.endDate) {
      alert('참여기간(시작일, 종료일)을 모두 입력해주세요.');
      return;
    }

    try {
      console.log('참여연구원 수정 요청 데이터:', {
        id: editingMember.id,
        role: memberForm.role,
        startDate: memberForm.startDate,
        endDate: memberForm.endDate,
        participationRate: memberForm.participationRate,
        contributionType: memberForm.contributionType
      });

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

      console.log('참여연구원 수정 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('참여연구원 수정 성공 응답:', result);

        editingMember = null;
        addingMember = false;
        resetMemberForm();

        // 데이터 새로고침
        await loadProjectMembers();
        console.log('참여연구원 목록 새로고침 완료');

        dispatch('refresh');

        // 성공 메시지 표시
        if (result.message) {
          alert(result.message);
        }
      } else {
        const errorData = await response.json();
        console.error('참여연구원 수정 API 에러 응답:', errorData);
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

    // 중복된 formatDateForInput 함수 제거됨 - 상단의 유틸리티 함수 사용

    budgetForm = {
      periodNumber: getPeriodNumber(budget),
      startDate: formatDateForInput(getStartDate(budget)),
      endDate: formatDateForInput(getEndDate(budget)),
      // 현금 비목들 (천원 단위로 변환, 인건비는 조정된 값 표시)
      personnelCostCash: toThousands(getPersonnelCostCash(budget)),
      researchMaterialCostCash: toThousands(getResearchMaterialCostCash(budget)),
      researchActivityCostCash: toThousands(getResearchActivityCostCash(budget)),
      researchStipendCash: toThousands(getResearchStipendCash(budget)),
      indirectCostCash: toThousands(getIndirectCost(budget)),
      // 현물 비목들 (천원 단위로 변환)
      personnelCostInKind: toThousands(getPersonnelCostInKind(budget)),
      researchMaterialCostInKind: toThousands(getResearchMaterialCostInKind(budget)),
      researchActivityCostInKind: toThousands(getResearchActivityCostInKind(budget)),
      researchStipendInKind: toThousands(getResearchStipendInKind(budget)),
      indirectCostInKind: toThousands(getIndirectCostInKind(budget))
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
      const response = await fetch(`/api/project-management/project-budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodNumber: budgetForm.periodNumber,
          startDate: budgetForm.startDate,
          endDate: budgetForm.endDate,
          // 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
          personnelCostCash: fromThousands(budgetForm.personnelCostCash),
          researchMaterialCostCash: fromThousands(budgetForm.researchMaterialCostCash),
          researchActivityCostCash: fromThousands(budgetForm.researchActivityCostCash),
          researchStipendCash: fromThousands(budgetForm.researchStipendCash),
          indirectCostCash: fromThousands(budgetForm.indirectCostCash),
          // 현물 비목들 (천원 단위를 원 단위로 변환)
          personnelCostInKind: fromThousands(budgetForm.personnelCostInKind),
          researchMaterialCostInKind: fromThousands(budgetForm.researchMaterialCostInKind),
          researchActivityCostInKind: fromThousands(budgetForm.researchActivityCostInKind),
          researchStipendInKind: fromThousands(budgetForm.researchStipendInKind),
          indirectCostInKind: fromThousands(budgetForm.indirectCostInKind)
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
          personnelCostCash: '',
          researchMaterialCostCash: '',
          researchActivityCostCash: '',
          researchStipendCash: '',
          indirectCostCash: '',
          personnelCostInKind: '',
          researchMaterialCostInKind: '',
          researchActivityCostInKind: '',
          researchStipendInKind: '',
          indirectCostInKind: ''
        };
        await loadProjectBudgets();
        // 예산 수정 후 프로젝트 기간 정보 업데이트
        updateProjectPeriodFromBudgets();
        // 예산 요약 새로고침
        budgetRefreshTrigger++;
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
        // 예산 삭제 후 프로젝트 기간 정보 업데이트
        updateProjectPeriodFromBudgets();
        // 예산 요약 새로고침
        budgetRefreshTrigger++;
        dispatch('refresh');
      }
    } catch (error) {
      console.error('사업비 삭제 실패:', error);
    }
  }

  // 프로젝트 수정 폼 초기화
  function initProjectForm() {
    if (selectedProject) {
      projectForm = {
        title: selectedProject.title || '',
        code: getProjectCode(selectedProject),
        description: getProjectDescription(selectedProject),
        status: getProjectStatus(selectedProject),
        sponsorType: getProjectSponsorType(selectedProject),
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

      // 중앙화된 급여 계산 함수 사용
      const monthlyAmount = calculateMonthlySalary(annualSalary, rate);
      console.log('계산된 월간금액:', monthlyAmount);

      return monthlyAmount;
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

    // 사용자가 수동으로 월간금액을 입력한 경우 자동 계산하지 않음
    if (isManualMonthlyAmount) {
      calculatedMonthlyAmount = parseFloat(memberForm.monthlyAmount) || 0;
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

  // 종합 검증 실행
  async function runComprehensiveValidation() {
    if (!selectedProject) return;

    isRunningValidation = true;
    try {
      const response = await fetch(`/api/project-management/comprehensive-validation?projectId=${selectedProject.id}&scope=all`);
      const result = await response.json();

      validationResults = result;

      // 검증 히스토리에 추가
      validationHistory.unshift({
        timestamp: new Date().toISOString(),
        projectId: selectedProject.id,
        results: result
      });

      // 최대 10개까지만 유지
      if (validationHistory.length > 10) {
        validationHistory = validationHistory.slice(0, 10);
      }

      showValidationModal = true;
    } catch (error) {
      console.error('검증 실행 실패:', error);
      alert('검증 실행 중 오류가 발생했습니다.');
    } finally {
      isRunningValidation = false;
    }
  }


  // 증빙 내역 모달 표시
  function openEvidenceModal(budget) {
    selectedBudgetForEvidence = budget;
    showEvidenceModal = true;
    loadEvidenceList(budget.id);
  }

  async function openEvidenceDetail(item) {
    selectedEvidenceItem = item;
    showEvidenceDetailModal = true;

    // 증빙 항목 상세 정보 로드
    if (item.id) {
      try {
        const response = await fetch(`/api/project-management/evidence/${item.id}`);
        const result = await response.json();

        if (result.success) {
          selectedEvidenceItem = result.data;
        }
      } catch (error) {
        console.error('증빙 항목 상세 정보 로드 실패:', error);
      }
    }
  }

  // 증빙 카테고리 로드
  async function loadEvidenceCategories() {
    try {
      const response = await fetch('/api/project-management/evidence-categories');
      const result = await response.json();

      if (result.success) {
        evidenceCategories = result.data;
      }
    } catch (error) {
      console.error('증빙 카테고리 로드 실패:', error);
    }
  }

  // 증빙 항목 로드 (모든 연차)
  async function loadEvidenceItems() {
    if (!selectedProject || projectBudgets.length === 0) return;

    try {
      isLoadingEvidence = true;
      let allEvidenceItems = [];

      // 모든 연차의 증빙 데이터를 로드
      for (const budget of projectBudgets) {
        const response = await fetch(`/api/project-management/evidence?projectBudgetId=${budget.id}`);
        const result = await response.json();

        if (result.success) {
          allEvidenceItems = [...allEvidenceItems, ...result.data];
        }
      }

      evidenceItems = allEvidenceItems;
    } catch (error) {
      console.error('증빙 항목 로드 실패:', error);
    } finally {
      isLoadingEvidence = false;
    }
  }

  // 증빙 항목 추가
  async function addEvidenceItem(categoryId, itemData) {
    try {
      const currentBudget = projectBudgets.find(b => getPeriodNumber(b) === selectedEvidencePeriod) || projectBudgets[0];

      const response = await fetch('/api/project-management/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectBudgetId: currentBudget.id,
          categoryId: categoryId,
          ...itemData
        })
      });

      const result = await response.json();

      if (result.success) {
        await loadEvidenceItems();
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('증빙 항목 추가 실패:', error);
      throw error;
    }
  }

  // 증빙 항목 수정
  async function updateEvidenceItem(itemId, updateData) {
    try {
      const response = await fetch(`/api/project-management/evidence/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        await loadEvidenceItems();
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('증빙 항목 수정 실패:', error);
      throw error;
    }
  }

  // 증빙 항목 삭제
  async function deleteEvidenceItem(itemId) {
    try {
      const response = await fetch(`/api/project-management/evidence/${itemId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadEvidenceItems();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('증빙 항목 삭제 실패:', error);
      throw error;
    }
  }

  // 증빙 항목 추가 핸들러
  async function handleAddEvidenceItem() {
    if (!newEvidenceForm.categoryId || !newEvidenceForm.name || !newEvidenceForm.budgetAmount) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }

    try {
      isUpdating = true;

      const selectedEmployee = availableEmployees.find(emp => emp.id === newEvidenceForm.assigneeId);
      const assigneeName = createAssigneeNameFromEmployee(selectedEmployee);

      await addEvidenceItem(newEvidenceForm.categoryId, {
        name: newEvidenceForm.name,
        description: newEvidenceForm.description,
        budgetAmount: parseFloat(newEvidenceForm.budgetAmount),
        assigneeId: newEvidenceForm.assigneeId,
        assigneeName: assigneeName,
        dueDate: newEvidenceForm.dueDate
      });

      // 폼 초기화
      newEvidenceForm = {
        categoryId: '',
        name: '',
        description: '',
        budgetAmount: '',
        assigneeId: '',
        dueDate: ''
      };

      showEvidenceModal = false;
    } catch (error) {
      console.error('증빙 항목 추가 실패:', error);
      alert('증빙 항목 추가에 실패했습니다.');
    } finally {
      isUpdating = false;
    }
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
      };
    }

    const totals = projectBudgets.reduce((acc, budget) => {
      // 모든 항목을 예산 편성 데이터에서 직접 가져오기 (미래 기간 구분 없이)
      acc.personnelCash += parseFloat(budget.personnel_cost_cash) || 0;
      acc.personnelInKind += parseFloat(budget.personnel_cost_in_kind) || 0;
      acc.researchMaterialCash += parseFloat(budget.research_material_cost_cash) || 0;
      acc.researchMaterialInKind += parseFloat(budget.research_material_cost_in_kind) || 0;
      acc.researchActivityCash += parseFloat(budget.research_activity_cost_cash) || 0;
      acc.researchActivityInKind += parseFloat(budget.research_activity_cost_in_kind) || 0;
      acc.researchStipendCash += parseFloat(budget.research_stipend_cash) || 0;
      acc.researchStipendInKind += parseFloat(budget.research_stipend_in_kind) || 0;
      acc.indirectCash += parseFloat(budget.indirect_cost_cash) || 0;
      acc.indirectInKind += parseFloat(budget.indirect_cost_in_kind) || 0;
      
      return acc;
    }, {
      personnelCash: 0,
      personnelInKind: 0,
      researchMaterialCash: 0,
      researchMaterialInKind: 0,
      researchActivityCash: 0,
      researchActivityInKind: 0,
      researchStipendCash: 0,
      researchStipendInKind: 0,
      indirectCash: 0,
      indirectInKind: 0,
      totalBudget: 0,
      totalSpent: 0
    });

    // 총 예산은 각 비목의 합계로 직접 계산 (reduce 외부에서)
    totals.totalBudget = totals.personnelCash + totals.personnelInKind + 
                        totals.researchMaterialCash + totals.researchMaterialInKind + 
                        totals.researchActivityCash + totals.researchActivityInKind + 
                        totals.researchStipendCash + totals.researchStipendInKind +
                        totals.indirectCash + totals.indirectInKind;
    
    totals.totalCash = totals.personnelCash + totals.researchMaterialCash + totals.researchActivityCash + totals.researchStipendCash + totals.indirectCash;
    totals.totalInKind = totals.personnelInKind + totals.researchMaterialInKind + totals.researchActivityInKind + totals.researchStipendInKind + totals.indirectInKind;

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
        const memberStartDate = new Date(member.startDate || member.start_date);
        const memberEndDate = new Date(member.endDate || member.end_date);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // 해당 월의 마지막 날

        // 해당 월에 참여하는지 확인
        if (memberStartDate <= monthEnd && memberEndDate >= monthStart) {
          const memberMonthlyCost = parseFloat(member.monthlyAmount || member.monthly_amount) || 0;

          if ((member.contributionType || member.contribution_type) === 'cash') {
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
        startDate: getStartDate(currentBudget),
        endDate: getEndDate(currentBudget),
        periodNumber: getPeriodNumber(currentBudget)
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
      loadEvidenceCategories();
    }
  });

  // Svelte 5: 증빙 데이터 로드
  $effect(() => {
    if (selectedProject && projectBudgets.length > 0) {
      loadEvidenceItems();
    }
  });
</script>

{#if selectedProject}
  <div class="space-y-6">
    <!-- 프로젝트 기본 정보 -->
    <ThemeCard class="p-6">
      <!-- 헤더: 제목과 액션 버튼 -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <!-- 프로젝트 제목과 코드 -->
          <div class="flex items-center gap-3 mb-3">
            <h2 class="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
            <span class="text-sm text-gray-500 font-mono">{selectedProject.code}</span>
          </div>

          <!-- 상태 및 우선순위 태그 -->
          <div class="flex items-center gap-2 mb-3">
            <ThemeBadge
              variant={getStatusColor(selectedProject.status)}
              size="md">
              {getStatusText(selectedProject.status)}
            </ThemeBadge>
            <ThemeBadge
              variant={getPriorityColor(selectedProject.priority)}
              size="md">
              {getPriorityText(selectedProject.priority)}
            </ThemeBadge>
            <ThemeBadge
              variant="info"
              size="md">
              {getSponsorTypeText(selectedProject.sponsor_type || selectedProject.sponsorType)}
            </ThemeBadge>
            <ThemeBadge
              variant="primary"
              size="md">
              {getResearchTypeText(selectedProject.research_type || selectedProject.researchType)}
            </ThemeBadge>
          </div>

          {#if selectedProject.description}
            <p class="text-gray-700 mb-3">{selectedProject.description}</p>
          {/if}

          <!-- 프로젝트 기간 (연차 정보 기반) -->
          <div class="flex items-center text-sm text-gray-600">
            <CalendarIcon
              size={16}
              class="mr-2 text-orange-600" />
            <span id="project-period">연차 정보를 불러오는 중...</span>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex gap-2 ml-4">
          <ThemeButton
            variant="primary"
            size="sm"
            onclick={() => {
              initProjectForm();
              showEditProjectModal = true;
            }}
          >
            <EditIcon
              size={16}
              class="mr-2" />
            정보 수정
          </ThemeButton>
          <ThemeButton
            variant="primary"
            size="sm"
            onclick={() => dispatch('showBudgetModal')}
          >
            <DollarSignIcon
              size={16}
              class="mr-2" />
            예산 수정
          </ThemeButton>
          <ThemeButton
            variant="error"
            size="sm"
            onclick={() => showDeleteConfirmModal = true}
          >
            <TrashIcon
              size={16}
              class="mr-2" />
            삭제
          </ThemeButton>
        </div>
      </div>

      <!-- 사업비 예산 -->
      <div class="bg-gray-50 rounded-lg p-6">
        {#await import('$lib/components/project-management/ProjectBudgetSummary.svelte')}
          <div class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600 text-sm">로딩 중...</span>
          </div>
        {:then { default: ProjectBudgetSummary }}
          <ProjectBudgetSummary 
            projectId={selectedProject.id}
            compact={true}
            refreshTrigger={budgetRefreshTrigger}
          />
        {:catch error}
          <div class="text-center py-4 text-gray-500">
            <p class="text-sm">예산 정보를 불러올 수 없습니다.</p>
          </div>
        {/await}
      </div>
    </ThemeCard>

    <!-- 연차별 사업비 관리 -->
    <ThemeCard class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">연구개발비</h3>
        <div class="flex gap-2">
          <ThemeButton
            onclick={runComprehensiveValidation}
            size="sm"
            disabled={isRunningValidation}>
            <ShieldCheckIcon
              size={16}
              class="mr-2" />
            {isRunningValidation ? '검증 중...' : '검증 실행'}
          </ThemeButton>
          <ThemeButton
            onclick={() => showBudgetModal = true}
            size="sm">
            <PlusIcon
              size={16}
              class="mr-2" />
            사업비 추가
          </ThemeButton>
        </div>
      </div>





      <!-- 단위 안내 -->
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            <span class="font-medium">금액 단위: 천원</span>
            <span class="ml-4 text-gray-600">
              (현금) | (현물)
            </span>
          </div>
          <div class="text-xs text-gray-600">
            예: 1,000 = 1,000천원
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table
          class="w-full divide-y divide-gray-200"
          style:min-width="100%">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">연차</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>인건비</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>연구재료비</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>연구활동비</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>연구수당</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>간접비</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>총 예산</div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">액션</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each projectBudgets as budget}
              {@const totalBudget = (getPersonnelCostCash(budget) + getPersonnelCostInKind(budget) + 
                                    getResearchMaterialCostCash(budget) + getResearchMaterialCostInKind(budget) + 
                                    getResearchActivityCostCash(budget) + getResearchActivityCostInKind(budget) + 
                                    getResearchStipendCash(budget) + getResearchStipendInKind(budget) +
                                    getIndirectCostCash(budget) + getIndirectCostInKind(budget))}
              {@const personnelCash = Number(getPersonnelCostCash(budget)) || 0}
              {@const materialCash = Number(getResearchMaterialCostCash(budget)) || 0}
              {@const activityCash = Number(getResearchActivityCostCash(budget)) || 0}
              {@const stipendCash = Number(getResearchStipendCash(budget)) || 0}
              {@const indirectCash = Number(getIndirectCostCash(budget)) || 0}
              {@const cashTotal = personnelCash + materialCash + activityCash + stipendCash + indirectCash}
              {@const personnelInKind = Number(getPersonnelCostInKind(budget)) || 0}
              {@const materialInKind = Number(getResearchMaterialCostInKind(budget)) || 0}
              {@const activityInKind = Number(getResearchActivityCostInKind(budget)) || 0}
              {@const stipendInKind = Number(getResearchStipendInKind(budget)) || 0}
              {@const indirectInKind = Number(getIndirectCostInKind(budget)) || 0}
              {@const inKindTotal = personnelInKind + materialInKind + activityInKind + stipendInKind + indirectInKind}
              <tr class="hover:bg-gray-50">
                <!-- 연차 -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                  <div
                    class="text-sm cursor-help"
                    title={formatPeriodTooltip(budget)}
                  >
                    <div class="font-medium">{formatPeriodDisplay(budget)}</div>
                    <div class="text-xs text-gray-500 mt-1">현금 | 현물</div>
                  </div>
                </td>
                <!-- 인건비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(personnelCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(personnelInKind, false)}</div>
                  </div>
                </td>
                <!-- 연구재료비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(materialCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(materialInKind, false)}</div>
                  </div>
                </td>
                <!-- 연구활동비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(activityCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(activityInKind, false)}</div>
                  </div>
                </td>
                <!-- 연구수당 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(stipendCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(stipendInKind, false)}</div>
                  </div>
                </td>
                <!-- 간접비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(indirectCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(indirectInKind, false)}</div>
                  </div>
                </td>
                <!-- 총 예산 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-semibold">{formatCurrency(cashTotal, false)}</div>
                    <div class="text-sm text-gray-600 font-semibold">{formatCurrency(inKindTotal, false)}</div>
                  </div>
                </td>
                <!-- 액션 -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                  <div class="flex space-x-1 justify-center">
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => editBudget(budget)}>
                      <EditIcon
                        size={16}
                        class="text-blue-600 mr-1" />
                      수정
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => removeBudget(budget.id)}>
                      <TrashIcon
                        size={16}
                        class="text-red-600 mr-1" />
                      삭제
                    </ThemeButton>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td
                  colspan="7"
                  class="px-4 py-12 text-center text-gray-500">
                  <DollarSignIcon
                    size={48}
                    class="mx-auto mb-2 text-gray-300" />
                  <p>등록된 사업비가 없습니다.</p>
                </td>
              </tr>
            {/each}

            <!-- 합계 행 -->
            {#if projectBudgets && projectBudgets.length > 0}
              {@const totals = calculateBudgetTotals()}
              <tr class="bg-gray-100 border-t-2 border-gray-300">
                <!-- 연차 -->
                <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900 w-24">
                  <div class="text-center">
                    <div class="font-medium">합계</div>
                    <div class="text-xs text-gray-600">{projectBudgets.length}개 연차</div>
                  </div>
                </td>
                <!-- 인건비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.personnelCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.personnelInKind, false)}</div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">소계: {formatCurrency((totals.personnelCash || 0) + (totals.personnelInKind || 0), false)}</div>
                  </div>
                </td>
                <!-- 연구재료비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.researchMaterialCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.researchMaterialInKind, false)}</div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">소계: {formatCurrency((totals.researchMaterialCash || 0) + (totals.researchMaterialInKind || 0), false)}</div>
                  </div>
                </td>
                <!-- 연구활동비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.researchActivityCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.researchActivityInKind, false)}</div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">소계: {formatCurrency((totals.researchActivityCash || 0) + (totals.researchActivityInKind || 0), false)}</div>
                  </div>
                </td>
                <!-- 연구수당 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.researchStipendCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.researchStipendInKind, false)}</div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">소계: {formatCurrency((totals.researchStipendCash || 0) + (totals.researchStipendInKind || 0), false)}</div>
                  </div>
                </td>
                <!-- 간접비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.indirectCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.indirectInKind, false)}</div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">소계: {formatCurrency((totals.indirectCash || 0) + (totals.indirectInKind || 0), false)}</div>
                  </div>
                </td>
                <!-- 총 예산 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">{formatCurrency(totals.totalCash, false)}</div>
                    <div class="text-sm text-gray-600">{formatCurrency(totals.totalInKind, false)}</div>
                    <div class="text-base text-gray-900 font-bold border-t-2 pt-2">총계: {formatCurrency(totals.totalBudget, false)}</div>
                  </div>
                </td>
                <!-- 액션 -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                  <div class="text-sm text-gray-500 text-center">-</div>
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
        personnelCostCash: '',
        researchMaterialCostCash: '',
        researchActivityCostCash: '',
        researchStipendCash: '',
        indirectCostCash: '',
        personnelCostInKind: '',
        researchMaterialCostInKind: '',
        researchActivityCostInKind: '',
        researchStipendInKind: '',
        indirectCostInKind: ''
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
            <label
              for="pm-budget-period-number"
              class="block text-sm font-medium text-gray-700 mb-1">연차 번호 *</label>
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
            <label
              for="pm-budget-start-date"
              class="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
            <input
              id="pm-budget-start-date"
              type="date"
              bind:value={budgetForm.startDate}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              for="pm-budget-end-date"
              class="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
            <input
              id="pm-budget-end-date"
              type="date"
              bind:value={budgetForm.endDate}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
              <label
                for="pm-budget-personnel-cash"
                class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
              <input
                id="pm-budget-personnel-cash"
                type="number"
                bind:value={budgetForm.personnelCostCash}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="pm-budget-personnel-in-kind"
                class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
              <label
                for="pm-budget-research-material-cash"
                class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
              <input
                id="pm-budget-research-material-cash"
                type="number"
                bind:value={budgetForm.researchMaterialCostCash}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="pm-budget-research-material-in-kind"
                class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
              <label
                for="pm-budget-research-activity-cash"
                class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
              <input
                id="pm-budget-research-activity-cash"
                type="number"
                bind:value={budgetForm.researchActivityCostCash}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="pm-budget-research-activity-in-kind"
                class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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

      <!-- 연구수당 -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-gray-900">연구수당</h4>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="pm-budget-research-stipend-cash"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                연구수당 (현금)
              </label>
              <input
                id="pm-budget-research-stipend-cash"
                type="number"
                bind:value={budgetForm.researchStipendCash}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="pm-budget-research-stipend-in-kind"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                연구수당 (현물)
              </label>
              <input
                id="pm-budget-research-stipend-in-kind"
                type="number"
                bind:value={budgetForm.researchStipendInKind}
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
              <label
                for="pm-budget-indirect-cash"
                class="block text-xs text-gray-500 mb-1">현금 (천원)</label>
              <input
                id="pm-budget-indirect-cash"
                type="number"
                bind:value={budgetForm.indirectCostCash}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label
                for="pm-budget-indirect-in-kind"
                class="block text-xs text-gray-500 mb-1">현물 (천원)</label>
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
      <ThemeButton
        variant="ghost"
        onclick={() => {
          showBudgetModal = false;
          editingBudget = null;
          budgetForm = {
            periodNumber: 1,
            startDate: '',
            endDate: '',
            personnelCostCash: '',
            researchMaterialCostCash: '',
            researchActivityCostCash: '',
            researchStipendCash: '',
            indirectCostCash: '',
            personnelCostInKind: '',
            researchMaterialCostInKind: '',
            researchActivityCostInKind: '',
            researchStipendInKind: '',
            indirectCostInKind: ''
          };
        }}>
        취소
      </ThemeButton>
      <ThemeButton onclick={editingBudget ? updateBudget : addBudget}>
        {editingBudget ? '수정' : '추가'}
      </ThemeButton>
    </div>
  </ThemeModal>

  <!-- 연구원 추가 폼 카드 -->
  {#if addingMember}
    <ThemeCard class="p-6 mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <div class="flex items-center mb-4">
        <div class="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
        <h3 class="text-lg font-semibold text-green-800">연구원 추가</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 연구원 선택 -->
        <div>
          <label for="member-employee-select" class="block text-sm font-medium text-gray-700 mb-2">연구원</label>
          <select
            id="member-employee-select"
            bind:value={memberForm.employeeId}
            class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
            onchange={() => {
              isManualMonthlyAmount = false;
              updateMonthlyAmount();
            }}
          >
            <option value="">👥 연구원 선택 ({availableEmployees.length}명)</option>
            {#each availableEmployees as employee}
              <option value={employee.id}>{formatKoreanName(employee.name)} ({employee.department})</option>
            {/each}
          </select>
        </div>

        <!-- 역할 -->
        <div>
          <label for="member-role-select" class="block text-sm font-medium text-gray-700 mb-2">역할</label>
          <select
            id="member-role-select"
            bind:value={memberForm.role}
            class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
          >
            <option value="researcher">👨‍🔬 연구원</option>
            <option value="lead">👑 연구책임자</option>
            <option value="support">🤝 지원</option>
          </select>
        </div>

        <!-- 참여율 -->
        <div>
          <label for="member-participation-rate" class="block text-sm font-medium text-gray-700 mb-2">참여율</label>
          <div class="relative">
            <input
              id="member-participation-rate"
              type="number"
              bind:value={memberForm.participationRate}
              class="w-full px-3 py-2 pr-8 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
              min="0"
              max="100"
              step="0.1"
              placeholder="100"
              oninput={(e) => {
                const target = e.target as HTMLInputElement;
                const value = parseFloat(target.value);
                if (value < 0) memberForm.participationRate = 0;
                if (value > 100) memberForm.participationRate = 100;
                isManualMonthlyAmount = false;
                updateMonthlyAmount();
              }}
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">%</span>
          </div>
        </div>

        <!-- 기여 유형 -->
        <div>
          <label for="member-contribution-type" class="block text-sm font-medium text-gray-700 mb-2">기여 유형</label>
          <select
            id="member-contribution-type"
            bind:value={memberForm.contributionType}
            class="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
          >
            <option value="cash">💰 현금</option>
            <option value="in_kind">📦 현물</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <!-- 월간금액 -->
        <div>
          <label for="member-monthly-amount" class="block text-sm font-medium text-gray-700 mb-2">월간금액</label>
          <div class="flex items-center space-x-2">
            <input
              id="member-monthly-amount"
              type="number"
              bind:value={memberForm.monthlyAmount}
              oninput={() => {
                isManualMonthlyAmount = true;
                calculatedMonthlyAmount = parseFloat(memberForm.monthlyAmount) || 0;
              }}
              class="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white shadow-sm"
              placeholder="0"
            />
            <div class="text-sm min-w-0">
              {#if isCalculatingMonthlyAmount}
                <div class="flex items-center text-blue-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  계산 중...
                </div>
              {:else if calculatedMonthlyAmount > 0 && !isManualMonthlyAmount}
                <div class="flex items-center text-green-600">
                  <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span class="font-medium">자동: {formatCurrency(calculatedMonthlyAmount)}</span>
                </div>
              {:else if isManualMonthlyAmount}
                <div class="flex items-center text-purple-600">
                  <div class="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span class="font-medium">수동 입력</span>
                </div>
              {:else if memberForm.employeeId && memberForm.participationRate && memberForm.startDate && memberForm.endDate}
                <div class="flex items-center text-blue-600">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>계산 가능</span>
                </div>
              {:else}
                <div class="flex items-center text-gray-400">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span>자동 계산</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- 참여기간 -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">참여기간</div>
          <div class="flex space-x-2">
            <div class="flex-1">
              <label for="member-start-date" class="sr-only">시작일</label>
              <input
                id="member-start-date"
                type="date"
                bind:value={memberForm.startDate}
                class="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                onchange={() => {
                  isManualMonthlyAmount = false;
                  updateMonthlyAmount();
                }}
              />
            </div>
            <div class="flex-1">
              <label for="member-end-date" class="sr-only">종료일</label>
              <input
                id="member-end-date"
                type="date"
                bind:value={memberForm.endDate}
                class="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                onchange={() => {
                  isManualMonthlyAmount = false;
                  updateMonthlyAmount();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 폼 검증 메시지 -->
      {#if !memberForm.employeeId || !memberForm.startDate || !memberForm.endDate}
        <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div class="flex items-center">
            <div class="w-5 h-5 text-amber-600 mr-2">⚠️</div>
            <div class="text-sm text-amber-800">
              {#if !memberForm.employeeId}
                연구원을 선택해주세요.
              {:else if !memberForm.startDate || !memberForm.endDate}
                참여기간을 입력해주세요.
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- 액션 버튼 -->
      <div class="flex justify-end space-x-3 mt-6">
        <ThemeButton
          variant="secondary"
          onclick={cancelAddMember}
          class="px-6 py-2">
          <XIcon size={16} class="mr-2" />
          취소
        </ThemeButton>
        <ThemeButton
          variant="primary"
          onclick={addMember}
          disabled={!memberForm.employeeId || !memberForm.startDate || !memberForm.endDate}
          class="px-6 py-2">
          <CheckIcon size={16} class="mr-2" />
          추가
        </ThemeButton>
      </div>
    </ThemeCard>
  {/if}

  <!-- 프로젝트 멤버 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">참여연구원</h3>
      <div class="flex items-center gap-2">
        {#if projectMembers.length > 0}
          <ThemeButton
            onclick={validateMembers}
            size="sm"
            variant="primary"
            disabled={isValidatingMembers}
          >
            {#if isValidatingMembers}
              <RefreshCwIcon size={14} class="mr-2 animate-spin" />
              검증 중...
            {:else}
              <ShieldCheckIcon size={14} class="mr-2" />
              검증 실행
            {/if}
          </ThemeButton>
        {/if}
        <ThemeButton
          onclick={startAddMember}
          size="sm"
          disabled={addingMember || editingMember !== null}
        >
          <PlusIcon
            size={16}
            class="mr-2" />
          연구원 추가
        </ThemeButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table
        class="min-w-full divide-y divide-gray-200"
        style:min-width="1000px">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">연구원</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">참여율</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">월간금액</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">참여기간</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">기여 유형</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">검증 상태</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">액션</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">

          {#each projectMembers as member}
            <tr class="hover:bg-gray-50 {editingMember && editingMember.id === member.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm' : ''}">
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                  <UserIcon
                    size={20}
                    class="text-gray-400 mr-2" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="text-sm font-medium text-gray-900 truncate">{formatKoreanName(getMemberEmployeeName(member))}</div>
                      <ThemeBadge
                        variant="info"
                        size="sm">{member.role}</ThemeBadge>
                    </div>
                    <div class="text-xs text-gray-500 truncate">{member.employee_department} / {member.employee_position}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24">
                {#if editingMember && editingMember.id === member.id}
                  <div class="relative">
                    <input
                      type="number"
                      bind:value={memberForm.participationRate}
                      class="w-20 px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      min="0"
                      max="100"
                      step="0.1"
                      onchange={() => {
                      isManualMonthlyAmount = false;
                      updateMonthlyAmount();
                    }}
                    />
                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">%</span>
                  </div>
                {:else}
                  {member.participationRate}%
                {/if}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {#if editingMember && editingMember.id === member.id}
                  <div class="relative">
                    <input
                      type="number"
                      bind:value={memberForm.monthlyAmount}
                      oninput={() => {
                        isManualMonthlyAmount = true;
                        calculatedMonthlyAmount = parseFloat(memberForm.monthlyAmount) || 0;
                      }}
                      class="w-32 px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      placeholder="0"
                    />
                  </div>
                {:else}
                  {formatCurrency(getMemberMonthlyAmount(member))}
                {/if}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {#if editingMember && editingMember.id === member.id}
                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-medium text-blue-700 w-10">시작:</span>
                      <input
                        type="date"
                        bind:value={memberForm.startDate}
                        class="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        onchange={() => {
                      isManualMonthlyAmount = false;
                      updateMonthlyAmount();
                    }}
                      />
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-medium text-blue-700 w-10">종료:</span>
                      <input
                        type="date"
                        bind:value={memberForm.endDate}
                        class="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        onchange={() => {
                      isManualMonthlyAmount = false;
                      updateMonthlyAmount();
                    }}
                      />
                    </div>
                  </div>
                {:else}
                  <div class="space-y-1">
                    <div class="text-xs text-gray-500">시작: {formatDate(getMemberStartDate(member))}</div>
                    <div class="text-xs text-gray-500">종료: {formatDate(getMemberEndDate(member))}</div>
                  </div>
                {/if}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                {#if editingMember && editingMember.id === member.id}
                  <select
                    bind:value={memberForm.contributionType}
                    class="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  >
                    <option value="cash">💰 현금</option>
                    <option value="in_kind">🏢 현물</option>
                  </select>
                {:else}
                  <ThemeBadge
                    variant={(member.contributionType || member.contribution_type) === 'cash' ? 'success' : 'warning'}
                    size="sm">
                    {(member.contributionType || member.contribution_type) === 'cash' ? '현금' : '현물'}
                  </ThemeBadge>
                {/if}
              </td>
              <!-- 검증 상태 -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center justify-center">
                  {#if memberValidationStatuses[member.id]}
                    {@const validationStatus = memberValidationStatuses[member.id]}
                    {#if validationStatus.status === 'valid'}
                      <div class="relative inline-block group">
                        <CheckCircleIcon class="h-6 w-6 text-green-500 cursor-help hover:text-green-600 transition-colors" />
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 max-w-xs">
                          <div class="font-semibold text-green-400 mb-1">✅ 검증 완료</div>
                          <div class="text-gray-300">모든 검증 항목이 정상입니다.</div>
                          <div class="text-gray-400 mt-1">• 근로계약서 유효</div>
                          <div class="text-gray-400">• 참여율 적정</div>
                          <div class="text-gray-400">• 월간금액 정상</div>
                        </div>
                      </div>
                    {:else if validationStatus.status === 'warning'}
                      <div class="relative inline-block group">
                        <AlertTriangleIcon class="h-6 w-6 text-yellow-500 cursor-help hover:text-yellow-600 transition-colors" />
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 max-w-sm">
                          <div class="font-semibold text-yellow-400 mb-2">⚠️ 경고 사항</div>
                          <div class="text-gray-300 mb-1">{validationStatus.message}</div>
                          {#if validationStatus.issues && validationStatus.issues.length > 0}
                            {#each validationStatus.issues as issue}
                              <div class="mb-2 last:mb-0 p-2 bg-gray-800 rounded">
                                <div class="text-gray-300 font-medium">{issue.message}</div>
                                {#if issue.suggestedFix}
                                  <div class="text-gray-400 mt-1 text-xs">💡 {issue.suggestedFix}</div>
                                {/if}
                                {#if issue.data}
                                  <div class="text-gray-500 mt-1 text-xs">
                                    {#if issue.type === 'participation_rate_excess'}
                                      현재 참여율: {issue.data.participationRate}%
                                    {:else if issue.type === 'amount_excess'}
                                      현재: {issue.data.monthlyAmount?.toLocaleString()}원<br>
                                      예상: {issue.data.expectedMonthlyAmount?.toLocaleString()}원
                                    {:else if issue.type === 'duplicate_participation'}
                                      총 참여율: {issue.data.totalParticipationRate?.toFixed(1)}%
                                      {#if issue.data.conflictingProjects && issue.data.conflictingProjects.length > 0}
                                        <br>충돌 프로젝트: {issue.data.conflictingProjects.length}개
                                      {/if}
                                    {:else if issue.type === 'contract_missing' || issue.type === 'contract_period_mismatch'}
                                      참여 기간: {issue.data.participationPeriod}
                                    {/if}
                                  </div>
                                {/if}
                              </div>
                            {/each}
                          {/if}
                        </div>
                      </div>
                    {:else if validationStatus.status === 'error'}
                      <div class="relative inline-block group">
                        <XCircleIcon class="h-6 w-6 text-red-500 cursor-help hover:text-red-600 transition-colors" />
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 max-w-sm">
                          <div class="font-semibold text-red-400 mb-2">❌ 검증 실패</div>
                          <div class="text-gray-300 mb-1">{validationStatus.message}</div>
                          {#if validationStatus.issues && validationStatus.issues.length > 0}
                            {#each validationStatus.issues as issue}
                              <div class="mb-2 last:mb-0 p-2 bg-gray-800 rounded">
                                <div class="text-gray-300 font-medium">{issue.message}</div>
                                {#if issue.suggestedFix}
                                  <div class="text-gray-400 mt-1 text-xs">🔧 {issue.suggestedFix}</div>
                                {/if}
                                {#if issue.data}
                                  <div class="text-gray-500 mt-1 text-xs">
                                    {#if issue.type === 'participation_rate_excess'}
                                      현재 참여율: {issue.data.participationRate}%
                                    {:else if issue.type === 'amount_excess'}
                                      현재: {issue.data.monthlyAmount?.toLocaleString()}원<br>
                                      예상: {issue.data.expectedMonthlyAmount?.toLocaleString()}원
                                    {:else if issue.type === 'duplicate_participation'}
                                      총 참여율: {issue.data.totalParticipationRate?.toFixed(1)}%
                                      {#if issue.data.conflictingProjects && issue.data.conflictingProjects.length > 0}
                                        <br>충돌 프로젝트: {issue.data.conflictingProjects.length}개
                                      {/if}
                                    {:else if issue.type === 'contract_missing' || issue.type === 'contract_period_mismatch'}
                                      참여 기간: {issue.data.participationPeriod}
                                    {/if}
                                  </div>
                                {/if}
                              </div>
                            {/each}
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {:else}
                    <div class="relative inline-block group">
                      <div class="animate-pulse bg-gray-300 rounded-full w-6 h-6 cursor-help hover:bg-gray-400 transition-colors"></div>
                      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        <div class="font-semibold text-gray-400">⏳ 검증 대기 중</div>
                        <div class="text-gray-500">아직 검증되지 않았습니다.</div>
                      </div>
                    </div>
                  {/if}
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-1 justify-center">
                  {#if editingMember && editingMember.id === member.id}
                    <div class="flex space-x-1">
                      <button
                        onclick={updateMember}
                        class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="저장"
                      >
                        <CheckIcon size={14} />
                      </button>
                      <button
                        onclick={cancelEditMember}
                        class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="취소"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  {:else}
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => editMember(member)}
                      disabled={editingMember !== null}
                    >
                      <EditIcon
                        size={16}
                        class="text-blue-600 mr-1" />
                      수정
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => removeMember(member.id)}
                      disabled={editingMember !== null}
                    >
                      <TrashIcon
                        size={16}
                        class="text-red-600 mr-1" />
                      삭제
                    </ThemeButton>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}

          {#if projectMembers.length === 0 && !addingMember}
            <tr>
              <td
                colspan="7"
                class="px-6 py-12 text-center text-gray-500">
                <UsersIcon
                  size={48}
                  class="mx-auto mb-2 text-gray-300" />
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

  <!-- 증빙 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 class="text-lg font-semibold text-gray-900">증빙 관리</h3>
        {#if projectBudgets.length > 0}
          <select
            bind:value={selectedEvidencePeriod}
            class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each projectBudgets as budget}
              <option value={getPeriodNumber(budget)}>
                {formatPeriodDisplay(budget)}
              </option>
            {/each}
          </select>
        {/if}
      </div>
      <ThemeButton
        onclick={() => showEvidenceModal = true}
        size="sm">
        <PlusIcon
          size={16}
          class="mr-2" />
        증빙 추가
      </ThemeButton>
    </div>

    {#if projectBudgets.length > 0}
      {@const currentBudget = projectBudgets.find(b => getPeriodNumber(b) === selectedEvidencePeriod) || projectBudgets[0]}
      {@const budgetCategories = [
        {
          id: 'personnel',
          type: 'personnel',
          name: '인건비',
          cash: parseFloat(currentBudget.personnel_cost) || 0,
          inKind: parseFloat(currentBudget.personnel_cost_in_kind) || 0
        },
        {
          id: 'material',
          type: 'material',
          name: '연구재료비',
          cash: parseFloat(currentBudget.research_material_cost) || 0,
          inKind: parseFloat(currentBudget.research_material_cost_in_kind) || 0
        },
        {
          id: 'activity',
          type: 'activity',
          name: '연구활동비',
          cash: parseFloat(currentBudget.research_activity_cost) || 0,
          inKind: parseFloat(currentBudget.research_activity_cost_in_kind) || 0
        },
        {
          id: 'stipend',
          type: 'stipend',
          name: '연구수당',
          cash: parseFloat(currentBudget.research_stipend) || 0,
          inKind: parseFloat(currentBudget.research_stipend_in_kind) || 0
        },
        {
          id: 'indirect',
          type: 'indirect',
          name: '간접비',
          cash: parseFloat(currentBudget.indirect_cost) || 0,
          inKind: parseFloat(currentBudget.indirect_cost_in_kind) || 0
        }
      ].filter(category => (category.cash + category.inKind) > 0)}

      {#if isLoadingEvidence}
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-500">증빙 데이터를 로드하는 중...</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each budgetCategories as budgetCategory}
            {@const categoryItems = evidenceItems.filter(item => item.category_name === budgetCategory.name)}
            {@const totalAmount = budgetCategory.cash + budgetCategory.inKind}
            {@const totalItems = categoryItems.length}
            {@const completedItems = categoryItems.filter(item => item.status === 'completed').length}
            {@const inProgressItems = categoryItems.filter(item => item.status === 'in_progress').length}
            {@const overallProgress = totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0}

            <div class="border border-gray-200 rounded-lg">
              <!-- 카테고리 헤더 -->
              <button
                type="button"
                class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 w-full text-left"
                onclick={() => expandedEvidenceSections[budgetCategory.type] = !expandedEvidenceSections[budgetCategory.type]}
                onkeydown={(e) => e.key === 'Enter' && (expandedEvidenceSections[budgetCategory.type] = !expandedEvidenceSections[budgetCategory.type])}
              >
                <div class="flex items-center space-x-3">
                  {#if expandedEvidenceSections[budgetCategory.type]}
                    <ChevronDownIcon
                      size={16}
                      class="text-gray-500" />
                  {:else}
                    <ChevronRightIcon
                      size={16}
                      class="text-gray-500" />
                  {/if}
                  <div>
                    <h4 class="text-md font-medium text-gray-900">{budgetCategory.name}</h4>
                    <div class="text-xs text-gray-500">
                      예산: {formatCurrency(totalAmount)} |
                      증빙: {totalItems}개 |
                      완료: {completedItems}개 |
                      진행중: {inProgressItems}개
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="flex items-center">
                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="h-2 rounded-full {overallProgress >= 100 ? 'bg-green-600' : overallProgress >= 70 ? 'bg-blue-600' : overallProgress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}"
                        style:width="{Math.min(overallProgress, 100)}%"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-600">{overallProgress}%</span>
                  </div>
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    onclick={() => openEvidenceDetail(budgetCategory)}>
                    <PlusIcon
                      size={14}
                      class="mr-1" />
                    추가
                  </ThemeButton>
                </div>
              </button>

              <!-- 카테고리 내용 -->
              {#if expandedEvidenceSections[budgetCategory.type]}
                <div class="p-4 border-t border-gray-200">
                  {#if categoryItems.length > 0}
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">증빙 항목</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">금액</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">담당자</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">진행률</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">마감일</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">상태</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">액션</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {#each categoryItems as item}
                            {@const isOverdue = new Date(item.due_date) < new Date() && item.status !== 'completed'}
                            <tr class="hover:bg-gray-50">
                              <!-- 증빙 항목 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                              </td>

                              <!-- 금액 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                <span class="font-medium">{formatCurrency(item.budget_amount)}</span>
                              </td>

                              <!-- 담당자 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                <span class="text-gray-600">{formatAssigneeNameFromFields(item)}</span>
                              </td>

                              <!-- 진행률 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                <div class="flex items-center">
                                  <div class="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      class="h-2 rounded-full {item.progress >= 100 ? 'bg-green-600' : item.progress >= 70 ? 'bg-blue-600' : item.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}"
                                      style:width="{Math.min(item.progress, 100)}%"
                                    ></div>
                                  </div>
                                  <span class="text-xs text-gray-600">{item.progress}%</span>
                                </div>
                              </td>

                              <!-- 마감일 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span class="text-xs {isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}">
                                  {item.due_date ? formatDate(item.due_date) : '-'}
                                </span>
                              </td>

                              <!-- 상태 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span
                                  class="px-2 py-1 text-xs font-medium rounded-full {item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      item.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                                      'bg-yellow-100 text-yellow-800'}">
                                  {item.status === 'completed' ? '완료' :
                                    item.status === 'in_progress' ? '진행중' :
                                      item.status === 'planned' ? '계획' : '검토중'}
                                </span>
                              </td>

                              <!-- 액션 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm font-medium text-center">
                                <div class="flex space-x-1 justify-center">
                                  <ThemeButton
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => openEvidenceDetail(item)}>
                                    <EditIcon
                                      size={12}
                                      class="mr-1" />
                                    상세
                                  </ThemeButton>
                                </div>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <div class="text-center py-8 text-gray-500">
                      <FileTextIcon
                        size={48}
                        class="mx-auto mb-2 text-gray-300" />
                      <p>등록된 증빙 항목이 없습니다.</p>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        class="mt-2"
                        onclick={() => openEvidenceDetail(budgetCategory)}>
                        <PlusIcon
                          size={14}
                          class="mr-1" />
                        첫 번째 증빙 추가
                      </ThemeButton>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="text-center py-8 text-gray-500">
        <FileTextIcon
          size={48}
          class="mx-auto mb-2 text-gray-300" />
        <p>등록된 사업비가 없어 증빙을 관리할 수 없습니다.</p>
      </div>
    {/if}
  </ThemeCard>

  <!-- 증빙 상세 모달 -->
  {#if showEvidenceDetailModal}
    <ThemeModal
      open={showEvidenceDetailModal}
      onclose={() => showEvidenceDetailModal = false}>
      <div class="p-6 max-w-4xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {selectedEvidenceItem?.name} 증빙 관리
          </h3>
          <button
            onclick={() => showEvidenceDetailModal = false}
            class="text-gray-400 hover:text-gray-600"
          >
            <XIcon size={20} />
          </button>
        </div>

        {#if selectedEvidenceItem}
          <div class="space-y-6">
            <!-- 기본 정보 -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-md font-medium text-gray-900 mb-3">기본 정보</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">예산액:</span>
                  <span class="ml-2 font-medium">
                    {formatCurrency(selectedEvidenceItem.budget_amount || 0)}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">담당자:</span>
                  <span class="ml-2">{formatAssigneeNameFromFields(selectedEvidenceItem, '미지정')}</span>
                </div>
                <div>
                  <span class="text-gray-600">진행률:</span>
                  <span class="ml-2">{selectedEvidenceItem.progress || 0}%</span>
                </div>
                <div>
                  <span class="text-gray-600">마감일:</span>
                  <span class="ml-2">{selectedEvidenceItem.due_date ? formatDate(selectedEvidenceItem.due_date) : '미설정'}</span>
                </div>
                <div>
                  <span class="text-gray-600">상태:</span>
                  <span class="ml-2">
                    {#if selectedEvidenceItem.status === 'completed'}
                      <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">완료</span>
                    {:else if selectedEvidenceItem.status === 'in_progress'}
                      <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">진행중</span>
                    {:else if selectedEvidenceItem.status === 'planned'}
                      <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">계획</span>
                    {:else}
                      <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{selectedEvidenceItem.status}</span>
                    {/if}
                  </span>
                </div>
                <div>
                  <span class="text-gray-600">카테고리:</span>
                  <span class="ml-2">{selectedEvidenceItem.category_name}</span>
                </div>
              </div>
            </div>

            <!-- 증빙 서류 관리 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h5 class="text-md font-medium text-gray-900">증빙 서류</h5>
                <ThemeButton size="sm">
                  <PlusIcon
                    size={14}
                    class="mr-1" />
                  서류 추가
                </ThemeButton>
              </div>

              <div class="space-y-2">
                {#if selectedEvidenceItem.documents && selectedEvidenceItem.documents.length > 0}
                  {#each selectedEvidenceItem.documents as document}
                    <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <div>
                          <div class="font-medium text-sm">{document.document_type}</div>
                          <div class="text-xs text-gray-500">{document.document_name}</div>
                          {#if document.uploader_name}
                            <div class="text-xs text-gray-400">업로더: {document.uploader_name}</div>
                          {/if}
                        </div>
                        {#if document.file_size}
                          <div class="text-xs text-gray-500">
                            크기: {(document.file_size / 1024).toFixed(1)}KB
                          </div>
                        {/if}
                      </div>
                      <div class="flex items-center space-x-2">
                        {#if document.status === 'approved'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            승인됨
                          </span>
                        {:else if document.status === 'reviewed'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            검토됨
                          </span>
                        {:else if document.status === 'rejected'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            거부됨
                          </span>
                        {:else}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            업로드됨
                          </span>
                        {/if}
                        <ThemeButton
                          variant="ghost"
                          size="sm">
                          <FileTextIcon
                            size={12}
                            class="mr-1" />
                          보기
                        </ThemeButton>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-8 text-gray-500">
                    <FileTextIcon
                      size={48}
                      class="mx-auto mb-2 text-gray-300" />
                    <p>등록된 증빙 서류가 없습니다.</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 증빙 일정 관리 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h5 class="text-md font-medium text-gray-900">증빙 일정</h5>
                <ThemeButton size="sm">
                  <PlusIcon
                    size={14}
                    class="mr-1" />
                  일정 추가
                </ThemeButton>
              </div>

              <div class="space-y-2">
                {#if selectedEvidenceItem.schedules && selectedEvidenceItem.schedules.length > 0}
                  {#each selectedEvidenceItem.schedules as schedule}
                    <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <div>
                          <div class="font-medium text-sm">{schedule.task_name}</div>
                          {#if schedule.description}
                            <div class="text-xs text-gray-500">{schedule.description}</div>
                          {/if}
                          <div class="text-xs text-gray-400">
                            마감일: {formatDate(schedule.due_date)}
                            {#if schedule.assignee_name}
                              | 담당자: {formatAssigneeName(schedule.assignee_name)}
                            {/if}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2">
                        {#if schedule.status === 'completed'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        {:else if schedule.status === 'in_progress'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            진행중
                          </span>
                        {:else if schedule.status === 'overdue'}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            지연
                          </span>
                        {:else}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            대기
                          </span>
                        {/if}
                        {#if schedule.priority === 'high'}
                          <span class="px-1 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            높음
                          </span>
                        {:else if schedule.priority === 'urgent'}
                          <span class="px-1 py-1 text-xs font-medium rounded-full bg-red-200 text-red-900">
                            긴급
                          </span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center py-8 text-gray-500">
                    <CalendarIcon
                      size={48}
                      class="mx-auto mb-2 text-gray-300" />
                    <p>등록된 증빙 일정이 없습니다.</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <ThemeButton
                variant="ghost"
                onclick={() => showEvidenceDetailModal = false}>
                닫기
              </ThemeButton>
              <ThemeButton>
                저장
              </ThemeButton>
            </div>
          </div>
        {/if}
      </div>
    </ThemeModal>
  {/if}

  <!-- 증빙 추가 모달 -->
  {#if showEvidenceModal}
    <ThemeModal
      open={showEvidenceModal}
      onclose={() => showEvidenceModal = false}>
      <div class="p-6 max-w-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">증빙 항목 추가</h3>
          <button
            onclick={() => showEvidenceModal = false}
            class="text-gray-400 hover:text-gray-600"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div class="space-y-4">
          <!-- 증빙 카테고리 선택 -->
          <div>
            <label
              for="evidence-category"
              class="block text-sm font-medium text-gray-700 mb-1">
              증빙 카테고리 *
            </label>
            <select
              id="evidence-category"
              bind:value={newEvidenceForm.categoryId}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">카테고리를 선택하세요</option>
              {#each evidenceCategories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <!-- 증빙 항목명 -->
          <div>
            <label
              for="evidence-name"
              class="block text-sm font-medium text-gray-700 mb-1">
              증빙 항목명 *
            </label>
            <input
              id="evidence-name"
              type="text"
              bind:value={newEvidenceForm.name}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 박기선 (2025-01), 모터 10개, 출장비 (국내)"
              required
            />
          </div>

          <!-- 설명 -->
          <div>
            <label
              for="evidence-description"
              class="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              id="evidence-description"
              bind:value={newEvidenceForm.description}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="증빙 항목에 대한 상세 설명"
            ></textarea>
          </div>

          <!-- 예산액 -->
          <div>
            <label
              for="evidence-budget-amount"
              class="block text-sm font-medium text-gray-700 mb-1">
              예산액 *
            </label>
            <input
              id="evidence-budget-amount"
              type="number"
              bind:value={newEvidenceForm.budgetAmount}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              required
            />
          </div>

          <!-- 담당자 -->
          <div>
            <label
              for="evidence-assignee"
              class="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <select
              id="evidence-assignee"
              bind:value={newEvidenceForm.assigneeId}
              onchange={validateEvidenceRegistration}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">담당자를 선택하세요</option>
              {#each availableEmployees as employee}
                <option value={employee.id}>
                  {formatEmployeeForSelect(employee)}
                </option>
              {/each}
            </select>
          </div>

          <!-- 마감일 -->
          <div>
            <label
              for="evidence-due-date"
              class="block text-sm font-medium text-gray-700 mb-1">
              마감일
            </label>
            <input
              id="evidence-due-date"
              type="date"
              bind:value={newEvidenceForm.dueDate}
              onchange={validateEvidenceRegistration}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 재직 기간 검증 결과 (인건비인 경우에만 표시) -->
          {#if newEvidenceForm.categoryId && evidenceCategories.find(cat => cat.id === newEvidenceForm.categoryId)?.name === '인건비'}
            {#if isValidatingEvidence}
              <div class="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div class="flex items-center space-x-2">
                  <RefreshCwIcon class="h-4 w-4 text-gray-600 animate-spin" />
                  <span class="text-sm text-gray-700">재직 기간 검증 중...</span>
                </div>
              </div>
            {:else if evidenceValidation}
              <div class="p-3 border rounded-md {evidenceValidation.validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                <div class="flex items-center space-x-2 mb-2">
                  {#if evidenceValidation.validation.isValid}
                    <ShieldCheckIcon class="h-4 w-4 text-green-600" />
                    <span class="text-sm font-medium text-green-800">재직 기간 검증 통과</span>
                  {:else}
                    <ShieldAlertIcon class="h-4 w-4 text-red-600" />
                    <span class="text-sm font-medium text-red-800">재직 기간 검증 실패</span>
                  {/if}
                </div>
                <p class="text-sm {evidenceValidation.validation.isValid ? 'text-green-700' : 'text-red-700'}">
                  {evidenceValidation.validation.message}
                </p>
                {#if evidenceValidation.validation.warnings && evidenceValidation.validation.warnings.length > 0}
                  <div class="mt-2">
                    {#each evidenceValidation.validation.warnings as warning}
                      <p class="text-sm text-yellow-700">⚠️ {warning}</p>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          {/if}
        </div>

        <!-- 액션 버튼 -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <ThemeButton
            variant="ghost"
            onclick={() => showEvidenceModal = false}>
            취소
          </ThemeButton>
          <ThemeButton
            onclick={handleAddEvidenceItem}
            disabled={isUpdating || (evidenceValidation && !evidenceValidation.validation.isValid)}
          >
            {isUpdating ? '추가 중...' : '추가'}
          </ThemeButton>
        </div>
      </div>
    </ThemeModal>
  {/if}

  <!-- 프로젝트 수정 모달 -->
  {#if showEditProjectModal}
    <ThemeModal
      open={showEditProjectModal}
      onclose={() => showEditProjectModal = false}>
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">프로젝트 수정</h3>

        <div class="space-y-4">
          <!-- 프로젝트 제목 -->
          <div>
            <label
              for="edit-project-title"
              class="block text-sm font-medium text-gray-700 mb-1">
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
            <label
              for="edit-project-code"
              class="block text-sm font-medium text-gray-700 mb-1">
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
            <label
              for="edit-project-description"
              class="block text-sm font-medium text-gray-700 mb-1">
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


          <!-- 프로젝트 상태 및 우선순위 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="edit-project-status"
                class="block text-sm font-medium text-gray-700 mb-1">
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
              <label
                for="edit-project-priority"
                class="block text-sm font-medium text-gray-700 mb-1">
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
              <label
                for="edit-project-sponsor"
                class="block text-sm font-medium text-gray-700 mb-1">
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
              <label
                for="edit-project-research-type"
                class="block text-sm font-medium text-gray-700 mb-1">
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
    <ThemeModal
      open={showDeleteConfirmModal}
      onclose={() => {
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
              <label
                for="delete-confirmation-code"
                class="block text-sm font-medium text-gray-700 mb-2">
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

  <!-- 검증 결과 모달 -->
  <ThemeModal
    open={showValidationModal}
    onclose={() => showValidationModal = false}
  >
    <div class="max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">프로젝트 검증 결과</h3>
        <ThemeButton
          variant="ghost"
          onclick={() => showValidationModal = false}>
          <XIcon size={16} />
        </ThemeButton>
      </div>

      {#if validationResults}
        <div class="space-y-6">
          <!-- 검증 요약 -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">검증 요약</h4>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">총 검증 항목:</span>
                <span class="font-medium ml-2">{validationResults.summary?.total || 0}</span>
              </div>
              <div>
                <span class="text-gray-600">유효:</span>
                <span class="font-medium text-green-600 ml-2">{validationResults.summary?.valid || 0}</span>
              </div>
              <div>
                <span class="text-gray-600">문제:</span>
                <span class="font-medium text-red-600 ml-2">{validationResults.summary?.invalid || 0}</span>
              </div>
            </div>
          </div>

          <!-- 스키마 검증 결과 -->
          {#if validationResults.schema}
            <div class="border rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">스키마 검증</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>데이터베이스 스키마:</span>
                  <span class={validationResults.schema.database?.isValid ? 'text-green-600' : 'text-red-600'}>
                    {validationResults.schema.database?.isValid ? '유효' : '문제 있음'}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>컬럼 명명 규칙:</span>
                  <span class={validationResults.schema.naming?.isValid ? 'text-green-600' : 'text-red-600'}>
                    {validationResults.schema.naming?.isValid ? '유효' : '문제 있음'}
                  </span>
                </div>
              </div>
            </div>
          {/if}

          <!-- 프로젝트 검증 결과 -->
          {#if validationResults.project}
            <div class="border rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">프로젝트 검증</h4>
              <div class="space-y-2 text-sm">
                {#each validationResults.project.validationResults || [] as result}
                  <div class="flex justify-between">
                    <span>{result.ruleName}:</span>
                    <span class={result.isValid ? 'text-green-600' : 'text-red-600'}>
                      {result.isValid ? '유효' : '문제 있음'}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- 문제점 목록 -->
          {#if validationResults.summary?.issues?.length > 0}
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 class="font-medium text-red-900 mb-3">발견된 문제점</h4>
              <ul class="space-y-1 text-sm text-red-800">
                {#each validationResults.summary.issues as issue}
                  <li>• {issue}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </ThemeModal>

{/if}
