/**
 * 급여 검증 관련 상수
 */

/**
 * 급여 검증 허용 오차 (원 단위)
 * 기본급 + 차량유지 + 식대의 합계가 계약 급여와 이 범위 내에 있으면 유효로 판단
 */
export const SALARY_VALIDATION_TOLERANCE = 1000

/**
 * 핵심 급여 항목 ID 목록
 * 이 항목들의 합계가 계약 급여와 일치해야 함
 */
export const CORE_SALARY_ALLOWANCE_IDS = ['basic_salary', 'vehicle_maintenance', 'meal_allowance']
