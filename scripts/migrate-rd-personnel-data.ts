#!/usr/bin/env tsx
/**
 * 연구개발 프로젝트 참여연구원 및 인건비 증빙 데이터 마이그레이션
 *
 * 실행 방법:
 * npm run db:migrate:personnel
 */

import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

// 프로젝트 코드 매핑
const PROJECT_MAPPING: Record<string, string> = {
  '국방-무기체계': 'PROJ_2024_003',
  침수안전: 'PROJ_2025_003',
  'A-SW': 'PROJ_2025_004',
  '캠틱-AI솔루션': 'PROJ_2024_002',
  '스마트팜-과채류': 'PROJ_2025_001',
  '스마트팜-추종형': 'PROJ_2025_002',
}

interface MemberData {
  projectKey: string
  employeeName: string
  startMonth: string // 'YYYY-MM'
  endMonth: string // 'YYYY-MM'
  monthlyBaseSalary: number
  participationRate: number
  totalAmount: number
  monthlyPayment: number
  fundingType: 'in_kind' | 'cash'
}

// 참여연구원 데이터
const MEMBER_DATA: MemberData[] = [
  // 1. 국방-무기체계 (현물)
  {
    projectKey: '국방-무기체계',
    employeeName: '박기선',
    startMonth: '2024-10',
    endMonth: '2025-07',
    monthlyBaseSalary: 7000000,
    participationRate: 66.0,
    totalAmount: 46200000,
    monthlyPayment: 4620000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '박기선',
    startMonth: '2025-08',
    endMonth: '2025-09',
    monthlyBaseSalary: 8700000,
    participationRate: 53.2,
    totalAmount: 9240000,
    monthlyPayment: 4624050,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '백승현',
    startMonth: '2024-10',
    endMonth: '2025-07',
    monthlyBaseSalary: 3700000,
    participationRate: 94.1,
    totalAmount: 34802200,
    monthlyPayment: 3480220,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '김성호',
    startMonth: '2025-08',
    endMonth: '2025-09',
    monthlyBaseSalary: 4000000,
    participationRate: 70.0,
    totalAmount: 5600000,
    monthlyPayment: 2800000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '정은지',
    startMonth: '2024-10',
    endMonth: '2024-11',
    monthlyBaseSalary: 3000000,
    participationRate: 100.0,
    totalAmount: 6000000,
    monthlyPayment: 3000000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '정은지',
    startMonth: '2024-12',
    endMonth: '2025-07',
    monthlyBaseSalary: 3300000,
    participationRate: 90.91,
    totalAmount: 24000240,
    monthlyPayment: 3000030,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '김대곤',
    startMonth: '2024-10',
    endMonth: '2025-03',
    monthlyBaseSalary: 3900000,
    participationRate: 100.0,
    totalAmount: 23400000,
    monthlyPayment: 3900000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '김대곤',
    startMonth: '2025-04',
    endMonth: '2025-07',
    monthlyBaseSalary: 4500000,
    participationRate: 86.66,
    totalAmount: 15600000,
    monthlyPayment: 3900000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '최현민',
    startMonth: '2025-08',
    endMonth: '2025-09',
    monthlyBaseSalary: 5000000,
    participationRate: 91.6,
    totalAmount: 9160000,
    monthlyPayment: 4580000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '오현종',
    startMonth: '2025-08',
    endMonth: '2025-09',
    monthlyBaseSalary: 3000000,
    participationRate: 100.0,
    totalAmount: 6000000,
    monthlyPayment: 3000000,
    fundingType: 'in_kind',
  },

  // 1. 국방-무기체계 (현금)
  {
    projectKey: '국방-무기체계',
    employeeName: '이건희',
    startMonth: '2024-10',
    endMonth: '2025-09',
    monthlyBaseSalary: 3700000,
    participationRate: 61.0,
    totalAmount: 27000000,
    monthlyPayment: 2250710,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '장미경',
    startMonth: '2024-10',
    endMonth: '2024-11',
    monthlyBaseSalary: 3500000,
    participationRate: 75.0,
    totalAmount: 5250000,
    monthlyPayment: 2625000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '정예원',
    startMonth: '2024-12',
    endMonth: '2025-01',
    monthlyBaseSalary: 3000000,
    participationRate: 87.5,
    totalAmount: 5250000,
    monthlyPayment: 2625000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '최시용',
    startMonth: '2024-10',
    endMonth: '2025-03',
    monthlyBaseSalary: 3000000,
    participationRate: 80.0,
    totalAmount: 14400000,
    monthlyPayment: 2400000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '최시용',
    startMonth: '2025-04',
    endMonth: '2025-09',
    monthlyBaseSalary: 3300000,
    participationRate: 72.7,
    totalAmount: 14400000,
    monthlyPayment: 2400090,
    fundingType: 'cash',
  },

  // 1. 국방-무기체계 (현금-신규)
  {
    projectKey: '국방-무기체계',
    employeeName: '차지은',
    startMonth: '2024-10',
    endMonth: '2025-03',
    monthlyBaseSalary: 3000000,
    participationRate: 100.0,
    totalAmount: 18000000,
    monthlyPayment: 3000000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '차지은',
    startMonth: '2025-04',
    endMonth: '2025-09',
    monthlyBaseSalary: 3300000,
    participationRate: 90.9,
    totalAmount: 18000000,
    monthlyPayment: 3000000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '장한진',
    startMonth: '2025-01',
    endMonth: '2025-09',
    monthlyBaseSalary: 3300000,
    participationRate: 100.0,
    totalAmount: 29700000,
    monthlyPayment: 3300000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '이지후',
    startMonth: '2025-01',
    endMonth: '2025-02',
    monthlyBaseSalary: 2500000,
    participationRate: 100.0,
    totalAmount: 5000000,
    monthlyPayment: 2500000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '이지후',
    startMonth: '2025-03',
    endMonth: '2025-09',
    monthlyBaseSalary: 3000000,
    participationRate: 100.0,
    totalAmount: 21000000,
    monthlyPayment: 3000000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '김수겸',
    startMonth: '2025-02',
    endMonth: '2025-04',
    monthlyBaseSalary: 3000000,
    participationRate: 91.7,
    totalAmount: 8250000,
    monthlyPayment: 2750000,
    fundingType: 'cash',
  },
  {
    projectKey: '국방-무기체계',
    employeeName: '고동훤',
    startMonth: '2025-05',
    endMonth: '2025-09',
    monthlyBaseSalary: 3000000,
    participationRate: 91.7,
    totalAmount: 13750000,
    monthlyPayment: 2750000,
    fundingType: 'cash',
  },

  // 2. 침수안전 (현물)
  {
    projectKey: '침수안전',
    employeeName: '최현민',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 5416000,
    participationRate: 30.0,
    totalAmount: 19497600,
    monthlyPayment: 1624800,
    fundingType: 'in_kind',
  },
  {
    projectKey: '침수안전',
    employeeName: '이건희',
    startMonth: '2025-05',
    endMonth: '2025-12',
    monthlyBaseSalary: 4360000,
    participationRate: 40.0,
    totalAmount: 20928000,
    monthlyPayment: 1744000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '침수안전',
    employeeName: '차지은',
    startMonth: '2025-05',
    endMonth: '2025-12',
    monthlyBaseSalary: 3860500,
    participationRate: 34.0,
    totalAmount: 15750840,
    monthlyPayment: 1312570,
    fundingType: 'in_kind',
  },
  {
    projectKey: '침수안전',
    employeeName: '박기선',
    startMonth: '2025-06',
    endMonth: '2025-12',
    monthlyBaseSalary: 10105000,
    participationRate: 30.0,
    totalAmount: 36378000,
    monthlyPayment: 3031500,
    fundingType: 'in_kind',
  },

  // 2. 침수안전 (현금)
  {
    projectKey: '침수안전',
    employeeName: '김현영',
    startMonth: '2025-05',
    endMonth: '2025-12',
    monthlyBaseSalary: 3840000,
    participationRate: 58.6,
    totalAmount: 27002880,
    monthlyPayment: 2250240,
    fundingType: 'cash',
  },
  {
    projectKey: '침수안전',
    employeeName: '장영아',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 2900000,
    participationRate: 77.6,
    totalAmount: 27004800,
    monthlyPayment: 2250400,
    fundingType: 'cash',
  },
  {
    projectKey: '침수안전',
    employeeName: '김성호',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 4650000,
    participationRate: 48.4,
    totalAmount: 27007200,
    monthlyPayment: 2250600,
    fundingType: 'cash',
  },

  // 3. A-SW (현물)
  {
    projectKey: 'A-SW',
    employeeName: '박기선',
    startMonth: '2026-01',
    endMonth: '2026-12',
    monthlyBaseSalary: 10000000,
    participationRate: 10.0,
    totalAmount: 12000000,
    monthlyPayment: 1000000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '최현민',
    startMonth: '2026-01',
    endMonth: '2026-12',
    monthlyBaseSalary: 5850000,
    participationRate: 10.0,
    totalAmount: 7020000,
    monthlyPayment: 585000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '김현영',
    startMonth: '2026-01',
    endMonth: '2026-12',
    monthlyBaseSalary: 4433333,
    participationRate: 10.03,
    totalAmount: 5335960,
    monthlyPayment: 444663,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '이지후',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 3500000,
    participationRate: 50.0,
    totalAmount: 5250000,
    monthlyPayment: 1750000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '차지은',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 3500000,
    participationRate: 50.0,
    totalAmount: 5250000,
    monthlyPayment: 1750000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '최시용',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 3833333,
    participationRate: 50.0,
    totalAmount: 5750000,
    monthlyPayment: 1916667,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '장한진',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 3833333,
    participationRate: 56.53,
    totalAmount: 6500950,
    monthlyPayment: 2166983,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '이건희',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 4250000,
    participationRate: 20.0,
    totalAmount: 2550000,
    monthlyPayment: 850000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '고동훤',
    startMonth: '2025-10',
    endMonth: '2025-12',
    monthlyBaseSalary: 3500000,
    participationRate: 60.0,
    totalAmount: 6300000,
    monthlyPayment: 2100000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '오현아',
    startMonth: '2025-09',
    endMonth: '2025-12',
    monthlyBaseSalary: 4500000,
    participationRate: 30.0,
    totalAmount: 4050000,
    monthlyPayment: 1350000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '최제윤',
    startMonth: '2025-09',
    endMonth: '2026-08',
    monthlyBaseSalary: 4000000,
    participationRate: 100.0,
    totalAmount: 48000000,
    monthlyPayment: 4000000,
    fundingType: 'in_kind',
  },
  {
    projectKey: 'A-SW',
    employeeName: '오현종',
    startMonth: '2025-09',
    endMonth: '2026-08',
    monthlyBaseSalary: 3500000,
    participationRate: 100.0,
    totalAmount: 42000000,
    monthlyPayment: 3500000,
    fundingType: 'in_kind',
  },

  // 4. 캠틱-AI솔루션 (현물)
  {
    projectKey: '캠틱-AI솔루션',
    employeeName: '박기선',
    startMonth: '2025-01',
    endMonth: '2025-10',
    monthlyBaseSalary: 7000000,
    participationRate: 12.5,
    totalAmount: 8750000,
    monthlyPayment: 875000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '캠틱-AI솔루션',
    employeeName: '이건희',
    startMonth: '2025-01',
    endMonth: '2025-09',
    monthlyBaseSalary: 3700000,
    participationRate: 10.0,
    totalAmount: 3330000,
    monthlyPayment: 370000,
    fundingType: 'in_kind',
  },

  // 5. 스마트팜-과채류 (현물)
  {
    projectKey: '스마트팜-과채류',
    employeeName: '박기선',
    startMonth: '2025-04',
    endMonth: '2025-07',
    monthlyBaseSalary: 7000000,
    participationRate: 27.0,
    totalAmount: 7546000,
    monthlyPayment: 1886500,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '박기선',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 8700000,
    participationRate: 23.8,
    totalAmount: 10357500,
    monthlyPayment: 2072340,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '최시용',
    startMonth: '2025-04',
    endMonth: '2025-12',
    monthlyBaseSalary: 3300000,
    participationRate: 27.0,
    totalAmount: 8019000,
    monthlyPayment: 891000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '김대곤',
    startMonth: '2025-04',
    endMonth: '2025-07',
    monthlyBaseSalary: 4500000,
    participationRate: 13.0,
    totalAmount: 2340000,
    monthlyPayment: 585000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '최현민',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 5000000,
    participationRate: 8.0,
    totalAmount: 2000000,
    monthlyPayment: 400000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '차지은',
    startMonth: '2025-04',
    endMonth: '2025-12',
    monthlyBaseSalary: 3300000,
    participationRate: 9.0,
    totalAmount: 2673000,
    monthlyPayment: 297000,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-과채류',
    employeeName: '이건희',
    startMonth: '2025-04',
    endMonth: '2025-12',
    monthlyBaseSalary: 3700000,
    participationRate: 9.21,
    totalAmount: 3064500,
    monthlyPayment: 340770,
    fundingType: 'in_kind',
  },

  // 6. 스마트팜-추종형 (현물)
  {
    projectKey: '스마트팜-추종형',
    employeeName: '박기선',
    startMonth: '2025-04',
    endMonth: '2025-07',
    monthlyBaseSalary: 7000000,
    participationRate: 7.05,
    totalAmount: 1974000,
    monthlyPayment: 493500,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-추종형',
    employeeName: '박기선',
    startMonth: '2025-08',
    endMonth: '2025-12',
    monthlyBaseSalary: 8700000,
    participationRate: 5.7,
    totalAmount: 2466000,
    monthlyPayment: 493200,
    fundingType: 'in_kind',
  },
  {
    projectKey: '스마트팜-추종형',
    employeeName: '김현영',
    startMonth: '2025-04',
    endMonth: '2025-12',
    monthlyBaseSalary: 3840000,
    participationRate: 100.0,
    totalAmount: 34560000,
    monthlyPayment: 3840000,
    fundingType: 'in_kind',
  },
]

