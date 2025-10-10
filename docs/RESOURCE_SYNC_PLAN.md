# 리소스 자동 동기화 시스템 구축 계획 📋

## 🎯 목표

**Single Source of Truth**: `resources.ts`에서 리소스를 정의하면 DB가 자동으로 동기화

### 현재 문제

- ❌ resources.ts와 DB가 불일치
- ❌ 새 페이지 추가 시 2곳 수정 필요 (코드 + DB)
- ❌ 수동 동기화로 인한 실수 가능성

### 목표 상태

- ✅ resources.ts만 수정하면 모든 것이 자동 동기화
- ✅ 타입 안전성 유지
- ✅ 하드코딩 제거
- ✅ 안전한 마이그레이션

---

## 📐 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  resources.ts (Single Source of Truth)                     │
│  - 모든 리소스 정의                                          │
│  - TypeScript 타입 안전성                                    │
│  - Git으로 버전 관리                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  sync-resources-to-db.ts (동기화 스크립트)                  │
│  1. resources.ts 읽기                                        │
│  2. DB와 비교                                                │
│  3. 누락된 권한 자동 추가                                     │
│  4. ADMIN에게 자동 할당                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                      │
│  - permissions 테이블 (자동 업데이트)                        │
│  - role_permissions 테이블 (자동 할당)                       │
│  - permission_cache 테이블 (자동 무효화)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: resources.ts 정리 및 수정

### 목표

- DB와 일치시키기
- 누락된 리소스 추가
- 명칭 통일

### 작업 내역

#### 1.1 명칭 불일치 수정

```typescript
// BEFORE
{
  key: 'salary',  // ❌ DB는 'salary.management'
}

// AFTER
{
  key: 'salary',  // 부모 리소스 (UI용)
  children: [
    {
      key: 'salary.management',  // ✅ DB와 일치
      nameKo: '급여 관리',
    }
  ]
}
```

#### 1.2 누락된 시스템 리소스 추가

```typescript
{
  key: 'admin.permissions',
  nameKo: '권한 관리',
  children: [
    {
      key: 'system.users',      // ✅ DB에 있음
      nameKo: '사용자 관리',
    },
    {
      key: 'system.roles',      // ✅ DB에 있음
      nameKo: '역할 관리',
    },
  ]
}
```

#### 1.3 누락된 공통 리소스 추가

```typescript
{
  key: 'common.profile',        // ✅ DB에 있음
  nameKo: '프로필',
  showInMatrix: false,
  showInNav: false,
}
```

### 예상 결과

```typescript
// 수정 전: 14개 최상위 리소스
// 수정 후: 15개 최상위 리소스
// + DB와 완벽히 일치
```

---

## 📋 Phase 2: 검증 스크립트 작성

### 파일: `scripts/validate-resources.ts`

#### 목적

- resources.ts와 DB의 불일치 감지
- CI/CD에서 자동 검증
- 개발자에게 경고 제공

#### 기능

1. **리소스 비교**
   - resources.ts의 모든 리소스 키 추출
   - DB의 모든 resource 추출
   - 차이점 리포트

2. **검증 규칙**
   - ✅ 모든 리소스 키가 DB에 존재하는가?
   - ✅ DB의 모든 resource가 resources.ts에 정의되어 있는가?
   - ✅ 부모-자식 관계가 올바른가?

3. **출력 형식**

   ```
   🔍 Validating resources...

   ✅ All resources match!

   📊 Statistics:
   - resources.ts: 35 resources
   - DB permissions: 56 permissions
   - Matched: 35
   - Missing in DB: 0
   - Missing in resources.ts: 0
   ```

#### 사용법

```bash
npm run validate-resources
# 또는
npm run validate  # pre-commit hook
```

---

## 📋 Phase 3: 동기화 스크립트 작성

### 파일: `scripts/sync-resources-to-db.ts`

#### 목적

- resources.ts → DB 자동 동기화
- 안전한 권한 추가
- ADMIN 자동 할당

#### 핵심 로직

##### 3.1 리소스 추출

