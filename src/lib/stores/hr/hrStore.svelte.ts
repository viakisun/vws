/**
 * HR Store - Unified State Management
 *
 * Svelte 5 runes 기반 통합 인사 관리 스토어
 * Clean Architecture: 상태 관리 계층
 */

import type {
  Employee,
  Department,
  Position,
  Executive,
  JobTitle,
  LeaveRequest,
  PerformanceReview,
  TrainingProgram,
} from '$lib/types/hr'

// ============================================================================
// Types
// ============================================================================

export interface HRData {
  employees: Employee[]
  departments: Department[]
  positions: Position[]
  executives: Executive[]
  jobTitles: JobTitle[]
  leaveRequests: LeaveRequest[]
  performanceReviews: PerformanceReview[]
  trainingPrograms: TrainingProgram[]
}

export interface HRFilters {
  searchTerm: string
  status: 'all' | 'active' | 'inactive' | 'on-leave' | 'terminated'
  department: string
  position: string
  employmentType: 'all' | 'full-time' | 'part-time' | 'contract' | 'intern'
  level: 'all' | 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'
}

export interface HRModals {
  showEmployeeModal: boolean
  showDepartmentModal: boolean
  showPositionModal: boolean
  showExecutiveModal: boolean
  showJobTitleModal: boolean
  showLeaveModal: boolean
  showPerformanceModal: boolean
  showTrainingModal: boolean
  showDeleteConfirm: boolean
  showDetailView: boolean
}

export interface HRForms {
  employee: Partial<Employee>
  department: Partial<Department>
  position: Partial<Position>
  executive: Partial<Executive>
  jobTitle: Partial<JobTitle>
  leaveRequest: Partial<LeaveRequest>
  performanceReview: Partial<PerformanceReview>
  trainingProgram: Partial<TrainingProgram>
}

export interface HRSelected {
  editingEmployee: Employee | null
  editingDepartment: Department | null
  editingPosition: Position | null
  editingExecutive: Executive | null
  editingJobTitle: JobTitle | null
  editingLeaveRequest: LeaveRequest | null
  editingPerformanceReview: PerformanceReview | null
  editingTrainingProgram: TrainingProgram | null
  itemToDelete: { type: string; item: any } | null
}

// ============================================================================
// Store Class
// ============================================================================

export class HRStore {
  // State
  data = $state<HRData>({
    employees: [],
    departments: [],
    positions: [],
    executives: [],
    jobTitles: [],
    leaveRequests: [],
    performanceReviews: [],
    trainingPrograms: [],
  })

  filters = $state<HRFilters>({
    searchTerm: '',
    status: 'all',
    department: 'all',
    position: 'all',
    employmentType: 'all',
    level: 'all',
  })

  modals = $state<HRModals>({
    showEmployeeModal: false,
    showDepartmentModal: false,
    showPositionModal: false,
    showExecutiveModal: false,
    showJobTitleModal: false,
    showLeaveModal: false,
    showPerformanceModal: false,
    showTrainingModal: false,
    showDeleteConfirm: false,
    showDetailView: false,
  })

  forms = $state<HRForms>({
    employee: {},
    department: {},
    position: {},
    executive: {},
    jobTitle: {},
    leaveRequest: {},
    performanceReview: {},
    trainingProgram: {},
  })

  selected = $state<HRSelected>({
    editingEmployee: null,
    editingDepartment: null,
    editingPosition: null,
    editingExecutive: null,
    editingJobTitle: null,
    editingLeaveRequest: null,
    editingPerformanceReview: null,
    editingTrainingProgram: null,
    itemToDelete: null,
  })

  loading = $state(false)
  error = $state<string | null>(null)

  // ============================================================================
  // Computed Properties
  // ============================================================================

  get totalEmployees() {
    return this.data.employees.length
  }

  get activeEmployees() {
    return this.data.employees.filter((e) => e.status === 'active').length
  }

  get departmentCount() {
    return this.data.departments.length
  }

  get averageTenure() {
    const activeEmps = this.data.employees.filter((e) => e.status === 'active')
    if (activeEmps.length === 0) return 0

    const totalYears = activeEmps.reduce((sum, emp) => {
      const years = new Date().getFullYear() - new Date(emp.hire_date).getFullYear()
      return sum + years
    }, 0)

    return Math.round(totalYears / activeEmps.length)
  }

  // ============================================================================
  // Data Management
  // ============================================================================

  setEmployees(employees: Employee[]) {
    this.data.employees = employees
  }

