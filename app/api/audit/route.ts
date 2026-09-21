import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit
 * Retrieves paginated audit logs with search and multi-criteria filtering.
 * Accessible to authenticated OMAG_STAFF and OMAG_HEAD.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const moduleParam = searchParams.get("module")?.trim() || "ALL";
  const actionParam = searchParams.get("action")?.trim() || "ALL";
  const recordIdParam = searchParams.get("recordId")?.trim() || "";
  const roleParam = searchParams.get("role")?.trim() || "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const where: Prisma.AuditLogWhereInput = {};

  if (moduleParam && moduleParam !== "ALL") {
    // Support prefix or exact matching if needed (e.g. PHOTO or PHOTO_VERIFICATION)
    where.module = {
      contains: moduleParam,
      mode: "insensitive",
    };
  }

  if (actionParam && actionParam !== "ALL") {
    where.action = actionParam;
  }

  if (recordIdParam) {
    where.recordId = recordIdParam;
  }

  if (roleParam && roleParam !== "ALL") {
    where.roleSnapshot = roleParam;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { module: { contains: search, mode: "insensitive" } },
      { recordId: { contains: search, mode: "insensitive" } },
      { roleSnapshot: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  try {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              username: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve audit trail." },
      { status: 500 }
    );
  }
}
