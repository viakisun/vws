import { writable } from "svelte/store";
import type {
  Person,
  Employment,
  SalaryHistory,
  Project,
  ProjectBudgetCategory,
  Milestone,
  ParticipationAssignment,
  ExpenseItem,
  Document,
  Approval,
  ResearchNote,
  Report,
  SubmissionBundle,
  AuditLog,
  BudgetCategoryMaster,
  HealthIndicator,
  Notification,
  SLAAlert,
  ReplacementRecommendation,
} from "./types";

// 핵심 엔티티 스토어
export const persons = writable<Person[]>([]);
export const employments = writable<Employment[]>([]);
export const salaryHistory = writable<SalaryHistory[]>([]);
export const projects = writable<Project[]>([]);
export const projectBudgetCategories = writable<ProjectBudgetCategory[]>([]);
export const milestones = writable<Milestone[]>([]);
export const participationAssignments = writable<ParticipationAssignment[]>([]);
export const expenseItems = writable<ExpenseItem[]>([]);
export const documents = writable<Document[]>([]);
export const approvals = writable<Approval[]>([]);
export const researchNotes = writable<ResearchNote[]>([]);
export const reports = writable<Report[]>([]);
export const submissionBundles = writable<SubmissionBundle[]>([]);
export const auditLogs = writable<AuditLog[]>([]);
export const budgetCategoryMaster = writable<BudgetCategoryMaster[]>([]);
export const healthIndicators = writable<HealthIndicator[]>([]);
export const notifications = writable<Notification[]>([]);
export const slaAlerts = writable<SLAAlert[]>([]);
export const replacementRecommendations = writable<ReplacementRecommendation[]>(
  [],
);

// CRUD 함수들
export function addPerson(
  person: Omit<Person, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newPerson: Person = {
    ...person,
    id,
    createdAt: now,
    updatedAt: now,
  };

  persons.update((list) => [...list, newPerson]);
  logAudit("create", "person", id, {}, newPerson);
  return id;
}

export function updatePerson(id: string, updates: Partial<Person>): void {
  persons.update((list) => {
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return list;

    const oldPerson = list[index];
    const updatedPerson = {
      ...oldPerson,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedPerson;

    logAudit("update", "person", id, oldPerson, updatedPerson);
    return newList;
  });
}

export function deletePerson(id: string): void {
  persons.update((list) => {
    const person = list.find((p) => p.id === id);
    if (person) {
      logAudit("delete", "person", id, person, {});
    }
    return list.filter((p) => p.id !== id);
  });
}

export function addProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
    updatedAt: now,
  };

  projects.update((list) => [...list, newProject]);
  logAudit("create", "project", id, {}, newProject);
  return id;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  projects.update((list) => {
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return list;

    const oldProject = list[index];
    const updatedProject = {
      ...oldProject,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedProject;

    logAudit("update", "project", id, oldProject, updatedProject);
    return newList;
  });
}

export function addExpenseItem(
  expense: Omit<ExpenseItem, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newExpense: ExpenseItem = {
    ...expense,
    id,
    createdAt: now,
    updatedAt: now,
  };

  expenseItems.update((list) => [...list, newExpense]);
  logAudit("create", "expense", id, {}, newExpense);
  return id;
}

