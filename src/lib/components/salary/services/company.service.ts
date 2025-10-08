import type { CompanyInfo } from '../types'

/**
 * 회사 정보 조회
 * @returns 회사 정보 (없으면 null)
 * @throws API 호출 실패 시 에러
 */
export async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
  const response = await fetch('/api/companies')
  const result = await response.json()

  if (result.success && result.data && result.data.length > 0) {
    return result.data[0]
  }

  return null
}
