import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

const PROJECT_MAPPING: Record<string, string> = {
  '무기체계 개조개발': 'PROJ_2024_003',
  '스마트팜(작업자추종)': 'PROJ_2025_002',
  '스마트팜(적심적과)': 'PROJ_2025_001',
  '침수안전산업': 'PROJ_2025_003',
  'AI 솔루션 실증 지원': 'PROJ_2024_002'
}

const CATEGORY_NAME_TO_CODE: Record<string, string> = {
  시약재료구입비: '2001',
  연구재료비: '2001',
  시제품제작경비: '2003',
  연구용역비: '3002',
  국내여비: '3003',
  회의비: '3005',
  업무추진비: '3006',
  연구활동비: '3001'
}

interface ExpenseItem {
  projectKey: string
  categoryName: string
  vendorName?: string
  itemDetail: string
  amount: number
  taxAmount?: number
  paymentDate?: string
  notes?: string
}

const EXPENSES: ExpenseItem[] = [
  // 무기체계 개조개발 - 시약 재료 구입비
  {
    projectKey: '무기체계 개조개발',
    categoryName: '시약재료구입비',
    vendorName: '(주)디클래스',
    itemDetail: '시험용 드론 프레임',
    amount: 6000000,
    taxAmount: 600000,
    paymentDate: '2025-09-04'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '시약재료구입비',
    vendorName: '(주)스페이스케이',
    itemDetail: '시험용 컨트롤러',
    amount: 5400000,
    taxAmount: 540000,
    paymentDate: '2025-09-04'
  },

  // 무기체계 - 시제품 제작경비
  {
    projectKey: '무기체계 개조개발',
    categoryName: '시제품제작경비',
    vendorName: '스카에이어',
    itemDetail: '지상통제 데모시스템',
    amount: 26000000,
    taxAmount: 2600000,
    paymentDate: '2025-09-02'
  },

  // 무기체계 - 국내여비
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론쇼 코리아(개인차)_김대곤',
    amount: 119640,
    paymentDate: '2025-03-04'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론쇼 코리아(개인차) 식비',
    amount: 68185,
    taxAmount: 6815,
    paymentDate: '2025-02-26'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론쇼 코리아(법인차) 식비',
    amount: 72455,
    taxAmount: 7245,
    paymentDate: '2025-02-26'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론프릭 출장_이건희',
    amount: 123454,
    paymentDate: '2025-05-12'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론프릭 출장_이건희',
    amount: 55637,
    paymentDate: '2025-05-20'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '국내여비',
    itemDetail: '드론프릭 출장 일비_이건희',
    amount: 20000,
    paymentDate: '2025-05-26'
  },

  // 무기체계 - 회의비
  {
    projectKey: '무기체계 개조개발',
    categoryName: '회의비',
    vendorName: '라보테',
    itemDetail: '회의비',
    amount: 97274,
    taxAmount: 9726,
    paymentDate: '2025-02-27'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '회의비',
    vendorName: '두거리 우신탕',
    itemDetail: '회의비',
    amount: 82728,
    taxAmount: 8272,
    paymentDate: '2025-03-05'
  },
  {
    projectKey: '무기체계 개조개발',
    categoryName: '회의비',
    vendorName: '하늘천',
    itemDetail: '회의비',
    amount: 68182,
    taxAmount: 6818,
    paymentDate: '2025-05-21'
  },

  // 스마트팜(작업자추종) - 연구재료비
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구재료비',
    vendorName: '엔티렉스',
    itemDetail: '라스베리파이 CM4',
    amount: 1640000,
    taxAmount: 164000,
    paymentDate: '2025-05-14'
  },
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구재료비',
    vendorName: '디스플레이스먼트',
    itemDetail: 'AGX Orin Dev Kit 외 5건',
    amount: 12467000,
    taxAmount: 1246700,
    paymentDate: '2025-07-24'
  },
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구재료비',
    vendorName: '사이더스',
    itemDetail: 'RouteCAM_CU86_CXLC_IP67',
    amount: 1780545,
    paymentDate: '2025-08-21'
  },
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구재료비',
    itemDetail: 'Nvidia Jetson Orin Nano 8GB Edge Computer T218',
    amount: 782446,
    taxAmount: 33160,
    paymentDate: '2025-08-27'
  },

  // 스마트팜(작업자추종) - 연구용역비
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구용역비',
    vendorName: '에어플레이',
    itemDetail: '로봇관제 시스템 UXUI 개발',
    amount: 22000000,
    taxAmount: 2200000,
    paymentDate: '2025-06-25'
  },
  {
    projectKey: '스마트팜(작업자추종)',
    categoryName: '연구용역비',
    vendorName: '디클래스',
    itemDetail: '로봇 관제 테스트 모빌리티 제작',
    amount: 25500000,
    taxAmount: 2550000,
    paymentDate: '2025-07-23'
  },

  // 스마트팜(적심적과) - 연구재료비
  {
    projectKey: '스마트팜(적심적과)',
    categoryName: '연구재료비',
    vendorName: '엔티렉스',
    itemDetail: '라스베리파이 CM4',
    amount: 1640000,
    paymentDate: '2025-05-14'
  },
  {
    projectKey: '스마트팜(적심적과)',
    categoryName: '연구재료비',
    vendorName: '(주)스페이스케이',
    itemDetail: 'Netgear GS324PP (PoE) 외 8건',
    amount: 10272500,
    paymentDate: '2025-07-24'
  },

  // 스마트팜(적심적과) - 연구용역비
  {
    projectKey: '스마트팜(적심적과)',
    categoryName: '연구용역비',
    vendorName: '에어플레이',
    itemDetail: '스마트팜 로봇 운영 설계 UX/UI 개발',
    amount: 27000000,
    paymentDate: '2025-08-26'
  },
  {
    projectKey: '스마트팜(적심적과)',
    categoryName: '연구용역비',
    vendorName: '디스플레이스먼트',
    itemDetail: '스마트팜 로봇 데브옵스 UXUI 개발',
    amount: 25000000,
    paymentDate: '2025-08-26'
  },

  // 침수안전 - 연구용역비
  {
    projectKey: '침수안전산업',
    categoryName: '연구용역비',
    vendorName: 'MK 솔루션',
    itemDetail: '시험용 드론 기체 설계 외주 용역',
    amount: 9000000,
    notes: '10월 말 예정'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구용역비',
    vendorName: '에어플레이',
    itemDetail: '침수 데이터 시각화 및 예측 UXUI 개발 용역',
    amount: 9000000,
    paymentDate: '2025-09-17'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구용역비',
    vendorName: '디스플레이스먼트',
    itemDetail: '침수 대응 인물 인식 AI 모델 데이터셋 구축 및 학습용 모듈 UXUI 개발 용역',
    amount: 9000000,
    paymentDate: '2025-09-18'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구용역비',
    vendorName: '(주)스페이스케이',
    itemDetail: '항공 영상 데이터셋 촬영 외주 용역',
    amount: 8000000,
    notes: '11월 중 예정'
  },

  // 침수안전 - 연구재료비
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: 'MK 솔루션',
    itemDetail: '시험용 드론 프레임 3개',
    amount: 9000000,
    notes: '이번주 예정'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '디클래스',
    itemDetail: '시험용 드론 비행 컨트롤러 3개',
    amount: 9000000,
    paymentDate: '2025-09-26'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '스카이에어',
    itemDetail: '시험용 드론 배터리 6개',
    amount: 2700000,
    notes: '10/01 예정'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '이티컴퍼니',
    itemDetail: '시험용 드론 영상 송수신 장치 3개',
    amount: 6000000,
    paymentDate: '2025-10-01'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '스카이에어',
    itemDetail: '시험용 드론 RTK GPS 3개',
    amount: 6300000,
    notes: '10/01 예정'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '이티컴퍼니',
    itemDetail: '시험용 드론 컴패니언 컴퓨팅 모듈 3개',
    amount: 1800000,
    paymentDate: '2025-10-01'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '디큐브랩',
    itemDetail: '시험용 드론 Edge 컴퓨팅 모듈 3개',
    amount: 9090000,
    paymentDate: '2025-09-23'
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '바른컴퓨터',
    itemDetail: 'AI 모델 학습 RTX 5090 GPU 2way',
    amount: 9080640
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '바른컴퓨터',
    itemDetail: 'AMD Ryzen 9 그레니트',
    amount: 1090800
  },
  {
    projectKey: '침수안전산업',
    categoryName: '연구재료비',
    vendorName: '바른컴퓨터',
    itemDetail: 'GIGABYTE X870E AI',
    amount: 954840
  },

  // AI 솔루션 - 연구용역비
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '연구용역비',
    vendorName: '에어플레이',
    itemDetail: '지형 데이터 시스템 UXUI',
    amount: 16000000,
    paymentDate: '2025-08-13'
  },
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '연구용역비',
    vendorName: '에어플레이',
    itemDetail: '관제 시스템 UXUI 고도화',
    amount: 14000000,
    paymentDate: '2025-07-17'
  },

  // AI 솔루션 - 업무추진비
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '업무추진비',
    vendorName: '전주밥상다잡수소',
    itemDetail: '사업추진비',
    amount: 225455,
    paymentDate: '2025-08-12'
  },
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '업무추진비',
    vendorName: '육희당',
    itemDetail: '사업추진비',
    amount: 270912,
    paymentDate: '2025-08-14'
  },
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '업무추진비',
    vendorName: '육희당',
    itemDetail: '사업추진비',
    amount: 259095,
    paymentDate: '2025-08-21'
  },
  {
    projectKey: 'AI 솔루션 실증 지원',
    categoryName: '업무추진비',
    vendorName: '하늘천숫불갈비',
    itemDetail: '사업추진비',
    amount: 81818,
    paymentDate: '2025-09-04'
  }
]

