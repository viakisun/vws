# CI/CD 테스트 통합 및 개발 용어 가이드

**작성일**: 2025년 10월 6일

---

## 1. 🎯 CI에 테스트가 이미 포함되어 있습니다!

### 현재 CI 구조 (`.github/workflows/ci.yml`)

```yaml
jobs:
  quality:
    steps:
      - name: Run tests (if available)
        run: pnpm test:coverage || echo "No tests found, skipping test step"

      - name: 업로드(커버리지)
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
```

**현재 상태**: ✅ 테스트가 CI에 포함되어 실행 중

- 매 push/PR 시 자동 실행
- 커버리지 리포트 생성
- 실패 시 경고 (현재는 허용)

---

## 2. 📚 개발 용어: 이런 검증을 뭐라고 부를까?

### 2.1 전체 프로세스 이름

#### **CI/CD Pipeline Testing** (CI/CD 파이프라인 테스팅)

가장 일반적인 용어로, 지속적 통합 과정에서 자동으로 실행되는 모든 테스트를 의미합니다.

#### **Automated Testing in CI** (CI 자동화 테스트)

지속적 통합 환경에서 자동으로 실행되는 테스트를 강조하는 용어입니다.

---

### 2.2 테스트 레벨별 공식 용어

우리가 계획한 테스트들의 정식 개발 용어:

#### 🔷 **Unit Testing** (단위 테스트)

```
우리 계획의:
- Utils 테스트 (format, date-handler 등)
- 개별 함수/메서드 테스트

공식 정의:
개별 코드 단위(함수, 메서드, 클래스)의 동작을 검증하는 테스트
```

#### 🔷 **Integration Testing** (통합 테스트)

```
우리 계획의:
- 데이터베이스 연결 테스트
- API 엔드포인트 테스트
- 여러 모듈이 함께 동작하는 테스트

공식 정의:
여러 컴포넌트나 시스템이 올바르게 통합되어 작동하는지 검증하는 테스트
```

#### 🔷 **Component Testing** (컴포넌트 테스트)

```
우리 계획의:
- Svelte 컴포넌트 렌더링 테스트
- UI 인터랙션 테스트

공식 정의:
개별 UI 컴포넌트의 렌더링과 동작을 검증하는 테스트
```

#### 🔷 **E2E Testing** (End-to-End 테스트)

```
우리 계획의:
- 사용자 플로우 시나리오
- 로그인 → 대시보드 → 급여 조회 전체 흐름

공식 정의:
실제 사용자 관점에서 전체 시스템의 동작을 검증하는 테스트
```

#### 🔷 **Smoke Testing** (스모크 테스트)

```
의미:
- 빌드 후 기본 기능이 작동하는지 빠르게 확인
- "불이 나는지" 확인하는 테스트
- 핵심 기능만 빠르게 검증

예시:
- 앱이 시작되는가?
- 로그인이 되는가?
- 메인 페이지가 로드되는가?
```

#### 🔷 **Regression Testing** (회귀 테스트)

```
의미:
- 새로운 코드 변경이 기존 기능을 망가뜨리지 않았는지 확인
- 이전에 작동하던 기능이 여전히 작동하는지 검증

우리 계획에서:
- 모든 기존 테스트를 매번 실행 = 회귀 테스트
- CI에서 자동으로 실행
```

#### 🔷 **Acceptance Testing** (인수 테스트)

```
의미:
- 사용자/고객 요구사항을 충족하는지 검증
- 비즈니스 로직이 정확한지 확인

예시:
- 급여 계산이 정확한가?
- 권한 설정이 요구사항대로 동작하는가?
```

---

### 2.3 특수한 테스트 용어

#### 🔷 **Contract Testing** (계약 테스트)

```
의미: API 제공자와 소비자 간의 계약(스펙)을 검증

예시:
- API가 약속한 형식으로 응답하는가?
- 필수 필드가 모두 포함되는가?
```

#### 🔷 **Security Testing** (보안 테스트)

```
우리가 이미 하고 있는 것:
- Excel 보안 테스트 (23개)
- SQL Injection 방지
- XSS 방어
```

#### 🔷 **Performance Testing** (성능 테스트)

```
우리 CI의 Perf Job:
- Lighthouse CI
- 로딩 시간 측정
- 성능 벤치마크
```

