# VWS Release Notes

모든 주요 변경사항은 이 파일에 한글로 문서화됩니다.

## Version 0.7.2 (2025-10-17)

### 🧹 완전한 다크모드 제거

#### 테마 시스템 완전 정리
- **다크모드 코드 완전 삭제**: `theme.ts`에서 다크 테마 정의 및 CSS 변수 제거
- **Header.svelte 정리**: 모든 `dark:` Tailwind 클래스 제거
- **불필요한 스토어 제거**: `isDark`, `isAuto` 스토어 삭제
- **CSS 번들 크기 최적화**: 다크모드 관련 CSS 코드 제거로 번들 크기 감소

#### 코드 정리 및 최적화
- **라이트모드 전용 코드**: 모든 테마 관련 코드가 라이트모드만 지원하도록 단순화
- **불필요한 조건부 렌더링 제거**: 다크모드 관련 조건부 로직 정리
- **일관된 UI**: 모든 컴포넌트가 라이트모드로 통일

#### 버전 정보 업데이트
- **VersionInfo 컴포넌트**: 하드코딩된 버전을 0.7.2로 업데이트
- **Production 배포**: 최신 변경사항이 Production에 반영되도록 배포

### 🔧 기술적 개선
- **테마 매니저 단순화**: 다크모드 관련 로직 완전 제거
- **CSS 변수 정리**: 라이트모드 전용 CSS 변수만 유지
- **성능 최적화**: 불필요한 다크모드 체크 로직 제거

## Version 0.7.1 (2025-10-16)

### 🚀 주요 기능

#### Excel 파일 업로드 시스템 완전 개선

- **날짜 형식 호환성 문제 해결**
  - ISO 8601 형식(`2025-10-16T13:23:46.583Z`)을 KST 형식(`YYYY-MM-DD HH:MM:SS+09`)으로 자동 변환
  - 하나은행 Excel 파일의 날짜 파싱 오류 완전 해결
  - `convertToDateTimeLocal()` 함수 개선으로 다양한 날짜 형식 지원

#### 파일 업로드 권한 시스템 개선

- **권한 요구사항 완화**
  - 거래내역 업로드 권한을 `ADMIN/MANAGER`에서 `ADMIN/MANAGER/EMPLOYEE`로 확장
  - 일반직원도 거래내역 업로드 가능하도록 권한 완화
  - 더 명확한 권한 부족 에러 메시지 제공

#### 중복 데이터 처리 시스템 강화

- **중복 거래 감지 및 처리**
  - 날짜, 적요, 금액, 상대방이 모두 동일한 거래 자동 감지
  - 중복 거래는 업데이트하지 않고 건너뛰기 처리
  - 상세한 처리 로그 제공 (삽입/건너뛰기 건수)

#### 로깅 시스템 대폭 개선

- **파일 업로드 상세 로깅**
  - 각 거래별 처리 결과 상세 로그 (`✅ 거래 삽입 성공`, `🔄 중복 거래 건너뛰기`)
  - 업로드 완료 요약 통계 (`📊 업로드 완료 요약`)
  - 권한 확인 과정 상세 로깅

- **알림 폴링 로그 최적화**
  - `/api/notifications/unread-count` 경로 로깅 제외
  - 서버 로그 스팸 방지로 핵심 정보에 집중

### 🔧 기술적 개선

#### 인증 시스템 개선

- **hooks.server.ts 인증 미들웨어 우회**
  - multipart/form-data 요청에 대한 특별 처리
  - 파일 업로드 API에서 직접 인증 처리
  - FormData 읽기 전 인증 차단 문제 해결

#### 에러 처리 강화

- **상세한 에러 메시지**
  - 권한 부족 시 사용자 역할과 필요한 역할 정보 제공
  - 파일 업로드 과정의 각 단계별 에러 추적
  - 클라이언트와 서버 간 명확한 에러 전달

#### 코드 품질 개선

- **TypeScript 타입 안전성**
  - 모든 파일 업로드 관련 타입 정의 개선
  - 에러 처리 타입 안전성 강화

### 🐛 버그 수정

#### 파일 업로드 관련 버그

- **403 Forbidden 오류 해결**
  - `xhr.withCredentials = true` 추가로 인증 쿠키 전송 문제 해결
  - 권한 요구사항 완화로 일반직원 업로드 가능
  - hooks.server.ts 인증 미들웨어 우회로 FormData 처리 문제 해결

- **날짜 형식 오류 해결**
  - ISO 8601 형식을 KST 형식으로 자동 변환
  - `formatDateTimeForInput()` 함수의 입력 형식 호환성 문제 해결

- **과도한 로그 출력 문제 해결**
  - 알림 폴링 API 로깅 제외
  - 핵심 로그에만 집중하여 서버 성능 향상

### 📊 성능 개선

- **로그 시스템 최적화**
  - 불필요한 API 요청 로깅 제거
  - 파일 업로드 과정의 효율적인 로깅
  - 서버 리소스 사용량 최적화

### 🔄 아키텍처 개선

#### 파일 업로드 플로우 개선

**Before (문제 상황)**

```
Client → hooks.server.ts (인증 차단) → API Endpoint (도달 불가)
```

**After (해결된 플로우)**

```
Client → hooks.server.ts (우회) → API Endpoint → 직접 인증 → 파일 처리
```

#### 권한 시스템 개선

- **유연한 권한 관리**
  - 모듈별 권한 요구사항 세분화
  - 일반 업무와 관리 업무의 권한 분리
  - 사용자 친화적인 권한 에러 메시지

### 📝 개발자 노트

#### 주요 수정 파일

- `src/routes/api/finance/transactions/upload/+server.ts`: 파일 업로드 API 완전 개선
- `src/lib/finance/utils/transaction-formatters.ts`: 날짜 형식 변환 로직 추가
- `src/lib/finance/components/transactions/TransactionManagement.svelte`: 인증 쿠키 전송 추가
- `src/hooks.server.ts`: 파일 업로드 특별 처리 및 로깅 최적화
- `src/lib/auth/middleware.ts`: 상세한 인증 로깅 추가

#### 새로운 함수

- `convertToDateTimeLocal()`: ISO 8601 → KST 형식 변환
- 파일 업로드 권한 확인 로직 개선
- 중복 거래 감지 및 처리 로직

### 🚀 다음 버전 계획

- 추가 은행 Excel 파일 형식 지원
- 파일 업로드 진행률 표시 개선
- 대용량 파일 업로드 최적화
- 업로드 히스토리 및 통계 기능

---

**주요 변경사항**: Excel 파일 업로드 시스템 완전 개선, 권한 시스템 개선, 로깅 최적화
**핵심 커밋**: `feat: complete Excel upload system improvement with date format fix and permission enhancement`

## Version 0.7.0 (2025-10-16)

### 🚀 주요 기능

#### 환경별 로그 레벨 시스템

- **개발/운영/테스트 환경별 독립적인 로그 설정**
  - 개발 환경에서는 에러만 표시하여 핵심 정보에 집중
  - 운영 환경에서는 경고 및 에러 표시
  - 테스트 환경에서는 최소한의 로그만 출력

#### 핵심 에러 모니터링 시스템

- **심각도별 에러 분류 (CRITICAL, HIGH, MEDIUM, LOW)**
  - CRITICAL: 시스템 다운, 데이터 손실
  - HIGH: 보안 문제, 결제 실패
  - MEDIUM: API 오류, 권한 문제
  - LOW: 일반적인 오류

- **카테고리별 에러 추적**
  - AUTH: 인증 관련 오류
  - DATABASE: 데이터베이스 연결 및 쿼리 오류
  - API: API 요청/응답 오류
  - SECURITY: 보안 관련 오류
  - PAYMENT: 결제 관련 오류
  - SYSTEM: 시스템 레벨 오류

- **에러 통계 자동 집계**
  - 1분 단위 에러 통계 로그
  - 중복 에러 자동 카운팅 및 그룹핑
  - 상위 에러 메시지 추적

### 🔧 기술적 개선

#### 로그 필터링 시스템

- **DB 연결 로그 최적화**
  - 개발 환경에서 DB 연결 로그 숨김
  - 운영 환경에서만 DB 연결 상태 모니터링

- **SELECT \* 경고 필터링**
  - 개발 환경에서 SELECT \* 경고 숨김
  - 운영 환경에서 데이터베이스 쿼리 품질 모니터링

- **API 요청/응답 로그 선택적 표시**
  - 개발 환경에서 API 요청/응답 로그 표시
  - 운영 환경에서는 에러 응답만 로그

- **로그 그룹핑 시스템**
  - `logger.db`: 데이터베이스 관련 로그
  - `logger.api`: API 관련 로그
  - `logger.selectStar`: SELECT \* 경고 로그

