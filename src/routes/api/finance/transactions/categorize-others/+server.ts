import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 기타지출/기타수입 거래들을 적절한 카테고리로 자동 분류
export const POST: RequestHandler = async () => {
  try {
    logger.info('🔥🔥🔥 기타지출/기타수입 자동 분류 시작 🔥🔥🔥')

    // 기타지출/기타수입 카테고리 ID 조회
    const otherCategoriesResult = await query(`
      SELECT id, name FROM finance_categories 
      WHERE name IN ('기타지출', '기타수입') AND is_active = true
    `)

    if (!otherCategoriesResult.rows || otherCategoriesResult.rows.length === 0) {
      return json({
        success: false,
        message: '기타지출/기타수입 카테고리를 찾을 수 없습니다.',
      })
    }

    const otherCategoryIds = otherCategoriesResult.rows.map((row) => row.id)
    logger.info('🔥 기타 카테고리 ID들:', otherCategoryIds)

    // 카테고리별 키워드 매핑 (더 정교한 분류)
    const categoryMappings = [
      // 급여 관련
      {
        categoryName: '급여',
        keywords: ['급여', '월급', '봉급', '임금', '월급여', '급여금', '현금인건비', '인건비'],
        type: 'expense',
      },
      {
        categoryName: '정규직급여',
        keywords: ['정규직', '상시직', '정규직급여', '상시직급여'],
        type: 'expense',
      },
      {
        categoryName: '임시직급여',
        keywords: ['임시직', '단기직', '아르바이트', '일용직', '임시직급여'],
        type: 'expense',
      },

      // 매출 관련
      {
        categoryName: '제품매출',
        keywords: ['매출', '판매', '제품', '상품', '수주', '계약금', '사업비', 'JBTP사업비'],
        type: 'income',
      },
      {
        categoryName: '부업매출',
        keywords: ['부업', '부수입', '부대수입', '부업매출'],
        type: 'income',
      },
      {
        categoryName: '정부지원금',
        keywords: ['지원금', '보조금', '정부지원', '정부보조', '지원사업'],
        type: 'income',
      },

      // 운영비용
      {
        categoryName: '통신비',
        keywords: ['통신료', '인터넷', '전화', '휴대폰', '통신비', '인터넷당행'],
        type: 'expense',
      },
      {
        categoryName: '보험료',
        keywords: ['보험료', '보험', '퇴직연금', '퇴직연금이'],
        type: 'expense',
      },
      {
        categoryName: '세금',
        keywords: ['세금', '지방세', '국세', '부가세', '소득세'],
        type: 'expense',
      },
      {
        categoryName: '수수료',
        keywords: ['수수료', '통지수수료', '이체수수료', '거래수수료'],
        type: 'expense',
      },
      {
        categoryName: '대출이자',
        keywords: ['대출금이자', '대출이자', '이자', '금리'],
        type: 'expense',
      },

      // 은행/카드 관련
      {
        categoryName: '은행수수료',
        keywords: ['G-', 'E-', '카드대금', '지로', '센터일괄'],
        type: 'expense',
      },

      // 기타
      {
        categoryName: '기타수입',
        keywords: ['이자수익', '예금이자', '적금이자'],
        type: 'income',
      },
      {
        categoryName: '기타지출',
        keywords: ['기타지출', '기타비용', '잡비'],
        type: 'expense',
      },
    ]

    const updateResults: Array<{ keyword: string; category: string; count: number }> = []

    // 각 매핑에 대해 처리
    for (const mapping of categoryMappings) {
      // 대상 카테고리 조회
      const targetCategoryResult = await query(
        'SELECT id FROM finance_categories WHERE name = $1 AND type = $2 AND is_active = true',
        [mapping.categoryName, mapping.type],
      )

      if (!targetCategoryResult.rows || targetCategoryResult.rows.length === 0) {
        logger.info(`⚠️ 카테고리를 찾을 수 없음: ${mapping.categoryName} (${mapping.type})`)
        continue
      }

      const targetCategoryId = targetCategoryResult.rows[0].id

      // 키워드별로 거래 업데이트
      for (const keyword of mapping.keywords) {
        const updateResult = await query(
          `UPDATE finance_transactions 
           SET category_id = $1 
           WHERE category_id = ANY($2) 
           AND (description ILIKE $3 OR counterparty ILIKE $3)
           RETURNING id`,
          [targetCategoryId, otherCategoryIds, `%${keyword}%`],
        )

        if (updateResult.rows && updateResult.rows.length > 0) {
          const count = updateResult.rows.length
          updateResults.push({
            keyword,
            category: mapping.categoryName,
            count,
          })
          logger.info(`✅ "${keyword}" → ${mapping.categoryName}: ${count}건`)
        }
      }
    }

    // 총 업데이트된 거래 수 계산
    const totalUpdated = updateResults.reduce((sum, result) => sum + result.count, 0)

    logger.info(`🔥🔥🔥 자동 분류 완료: 총 ${totalUpdated}건 업데이트 🔥🔥🔥`)

    return json({
      success: true,
      message: `총 ${totalUpdated}건의 거래를 적절한 카테고리로 분류했습니다.`,
      totalUpdated,
      details: updateResults,
    })
  } catch (error: any) {
    logger.error('🔥🔥🔥 자동 분류 실패:', error)
    return json(
      {
        success: false,
        message: `자동 분류 중 오류가 발생했습니다: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
