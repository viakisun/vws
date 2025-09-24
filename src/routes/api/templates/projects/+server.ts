import { json } from '@sveltejs/kit'
import { logger } from '$lib/utils/logger'

export async function GET() {
  try {
    // CSV 템플릿 데이터
    const csvContent = `프로젝트명,설명,시작일,종료일,예산,상태,카테고리,우선순위,담당자,부서
AI 기반 데이터 분석 시스템,머신러닝을 활용한 데이터 분석 플랫폼 개발,2024-01-01,2024-12-31,500000000,active,development,high,김개발,R&D
클라우드 마이그레이션,기존 시스템을 클라우드로 이전하는 프로젝트,2024-02-01,2024-08-31,300000000,planning,infrastructure,medium,이인프라,R&D
모바일 앱 개발,React Native를 활용한 크로스 플랫폼 앱 개발,2024-03-01,2024-09-30,200000000,active,development,medium,박개발,R&D
보안 강화 프로젝트,시스템 보안 취약점 분석 및 개선,2024-04-01,2024-06-30,150000000,planning,infrastructure,high,최보안,R&D

※ 주의사항:
- 프로젝트명, 시작일, 종료일은 필수 입력 항목입니다
- 시작일은 종료일보다 이전이어야 합니다
- 날짜는 YYYY-MM-DD 형식으로 입력해주세요 (예: 2024-01-01)
- 예산은 숫자만 입력해주세요 (예: 500000000)
- 상태는 planning, active, completed, cancelled, on_hold 중 하나를 선택해주세요
- 카테고리는 development, research, infrastructure, maintenance, other 중 하나를 선택해주세요
- 우선순위는 low, medium, high, urgent 중 하나를 선택해주세요`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="project_template.csv"',
      },
    })
  } catch (error) {
    logger.error('템플릿 생성 에러:', error)
    return json({ error: '템플릿 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