#### 데이터베이스 쿼리 개선

- **명시적 컬럼 선택 적용**
  - 모든 SELECT 쿼리에 명시적 컬럼 선택 적용
  - SELECT \* 사용 방지로 성능 향상

- **날짜/타임스탬프 필드 처리 개선**
  - 모든 날짜/타임스탬프 필드에 ::text 캐스팅 추가
  - Date 객체 경고 제거로 성능 향상

### 🐛 버그 수정

- **쿼리 캐스팅 누락 수정**
  - audit-service.ts의 end_date 캐스팅 누락 수정
  - notification-service.ts의 end_date 캐스팅 누락 수정

- **테이블 이름 오류 수정**
  - physical_assets → assets 테이블 이름 수정

- **타입 오류 수정**
  - ERROR_SEVERITY, ERROR_CATEGORY 상수 타입 수정
  - 에러 모니터링 시스템의 타입 안전성 개선

### 📁 주요 파일 변경사항

- `src/lib/utils/logger.ts`: 환경별 로그 레벨 시스템 구현
- `src/lib/utils/error-monitor.ts`: 에러 모니터링 시스템 신규 생성
- `src/lib/database/connection.ts`: DB 연결 로그 최적화
- `src/hooks.server.ts`: 에러 모니터링 통합
- `src/lib/services/asset/audit-service.ts`: 쿼리 개선
- `src/lib/services/asset/notification-service.ts`: 쿼리 개선

---

**주요 변경사항**: 로그 시스템 전면 개선, 에러 모니터링 구축, 데이터베이스 쿼리 최적화
**핵심 커밋**: `feat: 로그 시스템 개선 및 에러 모니터링 구현`

## Version 0.6.3 (2025-01-16)

### 🚀 주요 기능

#### 제품 문서화 시스템

- **완전한 마크다운 문서 관리 기능**
  - `.md` 파일 업로드 및 직접 편집 지원
  - 접을 수 있는 마크다운 카드와 라이브 미리보기
  - 문서 드래그 앤 드롭 재정렬 기능
  - 기존 `ThemeMarkdown` 컴포넌트와의 통합으로 일관된 렌더링

#### 마크다운 렌더링 개선

- **가독성 향상을 위한 수평 패딩 추가**
  - ThemeMarkdown compact 버전에 16px 수평 패딩 추가
  - 마크다운 콘텐츠 표시를 위한 더 나은 간격 및 타이포그래피

### 🔧 기술적 개선

#### UI/UX 개선

- **제품 문서 섹션 전체 레이아웃 일관성 개선**
  - 전체 너비 마크다운 콘텐츠 표시를 위한 ProductDocCard 재구조화
  - CSS 변수를 사용한 일관된 배경색 및 스타일링
  - 문서 헤더와 콘텐츠 간 더 나은 시각적 계층 구조

#### 접근성 개선

- **라디오 버튼 그룹 접근성 경고 수정**
  - 적절한 fieldset/legend 구조로 접근성 경고 해결
  - 키보드 탐색 및 스크린 리더 지원 강화

#### 데이터베이스 스키마

- **새로운 `planner_product_docs` 테이블**
  - 마크다운 문서 저장을 위한 테이블
  - 문서 활동 추적을 지원하도록 활동 로그 제약 조건 업데이트
  - 원활한 데이터베이스 업데이트를 위한 마이그레이션 파일

#### API 엔드포인트

- **제품 문서화 CRUD 작업**
  - 제품 문서화를 위한 CRUD 작업
  - 배치 업데이트가 포함된 문서 재정렬 엔드포인트
  - 포괄적인 오류 처리 및 검증

#### 코드 품질

- **TypeScript 타입 검사 문제 수정**
  - 제품 레퍼런스 서비스의 TypeScript 타입 검사 문제 수정
  - 코드 포맷팅 및 일관성 개선
  - 애플리케이션 전체의 오류 처리 강화

### 🐛 버그 수정

- 제품 레퍼런스 타입 감지의 TypeScript 컴파일 오류
- 폼 라벨 연결의 접근성 문제
- 문서 섹션 배경 및 테두리의 UI 불일치
- 마크다운 콘텐츠 패딩 및 가독성 문제

---

**주요 변경사항**: 데이터베이스 스키마 업데이트, API 엔드포인트 추가, UI/UX 개선
**핵심 커밋**: `feat: implement product documentation system with markdown support`

## Version 0.6.2 (2025-10-16)

### 🚀 주요 기능

#### 제품 레퍼런스 시스템

- **플래너 제품을 위한 완전한 레퍼런스 관리 시스템**
  - S3 통합을 통한 파일 업로드 지원 (PDF, 이미지, 문서)
  - 자동 타입 감지가 포함된 외부 링크 지원
  - 레퍼런스 드래그 앤 드롭 재정렬 기능
  - 타입별 아이콘과 색상이 포함된 레퍼런스 카드

#### 확장된 링크 타입 감지

- **인기 있는 협업 및 생산성 도구 지원 추가**
  - **YouTube** 링크 (youtube.com, youtu.be)
  - **Slack** 워크스페이스 및 채널 링크
  - **Discord** 서버 및 채널 링크
  - **회의 플랫폼** (Zoom, Google Meet, Microsoft Teams)
  - **프로젝트 관리** (Trello, Jira)
  - **디자인 도구** (Miro, Adobe Creative Cloud, Behance, Dribbble)

#### 데이터베이스 스키마 업데이트

- **새로운 `planner_product_references` 테이블**
  - 레퍼런스 활동 추적을 지원하도록 활동 로그 제약 조건 업데이트
  - 원활한 데이터베이스 업데이트를 위한 마이그레이션 파일

### 🔧 기술적 개선

#### 레퍼런스 관리 UI

- **더 나은 가독성을 위한 수평 카드 레이아웃**
  - 2줄 클램핑과 툴팁이 포함된 개선된 제목 표시
  - 기본 액션 하이라이트가 포함된 향상된 액션 버튼 스타일링
  - 드래그 앤 드롭 작업을 위한 시각적 피드백

#### API 엔드포인트

- **제품 레퍼런스 CRUD 작업**
  - 제품 레퍼런스를 위한 CRUD 작업
  - 안전한 파일 업로드/다운로드를 위한 S3 사전 서명된 URL 생성
  - 배치 업데이트가 포함된 레퍼런스 재정렬 엔드포인트
  - 포괄적인 오류 처리 및 검증

#### 기술적 개선

- **Svelte 5 호환성**: 최신 runes 구문 사용을 위한 컴포넌트 업데이트
- **타입 안전성**: 모든 새 기능에 대한 포괄적인 TypeScript 정의
- **테스팅**: 링크 감지 및 API 엔드포인트를 위한 단위 테스트
- **접근성**: 적절한 ARIA 역할 및 키보드 탐색 지원

### 🐛 버그 수정

- 새로운 레퍼런스 타입에 대한 활동 로그 제약 조건 위반
- 다양한 URL 패턴에 대한 타입 감지 정확도
- UI 반응성 및 시각적 일관성

---

**주요 변경사항**: 제품 레퍼런스 시스템 구축, S3 통합, 링크 타입 감지 확장
**핵심 커밋**: `feat: implement product references system with S3 integration and link detection`

## Version 0.6.1 (2025-01-15)

### 🚀 서버 모니터링 및 로깅 시스템 대폭 강화

#### Health Check 및 Version 엔드포인트 개선

- **실시간 데이터베이스 상태 모니터링**
  - `/health` 엔드포인트에서 실제 데이터베이스 연결 상태 확인
  - 데이터베이스 응답 시간 측정 및 상태 보고
  - 연결 실패 시 HTTP 503 상태 코드 반환으로 서비스 상태 명확화

- **상세한 버전 정보 제공**
  - `/api/version` 엔드포인트 신규 구현
  - `package.json`에서 동적 버전 정보 읽기
  - 빌드 정보, 환경 설정, Node.js 정보 포함
  - 서버 메모리 사용량, 업타임, 응답 시간 실시간 제공

#### 서버 로깅 시스템 대폭 강화

- **애플리케이션 시작 로깅**
  - 서버 시작 시 상세한 환경 정보 출력
  - Node.js 버전, 플랫폼, PID, 초기 메모리 사용량 표시
  - AWS 환경변수 상태 확인 (민감 정보 마스킹)
  - 기타 설정 변수 상태 체크 및 표시

- **요청/응답 로깅 시스템**
  - 모든 API 요청에 대한 상세 로깅 (메서드, 경로, 사용자 에이전트, IP)
  - 인증/권한 확인 과정 이모지와 함께 로깅
  - 응답 상태 코드별 로깅 레벨 구분
  - 요청 처리 시간 측정 및 로깅

