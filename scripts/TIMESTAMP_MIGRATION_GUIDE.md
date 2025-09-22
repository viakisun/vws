# 프로젝트 멤버 날짜 컬럼 TIMESTAMP 마이그레이션 가이드

## 🎯 목적

`project_members` 테이블의 `start_date`와 `end_date` 컬럼을 `DATE` 타입에서
`TIMESTAMP WITH TIME ZONE` 타입으로 변경하여 UTC+9 타임존 정보를 보존하고 정확한 날짜 처리를
보장합니다.

## ⚠️ 문제 상황

- **현재 문제**: 9월 1일로 입력했는데 화면에 8월 31일로 표시되는 타임존 변환 문제
- **근본 원인**: `DATE` 타입은 타임존 정보를 저장하지 않아 UTC+9 → UTC 변환 시 날짜가 하루씩 밀림
- **해결책**: `TIMESTAMP WITH TIME ZONE` 타입으로 변경하여 타임존 정보 보존

## 📋 마이그레이션 절차

### 1. 백업 생성

```sql
-- 현재 데이터 백업
CREATE TABLE project_members_backup AS SELECT * FROM project_members;
CREATE TABLE projects_backup AS SELECT * FROM projects;
```

### 2. 마이그레이션 실행

```bash
# 마이그레이션 스크립트 실행
psql -d your_database -f scripts/migrate-project-members-dates-to-timestamp.sql
```

### 3. 데이터 검증

```sql
-- 마이그레이션 결과 확인
SELECT
    'project_members' as table_name,
    COUNT(*) as total_records,
    COUNT(start_date) as start_date_count,
    COUNT(end_date) as end_date_count
FROM project_members;

-- 샘플 데이터 확인
SELECT
    id,
    start_date,
    end_date,
    participation_rate
FROM project_members
LIMIT 5;
```

### 4. 애플리케이션 테스트

- 참여기간 수정 기능 테스트
- 날짜 표시 일관성 확인
- API 응답 검증

## 🔧 마이그레이션 상세 내용

### 변경되는 컬럼

| 테이블          | 컬럼       | 기존 타입 | 새 타입                  |
| --------------- | ---------- | --------- | ------------------------ |
| project_members | start_date | DATE      | TIMESTAMP WITH TIME ZONE |
| project_members | end_date   | DATE      | TIMESTAMP WITH TIME ZONE |
| projects        | start_date | DATE      | TIMESTAMP WITH TIME ZONE |
| projects        | end_date   | DATE      | TIMESTAMP WITH TIME ZONE |

### 데이터 변환 로직

```sql
-- 시작일: UTC+9 자정으로 변환
start_timestamp = (start_date || ' 00:00:00+09:00')::TIMESTAMP WITH TIME ZONE

-- 종료일: UTC+9 23:59:59로 변환
end_timestamp = (end_date || ' 23:59:59+09:00')::TIMESTAMP WITH TIME ZONE
```

### 인덱스 재구성

- 기존 유니크 인덱스 삭제 후 재생성
- 날짜 비교를 위한 함수형 인덱스 사용

## 🚀 애플리케이션 코드 변경

### API 엔드포인트 수정

```typescript
// 기존: DATE 타입으로 저장
updateFields.push(`start_date = $${paramIndex}`)
updateValues.push(formattedStartDate) // YYYY-MM-DD 문자열

// 수정: TIMESTAMP 타입으로 저장
const formattedStartDate = new Date(startDate + 'T00:00:00.000+09:00')
updateFields.push(`start_date = $${paramIndex}`)
updateValues.push(formattedStartDate) // Date 객체
```

### 날짜 포맷팅 함수 개선

```typescript
// Date 객체를 UTC+9 기준으로 해석하여 날짜 부분 추출
if (date instanceof Date) {
  const utcPlus9 = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const year = utcPlus9.getUTCFullYear()
  const month = String(utcPlus9.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utcPlus9.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

## 🧪 테스트 시나리오

### 1. 기본 기능 테스트

```javascript
// 테스트 케이스: 2024-09-01 입력
const testDate = '2024-09-01'

// 1. API 호출로 저장
const response = await fetch('/api/project-management/project-members/123', {
  method: 'PUT',
  body: JSON.stringify({ startDate: testDate, endDate: testDate })
})

// 2. 저장된 데이터 조회
const member = await fetch('/api/project-management/project-members/123')
const data = await member.json()

// 3. 표시되는 날짜 확인 (2024년 09월 01일이어야 함)
console.log(data.startDate) // 2024-09-01
console.log(formatDateForKorean(data.startDate)) // 2024년 09월 01일
```

### 2. 경계값 테스트

- `2024-01-01` (연초)
- `2024-12-31` (연말)
- `2024-02-29` (윤년)
- `2024-06-30` (월말)

### 3. 타임존 변환 테스트

```javascript
// UTC+9 자정 → UTC 변환 확인
const startTimestamp = new Date('2024-09-01T00:00:00.000+09:00')
console.log(startTimestamp.toISOString()) // 2024-08-31T15:00:00.000Z

// UTC+9 23:59:59 → UTC 변환 확인
const endTimestamp = new Date('2024-09-01T23:59:59.999+09:00')
console.log(endTimestamp.toISOString()) // 2024-09-01T14:59:59.999Z
```

## 🔄 롤백 절차

### 문제 발생 시 롤백

```bash
# 롤백 스크립트 실행
psql -d your_database -f scripts/rollback-project-members-dates-to-date.sql
```

### 롤백 후 확인

```sql
-- 원본 데이터 복원 확인
SELECT COUNT(*) FROM project_members;
SELECT COUNT(*) FROM project_members_backup;

-- 컬럼 타입 확인
\d project_members
```

## 📊 예상 효과

### Before (DATE 타입)

- 입력: `2024-09-01`
- 저장: `2024-09-01` (타임존 정보 없음)
- 표시: `2024년 08월 31일` ❌

### After (TIMESTAMP 타입)

- 입력: `2024-09-01`
- 저장: `2024-09-01T00:00:00.000+09:00`
- 표시: `2024년 09월 01일` ✅

## 🎉 마이그레이션 완료 후

### 확인 사항

1. ✅ 참여기간 수정 시 입력과 표시 날짜 일치
2. ✅ UTC+9 타임존 정보 보존
3. ✅ 기존 기능 정상 작동
4. ✅ 데이터 무결성 유지

### 추가 개선 사항

- 다른 날짜 관련 테이블도 동일한 방식으로 마이그레이션 검토
- 타임존 설정을 전역적으로 관리하는 설정 추가
- 날짜 관련 유틸리티 함수 표준화

이제 참여연구원의 참여기간을 정확하게 수정할 수 있습니다! 🚀
