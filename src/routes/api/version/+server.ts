import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    // 빌드 시에는 package.json을 직접 import할 수 없으므로 하드코딩된 값 사용
    const versionInfo = {
			version: '0.2.1',
      buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      environment: process.env.NODE_ENV || 'development',
      name: 'vws',
      description: 'VWS - Virtual Workspace System',
    }

    return json(versionInfo)
  } catch (error) {
    console.error('버전 정보 조회 실패:', error)
    return json(
      {
			version: '0.2.1',
        buildDate: new Date().toISOString().split('T')[0],
        environment: 'development',
        name: 'vws',
        description: 'VWS - Virtual Workspace System',
      },
      { status: 200 },
    )
  }
}
