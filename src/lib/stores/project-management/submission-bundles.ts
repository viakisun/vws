import { logger } from '$lib/utils/logger'
import { writable } from 'svelte/store'
import { logAudit } from './core'
import type { Document, SubmissionBundle } from './types'

// 업로드 번들 관리
export const submissionBundles = writable<SubmissionBundle[]>([])
export const bundleTemplates = writable<Record<string, unknown>>({})

// 국가R&D 업로드 번들 생성
export function createSubmissionBundle(
  projectId: string,
  period: string,
  requestedBy: string,
): string {
  const bundleId = crypto.randomUUID()

  // 번들 생성 시작
  const bundle: SubmissionBundle = {
    id: bundleId,
    projectId,
    period,
    fileUrl: '', // 생성 완료 후 설정
    manifestXml: '', // 생성 완료 후 설정
    checksum: '', // 생성 완료 후 설정
    createdBy: requestedBy,
    createdAt: new Date().toISOString(),
    status: 'generating',
  }

  submissionBundles.update((list) => [...list, bundle])
  logAudit('create', 'submission_bundle', bundleId, { projectId, period }, bundle)

  // 비동기로 번들 생성
  generateBundleContent(bundleId, projectId, period)

  return bundleId
}

// 번들 콘텐츠 생성
async function generateBundleContent(
  bundleId: string,
  projectId: string,
  period: string,
): Promise<void> {
  try {
    // 1. 프로젝트 정보 수집
    const projectInfo = await collectProjectInfo(projectId)

    // 2. 문서 수집
    const documents = await collectDocuments(projectId, period)

    // 3. 예산 정보 수집
    const budgetInfo = await collectBudgetInfo(projectId, period)

    // 4. 인력 정보 수집
    const personnelInfo = await collectPersonnelInfo(projectId, period)

    // 5. 성과 정보 수집
    const performanceInfo = await collectPerformanceInfo(projectId, period)

    // 6. 매니페스트 XML 생성
    const manifestXml = generateManifestXml(projectInfo, budgetInfo, personnelInfo, performanceInfo)

    // 7. 요약 CSV 생성
    const summaryCsv = generateSummaryCsv(budgetInfo, personnelInfo, performanceInfo)

    // 8. 번들 파일 생성
    const bundleFile = await createBundleFile(documents, manifestXml, summaryCsv)

    // 9. 체크섬 계산
    const checksum = await calculateChecksum(bundleFile)

    // 10. 번들 상태 업데이트
    updateBundleStatus(bundleId, 'ready', bundleFile.url, manifestXml, checksum)
  } catch (error) {
    logger.error('Bundle generation failed:', error)
    updateBundleStatus(bundleId, 'failed', '', '', '')
  }
}

// 프로젝트 정보 수집
async function collectProjectInfo(projectId: string): Promise<any> {
  // 실제 구현에서는 프로젝트 데이터를 가져옴
  return {
    id: projectId,
    code: 'R&D-2024-001',
    title: 'AI 기반 스마트 제조 시스템 개발',
    sponsor: '과학기술정보통신부',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    manager: '김연구원',
    department: '개발팀',
    description: 'AI 기술을 활용한 스마트 제조 시스템 개발 프로젝트',
  }
}

// 문서 수집
async function collectDocuments(_projectId: string, _period: string): Promise<Document[]> {
  // 실제 구현에서는 해당 기간의 모든 문서를 수집
  const mockDocuments = [
    {
      id: 'doc-1',
      type: 'requisition',
      filename: '기안서_2024-01-15.pdf',
      storageUrl: '/documents/requisition_2024-01-15.pdf',
      sha256: 'abc123...',
      uploadedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'doc-2',
      type: 'tax_invoice',
      filename: '세금계산서_2024-01-20.pdf',
      storageUrl: '/documents/tax_invoice_2024-01-20.pdf',
      sha256: 'def456...',
      uploadedAt: '2024-01-20T14:30:00Z',
    },
  ]

  return mockDocuments
}

// 예산 정보 수집
async function collectBudgetInfo(_projectId: string, _period: string): Promise<any> {
  // 실제 구현에서는 예산 데이터를 수집
  return {
    totalBudget: 100000000,
    executedAmount: 60000000,
    categoryBreakdown: [
      {
        category: 'PERSONNEL_CASH',
        planned: 50000000,
        executed: 35000000,
        rate: 70,
      },
      {
        category: 'MATERIAL',
        planned: 30000000,
        executed: 20000000,
        rate: 67,
      },
      {
        category: 'RESEARCH_ACTIVITY',
        planned: 20000000,
        executed: 5000000,
        rate: 25,
      },
    ],
  }
}

