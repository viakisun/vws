import type { Deduction } from '../types'

/**
 * 급여 공제 항목 기본값 생성
 * @returns 기본 공제 항목 배열
 */
export function createDefaultDeductions(): Deduction[] {
  return [
    {
      id: 'health_insurance',
      name: '건강보험',
      rate: 0.034,
      type: 'insurance',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'long_term_care',
      name: '장기요양보험',
      rate: 0.0034,
      type: 'insurance',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'national_pension',
      name: '국민연금',
      rate: 0.045,
      type: 'pension',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'employment_insurance',
      name: '고용보험',
      rate: 0.008,
      type: 'insurance',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'income_tax',
      name: '갑근세',
      rate: 0.13,
      type: 'tax',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'local_tax',
      name: '주민세',
      rate: 0.013,
      type: 'tax',
      amount: 0,
      isMandatory: true,
    },
    {
      id: 'other',
      name: '기타',
      rate: 0,
      type: 'other',
      amount: 0,
      isMandatory: false,
    },
  ]
}
