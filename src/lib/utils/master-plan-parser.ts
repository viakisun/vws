/**
 * Master Plan Parser
 * 마스터 플랜 마크다운 문서 파싱 유틸리티
 */

export interface ParsedInstitution {
  name: string
  type?: string
  role_description: string
  deliverables: Array<{
    phase: string
    year: string
    title: string
    description: string
  }>
}

export interface ParsedViaRole {
  category: string
  title: string
  description: string
  integration_points: string[]
  technical_details: Record<string, unknown>
}

export interface ParsedTechnicalSpec {
  category: string
  title: string
  data: Record<string, unknown>
}

export interface ParsedProject {
  title: string
  type: 'worker_follow_amr' | 'smartfarm_multirobot'
  duration_months: number
  government_funding: number
  institution_funding: number
  phases: Array<{
    phase_number: number
    year_number: number
    start_date: string
    end_date: string
    objectives: string[]
    key_technologies: string[]
  }>
  institutions: ParsedInstitution[]
  via_roles: ParsedViaRole[]
  technical_specs: ParsedTechnicalSpec[]
  quarterly_milestones: Array<{
    phase_id: string
    quarter: string
    year: number
    planned_activities: string[]
    institution_assignments: Record<string, string[]>
  }>
}

export class MasterPlanParser {
  /**
   * 작업자 추종형 AMR 마스터 플랜 파싱
   */
  static parseWorkerFollowAmrPlan(content: string): ParsedProject {
    const lines = content.split('\n')

    // 기본 정보 추출
    const title = this.extractTitle(lines)
    const duration = this.extractDuration(content)
    const funding = this.extractFunding(content)

    // 기관 정보 추출
    const institutions = this.extractWorkerFollowInstitutions(content)

    // VIA 역할 추출
    const viaRoles = this.extractWorkerFollowViaRoles(content)

    // 기술 사양 추출
    const technicalSpecs = this.extractWorkerFollowTechnicalSpecs(content)

    // 단계 정보 추출
    const phases = this.extractWorkerFollowPhases(content)

    // 분기별 마일스톤 추출
    const quarterlyMilestones = this.extractWorkerFollowQuarterlyMilestones(content)

    return {
      title,
      type: 'worker_follow_amr',
      duration_months: duration,
      government_funding: funding.government,
      institution_funding: funding.institution,
      phases,
      institutions,
      via_roles: viaRoles,
      technical_specs: technicalSpecs,
      quarterly_milestones: quarterlyMilestones,
    }
  }

  /**
   * 스마트팜 멀티로봇 마스터 플랜 파싱
   */
  static parseSmartfarmMultirobotPlan(content: string): ParsedProject {
    const lines = content.split('\n')

    // 기본 정보 추출
    const title = this.extractTitle(lines)
    const duration = this.extractDuration(content)
    const funding = this.extractFunding(content)

    // 기관 정보 추출
    const institutions = this.extractSmartfarmInstitutions(content)

    // VIA 역할 추출
    const viaRoles = this.extractSmartfarmViaRoles(content)

    // 기술 사양 추출
    const technicalSpecs = this.extractSmartfarmTechnicalSpecs(content)

    // 단계 정보 추출
    const phases = this.extractSmartfarmPhases(content)

    // 분기별 마일스톤 추출
    const quarterlyMilestones = this.extractSmartfarmQuarterlyMilestones(content)

    return {
      title,
      type: 'smartfarm_multirobot',
      duration_months: duration,
      government_funding: funding.government,
      institution_funding: funding.institution,
      phases,
      institutions,
      via_roles: viaRoles,
      technical_specs: technicalSpecs,
      quarterly_milestones: quarterlyMilestones,
    }
  }

  private static extractTitle(lines: string[]): string {
    const titleLine = lines.find((line) => line.startsWith('# '))
    return titleLine ? titleLine.replace('# ', '').trim() : 'Unknown Project'
  }