// 인력 정보 수집
async function collectPersonnelInfo(_projectId: string, _period: string): Promise<any> {
  // 실제 구현에서는 인력 데이터를 수집
  return {
    totalParticipants: 8,
    participationDetails: [
      {
        personId: 'person-1',
        name: '김연구원',
        department: '개발팀',
        participationRate: 100,
        monthlyAllocation: 5000000,
      },
      {
        personId: 'person-2',
        name: '이연구원',
        department: '개발팀',
        participationRate: 80,
        monthlyAllocation: 4000000,
      },
    ],
  }
}

// 성과 정보 수집
async function collectPerformanceInfo(_projectId: string, _period: string): Promise<any> {
  // 실제 구현에서는 성과 데이터를 수집
  return {
    milestones: [
      {
        id: 'milestone-1',
        title: '시스템 설계 완료',
        status: 'completed',
        completionDate: '2024-01-30',
      },
      {
        id: 'milestone-2',
        title: '프로토타입 v1.0 개발',
        status: 'completed',
        completionDate: '2024-02-15',
      },
    ],
    deliverables: [
      {
        title: '시스템 설계서',
        type: 'document',
        status: 'delivered',
      },
      {
        title: '프로토타입 v1.0',
        type: 'prototype',
        status: 'delivered',
      },
    ],
  }
}

