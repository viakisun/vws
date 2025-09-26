import type { ExpenseDocument, Project } from '$lib/types'
import { derived, get, writable } from 'svelte/store'

// Utilities to build mock data at scale
function pad(num: number, size = 3): string {
  return String(num).padStart(size, '0')
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)] || arr[0]
}
function dateISO(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.toISOString().slice(0, 10)
}

// Quarter helpers
const QUARTERS = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2']
const QUARTER_TO_MONTH: Record<string, number> = {
  '2025-Q1': 1,
  '2025-Q2': 4,
  '2025-Q3': 7,
  '2025-Q4': 10,
  '2026-Q1': 1,
  '2026-Q2': 4,
}

// 10 Projects with budgets between 200M~500M
const ORGS = ['개발팀', '연구팀', '인프라팀', '기획팀', '영업팀']
const NAMES = [
  '스마트 제조',
  'AI 예측',
  '클라우드 전환',
  '데이터 파이프라인',
  '설비 모니터링',
  '디지털 트윈',
  'QA 자동화',
  '로보틱스',
  'OCR 엔진',
  '예지보전',
]
const STATUSES: Project['status'][] = ['active', 'planning', 'completed', 'cancelled', 'suspended']

const initialProjects: Project[] = Array.from({ length: 10 }).map((_, i) => {
  const id = `P-${pad(i + 1)}`
  const budgetKRW = randInt(200_000_000, 500_000_000)
  const _spentKRW = randInt(Math.floor(budgetKRW * 0.2), Math.floor(budgetKRW * 0.9))
  const progressPct = randInt(10, 95)
  const startYear = 2025
  const startMonth = pick([1, 4, 7, 10])
  const endYear = 2026
  const endMonth = pick([3, 6, 9, 12])
  return {
    id,
    code: `P${pad(i + 1)}`,
    title: `${NAMES[i]} 프로젝트`,
    description: `${NAMES[i]} 프로젝트 설명`,
    sponsorType: 'government',
    status: pick(STATUSES),
    budgetTotal: budgetKRW,
    budgetCurrency: 'KRW',
    researchType: 'applied',
    technologyArea: pick(ORGS),
    priority: 'medium',
    startDate: dateISO(startYear, startMonth, 1),
    endDate: dateISO(endYear, endMonth, 30),
    managerId: `manager-${i}`,
    managerName: `Manager ${i + 1}`,
    memberCount: randInt(3, 8),
    totalParticipationRate: progressPct,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
})

// Rich expense documents across projects and categories
const CATS: ExpenseDocument['category'][] = ['인건비', '재료비', '연구활동비', '여비']
function quarterToNumber(q: string): 1 | 2 | 3 | 4 {
  return Number(q.split('-Q')[1]) as 1 | 2 | 3 | 4
}

const initialDocs: ExpenseDocument[] = (function () {
  const docs: ExpenseDocument[] = []
  let counter = 1
  for (const p of initialProjects) {
    const docCount = randInt(4, 8)
    for (let k = 0; k < docCount; k++) {
      const q = pick(QUARTERS)
      const id = `D-${pad(counter++)}`
      docs.push({
        id,
        projectId: p.id,
        category: pick(CATS),
        quarter: quarterToNumber(q),
        status: pick(['대기', '승인', '반려']),
        title: `${p.name} 관련 지출 ${k + 1}`,
        amountKRW: randInt(300_000, 20_000_000),
        attachments: randInt(0, 4),
        createdAt: dateISO(Number(q.slice(0, 4)), QUARTER_TO_MONTH[q] || 1, randInt(1, 28)),
        appRoute: ['담당자', '팀장', '임원'],
      })
    }
  }
  return docs
})()

export const projectsStore = writable<Project[]>(initialProjects)
export const expenseDocsStore = writable<ExpenseDocument[]>(initialDocs)

export const pendingDocCount = derived(
  expenseDocsStore,
  (arr) => arr.filter((d) => d.status === '대기').length,
)

export function updateExpenseStatus(id: string, status: '대기' | '승인' | '반려') {
  expenseDocsStore.update((arr) => arr.map((d) => (d.id === id ? { ...d, status } : d)))
}

// Budget thresholds and quarterly budgets
export const budgetThresholds = {
  warning: 0.8,
  critical: 0.95,
  over: 1.0,
}

// Distribute personnel budgets per project across quarters (~60% of project budget)
export const quarterlyPersonnelBudgets = writable<Record<string, Record<string, number>>>(
  (function () {
    const map: Record<string, Record<string, number>> = {}
    for (const p of initialProjects) {
      const total = Math.floor(p.budgetKRW * 0.6)
      const per = Math.floor(total / QUARTERS.length)
      map[p.id] = {} as Record<string, number>
      for (const q of QUARTERS) {
        // add small variance per quarter
        if (map[p.id]) {
          map[p.id][q] = Math.max(50_000_000, per + randInt(-per * 0.2, per * 0.2))
        }
      }
    }
    return map
  })(),
)

// Overall budget utilization from project-level budget/spent
export const overallBudget = derived(projectsStore, (arr) => {
  const totalBudgetKRW = arr.reduce((s, p) => s + (p.budgetKRW ?? 0), 0)
  const totalSpentKRW = arr.reduce((s, p) => s + (p.spentKRW ?? 0), 0)
  const utilization = totalBudgetKRW > 0 ? totalSpentKRW / totalBudgetKRW : 0
  return { totalBudgetKRW, totalSpentKRW, utilization }
})

// Per-project alerts based on utilization against thresholds
export const budgetAlerts = derived(projectsStore, (arr) => {
  return arr
    .map((p) => {
      const util = p.budgetKRW > 0 ? p.spentKRW / p.budgetKRW : 0
      let level: 'warning' | 'critical' | 'over' | null = null
      if (util >= budgetThresholds.over) level = 'over'
      else if (util >= budgetThresholds.critical) level = 'critical'
      else if (util >= budgetThresholds.warning) level = 'warning'
      return level ? { projectId: p.id, name: p.name, utilization: util, level } : null
    })
    .filter(Boolean) as Array<{
    projectId: string
    name: string
    utilization: number
    level: 'warning' | 'critical' | 'over'
  }>
})

export function getQuarterSummary(quarter: string): { totalBudgetKRW: number } {
  const q = get(quarterlyPersonnelBudgets)
  const totalBudgetKRW = Object.values(q).reduce((sum, m) => sum + (m[quarter] ?? 0), 0)
  return { totalBudgetKRW }
}

// Approval history for expense documents
export const expenseHistories = writable<
  Record<string, Array<{ status: '대기' | '승인' | '반려'; reason?: string; at: string }>>
>({})

export function addExpenseHistory(id: string, status: '대기' | '승인' | '반려', reason?: string) {
  expenseHistories.update((h) => {
    const list = h[id] ?? []
    return {
      ...h,
      [id]: [...list, { status, reason, at: new Date().toISOString() }],
    }
  })
}