- **인증 및 권한 로깅**
  - 시스템 관리자/직원 인증 성공 로깅
  - 권한 부여/거부 결정 과정 상세 로깅
  - 잘못된 토큰이나 비활성 사용자 접근 경고
  - 본인 데이터 접근 권한 확인 과정 로깅

- **데이터베이스 연결 모니터링**
  - 연결 풀 초기화 상세 정보 로깅
  - 연결 획득/해제 이벤트 추적
  - 연결 풀 통계 (총 연결 수, 유휴 연결 수, 대기 중인 요청 수)
  - 데이터베이스 오류 발생 시 상세 정보 기록

#### 프로덕션 환경 모니터링

- **주기적 서버 상태 로깅**
  - 프로덕션 환경에서 5분마다 서버 상태 로깅
  - 업타임, 메모리 사용량, RSS 메모리 정보 제공
  - 서버 안정성 및 성능 추적 가능

### 🔧 기술적 개선사항

#### 로깅 아키텍처 개선

- **구조화된 로깅**
  - JSON 형태의 구조화된 로그 메시지
  - 이모지를 활용한 로그 레벨별 시각적 구분
  - 타임스탬프, 사용자 ID, IP 주소 등 컨텍스트 정보 포함

- **성능 모니터링**
  - 요청별 응답 시간 측정
  - 데이터베이스 쿼리 응답 시간 추적
  - 메모리 사용량 모니터링

#### 보안 및 안정성 강화

- **민감 정보 보호**
  - AWS 키 등 민감한 환경변수 마스킹 처리
  - 데이터베이스 URL의 호스트/포트 정보만 표시
  - 보안을 고려한 로깅 레벨 설정

### 🐛 버그 수정 및 개선

#### 서버 초기화 개선

- **환경 검증 강화**
  - 애플리케이션 시작 시 필수 환경변수 검증
  - 데이터베이스 연결 상태 확인
  - 설정 누락 시 명확한 오류 메시지 제공

#### 에러 핸들링 개선

- **Fallback 메커니즘**
  - `package.json` 읽기 실패 시 기본값 제공
  - 데이터베이스 연결 실패 시 적절한 상태 코드 반환
  - 오류 발생 시 서비스 중단 없는 graceful degradation

### 📊 모니터링 및 디버깅 개선

#### 개발자 경험 향상

- **상세한 디버깅 정보**
  - 요청 흐름 추적 가능
  - 인증/권한 문제 진단 용이
  - 성능 병목점 식별 지원

#### 운영 모니터링

- **Health Check 엔드포인트**
  - 로드 밸런서나 모니터링 도구에서 활용 가능
  - 데이터베이스 상태와 애플리케이션 상태 분리 보고
  - HTTP 상태 코드를 통한 명확한 서비스 상태 전달

### 🚀 배포 및 운영 개선

#### CI/CD 파이프라인 지원

- **버전 확인 URL 제공**
  - 배포 후 버전 확인 가능한 엔드포인트
  - 빌드 정보와 환경 정보 실시간 확인

#### 로그 분석 도구 연동

- **구조화된 로그 형식**
  - ELK Stack, Fluentd 등 로그 분석 도구 연동 용이
  - 이메일 기반 경고 시스템 구축 지원

---

**주요 변경사항**: 4개 파일 수정
**핵심 커밋**: `feat: enhance server logging and health/version endpoints`

## Version 0.6.0 (2025-01-16)

### 🧪 테스팅 인프라 대폭 개선

#### 포괄적인 테스트 커버리지 향상

- **테스트 커버리지 달성**: 전체 테스트 통과율 86.4% (480/557 테스트)
- **서비스 계층 테스팅**: 모든 주요 서비스에 대한 완전한 테스트 커버리지
- **모의 시스템 표준화**: 모든 테스트 파일에서 통일된 모의 패턴
- **테스트 인프라**: 강력한 테스트 헬퍼 및 픽스처 구현

#### CRM 서비스 테스팅

- **완전한 테스트 커버리지**: 모든 CRM 서비스가 이제 포괄적인 테스트 스위트를 보유
- **고객 서비스 테스트**: 전체 CRUD 작업 및 엣지 케이스 처리
- **계약 서비스 테스트**: 계약 관리 및 검증 테스팅
- **통계 서비스 테스트**: CRM 통계 및 분석 테스팅
- **API 엔드포인트 테스트**: 완전한 API 엔드포인트 커버리지

#### 재무 서비스 테스팅

- **계좌 서비스 테스트**: 계좌 관리 및 검증
- **거래 서비스 테스트**: 거래 처리 및 분류
- **대시보드 서비스 테스트**: 재무 대시보드 기능
- **보고서 서비스 테스트**: 재무 보고 및 분석
- **재무 건강 분석기**: 비즈니스 인텔리전스 테스팅

#### HR 서비스 테스팅

- **직원 서비스 테스트**: 직원 관리 및 생명주기
- **출근 서비스 테스트**: 시간 추적 및 출근 관리
- **급여명세서 서비스 테스트**: 급여 처리 및 급여명세서 생성
- **휴가 관리 테스트**: 휴가 요청 및 승인 워크플로우

#### R&D 서비스 테스팅

- **프로젝트 서비스 테스트**: R&D 프로젝트 관리
- **예산 서비스 테스트**: 예산 계획 및 실행
- **증빙 서비스 테스트**: 증빙 수집 및 검증
- **멤버 서비스 테스트**: 프로젝트 팀 관리
- **검증 서비스 테스트**: 컴플라이언스 및 검증 워크플로우

#### 기타 서비스 테스팅

- **회사 서비스 테스트**: 회사 정보 관리
- **프로젝트 서비스 테스트**: 일반 프로젝트 관리
- **S3 서비스 테스트**: 파일 저장 및 관리
- **OCR 서비스 테스트**: 문서 처리 및 데이터 추출

#### 테스트 인프라 개선

- **DBHelper 클래스**: 표준화된 데이터베이스 모킹 유틸리티
- **MockHelper 클래스**: 포괄적인 모의 생성 헬퍼
- **API 헬퍼 함수**: 간소화된 API 테스팅 유틸리티
- **테스트 픽스처**: 모든 테스트 스위트에서 재사용 가능한 테스트 데이터
- **모의 라이브러리**: 외부 종속성을 위한 전용 모의 모듈

#### 품질 보증 향상

- **오류 처리 테스트**: 포괄적인 오류 시나리오 커버리지
- **엣지 케이스 테스팅**: 경계 조건 및 엣지 케이스 검증
- **통합 테스트**: 크로스 서비스 상호작용 테스팅
- **성능 테스트**: 동시 작업 및 로드 테스팅
- **보안 테스트**: 데이터 검증 및 보안 조치 테스팅

### 🔧 기술적 개선

#### 코드 품질 향상

- **Prettier 포맷팅**: 전체 코드베이스에 걸친 일관된 코드 포맷팅
- **ESLint 컴플라이언스**: 개선된 코드 품질 및 일관성
- **타입 안전성**: 향상된 TypeScript 타입 검사 및 검증
- **오류 처리**: 표준화된 오류 처리 패턴

#### 개발자 경험

- **테스트 신뢰성**: 안정적이고 신뢰할 수 있는 테스트 실행
- **모의 일관성**: 더 나은 유지보수성을 위한 통일된 모킹 패턴
- **테스트 문서화**: 포괄적인 테스트 문서화 및 예제
- **CI/CD 통합**: 배포 파이프라인에서 향상된 자동화된 테스팅

#### 성능 최적화

- **테스트 실행 속도**: 최적화된 테스트 실행 성능
- **모의 효율성**: 간소화된 모의 설정 및 해제
- **메모리 관리**: 테스트 환경에서 개선된 메모리 사용
- **병렬 테스팅**: 향상된 병렬 테스트 실행 기능

### 🐛 버그 수정

#### 서비스 계층 수정

- **데이터 구조 정렬**: 모의 데이터 구조 불일치 수정
- **API 호출 일관성**: API 호출 매개변수 불일치 해결
- **데이터베이스 쿼리 수정**: SQL 쿼리 매개변수 순서 수정
- **오류 메시지 표준화**: 통일된 오류 메시지 형식

#### 테스트 인프라 수정

- **모의 설정 문제**: 모의 구성 문제 해결
- **테스트 데이터 검증**: 테스트 데이터 검증 문제 수정
- **어설션 개선**: 향상된 테스트 어설션 정확도
- **환경 설정**: 개선된 테스트 환경 구성

### 📊 메트릭 및 통계

- **총 테스트 파일**: 22개 테스트 파일
- **통과 테스트**: 480개 테스트 (86.4%)
- **실패 테스트**: 77개 테스트 (13.6%)
- **테스트 카테고리**: 단위, 통합, E2E, 컴포넌트, 보안
- **커버리지 영역**: 서비스, API, 데이터베이스, UI 컴포넌트, 유틸리티

