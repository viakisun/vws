// Centralized common types to avoid conflicts

// ===== User Roles and Permissions =====
export enum UserRole {
  RESEARCHER = 'RESEARCHER', // 연구원
  PM = 'PM', // PM(과제책임자)
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD', // 담당부서(구매·기술 등)
  MANAGEMENT_SUPPORT = 'MANAGEMENT_SUPPORT', // 경영지원(회계·총무)
  LAB_HEAD = 'LAB_HEAD', // 연구소장
  EXECUTIVE = 'EXECUTIVE', // 경영진
  AUDITOR = 'AUDITOR', // 감사/외부평가
}

export enum Permission {
  READ_ALL = 'READ_ALL',
  WRITE_ALL = 'WRITE_ALL',
  APPROVE_ALL = 'APPROVE_ALL',
  AUDIT_ALL = 'AUDIT_ALL',
  READ_PROJECT = 'READ_PROJECT',
  WRITE_PROJECT = 'WRITE_PROJECT',
  APPROVE_EXPENSE = 'APPROVE_EXPENSE',
  APPROVE_PROJECT = 'APPROVE_PROJECT',
  READ_PERSONNEL = 'READ_PERSONNEL',
  WRITE_PERSONNEL = 'WRITE_PERSONNEL',
  READ_REPORTS = 'READ_REPORTS',
  WRITE_REPORTS = 'WRITE_REPORTS',
}

// ===== Basic Types =====
export type UUID = string
export type DateString = string
export type Currency = 'KRW' | 'USD' | 'EUR'
export type HealthStatus = 'green' | 'amber' | 'red'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'locked'
export type ProjectStatus = 'planning' | 'active' | 'completed'

// ===== API Response Types =====
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===== Form Data Types =====
export interface ProjectFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  budget: number
  organization: string
  personnelIds: string[]
}

export interface ExpenseFormData {
  projectId: string
  category: string
  description: string
  amount: number
  date: string
  receiptUrl?: string
}

export interface MilestoneFormData {
  projectId: string
  name: string
  description: string
  targetDate: string
  deliverables: string[]
}

// ===== Dashboard Types =====
export interface DashboardData {
  projects: {
    total: number
    active: number
    completed: number
    overdue: number
  }
  expenses: {
    total: number
    budget: number
    remaining: number
  }
  personnel: {
    total: number
    allocated: number
    available: number
  }
}
