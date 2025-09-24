import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { DatabaseService } from "$lib/database/connection";
import { logger } from "$lib/utils/logger";

// GET /api/companies - Get all companies
export const GET: RequestHandler = async ({ url }) => {
  try {
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const industry = url.searchParams.get("industry");
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");

    const companies = await DatabaseService.getCompanies({
      type: type || undefined,
      status: status || undefined,
      industry: industry || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return json({
      success: true,
      data: companies,
      count: companies.length,
    });
  } catch (err) {
    logger.error("Get companies error:", err);
    return error(500, { message: "Internal server error" });
  }
};

// POST /api/companies - Create new company
export const POST: RequestHandler = async ({ request }) => {
  try {
    const companyData = await request.json();

    // Validate required fields
    if (!companyData.name || !companyData.type) {
      return error(400, { message: "Company name and type are required" });
    }

    // Check if company name already exists
    const existingCompany = await DatabaseService.query(
      "SELECT id FROM companies WHERE name = $1",
      [companyData.name],
    );

    if (existingCompany.rows.length > 0) {
      return error(400, { message: "Company name already exists" });
    }

    const company = await DatabaseService.createCompany(companyData);

    return json(
      {
        success: true,
        data: company,
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error("Create company error:", err);
    return error(500, { message: "Internal server error" });
  }
};
