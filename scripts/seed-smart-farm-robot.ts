/**
 * Smart Farm Robot Project - Data Seeding
 * 과채류 적과·적심 자율 로봇 및 멀티로봇 통합관제 프로젝트 데이터 시드
 */

import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

interface SeedResult {
  success: boolean
  projectId?: string
  counts: {
    phases: number
    institutions: number
    deliverables: number
    kpis: number
    scenarios: number
    locations: number
    commercialization: number
    calendarEvents: number
  }
  error?: string
}

class SmartFarmRobotSeeder {
  private projectId: string | null = null
  private rdDevProjectId: string | null = null
  private phaseIds: Map<string, string> = new Map()
  private institutionIds: Map<string, string> = new Map()
  private testLocationIds: Map<string, string> = new Map()

  /**
   * 프로젝트 생성 또는 조회
   */
  private async createProject(): Promise<boolean> {
    try {
      // 기존 프로젝트 확인
      const existingResult = await query(
        `SELECT p.id as project_id, rdp.id as rd_dev_project_id
         FROM projects p
         JOIN rd_dev_projects rdp ON p.id = rdp.project_id
         WHERE p.code = $1`,
        ['SF-ROBOT-2025'],
      )

      if (existingResult.rows.length > 0) {
        this.projectId = existingResult.rows[0].project_id
        this.rdDevProjectId = existingResult.rows[0].rd_dev_project_id
        logger.info(`Found existing project: ${this.projectId}, R&D: ${this.rdDevProjectId}`)
        return true
      }

      // 프로젝트 생성
      const projectResult = await query(
        `INSERT INTO projects (code, title, description, status, sponsor, research_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          'SF-ROBOT-2025',
          '과채류 적과·적심 자율 로봇 및 멀티로봇 통합관제',
          'AI 인식, 3D 지도화, 매니퓰레이션, 고소작업 플랫폼, 엔드이펙터, SaaS 관제를 통한 스마트팜 자동화',
          'planning',
          '정부지원',
          'R&D',
        ],
      )

      this.projectId = projectResult.rows[0].id

      // R&D 프로젝트 생성
      const rdDevResult = await query(
        `INSERT INTO rd_dev_projects 
         (project_id, project_type, total_duration_months)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          this.projectId,
          'smartfarm_multirobot',
          33, // 2025.04 ~ 2027.12 = 33개월
        ],
      )

      this.rdDevProjectId = rdDevResult.rows[0].id

      logger.info(`Created project: ${this.projectId}, R&D: ${this.rdDevProjectId}`)
      return true
    } catch (error) {
      logger.error('Failed to create project:', error)
      return false
    }
  }

  /**
   * 단계 생성 또는 로드
   */
  private async createPhases(): Promise<number> {
    // 기존 단계 확인
    const existingPhases = await query(
      `SELECT id, phase_number, year_number FROM rd_dev_phases WHERE project_id = $1`,
      [this.rdDevProjectId],
    )

    if (existingPhases.rows.length > 0) {
      existingPhases.rows.forEach((row: any) => {
        const key = `${row.phase_number}-${row.year_number}`
        this.phaseIds.set(key, row.id)
      })
      logger.info(`Loaded ${existingPhases.rows.length} existing phases`)
      return existingPhases.rows.length
    }

    const phases = [
      {
        phase_number: 1,
        year_number: 1,
        start_date: '2025-04-01',
        end_date: '2025-12-31',
        objectives: [
          'AI 인식 모델 개발',
          '3D 지도화 연구',
          '엔드이펙터 설계',
          'SaaS 아키텍처 설계',
        ],
        key_technologies: ['객체 인식', '3D 맵핑', '로봇 제어', 'SaaS 플랫폼'],
      },
      {
        phase_number: 1,
        year_number: 2,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        objectives: ['비주얼 서보잉 개발', '행동트리 구현', '시제품 제작', '멀티로봇 협업'],
        key_technologies: ['매니퓰레이션', '행동트리', '엔드이펙터', '협업 스케줄링'],
      },
      {
        phase_number: 2,
        year_number: 1,
        start_date: '2027-01-01',
        end_date: '2027-12-31',
        objectives: ['현장 실증', '시스템 최적화', '내구성 검증', '경제성 분석'],
        key_technologies: ['실증', '최적화', 'ROI 분석', '양산 준비'],
      },
    ]

    let count = 0
    for (const phase of phases) {
      const result = await query(
        `INSERT INTO rd_dev_phases 
         (project_id, phase_number, year_number, start_date, end_date, status, objectives, key_technologies)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          this.rdDevProjectId,
          phase.phase_number,
          phase.year_number,
          phase.start_date,
          phase.end_date,
          'planned',
          JSON.stringify(phase.objectives),
          JSON.stringify(phase.key_technologies),
        ],
      )
      const key = `${phase.phase_number}-${phase.year_number}`
      this.phaseIds.set(key, result.rows[0].id)
      count++
    }

    logger.info(`Created ${count} phases`)
    return count
  }

  /**
   * 참여기관 생성 또는 로드
   */
  private async createInstitutions(): Promise<number> {
    // 기존 기관 확인
    const existingInsts = await query(
      `SELECT id, institution_name FROM rd_dev_institutions WHERE project_id = $1`,
      [this.rdDevProjectId],
    )

    if (existingInsts.rows.length > 0) {
      existingInsts.rows.forEach((row: any) => {
        this.institutionIds.set(row.institution_name, row.id)
      })
      logger.info(`Loaded ${existingInsts.rows.length} existing institutions`)
      return existingInsts.rows.length
    }

    const institutions = [
      { name: '메타파머스', type: '주관', role: '통합·매니퓰레이션·행동트리' },
      { name: 'UNIST', type: '공동', role: '3D 추상지도·경로·충돌검사' },
      { name: 'KIRO', type: '공동', role: '적심 엔드이펙터' },
      { name: 'NAAS', type: '공동', role: '적과 엔드이펙터·작물 특성' },
      { name: '에이지로보틱스', type: '공동', role: '고소작업 플랫폼·자동충전' },
      { name: '대동로보틱스', type: '공동', role: 'LPS·경로계획·제어' },
      { name: '비아', type: '공동', role: 'SaaS 관제·협업·OTA' },
    ]

    let count = 0
    for (const inst of institutions) {
      const result = await query(
        `INSERT INTO rd_dev_institutions 
         (project_id, institution_name, institution_type, role_description)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [this.rdDevProjectId, inst.name, inst.type, inst.role],
      )
      this.institutionIds.set(inst.name, result.rows[0].id)
      count++
    }

    logger.info(`Created ${count} institutions`)
    return count
  }

  /**
   * 산출물 생성
   */
  private async createDeliverables(): Promise<number> {
    const deliverables = [
      // 2025년 (1단계-1차년도)
      {
        phase: '1-1',
        title: '적과/적심 로봇 통합 프레임워크 설계',
        description: '전체 시스템 아키텍처 및 인터페이스 설계',
        deliverable_type: '설계문서',
        institution: '메타파머스',
        due_date: '2025-06-30',
      },
      {
        phase: '1-1',
        title: '적과/적심 대상 인식 AI 모델',
        description: '잎/줄기/과실/꽃/꼭지 인식 및 키포인트 감지',
        deliverable_type: 'SW',
        institution: '메타파머스',
        due_date: '2025-09-30',
      },
      {
        phase: '1-1',
        title: '3D 장애물 지도 작성 연구',
        description: '실시간 3D 포인트클라우드 지도 및 추상화',
        deliverable_type: '연구보고서',
        institution: 'UNIST',
        due_date: '2025-09-30',
      },
      {
        phase: '1-1',
        title: '엔드이펙터 기구부 설계',
        description: '적심/적과 전용 엔드이펙터 기구 설계',
        deliverable_type: '설계문서',
        institution: 'KIRO',
        due_date: '2025-08-31',
      },
      {
        phase: '1-1',
        title: '작물 특성 데이터 획득',
        description: '오이/토마토 생장점, 과실 특성 데이터',
        deliverable_type: '데이터',
        institution: 'NAAS',
        due_date: '2025-07-31',
      },
      {
        phase: '1-1',
        title: '지능로봇 플랫폼 설계',
        description: '3m 고소작업 가능 모바일 플랫폼 설계',
        deliverable_type: '설계문서',
        institution: '에이지로보틱스',
        due_date: '2025-08-31',
      },
      {
        phase: '1-1',
        title: 'LPS 기반 위치 파악 연구',
        description: '복합휠 특성 반영 측위 시스템',
        deliverable_type: '연구보고서',
        institution: '대동로보틱스',
        due_date: '2025-09-30',
      },
      {
        phase: '1-1',
        title: 'SaaS 아키텍처 설계',
        description: '멀티로봇 통합관제 플랫폼 아키텍처',
        deliverable_type: '설계문서',
        institution: '비아',
        due_date: '2025-10-31',
      },
      // 2026년 (1단계-2차년도)
      {
        phase: '1-2',
        title: '비주얼 서보잉 매니퓰레이션',
        description: '실시간 경로 추종 및 확률 기반 오차 보상',
        deliverable_type: 'SW',
        institution: '메타파머스',
        due_date: '2026-06-30',
      },
      {
        phase: '1-2',
        title: '행동트리 개발',
        description: '적과/적심 로봇 제어 행동트리',
        deliverable_type: 'SW',
        institution: '메타파머스',
        due_date: '2026-08-31',
      },
      {
        phase: '1-2',
        title: '고수준 3D 장애물 지도',
        description: '접촉 허용/금지 레이블 포함 지도',
        deliverable_type: 'SW',
        institution: 'UNIST',
        due_date: '2026-06-30',
      },
      {
        phase: '1-2',
        title: '경로계획/충돌검사 알고리즘',
        description: '샘플링 기반 경로계획 및 충돌 검사',
        deliverable_type: 'SW',
        institution: 'UNIST',
        due_date: '2026-08-31',
      },
      {
        phase: '1-2',
        title: '적심 엔드이펙터 시제품',
        description: '파지 후 절단 방식 적심 엔드이펙터',
        deliverable_type: 'HW',
        institution: 'KIRO',
        due_date: '2026-09-30',
      },
      {
        phase: '1-2',
        title: '적과 엔드이펙터 시제품',
        description: '손상 최소화 설계 적과 엔드이펙터',
        deliverable_type: 'HW',
        institution: 'NAAS',
        due_date: '2026-09-30',
      },
      {
        phase: '1-2',
        title: '지능로봇 플랫폼 제작',
        description: '3m 고소작업 모바일 로봇 플랫폼',
        deliverable_type: 'HW',
        institution: '에이지로보틱스',
        due_date: '2026-10-31',
      },
      {
        phase: '1-2',
        title: '자동충전 시스템',
        description: '자동충전 스테이션 및 연동 시스템',
        deliverable_type: 'HW',
        institution: '에이지로보틱스',
        due_date: '2026-11-30',
      },
      {
        phase: '1-2',
        title: '멀티모달 위치 파악',
        description: 'LiDAR/Camera/IMU 융합 측위',
        deliverable_type: 'SW',
        institution: '대동로보틱스',
        due_date: '2026-06-30',
      },
      {
        phase: '1-2',
        title: '환경 특화 경로계획/제어',
        description: '시설재배 환경 특화 주행 제어',
        deliverable_type: 'SW',
        institution: '대동로보틱스',
        due_date: '2026-09-30',
      },
      {
        phase: '1-2',
        title: '다중 로봇 협업 스케줄러',
        description: '멀티로봇 동시 제어 및 작업 할당',
        deliverable_type: 'SW',
        institution: '비아',
        due_date: '2026-08-31',
      },
      {
        phase: '1-2',
        title: '통합관제 UI/UX',
        description: '사용자 친화 관제 인터페이스',
        deliverable_type: 'SW',
        institution: '비아',
        due_date: '2026-10-31',
      },
      {
        phase: '1-2',
        title: 'OTA 업데이트 시스템',
        description: '원격 펌웨어/소프트웨어 업데이트',
        deliverable_type: 'SW',
        institution: '비아',
        due_date: '2026-11-30',
      },
      // 2027년 (2단계-1차년도)
      {
        phase: '2-1',
        title: '통합 시스템 최적화',
        description: '전체 시스템 성능 최적화 및 안정화',
        deliverable_type: '연구보고서',
        institution: '메타파머스',
        due_date: '2027-06-30',
      },
      {
        phase: '2-1',
        title: '상주 실증 결과 보고서',
        description: '상주 스마트팜 혁신밸리 실증 결과',
        deliverable_type: '실증보고서',
        institution: '메타파머스',
        due_date: '2027-09-30',
      },
      {
        phase: '2-1',
        title: 'NAAS 실증 결과 보고서',
        description: '국립농업과학원 스마트온실 실증 결과',
        deliverable_type: '실증보고서',
        institution: 'NAAS',
        due_date: '2027-09-30',
      },
      {
        phase: '2-1',
        title: '엔드이펙터 내구성 검증',
        description: '장기 운용 내구성 및 구조 최적화',
        deliverable_type: '시험보고서',
        institution: 'KIRO',
        due_date: '2027-10-31',
      },
      {
        phase: '2-1',
        title: 'SaaS 운영 체계 완성',
        description: '상용 운영 가능 관제 시스템',
        deliverable_type: 'SW',
        institution: '비아',
        due_date: '2027-11-30',
      },
      {
        phase: '2-1',
        title: '경제성 분석 보고서',
        description: 'ROI 분석 및 사업화 전략',
        deliverable_type: '사업화보고서',
        institution: '메타파머스',
        due_date: '2027-12-31',
      },
    ]

    let count = 0
    for (const deliv of deliverables) {
      const phaseId = this.phaseIds.get(deliv.phase)
      const institutionId = this.institutionIds.get(deliv.institution)

      await query(
        `INSERT INTO rd_dev_deliverables 
         (project_id, phase_id, title, description, deliverable_type, 
          institution_id, target_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this.rdDevProjectId,
          phaseId,
          deliv.title,
          deliv.description,
          deliv.deliverable_type,
          institutionId,
          deliv.due_date,
          'planned',
        ],
      )
      count++
    }

    logger.info(`Created ${count} deliverables`)
    return count
  }

  /**
   * KPI 시드
   */
  private async seedKpis(): Promise<number> {
    const kpis = [
      {
        category: '인식성능',
        name: 'AI 인식 속도',
        description: '과채류 인식 실시간 처리 속도',
        target_value: '15',
        unit: 'fps',
        phase: '1-2',
      },
      {
        category: '기타',
        name: '고소작업 높이',
        description: '최대 작업 가능 높이',
        target_value: '3',
        unit: 'm',
        phase: '1-2',
      },
      {
        category: '운영성능',
        name: '협업 로봇 수',
        description: '동시 협업 가능 로봇 대수',
        target_value: '2',
        unit: '대',
        phase: '2-1',
      },
      {
        category: '정밀도',
        name: '적심 정확도',
        description: '생장점 적심 작업 정확도',
        target_value: '90',
        unit: '%',
        phase: '2-1',
      },
      {
        category: '정밀도',
        name: '적과 손상률',
        description: '적과 작업 시 과실 손상률',
        target_value: '5',
        unit: '% 이하',
        phase: '2-1',
      },
      {
        category: '기타',
        name: 'ROI',
        description: '투자 회수 기간',
        target_value: '3.7',
        unit: '년',
        phase: '2-1',
      },
      {
        category: '정밀도',
        name: 'LPS 위치 정확도',
        description: 'LPS 기반 위치 파악 정밀도',
        target_value: '10',
        unit: 'cm',
        phase: '1-2',
      },
      {
        category: '안전성',
        name: '자동충전 성공률',
        description: '자동충전 스테이션 도킹 성공률',
        target_value: '95',
        unit: '%',
        phase: '2-1',
      },
    ]

    let count = 0
    for (const kpi of kpis) {
      const phaseId = this.phaseIds.get(kpi.phase)
      await query(
        `INSERT INTO rd_dev_kpis 
         (project_id, phase_id, kpi_category, kpi_name, kpi_description, target_value, unit, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this.rdDevProjectId,
          phaseId,
          kpi.category,
          kpi.name,
          kpi.description,
          kpi.target_value,
          kpi.unit,
          '미측정',
        ],
      )
      count++
    }

    logger.info(`Seeded ${count} KPIs`)
    return count
  }

  /**
   * 검증 시나리오 시드
   */
  private async seedVerificationScenarios(): Promise<number> {
    const scenarios = [
      {
        name: 'AI 인식 → 3D 지도 → 경로계획',
        description: '인식부터 경로 생성까지 전체 파이프라인 검증',
        steps: [
          '과채류 객체 인식 (잎/줄기/과실/꽃/꼭지)',
          '키포인트 및 다중 객체 추적',
          '3D 장애물 지도 생성 (접촉 허용/금지)',
          '엔드이펙터 6축 자세 산출',
          '경로 충돌 검사 및 계획',
          '비주얼 서보잉 추종',
          '작업 성공/실패 로깅',
        ],
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '적과/적심 실행·수거 일괄 작업',
        description: '적과/적심 작업 및 수거 프로세스 검증',
        steps: [
          '3m 고소작업 안정성 평가',
          '적과/적심 대상 인식 및 선정',
          '엔드이펙터 접근 및 작업',
          '절단 후 파지/수거',
          '로봇 적재함 이송',
          '다중 로봇 협업 (선행/후행 연계)',
        ],
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '자율주행·측위·충전 연계',
        description: '자율주행 및 자동충전 연속 작업 검증',
        steps: [
          '멀티센서 지도작성 (LiDAR/Camera/IMU)',
          'LPS 기반 위치 파악',
          '경로 최적화 및 주행',
          '동적·정적 장애물 대응',
          '자동충전 스테이션 복귀',
          '충전 완료 후 작업 재개',
        ],
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '멀티로봇 통합관제',
        description: 'SaaS 기반 다중 로봇 협업 관제 검증',
        steps: [
          '다중 로봇 실시간 모니터링',
          '작업 스케줄링 및 할당',
          '충돌 방지 경로 조정',
          '데이터 레이크 수집',
          '보고서 자동 생성',
          'OTA 업데이트 배포',
        ],
        test_location: '관제센터 (비아)',
      },
      {
        name: '제품화·경제성',
        description: '실증 성능 및 경제성 종합 평가',
        steps: [
          '손상률/성공률/속도 측정',
          '다양한 환경 조건 테스트',
          'FMEA 및 내구성 평가',
          'ROI 분석 (3.7년)',
          '비즈니스 모델 검증',
        ],
        test_location: '국립농업과학원 스마트온실',
      },
    ]

    let count = 0
    for (const scenario of scenarios) {
      const locationId = this.testLocationIds.get(scenario.test_location)
      await query(
        `INSERT INTO rd_dev_verification_scenarios 
         (project_id, scenario_name, scenario_description, scenario_steps, test_location_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          this.rdDevProjectId,
          scenario.name,
          scenario.description,
          JSON.stringify(scenario.steps),
          locationId,
          '계획',
        ],
      )
      count++
    }

    logger.info(`Seeded ${count} verification scenarios`)
    return count
  }

  /**
   * 실증 장소 시드
   */
  private async seedTestLocations(): Promise<number> {
    const locations = [
      {
        name: '상주 스마트팜 혁신밸리',
        type: '온실',
        address: '경상북도 상주시',
        facility_details: {
          면적: '480㎡',
          작물: ['오이'],
          설비: ['고소작업 환경', '레일 시스템', '자동충전 스테이션'],
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: '주요 실증 장소, 2대 이상 로봇 협업 실증 (오이)',
      },
      {
        name: '국립농업과학원 스마트온실',
        type: '온실',
        address: '전라북도 전주시',
        facility_details: {
          면적: '300㎡',
          작물: ['완숙 토마토'],
          설비: ['스마트 온실', '환경 제어 시스템'],
        },
        available_from: '2027-01-01',
        available_to: '2027-12-31',
        notes: '토마토 작물 실증 장소',
      },
      {
        name: '관제센터 (비아)',
        type: '관제센터',
        address: '비아 본사',
        facility_details: {
          설비: ['SaaS 관제 시스템', '데이터 서버', '통합 대시보드'],
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: '멀티로봇 통합관제 운영',
      },
    ]

    let count = 0
    for (const loc of locations) {
      const result = await query(
        `INSERT INTO rd_dev_test_locations 
         (project_id, location_name, location_type, address, facility_details, 
          available_from, available_to, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          this.rdDevProjectId,
          loc.name,
          loc.type,
          loc.address,
          JSON.stringify(loc.facility_details),
          loc.available_from,
          loc.available_to,
          loc.notes,
        ],
      )
      this.testLocationIds.set(loc.name, result.rows[0].id)
      count++
    }

    logger.info(`Seeded ${count} test locations`)
    return count
  }

  /**
   * 사업화 마일스톤 시드
   */
  private async seedCommercialization(): Promise<number> {
    const milestones = [
      {
        type: '경제성분석',
        name: 'ROI 분석 (1ha/2대 모델)',
        description: '초기 투자 1.6억원, 연 이익 4,226만원, ROI 3.7년',
        target_date: '2027-09-30',
        institution: '메타파머스',
      },
      {
        type: 'BM개발',
        name: '통합 패키지 BM 개발',
        description: '로봇+엔드이펙터+SaaS 통합 패키지',
        target_date: '2027-06-30',
        institution: '메타파머스',
      },
      {
        type: '시범운용',
        name: '상주 현장 실증',
        description: '480㎡ 오이 온실 실증',
        target_date: '2027-09-30',
        institution: '메타파머스',
      },
      {
        type: '시범운용',
        name: 'NAAS 현장 실증',
        description: '300㎡ 토마토 온실 실증',
        target_date: '2027-09-30',
        institution: 'NAAS',
      },
      {
        type: '양산준비',
        name: '양산 체계 구축',
        description: '상업용 제품 양산 준비',
        target_date: '2027-12-31',
        institution: '메타파머스',
      },
      {
        type: '영업홍보',
        name: '홍보·영업 자료 제작',
        description: '실증 결과 기반 영업 자료',
        target_date: '2027-11-30',
        institution: '메타파머스',
      },
    ]

    let count = 0
    for (const milestone of milestones) {
      const institutionId = this.institutionIds.get(milestone.institution)
      await query(
        `INSERT INTO rd_dev_commercialization 
         (project_id, milestone_type, milestone_name, milestone_description, 
          target_date, responsible_institution_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          this.rdDevProjectId,
          milestone.type,
          milestone.name,
          milestone.description,
          milestone.target_date,
          institutionId,
          '계획',
        ],
      )
      count++
    }

    logger.info(`Seeded ${count} commercialization milestones`)
    return count
  }

  /**
   * 캘린더 이벤트 시드
   */
  private async seedCalendarEvents(): Promise<number> {
    const events = [
      {
        type: '마일스톤',
        title: '프로젝트 킥오프',
        description: '과채류 적과·적심 로봇 프로젝트 시작',
        date: '2025-04-01',
      },
      {
        type: '산출물마감',
        title: '요소 기술 개발 완료',
        description: '1단계-1차년도 요소 기술 개발 완료',
        date: '2025-12-31',
      },
      {
        type: '산출물마감',
        title: '시제품 통합 완료',
        description: '로봇+엔드이펙터+관제 시스템 통합',
        date: '2026-12-31',
      },
      {
        type: '실증',
        title: '상주 실증 시작',
        description: '상주 스마트팜 혁신밸리 실증 시작',
        date: '2027-03-01',
      },
      {
        type: '실증',
        title: 'NAAS 실증 시작',
        description: '국립농업과학원 스마트온실 실증 시작',
        date: '2027-03-01',
      },
      {
        type: 'KPI측정',
        title: '통합 성능 평가',
        description: '전체 시스템 KPI 측정 및 평가',
        date: '2027-09-30',
      },
      {
        type: '마일스톤',
        title: '최종 실증 완료',
        description: '현장 실증 완료 및 경제성 검증',
        date: '2027-12-31',
      },
      {
        type: '회의',
        title: 'Q2 정기 협의회',
        description: '전체 기관 진행 상황 공유',
        date: '2025-07-15',
      },
      {
        type: '회의',
        title: 'Q4 정기 협의회',
        description: '전체 기관 진행 상황 공유',
        date: '2025-12-15',
      },
      {
        type: '보고',
        title: '1단계-1차년도 최종 보고',
        description: '연차 성과 보고',
        date: '2025-12-31',
      },
      {
        type: '보고',
        title: '1단계-2차년도 최종 보고',
        description: '연차 성과 보고',
        date: '2026-12-31',
      },
      {
        type: '보고',
        title: '2단계-1차년도 최종 보고',
        description: '최종 성과 보고',
        date: '2027-12-31',
      },
    ]

    let count = 0
    for (const event of events) {
      await query(
        `INSERT INTO rd_dev_calendar_events 
         (project_id, event_type, event_title, event_description, event_date, all_day, reminder_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [this.rdDevProjectId, event.type, event.title, event.description, event.date, true, 7],
      )
      count++
    }

    logger.info(`Seeded ${count} calendar events`)
    return count
  }

  /**
   * 전체 시드 실행
   */
  async seedAll(): Promise<SeedResult> {
    try {
      logger.info('Starting Smart Farm Robot project seeding...')

      // 프로젝트 생성
      const created = await this.createProject()
      if (!created) {
        return {
          success: false,
          counts: {
            phases: 0,
            institutions: 0,
            deliverables: 0,
            kpis: 0,
            scenarios: 0,
            locations: 0,
            commercialization: 0,
            calendarEvents: 0,
          },
          error: 'Failed to create project',
        }
      }

      // 각 데이터 시드
      const phases = await this.createPhases()
      const institutions = await this.createInstitutions()
      const deliverables = await this.createDeliverables()
      const locations = await this.seedTestLocations()
      const kpis = await this.seedKpis()
      const scenarios = await this.seedVerificationScenarios()
      const commercialization = await this.seedCommercialization()
      const calendarEvents = await this.seedCalendarEvents()

      logger.info('Smart Farm Robot project seeding completed successfully')

      return {
        success: true,
        projectId: this.rdDevProjectId!,
        counts: {
          phases,
          institutions,
          deliverables,
          kpis,
          scenarios,
          locations,
          commercialization,
          calendarEvents,
        },
      }
    } catch (error) {
      logger.error('Seeding failed:', error)
      return {
        success: false,
        counts: {
          phases: 0,
          institutions: 0,
          deliverables: 0,
          kpis: 0,
          scenarios: 0,
          locations: 0,
          commercialization: 0,
          calendarEvents: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// CLI 실행
async function main() {
  const seeder = new SmartFarmRobotSeeder()

  try {
    const result = await seeder.seedAll()
    console.log('\n=== Smart Farm Robot Project Seeding Results ===')
    console.log('Success:', result.success)
    if (result.success) {
      console.log('Project ID:', result.projectId)
      console.log('Counts:', result.counts)
      console.log(`
Total seeded:
- Phases: ${result.counts.phases}
- Institutions: ${result.counts.institutions}
- Deliverables: ${result.counts.deliverables}
- KPIs: ${result.counts.kpis}
- Verification Scenarios: ${result.counts.scenarios}
- Test Locations: ${result.counts.locations}
- Commercialization Milestones: ${result.counts.commercialization}
- Calendar Events: ${result.counts.calendarEvents}
      `)
    } else {
      console.error('Error:', result.error)
    }
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// ES module에서 main 실행
main()

export { SmartFarmRobotSeeder }
