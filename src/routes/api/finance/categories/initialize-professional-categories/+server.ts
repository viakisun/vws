import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 중소기업 전문 비용 분석 카테고리 (전문회계코드 포함)
const professionalCategories = [
  // === 수입 카테고리 ===
  {
    name: '제품매출',
    type: 'income',
    color: '#10B981',
    code: '4001',
    description: '주요 제품/서비스 매출',
    accountCode: '4-0001',
  },
  {
    name: '부업매출',
    type: 'income',
    color: '#059669',
    code: '4002',
    description: '부업, 용역, 기타 매출',
    accountCode: '4-0002',
  },
  {
    name: '투자수익',
    type: 'income',
    color: '#047857',
    code: '4003',
    description: '금융투자, 배당, 이자수익',
    accountCode: '4-0003',
  },
  {
    name: '기타수입',
    type: 'income',
    color: '#065F46',
    code: '4099',
    description: '임대수입, 보조금, 기타',
    accountCode: '4-0099',
  },

  // === 직접비 (제조원가) ===
  {
    name: '원재료비',
    type: 'expense',
    color: '#EF4444',
    code: '5101',
    description: '제조용 원재료 구매비용',
    accountCode: '5-1010',
  },
  {
    name: '외주가공비',
    type: 'expense',
    color: '#DC2626',
    code: '5102',
    description: '외부 제조/가공 비용',
    accountCode: '5-1020',
  },
  {
    name: '포장재비',
    type: 'expense',
    color: '#B91C1C',
    code: '5103',
    description: '포장재, 라벨, 포장비',
    accountCode: '5-1030',
  },

  // === 인건비 ===
  {
    name: '정규직급여',
    type: 'expense',
    color: '#F59E0B',
    code: '5201',
    description: '정규직 직원 급여',
    accountCode: '5-2010',
  },
  {
    name: '임시직급여',
    type: 'expense',
    color: '#D97706',
    code: '5202',
    description: '아르바이트, 계약직 급여',
    accountCode: '5-2020',
  },
  {
    name: '4대보험료',
    type: 'expense',
    color: '#B45309',
    code: '5203',
    description: '국민연금, 건강보험, 고용보험, 산재보험',
    accountCode: '5-2030',
  },
  {
    name: '퇴직급여',
    type: 'expense',
    color: '#92400E',
    code: '5204',
    description: '퇴직금, 퇴직연금',
    accountCode: '5-2040',
  },
  {
    name: '복리후생비',
    type: 'expense',
    color: '#78350F',
    code: '5205',
    description: '식대, 상여금, 교육비, 건강검진',
    accountCode: '5-2050',
  },

  // === 제조간접비 ===
  {
    name: '임대료',
    type: 'expense',
    color: '#8B5CF6',
    code: '5301',
    description: '사무실, 공장 임대료',
    accountCode: '5-3010',
  },
  {
    name: '공과금',
    type: 'expense',
    color: '#7C3AED',
    code: '5302',
    description: '전기료, 가스료, 수도료, 난방비',
    accountCode: '5-3020',
  },
  {
    name: '통신비',
    type: 'expense',
    color: '#6D28D9',
    code: '5303',
    description: '전화료, 인터넷, 모바일 통신비',
    accountCode: '5-3030',
  },
  {
    name: '운반비',
    type: 'expense',
    color: '#5B21B6',
    code: '5304',
    description: '배송비, 운송비, 택배비',
    accountCode: '5-3040',
  },
  {
    name: '수선비',
    type: 'expense',
    color: '#4C1D95',
    code: '5305',
    description: '기계설비 수리비, 유지보수비',
    accountCode: '5-3050',
  },

  // === 판매비 ===
  {
    name: '광고선전비',
    type: 'expense',
    color: '#EC4899',
    code: '5401',
    description: '광고비, 홍보비, 마케팅비',
    accountCode: '5-4010',
  },
  {
    name: '판매수수료',
    type: 'expense',
    color: '#DB2777',
    code: '5402',
    description: '판매대행, 중개 수수료',
    accountCode: '5-4020',
  },
  {
    name: '택배운송비',
    type: 'expense',
    color: '#BE185D',
    code: '5403',
    description: '고객 배송비, 택배비',
    accountCode: '5-4030',
  },

  // === 일반관리비 ===
  {
    name: '사무용품비',
    type: 'expense',
    color: '#06B6D4',
    code: '5501',
    description: '문구, 사무용품, 소모품',
    accountCode: '5-5010',
  },
  {
    name: '도서인쇄비',
    type: 'expense',
    color: '#0891B2',
    code: '5502',
    description: '도서, 인쇄비, 제본비',
    accountCode: '5-5020',
  },
  {
    name: '여비교통비',
    type: 'expense',
    color: '#0E7490',
    code: '5503',
    description: '출장비, 교통비, 주유비',
    accountCode: '5-5030',
  },
  {
    name: '접대비',
    type: 'expense',
    color: '#155E75',
    code: '5504',
    description: '업무상 접대비, 회식비',
    accountCode: '5-5040',
  },
  {
    name: '교육훈련비',
    type: 'expense',
    color: '#164E63',
    code: '5505',
    description: '직원 교육비, 연수비',
    accountCode: '5-5050',
  },
  {
    name: '연구개발비',
    type: 'expense',
    color: '#134E4A',
    code: '5506',
    description: 'R&D 비용, 특허비, 개발비',
    accountCode: '5-5060',
  },

  // === 금융비용 ===
  {
    name: '이자비용',
    type: 'expense',
    color: '#84CC16',
    code: '5601',
    description: '대출이자, 차입이자',
    accountCode: '5-6010',
  },
  {
    name: '할부이자비',
    type: 'expense',
    color: '#65A30D',
    code: '5602',
    description: '할부구매 이자비용',
    accountCode: '5-6020',
  },
  {
    name: '외환손실',
    type: 'expense',
    color: '#4D7C0F',
    code: '5603',
    description: '환율변동 손실',
    accountCode: '5-6030',
  },
  {
    name: '수수료',
    type: 'expense',
    color: '#365314',
    code: '5604',
    description: '은행수수료, 카드수수료, 기타수수료',
    accountCode: '5-6040',
  },

  // === 기타비용 ===
  {
    name: '보험료',
    type: 'expense',
    color: '#F97316',
    code: '5701',
    description: '화재보험, 배상보험, 기타보험료',
    accountCode: '5-7010',
  },
  {
    name: '세금',
    type: 'expense',
    color: '#EA580C',
    code: '5702',
    description: '재산세, 자동차세, 기타지방세',
    accountCode: '5-7020',
  },
  {
    name: '감가상각비',
    type: 'expense',
    color: '#C2410C',
    code: '5703',
    description: '유형자산, 무형자산 감가상각비',
    accountCode: '5-7030',
  },
  {
    name: '기타운영비',
    type: 'expense',
    color: '#9A3412',
    code: '5799',
    description: '기타 운영비용',
    accountCode: '5-7099',
  },
]

