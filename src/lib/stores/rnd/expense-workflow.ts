// R&D 통합관리 시스템 지출/증빙 표준 흐름 및 결재 시스템

import { derived, writable } from "svelte/store";
import {
  checkDocumentCompleteness,
  getDefaultWorkflow,
} from "./budget-categories";
import type {
  Approval,
  ApprovalStatus,
  ApprovalWorkflow,
  Document,
  DocumentType,
  ExpenseItem,
  UUID,
} from "./types";

// ===== 지출 항목 스토어 =====
export const expenseItems = writable<ExpenseItem[]>([]);

// ===== 문서 스토어 =====
export const documents = writable<Document[]>([]);

// ===== 결재 스토어 =====
export const approvals = writable<Approval[]>([]);

// ===== 결재 워크플로우 스토어 =====
export const approvalWorkflows = writable<ApprovalWorkflow[]>([]);

// ===== 필터링된 데이터 =====
export const pendingExpenses = derived(expenseItems, ($expenseItems) =>
  $expenseItems.filter(
    (expense) =>
      expense.status === "pending_approval" || expense.status === "draft",
  ),
);

export const approvedExpenses = derived(expenseItems, ($expenseItems) =>
  $expenseItems.filter(
    (expense) =>
      expense.status === "approved" ||
      expense.status === "executed" ||
      expense.status === "completed",
  ),
);

export const rejectedExpenses = derived(expenseItems, ($expenseItems) =>
  $expenseItems.filter((expense) => expense.status === "rejected"),
);

// ===== 지출 항목 관리 함수들 =====

/**
 * 새 지출 요청 생성
 */
export function createExpenseRequest(expenseData: {
  projectId: UUID;
  categoryCode: string;
  requesterId: UUID;
  amount: number;
  currency: "KRW" | "USD" | "EUR";
  description: string;
  deptOwner: string;
}): ExpenseItem {
  const newExpense: ExpenseItem = {
    id: `exp-${Date.now()}`,
    ...expenseData,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  expenseItems.update((items) => [...items, newExpense]);

  // 결재 워크플로우 초기화
  initializeApprovalWorkflow(newExpense.id, expenseData.categoryCode);

  return newExpense;
}

/**
 * 지출 항목 업데이트
 */
export function updateExpenseItem(
  id: UUID,
  updates: Partial<ExpenseItem>,
): boolean {
  let updated = false;
  expenseItems.update((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updated = true;
    }
    return items;
  });
  return updated;
}

/**
 * 지출 항목 삭제
 */
export function deleteExpenseItem(id: UUID): boolean {
  let deleted = false;
  expenseItems.update((items) => {
    const filtered = items.filter((item) => item.id !== id);
    deleted = filtered.length !== items.length;
    return filtered;
  });

  if (deleted) {
    // 관련 문서와 결재 정보도 삭제
    documents.update((docs) => docs.filter((doc) => doc.expenseId !== id));
    approvals.update((apps) => apps.filter((app) => app.subjectId !== id));
    approvalWorkflows.update((workflows) =>
      workflows.filter((workflow) => workflow.subjectId !== id),
    );
  }

  return deleted;
}

// ===== 문서 관리 함수들 =====

/**
 * 문서 업로드
 */
export function uploadDocument(documentData: {
  expenseId?: UUID;
  projectId?: UUID;
  type: DocumentType;
  filename: string;
  originalFilename: string;
  storageUrl: string;
  sha256: string;
  meta?: Record<string, unknown>;
}): Document {
  const newDocument: Document = {
    id: `doc-${Date.now()}`,
    ...documentData,
    version: 1,
    createdAt: new Date().toISOString(),
  };

  documents.update((docs) => [...docs, newDocument]);

  // 지출 항목의 문서 완성도 확인
  if (documentData.expenseId) {
    checkExpenseDocumentCompleteness(documentData.expenseId);
  }

  return newDocument;
}

/**
 * 문서 서명
 */
export function signDocument(documentId: UUID, signedBy: UUID): boolean {
  let signed = false;
  documents.update((docs) => {
    const index = docs.findIndex((doc) => doc.id === documentId);
    if (index !== -1) {
      docs[index] = {
        ...docs[index],
        signedBy,
        signedAt: new Date().toISOString(),
      };
      signed = true;
    }
    return docs;
  });
  return signed;
}

/**
 * 문서 검증
 */
export function verifyDocument(documentId: UUID, verifiedBy: UUID): boolean {
  let verified = false;
  documents.update((docs) => {
    const index = docs.findIndex((doc) => doc.id === documentId);
    if (index !== -1) {
      docs[index] = {
        ...docs[index],
        verifiedBy,
        verifiedAt: new Date().toISOString(),
      };
      verified = true;
    }
    return docs;
  });
  return verified;
}

/**
 * 문서 버전 관리
 */
