import { writable } from 'svelte/store'
import type { Personnel } from '$lib/types'

function pad(num: number, size = 3): string {
  return String(num).padStart(size, '0')
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)] || arr[0]
}

const ORGS = ['개발팀', '연구팀', '인프라팀', '기획팀', '영업팀']
const ROLES = ['사원', '주임', '대리', '과장', '차장']
const NAMES = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '조',
  '윤',
  '한',
  '임',
  '오',
  '강',
  '송',
  '허',
  '신',
  '문',
  '양',
  '배',
  '노',
  '유',
  '천',
]
const GIVEN = [
  '민수',
  '서연',
  '도윤',
  '지우',
  '서준',
  '하은',
  '서윤',
  '지호',
  '하준',
  '예준',
  '지민',
  '윤서',
  '가은',
  '현우',
  '유진',
  '시우',
  '민준',
  '수현',
]

// Projects P-001..P-010
const PROJECT_IDS = Array.from({ length: 10 }).map((_, i) => `P-${pad(i + 1)}`)

// Generate 30 personnel
const initialPersonnel: Personnel[] = Array.from({ length: 30 }).map((_, i) => {
  const id = `E-${pad(100 + i + 1)}`
  const name = `${pick(NAMES)}${pick(GIVEN)}`
  const organization = pick(ORGS)
  const role = pick(ROLES)
  const employmentType: Personnel['employmentType'] = '연봉제'
  const annualSalaryKRW = randInt(42_000_000, 98_000_000)
  // churn pattern: every quarter some people leave/join; mark few as 퇴사예정/신규
  const status: Personnel['status'] = pick(['재직', '재직', '재직', '신규', '퇴사예정'])
  // participations: 1~3 projects, allocations sum around 60~120%
  const projectCount = randInt(1, 3)
  const selected = [...PROJECT_IDS].sort(() => Math.random() - 0.5).slice(0, projectCount)
  let remaining = randInt(60, 120)
  const participations = selected.map((pid, idx) => {
    const allocation =
      idx === selected.length - 1
        ? Math.max(10, remaining)
        : randInt(15, Math.max(15, remaining - 15 * (selected.length - idx - 1)))
    remaining = Math.max(0, remaining - allocation)
    return {
      projectId: pid,
      allocationPct: allocation,
      startDate: `2025-0${pick([1, 4, 7])}-01`,
      // quarterly breakdown for current + next quarters with small variance
      quarterlyBreakdown: {
        '2025-Q3': Math.round(
          (annualSalaryKRW * (allocation / 100)) / 4 + randInt(-300_000, 300_000),
        ),
        '2025-Q4': Math.round(
          (annualSalaryKRW * (allocation / 100)) / 4 + randInt(-300_000, 300_000),
        ),
        '2026-Q1': Math.round(
          (annualSalaryKRW * (allocation / 100)) / 4 + randInt(-300_000, 300_000),
        ),
        '2026-Q2': Math.round(
          (annualSalaryKRW * (allocation / 100)) / 4 + randInt(-300_000, 300_000),
        ),
      },
    }
  })
  return {
    id,
    name,
    role,
    organization,
    employmentType,
    status,
    annualSalaryKRW,
    participations,
  } as Personnel
})

export const personnelStore = writable<Personnel[]>(initialPersonnel)

export function estimateMonthlyCostKRW(annualSalaryKRW: number, allocationPct: number): number {
  return Math.round((annualSalaryKRW * (allocationPct / 100)) / 12)
}
