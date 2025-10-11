/**
 * RD Project Status Utility Functions
 * 연구개발사업 상태 관련 유틸리티 함수
 */

import {
  RDProjectPriority,
  RDProjectStatus,
  RDResearchType,
  RDSponsorType,
  type BadgeVariant,
} from '../types/rd-project.types'

/**
 * 연구개발사업 상태를 한글 텍스트로 변환
 */
export function getRDStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    [RDProjectStatus.ACTIVE]: '진행중',
    [RDProjectStatus.PLANNING]: '기획중',
    [RDProjectStatus.COMPLETED]: '완료',
    [RDProjectStatus.CANCELLED]: '취소',
    [RDProjectStatus.SUSPENDED]: '중단',
  }
  return statusMap[status] || status
}

/**
 * 연구개발사업 상태에 따른 Badge 색상 반환
 */
export function getRDStatusColor(status: string): BadgeVariant {
  const statusColorMap: Record<string, BadgeVariant> = {
    [RDProjectStatus.ACTIVE]: 'success',
    [RDProjectStatus.PLANNING]: 'info',
    [RDProjectStatus.COMPLETED]: 'default',
    [RDProjectStatus.CANCELLED]: 'error',
    [RDProjectStatus.SUSPENDED]: 'warning',
  }
  return statusColorMap[status] || 'default'
}

/**
 * 연구개발사업 우선순위를 한글 텍스트로 변환
 */
export function getRDPriorityText(priority: string): string {
  const priorityMap: Record<string, string> = {
    [RDProjectPriority.LOW]: '낮음',
    [RDProjectPriority.MEDIUM]: '보통',
    [RDProjectPriority.HIGH]: '높음',
    [RDProjectPriority.CRITICAL]: '긴급',
  }
  return priorityMap[priority] || priority
}

/**
 * 연구개발사업 우선순위에 따른 Badge 색상 반환
 */
export function getRDPriorityColor(priority: string): BadgeVariant {
  const priorityColorMap: Record<string, BadgeVariant> = {
    [RDProjectPriority.LOW]: 'default',
    [RDProjectPriority.MEDIUM]: 'info',
    [RDProjectPriority.HIGH]: 'warning',
    [RDProjectPriority.CRITICAL]: 'error',
  }
  return priorityColorMap[priority] || 'default'
}

/**
 * 스폰서 타입을 한글 텍스트로 변환
 */
export function getRDSponsorTypeText(type: string): string {
  const sponsorMap: Record<string, string> = {
    [RDSponsorType.GOVERNMENT]: '정부',
    [RDSponsorType.PRIVATE]: '민간',
    [RDSponsorType.INTERNAL]: '자체',
  }
  return sponsorMap[type] || type
}

/**
 * 연구 타입을 한글 텍스트로 변환
 */
export function getRDResearchTypeText(type: string): string {
  const researchMap: Record<string, string> = {
    [RDResearchType.BASIC]: '기초연구',
    [RDResearchType.APPLIED]: '응용연구',
    [RDResearchType.DEVELOPMENT]: '개발연구',
  }
  return researchMap[type] || type
}
