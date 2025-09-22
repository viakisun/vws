import { EmploymentPeriodValidator, ValidationUtils } from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
    }

    console.log(`🔍 [재직기간 검증] 프로젝트 ${projectId} 검증 시작`)

    // 프로젝트 기본 정보 조회
    const project = await ValidationUtils.getProjectInfo(projectId)
    console.log(`📋 프로젝트: ${project.title}`)

    // 참여연구원 및 증빙 항목 조회
    const [members, evidenceItems] = await Promise.all([
      ValidationUtils.getProjectMembers(projectId),
      ValidationUtils.getEvidenceItems(projectId, '인건비')
    ])

    // 참여연구원 재직기간 검증
    const memberValidationResults = []
    console.log(`👥 [참여연구원 검증] ${members.length}명 검증 시작`)

    for (const member of members) {
      const validation = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)

      memberValidationResults.push({
        memberId: member.id,
        memberName: `${member.last_name}${member.first_name}`,
        role: member.role,
        participationPeriod: `${new Date(member.start_date + 'T00:00:00.000Z').toLocaleDateString('ko-KR')} ~ ${new Date(member.end_date + 'T23:59:59.999Z').toLocaleDateString('ko-KR')}`,
        validation,
        employee: {
          id: member.employee_id,
          hireDate: member.hire_date,
          terminationDate: member.termination_date,
          status: member.status,
          employmentType: member.employment_type,
          department: member.department,
          position: member.position
        }
      })

      console.log(
        `  ${member.last_name}${member.first_name}: ${validation.isValid ? '✅' : '❌'} ${validation.message}`
      )
    }

    // 증빙 항목 재직기간 검증
    const evidenceValidationResults = []
    console.log(`📄 [증빙 항목 검증] ${evidenceItems.length}개 항목 검증 시작`)

    for (const evidence of evidenceItems) {
      const employee = await ValidationUtils.getEmployeeInfo(evidence.assignee_id)
      const validation = EmploymentPeriodValidator.validateEvidenceEmploymentPeriod(
        evidence,
        employee
      )

      evidenceValidationResults.push({
        evidenceId: evidence.id,
        evidenceName: evidence.name,
        assigneeId: evidence.assignee_id,
        assigneeName: evidence.assignee_name,
        periodNumber: evidence.period_number,
        fiscalYear: evidence.fiscal_year,
        dueDate: evidence.due_date,
        validation,
        employee: employee
          ? {
              id: employee.id,
              name: `${employee.last_name}${employee.first_name}`,
              hireDate: employee.hire_date,
              terminationDate: employee.termination_date,
              status: employee.status
            }
          : null
      })

      console.log(`  ${evidence.name}: ${validation.isValid ? '✅' : '❌'} ${validation.message}`)
    }

    // 전체 검증 결과 생성
    const validMembers = memberValidationResults.filter(result => result.validation.isValid).length
    const invalidMembers = memberValidationResults.filter(
      result => !result.validation.isValid
    ).length
    const validEvidenceItems = evidenceValidationResults.filter(
      result => result.validation.isValid
    ).length
    const invalidEvidenceItems = evidenceValidationResults.filter(
      result => !result.validation.isValid
    ).length

    const overallValidation = {
      isValid: invalidMembers === 0 && invalidEvidenceItems === 0,
      totalMembers: memberValidationResults.length,
      validMembers,
      invalidMembers,
      totalEvidenceItems: evidenceValidationResults.length,
      validEvidenceItems,
      invalidEvidenceItems
    }

    console.log(
      `✅ [재직기간 검증] 완료 - 참여연구원: ${validMembers}/${memberValidationResults.length}명, 증빙항목: ${validEvidenceItems}/${evidenceValidationResults.length}개`
    )

    return json({
      success: true,
      projectId,
      projectTitle: project.title,
      memberValidationResults,
      evidenceValidationResults,
      overallValidation,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Employment validation error:', error)
    return json(
      ValidationUtils.createErrorResponse(error, '재직 기간 검증 중 오류가 발생했습니다.'),
      { status: 500 }
    )
  }
}