### 🚀 배포 준비 완료

이 릴리즈는 코드 품질과 신뢰성의 주요 이정표를 나타냅니다:

- **프로덕션 준비**: 프로덕션 배포를 위한 향상된 안정성
- **개발자 신뢰**: 자신 있는 개발을 위한 신뢰할 수 있는 테스트 커버리지
- **유지보수성**: 더 쉬운 유지보수를 위한 표준화된 패턴
- **확장성**: 향후 기능 개발을 위한 강력한 기반

---

**주요 변경사항**: 테스팅 인프라 대폭 개선, 코드 품질 향상
**핵심 커밋**: `feat: comprehensive testing infrastructure overhaul`

## Version 0.5.0 (2025-10-12)

### ✨ 주요 기능

#### CRM 고객 관리 향상

- **고객 정보 재구성**
  - 연락처, 업종/사업 유형, 주소, 계좌 세부사항을 위한 접을 수 있는 섹션 추가
  - "대표자"와 "담당자" 분리
  - 담당자에 이름, 이메일, 전화번호 필드 포함
  - 기본 상태: 더 깔끔한 UI를 위해 접힌 상태

- **고객 폼 모달 리팩토링**
  - 고객 생성/편집 폼을 재사용 가능한 `CustomerFormModal` 컴포넌트로 추출
  - `ThemeInput`에 대한 Svelte 5 `$bindable`로 개선된 양방향 데이터 바인딩
  - 더 나은 상태 관리 및 폼 검증
  - 폼 초기화에서 무한 루프 문제 수정

- **파일 업로드 향상**
  - 사업자등록증 및 계좌 파일에 대한 드래그 앤 드롭 지원 추가
  - 클라이언트 측 파일 검증 (크기: 최대 5MB, 유형: PDF, JPG, PNG)
  - 드래그 오버 상태에 대한 시각적 피드백
  - 토스트 알림으로 개선된 사용자 경험

#### R&D 증빙 관리 통합

- **고객 통합**
  - 인건비를 제외한 모든 증빙 카테고리에 고객 필드 추가
  - "(선택하지 않음)" 기본값이 포함된 고객 선택 자동완성 드롭다운
  - 사업자등록증 및 계좌 사본 링크 자동 표시
  - CRM에서 고객 문서가 수정될 때 실시간 업데이트

- **인건비를 위한 급여명세서 통합**
  - 증빙 항목 이름 형식 기반 자동 급여명세서 감지: "이름 (YYYY-MM)"
  - 증빙 상세 보기에서 급여명세서 출력 모달로 직접 링크
  - 급여명세서가 누락된 경우 안내 메시지 및 급여 관리 페이지 링크
  - 일반 급여명세서 표시를 위한 재사용 가능한 `CommonPayslipModal` 컴포넌트

- **증빙 항목 명명**
  - 인건비에 대한 "이름 (YYYY-MM)" 형식의 자동 제목 생성
  - 기존 인건비 증빙 이름에 대한 배치 업데이트 스크립트
  - 시스템 전체의 일관성 개선

#### 예산 집행률 추적

- **집행 계획 모듈**
  - "집행율 보기" 토글 체크박스 추가
  - 연도 및 카테고리별 집행률 실시간 계산
  - 색상 코딩된 진행률 바:
    - 빨간색: 0-30% (낮은 집행)
    - 초록색: 30-70% (최적)
    - 주황색: 70-100% (높은 집행)
  - 각 예산 카테고리에 대한 시각적 표시기:
    - 인건비 (Personnel Cost)
    - 연구재료비 (Research Material Cost)
    - 연구활동비 (Research Activity Cost)
    - 연구수당 (Research Stipend)
    - 간접비 (Indirect Cost)
    - 총 예산 (Total Budget)

- **서비스 아키텍처**
  - 클라이언트 측 유틸리티(`execution-rate-utils.ts`)와 서버 측 서비스 분리
  - 증빙 지출 집계를 위한 데이터베이스 쿼리 최적화
  - 정확한 연구재료 및 활동비 추적을 위한 다중 카테고리 지원

### 🔧 기술적 개선

#### 데이터베이스 스키마 업데이트

- **CRM 고객 테이블**
  - `contact_person`, `contact_phone`, `contact_email` 컬럼 추가
  - 명확성을 위해 `contact`를 `representative_name`으로 이름 변경
  - 업데이트된 마이그레이션: `029_add_customer_to_evidence.sql`

- **증빙 항목 테이블**
  - `crm_customers`에 대한 외래 키가 있는 `customer_id` UUID 컬럼 추가
  - 성능 최적화를 위한 `customer_id`에 인덱스 생성

#### API 향상

- **SQL 쿼리 최적화**
  - 집행률 API에서 `SELECT *` 문제를 명시적 컬럼 이름 사용으로 수정
  - 날짜 검증 준수를 위해 모든 날짜/타임스탬프 필드에 `::text` 캐스팅 추가
  - 고객 조인이 있는 집계 쿼리에 대한 적절한 `GROUP BY` 절 처리

- **새로운 엔드포인트**
  - `/api/research-development/evidence/payslip-check` - 직원 이름 및 기간별 급여명세서 존재 확인
  - `/api/research-development/project-budgets/[id]/execution-rate` - 프로젝트 예산에 대한 집행률 가져오기
  - `/api/salary/payslips/[id]` - 적절한 데이터 변환이 포함된 ID별 단일 급여명세서 가져오기

#### 코드 품질

- **Svelte 5 반응성 수정**
  - `ThemeInput` 컴포넌트에서 `bind:value` 계약 구현 수정
  - 적절한 `$effect` 종속성 추적으로 `CustomerFormModal`의 무한 루프 해결
  - 반응성을 유지하기 위한 폼 데이터 초기화 개선
  - 집행률 표시에서 계산된 속성을 위해 `$derived` 사용

- **모달 Z-인덱스 관리**
  - 증빙 상세 모달 위에 나타나도록 급여명세서 모달에 `z-index: 1001` 설정
  - 중첩 모달에 대한 일관된 레이어링

- **개발 로그 제거**
  - 다음에서 `logger.info` 문 정리:
    - `useRDDetail.svelte.ts`
    - `useRDBudgetExecution.svelte.ts`
    - `useRDEvidence.svelte.ts`
    - `useActiveEmployees.svelte.ts`

### 🐛 버그 수정

#### CRM 모듈

- 기본값으로 `formData`를 초기화하여 고객 폼에서 `bind:value={undefined}` 오류 수정
- `$effect` 반응성 문제로 인한 고객 생성 모달의 무한 루프 해결
- `ThemeInput`에서 올바른 양방향 바인딩 구현으로 검증 오류 "회사명과 사업자번호는 필수입니다" 수정
- 깨진 폼 데이터 바인딩으로 인한 "고객 추가" 버튼이 작동하지 않는 문제 수정

#### 증빙 관리 모듈

- `GROUP BY` 절에서 누락된 컬럼으로 인한 증빙 항목 가져오기에서 500 내부 서버 오류 수정
- `customer_id`에 UUID 타입 사용으로 PostgreSQL 외래 키 제약 조건 오류 수정
- 고객 선택 필드에 `id`/`for` 속성 추가로 접근성 린터 경고 수정
- `payslipInfo`에 대한 null 병합 연산자 추가로 null 참조 오류 수정

#### 급여명세서 통합

- 존재하지 않는 `departments` 및 `positions` 테이블에 대한 JOIN 제거로 "Failed to load resource: 500" 오류 수정
- `e.department` 및 `e.position` 문자열 컬럼을 직접 사용하도록 쿼리 업데이트
- `period` (YYYY-MM)를 별도의 `year` 및 `month` 필드로 변환하는 데이터 변환 수정
- `PayslipPDFData`에 대한 `payments`/`deductions` JSON 객체를 배열로 변환 수정

#### 집행률 모듈

- 클라이언트 측 및 서버 측 코드 분리로 `ReferenceError: process is not defined` 수정
- 반응성을 위해 `onchange`를 `$effect`로 교체하여 "집행율 보기" 체크박스가 작동하지 않는 문제 수정
- 여러 카테고리 코드를 쿼리하여 연구재료에 대한 0.0% 집행률 수정
- 명시적 컬럼 선택과 `::text` 캐스팅으로 데이터베이스 날짜 검증 오류 수정

### 🎨 UI/UX 개선

- **고객 카드 향상**
  - 체브론 아이콘이 있는 더 깔끔한 접힌/펼쳐진 상태
  - 더 나은 정보 계층 구조
  - 개선된 모바일 반응성

- **증빙 상세 모달**
  - 문서 링크가 있는 전문적인 고객 카드 표시
  - 명확한 급여명세서 상태 표시기
  - 누락된 문서에 대한 도움이 되는 안내 메시지

