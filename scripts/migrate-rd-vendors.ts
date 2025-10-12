import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

interface VendorData {
  name: string
  type: 'customer' | 'supplier' | 'both'
  business_number?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  industry?: string
  notes?: string
}

const VENDORS: VendorData[] = [
  // 무기체계 개조개발
  { name: '(주)디클래스', type: 'supplier', industry: '드론 제조', notes: '드론 프레임 공급업체' },
  {
    name: '(주)스페이스케이',
    type: 'supplier',
    industry: '전자장비',
    notes: '드론 컨트롤러 공급업체',
  },
  { name: '스카에이어', type: 'supplier', industry: '소프트웨어', notes: '지상통제 시스템 개발' },
  { name: '라보테', type: 'supplier', industry: '음식점', notes: '회의비' },
  { name: '두거리 우신탕', type: 'supplier', industry: '음식점', notes: '회의비' },
  { name: '하늘천', type: 'supplier', industry: '음식점', notes: '회의비' },

  // 스마트팜
  { name: '엔티렉스', type: 'supplier', industry: '전자부품', notes: '라스베리파이 공급업체' },
  {
    name: '디스플레이스먼트',
    type: 'supplier',
    industry: '전자장비',
    notes: 'AI 장비 공급업체',
  },
  { name: '사이더스', type: 'supplier', industry: '전자부품', notes: '카메라 모듈 공급업체' },
  { name: '에어플레이', type: 'supplier', industry: '소프트웨어', notes: 'UX/UI 개발 용역' },

  // 침수안전
  { name: 'MK 솔루션', type: 'supplier', industry: '드론 제조', notes: '드론 프레임 설계 및 제작' },
  { name: '이티컴퍼니', type: 'supplier', industry: '전자장비', notes: '드론 전자장비 공급' },
  { name: '디큐브랩', type: 'supplier', industry: '컴퓨팅', notes: 'Edge 컴퓨팅 모듈 공급' },
  { name: '바른컴퓨터', type: 'supplier', industry: '컴퓨터', notes: 'AI 학습용 하드웨어' },
  { name: '스카이에어', type: 'supplier', industry: '드론 부품', notes: '드론 배터리 및 GPS' },

  // AI 솔루션
  { name: '전주밥상다잡수소', type: 'supplier', industry: '음식점', notes: '업무추진비' },
  { name: '육희당', type: 'supplier', industry: '음식점', notes: '업무추진비' },
  { name: '하늘천숫불갈비', type: 'supplier', industry: '음식점', notes: '업무추진비' },
]

async function migrateVendors() {
  logger.info('거래처 데이터 마이그레이션 시작')

  let successCount = 0
  let skipCount = 0

  for (const vendor of VENDORS) {
    try {
      // Check if vendor already exists
      const checkResult = await query(`SELECT id FROM sales_customers WHERE name = $1`, [
        vendor.name,
      ])

      if (checkResult.rows.length > 0) {
        logger.info(`⊙ 거래처 이미 존재: ${vendor.name}`)
        skipCount++
        continue
      }

      // Insert new vendor
      const result = await query(
        `
        INSERT INTO sales_customers (
          name, type, status,
          business_number, contact_person, contact_phone, contact_email,
          address, industry, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name
      `,
        [
          vendor.name,
          vendor.type,
          'active',
          vendor.business_number || '000-00-00000',
          vendor.contact_person || '담당자',
          vendor.contact_phone || '010-0000-0000',
          vendor.contact_email || `contact@${vendor.name.replace(/[^a-zA-Z0-9]/g, '')}.com`,
          vendor.address || '서울특별시',
          vendor.industry || '제조/서비스업',
          vendor.notes || '자동 생성된 거래처',
        ],
      )

      if (result.rows.length > 0) {
        logger.info(`✓ 거래처 생성: ${vendor.name}`)
        successCount++
      }
    } catch (error) {
      logger.error(`✗ 거래처 생성 실패: ${vendor.name}`, error)
    }
  }

  logger.info(`거래처 마이그레이션 완료: 생성 ${successCount}개, 건너뜀 ${skipCount}개`)
}

migrateVendors()
  .then(() => {
    logger.info('마이그레이션 성공')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('마이그레이션 실패:', error)
    process.exit(1)
  })
