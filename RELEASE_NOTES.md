# VWS Release Notes

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
  JEONBUK = '1003'
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