```typescript
function extractAllResources(resources: ResourceDefinition[]): string[] {
  const keys: string[] = []

  function extract(resource: ResourceDefinition) {
    // 부모 리소스는 showInMatrix나 실제 권한이 있을 때만
    if (resource.route || resource.showInMatrix) {
      keys.push(resource.key)
    }

    // 하위 리소스 추출
    if (resource.children) {
      resource.children.forEach((child) => {
        keys.push(child.key)
        if (child.children) {
          extract(child)
        }
      })
    }
  }

  resources.forEach(extract)
  return keys
}
```

##### 3.2 권한 자동 생성 (액션별)

```typescript
async function syncResourceToDB(resourceKey: string, resource: ResourceDefinition) {
  const actions = ['read', 'write', 'delete', 'approve']

  for (const action of actions) {
    const code = `${resourceKey}.${action}`

    await db.query(
      `
      INSERT INTO permissions (code, resource, action, description, scope, is_active)
      VALUES ($1, $2, $3, $4, 'all', true)
      ON CONFLICT (code) DO UPDATE 
      SET 
        description = EXCLUDED.description,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
    `,
      [code, resourceKey, action, `${resource.nameKo} ${getActionName(action)}`],
    )
  }
}

function getActionName(action: string): string {
  const map = {
    read: '조회',
    write: '수정',
    delete: '삭제',
    approve: '승인',
  }
  return map[action] || action
}
```

##### 3.3 ADMIN 자동 할당

```typescript
async function assignToAdmin(resourceKey: string) {
  await db.query(
    `
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 
      (SELECT id FROM roles WHERE code = 'ADMIN'),
      p.id
    FROM permissions p
    WHERE p.resource = $1
      AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
          AND rp.permission_id = p.id
      )
  `,
    [resourceKey],
  )
}
```

##### 3.4 캐시 무효화

```typescript
async function invalidateCache() {
  await db.query('DELETE FROM permission_cache')
  console.log('✅ Permission cache cleared')
}
```

#### 안전 장치

1. **Dry Run 모드**

   ```bash
   npm run sync-resources -- --dry-run
   # 실제 변경 없이 미리보기만
   ```

2. **트랜잭션 사용**

   ```typescript
   await db.query('BEGIN')
   try {
     // 모든 동기화 작업
     await db.query('COMMIT')
   } catch (error) {
     await db.query('ROLLBACK')
     throw error
   }
   ```

3. **백업 권장**
   ```typescript
   console.log('⚠️  백업을 권장합니다:')
   console.log('pg_dump -t permissions -t role_permissions > backup.sql')
   ```

---

## 📋 Phase 4: Migration 생성 스크립트

### 파일: `scripts/generate-migration.ts`

#### 목적

- 동기화 결과를 Migration 파일로 생성
- 프로덕션 배포용
- 버전 관리 가능

#### 기능

```typescript
async function generateMigration() {
  const changes = await compareResourcesWithDB()

  if (changes.length === 0) {
    console.log('✅ No changes needed')
    return
  }

  const migrationNumber = getNextMigrationNumber()
  const filename = `migrations/${migrationNumber}_sync_resources.sql`

  const sql = `
-- =============================================
-- Auto-generated migration from resources.ts
-- Generated: ${new Date().toISOString()}
-- =============================================

BEGIN;

${changes.map((change) => generateSQL(change)).join('\n\n')}

-- ADMIN에게 새 권한 자동 할당
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  p.id
FROM permissions p
WHERE p.code IN (${changes.map((c) => `'${c.code}'`).join(', ')})
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE code = 'ADMIN')
      AND rp.permission_id = p.id
  );

-- 권한 캐시 무효화
DELETE FROM permission_cache;

COMMIT;
  `

  fs.writeFileSync(filename, sql)
  console.log(`✅ Migration created: ${filename}`)
}
```

---

## 📋 Phase 5: package.json 스크립트 추가

```json
{
  "scripts": {
    "validate-resources": "tsx scripts/validate-resources.ts",
    "sync-resources": "tsx scripts/sync-resources-to-db.ts",
    "sync-resources:dry": "tsx scripts/sync-resources-to-db.ts --dry-run",
    "generate-migration": "tsx scripts/generate-migration.ts",
    "resources": "npm run validate-resources && npm run sync-resources"
  }
}
```

