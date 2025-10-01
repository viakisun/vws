# VWS Release Notes

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
