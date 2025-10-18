/**
 * Worker Follow AMR Project - Enhanced Data Seeding
 * 작업자 추종형 AMR 프로젝트의 상세 데이터 시드
 * - KPIs, Dependencies, Verification Scenarios, Test Locations,
 * - Module Responsibilities, Commercialization, Calendar Events
 */

import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

interface EnhancedSeedResult {
  success: boolean
  counts: {
    kpis: number
    dependencies: number
    scenarios: number
    locations: number
    modules: number
    commercialization: number
    calendarEvents: number
  }
  error?: string
}

class WorkerFollowAmrEnhancedSeeder {
  private projectId: string | null = null
  private rdDevProjectId: string | null = null
  private phaseIds: Map<string, string> = new Map()
  private institutionIds: Map<string, string> = new Map()
  private deliverableIds: Map<string, string> = new Map()
  private testLocationIds: Map<string, string> = new Map()

  /**
   * 프로젝트 및 관련 엔티티 ID 조회
   */
  private async loadProjectIds(): Promise<boolean> {
    try {
      // 프로젝트 조회
      const projectResult = await query(
        `SELECT p.id as project_id, rdp.id as rd_dev_project_id
         FROM projects p
         JOIN rd_dev_projects rdp ON p.id = rdp.project_id
         WHERE rdp.project_type = 'worker_follow_amr'
         LIMIT 1`,
      )

      if (projectResult.rows.length === 0) {
        logger.error('Worker Follow AMR project not found. Run seed-rd-dev-projects.ts first.')
        return false
      }

      this.projectId = projectResult.rows[0].project_id
      this.rdDevProjectId = projectResult.rows[0].rd_dev_project_id

      // 단계 조회
      const phasesResult = await query(
        `SELECT id, phase_number, year_number FROM rd_dev_phases WHERE project_id = $1 ORDER BY phase_number, year_number`,
        [this.rdDevProjectId],
      )
      phasesResult.rows.forEach((row: any) => {
        const key = `${row.phase_number}-${row.year_number}`
        this.phaseIds.set(key, row.id)
      })

      // 기관 조회
      const institutionsResult = await query(
        `SELECT id, institution_name FROM rd_dev_institutions WHERE project_id = $1`,
        [this.rdDevProjectId],
      )
      institutionsResult.rows.forEach((row: any) => {
        this.institutionIds.set(row.institution_name, row.id)
      })

      // 산출물 조회
      const deliverablesResult = await query(
        `SELECT id, title FROM rd_dev_deliverables WHERE project_id = $1`,
        [this.rdDevProjectId],
      )
      deliverablesResult.rows.forEach((row: any) => {
        this.deliverableIds.set(row.title, row.id)
      })

      logger.info(`Loaded project IDs: Project=${this.projectId}, RdDev=${this.rdDevProjectId}`)
      logger.info(
        `Found ${this.phaseIds.size} phases, ${this.institutionIds.size} institutions, ${this.deliverableIds.size} deliverables`,
      )

      return true
    } catch (error) {
      logger.error('Failed to load project IDs:', error)
      return false
    }
  }

