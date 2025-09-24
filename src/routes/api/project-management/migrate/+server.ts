// Project Management Migration API
// 기존 projects 테이블에 컬럼 추가

import { query } from "$lib/database/connection";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

export const POST: RequestHandler = async () => {
  try {
    // 기존 projects 테이블에 컬럼 추가
    const migrationQueries = [
      // projects 테이블에 누락된 컬럼들 추가
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(255)`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3) DEFAULT 'KRW'`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS research_type VARCHAR(50)`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS technology_area VARCHAR(100)`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'`,

      // project_members 테이블에 contribution_type 컬럼 추가
      `ALTER TABLE project_members ADD COLUMN IF NOT EXISTS contribution_type VARCHAR(20) DEFAULT 'cash'`,

      // project_members 테이블에 계약 금액 관련 컬럼 추가
      // contract_amount 컬럼 제거됨 - 실제 근로계약서에서 조회
      `ALTER TABLE project_members ADD COLUMN IF NOT EXISTS monthly_amount DECIMAL(12,2) DEFAULT 0`,

      // 기존 컬럼들의 기본값 설정
      `ALTER TABLE projects ALTER COLUMN sponsor_type SET DEFAULT 'government'`,
      `ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'planning'`,
    ];

    // 트랜잭션으로 모든 쿼리 실행
    await query("BEGIN");

    try {
      // 마이그레이션 쿼리 실행
      for (const migrationQuery of migrationQueries) {
        await query(migrationQuery);
      }

      await query("COMMIT");

      return json({
        success: true,
        message:
          "프로젝트 관리 시스템 마이그레이션이 성공적으로 완료되었습니다.",
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logger.error("프로젝트 관리 시스템 마이그레이션 실패:", error);
    return json(
      {
        success: false,
        message: "프로젝트 관리 시스템 마이그레이션에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
};
