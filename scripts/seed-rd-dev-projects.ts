/**
 * R&D Development Projects Seed Script
 * 마스터 플랜 문서에서 두 프로젝트 데이터를 파싱하여 DB에 시드
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'
import { MasterPlanParser, type ParsedProject } from '../src/lib/utils/master-plan-parser'

interface SeedResult {
  success: boolean
  project_id?: string
  error?: string
}

class RdDevProjectSeeder {
  private async createProject(parsedProject: ParsedProject): Promise<SeedResult> {
    try {
      // 1. 기본 프로젝트 생성
      const projectResult = await query(
        `
        INSERT INTO projects (
          code, title, description, sponsor, sponsor_type, 
          status, budget_total, research_type, technology_area
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
        [
          this.generateProjectCode(parsedProject.type),
          parsedProject.title,
          `${parsedProject.type === 'worker_follow_amr' ? '작업자 추종형 AMR' : '스마트팜 멀티로봇'} 프로젝트`,
          '정부R&D',
          'government_rnd',
          'active',
          parsedProject.government_funding + parsedProject.institution_funding,
          'development',
          parsedProject.type === 'worker_follow_amr' ? '자율주행' : '스마트팜',
        ],
      )

      const projectId = projectResult.rows[0].id

      // 2. R&D 개발 프로젝트 생성
      const rdDevProjectResult = await query(
        `
        INSERT INTO rd_dev_projects (
          project_id, project_type, total_duration_months,
          government_funding, institution_funding,
          phase_1_duration_months, phase_2_duration_months, phase_3_duration_months
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
        [
          projectId,
          parsedProject.type,
          parsedProject.duration_months,
          parsedProject.government_funding,
          parsedProject.institution_funding,
          parsedProject.phases[0]?.phase_number === 1 ? 9 : null,
          parsedProject.phases[1]?.phase_number === 1
            ? 12
            : parsedProject.phases[1]?.phase_number === 2
              ? 12
              : null,
          parsedProject.phases[2]?.phase_number === 2 ? 12 : null,
        ],
      )

      const rdDevProjectId = rdDevProjectResult.rows[0].id

      // 3. 단계 생성
      const phaseIds: string[] = []
      for (const phase of parsedProject.phases) {
        const phaseResult = await query(
          `
          INSERT INTO rd_dev_phases (
            project_id, phase_number, year_number, start_date, end_date,
            objectives, key_technologies
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
          [
            rdDevProjectId,
            phase.phase_number,
            phase.year_number,
            phase.start_date,
            phase.end_date,
            JSON.stringify(phase.objectives),
            JSON.stringify(phase.key_technologies),
          ],
        )
        phaseIds.push(phaseResult.rows[0].id)
      }

      // 4. 기관 생성
      const institutionIds: string[] = []
      for (const institution of parsedProject.institutions) {
        const institutionResult = await query(
          `
          INSERT INTO rd_dev_institutions (
            project_id, institution_name, institution_type, role_description
          ) VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
          [
            rdDevProjectId,
            institution.name,
            institution.type || null,
            institution.role_description,
          ],
        )
        institutionIds.push(institutionResult.rows[0].id)
      }

      // 5. VIA 역할 생성
      for (const viaRole of parsedProject.via_roles) {
        await query(
          `
          INSERT INTO rd_dev_via_roles (
            project_id, role_category, role_title, role_description,
            technical_details, integration_points
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            rdDevProjectId,
            viaRole.category,
            viaRole.title,
            viaRole.description,
            JSON.stringify(viaRole.technical_details),
            JSON.stringify(viaRole.integration_points),
          ],
        )
      }

      // 6. 기술 사양 생성
      for (const techSpec of parsedProject.technical_specs) {
        await query(
          `
          INSERT INTO rd_dev_technical_specs (
            project_id, spec_category, spec_title, spec_data
          ) VALUES ($1, $2, $3, $4)
        `,
          [rdDevProjectId, techSpec.category, techSpec.title, JSON.stringify(techSpec.data)],
        )
      }

      // 7. 산출물 생성
      for (let i = 0; i < parsedProject.institutions.length; i++) {
        const institution = parsedProject.institutions[i]
        const institutionId = institutionIds[i]

        for (const deliverable of institution.deliverables) {
          const phaseIndex = this.findPhaseIndex(deliverable.phase, parsedProject.phases)
          const phaseId = phaseIndex >= 0 ? phaseIds[phaseIndex] : null

          await query(
            `
            INSERT INTO rd_dev_deliverables (
              project_id, phase_id, institution_id, deliverable_type,
              title, description, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
            [
              rdDevProjectId,
              phaseId,
              institutionId,
              '산출물',
              deliverable.title,
              deliverable.description,
              'planned',
            ],
          )
        }
      }

      // 8. 분기별 마일스톤 생성
      for (const milestone of parsedProject.quarterly_milestones) {
        const phaseIndex = this.findPhaseIndexByQuarter(
          milestone.quarter,
          milestone.year,
          parsedProject.phases,
        )
        const phaseId = phaseIndex >= 0 ? phaseIds[phaseIndex] : phaseIds[0]

        await query(
          `
          INSERT INTO rd_dev_quarterly_milestones (
            project_id, phase_id, quarter, year,
            planned_activities, institution_assignments
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            rdDevProjectId,
            phaseId,
            milestone.quarter,
            milestone.year,
            JSON.stringify(milestone.planned_activities),
            JSON.stringify(milestone.institution_assignments),
          ],
        )
      }

      logger.info(`Successfully seeded ${parsedProject.title} with ID: ${projectId}`)
      return { success: true, project_id: projectId }
    } catch (error) {
      logger.error(`Failed to seed project ${parsedProject.title}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private generateProjectCode(projectType: string): string {
    const timestamp = Date.now().toString().slice(-6)
    return `${projectType.toUpperCase()}-${timestamp}`
  }

  private findPhaseIndex(phaseName: string, phases: ParsedProject['phases']): number {
    if (phaseName.includes('1단계-1차년도') || phaseName.includes('1차년도')) return 0
    if (phaseName.includes('1단계-2차년도') || phaseName.includes('2차년도')) return 1
    if (phaseName.includes('2단계-1차년도') || phaseName.includes('3차년도')) return 2
    return -1
  }

  private findPhaseIndexByQuarter(
    quarter: string,
    year: number,
    phases: ParsedProject['phases'],
  ): number {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      if (
        phase.year_number === year ||
        (year >= parseInt(phase.start_date.split('-')[0]) &&
          year <= parseInt(phase.end_date.split('-')[0]))
      ) {
        return i
      }
    }
    return 0
  }

  async seedWorkerFollowAmrProject(): Promise<SeedResult> {
    try {
      const filePath = join(process.cwd(), 'via_amr_worker_follow_master_plan.md')
      const content = readFileSync(filePath, 'utf-8')
      const parsedProject = MasterPlanParser.parseWorkerFollowAmrPlan(content)
      return await this.createProject(parsedProject)
    } catch (error) {
      logger.error('Failed to read worker follow AMR master plan:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async seedSmartfarmMultirobotProject(): Promise<SeedResult> {
    try {
      const filePath = join(process.cwd(), 'via_smartfarm_multirobot_master_plan.md')
      const content = readFileSync(filePath, 'utf-8')
      const parsedProject = MasterPlanParser.parseSmartfarmMultirobotPlan(content)
      return await this.createProject(parsedProject)
    } catch (error) {
      logger.error('Failed to read smartfarm multirobot master plan:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async seedAllProjects(): Promise<{
    workerFollowAmr: SeedResult
    smartfarmMultirobot: SeedResult
  }> {
    logger.info('Starting R&D Development projects seeding...')

    const [workerFollowAmr, smartfarmMultirobot] = await Promise.all([
      this.seedWorkerFollowAmrProject(),
      this.seedSmartfarmMultirobotProject(),
    ])

    logger.info('R&D Development projects seeding completed')
    return { workerFollowAmr, smartfarmMultirobot }
  }
}

// CLI 실행
async function main() {
  const seeder = new RdDevProjectSeeder()

  try {
    const results = await seeder.seedAllProjects()
    console.log('Seeding Results:')
    console.log('Worker Follow AMR:', results.workerFollowAmr)
    console.log('Smartfarm Multirobot:', results.smartfarmMultirobot)
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// ES module에서 main 실행
main()

export { RdDevProjectSeeder }
