/**
 * Update Smart Farm Robot Project - Add Missing Verification Scenarios, KPIs, Test Locations
 * 과채류 적과·적심 프로젝트에 누락된 검증 시나리오 및 데이터 추가
 */

import { query } from '../src/lib/database/connection'
import { logger } from '../src/lib/utils/logger'

const PROJECT_ID = 'd4e3e077-d4c5-42d4-8a2f-1565951886e6'

interface UpdateResult {
  success: boolean
  counts: {
    testLocations: number
    kpis: number
    scenarios: number
    calendarEvents: number
  }
  error?: string
}

class SmartFarmScenarioUpdater {
  private phaseIds: Map<string, string> = new Map()
  private institutionIds: Map<string, string> = new Map()
  private testLocationIds: Map<string, string> = new Map()

  /**
   * 기존 단계 및 기관 ID 로드
   */
  private async loadExistingData(): Promise<boolean> {
    try {
      // 단계 조회
      const phasesResult = await query(
        `SELECT id, phase_number, year_number FROM rd_dev_phases WHERE project_id = $1 ORDER BY phase_number, year_number`,
        [PROJECT_ID],
      )
      phasesResult.rows.forEach((row: any) => {
        const key = `${row.phase_number}-${row.year_number}`
        this.phaseIds.set(key, row.id)
      })

      // 기관 조회
      const institutionsResult = await query(
        `SELECT id, institution_name FROM rd_dev_institutions WHERE project_id = $1`,
        [PROJECT_ID],
      )
      institutionsResult.rows.forEach((row: any) => {
        this.institutionIds.set(row.institution_name, row.id)
      })

      logger.info(`Loaded ${this.phaseIds.size} phases, ${this.institutionIds.size} institutions`)
      return true
    } catch (error) {
      logger.error('Failed to load existing data:', error)
      return false
    }
  }