  private static extractDuration(content: string): number {
    // "2년 9개월" 또는 "2025.04.01 ~ 2027.12.31" 형태에서 추출
    const durationMatch = content.match(/(\d+)년\s*(\d+)개월/)
    if (durationMatch) {
      const years = parseInt(durationMatch[1])
      const months = parseInt(durationMatch[2])
      return years * 12 + months
    }

    const dateMatch = content.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/)
    if (dateMatch) {
      const startYear = parseInt(dateMatch[1])
      const startMonth = parseInt(dateMatch[2])
      const endYear = parseInt(dateMatch[4])
      const endMonth = parseInt(dateMatch[5])

      return (endYear - startYear) * 12 + (endMonth - startMonth) + 1
    }

    return 33 // 기본값 (2년 9개월)
  }

  private static extractFunding(content: string): { government: number; institution: number } {
    // "정부지원 1,950,000천원, 기관부담 438,335천원" 형태에서 추출
    const govMatch = content.match(/정부지원\s*([\d,]+)천원/)
    const instMatch = content.match(/기관부담\s*([\d,]+)천원/)

    const government = govMatch ? parseInt(govMatch[1].replace(/,/g, '')) * 1000 : 1950000000
    const institution = instMatch ? parseInt(instMatch[1].replace(/,/g, '')) * 1000 : 438335000

    return { government, institution }
  }

  private static extractWorkerFollowInstitutions(content: string): ParsedInstitution[] {
    const institutions: ParsedInstitution[] = []

    // 정원에스에프에이
    institutions.push({
      name: '정원에스에프에이',
      type: '기업',
      role_description:
        '작업자 추종·장애물 인식·자율주행, 추종형 AMR 개발, 통합 실증·고도화/경제성 분석',
      deliverables: [
        {
          phase: '1단계-1차년도',
          year: '2025',
          title: 'Model 1·Model 2 시작품 제작',
          description: '하다 기존 추종 AMR 고도화, 정원SFA 다목적 AMR 고도화',
        },
        {
          phase: '1단계-2차년도',
          year: '2026',
          title: 'AI 기반 정적/동적 장애물 인식·회피',
          description: '3D LiDAR+IMU SLAM, 자동 충전 스테이션, 물류 연계',
        },
        {
          phase: '2단계-1차년도',
          year: '2027',
          title: '자율주행 성능 최적화',
          description: '관제 모니터링 GUI 적용, 안전 기능 시험·사용자 매뉴얼',
        },
      ],
    })

    // 한국생산기술연구원
    institutions.push({
      name: '한국생산기술연구원',
      type: '연구기관',
      role_description: 'SLAM/2D 맵·회피/경로계획, 신뢰성·안전성, 레일 인식 시스템',
      deliverables: [
        {
          phase: '1단계-1차년도',
          year: '2025',
          title: '레일 진입 알고리즘',
          description: '온실 레일·통로·장애물 최적화, 안전 운영 프로토콜',
        },
        {
          phase: '1단계-2차년도',
          year: '2026',
          title: '융합 센서 모듈',
          description: '레일 인식 시스템, 자동 충전 스테이션 설계·설치·운용',
        },
        {
          phase: '2단계-1차년도',
          year: '2027',
          title: '레일 진입 기능 통합 실증',
          description: '시작품 성능 개선·보완, 자동 충전 스테이션 운용·검증',
        },
      ],
    })

    // 충남대학교
    institutions.push({
      name: '충남대학교',
      type: '대학',
      role_description: '시각화 AI 기반 작업자 추종·제스처 인식',
      deliverables: [
        {
          phase: '1단계-1차년도',
          year: '2025',
          title: '작업자 추종·제스처 인식 기초 모델',
          description: '주요 객체 선정, 학습데이터 수집·비전시스템 구성',
        },
        {
          phase: '1단계-2차년도',
          year: '2026',
          title: '인식 모델 고도화',
          description: '데이터 규모화/ROI/End-to-End, 통합·실시간 안정화',
        },
        {
          phase: '2단계-1차년도',
          year: '2027',
          title: '현장 실증 성능 평가·안정화',
          description: '협업 시나리오 문제점 보완, 실용화 수준의 인식 성능 안정화',
        },
      ],
    })

    // 하다
    institutions.push({
      name: '하다',
      type: '기업',
      role_description: '추종 운반 로봇 플랫폼 사양·설계, 현장 실증',
      deliverables: [
        {
          phase: '1단계-1차년도',
          year: '2025',
          title: '플랫폼 사양/제작',
          description: '지면(콘크리트/온수파이프) 주행 가능 플랫폼 고도화',
        },
        {
          phase: '1단계-2차년도',
          year: '2026',
          title: '작업자 추종·운반 플랫폼 제작',
          description: '레일 진입/주행 고도화, 선별장·트럭 상차/컨테이너 탑재 기능',
        },
        {
          phase: '2단계-1차년도',
          year: '2027',
          title: '현장 적용·실용화 실증',
          description: '안전거리 유지 분석, 프로세스 최적화, 경제성 분석',
        },
      ],
    })

    return institutions
  }

  private static extractSmartfarmInstitutions(content: string): ParsedInstitution[] {
    const institutions: ParsedInstitution[] = []

    // 메타파머스
    institutions.push({
      name: '메타파머스',
      type: '기업',
      role_description: '자율 적과/적심 로봇 통합 프레임워크 설계, 작업 대상 인식 AI 모델 개발',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '통합 프레임워크 설계',
          description: '작업 대상 인식 AI 모델 개발',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '비주얼 서보잉 기반 로봇 매니퓰레이션',
          description: '로봇 최적 작업 계획 알고리즘, 행동트리 개발',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '로봇 시스템 통합 및 현장 실증',
          description: '통합 시스템 최적화',
        },
      ],
    })

    // 울산과학기술원
    institutions.push({
      name: '울산과학기술원',
      type: '대학',
      role_description: '3차원 장애물 지도 작성, 3차원 다중 작물 추적, 매니퓰레이터 경로 계획',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '3차원 장애물 지도 작성',
          description: '3차원 다중 작물 추적 기법 연구',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '고수준 3차원 장애물 지도',
          description: '매니퓰레이터 경로 계획 및 충돌 검사, 지도 작성을 위한 경로 생성 자동화',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '엔드이펙터 접근 가능 여부 판단',
          description: '적과/적심 작업 엔드이펙터 접근 가능 여부 판단',
        },
      ],
    })

    // 한국로봇융합연구원
    institutions.push({
      name: '한국로봇융합연구원',
      type: '연구기관',
      role_description: '적심 엔드이펙터 개발, 작물별 적심 위치 특성 분석',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '적심 위치 특성 분석',
          description: '시제품 기구부 설계 및 소재 선정',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '적심 엔드이펙터 시제품 개발',
          description: '정확도, 손상률 실증',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '내구성·구조 최적화',
          description: '농가 환경 적합, 실증 테스트를 통한 기능 고도화',
        },
      ],
    })

    // 국립농업과학원
    institutions.push({
      name: '국립농업과학원',
      type: '연구기관',
      role_description: '적과 엔드이펙터 개발, 작물 특성 데이터 획득',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '적과 엔드이펙터 특성 데이터 획득',
          description: '데이터 기반 엔드이펙터 조건 선정 및 제작',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '매니퓰레이터 적용 통신·제어 방법',
          description: '매니퓰레이터 통한 엔드이펙터 제어 검증',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '엔드이펙터 동작 검토 및 개선',
          description: '현장 실증',
        },
      ],
    })

    // 에이지로보틱스
    institutions.push({
      name: '에이지로보틱스',
      type: '기업',
      role_description: '지능로봇 플랫폼, 자동 충전 시스템',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '지능로봇 플랫폼 설계',
          description: '농장 주행 환경 및 운용 시나리오 분석, 자동 충전 시스템 설계',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '지능로봇 플랫폼 보완 설계·제작',
          description: '자동 충전 시스템 보완 설계·제작',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '통합 연동 시험 및 보완',
          description: '현장 실증',
        },
      ],
    })

    // 대동로보틱스
    institutions.push({
      name: '대동로보틱스',
      type: '기업',
      role_description: '과채류 환경 지도 작성 및 위치 파악, LPS 기반 위치 파악',
      deliverables: [
        {
          phase: '1차년도',
          year: '2025',
          title: '지도 작성 및 위치 파악 기술',
          description: 'LPS 기반 위치 파악, 농작업 요소 고려 경로 계획·제어',
        },
        {
          phase: '2차년도',
          year: '2026',
          title: '멀티모달 위치 파악 기술',
          description: '과채류 환경 특화 경로 계획·제어',
        },
        {
          phase: '3차년도',
          year: '2027',
          title: '통합 연동 및 성능 고도화',
          description: '실증 성능평가 및 검증',
        },
      ],
    })

    return institutions
  }

  private static extractWorkerFollowViaRoles(content: string): ParsedViaRole[] {
    return [
      {
        category: '관제',
        title: '관제 SaaS 아키텍처/플랫폼',
        description:
          'MSA/EDA 기반 스마트팜 로봇 관제 아키텍처, 실시간 데이터 수집, 원격 관제·경로 최적화',
        integration_points: ['정원에스에프에이', '한국생산기술연구원', '하다'],
        technical_details: {
          architecture: 'MSA/EDA',
          real_time_collection: true,
          remote_control: true,
          path_optimization: true,
          dashboard: '로봇데이터 대시보드·API Gateway',
          ui_ux: 'UX/UI 기획·디자인 시스템',
        },
      },
      {
        category: 'AI협업',
        title: '시각화 AI 협업',
        description: '경량화 모델, 실내 환경 최적화, 실시간 장애물/작업자 인식 서비스',
        integration_points: ['충남대학교'],
        technical_details: {
          model_type: '경량화 모델',
          environment: '실내 환경 최적화',
          recognition: ['장애물 인식', '작업자 인식'],
          real_time: true,
        },
      },
      {
        category: '자율주행협업',
        title: 'SLAM/2D 맵·회피/경로계획 협업',
        description:
          '구동방식 최적화·소형화, 모듈형 센서 마운트, UWB·SLAM 기반 실내측위, 센서 융합 알고리즘 최적화',
        integration_points: ['정원에스에프에이', '한국생산기술연구원', '하다'],
        technical_details: {
          slam: 'UWB·SLAM 기반 실내측위',
          sensor_fusion: '센서 융합 알고리즘 최적화',
          sensor_mount: '모듈형 센서 마운트',
          optimization: '구동방식 최적화·소형화',
        },
      },
      {
        category: 'UI/UX',
        title: 'UI/UX 및 운영 기능',
        description:
          '로봇 상태, 제어, 시각화를 포함한 웹 기반 UI, 농장 환경 데이터 분석, 작업 계획·스케줄링',
        integration_points: ['모든 참여기관'],
        technical_details: {
          web_ui: true,
          visualization: true,
          data_analysis: '농장 환경 데이터 분석',
          scheduling: '작업 계획·스케줄링',
          reporting: '보고서 생성',
        },
      },
      {
        category: '실증분석',
        title: '실증 데이터 분석',
        description:
          '성능지표 저장·시각화·리포트 자동 생성, 비즈니스 모델: 경제성/효율성 분석 연계',
        integration_points: ['모든 참여기관'],
        technical_details: {
          performance_metrics: true,
          visualization: true,
          auto_reporting: true,
          business_model: '경제성/효율성 분석 연계',
        },
      },
    ]
  }

  private static extractSmartfarmViaRoles(content: string): ParsedViaRole[] {
    return [
      {
        category: '관제',
        title: 'SaaS 기반 통합 관제 시스템 아키텍처',
        description: '클라우드 기반 SaaS 플랫폼 아키텍처 설계 및 통합관제 시스템 개발',
        integration_points: [
          '메타파머스',
          '울산과기원',
          '한로연',
          '국립농과원',
          '에이지로보틱스',
          '대동로보틱스',
        ],
        technical_details: {
          architecture: '클라우드 기반 SaaS',
          integration_control: true,
          real_time_monitoring: true,
          multi_robot: true,
        },
      },
      {
        category: 'AI협업',
        title: 'AI 서비스 및 데이터 파이프라인',
        description: '인식 모델 데이터 파이프라인, AI 서비스 연동',
        integration_points: ['메타파머스', '울산과기원'],
        technical_details: {
          data_pipeline: true,
          ai_services: true,
          model_integration: true,
        },
      },
      {
        category: 'UI/UX',
        title: 'UI/UX 및 운영 기능',
        description: '다중 로봇 동시 제어·협업 기능 구현, 웹 기반 UI, 농장 환경 데이터 분석',
        integration_points: ['모든 참여기관'],
        technical_details: {
          multi_robot_control: true,
          collaboration: true,
          web_ui: true,
          data_analysis: '농장 환경 데이터 분석',
        },
      },
      {
        category: '실증분석',
        title: '실증 환경 구축 및 데이터 분석',
        description: '실증 환경 구축, 알고리즘 통합/테스트, 상호작용/사용성 평가·데이터 분석',
        integration_points: ['모든 참여기관'],
        technical_details: {
          field_environment: true,
          algorithm_integration: true,
          usability_evaluation: true,
          data_analysis: true,
        },
      },
    ]
  }

  private static extractWorkerFollowTechnicalSpecs(content: string): ParsedTechnicalSpec[] {
    return [
      {
        category: '센서',
        title: '센서 융합 및 BMS',
        data: {
          slam: 'SLAM·2D 맵',
          obstacle_avoidance: '실시간 장애물 회피·경로계획',
          sensor_fusion: '센서 융합',
          bms: 'BMS',
          conveyor: '컨베이어 상판',
        },
      },
      {
        category: '성능지표',
        title: '온실용 AMR 평가 목표치',
        data: {
          pipe_speed: '1.45 m/s',
          rail_accuracy: '100%',
          rail_time: '20s',
          position_accuracy: '30cm',
          working_time: '5시간 연속 작업',
          payload: '300kg 이상',
        },
      },
      {
        category: '배터리',
        title: '배터리 용량 산정표',
        data: {
          '2시간': '167Ah',
          '4시간': '333Ah',
          '8시간': '666Ah',
        },
      },
      {
        category: '관제데이터',
        title: '관제 데이터 전송주기',
        data: {
          driving_data: '20 Hz',
          sensor_data: '50 Hz 이상',
          camera_data: '30 fps 이상',
        },
      },
    ]
  }

  private static extractSmartfarmTechnicalSpecs(content: string): ParsedTechnicalSpec[] {
    return [
      {
        category: '로봇플랫폼',
        title: '자율주행 모바일 로봇 플랫폼',
        data: {
          max_height: '3m',
          platform_type: '멀티센서 기반',
          navigation: 'LPS 기반 위치 파악',
          charging: '자동 충전 시스템',
        },
      },
      {
        category: '작업환경',
        title: '온실 작업 환경 기준',
        data: {
          rail_spacing: '1.6m',
          rail_gap: '50~60cm',
          cucumber_spacing: '30~40cm',
          tomato_spacing: '40~50cm',
          average_height: '3m',
        },
      },
      {
        category: '인식AI',
        title: '인식 AI 모델',
        data: {
          object_segmentation: '실시간 객체 분할',
          keypoint_detection: '키포인트 인식',
          multi_object_tracking: '다중 객체 추적',
          fps_target: '15fps 이상',
        },
      },
      {
        category: '엔드이펙터',
        title: '적과/적심 엔드이펙터',
        data: {
          force_control: '힘 제어 및 다중 센서',
          damage_minimization: '작물 손상 최소화',
          cutting_precision: '정밀 절단',
          material_handling: '파지·수거',
        },
      },
      {
        category: '경제성분석',
        title: '경제성 분석 (1ha 기준)',
        data: {
          robot_count: '2대',
          initial_cost: '1억6천만 원',
          annual_operation: '310만 원',
          annual_profit: '4,226만 원/ha',
          roi: '3.7년 이하',
        },
      },
    ]
  }

  private static extractWorkerFollowPhases(content: string) {
    return [
      {
        phase_number: 1,
        year_number: 1,
        start_date: '2025-04-01',
        end_date: '2025-12-31',
        objectives: [
          '자율주행 기능을 탑재한 롤러 컨베이어 장착형 작업자 추종형 AMR 개발',
          '인공지능 기반 장애물 인식·회피/추종',
          'SLAM·2D 맵 및 경로 계획',
        ],
        key_technologies: ['SLAM', '센서 융합', 'BMS', '컨베이어 상판'],
      },
      {
        phase_number: 1,
        year_number: 2,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        objectives: [
          'AI 기반 정적/동적 장애물 인식·회피 고도화',
          '3D LiDAR+IMU SLAM 구현',
          '자동 충전 스테이션 및 물류 연계',
        ],
        key_technologies: ['3D LiDAR', 'IMU', '자동 충전', '물류 시스템'],
      },
      {
        phase_number: 2,
        year_number: 1,
        start_date: '2027-01-01',
        end_date: '2027-12-31',
        objectives: [
          '경로계획 실증을 통한 관제 시스템 성능 테스트',
          '연동 작업 실증 (이동관제·물류·연동)',
          '상업용 제품 양산체계 기반 홍보/영업',
        ],
        key_technologies: ['관제 시스템', '실증 테스트', '상업화'],
      },
    ]
  }

  private static extractSmartfarmPhases(content: string) {
    return [
      {
        phase_number: 1,
        year_number: 1,
        start_date: '2025-04-01',
        end_date: '2025-12-31',
        objectives: [
          '적과/적심 특화 모바일 로봇 하드웨어 요소 기술',
          '작업 대상 인식 AI 모델 및 로봇 제어 기술',
          '실내 자율주행 기술',
          'AI 인식용 DB 구축 및 통합관제 시스템 개발',
        ],
        key_technologies: ['인식 AI', '로봇 제어', '자율주행', '통합관제'],
      },
      {
        phase_number: 1,
        year_number: 2,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        objectives: [
          '자율 적과/적심 모바일 로봇 통합 및 시제품 개발',
          '행동트리 및 다중로봇 협동 제어 기술 개발',
          '통합관제 시스템 및 다중 로봇 사용자 시나리오 개발',
        ],
        key_technologies: ['행동트리', '다중로봇 협동', '통합관제', '시나리오'],
      },
      {
        phase_number: 2,
        year_number: 1,
        start_date: '2027-01-01',
        end_date: '2027-12-31',
        objectives: [
          '스마트팜 혁신밸리 상주 실증 농장 및 국립농업과학원 온실에서 성능 테스트 및 실증',
          '통합 관제시스템으로 로봇 2대 이상 제어 및 관제',
        ],
        key_technologies: ['실증 테스트', '다중 로봇 관제', '성능 평가'],
      },
    ]
  }

  private static extractWorkerFollowQuarterlyMilestones(content: string) {
    return [
      // 1단계-1차년도 (2025 Q2-Q4)
      {
        phase_id: 'phase_1_1',
        quarter: 'Q2',
        year: 2025,
        planned_activities: ['대상작물·환경 정의', 'SLAM/맵·회피'],
        institution_assignments: {
          정원에스에프에이: ['SLAM/맵 개발'],
          한국생산기술연구원: ['레일 진입 알고리즘'],
          충남대학교: ['작업자 추종 기초 모델'],
          비아: ['관제 아키텍처'],
          하다: ['플랫폼 사양'],
        },
      },
      {
        phase_id: 'phase_1_1',
        quarter: 'Q3',
        year: 2025,
        planned_activities: ['Model1·2 시작품', '컨베이어', 'BMS'],
        institution_assignments: {
          정원에스에프에이: ['시작품 제작'],
          한국생산기술연구원: ['안전 프로토콜'],
          충남대학교: ['제스처 인식'],
          비아: ['SLAM/측위 협업'],
          하다: ['플랫폼 제작'],
        },
      },
      {
        phase_id: 'phase_1_1',
        quarter: 'Q4',
        year: 2025,
        planned_activities: ['레일 진입/탈출 개선', '경제성 분석'],
        institution_assignments: {
          정원에스에프에이: ['BMS', '레일 진입'],
          한국생산기술연구원: ['배터리·모터 최적화'],
          충남대학교: ['데이터 수집'],
          비아: ['AI 경량화'],
          하다: ['온실 실증'],
        },
      },

      // 1단계-2차년도 (2026 Q1-Q4)
      {
        phase_id: 'phase_1_2',
        quarter: 'Q1',
        year: 2026,
        planned_activities: ['AI 회피 고도화', '3D LiDAR SLAM'],
        institution_assignments: {
          정원에스에프에이: ['AI 회피'],
          한국생산기술연구원: ['융합센서'],
          충남대학교: ['모델 규모화'],
          비아: ['텔레메트리'],
          하다: ['레일 진입'],
        },
      },
      {
        phase_id: 'phase_1_2',
        quarter: 'Q2',
        year: 2026,
        planned_activities: ['자동충전·도킹', '물류 시스템'],
        institution_assignments: {
          정원에스에프에이: ['자동충전'],
          한국생산기술연구원: ['레일 인식'],
          충남대학교: ['통합'],
          비아: ['원격관제'],
          하다: ['도킹 테스트'],
        },
      },
      {
        phase_id: 'phase_1_2',
        quarter: 'Q3',
        year: 2026,
        planned_activities: ['통합 실증', '지표 개선'],
        institution_assignments: {
          정원에스에프에이: ['통합 실증'],
          한국생산기술연구원: ['이식·테스트'],
          충남대학교: ['프로토콜'],
          비아: ['UI/모바일'],
          하다: ['온실 실증'],
        },
      },
      {
        phase_id: 'phase_1_2',
        quarter: 'Q4',
        year: 2026,
        planned_activities: ['성능 개선', '2차 시작품'],
        institution_assignments: {
          정원에스에프에이: ['성능 개선'],
          한국생산기술연구원: ['자동충전 운용'],
          충남대학교: ['안정화'],
          비아: ['데이터 분석'],
          하다: ['기능보완'],
        },
      },

      // 2단계-1차년도 (2027 Q1-Q4)
      {
        phase_id: 'phase_2_1',
        quarter: 'Q1',
        year: 2027,
        planned_activities: ['성능 최적화', 'GUI 적용'],
        institution_assignments: {
          정원에스에프에이: ['성능 최적화'],
          한국생산기술연구원: ['레일 진입 통합'],
          충남대학교: ['현장 실증'],
          비아: ['UX 재구성'],
          하다: ['현장 적용'],
        },
      },
      {
        phase_id: 'phase_2_1',
        quarter: 'Q2',
        year: 2027,
        planned_activities: ['안전시험', '매뉴얼'],
        institution_assignments: {
          정원에스에프에이: ['안전시험'],
          한국생산기술연구원: ['충전 운용'],
          충남대학교: ['모듈화'],
          비아: ['OTA/배포'],
          하다: ['경제성 향상'],
        },
      },
      {
        phase_id: 'phase_2_1',
        quarter: 'Q3',
        year: 2027,
        planned_activities: ['사업화', '시험성적서'],
        institution_assignments: {
          정원에스에프에이: ['사업화'],
          한국생산기술연구원: ['검증'],
          충남대학교: ['안정화'],
          비아: ['리포트'],
          하다: ['운용 방안'],
        },
      },
      {
        phase_id: 'phase_2_1',
        quarter: 'Q4',
        year: 2027,
        planned_activities: ['최종 검증', '완료'],
        institution_assignments: {
          정원에스에프에이: ['최종 검증'],
          한국생산기술연구원: ['완료'],
          충남대학교: ['완료'],
          비아: ['글로벌 확장'],
          하다: ['완료'],
        },
      },
    ]
  }

  private static extractSmartfarmQuarterlyMilestones(content: string) {
    return [
      // 1차년도 (2025 Q2-Q4)
      {
        phase_id: 'phase_1',
        quarter: 'Q2',
        year: 2025,
        planned_activities: ['통합 프레임워크 설계', '인식 AI 모델'],
        institution_assignments: {
          메타파머스: ['통합 프레임워크'],
          울산과기원: ['3D 장애물 지도'],
          한로연: ['적심 위치 특성'],
          국립농과원: ['적과 엔드이펙터'],
          에이지로보틱스: ['주행 환경 분석'],
          대동로보틱스: ['지도 작성'],
          비아: ['SaaS 아키텍처'],
        },
      },
      {
        phase_id: 'phase_1',
        quarter: 'Q3',
        year: 2025,
        planned_activities: ['기구부 설계', '운용 시나리오'],
        institution_assignments: {
          메타파머스: ['인식 AI 모델'],
          울산과기원: ['3D 다중 작물 추적'],
          한로연: ['시제품 기구부'],
          국립농과원: ['데이터 획득'],
          에이지로보틱스: ['플랫폼 설계'],
          대동로보틱스: ['LPS 기반'],
          비아: ['플랫폼 구성'],
        },
      },
      {
        phase_id: 'phase_1',
        quarter: 'Q4',
        year: 2025,
        planned_activities: ['소재 선정', '조건 선정'],
        institution_assignments: {
          메타파머스: ['모델 개발'],
          울산과기원: ['추적 연구'],
          한로연: ['소재 선정'],
          국립농과원: ['제작'],
          에이지로보틱스: ['충전 시스템'],
          대동로보틱스: ['경로 제어'],
          비아: ['시스템 설계'],
        },
      },

      // 2차년도 (2026 Q1-Q4)
      {
        phase_id: 'phase_2',
        quarter: 'Q1',
        year: 2026,
        planned_activities: ['비주얼 서보잉', '고수준 3D 지도'],
        institution_assignments: {
          메타파머스: ['비주얼 서보잉'],
          울산과기원: ['고수준 지도'],
          한로연: ['적심 엔드이펙터'],
          국립농과원: ['통신·제어'],
          에이지로보틱스: ['플랫폼 제작'],
          대동로보틱스: ['멀티모달'],
          비아: ['다중 로봇 제어'],
        },
      },
      {
        phase_id: 'phase_2',
        quarter: 'Q2',
        year: 2026,
        planned_activities: ['최적 작업계획', '경로계획·충돌검사'],
        institution_assignments: {
          메타파머스: ['최적 작업계획'],
          울산과기원: ['경로계획'],
          한로연: ['실증'],
          국립농과원: ['제어 검증'],
          에이지로보틱스: ['충전 시스템'],
          대동로보틱스: ['특화 경로'],
          비아: ['협업 기능'],
        },
      },
      {
        phase_id: 'phase_2',
        quarter: 'Q3',
        year: 2026,
        planned_activities: ['행동트리', '경로 생성 자동화'],
        institution_assignments: {
          메타파머스: ['행동트리'],
          울산과기원: ['경로 생성'],
          한로연: ['정확도 실증'],
          국립농과원: ['매니퓰레이터'],
          에이지로보틱스: ['보완 설계'],
          대동로보틱스: ['제어'],
          비아: ['실증 환경'],
        },
      },
      {
        phase_id: 'phase_2',
        quarter: 'Q4',
        year: 2026,
        planned_activities: ['통합', '접근 가능 여부'],
        institution_assignments: {
          메타파머스: ['통합'],
          울산과기원: ['접근 가능성'],
          한로연: ['손상률 실증'],
          국립농과원: ['엔드이펙터'],
          에이지로보틱스: ['제작'],
          대동로보틱스: ['제어'],
          비아: ['구축'],
        },
      },

      // 3차년도 (2027 Q1-Q4)
      {
        phase_id: 'phase_3',
        quarter: 'Q1',
        year: 2027,
        planned_activities: ['시스템 통합', '성능 고도화'],
        institution_assignments: {
          메타파머스: ['시스템 통합'],
          울산과기원: ['접근 판단'],
          한로연: ['내구·구조 최적화'],
          국립농과원: ['동작 검토'],
          에이지로보틱스: ['연동 시험'],
          대동로보틱스: ['통합 연동'],
          비아: ['고도화'],
        },
      },
      {
        phase_id: 'phase_3',
        quarter: 'Q2',
        year: 2027,
        planned_activities: ['현장 실증', '실증 성능평가'],
        institution_assignments: {
          메타파머스: ['현장 실증'],
          울산과기원: ['실증'],
          한로연: ['기능 고도화'],
          국립농과원: ['개선'],
          에이지로보틱스: ['보완'],
          대동로보틱스: ['성능 고도화'],
          비아: ['최적화'],
        },
      },
      {
        phase_id: 'phase_3',
        quarter: 'Q3',
        year: 2027,
        planned_activities: ['통합 최적화', '검증'],
        institution_assignments: {
          메타파머스: ['통합 최적화'],
          울산과기원: ['완료'],
          한로연: ['완료'],
          국립농과원: ['현장 실증'],
          에이지로보틱스: ['현장 실증'],
          대동로보틱스: ['실증 성능평가'],
          비아: ['완료'],
        },
      },
      {
        phase_id: 'phase_3',
        quarter: 'Q4',
        year: 2027,
        planned_activities: ['최종 검증', '완료'],
        institution_assignments: {
          메타파머스: ['완료'],
          울산과기원: ['완료'],
          한로연: ['완료'],
          국립농과원: ['완료'],
          에이지로보틱스: ['완료'],
          대동로보틱스: ['완료'],
          비아: ['완료'],
        },
      },
    ]
  }
}
