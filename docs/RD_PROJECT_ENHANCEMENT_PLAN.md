# R&D 프로젝트 관리 시스템 고도화 계획

## 📋 목표

작업자 추종형 AMR 프로젝트의 방대한 정보를 시스템에 반영하여:

- **한눈에 전체 사업의 일정 이해** 가능
- **각 단계가 제대로 이루어지고 있는지** 실시간 추적
- **산출물 완료 여부** 명확한 관리
- **추후 캘린더 통합** 준비
- **큰 그림을 보면서 개발** 진행 가능

---

## 🎯 Phase 1: 데이터베이스 스키마 확장 (우선순위: 높음)

### 1.1 KPI/검증 지표 관리

**새 테이블: `rd_dev_kpis`**

```sql
- project_id: 프로젝트 참조
- phase_id: 단계 참조 (nullable)
- kpi_category: enum('주행성능', '정밀도', '안전성', '전력효율', '인식성능', '운영성능')
- kpi_name: varchar(200) -- 예: "온수파이프 주행속도"
- target_value: varchar(100) -- "1.45 m/s"
- current_value: varchar(100)
- unit: varchar(50)
- measurement_date: date
- status: enum('목표달성', '진행중', '지연', '미측정')
- verification_method: text
- notes: text
```

### 1.2 산출물 의존성 관리

**새 테이블: `rd_dev_deliverable_dependencies`**

```sql
- id: uuid
- source_deliverable_id: 산출물 A
- target_deliverable_id: 산출물 B (A에 의존)
- dependency_type: enum('선행조건', '입력데이터', '통합대상', '검증필요')
- description: text
- is_blocking: boolean
```

### 1.3 검증 시나리오 관리

**새 테이블: `rd_dev_verification_scenarios`**

```sql
- project_id: 프로젝트 참조
- scenario_name: varchar(200)
- scenario_description: text
- scenario_steps: jsonb -- 단계별 절차
- related_deliverables: uuid[] -- 관련 산출물 배열
- related_kpis: uuid[] -- 관련 KPI 배열
- test_location: varchar(200) -- "부여 스마트팜"
- test_date: date
- status: enum('계획', '준비중', '진행중', '완료', '실패')
- test_results: jsonb
```

### 1.4 시연/실증 장소 관리

**새 테이블: `rd_dev_test_locations`**

```sql
- project_id: 프로젝트 참조
- location_name: varchar(200) -- "충남 부여시 토마토/오이 스마트팜"
- location_type: enum('온실', '선별장', '트럭현장', '관제센터', '공인시험')
- address: text
- facility_details: jsonb -- {면적, 작물, 설비 등}
- available_from: date
- available_to: date
- contact_info: jsonb
```

### 1.5 모듈·책임 매트릭스

**새 테이블: `rd_dev_module_responsibilities`**

```sql
- project_id: 프로젝트 참조
- module_category: varchar(100) -- "자율주행", "경로/레일", "안전"
- module_name: varchar(200)
- primary_institution_id: 참여기관 참조
- supporting_institutions: uuid[] -- 협업 기관
- deliverable_ids: uuid[] -- 관련 산출물
- performance_level: varchar(200) -- "진입 정확도 100%, 20s"
- integration_points: jsonb
```

### 1.6 사업화 마일스톤

**새 테이블: `rd_dev_commercialization`**

```sql
- project_id: 프로젝트 참조
- milestone_type: enum('경제성분석', 'BM개발', '시범운용', '인증획득', '양산준비', '영업홍보')
- milestone_name: varchar(200)
- target_date: date
- completion_date: date
- status: enum('계획', '진행중', '완료', '지연')
- deliverables: jsonb
- business_impact: text
```

### 1.7 캘린더 이벤트 통합

**새 테이블: `rd_dev_calendar_events`**

```sql
- project_id: 프로젝트 참조
- event_type: enum('마일스톤', '산출물마감', '검증시나리오', '실증', '회의', '보고')
- event_title: varchar(300)
- event_date: date
- event_time: time (nullable)
- end_date: date (nullable)
- related_entity_type: varchar(50) -- 'deliverable', 'kpi', 'scenario'
- related_entity_id: uuid
- location_id: uuid (nullable)
- participants: jsonb
- reminder_days: integer
```

### 1.8 진행 상황 추적 및 리스크

**새 테이블: `rd_dev_progress_tracking`**

```sql
- project_id: 프로젝트 참조
- tracking_date: date
- phase_id: uuid
- overall_progress: integer (0-100)
- deliverables_on_track: integer
- deliverables_delayed: integer
- kpis_achieved: integer
- kpis_pending: integer
- risks: jsonb -- [{risk, severity, mitigation}]
- achievements: jsonb
- next_quarter_focus: jsonb
```

