import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { logger } from '$lib/utils/logger'

// 적요 기반 자동 카테고리 매핑
export const POST: RequestHandler = async () => {
  try {
    // 미분류 카테고리 ID 조회
    const uncategorizedResult = await query(`
      SELECT id FROM finance_categories 
      WHERE name = '미분류' AND is_active = true
      LIMIT 1
    `)

    if (!uncategorizedResult.rows || uncategorizedResult.rows.length === 0) {
      return json(
        {
          success: false,
          message: '미분류 카테고리를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const uncategorizedCategoryId = uncategorizedResult.rows[0].id

    // 카테고리별 키워드 매핑
    const categoryMappings = [
      // 급여 관련
      {
        categoryName: '급여',
        keywords: ['급여', '월급', '봉급', '임금', '월급여', '급여금'],
        type: 'expense',
      },
      { categoryName: '정규직급여', keywords: ['정규직', '상시직', '정규직급여'], type: 'expense' },
      {
        categoryName: '임시직급여',
        keywords: ['임시직', '단기직', '아르바이트', '일용직'],
        type: 'expense',
      },

      // 매출 관련
      {
        categoryName: '제품매출',
        keywords: ['매출', '판매', '제품', '상품', '수주', '계약금'],
        type: 'income',
      },
      { categoryName: '부업매출', keywords: ['부업', '부수입', '부대수입'], type: 'income' },
      { categoryName: '기타수입', keywords: ['기타수입', '기타수익', '기타매출'], type: 'income' },

      // 공과금/임대료
      {
        categoryName: '공과금',
        keywords: ['전기', '가스', '수도', '전화', '인터넷', '공과금', '요금'],
        type: 'expense',
      },
      {
        categoryName: '임대료',
        keywords: ['임대료', '월세', '전세', '임차료', '보증금'],
        type: 'expense',
      },

      // 마케팅/광고
      {
        categoryName: '광고선전비',
        keywords: ['광고', '홍보', '선전', '마케팅', '광고비'],
        type: 'expense',
      },
      { categoryName: '마케팅', keywords: ['마케팅', '홍보', '광고'], type: 'expense' },

      // 보험/복리후생
      {
        categoryName: '4대보험료',
        keywords: ['4대보험', '국민연금', '건강보험', '고용보험', '산재보험', '보험료'],
        type: 'expense',
      },
      { categoryName: '보험료', keywords: ['보험', '보험료'], type: 'expense' },
      {
        categoryName: '복리후생비',
        keywords: ['복리후생', '경조사', '상여금', '성과급'],
        type: 'expense',
      },

      // 사무용품/운영비
      {
        categoryName: '사무용품비',
        keywords: ['사무용품', '문구', '용지', '프린터', '컴퓨터'],
        type: 'expense',
      },
      {
        categoryName: '기타운영비',
        keywords: ['운영비', '기타운영', '일반관리비'],
        type: 'expense',
      },
      { categoryName: '운영비', keywords: ['운영비', '관리비'], type: 'expense' },

      // 교통/여비
      {
        categoryName: '여비교통비',
        keywords: ['교통비', '택시', '버스', '지하철', '주유', '연료', '주차'],
        type: 'expense',
      },
      { categoryName: '택배운송비', keywords: ['택배', '운송', '배송', '물류'], type: 'expense' },

      // 통신/수수료
      {
        categoryName: '통신비',
        keywords: ['통신비', '전화비', '인터넷', '데이터'],
        type: 'expense',
      },
      { categoryName: '수수료', keywords: ['수수료', '수수', '수수료비'], type: 'expense' },
      { categoryName: '판매수수료', keywords: ['판매수수료', '판매수수'], type: 'expense' },

      // 세금
      {
        categoryName: '세금',
        keywords: ['세금', '부가세', '소득세', '법인세', '지방세'],
        type: 'expense',
      },

      // 이자/금융
      {
        categoryName: '이자비용',
        keywords: ['이자', '금리', '대출이자', '이자비'],
        type: 'expense',
      },
      { categoryName: '할부이자비', keywords: ['할부이자', '할부'], type: 'expense' },
      { categoryName: '투자수익', keywords: ['투자', '배당', '이익', '투자수익'], type: 'income' },

      // 연구개발/교육
      {
        categoryName: '연구개발비',
        keywords: ['연구', '개발', 'R&D', '기술개발'],
        type: 'expense',
      },
      { categoryName: '교육훈련비', keywords: ['교육', '훈련', '연수', '교육비'], type: 'expense' },

      // 원재료/제조
      { categoryName: '원재료비', keywords: ['원재료', '재료비', '소재'], type: 'expense' },
      { categoryName: '외주가공비', keywords: ['외주', '가공', '하청'], type: 'expense' },
      { categoryName: '포장재비', keywords: ['포장', '포장재', '포장비'], type: 'expense' },

      // 수선/유지보수
      { categoryName: '수선비', keywords: ['수선', '수리', '정비', '보수'], type: 'expense' },
      { categoryName: '감가상각비', keywords: ['감가상각', '상각', '감가상각비'], type: 'expense' },

      // 접대비
      { categoryName: '접대비', keywords: ['접대', '접대비', '회식', '식대'], type: 'expense' },

      // 도서/출판
      { categoryName: '도서인쇄비', keywords: ['도서', '인쇄', '출판', '인쇄비'], type: 'expense' },

      // 기타
      { categoryName: '기타지출', keywords: ['기타', '기타지출'], type: 'expense' },
      { categoryName: '외환손실', keywords: ['외환', '환율', '외환손실'], type: 'expense' },
      { categoryName: '운반비', keywords: ['운반', '운반비'], type: 'expense' },
      { categoryName: '퇴직급여', keywords: ['퇴직', '퇴직금', '퇴직급여'], type: 'expense' },
    ]

    let totalUpdated = 0
    const updateResults: Array<{ keyword: string; category: string; count: any }> = []

    // 각 카테고리별로 매핑 실행
    for (const mapping of categoryMappings) {
      // 해당 카테고리 ID 조회
      const categoryResult = await query(
        `
        SELECT id FROM finance_categories 
        WHERE name = $1 AND is_active = true
        LIMIT 1
      `,
        [mapping.categoryName],
      )

      if (!categoryResult.rows || categoryResult.rows.length === 0) {
        logger.info(`⚠️ 카테고리 '${mapping.categoryName}'를 찾을 수 없습니다.`)
        continue
      }

      const categoryId = categoryResult.rows[0].id

      // 키워드별로 거래 업데이트
      for (const keyword of mapping.keywords) {
        const updateResult = await query(
          `
          UPDATE finance_transactions 
          SET category_id = $1, updated_at = NOW()
          WHERE category_id = $2 
            AND (description ILIKE $3 OR counterparty ILIKE $3)
        `,
          [categoryId, uncategorizedCategoryId, `%${keyword}%`],
        )

        if (updateResult.rowCount && updateResult.rowCount > 0) {
          logger.info(`🔥 '${keyword}' → '${mapping.categoryName}': ${updateResult.rowCount}건`)
          totalUpdated += updateResult.rowCount

          updateResults.push({
            keyword,
            category: mapping.categoryName,
            count: updateResult.rowCount,
          })
        }
      }
    }

    // 특별한 경우들 처리
    const specialCases = [
      // 입금/출금 패턴으로 구분
      {
        query: `
          UPDATE finance_transactions 
          SET category_id = (
            SELECT id FROM finance_categories WHERE name = '제품매출' AND is_active = true LIMIT 1
          ), updated_at = NOW()
          WHERE category_id = $1 AND deposits > 0 
            AND (description ILIKE '%입금%' OR description ILIKE '%송금%')
        `,
        description: '입금/송금 → 제품매출',
      },
      {
        query: `
          UPDATE finance_transactions 
          SET category_id = (
            SELECT id FROM finance_categories WHERE name = '급여' AND is_active = true LIMIT 1
          ), updated_at = NOW()
          WHERE category_id = $1 AND withdrawals > 0 
            AND (description ILIKE '%급여%' OR counterparty ~ '^[가-힣]{2,4}$')
        `,
        description: '출금+한글이름 → 급여',
      },
    ]

    for (const specialCase of specialCases) {
      const result = await query(specialCase.query, [uncategorizedCategoryId])
      if (result.rowCount && result.rowCount > 0) {
        logger.info(`🔥 ${specialCase.description}: ${result.rowCount}건`)
        totalUpdated += result.rowCount
      }
    }

    logger.info(`🔥🔥🔥 자동 카테고리 매핑 완료: 총 ${totalUpdated}건 업데이트`)

    return json({
      success: true,
      message: `${totalUpdated}건의 거래를 자동으로 카테고리에 분류했습니다.`,
      totalUpdated,
      updateResults: updateResults.slice(0, 20), // 최대 20개만 반환
    })
  } catch (error) {
    logger.error('자동 카테고리 매핑 실패:', error)
    return json(
      {
        success: false,
        message: '자동 카테고리 매핑에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