// 헬퍼 함수들
async function getVendorIdMap(): Promise<Record<string, string>> {
  const result = await query(`
    SELECT id, name FROM sales_customers
  `)
  const map: Record<string, string> = {}
  for (const row of result.rows) {
    map[row.name] = row.id
  }
  return map
}

async function getCategoryIdByCode(): Promise<Record<string, string>> {
  const result = await query(`
    SELECT id, code FROM evidence_categories
  `)
  const map: Record<string, string> = {}
  for (const row of result.rows) {
    map[row.code] = row.id
  }
  return map
}

async function getProjectByCode(code: string): Promise<any> {
  const result = await query(
    `
    SELECT id, code, title FROM projects WHERE code = $1
  `,
    [code]
  )
  if (result.rows.length === 0) {
    throw new Error(`Project not found: ${code}`)
  }
  return result.rows[0]
}

async function findOrCreateBudget(projectId: string, paymentDate?: string): Promise<any> {
  // 날짜가 있으면 해당 날짜에 맞는 budget 찾기
  // 없으면 가장 최근 budget 사용
  const result = await query(
    `
    SELECT id, period_number, start_date::text, end_date::text
    FROM project_budgets
    WHERE project_id = $1
    ORDER BY period_number DESC
    LIMIT 1
  `,
    [projectId]
  )

  if (result.rows.length === 0) {
    throw new Error(`No budget found for project: ${projectId}`)
  }

  return result.rows[0]
}