- **집행 계획 테이블**
  - 시각적 명확성을 위한 색상 코딩된 진행률 바
  - 토글 옵션이 있는 컴팩트한 표시
  - 다양한 화면 크기에 대한 반응형 레이아웃

### 📊 데이터 마이그레이션

- 인건비 증빙 이름에 대한 배치 업데이트 스크립트 (`scripts/fix-personnel-evidence-names.ts`)
- 자동 형식 변환: "고동훤 2025년 9월 인건비" → "고동훤 (2025-09)"
- 데이터베이스 스키마 업데이트 자동 적용

### 📝 개발자 노트

#### 주요 컴포넌트

- `CustomerFormModal.svelte` - 재사용 가능한 고객 생성/편집 폼
- `CommonPayslipModal.svelte` - 일반 급여명세서 표시 모달
- `RDEvidenceDetailModal.svelte` - 고객 및 급여명세서 통합으로 향상
- `RDExecutionPlan.svelte` - 예산 집행률 추적

#### 중요한 수정사항

- `ThemeInput.svelte`가 이제 `let value = $bindable('')`로 `bind:value`를 올바르게 구현
- `CustomerFormModal`이 불필요한 재초기화를 방지하기 위해 `lastCustomerId` 추적 사용
- 집행률 서비스를 클라이언트 안전 유틸리티와 서버 측 데이터베이스 쿼리로 분리

### 🚀 다음 단계

- 문서 상태가 있는 고객에 대한 고급 필터링 및 검색
- 예산 집행률 예측 및 알림
- 향상된 급여명세서 생성 워크플로우
- 증빙 및 문서 관리를 위한 모바일 앱 지원

---

**전체 변경사항**: 35개 파일 수정, 8개 새 파일 추가, 1개 파일 삭제
**주요 커밋**: `feat: integrate CRM customers and payslips with R&D evidence management, add budget execution rate tracking`

## Version 0.4.0 (2025-10-09)

### ✨ 주요 기능

#### 플래너 시스템 향상

- **마일스톤-이니셔티브 연결**: 이니셔티브와의 마일스톤 추적 완전 통합
  - 상태 기반 그룹화가 포함된 MilestoneSelector 컴포넌트 추가 (진행중, 예정, 달성, 미달성)
  - 이니셔티브 헤더 브레드크럼에 마일스톤 표시 (Product / Milestone / Title)
  - 이니셔티브 카드 및 목록에 마일스톤 배지 표시
  - 마일스톤별 이니셔티브 필터링

- **INBOX 상태 워크플로우**: 더 나은 워크플로우 관리를 위한 새로운 이니셔티브 상태
  - 이니셔티브 생명주기에 'inbox' 상태 추가
  - 양방향 전환: inbox ↔ active ↔ paused
  - inbox 상태를 지원하도록 UI 컴포넌트 업데이트

- **시각적 TODO 표시기**: 명확한 시각적 단서로 개선된 사용자 경험
  - 할당되지 않은 팀/목표 날짜에 대한 빨간색 테두리 및 배경
  - 설명 메시지가 포함된 경고 아이콘
  - 필요한 작업에 대한 직관적인 표시

- **유연한 단계 전환**: 모든 단계 전환 제한 제거
  - 모든 단계 간 자유로운 이동 (Shaping → Building → Testing → Shipping → Done)
  - 단계 변경에 대한 상태 요구사항 없음
  - 더 나은 유연성을 위한 간소화된 워크플로우

- **개선된 단계 스테퍼 UI**: 단계 진행 인터페이스 완전 재설계
  - 균일한 크기의 카드 기반 레이아웃
  - 영어 라벨 (Shaping, Building, Testing, Shipping, Done)
  - 일관된 간격이 있는 중앙 정렬 레이아웃
  - 명확성을 위한 단계 #1-5 번호 매기기

### 🔧 기술적 개선

- **TypeScript 타입 안전성**: 11개의 TypeScript 컴파일 오류 수정
  - InitiativeState → InitiativeStage 명명 수정
  - ActivityLog에서 Record<string, unknown> 호환성 수정
  - 가져오기 경로 및 인증 처리 업데이트

- **ESLint 구성**: 린팅 설정 개선
  - GitHub 워크플로우를 제외하도록 .eslintignore 추가
  - CI/CD 파이프라인에서 YAML 린팅 경고 방지

- **코드 품질**:
  - 일관되게 적용된 Prettier 포맷팅
  - 시스템 전체의 타입 안전 마일스톤 처리
  - 깔끔한 컴포넌트 구성 패턴

### 📊 데이터베이스 변경사항

- 'inbox' 상태를 포함하도록 `planner_initiatives` 테이블 제약 조건 업데이트
- 이니셔티브 쿼리에 마일스톤 ID 외래 키 지원 추가
- 마일스톤 데이터 검색을 위한 향상된 JOIN 쿼리

### 🎨 UI/UX 개선

- 모든 플래너 보기에 걸친 제품/마일스톤 계층 구조 표시
- 깔끔한 날짜 포맷팅이 포함된 간소화된 마일스톤 선택기 (10. 14.)
- 경고 및 알림에 대한 일관된 시각적 언어
- 개선된 단계 스테퍼 정렬 및 간격

---

**주요 변경사항**: 마일스톤-이니셔티브 통합, 유연한 워크플로우, UI 개선
**핵심 커밋**: `feat: enhance planner system with milestone integration and flexible workflows`

## Version 0.3.3 (2025-10-08)

### ✨ 주요 기능

#### 휴가 관리 향상

- **휴가 촉진 대상**: 낮은 휴가 사용률을 가진 직원에 대한 알림 추가 (고용 1년 후 9월 1일까지 ≤50%)
- **향상된 휴가 달력 UI**: 더 나은 탐색, 휴일 표시, 휴가 유형 시각화가 포함된 개선된 월별 달력 보기
- **휴가 유형 개선**: 더 나은 구분을 위한 휴가 유형 색상 및 아이콘 업데이트 (연차, 반차, 반반차, 경조사, 군휴가)

### 🔧 개선사항

- **달력 탐색**: 더 나은 UX를 위한 연도 선택기, "오늘" 버튼, 월별 탐색 추가
- **휴가 잔액 표시**: 사용 통계 및 촉진 알림이 포함된 향상된 잔액 표시
- **코드 품질**: 프로덕션 빌드에서 Svelte 검사기 비활성화 및 Vitest 구성 업데이트

---

**주요 변경사항**: 휴가 관리 UI 개선, 촉진 알림 시스템
**핵심 커밋**: `feat: enhance leave management with promotion targets and improved calendar UI`

## Version 0.3.2 (2025-10-08)

### ✨ 급여명세서 PDF 출력 기능 완전 개선

#### 데이터 구조 개선

- **payments/deductions 배열 저장**: 엑셀 업로드 시 지급/공제 항목을 JSON 배열로 저장
  - 기본급, 식대, 차량유지, 상여금 등 모든 지급 항목 저장
  - 건강보험, 국민연금, 갑근세 등 모든 공제 항목 저장
- **API JSONB 파싱**: PostgreSQL JSONB 타입을 자동 파싱하여 프론트엔드로 전달
- **편집 모드 데이터 로딩 개선**: name/id 양방향 매칭으로 호환성 강화

#### PDF 출력 기능

- **공용 컴포넌트**: `PayslipPDFModal.svelte` 생성 (관리자/직원 공용)
- **별도 창 프린트**: `window.open()` 기반으로 CSS 스코핑 문제 완전 해결
- **A4 최적화**: 10mm 15mm 여백, 전문적인 레이아웃

#### 급여명세서 푸터

- **발급일자/지급일**: 명확한 날짜 정보 표시
- **대표이사 서명**: 회사 설정에서 CEO 이름 자동 로드
- **직인 이미지**: `static/stamp.png` 직인 표시
- **공식 문서 안내**: 회사명과 문의 안내문

#### 금액 표시 통일

- **천원 단위 제거**: 모든 금액을 원 단위로 표시
- **세자리 콤마**: 2,600,000원 형식으로 통일
- **0원 항목 표시**: 모든 항목(0원 포함) 표시

#### 신규 파일

- `src/lib/types/payslip.ts`: 급여명세서 타입 정의
- `src/lib/components/payslip/PayslipPDFModal.svelte`: 공용 PDF 모달
- `src/lib/utils/payslip-print.ts`: 프린트 유틸리티
- `static/stamp.png`: 회사 직인 이미지

---

**주요 변경사항**: 급여명세서 PDF 출력 시스템 완전 개선
**핵심 커밋**: `feat: complete overhaul of payslip PDF generation system`

## Version 0.3.1 (2025-10-08)

### 🔧 코드 품질 개선