---

## 3. 🏢 우리 프로젝트에 적용되는 공식 용어

### 3.1 전체 테스트 전략 이름

**"Comprehensive Test Automation Strategy"**  
(종합적 테스트 자동화 전략)

또는

**"Multi-Level Testing Strategy in CI/CD"**  
(CI/CD의 다단계 테스팅 전략)

### 3.2 각 Phase의 공식 명칭

```
Phase 1: Core Integration & Authentication Testing
         (핵심 통합 및 인증 테스트)

Phase 2: Database & Data Layer Testing
         (데이터베이스 및 데이터 계층 테스트)

Phase 3: Component & UI Testing
         (컴포넌트 및 UI 테스트)

Phase 4: End-to-End & User Journey Testing
         (E2E 및 사용자 여정 테스트)
```

---

## 4. 🔧 CI 개선: 테스트를 정식으로 강화하기

현재는 테스트 실패를 **허용**하고 있습니다. 이를 **필수로 강화**할 수 있습니다.

### 4.1 현재 상태 (Soft Enforcement)

```yaml
# 현재 - 실패해도 계속 진행
- name: Run tests (if available)
  run: pnpm test:coverage || echo "No tests found, skipping test step"
```

**문제점**:

- ❌ 테스트 실패해도 CI 통과
- ❌ 버그가 있어도 배포 가능
- ❌ 테스트의 실효성 낮음

### 4.2 개선안 1: 필수 테스트 (Hard Enforcement)

```yaml
# 개선안 - 테스트 필수 통과
- name: Run Unit Tests
  run: pnpm test

- name: Run Integration Tests
  run: pnpm test:integration

- name: Generate Coverage Report
  run: pnpm test:coverage

- name: Check Coverage Threshold
  run: |
    # 커버리지 70% 미만이면 실패
    pnpm test:coverage -- --coverage.threshold.lines=70
```

### 4.3 개선안 2: 단계별 테스트 Job 분리

```yaml
jobs:
  # 1단계: 빠른 테스트 (유닛)
  unit-tests:
    name: 🧪 Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: Run Unit Tests
        run: pnpm test:unit
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: unit-coverage
          path: coverage/

  # 2단계: 통합 테스트
  integration-tests:
    name: 🔗 Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests # 유닛 테스트 통과 후 실행
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: vws_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: Run Integration Tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/vws_test
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: integration-coverage
          path: coverage/

  # 3단계: E2E 테스트
  e2e-tests:
    name: 🎭 E2E Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - name: Run E2E Tests
        run: pnpm test:e2e
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # 4단계: 커버리지 병합 및 검증
  coverage-check:
    name: 📊 Coverage Check
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Download All Coverage
        uses: actions/download-artifact@v4
        with:
          path: coverage-reports/
      - name: Merge Coverage Reports
        run: pnpm exec nyc merge coverage-reports coverage/coverage-final.json
      - name: Check Coverage Thresholds
        run: |
          pnpm exec nyc check-coverage \
            --lines 75 \
            --functions 75 \
            --branches 70 \
            --statements 75
      - name: Generate HTML Report
        run: pnpm exec nyc report --reporter=html
      - name: Upload Merged Coverage
        uses: actions/upload-artifact@v4
        with:
          name: merged-coverage
          path: coverage/
```

---

## 5. 📋 Package.json 스크립트 추가

테스트를 분리해서 실행할 수 있도록 스크립트 추가:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/utils tests/stores",
    "test:integration": "vitest run tests/database tests/api",
    "test:component": "vitest run tests/components",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## 6. 🎯 테스트 품질 게이트 (Quality Gates)

### 6.1 필수 통과 조건 설정

```yaml
# .github/workflows/ci.yml에 추가
- name: Quality Gate - Test Coverage
  run: |
    coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$coverage < 75" | bc -l) )); then
      echo "❌ Coverage $coverage% is below threshold (75%)"
      exit 1
    fi
    echo "✅ Coverage $coverage% meets threshold"

- name: Quality Gate - Test Count
  run: |
    test_count=$(cat test-results.json | jq '.numTotalTests')
    if [ "$test_count" -lt 100 ]; then
      echo "⚠️  Only $test_count tests found (target: 100+)"
      exit 1
    fi
    echo "✅ $test_count tests passed"
```

---

