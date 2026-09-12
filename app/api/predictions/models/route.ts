import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions/guards";
import { prisma } from "@/lib/database/prisma";
import { getOrSyncActiveModelRegistry } from "@/features/yield-loss/services/predictionService";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  // Ensure active model is synchronized with ML service
  await getOrSyncActiveModelRegistry();

  const models = await prisma.mlModelRegistry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  });

  return NextResponse.json({
    models,
    classification: "🟡 PROPOSED SYSTEM DESIGN",
    disclaimer: "Regression metrics (MAE, RMSE, R²) were evaluated on a dedicated test split. Synthetic data metrics must not be interpreted as official OMAG operational accuracy.",
  });
}
