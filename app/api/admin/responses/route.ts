import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getAllResponses } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  try {
    const responses = await getAllResponses();
    return NextResponse.json({ responses }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    // Supabase/PostgREST errors are plain objects, not always Error instances.
    // Log their safe diagnostic fields so a 503 can be traced from the server log.
    if (error && typeof error === "object") {
      const dbError = error as { name?: unknown; message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
      console.error("Admin response load failed", {
        name: typeof dbError.name === "string" ? dbError.name : undefined,
        message: typeof dbError.message === "string" ? dbError.message : undefined,
        code: typeof dbError.code === "string" ? dbError.code : undefined,
        details: typeof dbError.details === "string" ? dbError.details : undefined,
        hint: typeof dbError.hint === "string" ? dbError.hint : undefined,
      });
    } else {
      console.error("Admin response load failed", error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json({ error: "Could not load research data. Check the database setup." }, { status: 503 });
  }
}
