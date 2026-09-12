import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  let dbStatus = "unknown";
  try {
    // Quick probe to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = `disconnected (${(error as Error).message})`;
  }

  return NextResponse.json({
    status: "ok",
    system: "OMAG Polomolok Agricultural Resource Distribution and Production Analytics System",
    phase: "Phase 0 Foundation",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
}
