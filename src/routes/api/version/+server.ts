import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { readFileSync } from 'fs'
import { join } from 'path'

export const GET: RequestHandler = async () => {
  try {
    // package.json에서 버전 정보 읽기
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    const versionInfo = {
      version: packageJson.version,
      buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      environment: process.env.NODE_ENV || 'development',
      name: packageJson.name,
      description: packageJson.description || 'VWS - Virtual Workspace System',
    }

    return json(versionInfo)
  } catch (error) {
    console.error('버전 정보 조회 실패:', error)
    // 폴백 값
    return json(
      {
        version: '0.2.2',
        buildDate: new Date().toISOString().split('T')[0],
        environment: 'development',
        name: 'vws',
        description: 'VWS - Virtual Workspace System',
      },
      { status: 200 },
    )
  }
}
