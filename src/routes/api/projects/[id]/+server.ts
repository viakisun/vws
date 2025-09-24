import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { DatabaseService } from "$lib/database/connection";
import { logger } from "$lib/utils/logger";

// GET /api/projects/[id] - Get project by ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    const project = await DatabaseService.getProjectById(params.id);

    if (!project) {
      return error(404, { message: "Project not found" });
    }

    return json({
      success: true,
      data: project,
    });
  } catch (err) {
    logger.error("Get project error:", err);
    return error(500, { message: "Internal server error" });
  }
};

// PUT /api/projects/[id] - Update project
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const updateData = await request.json();
    const projectId = params.id;

    // Check if project exists
    const existingProject = await DatabaseService.getProjectById(projectId);
    if (!existingProject) {
      return error(404, { message: "Project not found" });
    }

    // Update project
    const result = await DatabaseService.query(
      `UPDATE projects 
			 SET title = COALESCE($1, title),
			     description = COALESCE($2, description),
			     sponsor = COALESCE($3, sponsor),
			     sponsor_type = COALESCE($4, sponsor_type),
			     start_date = COALESCE($5, start_date),
			     end_date = COALESCE($6, end_date),
			     manager_id = COALESCE($7, manager_id),
			     status = COALESCE($8, status),
			     budget_total = COALESCE($9, budget_total),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = $10
			 RETURNING *`,
      [
        updateData.title,
        updateData.description,
        updateData.sponsor,
        updateData.sponsor_type,
        updateData.start_date,
        updateData.end_date,
        updateData.manager_id,
        updateData.status,
        updateData.budget_total,
        projectId,
      ],
    );

    return json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    logger.error("Update project error:", err);
    return error(500, { message: "Internal server error" });
  }
};

// DELETE /api/projects/[id] - Delete project
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const projectId = params.id;

    // Check if project exists
    const existingProject = await DatabaseService.getProjectById(projectId);
    if (!existingProject) {
      return error(404, { message: "Project not found" });
    }

    // Check if project has associated data
    const expenseCount = await DatabaseService.query(
      "SELECT COUNT(*) as count FROM expense_items WHERE project_id = $1",
      [projectId],
    );

    if (parseInt(expenseCount.rows[0].count) > 0) {
      return error(400, {
        message: "Cannot delete project with associated expense items",
      });
    }

    // Delete project
    await DatabaseService.query("DELETE FROM projects WHERE id = $1", [
      projectId,
    ]);

    return json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err) {
    logger.error("Delete project error:", err);
    return error(500, { message: "Internal server error" });
  }
};
