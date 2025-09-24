// R&D 통합관리 시스템 예산 카테고리 마스터 및 워크플로우 관리

import { derived, writable } from "svelte/store";
import {
  UserRole,
  type BudgetCategory,
  type RequiredDocument,
  type UUID,
  type WorkflowStep,
} from "./types";

// ===== 예산 카테고리 마스터 데이터 =====
const BUDGET_CATEGORY_MASTER: BudgetCategory[] = [
  {
    id: "cat-001",
    code: "PERSONNEL_CASH",
    name: "Personnel Cost (Cash)",
    nameKo: "인건비(현금)",
    description: "연구원 급여 및 현금 지급 인건비",
    requiredDocuments: [
      {
        type: "PARTICIPATION_ASSIGNMENT",
        required: true,
        templateId: "TMP-PA-001",
        description: "참여배정서",
      },
      {
        type: "SALARY_SLIP",
        required: true,
        templateId: "TMP-SS-001",
        description: "급여명세",
      },
      {
        type: "INSURANCE_DATA",
        required: true,
        templateId: "TMP-ID-001",
        description: "4대보험/원천세 자료",
      },
      {
        type: "SALARY_DISTRIBUTION",
        required: true,
        templateId: "TMP-SD-001",
        description: "급여배분표",
      },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 3,
      },
    ],
    defaultSlaDays: 5,
    defaultOwners: ["경영지원팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-002",
    code: "PERSONNEL_IN_KIND",
    name: "Personnel Cost (In-Kind)",
    nameKo: "인건비(현물)",
    description: "연구원 현물 지급 인건비",
    requiredDocuments: [
      {
        type: "PARTICIPATION_ASSIGNMENT",
        required: true,
        templateId: "TMP-PA-001",
        description: "참여배정서",
      },
      {
        type: "IN_KIND_EVIDENCE",
        required: true,
        templateId: "TMP-IK-001",
        description: "현물지급 증빙",
      },
      {
        type: "SALARY_DISTRIBUTION",
        required: true,
        templateId: "TMP-SD-001",
        description: "급여배분표",
      },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 3,
      },
    ],
    defaultSlaDays: 5,
    defaultOwners: ["경영지원팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-003",
    code: "MATERIAL",
    name: "Material Cost",
    nameKo: "재료비",
    description: "연구용 재료 및 소모품 구매비",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      {
        type: "QUOTE",
        required: true,
        templateId: "TMP-QTE-001",
        description: "견적서 1개 이상",
      },
      {
        type: "PURCHASE_ORDER",
        required: true,
        templateId: "TMP-PO-001",
        description: "발주서",
      },
      { type: "TAX_INVOICE", required: true, description: "세금계산서" },
      { type: "DELIVERY_NOTE", required: true, description: "납품서" },
      {
        type: "INSPECTION_REPORT",
        required: true,
        templateId: "TMP-INS-001",
        description: "검수보고서",
      },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 2,
        role: UserRole.DEPARTMENT_HEAD,
        action: "execute",
        required: true,
        slaDays: 5,
      },
      {
        step: 3,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 3,
      },
    ],
    defaultSlaDays: 10,
    defaultOwners: ["구매팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-004",
    code: "RESEARCH_ACTIVITY",
    name: "Research Activity Cost",
    nameKo: "연구활동비",
    description: "연구 활동 관련 비용",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      {
        type: "ACTIVITY_PLAN",
        required: true,
        templateId: "TMP-AP-001",
        description: "활동계획서/보고서",
      },
      { type: "RECEIPT", required: true, description: "영수증" },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 1,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 4,
      },
    ],
    defaultSlaDays: 5,
    defaultOwners: ["PM"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-005",
    code: "TRAVEL",
    name: "Travel Cost",
    nameKo: "출장비",
    description: "출장 관련 비용",
    requiredDocuments: [
      {
        type: "TRAVEL_PLAN",
        required: true,
        templateId: "TMP-TP-001",
        description: "출장계획서",
      },
      {
        type: "TRAVEL_RECEIPT",
        required: true,
        description: "교통/숙박 영수증",
      },
      {
        type: "TRAVEL_REPORT",
        required: true,
        templateId: "TMP-TR-001",
        description: "출장보고서",
      },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 1,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 2,
      },
    ],
    defaultSlaDays: 3,
    defaultOwners: ["PM", "담당자"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-006",
    code: "MEETING",
    name: "Meeting Cost",
    nameKo: "회의비",
    description: "회의 관련 비용",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      {
        type: "ATTENDEE_LIST",
        required: true,
        templateId: "TMP-AL-001",
        description: "참석자 명단",
      },
      { type: "RECEIPT", required: true, description: "영수증" },
      {
        type: "MEETING_MINUTES",
        required: true,
        templateId: "TMP-MM-001",
        description: "회의록",
      },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.DEPARTMENT_HEAD,
        action: "execute",
        required: true,
        slaDays: 1,
      },
      {
        step: 2,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 1,
      },
      {
        step: 3,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 1,
      },
    ],
    defaultSlaDays: 3,
    defaultOwners: ["담당부서"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-007",
    code: "PATENT",
    name: "Patent Application Cost",
    nameKo: "특허출원비",
    description: "특허 출원 관련 비용",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      {
        type: "PATENT_SPECIFICATION",
        required: true,
        templateId: "TMP-PS-001",
        description: "출원명세서",
      },
      {
        type: "POWER_OF_ATTORNEY",
        required: true,
        templateId: "TMP-POA-001",
        description: "위임장",
      },
      { type: "FEE_RECEIPT", required: true, description: "수수료 영수증" },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 2,
        role: UserRole.DEPARTMENT_HEAD,
        action: "execute",
        required: true,
        slaDays: 3,
      },
      {
        step: 3,
        role: UserRole.LAB_HEAD,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 4,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 3,
      },
    ],
    defaultSlaDays: 10,
    defaultOwners: ["R&D전략팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-008",
    code: "RESEARCH_STIPEND",
    name: "Research Stipend",
    nameKo: "연구수당",
    description: "연구원 연구수당 지급",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      {
        type: "PARTICIPATION_ASSIGNMENT",
        required: true,
        templateId: "TMP-PA-001",
        description: "참여배정서",
      },
      {
        type: "STIPEND_CALCULATION",
        required: true,
        templateId: "TMP-SC-001",
        description: "연구수당 산정서",
      },
      { type: "RECEIPT", required: true, description: "지급 영수증" },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 2,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 3,
      },
    ],
    defaultSlaDays: 5,
    defaultOwners: ["경영지원팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-009",
    code: "OFFICE_SUPPLIES",
    name: "Office Supplies Cost",
    nameKo: "사무용품비",
    description: "사무용품 구매 비용",
    requiredDocuments: [
      {
        type: "REQUISITION",
        required: true,
        templateId: "TMP-REQ-001",
        description: "기안서",
      },
      { type: "QUOTE", required: true, description: "견적/영수증" },
      { type: "RECEIPT", required: true, description: "수령증" },
    ],
    defaultWorkflow: [
      {
        step: 1,
        role: UserRole.PM,
        action: "approve",
        required: true,
        slaDays: 1,
      },
      {
        step: 2,
        role: UserRole.MANAGEMENT_SUPPORT,
        action: "approve",
        required: true,
        slaDays: 2,
      },
    ],
    defaultSlaDays: 3,
    defaultOwners: ["총무팀"],
    active: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ===== 예산 카테고리 스토어 =====
export const budgetCategories = writable<BudgetCategory[]>(
  BUDGET_CATEGORY_MASTER,
);

// ===== 활성 카테고리만 필터링 =====
export const activeBudgetCategories = derived(
  budgetCategories,
  ($budgetCategories) => $budgetCategories.filter((cat) => cat.active),
);

// ===== 카테고리별 그룹화 =====
export const budgetCategoriesByType = derived(
  activeBudgetCategories,
  ($activeBudgetCategories) => {
    const groups: Record<string, BudgetCategory[]> = {
      인건비: [],
      재료비: [],
      연구활동비: [],
      연구수당: [],
      출장비: [],
      회의비: [],
      특허출원비: [],
      사무용품비: [],
      기타: [],
    };

    $activeBudgetCategories.forEach((category) => {
      if (category.code.includes("PERSONNEL")) {
        groups["인건비"].push(category);
      } else if (category.code === "MATERIAL") {
        groups["재료비"].push(category);
      } else if (category.code === "RESEARCH_ACTIVITY") {
        groups["연구활동비"].push(category);
      } else if (category.code === "RESEARCH_STIPEND") {
        groups["연구수당"].push(category);
      } else if (category.code === "TRAVEL") {
        groups["출장비"].push(category);
      } else if (category.code === "MEETING") {
        groups["회의비"].push(category);
      } else if (category.code === "PATENT") {
        groups["특허출원비"].push(category);
      } else if (category.code === "OFFICE_SUPPLIES") {
        groups["사무용품비"].push(category);
      } else {
        groups["기타"].push(category);
      }
    });

    return groups;
  },
);

// ===== 예산 카테고리 관리 함수들 =====

/**
 * 코드로 예산 카테고리 찾기
 */
export function getBudgetCategoryByCode(
  code: string,
): BudgetCategory | undefined {
  let categories: BudgetCategory[] = [];
  budgetCategories.subscribe((value) => (categories = value))();
  return categories.find((cat) => cat.code === code);
}

/**
 * ID로 예산 카테고리 찾기
 */
export function getBudgetCategoryById(id: UUID): BudgetCategory | undefined {
  let categories: BudgetCategory[] = [];
  budgetCategories.subscribe((value) => (categories = value))();
  return categories.find((cat) => cat.id === id);
}

/**
 * 카테고리별 필수 문서 목록 가져오기
 */
export function getRequiredDocuments(categoryCode: string): RequiredDocument[] {
  const category = getBudgetCategoryByCode(categoryCode);
  return category?.requiredDocuments || [];
}

/**
 * 카테고리별 기본 워크플로우 가져오기
 */
export function getDefaultWorkflow(categoryCode: string): WorkflowStep[] {
  const category = getBudgetCategoryByCode(categoryCode);
  return category?.defaultWorkflow || [];
}

/**
 * 카테고리별 기본 SLA 일수 가져오기
 */
export function getDefaultSlaDays(categoryCode: string): number {
  const category = getBudgetCategoryByCode(categoryCode);
  return category?.defaultSlaDays || 5;
}

/**
 * 카테고리별 기본 담당자 가져오기
 */
export function getDefaultOwners(categoryCode: string): string[] {
  const category = getBudgetCategoryByCode(categoryCode);
  return category?.defaultOwners || [];
}

/**
 * 필수 문서 체크리스트 생성
 */
export function generateDocumentChecklist(categoryCode: string): Array<{
  type: string;
  required: boolean;
  description: string;
  templateId?: string;
  status: "pending" | "uploaded" | "verified";
  uploadedAt?: string;
  verifiedAt?: string;
}> {
  const requiredDocs = getRequiredDocuments(categoryCode);
  return requiredDocs.map((doc) => ({
    type: doc.type,
    required: doc.required,
    description: doc.description,
    templateId: doc.templateId,
    status: "pending" as const,
  }));
}

/**
 * 문서 체크리스트 완성도 확인
 */
export function checkDocumentCompleteness(
  categoryCode: string,
  uploadedDocuments: Array<{ type: string; uploadedAt: string }>,
): {
  completeness: number; // 0-100
  missing: string[];
  completed: string[];
} {
  const requiredDocs = getRequiredDocuments(categoryCode);
  const uploadedTypes = uploadedDocuments.map((doc) => doc.type);

  const completed = requiredDocs
    .filter((doc) => doc.required && uploadedTypes.includes(doc.type))
    .map((doc) => doc.type);

  const missing = requiredDocs
    .filter((doc) => doc.required && !uploadedTypes.includes(doc.type))
    .map((doc) => doc.type);

  const completeness =
    requiredDocs.length > 0
      ? Math.round((completed.length / requiredDocs.length) * 100)
      : 100;

  return { completeness, missing, completed };
}

/**
 * 워크플로우 단계별 SLA 확인
 */
export function checkWorkflowSla(
  categoryCode: string,
  currentStep: number,
  stepStartDate: string,
): {
  isOverdue: boolean;
  remainingDays: number;
  slaDays: number;
} {
  const workflow = getDefaultWorkflow(categoryCode);
  const currentWorkflowStep = workflow.find(
    (step) => step.step === currentStep,
  );

  if (!currentWorkflowStep) {
    return { isOverdue: false, remainingDays: 0, slaDays: 0 };
  }

  const startDate = new Date(stepStartDate);
  const now = new Date();
  const elapsedDays = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const remainingDays = currentWorkflowStep.slaDays - elapsedDays;
  const isOverdue = remainingDays < 0;

  return {
    isOverdue,
    remainingDays: Math.max(0, remainingDays),
    slaDays: currentWorkflowStep.slaDays,
  };
}

/**
 * 새 예산 카테고리 생성
 */
export function createBudgetCategory(
  category: Omit<BudgetCategory, "id" | "createdAt">,
): BudgetCategory {
  const newCategory: BudgetCategory = {
    ...category,
    id: `cat-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  budgetCategories.update((categories) => [...categories, newCategory]);
  return newCategory;
}

/**
 * 예산 카테고리 업데이트
 */
export function updateBudgetCategory(
  id: UUID,
  updates: Partial<BudgetCategory>,
): boolean {
  let updated = false;
  budgetCategories.update((categories) => {
    const index = categories.findIndex((cat) => cat.id === id);
    if (index !== -1) {
      categories[index] = {
        ...categories[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updated = true;
    }
    return categories;
  });
  return updated;
}

/**
 * 예산 카테고리 비활성화
 */
export function deactivateBudgetCategory(id: UUID): boolean {
  return updateBudgetCategory(id, { active: false });
}

/**
 * 예산 카테고리 삭제
 */
export function deleteBudgetCategory(id: UUID): boolean {
  let deleted = false;
  budgetCategories.update((categories) => {
    const filtered = categories.filter((cat) => cat.id !== id);
    deleted = filtered.length !== categories.length;
    return filtered;
  });
  return deleted;
}

/**
 * 카테고리별 통계 정보
 */
export function getCategoryStatistics(_categoryCode: string): {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  averageAmount: number;
  lastUsed: string | null;
} {
  // 실제로는 expenseItems 스토어에서 데이터를 가져와야 함
  // 여기서는 더미 데이터 반환
  return {
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    averageAmount: 0,
    lastUsed: null,
  };
}

/**
 * 템플릿 다운로드 URL 생성
 */
export function getTemplateDownloadUrl(templateId: string): string {
  return `/api/templates/${templateId}/download`;
}

/**
 * 카테고리별 권한 확인
 */
export function canManageCategory(
  categoryCode: string,
  userRoles: UserRole[],
): boolean {
  // 경영지원팀만 카테고리 관리 가능
  return userRoles.includes(UserRole.MANAGEMENT_SUPPORT);
}

/**
 * 카테고리 검색
 */
export function searchBudgetCategories(query: string): BudgetCategory[] {
  let categories: BudgetCategory[] = [];
  budgetCategories.subscribe((value) => (categories = value))();

  if (!query.trim()) return categories;

  const searchTerm = query.toLowerCase();
  return categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm) ||
      cat.nameKo.toLowerCase().includes(searchTerm) ||
      cat.code.toLowerCase().includes(searchTerm) ||
      cat.description.toLowerCase().includes(searchTerm),
  );
}

/**
 * 카테고리별 사용 빈도 통계
 */
export function getCategoryUsageStats(): Array<{
  category: BudgetCategory;
  usageCount: number;
  totalAmount: number;
  lastUsed: string | null;
}> {
  let categories: BudgetCategory[] = [];
  budgetCategories.subscribe((value) => (categories = value))();

  // 실제로는 expenseItems에서 통계를 계산해야 함
  // 여기서는 더미 데이터 반환
  return categories.map((category) => ({
    category,
    usageCount: Math.floor(Math.random() * 50),
    totalAmount: Math.floor(Math.random() * 100000000),
    lastUsed: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));
}

// ===== 내보내기 =====
export { BUDGET_CATEGORY_MASTER };
