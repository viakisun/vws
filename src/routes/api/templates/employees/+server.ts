import { json } from '@sveltejs/kit'
import { logger } from '$lib/utils/logger';

export async function GET() {
  try {
    // CSV 템플릿 데이터
    const csvContent = `성,이름,미들네임,이메일,전화번호,부서,직급,급여,입사일,상태,고용형태
김,개발,,kim.dev@company.com,010-1234-5678,개발팀,시니어 개발자,5000000,2022-01-15,active,full-time
이,인프라,,lee.infra@company.com,010-2345-6789,개발팀,인프라 엔지니어,4500000,2022-03-01,active,full-time
박,디자인,,park.design@company.com,010-3456-7890,디자인팀,UI/UX 디자이너,4000000,2022-05-01,active,full-time
최,마케팅,,choi.marketing@company.com,010-4567-8901,마케팅팀,마케팅 매니저,4500000,2022-07-01,active,full-time
Smith,John,Michael,john.smith@company.com,010-5678-9012,개발팀,Senior Developer,6000000,2022-09-01,active,full-time

※ 주의사항:
- 성, 이름, 이메일, 부서, 직급, 급여는 필수 입력 항목입니다
- 미들네임은 외국인 직원의 경우에만 입력하세요 (한국인은 비워두세요)
- 성과 이름은 반드시 분리되어 입력되어야 합니다 (예: 김, 개발)
- 이메일은 올바른 형식으로 입력해주세요 (예: user@company.com)
- 전화번호는 숫자, 하이픈, 괄호만 사용 가능합니다
- 급여는 숫자만 입력해주세요 (예: 5000000)
- 입사일은 YYYY-MM-DD 형식으로 입력해주세요 (예: 2022-01-15)
- 상태는 active, inactive, on-leave, terminated 중 하나를 선택해주세요
- 고용형태는 full-time, part-time, contract, intern 중 하나를 선택해주세요`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="employee_template.csv"'
      }
    })
  } catch (error) {
    logger.error('템플릿 생성 에러:', error)
    return json({ error: '템플릿 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
