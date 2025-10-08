import type { PayslipData } from '../types'

/**
 * Gets the display value for a table cell based on data availability and lock status
 */
export function getCellDisplayValue(
  hasData: boolean | undefined,
  isLocked: boolean | undefined,
  value: number | undefined,
  formatter: (value: number) => string,
): string {
  if (hasData) {
    return formatter(value ?? 0)
  }
  return isLocked ? '잠금' : '-'
}

/**
 * Gets CSS classes for a table row based on its state
 */
export function getRowClasses(monthData: PayslipData, isOutsideContract: boolean): string {
  const classes = ['hover:bg-gray-50']

  if (monthData.isLocked) {
    classes.push('bg-gray-100')
  } else if (!monthData.hasData) {
    classes.push('bg-red-50')
  } else if (isOutsideContract) {
    classes.push('bg-orange-50')
  }

  return classes.join(' ')
}

/**
 * Gets CSS classes for table cell text based on lock status
 */
export function getCellTextClasses(
  isLocked: boolean | undefined,
  baseClasses: string = 'text-gray-500',
): string {
  return isLocked ? 'text-gray-400' : baseClasses
}

/**
 * Gets the status badge configuration
 */
export function getStatusBadge(
  monthData: PayslipData,
  isOutsideContract: boolean,
): { text: string; colorClasses: string } {
  if (monthData.isLocked) {
    return {
      text: monthData.isBeforeHire ? '입사전' : '잠금',
      colorClasses: 'bg-gray-100 text-gray-600',
    }
  }

  if (isOutsideContract) {
    return {
      text: '계약기간외',
      colorClasses: 'bg-orange-100 text-orange-800',
    }
  }

  if (monthData.hasData) {
    return {
      text: '완료',
      colorClasses: 'bg-green-100 text-green-800',
    }
  }

  return {
    text: '미작성',
    colorClasses: 'bg-red-100 text-red-800',
  }
}

/**
 * Gets the action button configuration
 */
export function getActionButton(
  monthData: PayslipData,
  isOutsideContract: boolean,
):
  | { type: 'disabled'; text: string; textColor: string }
  | { type: 'edit'; hasData: boolean }
  | null {
  if (monthData.isLocked) {
    return {
      type: 'disabled',
      text: monthData.isBeforeHire ? '입사전' : '잠금됨',
      textColor: 'text-gray-400',
    }
  }

  if (isOutsideContract) {
    return {
      type: 'disabled',
      text: '계약기간외',
      textColor: 'text-orange-600',
    }
  }

  return {
    type: 'edit',
    hasData: monthData.hasData ?? false,
  }
}