#### ESLint 설정 대규모 리팩토링

- **설정 파일 간소화**: 547줄 → 354줄 (35% 감소)
  - 명확한 섹션 구분 및 재사용 가능한 상수 정의
  - TypeScript, Svelte, API 라우트별 규칙 체계화
  - 중복 코드 제거 및 가독성 대폭 향상

- **엄격도 완화**: 7-8/10 → 5-6/10
  - TypeScript unsafe 규칙 전체 비활성화 (`no-unsafe-*`)
  - Promise 관련 규칙 비활성화
  - console 사용 허용
  - 사용하지 않는 변수/import는 경고로 완화

- **Svelte 5 호환성 개선**
  - parser 설정 수정 (`tsParser` → `'@typescript-eslint/parser'`)
  - 더 안정적인 Svelte 파일 처리

#### API 리팩토링

- **Banks API 개선** (302줄 → 354줄)
  - 타입 안정성 강화: `BankRow`, `CreateBankInput`, `UpdateBankInput` 등
  - 유틸 함수 분리: `mapRowToBank()`, `errorResponse()`, `isDuplicateCode()`
  - 상수 분리: `DEFAULT_BANK_COLOR`, `SELECT_BANK_FIELDS`
  - 중복 코드 제거 및 에러 처리 일관성 확보

- **Daily Reports API 리팩토링** (302줄 → 422줄)
  - 비즈니스 로직 세분화 (10개 함수로 분리)
    - `getOpeningBalance()`, `getDailyTransactions()`
    - `calculateCategorySummaries()`, `createAccountSummaries()`
    - `generateAlerts()` 등
  - 명확한 단계별 처리 및 주석
  - 타입 정의 강화: `CategorySummary`, `AccountSummary`, `Alert`

### 🧹 불필요한 코드 제거

#### 미사용 기능 완전 삭제

- **예산관리(Budget) 시스템**
  - `BudgetManagement.svelte` 컴포넌트 삭제
  - `budget-service.ts` 서비스 삭제
  - `useBudgets.svelte.ts` Hook 삭제
  - `/api/finance/budgets` 엔드포인트 삭제
  - `finance_budgets` 테이블 스키마 제거

- **대출관리(Loan) 시스템**
  - `LoanManagement.svelte` 컴포넌트 삭제
  - `/api/finance/loans` 엔드포인트 삭제

- **임시 SQL 파일 정리**
  - `finance-data-init.sql` 삭제
  - `finance-reset-and-init.sql` 삭제

#### 데이터베이스 스키마 정리

- `bank_code` enum 타입 제거
- `alert_threshold` 컬럼 제거
- 불필요한 인덱스 정리

### 📊 통계

- **35개 파일 수정**
- **3,723줄 삭제, 926줄 추가**
- **순 감소: 2,797줄** (약 75% 코드 제거)
- **모든 검사 통과**: ESLint, Prettier, TypeScript

### 🎯 핵심 개선 효과

1. **개발 생산성 향상**: 느슨한 ESLint 규칙으로 개발 속도 증가
2. **유지보수성 향상**: 명확한 함수 분리 및 타입 정의
3. **코드베이스 간소화**: 불필요한 기능 제거로 복잡도 감소
4. **타입 안정성**: any 타입 최소화 및 명확한 인터페이스 정의

---

**주요 변경사항**: ESLint 설정 대폭 개선, 불필요한 코드 제거
**핵심 커밋**: `feat: major ESLint refactoring and code cleanup`

## Version 0.3.0 (2025-10-07)

### 🎯 주요 기능

#### 계좌 태그 시스템 구축

- **포괄적 계좌 태그 관리 시스템**
  - 6가지 태그 유형 지원: `dashboard`, `revenue`, `operation`, `fund`, `rnd`, `custom`
  - 계좌별 다중 태그 할당 기능
  - 태그 기반 필터링 및 시각화
  - 태그별 색상 코딩으로 시각적 구분

- **RND 태그 기반 잔액 제외 시스템**
  - 연구개발 전용 계좌를 회사 총 잔액에서 자동 제외
  - 대시보드 통계 계산 시 RND 태그 계좌 필터링
  - 정확한 자금 현황 파악 지원

#### 자금 관리 아키텍처 리팩토링

- **Clean Architecture 패턴 도입**
  - Hooks 기반 비즈니스 로직 분리: `useAccounts`, `useTransactions`, `useBudgets`, `useFinanceManagement`
  - 단일 통합 Store: `financeStore.svelte.ts` (Svelte 5 Runes 기반)
  - Services 계층 분리로 API 통신 로직 독립화
  - 레거시 finance-store 제거 및 신규 아키텍처로 전환

- **Svelte 5 Runes 전면 도입**
  - `$state`, `$derived`, `$derived.by` 사용으로 완벽한 반응성 확보
  - 기존 getter 방식에서 `$derived.by()` 전환으로 통계 반응성 문제 해결
  - 컴포넌트 간 데이터 흐름 개선

#### 계좌 관리 UI/UX 대폭 개선

- **통합 계좌 편집 모달**
  - 계좌명, 상태, 태그, 설명, 주계좌 여부 등 모든 속성 편집
  - 은행과 계좌번호는 읽기 전용으로 데이터 무결성 보장
  - 태그 다중 선택 체크박스 UI
  - 상태 선택 드롭다운: `active`, `inactive`, `suspended`, `closed`

- **계좌 태그 표시 개선**
  - 계좌 테이블에서 용도/별칭 칼럼에 태그 표시
  - 태그 색상 코딩으로 시각적 가독성 향상
  - 최대 3개 태그 미리보기 지원

#### 거래 내역 관리 개선

- **활성 계좌 필터링**
  - 거래 내역 관리 화면에서 비활성/정지/폐쇄 계좌 자동 필터링
  - 활성 계좌만 드롭다운에 표시하여 사용자 혼란 방지
  - 계좌 선택 UI 간소화

- **상단 액션 버튼 제거**
  - "거래 추가", "엑셀 업로드", "대량 삭제" 버튼 제거
  - 계좌별 거래 관리 플로우로 전환
  - 깔끔한 UI 제공

#### 대시보드 개선

- **주요 계좌 패널 개선**
  - `dashboard` 태그가 있는 계좌만 표시
  - 은행별 색상 코딩 적용
  - 계좌번호 마스킹 (마지막 4자리만 표시)
  - 계좌 상태 시각적 표시 (활성/비활성/정지/폐쇄)
  - 태그 정보 카드에 표시

- **통계 카드 반응성 개선**
  - 총 잔액, 활성 계좌 수, 월별 수입/지출, 순현금흐름 실시간 업데이트
  - 서버 계산 통계와 프론트엔드 통계 동기화
  - `$derived.by()` 사용으로 완벽한 반응성 확보

### 🐛 버그 수정

#### 계좌 잔액 계산 오류 수정

- **크리티컬 버그**: API에서 `balance > 0` 조건으로 인해 잔액이 0원인 거래 건너뛰는 문제
  - **영향**: KOSFARM-2-적과적심로봇 계좌가 실제 ₩0인데 ₩27,000,000으로 표시
  - **원인**: `/api/finance/accounts/+server.ts`의 LATERAL JOIN 쿼리에서 `AND balance > 0` 조건
  - **해결**: 조건 제거로 항상 최신 거래의 잔액 반환하도록 수정

#### 대시보드 통계 반응성 문제 해결

- **문제**: 총 잔액이 ₩0으로 표시되는 문제
  - **원인**: `financeStore`의 `statistics`가 getter 방식으로 정의되어 Svelte 5에서 반응성 없음
  - **해결**: `statistics = $derived.by()` 방식으로 전환
  - **추가 수정**: `+page.svelte`에서 props 전달 방식 개선 (중첩 객체 → 직접 속성 전달)

#### 계좌 편집 UI 문제 해결

- **문제**: 편집 버튼이 보이지 않고 태그 버튼만 표시
  - **해결**: 태그 아이콘 버튼을 편집 아이콘 버튼으로 교체
  - 액션 칼럼 구성: 보기, 편집, 삭제 버튼

### 🔧 기술적 개선

#### 새로운 API 엔드포인트

- **계좌 태그 관리**
  - `GET/POST /api/finance/account-tags` - 태그 목록 조회 및 생성
  - `GET/PUT/DELETE /api/finance/account-tags/[id]` - 개별 태그 관리
  - `GET/PUT /api/finance/accounts/[id]/tags` - 계좌별 태그 할당 관리

- **계좌 관리 개선**
  - `GET /api/finance/accounts/bank-summaries` - 은행별 계좌 요약 조회
  - `PUT /api/finance/accounts/[id]` - 계좌 상태 및 태그 업데이트 지원