export function createDocumentVersion(
  originalDocumentId: UUID,
  newDocumentData: {
    filename: string;
    storageUrl: string;
    sha256: string;
    meta?: Record<string, unknown>;
  },
): Document | null {
  let originalDoc: Document | undefined;
  documents.subscribe((docs) => {
    originalDoc = docs.find((doc) => doc.id === originalDocumentId);
  })();

  if (!originalDoc) return null;

  const newVersion: Document = {
    id: `doc-${Date.now()}`,
    expenseId: originalDoc.expenseId,
    projectId: originalDoc.projectId,
    type: originalDoc.type,
    filename: newDocumentData.filename,
    originalFilename: newDocumentData.filename,
    storageUrl: newDocumentData.storageUrl,
    sha256: newDocumentData.sha256,
    version: originalDoc.version + 1,
    signedBy: originalDoc.signedBy,
    signedAt: originalDoc.signedAt,
    verifiedBy: originalDoc.verifiedBy,
    verifiedAt: originalDoc.verifiedAt,
    meta: { ...originalDoc.meta, ...newDocumentData.meta },
    createdAt: new Date().toISOString(),
  };

  documents.update((docs) => [...docs, newVersion]);
  return newVersion;
}

// ===== 결재 워크플로우 관리 =====

/**
 * 결재 워크플로우 초기화
 */