  setDepartments(departments: Department[]) {
    this.data.departments = departments
  }

  setPositions(positions: Position[]) {
    this.data.positions = positions
  }

  setExecutives(executives: Executive[]) {
    this.data.executives = executives
  }

  setJobTitles(jobTitles: JobTitle[]) {
    this.data.jobTitles = jobTitles
  }

  setLeaveRequests(requests: LeaveRequest[]) {
    this.data.leaveRequests = requests
  }

  setPerformanceReviews(reviews: PerformanceReview[]) {
    this.data.performanceReviews = reviews
  }

  setTrainingPrograms(programs: TrainingProgram[]) {
    this.data.trainingPrograms = programs
  }

  // ============================================================================
  // Filter Management
  // ============================================================================

  setSearchTerm(term: string) {
    this.filters.searchTerm = term
  }

  setStatusFilter(status: HRFilters['status']) {
    this.filters.status = status
  }

  setDepartmentFilter(department: string) {
    this.filters.department = department
  }

  setPositionFilter(position: string) {
    this.filters.position = position
  }

  setEmploymentTypeFilter(type: HRFilters['employmentType']) {
    this.filters.employmentType = type
  }

  setLevelFilter(level: HRFilters['level']) {
    this.filters.level = level
  }

  resetFilters() {
    this.filters = {
      searchTerm: '',
      status: 'all',
      department: 'all',
      position: 'all',
      employmentType: 'all',
      level: 'all',
    }
  }

  // ============================================================================
  // Modal Management
  // ============================================================================

  openEmployeeModal(employee?: Employee) {
    if (employee) {
      this.selected.editingEmployee = employee
      this.forms.employee = { ...employee }
    } else {
      this.selected.editingEmployee = null
      this.forms.employee = {}
    }
    this.modals.showEmployeeModal = true
  }

  closeEmployeeModal() {
    this.modals.showEmployeeModal = false
    this.selected.editingEmployee = null
    this.forms.employee = {}
  }

  openDepartmentModal(department?: Department) {
    if (department) {
      this.selected.editingDepartment = department
      this.forms.department = { ...department }
    } else {
      this.selected.editingDepartment = null
      this.forms.department = {}
    }
    this.modals.showDepartmentModal = true
  }

  closeDepartmentModal() {
    this.modals.showDepartmentModal = false
    this.selected.editingDepartment = null
    this.forms.department = {}
  }

  openPositionModal(position?: Position) {
    if (position) {
      this.selected.editingPosition = position
      this.forms.position = { ...position }
    } else {
      this.selected.editingPosition = null
      this.forms.position = {}
    }
    this.modals.showPositionModal = true
  }

  closePositionModal() {
    this.modals.showPositionModal = false
    this.selected.editingPosition = null
    this.forms.position = {}
  }

  openJobTitleModal(jobTitle?: JobTitle) {
    if (jobTitle) {
      this.selected.editingJobTitle = jobTitle
      this.forms.jobTitle = { ...jobTitle }
    } else {
      this.selected.editingJobTitle = null
      this.forms.jobTitle = {}
    }
    this.modals.showJobTitleModal = true
  }

  closeJobTitleModal() {
    this.modals.showJobTitleModal = false
    this.selected.editingJobTitle = null
    this.forms.jobTitle = {}
  }

  openDeleteConfirm(type: string, item: any) {
    this.selected.itemToDelete = { type, item }
    this.modals.showDeleteConfirm = true
  }

  closeDeleteConfirm() {
    this.modals.showDeleteConfirm = false
    this.selected.itemToDelete = null
  }

  // ============================================================================
  // Form Management
  // ============================================================================

  updateEmployeeForm(field: keyof Employee, value: any) {
    this.forms.employee = { ...this.forms.employee, [field]: value }
  }

  updateDepartmentForm(field: keyof Department, value: any) {
    this.forms.department = { ...this.forms.department, [field]: value }
  }

  updatePositionForm(field: keyof Position, value: any) {
    this.forms.position = { ...this.forms.position, [field]: value }
  }

  resetForms() {
    this.forms = {
      employee: {},
      department: {},
      position: {},
      executive: {},
      jobTitle: {},
      leaveRequest: {},
      performanceReview: {},
      trainingProgram: {},
    }
  }

  // ============================================================================
  // Error Management
  // ============================================================================

  setLoading(isLoading: boolean) {
    this.loading = isLoading
  }

  setError(error: string | null) {
    this.error = error
  }

  clearError() {
    this.error = null
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const hrStore = new HRStore()
