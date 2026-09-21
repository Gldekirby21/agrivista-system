import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions/guards";
import { UpdateCoordinationSchema } from "@/features/pcic/validation/schemas";
import { updateCoordinationNotes } from "@/features/pcic/services/pcicService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/pcic/claims/[id]/coordination
 * Staff updates focal person coordination and adjuster follow-up notes.
 * Strictly restricted to OMAG_STAFF.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(["OMAG_STAFF"], request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateCoordinationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateCoordinationNotes(
      id,
      validated.data,
      auth.session.id,
      auth.session.role
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PATCH /api/pcic/claims/[id]/coordination error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update coordination notes" },
      { status: 400 }
    );
  }
}