---

## 🎨 Phase 2: UI/UX 컴포넌트 개발 (우선순위: 높음)

### 2.1 통합 대시보드 (`RdDevProjectDashboard.svelte`)

**기능:**

- 프로젝트 전체 진행률 (단계별, 산출물별, KPI별)
- 현재 분기 하이라이트
- 지연 위험 알림
- 다가오는 마일스톤 (7일, 30일)
- 기관별 진행 상황

### 2.2 마일스톤 총괄 로드맵 (`RdDevMasterRoadmap.svelte`)

**기능:**

- 2025.04 ~ 2027.12 전체 타임라인
- 단계별 색상 구분
- 분기별 주요 활동 표시
- 산출물 완료 상태 표시
- 의존성 연결선 시각화
- 현재 시점 표시
- 확대/축소, 스크롤

### 2.3 산출물 의존성 다이어그램 (`RdDevDependencyGraph.svelte`)

**기능:**

- 산출물 간 의존성 그래프 (D3.js 또는 Cytoscape.js)
- 기관별 색상 구분
- 완료/진행/계획 상태 표시
- 크리티컬 패스 하이라이트
- 클릭 시 상세 정보

### 2.4 KPI 트래커 (`RdDevKpiTracker.svelte`)

**기능:**

- 카테고리별 KPI 목록
- 목표 vs 현재값 비교 차트
- 달성률 진행 바
- 측정 이력 그래프
- 검증 방법 및 일정

### 2.5 검증 시나리오 관리 (`RdDevVerificationScenarios.svelte`)

**기능:**

- 시나리오 목록 및 상태
- 시나리오별 단계 체크리스트
- 관련 산출물/KPI 연결
- 테스트 결과 기록
- 사진/동영상 첨부

### 2.6 기관별 역할 뷰 (`RdDevInstitutionRoles.svelte`)

**기능:**

- 기관별 담당 모듈/산출물
- 분기별 활동 계획
- 진행 상황 및 이슈
- 협업 관계 시각화

### 2.7 분기별 체크리스트 (`RdDevQuarterlyChecklist.svelte`)

**기능:**

- 현재 분기 할 일 목록
- 완료/진행/위험 상태
- 담당 기관 표시
- 체크 시 자동 업데이트
- 다음 분기 미리보기

### 2.8 사업화 트래커 (`RdDevCommercializationTracker.svelte`)

**기능:**

- 사업화 마일스톤 로드맵
- 경제성 분석 결과
- BM 개발 진행
- 시범운용 현황
- 인증 획득 추적
- 양산/보급 준비

### 2.9 캘린더 통합 뷰 (`RdDevCalendarView.svelte`)

**기능:**

- 월/주/일 뷰
- 마일스톤, 산출물 마감, 실증 일정 통합
- 색상 구분 (유형별)
- 드래그 앤 드롭 일정 조정
- 알림 설정
- Google Calendar, Outlook 연동 준비

---

## 🔧 Phase 3: 서비스 레이어 확장 (우선순위: 중)

### 3.1 새 서비스 클래스

- `RdDevKpiService`
- `RdDevDependencyService`
- `RdDevVerificationScenarioService`
- `RdDevTestLocationService`
- `RdDevModuleResponsibilityService`
- `RdDevCommercializationService`
- `RdDevCalendarEventService`
- `RdDevProgressTrackingService`

### 3.2 확장 서비스 메서드

**RdDevProjectService:**

- `getProjectOverview()` - 전체 현황 요약
- `getProgressReport()` - 진행 보고서
- `getRiskAnalysis()` - 리스크 분석
- `getDependencyChain()` - 의존성 체인

**RdDevTimelineService:**

- `getMasterRoadmap()` - 전체 로드맵
- `getQuarterlyActivities()` - 분기별 활동
- `getCriticalPath()` - 크리티컬 패스

---

## 📊 Phase 4: 데이터 마이그레이션 및 시드 (우선순위: 높음)

### 4.1 마이그레이션 스크립트

`migrations/039_add_rd_enhancement_tables.sql`

- 위에서 정의한 모든 테이블 생성
- 인덱스, 외래키, 제약조건 추가

### 4.2 시드 데이터 스크립트

`scripts/seed-worker-follow-amr-project.ts`

- 작업자 추종형 AMR 프로젝트 전체 데이터
- 3단계 6차년도 모든 산출물
- 분기별 마일스톤 (2025 Q2 ~ 2027 Q4)
- 5개 기관 역할 및 모듈
- KPI 지표 (10+ 항목)
- 검증 시나리오 (4개)
- 의존성 관계 (30+ 연결)

---

## 🚀 Phase 5: API 엔드포인트 개발 (우선순위: 중)

### 5.1 RESTful API