  /**
   * 시연/실증 장소 시드
   */
  private async seedTestLocations(): Promise<number> {
    const locations = [
      {
        name: '충남 부여시 토마토/오이 스마트팜',
        type: '온실',
        address: '충청남도 부여시',
        facility_details: {
          면적: '1,500m² 이상',
          작물: ['토마토', '오이'],
          설비: ['난방 온수파이프', '컨베이어 시스템', '선별장'],
          환경조건: '온실 내부, 온수파이프 설치',
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: '주요 실증 장소, 레일/지상 주행, 추종, 물류, 충전 전 범위 실증',
      },
      {
        name: '선별장 및 트럭 상차 현장',
        type: '선별장',
        address: '스마트팜 인근',
        facility_details: {
          설비: ['컨베이어 벨트', '선별 설비', '트럭 도킹 공간'],
        },
        available_from: '2026-01-01',
        available_to: '2027-12-31',
        notes: '물류 연동 실증',
      },
      {
        name: '관제센터 (비아)',
        type: '관제센터',
        address: '비아 본사',
        facility_details: {
          설비: ['관제 시스템', '텔레메트리 서버', '대시보드'],
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: 'SaaS 관제 시스템 운영',
      },
      {
        name: 'KTL 공인시험기관',
        type: '공인시험',
        address: 'KTL',
        facility_details: {
          설비: ['성능 시험 설비', '안전 시험 설비'],
        },
        available_from: '2027-07-01',
        available_to: '2027-12-31',
        notes: '공인 성능 인증 시험',
      },
    ]

    let count = 0
    for (const loc of locations) {
      const result = await query(
        `INSERT INTO rd_dev_test_locations 
         (project_id, location_name, location_type, address, facility_details, available_from, available_to, notes)
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
   * KPI 시드
   */
  private async seedKpis(): Promise<number> {
    const kpis = [
      {
        category: '주행성능',
        name: '온수파이프 주행속도',
        description: '온수파이프 위 주행 시 평균 속도',
        target_value: '1.45',
        unit: 'm/s',
        phase: '1-2',
      },
      {
        category: '주행성능',
        name: '평지 주행속도',
        description: '평지 주행 시 평균 속도',
        target_value: '1.0',
        unit: 'm/s',
        phase: '1-2',
      },
      {
        category: '정밀도',
        name: '위치 인식 정밀도',
        description: 'SLAM 기반 위치 인식 정확도',
        target_value: '30',
        unit: 'cm',
        phase: '1-2',
      },
      {
        category: '정밀도',
        name: '레일 진입 정확도',
        description: '레일 진입 성공률',
        target_value: '100',
        unit: '%',
        phase: '1-2',
      },
      {
        category: '정밀도',
        name: '레일 진입 시간',
        description: '레일 인식부터 진입 완료까지 소요 시간',
        target_value: '20',
        unit: 's',
        phase: '1-2',
      },
      {
        category: '안전성',
        name: '정지 정확도',
        description: '목표 지점 대비 정지 오차',
        target_value: '±5',
        unit: 'cm (at 0.5m)',
        phase: '1-2',
      },
      {
        category: '안전성',
        name: '정지 성공률',
        description: '장애물 감지 시 안전 정지 성공률',
        target_value: '95',
        unit: '%',
        phase: '1-2',
      },
      {
        category: '전력효율',
        name: '연속 작업 시간',
        description: '완충 후 연속 작업 가능 시간',
        target_value: '5',
        unit: 'hour',
        phase: '1-1',
      },
      {
        category: '인식성능',
        name: '작업자 추종 정확도',
        description: '작업자 인식 및 추종 성공률',
        target_value: '90',
        unit: '%',
        phase: '1-2',
      },
      {
        category: '인식성능',
        name: '제스처 인식율',
        description: '작업자 제스처 인식 정확도',
        target_value: '85',
        unit: '%',
        phase: '2-1',
      },
      {
        category: '운영성능',
        name: 'AprilTag 도킹 정확도',
        description: '자동 충전 스테이션 도킹 성공률',
        target_value: '95',
        unit: '%',
        phase: '1-2',
      },
      {
        category: '주행성능',
        name: '온수파이프 알고리즘 처리 시간 개선',
        description: '기존 30-40s에서 개선 목표',
        target_value: '10-20',
        unit: 's',
        phase: '1-1',
      },
    ]

    let count = 0
    for (const kpi of kpis) {
      const phaseId = this.phaseIds.get(kpi.phase) || null
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
        name: '작업자 협업 수확 시나리오',
        description: '작업자와 AMR의 협업을 통한 전체 수확 프로세스 검증',
        steps: [
          '작업자 제스처 인식 (정지/추종/이동)',
          'AMR 추종 주행 시작',
          '레일 진입 알고리즘 실행',
          '수확물 적재 (컨베이어 상판)',
          '선별장으로 자율 이동',
          '컨베이어 연동 하역',
          '트럭 상차/컨테이너 탑재',
          '자동 충전 스테이션 복귀',
        ],
        test_location: '충남 부여시 토마토/오이 스마트팜',
      },
      {
        name: '안전·정밀 주행 시나리오',
        description: '장애물 인식 및 회피, 정밀 주행 성능 검증',
        steps: [
          '동적 장애물 인식 (작업자 이동)',
          '정적 장애물 인식 (수확박스, 파렛트, 벌통)',
          '안전 정지 (0.5m 기준 ±5cm, 95% 정확도)',
          '회피 경로 재계획',
          '레일 진입 정확도 검증 (100%, 20s)',
          '온수파이프 주행 (1.45 m/s)',
          '위치 인식 정밀도 측정 (30cm)',
        ],
        test_location: '충남 부여시 토마토/오이 스마트팜',
      },
      {
        name: '자율주행 성능 시나리오',
        description: 'SLAM 기반 자율주행 및 내비게이션 성능 검증',
        steps: [
          '3D LiDAR+IMU 데이터 수집',
          'SLAM 2D Map 생성',
          'Nav2 Goal Point 설정',
          '자율 주행 실행 (평지 1.0 m/s)',
          '목표 지점 도착 정확도 측정',
          '다중 목표점 순회 테스트',
        ],
        test_location: '충남 부여시 토마토/오이 스마트팜',
      },
      {
        name: '운영·관제 시나리오',
        description: '비아 SaaS 관제 플랫폼 및 운영 시나리오 검증',
        steps: [
          '다로봇 텔레메트리 실시간 수집',
          '관제 대시보드 상태 표시',
          '작업 스케줄링 설정',
          '원격 명령 전송 (이동/정지)',
          'OTA 펌웨어 업데이트',
          '버전 롤백 테스트',
          '자동 리포트 생성',
          '다국어 UI 전환',
        ],
        test_location: '관제센터 (비아)',
      },
    ]

    let count = 0
    for (const scenario of scenarios) {
      const locationId = this.testLocationIds.get(scenario.test_location) || null
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
   * 모듈·책임 매트릭스 시드
   */
  private async seedModuleResponsibilities(): Promise<number> {
    const modules = [
      {
        category: '자율주행',
        name: '3D LiDAR+IMU SLAM → 2D Map/Localization',
        description: '3D 라이다와 IMU를 활용한 SLAM 및 2D 맵 생성, Nav2 기반 자율주행',
        primary_institution: '정원SFA',
        performance_level: '목표점 자율주행, 위치인식 30cm',
        integration_points: ['비아 관제', '레일 진입 알고리즘'],
      },
      {
        category: '경로/레일',
        name: '레일 진입/탈출/변경 알고리즘',
        description: '온수파이프 레일 인식 및 진입 메커니즘',
        primary_institution: '한국생산기술연구원',
        supporting: ['정원SFA'],
        performance_level: '진입 정확도 100%, 20s',
        integration_points: ['정원SFA AMR', '융합센서 모듈'],
      },
      {
        category: '안전',
        name: '안전 운영 프로토콜',
        description: '긴급정지, 추돌, 탈선 등 5대 위험 대응',
        primary_institution: '한국생산기술연구원',
        performance_level: '위험별 대응 로직 표 구축',
        integration_points: ['정원SFA 제어', '비아 관제 알림'],
      },
      {
        category: '장애물',
        name: 'Object Detection+Depth Fusion 회피/정지',
        description: '장애물 인식 및 회피 알고리즘',
        primary_institution: '정원SFA',
        supporting: ['충남대'],
        performance_level: '0.5m ±5cm 정지, 정지정확도 95%',
        integration_points: ['충남대 라벨링/모델', '비아 관제 로그'],
      },
      {
        category: '전력',
        name: 'BMS/배터리 용량/충전 스테이션',
        description: '배터리 관리 시스템 및 자동 충전',
        primary_institution: '정원SFA',
        supporting: ['한국생산기술연구원'],
        performance_level: '5시간 연속, AprilTag 도킹',
        integration_points: ['비아 텔레메트리', '생기원 충전 전략'],
      },
      {
        category: '물류',
        name: '컨베이어 상판/선별장/트럭/컨테이너 연동',
        description: '물류 시스템 통합 및 상호작용',
        primary_institution: '정원SFA',
        supporting: ['하다'],
        performance_level: '상호작용 물류 제어',
        integration_points: ['하다 도킹 테스트', '비아 작업 리포트'],
      },
      {
        category: 'AI-협업',
        name: '작업자 추종·제스처 인식',
        description: '실시간 작업자 인식 및 제스처 인터페이스',
        primary_institution: '충남대',
        supporting: ['비아'],
        performance_level: '실시간 인식/추종, 데이터·프로토콜 체계화',
        integration_points: ['정원SFA 제어', '비아 경량화/실내최적화'],
      },
      {
        category: '관제SaaS',
        name: '비아 플랫폼 (텔레메트리·원격관제·스케줄·RBAC·API)',
        description: '통합 관제 SaaS 플랫폼',
        primary_institution: '비아',
        performance_level: '실시간 대시보드/경로 최적화/로그·리포트',
        integration_points: ['모든 기관 데이터 통합'],
      },
      {
        category: 'DevOps',
        name: 'OTA/버전관리/자동배포',
        description: '펌웨어 및 소프트웨어 원격 관리',
        primary_institution: '비아',
        performance_level: '롤백/이력/배포 스케줄링',
        integration_points: ['정원SFA AMR', '하다 플랫폼'],
      },
      {
        category: '인증/사업화',
        name: '사용자 매뉴얼, KTL 시험성적서, BM/영업',
        description: '상용화 및 사업화 준비',
        primary_institution: '정원SFA',
        supporting: ['전기관'],
        performance_level: '기준 충족 시험결과',
        integration_points: ['시범농가', '공인시험'],
      },
    ]

    let count = 0
    for (const module of modules) {
      const primaryId = this.institutionIds.get(module.primary_institution)
      if (!primaryId) {
        logger.warn(`Institution not found: ${module.primary_institution}`)
        continue
      }

      const supportingIds = module.supporting
        ? module.supporting.map((name: string) => this.institutionIds.get(name)).filter(Boolean)
        : []

      await query(
        `INSERT INTO rd_dev_module_responsibilities 
         (project_id, module_category, module_name, module_description, primary_institution_id, 
          supporting_institutions, performance_level, integration_points)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this.rdDevProjectId,
          module.category,
          module.name,
          module.description,
          primaryId,
          supportingIds,
          module.performance_level,
          JSON.stringify(module.integration_points),
        ],
      )
      count++
    }

    logger.info(`Seeded ${count} module responsibilities`)
    return count
  }

  /**
   * 사업화 마일스톤 시드
   */
  private async seedCommercialization(): Promise<number> {
    const milestones = [
      {
        type: '경제성분석',
        name: '1차 경제성·효율성 분석',
        description: 'Model1/Model2 비교 분석',
        target_date: '2025-12-31',
        institution: '하다',
      },
      {
        type: '경제성분석',
        name: '2차 경제성·효율성 분석',
        description: '실증 데이터 기반 분석',
        target_date: '2026-12-31',
        institution: '하다',
      },
      {
        type: 'BM개발',
        name: 'BM 초안 개발',
        description: '비즈니스 모델 초안',
        target_date: '2025-12-31',
        institution: '하다',
      },
      {
        type: 'BM개발',
        name: 'BM 고도화',
        description: '실증 반영 BM 고도화',
        target_date: '2026-12-31',
        institution: '하다',
      },
      {
        type: '시범운용',
        name: '1,500m² 온실 예비 실증',
        description: '초기 실증 테스트',
        target_date: '2025-12-31',
        institution: '하다',
      },
      {
        type: '시범운용',
        name: '테스트 농가 시범 운용',
        description: '실제 농가 시범 운용 지원',
        target_date: '2027-09-30',
        institution: '정원SFA',
      },
      {
        type: '인증획득',
        name: 'KTL 시험성적서 발급',
        description: '공인 성능 인증 획득',
        target_date: '2027-12-31',
        institution: '정원SFA',
      },
      {
        type: '양산준비',
        name: '상업용 제품 양산체계 기반 구축',
        description: '양산 및 보급 준비',
        target_date: '2027-12-31',
        institution: '정원SFA',
      },
      {
        type: '영업홍보',
        name: '영업·홍보 자료 제작',
        description: '사업화 진행을 위한 영업 자료',
        target_date: '2027-06-30',
        institution: '정원SFA',
      },
    ]

    let count = 0
    for (const milestone of milestones) {
      const institutionId = this.institutionIds.get(milestone.institution) || null
      await query(
        `INSERT INTO rd_dev_commercialization 
         (project_id, milestone_type, milestone_name, milestone_description, target_date, 
          responsible_institution_id, status)
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
   * 산출물 의존성 시드 (샘플)
   */
  private async seedDeliverableDependencies(): Promise<number> {
    // 예시: 몇 가지 주요 의존성만 추가
    const dependencies = [
      {
        source: 'SLAM/2D Map 시뮬레이션',
        target: '3D LiDAR+IMU SLAM 통합',
        type: '선행조건',
        description: '시뮬레이션 데이터가 실제 SLAM 구현의 기반',
      },
      {
        source: '레일 진입 알고리즘 개발',
        target: 'AMR 시작품 제작',
        type: '통합대상',
        description: '알고리즘이 AMR에 통합되어야 함',
      },
      {
        source: '작업자 추종 기초 모델',
        target: 'AMR 제어 시스템',
        type: '입력데이터',
        description: '추종 모델의 출력이 AMR 제어 입력',
      },
      {
        source: 'BMS 설계',
        target: '자동 충전 스테이션',
        type: '선행조건',
        description: '배터리 사양이 확정되어야 충전 스테이션 설계 가능',
      },
    ]

    let count = 0
    for (const dep of dependencies) {
      const sourceId = Array.from(this.deliverableIds.entries()).find(([title]) =>
        title.includes(dep.source),
      )?.[1]
      const targetId = Array.from(this.deliverableIds.entries()).find(([title]) =>
        title.includes(dep.target),
      )?.[1]

      if (sourceId && targetId) {
        await query(
          `INSERT INTO rd_dev_deliverable_dependencies 
           (source_deliverable_id, target_deliverable_id, dependency_type, description, is_blocking)
           VALUES ($1, $2, $3, $4, $5)`,
          [sourceId, targetId, dep.type, dep.description, true],
        )
        count++
      }
    }

    logger.info(`Seeded ${count} deliverable dependencies`)
    return count
  }

  /**
   * 캘린더 이벤트 시드 (분기별 주요 이벤트)
   */
  private async seedCalendarEvents(): Promise<number> {
    const events = [
      {
        type: '마일스톤',
        title: '프로젝트 킥오프',
        date: '2025-04-01',
        description: '작업자 추종형 AMR 프로젝트 시작',
      },
      {
        type: '산출물마감',
        title: 'AMR 시작품 2종 제작 완료',
        date: '2025-12-31',
        description: 'Model1, Model2 시작품 완성',
      },
      {
        type: 'KPI측정',
        title: '온실용 AMR 성능지표 평가',
        date: '2026-12-31',
        description: '주행속도, 정밀도, 안전성 종합 평가',
      },
      {
        type: '검증시나리오',
        title: '작업자 협업 수확 시나리오 테스트',
        date: '2026-09-30',
        description: '전체 프로세스 검증',
      },
      {
        type: '실증',
        title: '부여 스마트팜 통합 실증',
        date: '2026-11-30',
        description: '1,500m² 이상 온실 실증',
      },
      {
        type: '보고',
        title: '1단계-1차년도 최종 보고',
        date: '2025-12-31',
        description: '연차 성과 보고',
      },
      {
        type: '보고',
        title: '1단계-2차년도 최종 보고',
        date: '2026-12-31',
        description: '연차 성과 보고',
      },
      {
        type: '마일스톤',
        title: 'KTL 시험성적서 발급',
        date: '2027-12-31',
        description: '공인 성능 인증 획득',
      },
      {
        type: '회의',
        title: 'Q2 정기 협의회',
        date: '2025-07-15',
        description: '전체 기관 진행 상황 공유',
      },
      {
        type: '회의',
        title: 'Q4 정기 협의회',
        date: '2025-12-15',
        description: '전체 기관 진행 상황 공유',
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
  async seedAll(): Promise<EnhancedSeedResult> {
    try {
      logger.info('Starting Worker Follow AMR enhanced data seeding...')

      const loaded = await this.loadProjectIds()
      if (!loaded) {
        return {
          success: false,
          counts: {
            kpis: 0,
            dependencies: 0,
            scenarios: 0,
            locations: 0,
            modules: 0,
            commercialization: 0,
            calendarEvents: 0,
          },
          error: 'Failed to load project IDs',
        }
      }

      const locations = await this.seedTestLocations()
      const kpis = await this.seedKpis()
      const scenarios = await this.seedVerificationScenarios()
      const modules = await this.seedModuleResponsibilities()
      const commercialization = await this.seedCommercialization()
      const dependencies = await this.seedDeliverableDependencies()
      const calendarEvents = await this.seedCalendarEvents()

      logger.info('Worker Follow AMR enhanced data seeding completed successfully')

      return {
        success: true,
        counts: {
          locations,
          kpis,
          scenarios,
          modules,
          commercialization,
          dependencies,
          calendarEvents,
        },
      }
    } catch (error) {
      logger.error('Enhanced seeding failed:', error)
      return {
        success: false,
        counts: {
          kpis: 0,
          dependencies: 0,
          scenarios: 0,
          locations: 0,
          modules: 0,
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
  const seeder = new WorkerFollowAmrEnhancedSeeder()

  try {
    const result = await seeder.seedAll()
    console.log('\n=== Enhanced Seeding Results ===')
    console.log('Success:', result.success)
    if (result.success) {
      console.log('Counts:', result.counts)
      console.log(`
Total seeded:
- Test Locations: ${result.counts.locations}
- KPIs: ${result.counts.kpis}
- Verification Scenarios: ${result.counts.scenarios}
- Module Responsibilities: ${result.counts.modules}
- Commercialization Milestones: ${result.counts.commercialization}
- Deliverable Dependencies: ${result.counts.dependencies}
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

export { WorkerFollowAmrEnhancedSeeder }