/**
 * 직원 이름으로 ID 조회 (한글 이름: last_name + first_name)
 */
async function getEmployeeIdByName(name: string): Promise<string | null> {
  try {
    const result = await query(
      `
      SELECT id 
      FROM employees 
      WHERE 
        CASE
          WHEN first_name ~ '^[가-힣]+$' AND last_name ~ '^[가-힣]+$' THEN
            last_name || first_name = $1
          ELSE
            first_name || ' ' || last_name = $1
        END
      LIMIT 1
    `,
      [name],
    )

    return result.rows.length > 0 ? result.rows[0].id : null
  } catch (error) {
    logger.error(`Error finding employee by name ${name}:`, error)
    return null
  }
}

/**
 * 프로젝트 코드로 ID 조회
 */
async function getProjectIdByCode(code: string): Promise<string | null> {
  try {
    const result = await query(
      `
      SELECT id FROM projects WHERE code = $1 LIMIT 1
    `,
      [code],
    )

    return result.rows.length > 0 ? result.rows[0].id : null
  } catch (error) {
    logger.error(`Error finding project by code ${code}:`, error)
    return null
  }
}

/**
 * 인건비 카테고리 ID 조회
 */
async function getPersonnelCostCategoryId(): Promise<string | null> {
  try {
    const result = await query(`
      SELECT id FROM evidence_categories WHERE name = '인건비' LIMIT 1
    `)

    return result.rows.length > 0 ? result.rows[0].id : null
  } catch (error) {
    logger.error('Error finding personnel cost category:', error)
    return null
  }
}

