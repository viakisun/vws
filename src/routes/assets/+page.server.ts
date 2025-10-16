import { assetRequestService } from '$lib/services/asset/asset-request-service'
import { assetService } from '$lib/services/asset/asset-service'
import { certificationService } from '$lib/services/asset/certification-service'
import { ipService } from '$lib/services/asset/ip-service'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  try {
    // 자산 통계 조회
    const assetStats = await assetService.getStats()

    // 신청 통계 조회
    const requestStats = await assetRequestService.getRequestStats()

    // IP 통계 조회
    const ipStats = await ipService.getStats()

    // 인증 통계 조회
    const certificationStats = await certificationService.getStats()

    // 최근 자산 목록 (5개)
    const recentAssets = await assetService.list({ limit: 5 })

    // 대기 중인 신청 목록 (5개)
    const pendingRequests = await assetRequestService.getPendingRequests(5)

    // 만료 임박 IP 목록 (5개)
    const expiringIps = await ipService.getRenewalDue(90)

    // 만료 임박 인증 목록 (5개)
    const expiringCertifications = await certificationService.getExpiringSoon(60)

    return {
      stats: {
        assets: assetStats,
        requests: requestStats,
        ips: ipStats,
        certifications: certificationStats,
      },
      recentAssets,
      pendingRequests,
      expiringIps,
      expiringCertifications,
    }
  } catch (error) {
    console.error('Failed to load asset management data:', error)

    // 에러 발생 시 기본값 반환
    return {
      stats: {
        assets: {
          total: 0,
          available: 0,
          in_use: 0,
          maintenance: 0,
          disposed: 0,
          total_value: 0,
        },
        requests: {
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0,
        },
        ips: {
          total: 0,
          by_type: {},
          by_status: {},
          expiring_soon: 0,
          total_annual_fees: 0,
        },
        certifications: {
          total: 0,
          by_type: {},
          by_status: {},
          expiring_soon: 0,
        },
      },
      recentAssets: [],
      pendingRequests: [],
      expiringIps: [],
      expiringCertifications: [],
    }
  }
}
