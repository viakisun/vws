import { writable } from "svelte/store";

// Payroll 타입 정의
export interface Payroll {
  id: string;
  employeeId: string;
  payPeriod: {
    year: number;
    month: number;
  };
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: "pending" | "paid";
  createdAt: string;
  paidAt?: string;
}

// 상여금/성과급
export interface Bonus {
  id: string;
  employeeId: string;
  type: "performance" | "annual" | "special" | "project";
  amount: number;
  percentage?: number; // 기본급 대비 비율
  reason: string;
  performancePeriod?: {
    startDate: string;
    endDate: string;
  };
  approvedBy: string;
  approvedAt: string;
  paidAt?: string;
  status: "approved" | "paid";
  createdAt: string;
}

// 4대보험/퇴직연금
export interface InsuranceRecord {
  id: string;
  employeeId: string;
  insuranceType:
    | "national-pension"
    | "health-insurance"
    | "employment-insurance"
    | "workers-compensation"
    | "retirement-pension";
  monthlyPremium: number;
  employeeContribution: number; // 직원 부담금
  employerContribution: number; // 회사 부담금
  effectiveDate: string;
  endDate?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// 복지포인트
export interface WelfarePoint {
  id: string;
  employeeId: string;
  type:
    | "meal"
    | "transportation"
    | "culture"
    | "sports"
    | "education"
    | "health";
  amount: number;
  balance: number;
  expiryDate?: string;
  status: "active" | "expired" | "used";
  createdAt: string;
  updatedAt: string;
}

// 사내 복지제도
export interface WelfareProgram {
  id: string;
  name: string;
  description: string;
  category:
    | "health"
    | "education"
    | "culture"
    | "sports"
    | "family"
    | "flexible";
  benefitType: "monetary" | "service" | "facility" | "time";
  eligibility: string[]; // 대상 직원 조건
  applicationRequired: boolean;
  maxAmount?: number;
  coverage?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// 복지 신청
export interface WelfareApplication {
  id: string;
  employeeId: string;
  programId: string;
  programName: string;
  requestedAmount?: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  notes?: string;
}

// 경조사 지원
export interface EventSupport {
  id: string;
  employeeId: string;
  eventType: "wedding" | "birth" | "funeral" | "graduation" | "other";
  eventDate: string;
  relationship: string; // 본인, 배우자, 자녀, 부모 등
  amount: number;
  status: "pending" | "approved" | "paid";
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

// 초기 데이터
const initialBonuses: Bonus[] = [
  {
    id: "bonus-1",
    employeeId: "emp-1",
    type: "performance",
    amount: 2000000,
    percentage: 40,
    reason: "2023년 성과 평가 결과 우수",
    performancePeriod: {
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    },
    approvedBy: "emp-3",
    approvedAt: "2024-01-15T00:00:00Z",
    paidAt: "2024-01-31T00:00:00Z",
    status: "paid",
    createdAt: "2024-01-15T00:00:00Z",
  },
];

const initialInsuranceRecords: InsuranceRecord[] = [
  {
    id: "insurance-1",
    employeeId: "emp-1",
    insuranceType: "national-pension",
    monthlyPremium: 200000,
    employeeContribution: 100000,
    employerContribution: 100000,
    effectiveDate: "2023-01-15",
    status: "active",
    createdAt: "2023-01-15T00:00:00Z",
    updatedAt: "2023-01-15T00:00:00Z",
  },
  {
    id: "insurance-2",
    employeeId: "emp-1",
    insuranceType: "health-insurance",
    monthlyPremium: 150000,
    employeeContribution: 75000,
    employerContribution: 75000,
    effectiveDate: "2023-01-15",
    status: "active",
    createdAt: "2023-01-15T00:00:00Z",
    updatedAt: "2023-01-15T00:00:00Z",
  },
];

const initialWelfarePoints: WelfarePoint[] = [
  {
    id: "welfare-1",
    employeeId: "emp-1",
    type: "meal",
    amount: 200000,
    balance: 150000,
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-31T00:00:00Z",
  },
];

const initialWelfarePrograms: WelfareProgram[] = [
  {
    id: "program-1",
    name: "건강검진 지원",
    description: "연 1회 종합건강검진 비용 지원",
    category: "health",
    benefitType: "monetary",
    eligibility: ["all"],
    applicationRequired: true,
    maxAmount: 500000,
    coverage: "종합건강검진 비용",
    status: "active",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "program-2",
    name: "교육비 지원",
    description: "자격증 취득 및 교육 과정 비용 지원",
    category: "education",
    benefitType: "monetary",
    eligibility: ["all"],
    applicationRequired: true,
    maxAmount: 1000000,
    coverage: "교육비, 시험비, 교재비",
    status: "active",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
];

const initialWelfareApplications: WelfareApplication[] = [
  {
    id: "app-1",
    employeeId: "emp-1",
    programId: "program-1",
    programName: "건강검진 지원",
    requestedAmount: 300000,
    reason: "연간 종합건강검진",
    status: "approved",
    requestedAt: "2024-01-15T00:00:00Z",
    approvedBy: "emp-3",
    approvedAt: "2024-01-16T00:00:00Z",
    completedAt: "2024-01-20T00:00:00Z",
  },
];

const initialEventSupports: EventSupport[] = [
  {
    id: "event-1",
    employeeId: "emp-1",
    eventType: "wedding",
    eventDate: "2024-03-15",
    relationship: "본인",
    amount: 1000000,
    status: "approved",
    requestedAt: "2024-02-01T00:00:00Z",
    approvedBy: "emp-3",
    approvedAt: "2024-02-02T00:00:00Z",
  },
];

// 스토어 생성
export const bonuses = writable<Bonus[]>(initialBonuses);
export const insuranceRecords = writable<InsuranceRecord[]>(
  initialInsuranceRecords,
);
export const welfarePoints = writable<WelfarePoint[]>(initialWelfarePoints);
export const welfarePrograms = writable<WelfareProgram[]>(
  initialWelfarePrograms,
);
export const welfareApplications = writable<WelfareApplication[]>(
  initialWelfareApplications,
);
export const eventSupports = writable<EventSupport[]>(initialEventSupports);

// 급여 관리 함수들은 salary-store.ts로 이동됨

// 상여금 관리 함수들
export function addBonus(bonus: Omit<Bonus, "id" | "createdAt">) {
  const newBonus: Bonus = {
    ...bonus,
    id: `bonus-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  bonuses.update((current) => [...current, newBonus]);
}

export function payBonus(id: string) {
  bonuses.update((current) =>
    current.map((bonus) =>
      bonus.id === id
        ? { ...bonus, status: "paid", paidAt: new Date().toISOString() }
        : bonus,
    ),
  );
}

// 4대보험 관리 함수들
export function addInsuranceRecord(
  record: Omit<InsuranceRecord, "id" | "createdAt" | "updatedAt">,
) {
  const newRecord: InsuranceRecord = {
    ...record,
    id: `insurance-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  insuranceRecords.update((current) => [...current, newRecord]);
}

export function updateInsuranceRecord(
  id: string,
  updates: Partial<InsuranceRecord>,
) {
  insuranceRecords.update((current) =>
    current.map((record) =>
      record.id === id
        ? { ...record, ...updates, updatedAt: new Date().toISOString() }
        : record,
    ),
  );
}

// 복지포인트 관리 함수들
export function addWelfarePoint(
  point: Omit<WelfarePoint, "id" | "createdAt" | "updatedAt">,
) {
  const newPoint: WelfarePoint = {
    ...point,
    id: `welfare-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  welfarePoints.update((current) => [...current, newPoint]);
}

export function useWelfarePoint(id: string, amount: number) {
  welfarePoints.update((current) =>
    current.map((point) => {
      if (point.id === id) {
        const newBalance = point.balance - amount;
        return {
          ...point,
          balance: Math.max(0, newBalance),
          status: newBalance <= 0 ? "used" : point.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return point;
    }),
  );
}

// 복지제도 관리 함수들
export function addWelfareProgram(
  program: Omit<WelfareProgram, "id" | "createdAt" | "updatedAt">,
) {
  const newProgram: WelfareProgram = {
    ...program,
    id: `program-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  welfarePrograms.update((current) => [...current, newProgram]);
}

export function updateWelfareProgram(
  id: string,
  updates: Partial<WelfareProgram>,
) {
  welfarePrograms.update((current) =>
    current.map((program) =>
      program.id === id
        ? { ...program, ...updates, updatedAt: new Date().toISOString() }
        : program,
    ),
  );
}

// 복지 신청 관리 함수들
export function applyWelfare(
  application: Omit<WelfareApplication, "id" | "requestedAt">,
) {
  const newApplication: WelfareApplication = {
    ...application,
    id: `app-${Date.now()}`,
    requestedAt: new Date().toISOString(),
  };
  welfareApplications.update((current) => [...current, newApplication]);
}

export function approveWelfareApplication(id: string, approvedBy: string) {
  welfareApplications.update((current) =>
    current.map((app) =>
      app.id === id
        ? {
            ...app,
            status: "approved",
            approvedBy,
            approvedAt: new Date().toISOString(),
          }
        : app,
    ),
  );
}

export function rejectWelfareApplication(id: string, rejectionReason: string) {
  welfareApplications.update((current) =>
    current.map((app) =>
      app.id === id ? { ...app, status: "rejected", rejectionReason } : app,
    ),
  );
}

export function completeWelfareApplication(id: string) {
  welfareApplications.update((current) =>
    current.map((app) =>
      app.id === id
        ? { ...app, status: "completed", completedAt: new Date().toISOString() }
        : app,
    ),
  );
}

// 경조사 지원 관리 함수들
export function requestEventSupport(
  support: Omit<EventSupport, "id" | "requestedAt">,
) {
  const newSupport: EventSupport = {
    ...support,
    id: `event-${Date.now()}`,
    requestedAt: new Date().toISOString(),
  };
  eventSupports.update((current) => [...current, newSupport]);
}

export function approveEventSupport(id: string, approvedBy: string) {
  eventSupports.update((current) =>
    current.map((support) =>
      support.id === id
        ? {
            ...support,
            status: "approved",
            approvedBy,
            approvedAt: new Date().toISOString(),
          }
        : support,
    ),
  );
}

export function payEventSupport(id: string) {
  eventSupports.update((current) =>
    current.map((support) =>
      support.id === id
        ? { ...support, status: "paid", paidAt: new Date().toISOString() }
        : support,
    ),
  );
}

// 유틸리티 함수들
export function getPayrollsByEmployee(
  employeeId: string,
  payrollList: Payroll[],
): Payroll[] {
  return payrollList.filter((payroll) => payroll.employeeId === employeeId);
}

export function getBonusesByEmployee(
  employeeId: string,
  bonusList: Bonus[],
): Bonus[] {
  return bonusList.filter((bonus) => bonus.employeeId === employeeId);
}

export function getInsuranceRecordsByEmployee(
  employeeId: string,
  recordList: InsuranceRecord[],
): InsuranceRecord[] {
  return recordList.filter((record) => record.employeeId === employeeId);
}

export function getWelfarePointsByEmployee(
  employeeId: string,
  pointList: WelfarePoint[],
): WelfarePoint[] {
  return pointList.filter((point) => point.employeeId === employeeId);
}

export function getWelfareApplicationsByEmployee(
  employeeId: string,
  appList: WelfareApplication[],
): WelfareApplication[] {
  return appList.filter((app) => app.employeeId === employeeId);
}

export function getEventSupportsByEmployee(
  employeeId: string,
  supportList: EventSupport[],
): EventSupport[] {
  return supportList.filter((support) => support.employeeId === employeeId);
}

export function calculateMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number,
  payrollList: Payroll[],
): {
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  payrollCount: number;
} {
  const monthlyPayrolls = payrollList.filter(
    (payroll) =>
      payroll.employeeId === employeeId &&
      payroll.payPeriod.year === year &&
      payroll.payPeriod.month === month,
  );

  const totalGrossPay = monthlyPayrolls.reduce(
    (sum, payroll) => sum + payroll.grossPay,
    0,
  );
  const totalDeductions = monthlyPayrolls.reduce(
    (sum, payroll) => sum + payroll.totalDeductions,
    0,
  );
  const totalNetPay = monthlyPayrolls.reduce(
    (sum, payroll) => sum + payroll.netPay,
    0,
  );

  return {
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    payrollCount: monthlyPayrolls.length,
  };
}

export function calculateAnnualCompensation(
  employeeId: string,
  year: number,
  payrollList: Payroll[],
  bonusList: Bonus[],
): {
  totalSalary: number;
  totalBonus: number;
  totalCompensation: number;
} {
  const annualPayrolls = payrollList.filter(
    (payroll) =>
      payroll.employeeId === employeeId && payroll.payPeriod.year === year,
  );

  const annualBonuses = bonusList.filter(
    (bonus) =>
      bonus.employeeId === employeeId &&
      bonus.performancePeriod &&
      new Date(bonus.performancePeriod.startDate).getFullYear() === year,
  );

  const totalSalary = annualPayrolls.reduce(
    (sum, payroll) => sum + payroll.grossPay,
    0,
  );
  const totalBonus = annualBonuses.reduce(
    (sum, bonus) => sum + bonus.amount,
    0,
  );
  const totalCompensation = totalSalary + totalBonus;

  return {
    totalSalary,
    totalBonus,
    totalCompensation,
  };
}
