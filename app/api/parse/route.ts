import { NextResponse } from "next/server";
import { parseConstraints, type ByokKey } from "@/lib/agent/parse-constraints";

export const runtime = "nodejs";

// Receives only the sentence the visitor typed (never the group link) and returns
// structured constraints. Nothing is stored. A visitor's own key may ride along per
// request and is used once, never logged.
export async function POST(req: Request) {
  let body: { text?: unknown; byok?: ByokKey };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with a text field." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.slice(0, 400) : "";
  if (!text.trim()) return NextResponse.json({ error: "Tell the agent where you are and what you need." }, { status: 400 });
  const byok = body.byok && typeof body.byok.key === "string" && body.byok.key ? body.byok : undefined;
  const result = await parseConstraints(text, byok);
  return NextResponse.json(result);
}
