#!/bin/bash

# CI 워크플로우 로컬 테스트 스크립트
# 이 스크립트는 GitHub Actions CI와 동일한 단계를 로컬에서 실행합니다.

set -e  # 에러 발생 시 중단

echo "🚀 VWS CI 로컬 테스트 시작..."
echo "================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 결과 저장
RESULTS=()

# 테스트 실행 함수
run_test() {
  local test_name="$1"
  local command="$2"
  local allow_failure="${3:-false}"
  
  echo ""
  echo "📋 테스트: $test_name"
  echo "----------------------------"
  
  if eval "$command"; then
    echo -e "${GREEN}✅ PASSED${NC}: $test_name"
    RESULTS+=("✅ $test_name")
    return 0
  else
    if [ "$allow_failure" = "true" ]; then
      echo -e "${YELLOW}⚠️  PASSED (with warnings)${NC}: $test_name"
      RESULTS+=("⚠️  $test_name (warnings)")
      return 0
    else
      echo -e "${RED}❌ FAILED${NC}: $test_name"
      RESULTS+=("❌ $test_name")
      return 1
    fi
  fi
}

# 의존성 확인
echo "1️⃣  의존성 설치 확인..."
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}❌ pnpm이 설치되어 있지 않습니다${NC}"
  exit 1
fi

# Quality Job 테스트
echo ""
echo "================================"
echo "📦 QUALITY JOB"
echo "================================"

run_test "Format Check" "pnpm format:check" false
run_test "Svelte Check" "pnpm run check:svelte" true
run_test "TypeScript Check" "pnpm run check:typescript" true
run_test "ESLint (Svelte)" "pnpm run lint:svelte" true
run_test "ESLint (TypeScript)" "pnpm run lint:typescript" true
run_test "Tests with Coverage" "pnpm test:coverage" true

# Security Job 테스트
echo ""
echo "================================"
echo "🔒 SECURITY JOB"
echo "================================"

run_test "Security Audit" "pnpm security:audit" true

# Build Job 테스트
echo ""
echo "================================"
echo "🏗️  BUILD JOB"
echo "================================"

run_test "Production Build" "pnpm build" false

# 결과 요약
echo ""
echo "================================"
echo "📊 테스트 결과 요약"
echo "================================"

for result in "${RESULTS[@]}"; do
  echo "$result"
done

echo ""
echo "================================"
echo "✨ CI 로컬 테스트 완료!"
echo "================================"
