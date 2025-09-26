import { json } from '@sveltejs/kit'

export async function POST({ request }) {
  // TODO: 프로젝트 엑셀 업로드 기능 구현 필요
  // 현재 ExcelJS 타입 오류로 인해 임시 비활성화
  return json({ 
    error: '프로젝트 엑셀 업로드 기능은 현재 개발 중입니다. 추후 구현 예정입니다.',
    todo: 'ExcelJS 타입 정의 문제 해결 후 구현 필요'
  }, { status: 501 })
}