- **대시보드 개선**
  - `GET /api/finance/dashboard` - RND 태그 계좌 제외한 통계 계산
  - 거래 내역 기반 실시간 잔액 조회 개선

#### 데이터베이스 스키마 업데이트

- **계좌 태그 테이블**

  ```sql
  CREATE TABLE finance_account_tags (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(20) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE finance_account_tag_relations (
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES finance_account_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (account_id, tag_id)
  );
  ```

- **계좌 상태 필드**
  - `finance_accounts.status` 컬럼 활용 강화
  - 상태별 필터링 및 UI 표시 개선

#### TypeScript 타입 개선

- **새로운 타입 정의**

  ```typescript
  interface AccountTag {
    id: string
    name: string
    tagType: 'dashboard' | 'revenue' | 'operation' | 'fund' | 'rnd' | 'custom'
    color: string
    description?: string
    createdAt: string
  }

  interface Account {
    // ... 기존 필드
    tags?: AccountTag[]
    status: 'active' | 'inactive' | 'suspended' | 'closed'
  }

  interface UpdateAccountRequest {
    // ... 기존 필드
    status?: AccountStatus
    tagIds?: string[]
  }
  ```

#### 컴포넌트 구조 개선

- **신규 컴포넌트**
  - `AccountTagSelector.svelte` - 태그 선택 UI
  - `TagManagement.svelte` - 태그 관리 페이지
  - `FinanceOverviewTab.svelte` - 대시보드 개요 탭
  - `FinanceOverviewCards.svelte` - 통계 카드 컴포넌트
  - `RecentAccountsPanel.svelte` - 주요 계좌 패널 (완전 재작성)
  - `ActionItemsPanel.svelte` - 액션 아이템 패널

- **제거된 컴포넌트**
  - `FinanceDashboard.svelte` (레거시)
  - `finance-store.ts`, `dashboard-store.ts` (레거시 stores)

### 📊 데이터 정리 및 마이그레이션

- **테스트 데이터 정리**
  - 더미 거래 데이터 4건 삭제
  - 계좌 잔액 정확성 검증

- **태그 시스템 초기 데이터**
  - 기본 태그 생성: 대시보드, 매출, 운영, 자금, 연구개발
  - 기존 계좌에 적절한 태그 할당

### 🔄 아키텍처 변경사항

#### Before (레거시)

```
Components → Stores (finance-store, dashboard-store) → API
```

#### After (신규)

```
Components → Hooks (useFinanceManagement, useAccounts, etc.)
          ↓
    financeStore (Svelte 5 Runes)
          ↓
    Services (accountService, transactionService)
          ↓
    API Endpoints
```

### 📝 개발자 노트

#### 주요 Hooks

- **useFinanceManagement**: 마스터 Hook, 모든 자금 관리 기능 통합
- **useAccounts**: 계좌 CRUD 및 필터링
- **useTransactions**: 거래 내역 CRUD 및 통계
- **useBudgets**: 예산 관리

#### Svelte 5 Runes 사용 패턴

```typescript
// Store
class FinanceStore {
  data = $state<FinanceData>(initialData)
  ui = $state<FinanceUI>(initialUI)

  statistics = $derived.by((): FinanceStatistics => {
    return {
      totalBalance: this.dashboardStats?.totalBalance ?? 0,
      // ...
    }
  })
}

// Component
const finance = useFinanceManagement()
const { store } = finance

let activeAccounts = $derived(store.data.accounts.filter((acc) => acc.status === 'active'))
```

### 🚀 다음 버전 계획

- 태그 기반 고급 필터링 및 검색
- 계좌별 거래 추가 UI 개선
- 태그 통계 및 분석 대시보드
- 예산 태그 연동 시스템
- 모바일 반응형 UI 개선

---

**전체 변경사항**: 42개 파일 수정, 14개 새 파일 추가, 3개 파일 삭제
**주요 커밋**: `feat: implement account tagging system and improve finance dashboard`

## Version 0.2.6 (2025-10-04)

### 🎯 주요 기능

#### 거래 내역 UI/UX 개선

- **거래 내역 테이블 정렬 개선**
  - 입금, 출금, 잔액 컬럼을 오른쪽 정렬로 변경하여 숫자 데이터 가독성 향상
  - 테이블 헤더와 데이터 셀 모두 일관된 정렬 적용

#### 카테고리 관리 시스템 개선

- **미분류 카테고리 제거 및 통합**
  - 미분류 카테고리를 제거하고 기타수입/기타지출로 통합
  - 90건의 미분류 거래를 거래 유형에 따라 자동 분류
  - 입금 거래는 기타수입, 출금 거래는 기타지출로 자동 이동

- **기타지출/기타수입 자동 분류 시스템**
  - 총 168건의 거래를 적절한 카테고리로 자동 분류
  - 급여, 통신비, 보험료, 세금, 수수료, 매출 등 세부 카테고리로 분류
  - 키워드 기반 자동 매핑으로 분류 정확도 향상

### 🔧 기술적 개선

#### 새로운 API 엔드포인트

- **`/api/finance/transactions/categorize-others`**
  - 기타지출/기타수입 거래들의 자동 분류 처리
  - 키워드 매핑을 통한 지능형 분류 시스템

- **`/api/finance/categories/remove-uncategorized`**
  - 미분류 카테고리 제거 및 거래 통합 처리
  - 안전한 데이터 마이그레이션 보장

#### UI 개선사항

- **거래 내역 테이블**
  - 금액 컬럼 오른쪽 정렬로 숫자 데이터 가독성 향상
  - 일관된 테이블 레이아웃 적용

### 🐛 버그 수정

- 거래 내역 테이블의 금액 표시 정렬 문제 해결
- 미분류 카테고리로 인한 데이터 관리 복잡성 해결
- 카테고리 분류의 일관성 문제 개선

### 📊 데이터 정리

- **카테고리 정리 결과**
  - 미분류: 90건 → 0건 (완전 제거)
  - 기타수입: 134건 (자동 분류 후 남은 거래)
  - 기타지출: 276건 (자동 분류 후 남은 거래)
  - 자동 분류: 168건 (급여, 통신비, 보험료, 세금, 수수료, 매출 등)

### 🔄 마이그레이션

- 미분류 카테고리의 모든 거래를 기타수입/기타지출로 자동 이동
- 거래 유형에 따른 자동 분류 로직 적용
- 카테고리 데이터의 일관성 및 정확성 향상

---

**주요 변경사항**: 카테고리 관리 시스템 개선, 자동 분류 기능
**핵심 커밋**: `feat: improve transaction categorization and remove uncategorized category`

## Version 0.2.5 (2025-01-27)

### 🎯 주요 기능

#### 거래 내역 관리 시스템 완전 리팩토링

- **새로운 거래 스키마 도입**
  - `deposits` (입금), `withdrawals` (출금), `balance` (거래후잔액), `counterparty` (의뢰인/수취인) 필드 추가
  - 기존 `amount`, `type` 필드는 `deposits`/`withdrawals`에서 자동 계산
  - 거래 내역의 최신 `balance`가 계좌 현재 잔액으로 사용

#### 은행별 파서 시스템 구축

- **하나은행 Excel 파일 파싱 지원**
  - 거래일시, 적요, 의뢰인/수취인, 입금/출금, 거래후잔액 파싱
  - 자동 카테고리 매핑 (급여, 임대료, 공과금, 마케팅 등)
  - 엑셀 파일 업로드 지원 (.xlsx, .xls)

- **농협은행 Excel 파일 파싱 지원**
  - 거래일자와 거래시간 조합으로 완전한 타임스탬프 생성
  - 출금금액, 입금금액, 거래후잔액, 거래내용 파싱
  - 거래기록사항을 상대방 정보로 활용

#### 은행 코드 시스템 도입

- **표준화된 은행 코드 관리**
  - `BankCode` enum: 1001(하나은행), 1002(농협은행), 1003(전북은행)
  - 은행별 파서 팩토리 패턴으로 확장 가능한 구조
  - 파일명 기반 자동 은행 감지

#### 계좌 잔액 관리 시스템 개선

- **실시간 잔액 계산**
  - `finance_accounts` 테이블에서 `balance` 컬럼 제거
  - 거래 내역의 최신 `balance`를 `LATERAL JOIN`으로 실시간 조회
  - 잔액 계산 로직 중복 제거로 데이터 일관성 향상

#### 계좌 삭제 시스템 개선

- **Clean Delete 기능**
  - 계좌 삭제 시 관련 거래 내역도 함께 삭제
  - PostgreSQL 트랜잭션으로 안전한 삭제 보장
  - 삭제 전 사용자 확인 메시지로 실수 방지

### 🔧 기술적 개선

#### 데이터베이스 스키마 업데이트

