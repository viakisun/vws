import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 전문 회계 기준에 맞는 카테고리 데이터 (중복 제거)
const PROFESSIONAL_CATEGORIES = [
  // 수입 카테고리 (4xxx 계정)
  {
    name: '코드없음',
    type: 'income',
    accountingCode: null,
    taxCode: null,
    color: '#9CA3AF',
    description: '회계 코드가 지정되지 않은 수입',
    isSystem: true,
    isDefault: true,
    parentId: null,
  },
  {
    name: '매출액',
    type: 'income',
    accountingCode: '4110',
    taxCode: '01',
    color: '#10B981',
    description: '상품 및 서비스 판매 수입',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '영업외수익',
    type: 'income',
    accountingCode: '4120',
    taxCode: '02',
    color: '#059669',
    description: '영업활동 외 수익',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '금융수익',
    type: 'income',
    accountingCode: '4130',
    taxCode: '03',
    color: '#047857',
    description: '이자수익, 배당수익 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '기타수익',
    type: 'income',
    accountingCode: '4140',
    taxCode: '04',
    color: '#065F46',
    description: '기타 수익',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },

  // 지출 카테고리 (5xxx 계정)
  {
    name: '코드없음',
    type: 'expense',
    accountingCode: null,
    taxCode: null,
    color: '#9CA3AF',
    description: '회계 코드가 지정되지 않은 지출',
    isSystem: true,
    isDefault: true,
    parentId: null,
  },
  {
    name: '매출원가',
    type: 'expense',
    accountingCode: '5110',
    taxCode: '11',
    color: '#EF4444',
    description: '상품 및 서비스 판매 원가',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '판매비',
    type: 'expense',
    accountingCode: '5120',
    taxCode: '12',
    color: '#DC2626',
    description: '판매활동 관련 비용',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '관리비',
    type: 'expense',
    accountingCode: '5130',
    taxCode: '13',
    color: '#B91C1C',
    description: '일반관리비',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '급여',
    type: 'expense',
    accountingCode: '5140',
    taxCode: '14',
    color: '#991B1B',
    description: '직원 급여 및 상여금',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '복리후생비',
    type: 'expense',
    accountingCode: '5150',
    taxCode: '15',
    color: '#7F1D1D',
    description: '직원 복리후생비',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '임대료',
    type: 'expense',
    accountingCode: '5160',
    taxCode: '16',
    color: '#F97316',
    description: '사무실, 창고 등 임대료',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '공과금',
    type: 'expense',
    accountingCode: '5170',
    taxCode: '17',
    color: '#EA580C',
    description: '전기료, 가스료, 수도료 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '통신비',
    type: 'expense',
    accountingCode: '5180',
    taxCode: '18',
    color: '#C2410C',
    description: '전화료, 인터넷비 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '교통비',
    type: 'expense',
    accountingCode: '5190',
    taxCode: '19',
    color: '#9A3412',
    description: '교통비, 주유비 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '마케팅비',
    type: 'expense',
    accountingCode: '5200',
    taxCode: '20',
    color: '#7C2D12',
    description: '광고비, 홍보비 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '연구개발비',
    type: 'expense',
    accountingCode: '5210',
    taxCode: '21',
    color: '#F59E0B',
    description: 'R&D 관련 비용',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '감가상각비',
    type: 'expense',
    accountingCode: '5220',
    taxCode: '22',
    color: '#D97706',
    description: '유형자산 감가상각비',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '보험료',
    type: 'expense',
    accountingCode: '5230',
    taxCode: '23',
    color: '#B45309',
    description: '보험료',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '세금',
    type: 'expense',
    accountingCode: '5240',
    taxCode: '24',
    color: '#92400E',
    description: '법인세, 부가가치세 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '금융비용',
    type: 'expense',
    accountingCode: '5250',
    taxCode: '25',
    color: '#78350F',
    description: '이자비용, 할인료 등',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '기타비용',
    type: 'expense',
    accountingCode: '5260',
    taxCode: '26',
    color: '#451A03',
    description: '기타 비용',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },

  // 이체 카테고리
  {
    name: '코드없음',
    type: 'transfer',
    accountingCode: null,
    taxCode: null,
    color: '#9CA3AF',
    description: '회계 코드가 지정되지 않은 이체',
    isSystem: true,
    isDefault: true,
    parentId: null,
  },
  {
    name: '계좌이체',
    type: 'transfer',
    accountingCode: '6000',
    taxCode: '30',
    color: '#6366F1',
    description: '계좌 간 자금 이체',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '현금입출금',
    type: 'transfer',
    accountingCode: '6010',
    taxCode: '31',
    color: '#4F46E5',
    description: '현금 입출금',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },

  // 조정 카테고리
  {
    name: '코드없음',
    type: 'adjustment',
    accountingCode: null,
    taxCode: null,
    color: '#9CA3AF',
    description: '회계 코드가 지정되지 않은 조정',
    isSystem: true,
    isDefault: true,
    parentId: null,
  },
  {
    name: '잔액조정',
    type: 'adjustment',
    accountingCode: '7000',
    taxCode: '40',
    color: '#8B5CF6',
    description: '계좌 잔액 조정',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
  {
    name: '오류수정',
    type: 'adjustment',
    accountingCode: '7010',
    taxCode: '41',
    color: '#7C3AED',
    description: '거래 오류 수정',
    isSystem: true,
    isDefault: false,
    parentId: null,
  },
]

export const POST: RequestHandler = async () => {
  try {
    // 기존 시스템 카테고리들을 비활성화하고 새로운 데이터로 업데이트
    await query('UPDATE finance_categories SET is_active = false WHERE is_system = true')

    // 새로운 전문 카테고리 삽입 (기존과 중복되지 않도록)
    for (const category of PROFESSIONAL_CATEGORIES) {
      // 기존 카테고리가 있는지 확인
      const existing = await query(
        'SELECT id FROM finance_categories WHERE name = $1 AND type = $2',
        [category.name, category.type],
      )

      if (existing.rows.length > 0) {
        // 기존 카테고리 업데이트
        await query(
          `UPDATE finance_categories SET
           accounting_code = $1,
           tax_code = $2,
           color = $3,
           description = $4,
           is_active = $5,
           is_system = $6,
           is_default = $7
           WHERE id = $8`,
          [
            category.accountingCode,
            category.taxCode,
            category.color,
            category.description,
            true,
            category.isSystem,
            category.isDefault,
            existing.rows[0].id,
          ],
        )
      } else {
        // 새 카테고리 삽입
        await query(
          `INSERT INTO finance_categories 
           (name, type, accounting_code, tax_code, color, description, is_active, is_system, is_default, parent_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            category.name,
            category.type,
            category.accountingCode,
            category.taxCode,
            category.color,
            category.description,
            true,
            category.isSystem,
            category.isDefault,
            category.parentId,
          ],
        )
      }
    }

    return json({
      success: true,
      message: '전문 회계 기준 카테고리가 성공적으로 업데이트되었습니다.',
      count: PROFESSIONAL_CATEGORIES.length,
    })
  } catch (error) {
    console.error('카테고리 업데이트 실패:', error)
    return json(
      {
        success: false,
        error: `카테고리 업데이트에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 },
    )
  }
}
