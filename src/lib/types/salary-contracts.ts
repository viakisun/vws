// 급여 계약 관련 타입 정의

export interface SalaryContract {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  annualSalary: number;
  monthlySalary: number;
  contractType: "full_time" | "part_time" | "contract" | "intern";
  status: "active" | "expired" | "terminated" | "draft";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // 조인된 데이터
  employeeName?: string;
  employeeIdNumber?: string;
  department?: string;
  position?: string;
  contractEndDisplay?: string;
  statusDisplay?: string;
}

export interface CreateSalaryContractRequest {
  employeeId: string;
  startDate: string;
  endDate?: string;
  annualSalary: number;
  monthlySalary: number;
  contractType: "full_time" | "part_time" | "contract" | "intern";
  status?: "active" | "expired" | "terminated" | "draft";
  notes?: string;
}

export interface UpdateSalaryContractRequest {
  startDate?: string;
  endDate?: string;
  annualSalary?: number;
  monthlySalary?: number;
  contractType?: "full_time" | "part_time" | "contract" | "intern";
  status?: "active" | "expired" | "terminated" | "draft";
  notes?: string;
}

export interface SalaryContractFilter {
  employeeId?: string;
  department?: string;
  position?: string;
  contractType?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 급여 계약 통계
export interface SalaryContractStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  averageAnnualSalary: number;
  averageMonthlySalary: number;
  totalAnnualSalary: number;
  totalMonthlySalary: number;
  contractsByType: Record<string, number>;
  contractsByDepartment: Record<string, number>;
}

// 현재 유효한 급여 정보
export interface CurrentSalaryInfo {
  employeeId: string;
  employeeName: string;
  employeeIdNumber: string;
  department: string;
  position: string;
  currentContract: SalaryContract;
  contractHistory: SalaryContract[];
}
