# ProjectDetailView Architecture

## 핵심 개념: 3단계 예산 흐름

이 시스템은 예산 관리를 명확한 3단계로 구분합니다:

### 1단계: Budget Funding (예산 조달)
**책임**: 자금의 출처를 관리
- 지원금 (정부, 기관 등)
- 기업부담금
- 기타 조달 방식

**핵심 데이터**:
- 연차별 조달 계획 (ProjectBudget)
- 조달 금액 (현금/현물 구분)
- 조달 기간 (시작일~종료일)

**Hook**: `useBudgetFunding.svelte.ts`

---

### 2단계: Budget Planning (예산 계획)
**책임**: 조달된 자금을 어떻게 사용할지 계획
- 인건비 (참여연구원별)
- 재료비
- 활동비
- 연구수당
- 간접비

**핵심 데이터**:
- 참여연구원 (ProjectMember) - 인건비 계획의 핵심
- 각 비목별 배분 계획
- 참여기간 및 참여율

**Hook**: `useBudgetPlanning.svelte.ts`

**특징**: 인건비는 참여연구원을 통해 관리되므로, 이 단계에서 멤버 관리가 중심

---

### 3단계: Budget Execution (예산 집행)
**책임**: 계획된 예산의 실제 사용 내역 추적
- 증빙 자료 관리
- 실제 집행 금액 기록
- 집행 담당자 추적
- 집행 일자 관리

**핵심 데이터**:
- 증빙 항목 (Evidence)
- 증빙 카테고리
- 집행 금액 및 담당자
- 마감일

**Hook**: `useBudgetExecution.svelte.ts`

---

## 아키텍처 레이어

```
┌─────────────────────────────────────────────┐
│         ProjectDetailView.svelte            │  ← UI Layer (Component)
│         (메인 컴포넌트, ~400 lines 목표)      │
└─────────────────────────────────────────────┘
                    ↓ uses
┌─────────────────────────────────────────────┐
│      useProjectDetail.svelte.ts             │  ← Composition Layer
│      (마스터 훅, 3단계 흐름 조율)             │
└─────────────────────────────────────────────┘
            ↓                ↓               ↓
┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
│ useBudgetFunding│  │useBudgetPlanning│  │useBudgetExecution│  ← Business Logic Layer
│   (예산 조달)    │  │   (예산 계획)  │  │   (예산 집행)   │     (Hooks)
└─────────────────┘  └──────────────┘  └────────────────┘
         ↓                   ↓                  ↓
┌──────────────────────────────────────────────────────┐
│         projectDetailStore.svelte.ts                 │  ← State Management Layer
│         (중앙 집중식 상태 관리)                        │
└──────────────────────────────────────────────────────┘
         ↓                   ↓                  ↓
┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
│ budget.service  │  │member.service│  │evidence.service│  ← Service Layer
│   (API 호출)     │  │  (API 호출)   │  │  (API 호출)     │     (API Integration)
└─────────────────┘  └──────────────┘  └────────────────┘
```

---

## 파일 구조

```
src/lib/components/project-management/
│
├── ProjectDetailView.svelte              # 메인 UI 컴포넌트
│
├── stores/
│   └── projectDetailStore.svelte.ts      # 중앙 상태 관리
│
├── hooks/
│   ├── useProjectDetail.svelte.ts        # 마스터 composition hook
│   ├── useBudgetFunding.svelte.ts        # 1단계: 예산 조달
│   ├── useBudgetPlanning.svelte.ts       # 2단계: 예산 계획
│   └── useBudgetExecution.svelte.ts      # 3단계: 예산 집행
│
├── utils/
│   ├── budgetUtils.ts                    # 예산 관련 유틸리티
│   ├── memberUtils.ts                    # 멤버 관련 유틸리티
│   ├── calculationUtils.ts               # 계산 유틸리티
│   └── dataTransformers.ts               # 데이터 변환 유틸리티
│
└── docs/
    └── ARCHITECTURE.md                   # 이 문서
```

---

## 데이터 흐름

### 초기 로딩 시퀀스
```
1. useProjectDetail.onMount()
   ↓
2. fundingHook.loadBudgets()          ← 1단계: 조달 예산 로드
   ↓
3. planningHook.loadMembers()         ← 2단계: 참여연구원 로드
   ↓
4. executionHook.loadEvidenceCategories() ← 3단계: 증빙 카테고리 로드
```

### 예산 추가 플로우
```
1. 사용자가 "예산 조달 추가" 버튼 클릭
   ↓
2. store.openModal('budget')
   ↓
3. 사용자가 폼 입력 (조달 금액, 기간 등)
   ↓
4. fundingHook.addBudget()
   ↓
5. budgetService.createBudget() → API 호출
   ↓
6. fundingHook.loadBudgets() → 목록 갱신
   ↓
7. updateProjectPeriod() → 프로젝트 기간 업데이트
   ↓
8. store.closeModal('budget')
```