async function deleteNonPersonnelEvidenceItems(): Promise<number> {
  const result = await query(`
    DELETE FROM evidence_items ei
    USING evidence_categories ec
    WHERE ei.category_id = ec.id
    AND ec.code NOT LIKE '1%'
    RETURNING ei.id
  `)
  return result.rows.length
}

async function createEvidenceItem(data: any): Promise<void> {
  await query(
    `
    INSERT INTO evidence_items (
      project_budget_id, category_id, name,
      budget_amount, spent_amount, status,
      vendor_id, vendor_name, item_detail,
      tax_amount, payment_date, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `,
    [
      data.project_budget_id,
      data.category_id,
      data.name,
      data.budget_amount,
      data.spent_amount,
      data.status,
      data.vendor_id,
      data.vendor_name,
      data.item_detail,
      data.tax_amount,
      data.payment_date,
      data.notes
    ]
  )
}

async function migrateExpenseData() {
  logger.info('세부 집행 내역 마이그레이션 시작')

  // 1. 거래처 매핑 캐시
  const vendorMap = await getVendorIdMap()
  logger.info(`거래처 ${Object.keys(vendorMap).length}개 로드 완료`)

  // 2. 카테고리 코드 매핑
  const categoryMap = await getCategoryIdByCode()
  logger.info(`카테고리 ${Object.keys(categoryMap).length}개 로드 완료`)

  // 3. 기존 비인건비 증빙 삭제
  const deletedCount = await deleteNonPersonnelEvidenceItems()
  logger.info(`기존 비인건비 증빙 ${deletedCount}개 삭제 완료`)

  // 4. 항목별 처리
  let successCount = 0
  let errorCount = 0

  for (const item of EXPENSES) {
    try {
      const projectCode = PROJECT_MAPPING[item.projectKey]
      if (!projectCode) {
        throw new Error(`Unknown project key: ${item.projectKey}`)
      }

      const project = await getProjectByCode(projectCode)
      const budget = await findOrCreateBudget(project.id, item.paymentDate)

      const categoryCode = CATEGORY_NAME_TO_CODE[item.categoryName]
      if (!categoryCode) {
        throw new Error(`Unknown category: ${item.categoryName}`)
      }

      const categoryId = categoryMap[categoryCode]
      if (!categoryId) {
        throw new Error(`Category ID not found for code: ${categoryCode}`)
      }

      const vendorId = item.vendorName ? vendorMap[item.vendorName] : null

      const name = item.vendorName ? `${item.vendorName} ${item.itemDetail}` : item.itemDetail

      await createEvidenceItem({
        project_budget_id: budget.id,
        category_id: categoryId,
        name,
        budget_amount: item.amount,
        spent_amount: item.amount,
        status: 'completed',
        vendor_id: vendorId,
        vendor_name: item.vendorName,
        item_detail: item.itemDetail,
        tax_amount: item.taxAmount || 0,
        payment_date: item.paymentDate || new Date().toISOString().split('T')[0],
        notes: item.notes
      })

      logger.info(`✓ 증빙 생성: ${projectCode} - ${name}`)
      successCount++
    } catch (error) {
      logger.error(`✗ 증빙 생성 실패: ${item.projectKey} - ${item.itemDetail}`, error)
      errorCount++
    }
  }

  logger.info(`마이그레이션 완료: 성공 ${successCount}개, 실패 ${errorCount}개`)
}

migrateExpenseData()
  .then(() => {
    logger.info('마이그레이션 성공')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('마이그레이션 실패:', error)
    process.exit(1)
  })