export function updateExpenseItem(
  id: string,
  updates: Partial<ExpenseItem>,
): void {
  expenseItems.update((list) => {
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return list;

    const oldExpense = list[index];
    const updatedExpense = {
      ...oldExpense,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedExpense;

    logAudit("update", "expense", id, oldExpense, updatedExpense);
    return newList;
  });
}

export function addDocument(
  document: Omit<Document, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newDocument: Document = {
    ...document,
    id,
    createdAt: now,
    updatedAt: now,
  };

  documents.update((list) => [...list, newDocument]);
  logAudit("create", "document", id, {}, newDocument);
  return id;
}

export function addApproval(
  approval: Omit<Approval, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newApproval: Approval = {
    ...approval,
    id,
    createdAt: now,
    updatedAt: now,
  };

  approvals.update((list) => [...list, newApproval]);
  logAudit("create", "approval", id, {}, newApproval);
  return id;
}

export function updateApproval(id: string, updates: Partial<Approval>): void {
  approvals.update((list) => {
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) return list;

    const oldApproval = list[index];
    const updatedApproval = {
      ...oldApproval,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedApproval;

    logAudit("update", "approval", id, oldApproval, updatedApproval);
    return newList;
  });
}

export function addMilestone(
  milestone: Omit<Milestone, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newMilestone: Milestone = {
    ...milestone,
    id,
    createdAt: now,
    updatedAt: now,
  };

  milestones.update((list) => [...list, newMilestone]);
  logAudit("create", "milestone", id, {}, newMilestone);
  return id;
}

export function updateMilestone(id: string, updates: Partial<Milestone>): void {
  milestones.update((list) => {
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return list;

    const oldMilestone = list[index];
    const updatedMilestone = {
      ...oldMilestone,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedMilestone;

    logAudit("update", "milestone", id, oldMilestone, updatedMilestone);
    return newList;
  });
}

export function addParticipationAssignment(
  assignment: Omit<ParticipationAssignment, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newAssignment: ParticipationAssignment = {
    ...assignment,
    id,
    createdAt: now,
    updatedAt: now,
  };

  participationAssignments.update((list) => [...list, newAssignment]);
  logAudit("create", "participation", id, {}, newAssignment);
  return id;
}

export function addResearchNote(
  note: Omit<ResearchNote, "id" | "createdAt" | "updatedAt">,
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newNote: ResearchNote = {
    ...note,
    id,
    createdAt: now,
    updatedAt: now,
  };

  researchNotes.update((list) => [...list, newNote]);
  logAudit("create", "research_note", id, {}, newNote);
  return id;
}

export function updateResearchNote(
  id: string,
  updates: Partial<ResearchNote>,
): void {
  researchNotes.update((list) => {
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) return list;

    const oldNote = list[index];
    const updatedNote = {
      ...oldNote,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const newList = [...list];
    newList[index] = updatedNote;

    logAudit("update", "research_note", id, oldNote, updatedNote);
    return newList;
  });
}

// 감사 로그 함수
export function logAudit(
  action: string,
  entity: string,
  entityId: string,
  oldData: any,
  newData: any,
): void {
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    actorId: "current-user", // 실제로는 현재 사용자 ID
    action,
    entity,
    entityId,
    diff: { old: oldData, new: newData },
    at: new Date().toISOString(),
  };

  auditLogs.update((list) => [...list, auditLog]);
}

// 유틸리티 함수들
export function getPersonById(
  id: string,
  personList: Person[],
): Person | undefined {
  return personList.find((p) => p.id === id);
}

export function getProjectById(
  id: string,
  projectList: Project[],
): Project | undefined {
  return projectList.find((p) => p.id === id);
}

export function getExpenseItemsByProject(
  projectId: string,
  expenseList: ExpenseItem[],
): ExpenseItem[] {
  return expenseList.filter((e) => e.projectId === projectId);
}

export function getMilestonesByProject(
  projectId: string,
  milestoneList: Milestone[],
): Milestone[] {
  return milestoneList.filter((m) => m.projectId === projectId);
}

export function getParticipationAssignmentsByProject(
  projectId: string,
  assignmentList: ParticipationAssignment[],
): ParticipationAssignment[] {
  return assignmentList.filter((a) => a.projectId === projectId);
}

export function getParticipationAssignmentsByPerson(
  personId: string,
  assignmentList: ParticipationAssignment[],
): ParticipationAssignment[] {
  return assignmentList.filter((a) => a.personId === personId);
}

export function getDocumentsByExpense(
  expenseId: string,
  documentList: Document[],
): Document[] {
  return documentList.filter((d) => d.expenseId === expenseId);
}

export function getApprovalsBySubject(
  subjectType: string,
  subjectId: string,
  approvalList: Approval[],
): Approval[] {
  return approvalList.filter(
    (a) => a.subjectType === subjectType && a.subjectId === subjectId,
  );
}

export function getResearchNotesByProject(
  projectId: string,
  noteList: ResearchNote[],
): ResearchNote[] {
  return noteList.filter((n) => n.projectId === projectId);
}

export function getActiveProjects(projectList: Project[]): Project[] {
  return projectList.filter((p) => p.status === "active");
}

export function getActivePersons(personList: Person[]): Person[] {
  return personList.filter((p) => p.active);
}
