import { writable } from 'svelte/store'

// 인사 규정
export interface HRPolicy {
  id: string
  title: string
  category:
    | 'attendance'
    | 'leave'
    | 'compensation'
    | 'performance'
    | 'discipline'
    | 'safety'
    | 'general'
  content: string
  version: string
  effectiveDate: string
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  approvedBy: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 윤리강령
export interface CodeOfConduct {
  id: string
  title: string
  section: string
  content: string
  version: string
  effectiveDate: string
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 보안 정책
export interface SecurityPolicy {
  id: string
  title: string
  category: 'data' | 'network' | 'physical' | 'access' | 'incident' | 'compliance'
  content: string
  version: string
  effectiveDate: string
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  severity: 'low' | 'medium' | 'high' | 'critical'
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 사내 FAQ
export interface FAQ {
  id: string
  category: 'hr' | 'it' | 'benefits' | 'policies' | 'general'
  question: string
  answer: string
  tags: string[]
  viewCount: number
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 가이드라인
export interface Guideline {
  id: string
  title: string
  category: 'workflow' | 'process' | 'best-practice' | 'training' | 'onboarding'
  content: string
  version: string
  effectiveDate: string
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  applicableRoles: string[] // 적용 대상 역할
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 정책 동의 기록
export interface PolicyAgreement {
  id: string
  employeeId: string
  policyId: string
  policyType: 'hr' | 'security' | 'conduct'
  policyTitle: string
  version: string
  agreedAt: string
  ipAddress?: string
  userAgent?: string
}

// 초기 데이터
const initialHRPolicies: HRPolicy[] = [
  {
    id: 'hr-policy-1',
    title: '근무시간 및 휴게시간 규정',
    category: 'attendance',
    content: `
## 근무시간 및 휴게시간 규정

### 1. 근무시간
- 정규근무시간: 주 40시간 (월~금, 09:00~18:00)
- 점심시간: 12:00~13:00 (1시간)
- 유연근무제: 코어타임 10:00~16:00

### 2. 휴게시간
- 점심시간: 12:00~13:00
- 오후 휴게시간: 15:00~15:10 (10분)

### 3. 연장근무
- 연장근무는 사전 승인 필요
- 연장근무 수당은 법정 기준에 따라 지급
		`.trim(),
    version: '1.0',
    effectiveDate: '2023-01-01',
    lastUpdated: '2023-01-01',
    status: 'active',
    approvedBy: 'emp-3',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'hr-policy-2',
    title: '휴가 및 휴직 규정',
    category: 'leave',
    content: `
## 휴가 및 휴직 규정

### 1. 연차휴가
- 입사 1년차: 15일
- 2년차 이상: 15일 + 근속년수별 추가일수
- 연차 사용은 사전 신청 및 승인 필요

### 2. 병가
- 연간 10일까지 유급
- 3일 이상 시 의사진단서 제출 필요

### 3. 경조사휴가
- 결혼(본인): 5일
- 출산(배우자): 3일
- 사망(직계가족): 3일
		`.trim(),
    version: '1.0',
    effectiveDate: '2023-01-01',
    lastUpdated: '2023-01-01',
    status: 'active',
    approvedBy: 'emp-3',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialCodeOfConduct: CodeOfConduct[] = [
  {
    id: 'conduct-1',
    title: '윤리강령',
    section: '기본원칙',
    content: `
## 윤리강령 - 기본원칙

### 1. 정직과 신뢰
- 모든 업무에서 정직하고 투명하게 행동
- 동료, 고객, 파트너와의 신뢰 관계 구축

### 2. 존중과 배려
- 개인의 다양성과 차이를 존중
- 상호 존중과 배려의 문화 조성

### 3. 책임과 의무
- 업무에 대한 책임감과 전문성 발휘
- 회사의 발전에 기여하는 자세
		`.trim(),
    version: '1.0',
    effectiveDate: '2023-01-01',
    lastUpdated: '2023-01-01',
    status: 'active',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialSecurityPolicies: SecurityPolicy[] = [
  {
    id: 'security-1',
    title: '정보보안 정책',
    category: 'data',
    content: `
## 정보보안 정책

### 1. 개인정보 보호
- 개인정보 수집, 이용, 제공 시 동의 절차 준수
- 개인정보 보관 및 관리 기준 엄격 준수

### 2. 기밀정보 보호
- 업무상 알게 된 기밀정보 외부 유출 금지
- 비밀유지계약서 준수

### 3. 시스템 보안
- 강력한 비밀번호 사용 의무
- 정기적인 보안 업데이트 및 점검
		`.trim(),
    version: '1.0',
    effectiveDate: '2023-01-01',
    lastUpdated: '2023-01-01',
    status: 'active',
    severity: 'high',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialFAQs: FAQ[] = [
  {
    id: 'faq-1',
    category: 'hr',
    question: '연차휴가는 언제부터 사용할 수 있나요?',
    answer:
      '입사 후 1년이 지나면 연차휴가를 사용할 수 있습니다. 단, 입사 6개월 후부터는 월 1일씩 선사용이 가능합니다.',
    tags: ['연차', '휴가', '입사'],
    viewCount: 45,
    lastUpdated: '2023-01-01',
    status: 'active',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'faq-2',
    category: 'benefits',
    question: '건강검진 지원은 어떻게 받나요?',
    answer:
      '연 1회 종합건강검진 비용을 지원합니다. HR팀에 신청서를 제출하시면 됩니다. 최대 50만원까지 지원 가능합니다.',
    tags: ['건강검진', '복리후생', '지원'],
    viewCount: 32,
    lastUpdated: '2023-01-01',
    status: 'active',
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialGuidelines: Guideline[] = [
  {
    id: 'guideline-1',
    title: '신입사원 온보딩 가이드',
    category: 'onboarding',
    content: `
## 신입사원 온보딩 가이드

### 1. 첫 주 체크리스트
- [ ] 장비 지급 및 설정
- [ ] 계정 생성 및 권한 부여
- [ ] 회사 오리엔테이션 참석
- [ ] 팀 소개 및 멘토 배정

### 2. 첫 달 목표
- [ ] 업무 프로세스 이해
- [ ] 팀원들과의 관계 형성
- [ ] 기본 업무 습득
		`.trim(),
    version: '1.0',
    effectiveDate: '2023-01-01',
    lastUpdated: '2023-01-01',
    status: 'active',
    applicableRoles: ['신입사원', '인턴'],
    createdBy: 'emp-3',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

const initialPolicyAgreements: PolicyAgreement[] = [
  {
    id: 'agreement-1',
    employeeId: 'emp-1',
    policyId: 'hr-policy-1',
    policyType: 'hr',
    policyTitle: '근무시간 및 휴게시간 규정',
    version: '1.0',
    agreedAt: '2023-01-15T00:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
  },
]

// 스토어 생성
export const hrPolicies = writable<HRPolicy[]>(initialHRPolicies)
export const codeOfConduct = writable<CodeOfConduct[]>(initialCodeOfConduct)
export const securityPolicies = writable<SecurityPolicy[]>(initialSecurityPolicies)
export const faqs = writable<FAQ[]>(initialFAQs)
export const guidelines = writable<Guideline[]>(initialGuidelines)
export const policyAgreements = writable<PolicyAgreement[]>(initialPolicyAgreements)

// 인사 규정 관리 함수들
export function addHRPolicy(policy: Omit<HRPolicy, 'id' | 'createdAt' | 'updatedAt'>) {
  const newPolicy: HRPolicy = {
    ...policy,
    id: `hr-policy-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  hrPolicies.update((current) => [...current, newPolicy])
}

export function updateHRPolicy(id: string, updates: Partial<HRPolicy>) {
  hrPolicies.update((current) =>
    current.map((policy) =>
      policy.id === id ? { ...policy, ...updates, updatedAt: new Date().toISOString() } : policy,
    ),
  )
}

export function archiveHRPolicy(id: string) {
  hrPolicies.update((current) =>
    current.map((policy) =>
      policy.id === id
        ? { ...policy, status: 'archived', updatedAt: new Date().toISOString() }
        : policy,
    ),
  )
}

// 윤리강령 관리 함수들
export function addCodeOfConduct(conduct: Omit<CodeOfConduct, 'id' | 'createdAt' | 'updatedAt'>) {
  const newConduct: CodeOfConduct = {
    ...conduct,
    id: `conduct-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  codeOfConduct.update((current) => [...current, newConduct])
}

export function updateCodeOfConduct(id: string, updates: Partial<CodeOfConduct>) {
  codeOfConduct.update((current) =>
    current.map((conduct) =>
      conduct.id === id ? { ...conduct, ...updates, updatedAt: new Date().toISOString() } : conduct,
    ),
  )
}

// 보안 정책 관리 함수들
export function addSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>) {
  const newPolicy: SecurityPolicy = {
    ...policy,
    id: `security-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  securityPolicies.update((current) => [...current, newPolicy])
}

export function updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>) {
  securityPolicies.update((current) =>
    current.map((policy) =>
      policy.id === id ? { ...policy, ...updates, updatedAt: new Date().toISOString() } : policy,
    ),
  )
}

// FAQ 관리 함수들
export function addFAQ(faq: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>) {
  const newFAQ: FAQ = {
    ...faq,
    id: `faq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  faqs.update((current) => [...current, newFAQ])
}

export function updateFAQ(id: string, updates: Partial<FAQ>) {
  faqs.update((current) =>
    current.map((faq) =>
      faq.id === id ? { ...faq, ...updates, updatedAt: new Date().toISOString() } : faq,
    ),
  )
}

export function incrementFAQViewCount(id: string) {
  faqs.update((current) =>
    current.map((faq) =>
      faq.id === id
        ? {
            ...faq,
            viewCount: faq.viewCount + 1,
            updatedAt: new Date().toISOString(),
          }
        : faq,
    ),
  )
}

// 가이드라인 관리 함수들
export function addGuideline(guideline: Omit<Guideline, 'id' | 'createdAt' | 'updatedAt'>) {
  const newGuideline: Guideline = {
    ...guideline,
    id: `guideline-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  guidelines.update((current) => [...current, newGuideline])
}

export function updateGuideline(id: string, updates: Partial<Guideline>) {
  guidelines.update((current) =>
    current.map((guideline) =>
      guideline.id === id
        ? { ...guideline, ...updates, updatedAt: new Date().toISOString() }
        : guideline,
    ),
  )
}

// 정책 동의 관리 함수들
export function recordPolicyAgreement(agreement: Omit<PolicyAgreement, 'id'>) {
  const newAgreement: PolicyAgreement = {
    ...agreement,
    id: `agreement-${Date.now()}`,
  }
  policyAgreements.update((current) => [...current, newAgreement])
}

// 유틸리티 함수들
export function getHRPoliciesByCategory(
  category: HRPolicy['category'],
  policyList: HRPolicy[],
): HRPolicy[] {
  return policyList.filter((policy) => policy.category === category && policy.status === 'active')
}

export function getSecurityPoliciesByCategory(
  category: SecurityPolicy['category'],
  policyList: SecurityPolicy[],
): SecurityPolicy[] {
  return policyList.filter((policy) => policy.category === category && policy.status === 'active')
}

export function getFAQsByCategory(category: FAQ['category'], faqList: FAQ[]): FAQ[] {
  return faqList.filter((faq) => faq.category === category && faq.status === 'active')
}

export function getGuidelinesByCategory(
  category: Guideline['category'],
  guidelineList: Guideline[],
): Guideline[] {
  return guidelineList.filter(
    (guideline) => guideline.category === category && guideline.status === 'active',
  )
}

export function getPolicyAgreementsByEmployee(
  employeeId: string,
  agreementList: PolicyAgreement[],
): PolicyAgreement[] {
  return agreementList.filter((agreement) => agreement.employeeId === employeeId)
}

export function hasEmployeeAgreedToPolicy(
  employeeId: string,
  policyId: string,
  agreementList: PolicyAgreement[],
): boolean {
  return agreementList.some(
    (agreement) => agreement.employeeId === employeeId && agreement.policyId === policyId,
  )
}

export function searchFAQs(query: string, faqList: FAQ[]): FAQ[] {
  const lowercaseQuery = query.toLowerCase()
  return faqList.filter(
    (faq) =>
      faq.status === 'active' &&
      (faq.question.toLowerCase().includes(lowercaseQuery) ||
        faq.answer.toLowerCase().includes(lowercaseQuery) ||
        faq.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))),
  )
}

export function getPopularFAQs(faqList: FAQ[], limit: number = 5): FAQ[] {
  return faqList
    .filter((faq) => faq.status === 'active')
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
}
