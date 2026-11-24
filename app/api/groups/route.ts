import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, Group } from "@/lib/types";

// Seeded demo groups only. A real group lives in its link fragment and never reaches this route.
export async function GET() {
  const adapter = getAdapter();
  const body: ApiResponse<Group[]> = { ok: true, data: await adapter.listGroups(), source: adapter.mode };
  return NextResponse.json(body);
}
