import {
    EvidenceCategoryCodeInfo
} from '$lib/constants/evidence-category-codes'

export function getCategoryNameByCode(code: string): string {
  return EvidenceCategoryCodeInfo[code]?.name || '알 수 없음'
}

export function getCategoryDescriptionByCode(code: string): string {
  return EvidenceCategoryCodeInfo[code]?.description || ''
}

export function isPersonnelCategory(code: string): boolean {
  return code.startsWith('1')
}

export function isMaterialCategory(code: string): boolean {
  return code.startsWith('2')
}

export function isActivityCategory(code: string): boolean {
  return code.startsWith('3')
}

export function getCategoryColor(code: string): string {
  if (code.startsWith('1')) return 'blue'
  if (code.startsWith('2')) return 'green'
  if (code.startsWith('3')) return 'purple'
  if (code.startsWith('9')) return 'gray'
  return 'gray'
}

