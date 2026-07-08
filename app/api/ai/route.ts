/**
 * /api/ai — the (currently disabled) AI endpoint.
 *
 * GET  — { enabled: false } until the owner sets AI_API_KEY (see lib/ai.ts).
 *        The post form checks this to decide whether the ✨ button is live.
 * POST — will return suggested instructions once lib/ai.ts is filled in.
 *
 * To enable AI: follow the step-by-step comments at the top of lib/ai.ts.
 * No other file needs to change.
 */
import { NextResponse } from "next/server";
import { aiEnabled, suggestInstructions } from "@/lib/ai";

export async function GET() {
  return NextResponse.json({ enabled: aiEnabled() });
}

export async function POST(request: Request) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI features are not enabled yet. See lib/ai.ts to turn them on." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const suggestion = await suggestInstructions(
    String(body?.code ?? ""),
    Array.isArray(body?.parts) ? body.parts : []
  );

  return NextResponse.json({ suggestion });
}