export const POST: RequestHandler = async () => {
  try {
    console.log('🏢 전문 비용 분석 카테고리 초기화 시작...')

    // 기존 카테고리 비활성화 (시스템 카테고리 제외)
    await query('UPDATE finance_categories SET is_active = false WHERE is_system = false')

    let createdCount = 0
    const createdCategories = []

    // 전문 카테고리 생성
    for (const category of professionalCategories) {
      try {
        const result = await query(
          `INSERT INTO finance_categories 
           (name, type, color, description, code, account_code, is_active, is_system, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
           RETURNING id, name, type, color, description, code, account_code`,
          [
            category.name,
            category.type,
            category.color,
            category.description,
            category.code,
            category.accountCode,
          ],
        )

        createdCategories.push(result.rows[0])
        createdCount++
        console.log(`✅ ${category.name} (${category.code}) 생성 완료`)
      } catch (error) {
        console.error(`❌ ${category.name} 생성 실패:`, error)
      }
    }

    return json({
      success: true,
      message: `${createdCount}개의 전문 비용 분석 카테고리가 생성되었습니다.`,
      createdCount,
      categories: createdCategories,
    })
  } catch (error) {
    console.error('❌ 전문 카테고리 초기화 실패:', error)
    return json(
      {
        success: false,
        message: '전문 카테고리 초기화에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
