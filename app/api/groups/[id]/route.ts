import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Group } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adapter = getAdapter();
  const group = await adapter.getGroup(id);
  if (!group) {
    const body: ApiResponse<Group> = { ok: false, error: { code: "not_found", message: `No seeded group with id "${id.slice(0, 40)}".` } };
    return NextResponse.json(body, { status: 404 });
  }
  const body: ApiResponse<Group> = { ok: true, data: group, source: adapter.mode };
  return NextResponse.json(body);
}