---

## 📋 Phase 6: Git Hooks 설정

### pre-commit hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Validating resources..."
npm run validate-resources

if [ $? -ne 0 ]; then
  echo "❌ Resource validation failed!"
  echo "Run 'npm run sync-resources' to fix"
  exit 1
fi
```

---

## 🚀 사용 워크플로우

### 개발 환경

#### 1. 새 페이지 추가

```bash
# 1. resources.ts 수정
vim src/lib/config/resources.ts

# 2. 검증
npm run validate-resources

# 3. 로컬 DB 동기화
npm run sync-resources

# 4. 테스트
npm run dev

# 5. 커밋
git add .
git commit -m "feat: add marketing page"
```

#### 2. 프로덕션 배포

```bash
# 1. Migration 생성
npm run generate-migration

# 2. Migration 파일 검토
vim migrations/017_sync_resources.sql

# 3. 커밋
git add migrations/
git commit -m "chore: sync resources migration"

# 4. 배포 시 자동 실행
# (CI/CD에서 migration 자동 실행)
```

---

## 📊 예상 효과

### Before (현재)

```
새 페이지 추가 시:
1. resources.ts 수정 (5분)
2. migration SQL 작성 (10분)
3. DB 스키마 확인 (5분)
4. 권한 할당 SQL 작성 (10분)
5. 테스트 (10분)
---
총 40분 소요 + 실수 가능성 높음
```

### After (자동화)

```
새 페이지 추가 시:
1. resources.ts 수정 (5분)
2. npm run sync-resources (자동)
3. 테스트 (5분)
---
총 10분 소요 + 실수 방지
```

### 효과

- ⏱️ **시간 75% 단축**
- ✅ **실수 제로**
- 🔒 **타입 안전성 보장**
- 📝 **자동 문서화**

---

## 🔒 안전 체크리스트

### 동기화 전

- [ ] resources.ts 검증 완료
- [ ] 로컬 DB 백업 완료
- [ ] Dry run으로 미리보기 확인
- [ ] 변경 사항 리뷰 완료

### 동기화 중

- [ ] 트랜잭션 사용
- [ ] 에러 발생 시 롤백
- [ ] 로그 기록

### 동기화 후

- [ ] 권한 매트릭스 확인
- [ ] 테스트 사용자로 접근 테스트
- [ ] Migration 파일 생성
- [ ] Git 커밋

---

## 📁 파일 구조

```
vws/
├── src/lib/config/
│   └── resources.ts              (Single Source of Truth)
├── scripts/
│   ├── validate-resources.ts     (검증 스크립트)
│   ├── sync-resources-to-db.ts   (동기화 스크립트)
│   └── generate-migration.ts     (Migration 생성)
├── migrations/
│   └── 017_sync_resources.sql    (자동 생성 Migration)
├── docs/
│   ├── RESOURCE_MAPPING_ANALYSIS.md
│   └── RESOURCE_SYNC_PLAN.md     (이 문서)
└── package.json                  (스크립트 정의)
```

---

## 🎯 구현 순서

### Week 1

- [x] Phase 1: resources.ts 정리 (2시간)
- [ ] Phase 2: 검증 스크립트 (3시간)
- [ ] Phase 2 테스트 (1시간)

### Week 2

- [ ] Phase 3: 동기화 스크립트 (4시간)
- [ ] Phase 3 테스트 (2시간)
- [ ] Phase 4: Migration 생성 (2시간)

### Week 3

- [ ] Phase 5: package.json 설정 (30분)
- [ ] Phase 6: Git Hooks 설정 (30분)
- [ ] 통합 테스트 (3시간)
- [ ] 문서 작성 (2시간)

### 총 예상 시간: 20시간

---

## 🎉 완료 기준

- [ ] resources.ts와 DB가 100% 일치
- [ ] 검증 스크립트 통과
- [ ] 동기화 스크립트 안정 동작
- [ ] Migration 자동 생성 가능
- [ ] Git hooks 정상 작동
- [ ] 문서 완료
- [ ] 팀 교육 완료

---

**준비되셨나요? 바로 시작하겠습니다!** 🚀
