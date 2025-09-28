// src/lib/types/reactivity.ts

// 금지된 패턴 타입
type ForbiddenEffect = {
  $effect: (callback: () => void) => void
}

// 권장 패턴 타입
type RecommendedReactivity = {
  $state: <T>(initial: T) => T
  handleChange: () => void
  updateData: () => void
}

// 컴포넌트 인터페이스 강제
interface ComponentReactivity {
  // 필수 메서드
  handleFilterChange(): void
  updateFilteredData(): void

  // 금지된 메서드 (타입 에러 발생)
  forbiddenEffect?: never
}

// 유틸리티 타입으로 검증
type ValidateReactivity<T> = T extends ComponentReactivity
  ? T
  : '컴포넌트는 handleFilterChange와 updateFilteredData 메서드를 구현해야 합니다'

// 사용 예시
type ValidComponent = ValidateReactivity<{
  handleFilterChange(): void
  updateFilteredData(): void
}> // ✅ 유효

type InvalidComponent = ValidateReactivity<{
  $effect: () => void
}> // ❌ 타입 에러