### 참여연구원 추가 플로우 (인건비 계획)
```
1. 사용자가 "참여연구원 추가" 버튼 클릭
   ↓
2. planningHook.startAddMember()
   ↓
3. 사용자가 폼 입력 (직원, 역할, 참여율 등)
   ↓
4. planningHook.addMember()
   ↓
5. memberService.addMember() → API 호출
   ↓
6. planningHook.loadMembers() → 목록 갱신
```

### 증빙 추가 플로우 (예산 집행)
```
1. 사용자가 "증빙 추가" 버튼 클릭
   ↓
2. store.openModal('evidence')
   ↓
3. 사용자가 폼 입력 (항목명, 금액, 담당자 등)
   ↓
4. executionHook.handleAddEvidenceItem()
   ↓
5. evidenceService.createEvidence() → API 호출
   ↓
6. executionHook.loadEvidenceItems() → 목록 갱신
   ↓
7. store.closeModal('evidence')
```

---

## 핵심 설계 원칙

### 1. 관심사의 분리 (Separation of Concerns)
- **UI Layer**: 오직 렌더링과 사용자 상호작용만 담당
- **Business Logic Layer**: 비즈니스 로직과 데이터 처리
- **State Management Layer**: 상태의 중앙 집중화
- **Service Layer**: API 통신

### 2. 단방향 데이터 흐름
```
User Action → Hook Method → Service → API
                ↓
            Store Update
                ↓
            UI Re-render
```

### 3. 명확한 책임 경계
각 Hook은 하나의 예산 단계만 담당:
- `useBudgetFunding`: 조달만
- `useBudgetPlanning`: 계획만
- `useBudgetExecution`: 집행만

### 4. 재사용성
- Hooks는 독립적으로 테스트 가능
- Utils는 순수 함수로 구성
- Store는 다른 컴포넌트에서도 재사용 가능

### 5. 타입 안전성
- TypeScript를 통한 강력한 타입 체크
- 인터페이스를 통한 명확한 계약

---

## 마이그레이션 가이드

### 기존 코드에서 새 구조로 전환

**Before** (기존 2,742 lines 단일 파일):
```svelte
<script lang="ts">
  // 모든 로직이 여기에...
  async function loadBudgets() { ... }
  async function addMember() { ... }
  async function addEvidence() { ... }
  // ... 수백 줄의 코드
</script>
```

**After** (새 구조):
```svelte
<script lang="ts">
  import { useProjectDetail } from './hooks/useProjectDetail.svelte'

  const pd = useProjectDetail({ selectedProject })

  // 이제 모든 기능이 명확하게 구조화됨:
  // pd.funding.addBudget()
  // pd.planning.addMember()
  // pd.execution.handleAddEvidenceItem()
</script>
```

### 주요 변경 사항

1. **Members → Planning**
   - `useProjectMembers` → `useBudgetPlanning`
   - 인건비는 예산 계획의 일부로 재분류

2. **Budgets → Funding**
   - `useProjectBudgets` → `useBudgetFunding`
   - 예산 조달에 집중, 복잡한 검증 로직 제거

3. **Evidence → Execution**
   - `useProjectEvidence` → `useBudgetExecution`
   - 증빙은 예산 집행의 증거로 명확화

4. **Validation 단순화**
   - `useProjectValidation` 제거
   - 필수 검증만 각 Hook 내부에 통합

---

## 향후 확장 가능성

### 1. 컴포넌트 분리
각 단계별로 독립적인 UI 컴포넌트 생성 가능:
```
components/
├── BudgetFundingSection.svelte
├── BudgetPlanningSection.svelte
└── BudgetExecutionSection.svelte
```

### 2. 보고서 기능
3단계 구조를 활용한 단계별 보고서:
- 조달 현황 보고서
- 계획 대비 실적 보고서
- 집행 내역 보고서

### 3. 검증 시스템
필요시 단계별 검증 추가:
- 조달 금액 vs 계획 금액 검증
- 계획 금액 vs 집행 금액 검증
- 예산 초과 경고

---

## 용어 정리

| 한글 | 영문 | 설명 |
|-----|------|-----|
| 조달 | Funding | 자금의 출처 (지원금, 기업부담금 등) |
| 계획 | Planning | 자금 사용 계획 (인건비, 재료비 등) |
| 집행 | Execution | 실제 사용 내역 (증빙 기반) |
| 인건비 | Personnel Cost | 참여연구원 급여 |
| 재료비 | Research Material Cost | 연구 재료 구입비 |
| 활동비 | Research Activity Cost | 연구 활동 비용 |
| 연구수당 | Research Stipend | 연구 수당 |
| 간접비 | Indirect Cost | 간접 비용 |
| 증빙 | Evidence | 지출 증거 자료 |
| 현금 | Cash | 현금 지급 |
| 현물 | In-Kind | 현물 지급 |

---

## 문의 및 기여

이 아키텍처에 대한 질문이나 제안이 있다면:
1. 관련 Hook 파일의 주석 확인
2. 이 문서 참조
3. 팀 리드에게 문의
