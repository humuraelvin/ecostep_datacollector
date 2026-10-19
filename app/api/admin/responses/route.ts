import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getAllResponses } from "@/lib/responses";
import { getDatabase } from "@/lib/db";

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


export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Your admin session has expired. Sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A response ID is required." }, { status: 400 });
  }

  const id = body && typeof body === "object" ? (body as { id?: unknown }).id : undefined;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Choose a valid response to delete." }, { status: 400 });
  }

  try {
    const { data, error } = await getDatabase()
      .from("research_responses")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "That response was not found; the list may have changed." }, { status: 404 });
    return NextResponse.json({ ok: true, id: data.id }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    if (error && typeof error === "object") {
      const dbError = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
      console.error("Admin response delete failed", {
        message: typeof dbError.message === "string" ? dbError.message : undefined,
        code: typeof dbError.code === "string" ? dbError.code : undefined,
        details: typeof dbError.details === "string" ? dbError.details : undefined,
        hint: typeof dbError.hint === "string" ? dbError.hint : undefined,
      });
    } else {
      console.error("Admin response delete failed", error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json({ error: "This response could not be deleted. Please try again." }, { status: 503 });
  }
}