/**
 * 월의 마지막 날짜 계산
 */
function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${yearMonth}-${String(lastDay).padStart(2, '0')}`
}

/**
 * 날짜 범위 내의 월 목록 생성 (2025-09까지만)
 */
function getMonthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = []
  const [startYear, startMon] = startMonth.split('-').map(Number)
  const [endYear, endMon] = endMonth.split('-').map(Number)
  const cutoffYear = 2025
  const cutoffMonth = 9

  let currentYear = startYear
  let currentMonth = startMon

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMon)) {
    // 2025-09까지만
    if (currentYear > cutoffYear || (currentYear === cutoffYear && currentMonth > cutoffMonth)) {
      break
    }

    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return months
}

/**
 * 해당 월이 속한 project_budgets 레코드 찾기
 */
async function findProjectBudgetForMonth(
  projectId: string,
  targetMonth: string,
): Promise<string | null> {
  try {
    const targetDate = `${targetMonth}-15` // 월 중간 날짜로 검색
    const result = await query(
      `
      SELECT id 
      FROM project_budgets 
      WHERE project_id = $1
        AND start_date <= $2::date
        AND end_date >= $2::date
      LIMIT 1
    `,
      [projectId, targetDate],
    )

    return result.rows.length > 0 ? result.rows[0].id : null
  } catch (error) {
    logger.error(`Error finding project budget for month ${targetMonth}:`, error)
    return null
  }
}

/**
 * 기존 데이터 삭제
 */
async function deleteExistingData() {
  logger.info('🗑️  Deleting existing project members and personnel cost evidence...')

  try {
    // project_members 삭제 (CASCADE로 연관 데이터도 삭제됨)
    const memberResult = await query(`
      DELETE FROM project_members 
      WHERE project_id IN (
        SELECT id FROM projects WHERE code LIKE 'PROJ_%'
      )
    `)
    logger.info(`   Deleted ${memberResult.rowCount} project members`)

    // 인건비 증빙 삭제
    const categoryId = await getPersonnelCostCategoryId()
    if (categoryId) {
      const evidenceResult = await query(
        `
        DELETE FROM evidence_items 
        WHERE category_id = $1
      `,
        [categoryId],
      )
      logger.info(`   Deleted ${evidenceResult.rowCount} personnel cost evidence items`)
    }

    logger.info('✅ Existing data deleted successfully')
  } catch (error) {
    logger.error('Error deleting existing data:', error)
    throw error
  }
}

/**
 * 참여연구원 데이터 입력
 */
async function insertProjectMembers() {
  logger.info('\n📝 Inserting project members...')

  let inserted = 0
  let skipped = 0
  const memberIdMap = new Map<string, string>() // key: projectCode-employeeName-startMonth

  for (const data of MEMBER_DATA) {
    const projectCode = PROJECT_MAPPING[data.projectKey]
    if (!projectCode) {
      logger.warn(`   ⚠️  Unknown project key: ${data.projectKey}`)
      skipped++
      continue
    }

    const projectId = await getProjectIdByCode(projectCode)
    if (!projectId) {
      logger.error(`   ❌ Project not found: ${projectCode}`)
      throw new Error(`Project not found: ${projectCode}`)
    }

    const employeeId = await getEmployeeIdByName(data.employeeName)
    if (!employeeId) {
      logger.warn(`   ⚠️  Employee not found: ${data.employeeName} - skipping`)
      skipped++
      continue
    }

    try {
      const startDate = `${data.startMonth}-01`
      const endDate = getLastDayOfMonth(data.endMonth)
      const cashAmount = data.fundingType === 'cash' ? data.monthlyPayment : 0
      const inKindAmount = data.fundingType === 'in_kind' ? data.monthlyPayment : 0

      const result = await query(
        `
        INSERT INTO project_members (
          project_id, employee_id, role, participation_rate,
          start_date, end_date, monthly_amount, cash_amount, in_kind_amount,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `,
        [
          projectId,
          employeeId,
          '참여연구원',
          data.participationRate,
          startDate,
          endDate,
          data.monthlyPayment,
          cashAmount,
          inKindAmount,
          'active',
        ],
      )

      const memberId = result.rows[0].id
      const key = `${projectCode}-${data.employeeName}-${data.startMonth}`
      memberIdMap.set(key, memberId)

      inserted++
      logger.info(
        `   ✓ ${data.employeeName} (${data.projectKey}, ${data.startMonth}~${data.endMonth})`,
      )
    } catch (error) {
      logger.error(`   ❌ Error inserting member ${data.employeeName}:`, error)
      skipped++
    }
  }

  logger.info(`\n✅ Project members inserted: ${inserted}, skipped: ${skipped}`)
  return memberIdMap
}

/**
 * 인건비 증빙 데이터 입력 (2025-09까지)
 */
async function insertPersonnelCostEvidence(memberIdMap: Map<string, string>) {
  logger.info('\n💰 Inserting personnel cost evidence (up to 2025-09)...')

  const categoryId = await getPersonnelCostCategoryId()
  if (!categoryId) {
    logger.error('   ❌ Personnel cost category not found!')
    throw new Error('Personnel cost category not found')
  }

  let inserted = 0
  let skipped = 0

  for (const data of MEMBER_DATA) {
    const projectCode = PROJECT_MAPPING[data.projectKey]
    if (!projectCode) continue

    const projectId = await getProjectIdByCode(projectCode)
    if (!projectId) continue

    const employeeId = await getEmployeeIdByName(data.employeeName)
    if (!employeeId) continue

    const key = `${projectCode}-${data.employeeName}-${data.startMonth}`
    const memberId = memberIdMap.get(key)

    // 월별로 증빙 생성
    const months = getMonthsBetween(data.startMonth, data.endMonth)

    for (const month of months) {
      const projectBudgetId = await findProjectBudgetForMonth(projectId, month)
      if (!projectBudgetId) {
        logger.warn(`   ⚠️  No budget found for ${data.employeeName} ${month} - skipping`)
        skipped++
        continue
      }

      try {
        const [year, monthNum] = month.split('-')
        const evidenceName = `${data.employeeName} ${year}년 ${parseInt(monthNum)}월 인건비`
        const evidenceMonth = `${month}-01`

        await query(
          `
          INSERT INTO evidence_items (
            project_budget_id, category_id, employee_id, project_member_id, evidence_month,
            name, budget_amount, spent_amount, status, assignee_id,
            progress, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `,
          [
            projectBudgetId,
            categoryId,
            employeeId,
            memberId,
            evidenceMonth,
            evidenceName,
            data.monthlyPayment,
            data.monthlyPayment,
            'completed',
            employeeId,
            100,
          ],
        )

        inserted++
      } catch (error) {
        logger.error(`   ❌ Error inserting evidence for ${data.employeeName} ${month}:`, error)
        skipped++
      }
    }
  }

  logger.info(`\n✅ Personnel cost evidence inserted: ${inserted}, skipped: ${skipped}`)
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    logger.info('🚀 Starting RD personnel data migration...\n')

    // 1. 기존 데이터 삭제
    await deleteExistingData()

    // 2. 참여연구원 데이터 입력
    const memberIdMap = await insertProjectMembers()

    // 3. 인건비 증빙 데이터 입력
    await insertPersonnelCostEvidence(memberIdMap)

    logger.info('\n✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    logger.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// 스크립트 실행
main()