function initializeApprovalWorkflow(
  expenseId: UUID,
  categoryCode: string,
): void {
  const workflow = getDefaultWorkflow(categoryCode);

  const newWorkflow: ApprovalWorkflow = {
    id: `workflow-${Date.now()}`,
    subjectType: "expense",
    subjectId: expenseId,
    currentStep: 1,
    totalSteps: workflow.length,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  approvalWorkflows.update((workflows) => [...workflows, newWorkflow]);
}

/**
 * 결재 진행
 */
export function processApproval(approvalData: {
  subjectType: "expense" | "milestone" | "document" | "project";
  subjectId: UUID;
  approverId: UUID;
  decision: ApprovalStatus;
  comment?: string;
}): boolean {
  const newApproval: Approval = {
    id: `app-${Date.now()}`,
    subjectType: approvalData.subjectType,
    subjectId: approvalData.subjectId,
    stepNo: 0, // 워크플로우에서 계산
    approverId: approvalData.approverId,
    decision: approvalData.decision,
    comment: approvalData.comment,
    decidedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // 워크플로우 업데이트
  let workflowUpdated = false;
  approvalWorkflows.update((workflows) => {
    const workflowIndex = workflows.findIndex(
      (w) =>
        w.subjectType === approvalData.subjectType &&
        w.subjectId === approvalData.subjectId,
    );

    if (workflowIndex !== -1) {
      const workflow = workflows[workflowIndex];
      newApproval.stepNo = workflow.currentStep;

      if (approvalData.decision === "approved") {
        workflow.currentStep += 1;
        if (workflow.currentStep > workflow.totalSteps) {
          workflow.status = "approved";
        }
      } else if (approvalData.decision === "rejected") {
        workflow.status = "rejected";
      }

      workflow.updatedAt = new Date().toISOString();
      workflowUpdated = true;
    }

    return workflows;
  });

  if (workflowUpdated) {
    approvals.update((apps) => [...apps, newApproval]);

    // 지출 항목 상태 업데이트
    if (approvalData.subjectType === "expense") {
      updateExpenseStatus(approvalData.subjectId);
    }

    return true;
  }

  return false;
}

/**
 * 지출 항목 상태 업데이트
 */
function updateExpenseStatus(expenseId: UUID): void {
  let workflow: ApprovalWorkflow | undefined;
  approvalWorkflows.subscribe((workflows) => {
    workflow = workflows.find(
      (w) => w.subjectType === "expense" && w.subjectId === expenseId,
    );
  })();

  if (!workflow) return;

  let newStatus: ExpenseItem["status"];

  switch (workflow.status) {
    case "pending":
      newStatus = "pending_approval";
      break;
    case "approved":
      newStatus = "approved";
      break;
    case "rejected":
      newStatus = "rejected";
      break;
    case "cancelled":
      newStatus = "draft";
      break;
    default:
      return;
  }

  updateExpenseItem(expenseId, { status: newStatus });
}

// ===== 문서 완성도 확인 =====

/**
 * 지출 항목의 문서 완성도 확인
 */
function checkExpenseDocumentCompleteness(expenseId: UUID): void {
  let expense: ExpenseItem | undefined;
  expenseItems.subscribe((items) => {
    expense = items.find((item) => item.id === expenseId);
  })();

  if (!expense) return;

  let uploadedDocs: Array<{ type: string; uploadedAt: string }> = [];
  documents.subscribe((docs) => {
    uploadedDocs = docs
      .filter((doc) => doc.expenseId === expenseId)
      .map((doc) => ({ type: doc.type, uploadedAt: doc.createdAt }));
  })();

  const completeness = checkDocumentCompleteness(
    expense.categoryCode,
    uploadedDocs,
  );

  // 문서 완성도가 100%이고 상태가 draft라면 pending_approval로 변경
  if (completeness.completeness === 100 && expense.status === "draft") {
    updateExpenseItem(expenseId, { status: "pending_approval" });
  }
}

// ===== 지출 항목 검색 및 필터링 =====

/**
 * 지출 항목 검색
 */
export function searchExpenseItems(filters: {
  projectId?: UUID;
  status?: string;
  categoryCode?: string;
  requesterId?: UUID;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}): ExpenseItem[] {
  let items: ExpenseItem[] = [];
  expenseItems.subscribe((value) => (items = value))();

  return items.filter((item) => {
    if (filters.projectId && item.projectId !== filters.projectId) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.categoryCode && item.categoryCode !== filters.categoryCode)
      return false;
    if (filters.requesterId && item.requesterId !== filters.requesterId)
      return false;

    if (filters.dateFrom) {
      const itemDate = new Date(item.createdAt);
      const filterDate = new Date(filters.dateFrom);
      if (itemDate < filterDate) return false;
    }

    if (filters.dateTo) {
      const itemDate = new Date(item.createdAt);
      const filterDate = new Date(filters.dateTo);
      if (itemDate > filterDate) return false;
    }

    if (filters.amountMin && item.amount < filters.amountMin) return false;
    if (filters.amountMax && item.amount > filters.amountMax) return false;

    return true;
  });
}

/**
 * 프로젝트별 지출 통계
 */
export function getProjectExpenseStatistics(projectId: UUID): {
  totalAmount: number;
  totalCount: number;
  byCategory: Record<string, { amount: number; count: number }>;
  byStatus: Record<string, { amount: number; count: number }>;
} {
  let items: ExpenseItem[] = [];
  expenseItems.subscribe((value) => (items = value))();

  const projectExpenses = items.filter((item) => item.projectId === projectId);

  const statistics = {
    totalAmount: 0,
    totalCount: projectExpenses.length,
    byCategory: {} as Record<string, { amount: number; count: number }>,
    byStatus: {} as Record<string, { amount: number; count: number }>,
  };

  projectExpenses.forEach((expense) => {
    statistics.totalAmount += expense.amount;

    // 카테고리별 통계
    if (!statistics.byCategory[expense.categoryCode]) {
      statistics.byCategory[expense.categoryCode] = { amount: 0, count: 0 };
    }
    statistics.byCategory[expense.categoryCode].amount += expense.amount;
    statistics.byCategory[expense.categoryCode].count += 1;

    // 상태별 통계
    if (!statistics.byStatus[expense.status]) {
      statistics.byStatus[expense.status] = { amount: 0, count: 0 };
    }
    statistics.byStatus[expense.status].amount += expense.amount;
    statistics.byStatus[expense.status].count += 1;
  });

  return statistics;
}

/**
 * 결재 대기 중인 지출 항목
 */
export function getPendingApprovalExpenses(_approverId: UUID): ExpenseItem[] {
  let items: ExpenseItem[] = [];
  expenseItems.subscribe((value) => (items = value))();

  let workflows: ApprovalWorkflow[] = [];
  approvalWorkflows.subscribe((value) => (workflows = value))();

  // 현재 결재 단계에서 해당 사용자가 승인해야 하는 항목들
  const pendingWorkflows = workflows.filter(
    (workflow) =>
      workflow.status === "pending" && workflow.subjectType === "expense",
  );

  const pendingExpenseIds = pendingWorkflows.map(
    (workflow) => workflow.subjectId,
  );

  return items.filter(
    (item) =>
      pendingExpenseIds.includes(item.id) && item.status === "pending_approval",
  );
}

/**
 * 지출 항목 실행 (집행)
 */
export function executeExpenseItem(
  expenseId: UUID,
  _executedBy: UUID,
): boolean {
  return updateExpenseItem(expenseId, {
    status: "executed",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 지출 항목 완료
 */
export function completeExpenseItem(
  expenseId: UUID,
  _completedBy: UUID,
): boolean {
  return updateExpenseItem(expenseId, {
    status: "completed",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 지출 항목 취소
 */
export function cancelExpenseItem(expenseId: UUID, _reason: string): boolean {
  // 워크플로우 취소
  approvalWorkflows.update((workflows) => {
    const index = workflows.findIndex(
      (w) => w.subjectType === "expense" && w.subjectId === expenseId,
    );
    if (index !== -1) {
      workflows[index].status = "cancelled";
      workflows[index].updatedAt = new Date().toISOString();
    }
    return workflows;
  });

  return updateExpenseItem(expenseId, {
    status: "draft",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 지출 항목 반려
 */
export function rejectExpenseItem(
  expenseId: UUID,
  reason: string,
  rejectedBy: UUID,
): boolean {
  // 결재 처리
  processApproval({
    subjectType: "expense",
    subjectId: expenseId,
    approverId: rejectedBy,
    decision: "rejected",
    comment: reason,
  });

  return true;
}

/**
 * 지출 항목 승인
 */
export function approveExpenseItem(
  expenseId: UUID,
  approvedBy: UUID,
  comment?: string,
): boolean {
  // 결재 처리
  processApproval({
    subjectType: "expense",
    subjectId: expenseId,
    approverId: approvedBy,
    decision: "approved",
    comment,
  });

  return true;
}

// ===== 내보내기 =====
export // 스토어는 이미 export됨
 {};
