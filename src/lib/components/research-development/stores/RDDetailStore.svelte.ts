/**
 * Project Detail Store - Centralized State Management
 *
 * All state for ProjectDetailView component
 * Using Svelte 5 runes for reactive state management
 */

// ============================================================================
// Types
// ============================================================================

export interface ModalStates {
  budget: boolean
  member: boolean
  editProject: boolean
  deleteConfirm: boolean
  evidence: boolean
  evidenceDetail: boolean
  budgetUpdateConfirm: boolean
  validation: boolean
}

export interface LoadingStates {
  updating: boolean
  deleting: boolean
  validating: boolean
  calculatingMonthly: boolean
  validatingEvidence: boolean
  loadingEvidence: boolean
  validatingMembers: boolean
  addingMember: boolean
}

export interface UIStates {
  budgetRefreshTrigger: number
  budgetUpdateKey: number
  evidenceRefreshKey: number
  isManualMonthlyAmount: boolean
  calculatedMonthlyAmount: number
  isPersonnelSummaryExpanded: boolean
  expandedEvidenceSections: {
    personnel: boolean
    material: boolean
    activity: boolean
    indirect: boolean
  }
}

export interface SelectedItems {
  budget: any | null
  member: any | null
  budgetForEvidence: any | null
  evidenceItem: any | null
  evidencePeriod: number
  deleteCode: string
  budgetUpdateData: any | null
}

export interface BudgetForm {
  periodNumber: number
  startDate: string
  endDate: string
  personnelCostCash: string
  researchMaterialCostCash: string
  researchActivityCostCash: string
  researchStipendCash: string
  indirectCostCash: string
  personnelCostInKind: string
  researchMaterialCostInKind: string
  researchActivityCostInKind: string
  researchStipendInKind: string
  indirectCostInKind: string
}

export interface ProjectForm {
  title: string // 사업명
  code: string // 과제 코드
  projectTaskName: string // 과제명
  sponsor: string // 주관기관
  sponsorContactName?: string // 주관기관 담당자 이름
  sponsorContactPhone?: string // 주관기관 담당자 전화번호
  sponsorContactEmail?: string // 주관기관 담당자 이메일
  managerEmployeeId: string // 과제책임자
  description: string
  status: string
  sponsorType: string
  priority: string
  researchType: string
  // 선택 필드 - 전담기관 정보
  dedicatedAgency?: string // 전담기관
  dedicatedAgencyContactName?: string // 전담기관 담당자 이름
  dedicatedAgencyContactPhone?: string // 전담기관 담당자 전화번호
  dedicatedAgencyContactEmail?: string // 전담기관 담당자 이메일
}

export interface MemberForm {
  employeeId: string
  role: string
  startDate: string
  endDate: string
  participationRate: number
  monthlyAmount: string
  contractMonthlySalary: string
  participationMonths: number
  cashAmount: string
  inKindAmount: string
}

export interface EvidenceForm {
  categoryId: string
  name: string
  description: string
  budgetAmount: string
  assigneeId: string
  dueDate: string
}

export interface Forms {
  budget: BudgetForm
  project: ProjectForm
  member: MemberForm
  newEvidence: EvidenceForm
}

export interface ValidationData {
  results: any | null
  history: any[]
  autoEnabled: boolean
  evidence: any | null
  categories: any[]
  items: any[]
}

export interface EditProjectForm {
  title: string
  description: string
  sponsorType: string
  sponsorName: string
  startDate: string
  endDate: string
  budgetTotal: string
  researchType: string
  priority: string
  status: string
}

// ============================================================================
// Store Class
// ============================================================================

export class RDDetailStore {
  // Modal States
  modals = $state<ModalStates>({
    budget: false,
    member: false,
    editProject: false,
    deleteConfirm: false,
    evidence: false,
    evidenceDetail: false,
    budgetUpdateConfirm: false,
    validation: false,
  })

  // Loading States
  loading = $state<LoadingStates>({
    updating: false,
    deleting: false,
    validating: false,
    calculatingMonthly: false,
    validatingEvidence: false,
    loadingEvidence: false,
    validatingMembers: false,
    addingMember: false,
  })

  // UI States
  ui = $state<UIStates>({
    budgetRefreshTrigger: 0,
    budgetUpdateKey: 0,
    evidenceRefreshKey: 0,
    isManualMonthlyAmount: false,
    calculatedMonthlyAmount: 0,
    isPersonnelSummaryExpanded: false,
    expandedEvidenceSections: {
      personnel: true,
      material: true,
      activity: true,
      indirect: true,
    },
  })

