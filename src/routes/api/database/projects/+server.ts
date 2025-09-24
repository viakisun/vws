import { json } from "@sveltejs/kit";
import { DatabaseService } from "$lib/database/connection";
import type { RequestHandler } from "./$types";
import { logger } from "$lib/utils/logger";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status") || undefined;
    const manager_id = url.searchParams.get("manager_id") || undefined;

    const projects = await DatabaseService.getProjects({
      status,
      manager_id,
      limit,
      offset,
    });

    return json({
      success: true,
      data: projects,
      pagination: {
        limit,
        offset,
        total: projects.length,
      },
    });
  } catch (error) {
    logger.error("Get projects error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const projectData = await request.json();

    const newProject = await DatabaseService.createProject(projectData);

    return json(
      {
        success: true,
        data: newProject,
        message: "Project created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Create project error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
