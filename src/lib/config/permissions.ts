/**
 * 권한 액션 정의
 * - 모든 권한 시스템에서 공통으로 사용하는 액션 타입
 * - enum으로 중앙 관리하여 타입 안전성 보장
 */

/**
 * 권한 액션
 *
 * 📍 현재 구현 상태 (2025-10-10):
 * - ✅ READ: 완전히 구현됨 (hooks.server.ts, permission.service.ts)
 * - ⏳ WRITE: 미구현 - TODO: API 수정 엔드포인트에서 체크 필요
 * - ⏳ DELETE: 미구현 - TODO: API 삭제 엔드포인트에서 체크 필요
 * - ⏳ APPROVE: 미구현 - TODO: 승인 워크플로우에서 체크 필요
 */
export enum PermissionAction {
  /** 읽기 권한 - 페이지 및 API 조회 (✅ 구현 완료) */
  READ = 'read',

  /** 쓰기 권한 - 데이터 수정 (⏳ TODO: API PUT/PATCH 엔드포인트에서 체크) */
  WRITE = 'write',

  /** 삭제 권한 - 데이터 삭제 (⏳ TODO: API DELETE 엔드포인트에서 체크) */
  DELETE = 'delete',

  /** 승인 권한 - 승인 프로세스 (⏳ TODO: 승인 워크플로우 구현 시 체크) */
  APPROVE = 'approve',
}

/**
 * 권한 범위
 */
export enum PermissionScope {
  /** 본인 데이터만 */
  OWN = 'own',

  /** 부서 내 데이터 */
  DEPARTMENT = 'department',

  /** 모든 데이터 */
  ALL = 'all',
}

/**
 * 권한 레벨 (UI 표시용)
 */
export enum PermissionLevel {
  /** 권한 없음 */
  NONE = 'none',

  /** 읽기만 가능 */
  READ = 'read',

  /** 전체 권한 (write/delete/approve 중 하나 이상) */
  FULL = 'full',
}

// ============================================
// 구현 가이드 및 TODO
// ============================================

/**
 * 🎯 권한 액션 구현 가이드
 *
 * 현재 시스템은 READ 액션만 완전히 구현되어 있습니다.
 * WRITE/DELETE/APPROVE 액션은 DB에 정의되어 있으나 실제로 체크되지 않습니다.
 *
 * ============================================
 * ✅ 현재 구현 완료
 * ============================================
 *
 * READ 액션:
 * - hooks.server.ts: 모든 페이지 라우트 접근 제어
 * - permission.service.ts: hasPermission() 메서드
 * - routes.ts: ROUTE_PERMISSIONS에 모든 라우트가 READ로 설정
 *
 * ============================================
 * ⏳ TODO: 구현 필요
 * ============================================
 *
 * 1. WRITE 액션 구현
 *    위치: API 수정 엔드포인트
 *    예시:
 *    ```typescript
 *    // src/routes/api/hr/employees/[id]/+server.ts
 *    export async function PUT({ locals, params, request }) {
 *      const canWrite = await permissionService.hasPermission(
 *        locals.user.id,
 *        Resource.HR_EMPLOYEES,
 *        PermissionAction.WRITE  // ← TODO: 구현!
 *      )
 *
 *      if (!canWrite) {
 *        throw error(403, '수정 권한이 없습니다')
 *      }
 *
 *      // ... update logic
 *    }
 *    ```
 *
 * 2. DELETE 액션 구현
 *    위치: API 삭제 엔드포인트
 *    예시:
 *    ```typescript
 *    // src/routes/api/hr/employees/[id]/+server.ts
 *    export async function DELETE({ locals, params }) {
 *      const canDelete = await permissionService.hasPermission(
 *        locals.user.id,
 *        Resource.HR_EMPLOYEES,
 *        PermissionAction.DELETE  // ← TODO: 구현!
 *      )
 *
 *      if (!canDelete) {
 *        throw error(403, '삭제 권한이 없습니다')
 *      }
 *
 *      // ... delete logic
 *    }
 *    ```
 *
 * 3. APPROVE 액션 구현
 *    위치: 승인 프로세스 (휴가 승인, 급여 승인 등)
 *    예시:
 *    ```typescript
 *    // src/routes/api/hr/leaves/[id]/approve/+server.ts
 *    export async function POST({ locals, params }) {
 *      const canApprove = await permissionService.hasPermission(
 *        locals.user.id,
 *        Resource.HR_LEAVES,
 *        PermissionAction.APPROVE  // ← TODO: 구현!
 *      )
 *
 *      if (!canApprove) {
 *        throw error(403, '승인 권한이 없습니다')
 *      }
 *
 *      // ... approve logic
 *    }
 *    ```
 *
 * ============================================
 * 📋 구현 체크리스트
 * ============================================
 *
 * WRITE 액션:
 * - [ ] API PUT/PATCH 엔드포인트에 권한 체크 추가
 *   - [ ] /api/hr/employees/[id]
 *   - [ ] /api/finance/transactions/[id]
 *   - [ ] /api/project/projects/[id]
 *   - [ ] /api/planner/initiatives/[id]
 * - [ ] UI에서 수정 버튼 권한 기반 표시
 * - [ ] routes.ts에 WRITE 권한 설정 추가 (필요 시)
 *
 * DELETE 액션:
 * - [ ] API DELETE 엔드포인트에 권한 체크 추가
 * - [ ] UI에서 삭제 버튼 권한 기반 표시
 * - [ ] 소프트 삭제 vs 하드 삭제 정책 결정
 *
 * APPROVE 액션:
 * - [ ] 승인 워크플로우 설계
 *   - [ ] 휴가 승인
 *   - [ ] 급여 승인
 *   - [ ] 예산 승인
 * - [ ] API 승인 엔드포인트에 권한 체크 추가
 * - [ ] UI에서 승인 버튼 권한 기반 표시
 *
 * ============================================
 * 🔗 관련 파일
 * ============================================
 *
 * - src/lib/config/routes.ts - 라우트 권한 설정
 * - src/lib/server/services/permission.service.ts - 권한 체크 로직
 * - src/lib/server/rbac/permission-matrix.ts - 권한 매트릭스
 * - src/hooks.server.ts - 라우트 가드
 * - src/lib/server/auth/permission-guard.ts - 권한 가드 유틸리티
 */
