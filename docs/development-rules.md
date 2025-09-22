# 개발 규칙 (Development Rules)

## 🚨 **중요: 임의 함수 추가 금지**

### 1. 날짜 처리 규칙

- **모든 날짜 관련 처리는 `src/lib/utils/date-calculator.ts`의 중앙화된 함수를 사용해야 합니다.**
- **절대로 새로운 날짜 포맷팅 함수를 임의로 추가하지 마세요.**

#### 허용되는 함수들:

- `formatDateForAPI(date)` - API 응답용 YYYY-MM-DD 형식
- `formatDateForKorean(date)` - 한국어 표시용 YYYY년 MM월 DD일 형식
- `calculateAnnualPeriod()` - 연차별 기간 계산
- `calculateParticipationPeriod()` - 참여기간 검증
- `isValidDate()` - 날짜 유효성 검증
- `isValidDateRange()` - 날짜 범위 유효성 검증

#### 금지되는 것들:

- `new Date().toISOString().split('T')[0]` - 직접 사용 금지
- `new Date().toLocaleDateString()` - 직접 사용 금지
- 임의의 날짜 포맷팅 함수 생성
- `formatDateForDisplayLegacy` 같은 임시 함수 생성

### 2. 급여 계산 규칙

- **모든 급여 관련 계산은 `src/lib/utils/salary-calculator.ts`의 중앙화된 함수를 사용해야 합니다.**
- **절대로 새로운 급여 계산 함수를 임의로 추가하지 마세요.**

#### 허용되는 함수들:

- `calculateMonthlySalary()` - 월간 급여 계산
- `calculateMonthlyFromAnnual()` - 연봉에서 월급 계산
- `calculateBudgetAllocation()` - 예산 배분 계산
- `normalizeSalaryAmount()` - 급여 금액 정규화

#### 금지되는 것들:

- `Math.round()` 직접 사용 (급여 계산에서)
- 임의의 급여 계산 로직 생성
- 각 파일마다 다른 급여 계산 방식 사용

### 3. 데이터 변환 규칙

- **모든 데이터 변환은 `src/lib/utils/api-data-transformer.ts`의 중앙화된 함수를 사용해야 합니다.**
- **절대로 새로운 데이터 변환 함수를 임의로 추가하지 마세요.**

#### 허용되는 함수들:

- `transformProjectData()` - 프로젝트 데이터 변환
- `transformProjectMemberData()` - 프로젝트 멤버 데이터 변환
- `transformEmployeeData()` - 직원 데이터 변환
- `transformArrayData()` - 배열 데이터 일괄 변환

### 4. 함수 추가 시 필수 절차

새로운 유틸리티 함수가 필요한 경우:

1. **기존 중앙화된 파일 확인**
   - `date-calculator.ts` (날짜 관련)
   - `salary-calculator.ts` (급여 관련)
   - `api-data-transformer.ts` (데이터 변환 관련)

2. **기존 함수로 해결 가능한지 검토**
   - 기존 함수의 파라미터 조정으로 해결 가능한지 확인
   - 기존 함수의 옵션 추가로 해결 가능한지 확인

3. **새 함수 추가 시 반드시 수행할 것**
   - 중앙화된 파일에 추가
   - JSDoc 문서화 필수
   - 사용 예제 추가
   - 단위 테스트 작성
   - 이 규칙 문서 업데이트

4. **임시 함수 생성 절대 금지**
   - `formatDateForDisplayLegacy` 같은 임시 함수 생성 금지
   - 각 파일마다 다른 로직 구현 금지
   - 중복된 기능의 함수 생성 금지

### 5. 코드 리뷰 체크리스트

코드 리뷰 시 다음 사항을 반드시 확인:

- [ ] 날짜 처리가 `date-calculator.ts` 함수를 사용하는가?
- [ ] 급여 계산이 `salary-calculator.ts` 함수를 사용하는가?
- [ ] 데이터 변환이 `api-data-transformer.ts` 함수를 사용하는가?
- [ ] 새로운 유틸리티 함수가 중앙화된 파일에 추가되었는가?
- [ ] 임시 함수나 중복 함수가 생성되지 않았는가?
- [ ] 모든 함수가 적절히 문서화되었는가?

### 6. 위반 시 조치

이 규칙을 위반한 코드는:

1. 즉시 리팩토링 요구
2. 중앙화된 함수로 교체
3. 임시 함수 제거
4. 코드 리뷰 재요청

### 7. 예외 사항

다음 경우에만 예외적으로 허용:

- 기존 중앙화된 함수에 버그가 있어 임시 수정이 필요한 경우
- 하지만 반드시 즉시 중앙화된 함수 수정 후 임시 코드 제거

---

**이 규칙을 준수하여 코드의 일관성과 유지보수성을 보장합니다.**
