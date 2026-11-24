import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { apiError } from "@/lib/errors";
import type { ApiResponse, Group } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = getAdapter();
  const group = await adapter.getGroup(id);
  if (!group) {
    const safeId = id.slice(0, 40).replace(/[^a-z0-9-]/gi, "");
    const body: ApiResponse<Group> = {
      ok: false,
      ...apiError("invalid_input", `No seeded group with id "${safeId}". Try friday-supper or sunday-brunch.`),
    };
    return NextResponse.json(body, { status: 404 });
  }
  const body: ApiResponse<Group> = { ok: true, data: group, source: adapter.mode };
  return NextResponse.json(body);
}
