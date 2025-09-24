import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { DatabaseService } from "$lib/database/connection";
import { logger } from "$lib/utils/logger";

// GET /api/projects - Get all projects
export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get("status");
    const manager_id = url.searchParams.get("manager_id");
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    const projects = await DatabaseService.getProjects({
      status: status || undefined,
      manager_id: manager_id || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (err) {
    logger.error("Get projects error:", err);
    return error(500, { message: "Internal server error" });
  }
};

// POST /api/projects - Create new project
export const POST: RequestHandler = async ({ request }) => {
  try {
    const projectData = await request.json();

    // Validate required fields
    if (!projectData.code || !projectData.title) {
      return error(400, { message: "Project code and title are required" });
    }

    // Check if project code already exists
    const existingProject = await DatabaseService.query(
      "SELECT id FROM projects WHERE code = $1",
      [projectData.code],
    );

    if (existingProject.rows.length > 0) {
      return error(400, { message: "Project code already exists" });
    }

    const project = await DatabaseService.createProject(projectData);

    return json(
      {
        success: true,
        data: project,
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error("Create project error:", err);
    return error(500, { message: "Internal server error" });
  }
};
