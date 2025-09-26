import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  // TODO: 스키마 검증 로직 구현 예정
  // 현재는 검증 기능이 개발 중이므로 임시로 비활성화
  
  const validationType = url.searchParams.get('type') || 'all'

  // 임시 응답 - 추후 실제 검증 로직으로 교체 예정
  return json({
    message: '스키마 검증 기능은 현재 개발 중입니다.',
    validationType,
    todo: 'SchemaValidator 구현 필요',
    status: 'development'
  })
}