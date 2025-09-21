# 시간대 설정 가이드

이 애플리케이션은 다양한 시간대를 지원하며, 환경 변수를 통해 설정할 수 있습니다.

## 🕐 지원되는 시간대

- `Asia/Seoul` - 서울 (UTC+9) - **기본값**
- `Asia/Bangkok` - 방콕 (UTC+7)
- `Asia/Tokyo` - 도쿄 (UTC+9)
- `Asia/Shanghai` - 상하이 (UTC+8)
- `Asia/Singapore` - 싱가포르 (UTC+8)
- `UTC` - 협정 세계시 (UTC+0)
- `America/New_York` - 뉴욕 (UTC-5/-4)
- `Europe/London` - 런던 (UTC+0/+1)

## ⚙️ 설정 방법

### 1. 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```bash
# 기본 시간대 설정 (서울 시간대)
PUBLIC_DEFAULT_TIMEZONE=Asia/Seoul

# 방콕 시간대로 변경하려면:
# PUBLIC_DEFAULT_TIMEZONE=Asia/Bangkok

# UTC로 변경하려면:
# PUBLIC_DEFAULT_TIMEZONE=UTC
```

### 2. 설정 우선순위

1. **환경 변수** `PUBLIC_DEFAULT_TIMEZONE` (최우선)
2. **브라우저 로컬 시간대** (클라이언트에서만)
3. **기본값** `Asia/Seoul` (서울 시간대)

## 🔄 동작 방식

### 입력 처리

- 사용자가 입력한 날짜는 **설정된 시간대 기준**으로 해석됩니다
- 예: `2024-09-01` 입력 시
  - 서울 시간대: `2024-09-01T00:00:00+09:00`
  - 방콕 시간대: `2024-09-01T00:00:00+07:00`

### 저장 처리

- 모든 날짜는 **UTC로 변환**되어 데이터베이스에 저장됩니다
- 시간대 정보가 보존되어 정확한 변환이 가능합니다

### 조회 처리

- 저장된 UTC 날짜를 **설정된 시간대로 변환**하여 표시합니다
- 사용자는 항상 자신의 시간대 기준으로 날짜를 확인할 수 있습니다

## 📝 사용 예시

### 서울 시간대 (기본값)

```bash
PUBLIC_DEFAULT_TIMEZONE=Asia/Seoul
```

- 입력: `2024-09-01` → 저장: `2024-08-31T15:00:00.000Z` → 표시: `2024-09-01`

### 방콕 시간대

```bash
PUBLIC_DEFAULT_TIMEZONE=Asia/Bangkok
```

- 입력: `2024-09-01` → 저장: `2024-08-31T17:00:00.000Z` → 표시: `2024-09-01`

### UTC

```bash
PUBLIC_DEFAULT_TIMEZONE=UTC
```

- 입력: `2024-09-01` → 저장: `2024-09-01T00:00:00.000Z` → 표시: `2024-09-01`

## 🔧 개발자 정보

### 주요 파일

- `src/lib/utils/timezone-config.ts` - 시간대 설정 관리
- `src/lib/utils/date-handler.ts` - 날짜 처리 로직
- `env.example` - 환경 변수 예시

### 주요 함수

- `getCurrentTimezone()` - 현재 설정된 시간대 가져오기
- `toUTC()` - 설정된 시간대 → UTC 변환
- `formatDateForDisplay()` - UTC → 설정된 시간대 변환

## ✅ 검증 완료

모든 시간대에서 다음이 정확히 작동함을 확인했습니다:

- ✅ 날짜 입력 → 저장 → 조회 과정
- ✅ 시간대 변환 정확성
- ✅ 하드코딩 제거 완료
- ✅ 환경 변수 기반 설정
