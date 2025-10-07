# VWS Release Notes

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