  // Selected Items
  selected = $state<SelectedItems>({
    budget: null,
    member: null,
    budgetForEvidence: null,
    evidenceItem: null,
    evidencePeriod: 1,
    deleteCode: '',
    budgetUpdateData: null,
  })

  // Forms
  forms = $state<Forms>({
    budget: {
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
      indirectCostInKind: '',
    },
    project: {
      title: '',
      code: '',
      projectTaskName: '',
      sponsor: '',
      managerEmployeeId: '',
      description: '',
      status: 'active',
      sponsorType: 'internal',
      priority: 'medium',
      researchType: 'applied',
      dedicatedAgency: '',
      dedicatedAgencyContactName: '',
      dedicatedAgencyContactPhone: '',
      dedicatedAgencyContactEmail: '',
    },
    member: {
      employeeId: '',
      role: 'researcher',
      startDate: '',
      endDate: '',
      participationRate: 100,
      monthlyAmount: '0',
      contractMonthlySalary: '0',
      participationMonths: 0,
      cashAmount: '0',
      inKindAmount: '0',
    },
    newEvidence: {
      categoryId: '',
      name: '',
      description: '',
      budgetAmount: '',
      assigneeId: '',
      dueDate: '',
    },
  })

  // Validation Data
  validation = $state<ValidationData>({
    results: null,
    history: [],
    autoEnabled: true,
    evidence: null,
    categories: [],
    items: [],
  })

  // Edit Project Form
  editProject = $state<EditProjectForm>({
    title: '',
    description: '',
    sponsorType: '',
    sponsorName: '',
    startDate: '',
    endDate: '',
    budgetTotal: '',
    researchType: '',
    priority: '',
    status: '',
  })

  // Data Lists
  data = $state({
    projectMembers: [] as any[],
    projectBudgets: [] as any[],
    budgetCategories: [] as any[],
    availableEmployees: [] as any[],
    evidenceList: [] as any[],
    evidenceTypes: [] as any[],
    memberValidation: null as any,
    memberValidationLastChecked: null as Date | null,
    memberValidationStatuses: {} as Record<string, any>,
  })

  // ============================================================================
  // Actions
  // ============================================================================

  // Modal Actions
  openModal(modal: keyof ModalStates): void {
    this.modals[modal] = true
  }

  closeModal(modal: keyof ModalStates): void {
    this.modals[modal] = false
  }

  closeAllModals(): void {
    Object.keys(this.modals).forEach((key) => {
      this.modals[key as keyof ModalStates] = false
    })
  }

  // Loading Actions
  setLoading(key: keyof LoadingStates, value: boolean): void {
    this.loading[key] = value
  }

  // UI Actions
  toggleEvidenceSection(section: keyof UIStates['expandedEvidenceSections']): void {
    this.ui.expandedEvidenceSections[section] = !this.ui.expandedEvidenceSections[section]
  }

  incrementBudgetRefresh(): void {
    this.ui.budgetRefreshTrigger++
  }

  incrementBudgetUpdateKey(): void {
    this.ui.budgetUpdateKey++
  }

  incrementEvidenceRefresh(): void {
    this.ui.evidenceRefreshKey++
  }

  // Form Actions
  resetForm(formName: keyof Forms): void {
    switch (formName) {
      case 'budget':
        this.forms.budget = {
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
          indirectCostInKind: '',
        }
        break
      case 'member':
        this.forms.member = {
          employeeId: '',
          role: 'researcher',
          startDate: '',
          endDate: '',
          participationRate: 100,
          monthlyAmount: '0',
          contractMonthlySalary: '0',
          participationMonths: 0,
          cashAmount: '0',
          inKindAmount: '0',
        }
        break
      case 'newEvidence':
        this.forms.newEvidence = {
          categoryId: '',
          name: '',
          description: '',
          budgetAmount: '',
          assigneeId: '',
          dueDate: '',
        }
        break
    }
  }

  // Reset all state
  reset(): void {
    this.closeAllModals()
    Object.keys(this.loading).forEach((key) => {
      this.loading[key as keyof LoadingStates] = false
    })
    this.data.projectMembers = []
    this.data.projectBudgets = []
    this.validation.results = null
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export function createRDDetailStore(): RDDetailStore {
  return new RDDetailStore()
}