  /**
   * 실증 장소 추가
   */
  private async addTestLocations(): Promise<number> {
    const locations = [
      {
        name: '상주 스마트팜 혁신밸리',
        type: '온실',
        address: '경상북도 상주시',
        facility_details: {
          면적: '480㎡',
          작물: ['오이'],
          설비: ['고소작업 환경', '레일 시스템', '자동충전 스테이션'],
          특징: '2대 이상 로봇 협업 실증',
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: '주요 실증 장소, 오이 작물 기준, 2대 이상 로봇 협업 실증 진행',
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
        notes: '토마토 작물 실증 장소, 2027년 2단계 현장 실증',
      },
      {
        name: '관제센터 (비아)',
        type: '관제센터',
        address: '비아 본사',
        facility_details: {
          설비: ['SaaS 관제 시스템', '데이터 서버', '통합 대시보드'],
          기능: ['실시간 모니터링', '스케줄링', 'OTA 배포'],
        },
        available_from: '2025-04-01',
        available_to: '2027-12-31',
        notes: '멀티로봇 통합관제 운영 센터, 원격 모니터링 및 제어',
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
          PROJECT_ID,
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

    logger.info(`Added ${count} test locations`)
    return count
  }

  /**
   * KPI 추가
   */
  private async addKpis(): Promise<number> {
    const kpis = [
      {
        category: '인식성능',
        name: 'AI 인식 속도',
        description: '과채류 인식 실시간 처리 속도 (임베디드)',
        target_value: '15',
        unit: 'fps',
        phase: '1-2',
        verification_method: '실시간 프레임률 측정, 객체 검출/분할 일관성 확인',
      },
      {
        category: '기타',
        name: '고소작업 높이',
        description: '최대 작업 가능 높이 (시저리프트 기반)',
        target_value: '3',
        unit: 'm',
        phase: '1-2',
        verification_method: '플랫폼 안정성 평가, 작업 반경 측정',
      },
      {
        category: '운영성능',
        name: '협업 로봇 수',
        description: '동시 협업 가능 로봇 대수',
        target_value: '2',
        unit: '대',
        phase: '2-1',
        verification_method: '다중 로봇 협업 시나리오 실증',
      },
      {
        category: '정밀도',
        name: '적심 정확도',
        description: '생장점 적심 작업 정확도',
        target_value: '90',
        unit: '%',
        phase: '2-1',
        verification_method: '적심 성공률 측정, 작물별/생육 단계별 평가',
      },
      {
        category: '정밀도',
        name: '적과 손상률',
        description: '적과 작업 시 과실 손상률',
        target_value: '5',
        unit: '% 이하',
        phase: '2-1',
        verification_method: '손상 과실 비율 측정, FMEA 분석',
      },
      {
        category: '기타',
        name: 'ROI',
        description: '투자 회수 기간 (1ha/2대 기준)',
        target_value: '3.7',
        unit: '년',
        phase: '2-1',
        verification_method: '경제성 분석 보고서, 실측 데이터 기반 산출',
      },
      {
        category: '정밀도',
        name: 'LPS 위치 정확도',
        description: 'LPS 기반 위치 파악 정밀도 (복합휠)',
        target_value: '10',
        unit: 'cm',
        phase: '1-2',
        verification_method: '지도/LPS 복합 오차 분석',
      },
      {
        category: '안전성',
        name: '자동충전 성공률',
        description: '자동충전 스테이션 도킹 성공률',
        target_value: '95',
        unit: '%',
        phase: '2-1',
        verification_method: '연속 충전 사이클 테스트',
      },
    ]

    let count = 0
    for (const kpi of kpis) {
      const phaseId = this.phaseIds.get(kpi.phase)
      await query(
        `INSERT INTO rd_dev_kpis 
         (project_id, phase_id, kpi_category, kpi_name, kpi_description, 
          target_value, unit, status, verification_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          PROJECT_ID,
          phaseId,
          kpi.category,
          kpi.name,
          kpi.description,
          kpi.target_value,
          kpi.unit,
          '미측정',
          kpi.verification_method,
        ],
      )
      count++
    }

    logger.info(`Added ${count} KPIs`)
    return count
  }

  /**
   * 검증 시나리오 추가 (9개 상세 시나리오)
   */
  private async addVerificationScenarios(): Promise<number> {
    const scenarios = [
      {
        name: '1. AI 인식 및 3D 추상 지도 검증',
        description:
          '과채류(오이·토마토) 객체분할(잎·줄기·과실·꼭지·노드), 키포인트/다중객체추적을 실시간 임베디드에서 동작 확인 (15 fps 이상 목표). 인식 결과를 실시간 3D 장애물 지도로 추상화(접촉 허용/금지 레이블 포함).',
        steps: [
          '데이터셋 구축 (온실 영상/RGB-D/Depth → 라벨링)',
          '모델 추론 성능 확인: 프레임률, 객체 검출/분할 일관성, 키포인트 안정성',
          'UNIST 추상모델: 큐브/타원 근사 → 비일관성(가림·노이즈) 보정',
          '고수준 3D 지도 생성 (접촉 허용/금지 레이블)',
          'SaaS 시각화: 인식 오버레이·3D 맵 타임라인 표시',
        ],
        notes: JSON.stringify({
          목표: '15 fps 이상 실시간 인식, 3D 지도 실시간 동기화',
          합격판정: '임베디드 15 fps 이상, 주요 객체/키포인트 인식, 접촉 레이블 엔드이펙터 활용',
          책임기관: {
            메타파머스: '인식 모델 설계/학습/추론 파이프라인',
            UNIST: '3D 지도·추상화·비일관성 보정·라벨 확장',
            비아: '데이터 파이프라인, 관제 대시보드/리포트',
          },
          검증환경: '상주 스마트팜 혁신밸리, 국립농업과학원',
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '2. 엔드이펙터(적과/적심) 단품 성능 검증',
        description:
          '적심 전용, 적과 전용 엔드이펙터의 파지 후 절단 메커니즘, 손상 최소화, 교체 용이 구조, 내환경·내구성을 작물/생육 단계별로 검증.',
        steps: [
          '설계 사양 추출: 작물 특성(줄기 굵기·생장점 위치·지름·길이·곡률·전단력·부착력)',
          '시제품 성능평가: 적심 정확도·작물 손상률 측정 (토마토/오이)',
          '파지율, 절단면 품질 확인',
          '파지부 유연소재/교체 구조, 방수/방진, 내식성 소재 확인',
          '내구·구조 최적화 (3년차): 반복 작업/환경 노출 FMEA',
        ],
        notes: JSON.stringify({
          목표: '적심 정확도·손상률 검증, 내구성 확보',
          합격판정: '정밀성 유지, 다양한 환경/생육 단계 적용, 내구성 확보',
          책임기관: {
            KIRO: '적심 엔드이펙터 설계·시제품·고도화',
            NAAS: '적과 엔드이펙터, 특성 데이터, 조건 선정·제작, 통신/제어 방법, 현장 실증',
            메타파머스: '매니퓰레이터 인터페이스 연계',
            비아: '시험 결과 리포팅 자동화',
          },
          검증지표: '적심 정확도, 손상률, 파지율, 절단면 품질, 내구성',
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '3. 매니퓰레이터 경로/비주얼 서보잉/행동트리',
        description:
          '엔드이펙터 6축 자세 생성, 역기구학·샘플링 기반 경로계획/충돌검사, 비주얼 서보잉 추종, 확률 기반 오차 보상(베이지안), 행동트리 실행.',
        steps: [
          '고수준 3D 지도(UNIST) + 로봇/엔드이펙터 메쉬 → 충돌검사 경로 생성',
          '역기구학·샘플링 기반 경로계획',
          '비주얼 서보잉 추종: 목표 경로와 실제 위치 확률 비교 → 실시간 보정',
          '행동트리: 적과/적심 상태머신·예외처리(재시도·대체 경로·중단/복구)',
          'SaaS 로깅: 각 노드 실행·성공/실패 사유 자동 기록',
        ],
        notes: JSON.stringify({
          목표: '경로 충돌 무발생, 작업 가능 판정, 예외처리',
          합격판정: '경로 충돌 무발생, 작업 가능 여부 판정 적합, 행동트리 예외 시나리오 성공',
          책임기관: {
            메타파머스: '경로/서보잉/행동트리 전담',
            UNIST: '지도·접근가능 판정 제공',
            비아: '실행 플로우/로그 시각화',
          },
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '4. 모바일 로봇 자율주행(3m 고소)·측위·충전',
        description:
          '최대 3m 고소작업 가능한 모바일 로봇 플랫폼, 멀티센서 지도작성·측위, LPS 기반 위치 추정, 자율주행 경로계획/제어, 자동충전 스테이션 연계(연속 작업).',
        steps: [
          '플랫폼/리프트 구조 검증: 고소 작업 안정성, 작업 반경, 레일/메카넘 휠 주행',
          '지도·측위: LiDAR/Camera/IMU 융합 지도 + LPS(복합휠) 기반 위치',
          '지도·LPS 복합 오차 분석',
          '경로계획/제어: 시설 재배 특화 동적 경로계획·보정',
          '자동충전 사이클: 연속 작업–충전–복귀 주기 안정성',
        ],
        notes: JSON.stringify({
          목표: '3m 고소 작업, 지도/측위 안정, 연속 충전',
          합격판정:
            '3m 고소 작업 수행, 지도/측위 안정 동작, 경로 추종 안정, 연속 작업+충전 사이클 완료',
          책임기관: {
            에이지로보틱스: '플랫폼/충전 설계·제작·보완, 통합 연동 시험',
            대동로보틱스: '지도/측위(LPS), 경로·제어, 성능 고도화·평가',
            비아: '충전/사이클 운영 데이터 수집·리포트',
          },
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '5. 단일 로봇 E2E 적과/적심',
        description:
          '인식→지도→경로/서보잉→행동트리→엔드이펙터까지 단일 로봇으로 적과/적심 완결 작업.',
        steps: [
          '목표 대상을 인식(키포인트 포함) → 추상 3D 지도 업데이트',
          '접근 가능 판단 → 경로계획·서보잉 추종',
          '파지 후 절단 → 수거/적재',
          '실패/예외: 행동트리 재시도·대체 경로·중단/복구',
          '결과: 성공률, 손상률, 작업 속도, 로그/영상 증적',
        ],
        notes: JSON.stringify({
          목표: '단일 로봇 E2E 완결 작업',
          합격판정: '성공률/손상률/속도 지표 취득 (실측 수집·보고), 3m 고소 작업 포함',
          책임기관: {
            '전 기관': '통합',
            비아: '로그·리포트 자동화',
          },
          산출물: '성공률/손상률/속도 측정 데이터, 작업 로그, 영상 기록',
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '6. 다중 로봇 협업 + 통합관제(SaaS)',
        description:
          '2대 이상 로봇의 협업(선행/후행 공정 연계, 라인/구역 분할, 데이터 인계)을 비아 SaaS로 스케줄링·모니터링.',
        steps: [
          '개별 명령형: 각 로봇이 다른 구역 적과/적심 병렬 수행',
          '라인 연계형: 로봇 A(적과) → 데이터 인계 → 로봇 B(적심) 후속 작업',
          '데이터 인계형: 선행 로봇의 대상·좌표 기록을 후속 로봇이 사용',
          '충돌 방지/자원 최적화: 작업할당·경로·충돌회피 알고리즘 동작',
          '실시간 관제: 지도/LPS 위치, 상태/경보, 협업 간섭 로깅',
        ],
        notes: JSON.stringify({
          목표: '2대 이상 협업, 충돌 방지, 스케줄링',
          합격판정:
            '다중 로봇 동시 작업 충돌 무발생, 업무 인수인계 정상, 스케줄 준수, 관제 알림 정상',
          책임기관: {
            비아: '스케줄러/권한/대시보드/보고서',
            '에이지·대동·메타파머스·KIRO/NAAS': '각 모듈 정상 연동',
          },
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '7. 예외상황·안전·복구',
        description:
          '행동트리 기반 예외 대응 및 안전 운용 검증(장애물 감지, 경로 차단, 비정상 배치, 작물 손상 감지 등).',
        steps: [
          '장애물(작업자/수확상자/벌통 등) 출현 → 정지/회피',
          '경로 차단 → 대체 경로 생성을 통한 재개',
          '엔드이펙터 실패(파지 실패/절단 불가) → 재시도/작업 스킵/알림',
          'LPS/센서 오류 → 안전 정지/복구 루틴',
          '이벤트 로그·리포트 생성',
        ],
        notes: JSON.stringify({
          목표: '예외 대응 및 안전 운용',
          합격판정:
            '예외 시 자동 재시도·대체 경로·안전 정지·복구 로직 정상 동작, 이벤트 로그·리포트 생성',
          책임기관: {
            메타파머스: '행동트리·제어',
            '대동/에이지': '주행 안전',
            비아: '알림/로그',
          },
        }),
        test_location: '상주 스마트팜 혁신밸리',
      },
      {
        name: '8. 사용자 시나리오·UI/UX·OTA',
        description:
          '사용자 친화 UI/UX로 모니터링/제어/스케줄링/리포트를 운용하고, OTA 업데이트로 현장 피드백 반영.',
        steps: [
          '페르소나(제조사/운영자/사용자)별 플로우 점검(대시보드, 미션 설정, 경로 최적화, 알림)',
          '주간/월간 보고서 자동 생성 시험',
          'OTA/버전 롤백 UI 시연: 업데이트 진행/상태/히스토리/복구',
        ],
        notes: JSON.stringify({
          목표: 'UI/UX 운용 및 OTA 업데이트',
          합격판정: '역할별 화면 완결, 리포트 출력 정상, OTA·롤백 무중단 적용',
          책임기관: {
            비아: '전담, 타 기관 시스템과 API 연동 검증',
          },
        }),
        test_location: '관제센터 (비아)',
      },
      {
        name: '9. 경제성 분석 실증',
        description:
          '1ha·로봇 2대 구성에서 초기/운영비·노동 대체 효과 산출, ROI ~ 3.7년(예시 수치) 검증.',
        steps: [
          '실증 기간 동안 작업 속도/성공률/에너지 소비 실측 → 노동 대체 효과 환산',
          '유지보수/에너지 비용 집계 → 연간 운영비 산출',
          'SaaS 보고서로 월간 성과 요약',
          '경제성 분석 리포트 생성: 속도, 성공률, 손상률, 에너지, 연 운용비, 대체 인건비 추정, ROI 계산',
        ],
        notes: JSON.stringify({
          목표: 'ROI 3.7년 검증 및 경제성 분석',
          합격판정: '속도·성공률·손상률·에너지·ROI 계산 완료',
          책임기관: {
            메타파머스: '경제성 분석 주관',
            비아: '데이터 수집·리포트',
          },
          산출물: '경제성 분석 리포트 (ROI, 초기 투자 1.6억원, 연 운영 310만원, 연 이익 4,226만원)',
        }),
        test_location: '국립농업과학원 스마트온실',
      },
    ]

    let count = 0
    for (const scenario of scenarios) {
      const locationId = this.testLocationIds.get(scenario.test_location)
      await query(
        `INSERT INTO rd_dev_verification_scenarios 
         (project_id, scenario_name, scenario_description, scenario_steps, 
          test_location_id, status, test_results)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          PROJECT_ID,
          scenario.name,
          scenario.description,
          JSON.stringify(scenario.steps),
          locationId,
          '계획',
          scenario.notes,
        ],
      )
      count++
    }

    logger.info(`Added ${count} verification scenarios`)
    return count
  }

  /**
   * 연차별 검증 이벤트 추가
   */
  private async addCalendarEvents(): Promise<number> {
    const events = [
      {
        type: '검증시나리오',
        title: '2025년 요소 기술 단위 검증',
        description:
          'AI 인식·3D 지도·엔드이펙터 설계·플랫폼/충전 설계·SaaS 아키텍처 모듈 시험/시뮬레이터 평가',
        date: '2025-12-01',
      },
      {
        type: '검증시나리오',
        title: '2026년 통합 시제품 검증',
        description:
          'E2E 통합, 2대 이상 협업 + 관제 → 상주/NAAS 현장 예비 실증, 적심 정확도/손상률 측정, 자동충전 연속 사이클 시험',
        date: '2026-11-01',
      },
      {
        type: '검증시나리오',
        title: '2027년 현장 실증·최적화',
        description:
          '상주·NAAS 본 실증: 성공률/손상률/속도/안정성/연속운전, 예외대응, 보고서 자동화, OTA 적용, 경제성 분석 리포트',
        date: '2027-09-01',
      },
    ]

    let count = 0
    for (const event of events) {
      await query(
        `INSERT INTO rd_dev_calendar_events 
         (project_id, event_type, event_title, event_description, event_date, all_day, reminder_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [PROJECT_ID, event.type, event.title, event.description, event.date, true, 14],
      )
      count++
    }

    logger.info(`Added ${count} calendar events`)
    return count
  }

  /**
   * 전체 업데이트 실행
   */
  async update(): Promise<UpdateResult> {
    try {
      logger.info('Starting Smart Farm Robot project data update...')
      logger.info(`Target project ID: ${PROJECT_ID}`)

      const loaded = await this.loadExistingData()
      if (!loaded) {
        return {
          success: false,
          counts: { testLocations: 0, kpis: 0, scenarios: 0, calendarEvents: 0 },
          error: 'Failed to load existing data',
        }
      }

      const testLocations = await this.addTestLocations()
      const kpis = await this.addKpis()
      const scenarios = await this.addVerificationScenarios()
      const calendarEvents = await this.addCalendarEvents()

      logger.info('Smart Farm Robot project data update completed successfully')

      return {
        success: true,
        counts: {
          testLocations,
          kpis,
          scenarios,
          calendarEvents,
        },
      }
    } catch (error) {
      logger.error('Update failed:', error)
      return {
        success: false,
        counts: { testLocations: 0, kpis: 0, scenarios: 0, calendarEvents: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// CLI 실행
async function main() {
  const updater = new SmartFarmScenarioUpdater()

  try {
    const result = await updater.update()
    console.log('\n=== Smart Farm Robot Update Results ===')
    console.log('Success:', result.success)
    if (result.success) {
      console.log('Counts:', result.counts)
      console.log(`
Total added:
- Test Locations: ${result.counts.testLocations}
- KPIs: ${result.counts.kpis}
- Verification Scenarios: ${result.counts.scenarios}
- Calendar Events: ${result.counts.calendarEvents}

Project URL: http://localhost:5173/rd-development/projects/${PROJECT_ID}
      `)
    } else {
      console.error('Error:', result.error)
    }
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('Update failed:', error)
    process.exit(1)
  }
}

// ES module에서 main 실행
main()

export { SmartFarmScenarioUpdater }