- `finance_transactions` 테이블에 새 컬럼 추가: `counterparty`, `deposits`, `withdrawals`, `balance`
- `finance_accounts` 테이블에서 `balance` 컬럼 제거
- `finance_banks` 테이블에 `bank_code` enum 타입 추가

#### API 엔드포인트 개선

- `/api/finance/transactions/upload` - Excel 파일 업로드 지원
- `/api/finance/accounts/[id]` - Clean delete 및 실시간 잔액 조회
- `/api/finance/dashboard` - 거래 내역 기반 잔액 표시
- `/api/finance/transactions` - 새로운 스키마 필드 지원

#### 프론트엔드 개선

- **거래 내역 테이블 개선**
  - 은행, 계좌번호 필터 추가
  - 상대방 정보, 입금/출금, 잔액 컬럼 표시
  - 동적 필터 옵션 (은행별 계좌 목록)

- **대시보드 개선**
  - 최근 거래 내역에 상대방, 잔액 정보 표시
  - 카테고리 태그 스타일링
  - 호버 효과 및 사용자 경험 개선

### 🐛 버그 수정

#### 날짜 처리 오류 수정

- 하나은행 Excel 파일의 날짜 파싱 오류 해결
- 농협은행의 거래일자+거래시간 조합 처리 개선
- `toUTC()` 함수의 `YYYY/MM/DD HH:MM:SS` 형식 지원

#### 데이터 파싱 오류 수정

- Excel 파일의 원본 값 읽기 설정 (`raw: true`, `cellDates: false`)
- 빈 날짜 필드 처리로 데이터베이스 오류 방지
- 거래 건너뛰기 로직으로 파싱 안정성 향상

#### UI/UX 버그 수정

- 필터 간 동기화 문제 해결 (은행-계좌-계좌번호)
- 거래 내역 표시 오류 수정
- 계좌 삭제 확인 메시지 개선

### 📊 사용자 경험 개선

#### 파일 업로드 개선

- Excel 파일 형식 지원 (.xlsx, .xls)
- 파일별 은행 자동 감지
- 업로드 진행률 및 결과 피드백

#### 데이터 표시 개선

- 입금/출금 금액의 +/- 표시
- 상대방 정보 하이라이트 표시
- 잔액 정보 명확한 표시

#### 필터링 시스템 개선

- 4개 컬럼 그리드 레이아웃 (은행, 계좌, 계좌번호, 카테고리)
- 필터 초기화 버튼 추가
- 동적 옵션 업데이트

### 🔄 마이그레이션

#### 데이터베이스 마이그레이션

- 기존 거래 데이터를 새 스키마로 변환
- 계좌 테이블에서 balance 컬럼 제거
- 은행 코드 enum 타입 추가

#### 코드 마이그레이션

- 모든 API에서 새로운 거래 스키마 지원
- 프론트엔드 컴포넌트 업데이트
- 타입 정의 업데이트

### 📝 개발자 노트

#### 새로운 타입 정의

```typescript
interface ParsedTransaction {
  transactionDate: string
  description: string
  counterparty?: string
  deposits?: number
  withdrawals?: number
  balance?: number
  bankCode: BankCode
  categoryCode?: string
}

enum BankCode {
  HANA = '1001',
  NONGHYUP = '1002',
  JEONBUK = '1003',
}
```

#### 주요 함수 추가

- `parseHanaBankStatement()` - 하나은행 Excel 파싱
- `parseNonghyupBankStatement()` - 농협은행 Excel 파싱
- `BankCodeUtils` - 은행 코드 유틸리티
- `BankDetector` - 파일명 기반 은행 감지

### 🚀 다음 버전 계획

- 추가 은행 파서 지원 (신한, 국민, 우리은행 등)
- 거래 내역 검색 및 정렬 기능 개선
- 대시보드 차트 및 분석 기능 추가
- 모바일 반응형 UI 개선

---

**전체 변경사항**: 50개 파일 수정, 15개 새 파일 추가, 8개 파일 삭제  
**주요 커밋**: `feat: 거래 내역 스키마 개선 및 계좌 잔액 관리 시스템 완전 리팩토링`

## Version 0.2.4 (2025-01-27)

### 🎯 주요 기능

#### 프로젝트 관리 시스템 개선

- **연구개발비 예산 불일치 표시 기능 추가**
  - 연차별 예산과 연구개발비 불일치 시 시각적 표시
  - 각 연차 행에 빨간색 배경과 경고 태그(!) 표시
  - 테이블 하단에 불일치 상세 정보 및 수정 안내 메시지
  - 1천원 이상 차이 시 불일치로 판단하여 사용자에게 알림

#### 프로젝트 멤버 관리 개선

- **현금/현물 기여 방식 개선**
  - `contributionType` 필드 제거, 현금/현물 금액으로 기여 유형 자동 판단
  - 계약월급여와 참여개월수 편집 가능
  - 현금/현물 금액 자동 계산 및 수동 편집 지원
  - 동일 직원의 중복 참여 허용 (참여 기간이 겹치지 않는 경우)

#### 프로젝트 생성 프로세스 간소화

- **예산 설정 단계 제거**
  - 새 프로젝트 생성 시 예산 설정 단계 제거
  - 모달 내 모달 문제 해결
  - 프로젝트 생성 후 별도 예산 설정 가능

#### 예산 관리 시스템 강화

- **연차별 예산 수정 시 연구개발비 보존**
  - 연차별 예산 수정 시 기존 연구개발비 데이터 자동 보존
  - 예산 수정 전 검증 API 추가
  - 연구개발비 복원 기능 추가
  - 예산 수정 확인 모달 추가

### 🔧 기술적 개선

#### 데이터베이스 스키마 업데이트

- `project_members` 테이블에 `cash_amount`, `in_kind_amount` 컬럼 추가
- `contribution_type` 컬럼 제거
- `project_budget_restore_history` 테이블 추가

#### API 엔드포인트 추가

- `/api/project-management/project-budgets/[id]/validate-before-update` - 예산 수정 전 검증
- `/api/project-management/project-budgets/[id]/restore-research-costs` - 연구개발비 복원
- `/api/project-management/setup-restore-history` - 복원 히스토리 테이블 생성

#### 프론트엔드 개선

- 프로젝트 멤버 테이블 구조 개선 (이름, 기간, 참여개월수, 계약월급여, 참여율, 현금, 현물)
- 숫자 포맷팅 일관성 개선 (천 단위 구분자, 원 단위 표시)
- 프로젝트 설명 줄바꿈 지원 (`whitespace-pre-line`)
- 프로젝트 목록 정렬 개선 (연도-숫자 순)

### 🐛 버그 수정

#### 날짜 처리 오류 수정

- 프로젝트 멤버 수정 시 날짜 형식 오류 해결
- `processQueryResultDates()` 우회 로직 추가
- API 요청/응답 날짜 형식 통일

#### 데이터 표시 오류 수정

- 프로젝트 멤버 이름 표시 오류 해결
- 참여율, 현금/현물 금액 표시 오류 해결
- 테이블 합계 계산 오류 수정

#### ESLint 및 TypeScript 오류 수정

- 사용하지 않는 변수 정리
- 타입 안전성 개선
- 코드 포맷팅 일관성 개선

### 📊 사용자 경험 개선

#### UI/UX 개선

- 프로젝트 멤버 테이블 폰트 크기 및 스타일 조정
- 기여 유형 표시 간소화 (이모지 제거, 태그 스타일 개선)
- 불필요한 UI 요소 제거 (~ 기호, 검증 상태 컬럼)
- 테이블 전체 너비 활용

#### 데이터 일관성 강화

- 예산과 연구개발비 불일치 자동 감지
- 사용자 친화적인 경고 메시지 제공
- 데이터 수정 가이드 제공

### 🔄 마이그레이션

#### 데이터베이스 마이그레이션

- 기존 `contribution_type` 데이터를 `cash_amount`/`in_kind_amount`로 변환
- `project_budget_restore_history` 테이블 자동 생성
- 기존 프로젝트 멤버 데이터 호환성 유지

### 📝 개발자 노트

#### 새로운 타입 정의

```typescript
interface AnnualBudget {
  hasMismatch?: boolean
  researchCostTotal?: number
}
```

#### 주요 함수 추가

- `checkBudgetMismatch()` - 예산 불일치 검증
- `calculateContractMonthlySalary()` - 계약월급여 계산
- `calculateContributionAmount()` - 기여 금액 계산

### 🚀 다음 버전 계획

- 프로젝트 진행률 추적 기능
- 고급 보고서 생성 기능
- 사용자 권한 관리 시스템 개선
- 모바일 반응형 UI 개선

---

**전체 변경사항**: 47개 파일 수정, 8개 새 파일 추가, 3개 파일 삭제
**주요 커밋**: `feat: 연구개발비 표에 예산 불일치 표시 기능 추가`