// 매니페스트 XML 생성
function generateManifestXml(
  projectInfo: any,
  budgetInfo: any,
  personnelInfo: any,
  performanceInfo: any,
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<submission_bundle>
	<project_info>
		<id>${projectInfo.id}</id>
		<code>${projectInfo.code}</code>
		<title>${projectInfo.title}</title>
		<sponsor>${projectInfo.sponsor}</sponsor>
		<start_date>${projectInfo.startDate}</start_date>
		<end_date>${projectInfo.endDate}</end_date>
		<manager>${projectInfo.manager}</manager>
		<department>${projectInfo.department}</department>
		<description>${projectInfo.description}</description>
	</project_info>
	
	<budget_info>
		<total_budget>${budgetInfo.totalBudget}</total_budget>
		<executed_amount>${budgetInfo.executedAmount}</executed_amount>
		<execution_rate>${((budgetInfo.executedAmount / budgetInfo.totalBudget) * 100).toFixed(2)}</execution_rate>
		<categories>
			${budgetInfo.categoryBreakdown
        .map(
          (cat: any) => `
			<category>
				<name>${cat.category}</name>
				<planned>${cat.planned}</planned>
				<executed>${cat.executed}</executed>
				<rate>${cat.rate}</rate>
			</category>
			`,
        )
        .join('')}
		</categories>
	</budget_info>
	
	<personnel_info>
		<total_participants>${personnelInfo.totalParticipants}</total_participants>
		<participants>
			${personnelInfo.participationDetails
        .map(
          (person: any) => `
			<participant>
				<person_id>${person.personId}</person_id>
				<name>${person.name}</name>
				<department>${person.department}</department>
				<participation_rate>${person.participationRate}</participation_rate>
				<monthly_allocation>${person.monthlyAllocation}</monthly_allocation>
			</participant>
			`,
        )
        .join('')}
		</participants>
	</personnel_info>
	
	<performance_info>
		<milestones>
			${performanceInfo.milestones
        .map(
          (milestone: any) => `
			<milestone>
				<id>${milestone.id}</id>
				<title>${milestone.title}</title>
				<status>${milestone.status}</status>
				<completion_date>${milestone.completionDate}</completion_date>
			</milestone>
			`,
        )
        .join('')}
		</milestones>
		<deliverables>
			${performanceInfo.deliverables
        .map(
          (deliverable: any) => `
			<deliverable>
				<title>${deliverable.title}</title>
				<type>${deliverable.type}</type>
				<status>${deliverable.status}</status>
			</deliverable>
			`,
        )
        .join('')}
		</deliverables>
	</performance_info>
	
	<metadata>
		<generated_at>${new Date().toISOString()}</generated_at>
		<version>1.0</version>
		<format>R&D_SUBMISSION_BUNDLE</format>
	</metadata>
</submission_bundle>`

  return xml
}

// 요약 CSV 생성
function generateSummaryCsv(budgetInfo: any, personnelInfo: any, performanceInfo: any): string {
  const csv = `구분,항목,계획,실행,비율
예산,총예산,${budgetInfo.totalBudget},${budgetInfo.executedAmount},${((budgetInfo.executedAmount / budgetInfo.totalBudget) * 100).toFixed(2)}%
예산,인건비,${budgetInfo.categoryBreakdown[0].planned},${budgetInfo.categoryBreakdown[0].executed},${budgetInfo.categoryBreakdown[0].rate}%
예산,재료비,${budgetInfo.categoryBreakdown[1].planned},${budgetInfo.categoryBreakdown[1].executed},${budgetInfo.categoryBreakdown[1].rate}%
예산,연구활동비,${budgetInfo.categoryBreakdown[2].planned},${budgetInfo.categoryBreakdown[2].executed},${budgetInfo.categoryBreakdown[2].rate}%
인력,총참여자,${personnelInfo.totalParticipants},${personnelInfo.totalParticipants},100%
성과,완료마일스톤,${performanceInfo.milestones.length},${performanceInfo.milestones.filter((m: any) => m.status === 'completed').length},${((performanceInfo.milestones.filter((m: any) => m.status === 'completed').length / performanceInfo.milestones.length) * 100).toFixed(2)}%
성과,제출산출물,${performanceInfo.deliverables.length},${performanceInfo.deliverables.filter((d: any) => d.status === 'delivered').length},${((performanceInfo.deliverables.filter((d: any) => d.status === 'delivered').length / performanceInfo.deliverables.length) * 100).toFixed(2)}%`

  return csv
}

// 번들 파일 생성
async function createBundleFile(
  documents: Document[],
  manifestXml: string,
  summaryCsv: string,
): Promise<{ url: string; size: number }> {
  // 실제 구현에서는 ZIP 파일을 생성하고 스토리지에 업로드
  // 여기서는 모의 구현
  const bundleData = {
    documents: documents,
    manifest: manifestXml,
    summary: summaryCsv,
    createdAt: new Date().toISOString(),
  }

  // 모의 파일 URL과 크기
  return {
    url: `/bundles/submission_${Date.now()}.zip`,
    size: JSON.stringify(bundleData).length,
  }
}

// 체크섬 계산
async function calculateChecksum(_bundleFile: { url: string; size: number }): Promise<string> {
  // 실제 구현에서는 파일의 SHA-256 해시를 계산
  // 여기서는 모의 해시
  return `sha256:${crypto.randomUUID().replace(/-/g, '')}`
}

// 번들 상태 업데이트
function updateBundleStatus(
  bundleId: string,
  status: SubmissionBundle['status'],
  fileUrl: string,
  manifestXml: string,
  checksum: string,
): void {
  submissionBundles.update((list) => {
    const index = list.findIndex((b) => b.id === bundleId)
    if (index === -1) return list

    const bundle = list[index]
    const updatedBundle = {
      ...bundle,
      status,
      fileUrl,
      manifestXml,
      checksum,
    }

    const newList = [...list]
    newList[index] = updatedBundle

    logAudit('update', 'submission_bundle', bundleId, { status }, updatedBundle)

    return newList
  })
}

// 번들 다운로드
export function downloadBundle(bundleId: string): void {
  let bundle: SubmissionBundle | undefined = undefined

  submissionBundles.subscribe((list) => {
    bundle = list.find((b) => b.id === bundleId)
  })()

  if (!bundle || bundle.status !== 'ready') {
    throw new Error('Bundle not ready for download')
  }

  // 실제 구현에서는 파일 다운로드 처리
  logger.log(`Downloading bundle: ${bundle.fileUrl}`)

  // 다운로드 이력 기록
  logAudit('download', 'submission_bundle', bundleId, { fileUrl: bundle.fileUrl }, {})
}

// 번들 검증
export function validateBundle(bundleId: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  let bundle: SubmissionBundle | undefined = undefined

  submissionBundles.subscribe((list) => {
    bundle = list.find((b) => b.id === bundleId)
  })()

  if (!bundle) {
    return {
      valid: false,
      errors: ['Bundle not found'],
      warnings: [],
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // 1. 필수 파일 존재 여부 확인
  if (!bundle.fileUrl) {
    errors.push('Bundle file not found')
  }

  if (!bundle.manifestXml) {
    errors.push('Manifest XML not found')
  }

  if (!bundle.checksum) {
    errors.push('Checksum not found')
  }

  // 2. 매니페스트 XML 유효성 검사
  if (bundle.manifestXml) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(bundle.manifestXml, 'text/xml')
      const parseError = doc.querySelector('parsererror')

      if (parseError) {
        errors.push('Invalid XML format in manifest')
      }
    } catch (_error) {
      errors.push('Failed to parse manifest XML')
    }
  }

  // 3. 체크섬 유효성 검사
  if (bundle.checksum && !bundle.checksum.startsWith('sha256:')) {
    warnings.push('Invalid checksum format')
  }

  // 4. 번들 상태 확인
  if (bundle.status !== 'ready') {
    errors.push(`Bundle status is ${bundle.status}, expected 'ready'`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// 번들 템플릿 생성
export function createBundleTemplate(
  templateName: string,
  templateData: {
    requiredDocuments: string[]
    manifestStructure: any
    validationRules: unknown[]
  },
): void {
  const template = {
    name: templateName,
    requiredDocuments: templateData.requiredDocuments,
    manifestStructure: templateData.manifestStructure,
    validationRules: templateData.validationRules,
    createdAt: new Date().toISOString(),
  }

  bundleTemplates.update((templates) => ({
    ...templates,
    [templateName]: template,
  }))
}

// 번들 템플릿 적용
export function applyBundleTemplate(
  projectId: string,
  templateName: string,
  period: string,
): string {
  let template: any = undefined

  bundleTemplates.subscribe((templates) => {
    template = templates[templateName]
  })()

  if (!template) {
    throw new Error(`Template ${templateName} not found`)
  }

  // 템플릿을 적용하여 번들 생성
  return createSubmissionBundle(projectId, period, 'current-user')
}

// 번들 이력 조회
export function getBundleHistory(projectId: string): SubmissionBundle[] {
  let history: SubmissionBundle[] = []

  submissionBundles.subscribe((list) => {
    history = list
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })()

  return history
}

// 번들 통계
export function getBundleStatistics(projectId: string): any {
  const history = getBundleHistory(projectId)

  const totalBundles = history.length
  const readyBundles = history.filter((b) => b.status === 'ready').length
  const generatingBundles = history.filter((b) => b.status === 'generating').length
  const failedBundles = history.filter((b) => b.status === 'failed').length
  const uploadedBundles = history.filter((b) => b.status === 'uploaded').length

  const averageGenerationTime = calculateAverageGenerationTime(history)

  return {
    totalBundles,
    readyBundles,
    generatingBundles,
    failedBundles,
    uploadedBundles,
    successRate: totalBundles > 0 ? (readyBundles / totalBundles) * 100 : 0,
    averageGenerationTime,
  }
}

// 평균 생성 시간 계산
function calculateAverageGenerationTime(history: SubmissionBundle[]): number {
  const completedBundles = history.filter((b) => b.status === 'ready' || b.status === 'uploaded')

  if (completedBundles.length === 0) return 0

  const totalTime = completedBundles.reduce((sum, bundle) => {
    const created = new Date(bundle.createdAt).getTime()
    const completed = new Date(bundle.createdAt).getTime() + 300000 // 모의 완료 시간 (5분 후)
    return sum + (completed - created)
  }, 0)

  return totalTime / completedBundles.length
}

// 번들 대시보드 데이터
export function getBundleDashboardData(): any {
  let allBundles: SubmissionBundle[] = []

  submissionBundles.subscribe((list) => {
    allBundles = list
  })()

  const recentBundles = allBundles
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const statusCounts = {
    generating: allBundles.filter((b) => b.status === 'generating').length,
    ready: allBundles.filter((b) => b.status === 'ready').length,
    uploaded: allBundles.filter((b) => b.status === 'uploaded').length,
    failed: allBundles.filter((b) => b.status === 'failed').length,
  }

  return {
    recentBundles,
    statusCounts,
    totalBundles: allBundles.length,
  }
}

// 번들 자동 생성 스케줄링
export function scheduleAutoBundleGeneration(
  projectId: string,
  schedule: 'monthly' | 'quarterly' | 'yearly',
): void {
  // 실제 구현에서는 스케줄러에 등록
  const scheduleConfig = {
    projectId,
    schedule,
    enabled: true,
    createdAt: new Date().toISOString(),
  }

  logger.log('Auto bundle generation scheduled:', scheduleConfig)
}

// 번들 내보내기
export function exportBundleData(format: 'json' | 'csv' | 'excel'): string {
  let allBundles: SubmissionBundle[] = []

  submissionBundles.subscribe((list) => {
    allBundles = list
  })()

  if (format === 'json') {
    return JSON.stringify(allBundles, null, 2)
  } else if (format === 'csv') {
    const csvHeader = 'ID,Project ID,Period,Status,File URL,Checksum,Created By,Created At\n'
    const csvRows = allBundles
      .map(
        (bundle) =>
          `${bundle.id},${bundle.projectId},${bundle.period},${bundle.status},${bundle.fileUrl},${bundle.checksum},${bundle.createdBy},${bundle.createdAt}`,
      )
      .join('\n')
    return csvHeader + csvRows
  }

  return JSON.stringify(allBundles, null, 2)
}