```
GET  /api/rd-development/projects/:id/dashboard
GET  /api/rd-development/projects/:id/master-roadmap
GET  /api/rd-development/projects/:id/dependency-graph
GET  /api/rd-development/projects/:id/kpis
POST /api/rd-development/projects/:id/kpis
PUT  /api/rd-development/kpis/:id
GET  /api/rd-development/projects/:id/verification-scenarios
POST /api/rd-development/projects/:id/verification-scenarios
GET  /api/rd-development/projects/:id/calendar-events
GET  /api/rd-development/projects/:id/progress-report
POST /api/rd-development/deliverables/:id/dependencies
```

---

## 📱 Phase 6: 모바일 최적화 (우선순위: 낮음)

### 6.1 반응형 디자인

- 대시보드 모바일 레이아웃
- 터치 제스처 지원
- 간소화된 차트

### 6.2 Progressive Web App (PWA)

- 오프라인 지원
- 푸시 알림 (마일스톤 마감 임박)

---

## 🔔 Phase 7: 알림 및 자동화 (우선순위: 중)

### 7.1 자동 알림

- 산출물 마감 7일 전
- KPI 측정 일정
- 검증 시나리오 예정
- 분기 종료 리마인더

### 7.2 자동 보고서 생성

- 주간 진행 보고서
- 월간 성과 리포트
- 분기별 종합 보고서
- 연간 성과 보고서

---

## 📈 Phase 8: 분석 및 인사이트 (우선순위: 낮음)

### 8.1 분석 기능

- 진행률 트렌드 분석
- 기관별 성과 비교
- 산출물 지연 패턴 분석
- KPI 달성률 예측

### 8.2 AI 인사이트

- 리스크 예측
- 일정 최적화 제안
- 리소스 배분 추천

---

## 🎯 우선순위별 실행 계획

### Sprint 1 (Week 1-2): 기초 인프라

1. ✅ 데이터베이스 스키마 설계 완료
2. 마이그레이션 스크립트 작성 및 실행
3. 기본 서비스 클래스 구현
4. API 엔드포인트 기본 틀

### Sprint 2 (Week 3-4): 핵심 UI

1. 통합 대시보드 구현
2. 마스터 로드맵 구현
3. KPI 트래커 구현
4. 산출물 테이블 고도화

### Sprint 3 (Week 5-6): 고급 기능

1. 의존성 그래프 구현
2. 검증 시나리오 관리
3. 분기별 체크리스트
4. 기관별 역할 뷰

### Sprint 4 (Week 7-8): 통합 및 최적화

1. 캘린더 통합
2. 사업화 트래커
3. 알림 시스템
4. 성능 최적화

### Sprint 5 (Week 9-10): 데이터 입력 및 검증

1. 전체 프로젝트 데이터 입력
2. 의존성 관계 설정
3. 시나리오 및 KPI 입력
4. 사용자 테스트 및 피드백

---

## 📋 성공 지표

### 정량적 지표

- [ ] 100+ 산출물 추적
- [ ] 30+ KPI 관리
- [ ] 10개 분기 로드맵
- [ ] 5개 기관 역할 명확화
- [ ] 4개 검증 시나리오 관리
- [ ] 캘린더 이벤트 통합

### 정성적 지표

- [ ] 한눈에 전체 프로젝트 파악 가능
- [ ] 진행 상황 실시간 추적
- [ ] 의존성 명확한 시각화
- [ ] 리스크 조기 발견
- [ ] 큰 그림 기반 개발 의사결정

---

## 🛠 기술 스택

### Frontend

- Svelte 5 (Runes)
- D3.js or Cytoscape.js (그래프)
- Chart.js (차트)
- FullCalendar (캘린더)

### Backend

- SvelteKit
- PostgreSQL
- TypeScript

### 라이브러리

- date-fns (날짜 처리)
- zod (유효성 검사)
- lucide-svelte (아이콘)

---

## 📝 다음 단계

1. **이 계획서 검토 및 승인**
2. **Sprint 1 시작: 데이터베이스 마이그레이션**
3. **시드 데이터 준비 (작업자 추종형 AMR 전체 정보)**
4. **프로토타입 UI 개발**
5. **점진적 기능 추가 및 피드백**

---

## 💬 고려사항

### 확장성

- 다른 R&D 프로젝트에도 적용 가능한 범용 구조
- 스마트팜 멀티로봇 프로젝트 추가 용이

### 통합

- 기존 캘린더 시스템과 통합
- 기존 알림 시스템 활용
- RBAC 권한 체계 연동

### 성능

- 대량 데이터 처리 최적화
- 그래프 렌더링 성능
- 실시간 업데이트 (WebSocket 고려)

---

**작성일:** 2025-10-18  
**버전:** 1.0  
**상태:** 검토 대기
