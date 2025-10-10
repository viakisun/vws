# 연구원 권한 업데이트 완료

## 📋 업데이트 내용

### 연구원(RESEARCHER) 권한 구성

#### 1. 기본 권한 (6개)
```sql
✓ common.dashboard.read       -- 대시보드 조회
✓ common.profile.read          -- 개인 프로필 조회
✓ common.profile.write         -- 개인 프로필 수정
✓ hr.payslips.read.own         -- 본인 급여명세서 조회
✓ hr.attendance.read.own       -- 본인 근태 조회
✓ hr.leaves.read.own           -- 본인 연차 조회
```

#### 2. 플래너 권한 (15개)
```sql
✓ planner.products.*           -- 제품 관리 (read, write, delete)
✓ planner.initiatives.*        -- 이니셔티브 관리 (read, write, delete)
✓ planner.threads.*            -- 스레드 관리 (read, write, delete)
✓ planner.formations.*         -- 포메이션 관리 (read, write, delete)
✓ planner.milestones.*         -- 마일스톤 관리 (read, write, delete)
```

**총 권한: 21개**

## 🎯 역할별 플래너 권한

| 역할 | 플래너 권한 | 설명 |
|------|-------------|------|
| **연구원** | ✓ **전체** | read, write, delete 모두 가능 |
| **연구소장** | ✓ **전체** | read, write, delete 모두 가능 |
| **관리자** | ✓ **전체** | read, write, delete 모두 가능 |
| **경영관리자** | ⚠️ **읽기** | read만 가능 (조회만) |
| **일반직원** | ✗ **없음** | 접근 불가 |

## 📊 예상 권한 매트릭스

```
역할         | 플래너  | 프로젝트 | 총권한
-------------+---------+----------+--------
관리자       | ✓ 전체  | ✓ 전체   |  55+
경영관리자   | ⚠ 읽기  | ⚠ 읽기   |  25+
연구소장     | ✓ 전체  | ✓ 전체   |  20+
연구원       | ✓ 전체  | ✗ 없음   |  21
일반직원     | ✗ 없음  | ✗ 없음   |   6
```

## 🚀 실행된 마이그레이션

### 1. `migrations/004_fix_researcher_permissions.sql`
- 연구원 기존 권한 제거
- 기본 공통 권한 6개 추가
- 플래너 전체 권한 15개 추가
- 권한 캐시 무효화

### 2. `migrations/005_add_planner_to_all_roles.sql`
- ADMIN: 플래너 전체 권한 추가
- MANAGEMENT: 플래너 읽기 권한 추가
- RESEARCH_DIRECTOR: 플래너 전체 권한 추가
- 전체 권한 캐시 무효화

## ✅ 확인 방법

### 터미널에서 확인
```bash
psql -h your-db -U postgres -d postgres -f scripts/verify-permissions.sql
```

### 웹에서 확인
1. 관리자로 로그인
2. `/admin/permissions` 접속
3. "권한 매트릭스" 탭 확인
4. 연구원 행에서:
   - 플래너: ✓ (녹색 체크)
   - 프로젝트: ✗ (회색 X)

### 연구원 계정으로 테스트
```bash
# 연구원 계정으로 로그인 후
1. /planner 접근 → ✅ 가능
2. /planner/products → ✅ 가능
3. /planner/initiatives → ✅ 가능
4. 제품 생성 → ✅ 가능
5. /project-management → ❌ 불가
```

## 🔍 연구원이 할 수 있는 것

### ✅ 가능
- 대시보드 보기
- 개인 프로필 수정
- 본인 급여명세서, 근태, 연차 조회
- **플래너 전체 기능**
  - 제품 생성/수정/삭제
  - 이니셔티브 생성/수정/삭제
  - 스레드 생성/수정/삭제
  - 포메이션 생성/수정/삭제
  - 마일스톤 생성/수정/삭제

### ❌ 불가능
- 프로젝트 관리 (제거됨)
- 재무 관리
- 인사 관리 (본인 것 제외)
- 영업 관리
- 시스템 관리

## 📝 변경 이력

| 날짜 | 변경사항 |
|------|----------|
| 2025-10-10 | 플래너 권한 15개 생성 |
| 2025-10-10 | 연구원 기본 권한 6개 추가 |
| 2025-10-10 | 연구원 플래너 전체 권한 부여 |
| 2025-10-10 | 전체 역할에 플래너 권한 매핑 |

## 🎉 완료!

연구원이 이제 플래너를 완전히 사용할 수 있습니다!
