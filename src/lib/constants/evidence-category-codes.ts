export const EvidenceCategoryCode = {
  // 1000번대: 인건비
  PERSONNEL: '1001',

  // 2000번대: 재료비
  RESEARCH_MATERIALS: '2001',
  MATERIALS: '2002',
  PROTOTYPING: '2003',

  // 3000번대: 연구활동비
  RESEARCH_ACTIVITY: '3001',
  OUTSOURCING: '3002',
  DOMESTIC_TRAVEL: '3003',
  MEETING: '3005',
  BUSINESS_PROMOTION: '3006',

  // 9000번대: 간접비
  INDIRECT: '9001'
} as const

export type EvidenceCategoryCodeType =
  (typeof EvidenceCategoryCode)[keyof typeof EvidenceCategoryCode]

export const EvidenceCategoryCodeInfo: Record<
  string,
  {
    name: string
    description: string
    parentCode?: string
  }
> = {
  '1001': { name: '인건비', description: '연구원 급여 및 인건비 관련 증빙' },
  '2001': { name: '연구재료비', description: '연구에 필요한 재료 및 장비 구매 증빙' },
  '2002': { name: '재료비', description: '재료비 증빙 항목' },
  '2003': { name: '시제품제작경비', description: '시제품 및 프로토타입 제작 비용' },
  '3001': {
    name: '연구활동비',
    description: '출장비, 회의비, 외주용역비 등 연구활동 관련 증빙'
  },
  '3002': { name: '연구용역비', description: '외주 용역 비용' },
  '3003': { name: '국내여비', description: '국내 출장 관련 비용', parentCode: '3001' },
  '3005': { name: '회의비', description: '회의 관련 비용', parentCode: '3001' },
  '3006': { name: '업무추진비', description: '사업 추진 관련 비용' },
  '9001': { name: '간접비', description: '간접비 배분 및 특허출원 등 관련 증빙' }
}

