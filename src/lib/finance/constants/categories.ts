// 거래 카테고리 기본 데이터
export const DEFAULT_CATEGORIES = {
  INCOME: [
    { name: '매출', type: 'income', color: '#10B981', isSystem: true },
    { name: '투자수익', type: 'income', color: '#059669', isSystem: true },
    { name: '기타수입', type: 'income', color: '#047857', isSystem: true },
    { name: '정부지원금', type: 'income', color: '#065F46', isSystem: true },
  ],
  EXPENSE: [
    // 급여 관련
    { name: '급여', type: 'expense', color: '#EF4444', isSystem: true },
    { name: '보너스', type: 'expense', color: '#DC2626', isSystem: true },
    { name: '퇴직금', type: 'expense', color: '#B91C1C', isSystem: true },

    // 고정비
    { name: '임대료', type: 'expense', color: '#F59E0B', isSystem: true },
    { name: '공과금', type: 'expense', color: '#D97706', isSystem: true },
    { name: '보험료', type: 'expense', color: '#B45309', isSystem: true },

    // 운영비
    { name: '사무용품', type: 'expense', color: '#8B5CF6', isSystem: true },
    { name: '통신비', type: 'expense', color: '#7C3AED', isSystem: true },
    { name: '교통비', type: 'expense', color: '#6D28D9', isSystem: true },
    { name: '식비', type: 'expense', color: '#5B21B6', isSystem: true },

    // 마케팅
    { name: '광고비', type: 'expense', color: '#EC4899', isSystem: true },
    { name: '홍보비', type: 'expense', color: '#DB2777', isSystem: true },

    // 기타
    { name: '세금', type: 'expense', color: '#6B7280', isSystem: true },
    { name: '기타지출', type: 'expense', color: '#4B5563', isSystem: true },
  ],
  TRANSFER: [
    { name: '계좌이체', type: 'transfer', color: '#3B82F6', isSystem: true },
    { name: '투자이체', type: 'transfer', color: '#2563EB', isSystem: true },
  ],
  ADJUSTMENT: [
    { name: '잔액조정', type: 'adjustment', color: '#6B7280', isSystem: true },
    { name: '오류수정', type: 'adjustment', color: '#4B5563', isSystem: true },
  ],
} as const

// 급여 관련 카테고리
export const SALARY_CATEGORIES = [
  '급여',
  '보너스',
  '퇴직금',
  '상여금',
  '초과근무수당',
  '야간수당',
  '휴일수당',
] as const

// 고정비 관련 카테고리
export const FIXED_COST_CATEGORIES = [
  '임대료',
  '공과금',
  '보험료',
  '통신비',
  '인터넷비',
  '관리비',
] as const

// 변동비 관련 카테고리
export const VARIABLE_COST_CATEGORIES = [
  '사무용품',
  '교통비',
  '식비',
  '광고비',
  '홍보비',
  '회의비',
  '교육비',
] as const

// 투자 관련 카테고리
export const INVESTMENT_CATEGORIES = [
  '투자수익',
  '투자이체',
  '주식투자',
  '부동산투자',
  '펀드투자',
] as const

// 카테고리 그룹
export const CATEGORY_GROUPS = {
  SALARY: {
    name: '급여',
    categories: SALARY_CATEGORIES,
    color: '#EF4444',
    icon: 'users',
  },
  FIXED_COSTS: {
    name: '고정비',
    categories: FIXED_COST_CATEGORIES,
    color: '#F59E0B',
    icon: 'home',
  },
  VARIABLE_COSTS: {
    name: '변동비',
    categories: VARIABLE_COST_CATEGORIES,
    color: '#8B5CF6',
    icon: 'shopping-cart',
  },
  INVESTMENT: {
    name: '투자',
    categories: INVESTMENT_CATEGORIES,
    color: '#10B981',
    icon: 'trending-up',
  },
  OTHER: {
    name: '기타',
    categories: ['기타수입', '기타지출', '세금'],
    color: '#6B7280',
    icon: 'more-horizontal',
  },
} as const

// 카테고리 우선순위 (자동 분류용)
export const CATEGORY_PRIORITY = {
  급여: 100,
  임대료: 95,
  공과금: 90,
  보험료: 85,
  통신비: 75,
  사무용품: 70,
  교통비: 65,
  식비: 60,
  광고비: 55,
  기타지출: 10,
} as const

// 카테고리별 예산 권장 비율 (월 매출 대비)
export const CATEGORY_BUDGET_RATIOS = {
  급여: 0.4, // 40%
  임대료: 0.1, // 10%
  공과금: 0.05, // 5%
  보험료: 0.03, // 3%
  사무용품: 0.02, // 2%
  교통비: 0.02, // 2%
  식비: 0.03, // 3%
  광고비: 0.05, // 5%
  기타지출: 0.2, // 20%
} as const