## 7. 🏷️ 업계 표준 용어 정리

### 7.1 테스트 피라미드 (Test Pyramid)

```
      /\
     /E2E\      ← 적음 (느림, 비용 높음)
    /------\
   / 통합   \    ← 중간
  /----------\
 /   단위     \  ← 많음 (빠름, 비용 낮음)
/--------------\
```

**공식 용어**: "Test Pyramid" 또는 "Testing Pyramid Strategy"

### 7.2 CI/CD 용어

| 한글             | 영어                        | 약어 |
| ---------------- | --------------------------- | ---- |
| 지속적 통합      | Continuous Integration      | CI   |
| 지속적 배포      | Continuous Deployment       | CD   |
| 지속적 전달      | Continuous Delivery         | CD   |
| 테스트 자동화    | Test Automation             | TA   |
| 품질 게이트      | Quality Gate                | QG   |
| 코드 커버리지    | Code Coverage               | -    |
| 테스트 주도 개발 | Test-Driven Development     | TDD  |
| 행위 주도 개발   | Behavior-Driven Development | BDD  |

### 7.3 테스트 상태 용어

| 상태   | 영어           | 의미               |
| ------ | -------------- | ------------------ |
| 통과   | Passed/Passing | 테스트 성공        |
| 실패   | Failed/Failing | 테스트 실패        |
| 건너뜀 | Skipped        | 조건부로 실행 안됨 |
| 보류   | Pending        | 아직 구현 안됨     |
| 불안정 | Flaky          | 가끔 실패          |

---

## 8. 📊 우리 프로젝트의 정식 명칭 제안

### 제안 1: 공식 문서용

**"VWS Comprehensive Test Automation Framework"**  
(VWS 종합 테스트 자동화 프레임워크)

### 제안 2: 기술 문서용

**"Multi-Tiered Testing Strategy with CI/CD Integration"**  
(CI/CD 통합 다층 테스트 전략)

### 제안 3: 팀 내부용

**"VWS Quality Assurance Pipeline"**  
(VWS 품질 보증 파이프라인)

---

## 9. 🎓 이력서/포트폴리오 작성 시 사용할 수 있는 표현

```
✅ "Implemented comprehensive test automation strategy
   including unit, integration, and E2E testing"
   (단위, 통합, E2E 테스트를 포함한 종합 테스트 자동화 전략 구현)

✅ "Established CI/CD pipeline with automated testing,
   achieving 75% code coverage"
   (자동화된 테스트를 갖춘 CI/CD 파이프라인 구축, 75% 코드 커버리지 달성)

✅ "Built robust test framework with 150+ test cases
   covering critical business logic"
   (핵심 비즈니스 로직을 커버하는 150개 이상의 테스트 케이스로 견고한 테스트 프레임워크 구축)

✅ "Implemented quality gates in CI/CD pipeline to
   ensure code quality standards"
   (코드 품질 표준을 보장하기 위해 CI/CD 파이프라인에 품질 게이트 구현)
```

---

## 10. ✅ 결론 및 답변 요약

### Q1: CI에 정식으로 포함할 수 있나?

**A1**: ✅ **이미 포함되어 있습니다!**

- 현재: 테스트 실패 허용 (Soft)
- 개선: 필수 통과로 강화 가능 (Hard)
- 방법: 위 개선안 적용

### Q2: 이런 검증을 뭐라고 부르나?

**A2**: 공식 개발 용어는:

**전체 프로세스**:

- "CI/CD Pipeline Testing" (CI/CD 파이프라인 테스팅)
- "Test Automation Strategy" (테스트 자동화 전략)
- "Quality Assurance Pipeline" (품질 보증 파이프라인)

**개별 테스트**:

- Unit Testing (단위 테스트)
- Integration Testing (통합 테스트)
- Component Testing (컴포넌트 테스트)
- E2E Testing (End-to-End 테스트)
- Regression Testing (회귀 테스트)

---

## 다음 단계

1. **CI 강화 여부 결정**
   - Soft (현재) vs Hard (필수 통과)
2. **테스트 분리 여부**
   - 단일 Job vs 다중 Job

3. **품질 게이트 설정**
   - 커버리지 임계값
   - 최소 테스트 수

결정하시면 바로 CI 파일을 수정해드리겠습니다! 🚀
