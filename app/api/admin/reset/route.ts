import { NextResponse } from "next/server";
import { isAdmin, matchesAdminCredentials } from "@/lib/session";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRMATION_PHRASE = "DELETE ALL RESPONSES";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Your admin session has expired. Sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid confirmation is required." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A valid confirmation is required." }, { status: 400 });
  }

  const confirmation = (body as { confirmation?: unknown }).confirmation;
  const password = (body as { password?: unknown }).password;
  const acknowledged = (body as { acknowledged?: unknown }).acknowledged;
  if (acknowledged !== true) {
    return NextResponse.json({ error: "Acknowledge that this deletion is permanent before continuing." }, { status: 400 });
  }
  if (confirmation !== CONFIRMATION_PHRASE) {
    return NextResponse.json({ error: `Type ${CONFIRMATION_PHRASE} exactly to confirm.` }, { status: 400 });
  }
  if (typeof password !== "string" || !matchesAdminCredentials(process.env.ADMIN_EMAIL ?? "", password)) {
    return NextResponse.json({ error: "The admin password was not correct." }, { status: 401 });
  }

  try {
    const { count, error } = await getDatabase()
      .from("research_responses")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (error) throw error;
    return NextResponse.json(
      { ok: true, deletedCount: count ?? 0 },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    if (error && typeof error === "object") {
      const dbError = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
      console.error("Admin data reset failed", {
        message: typeof dbError.message === "string" ? dbError.message : undefined,
        code: typeof dbError.code === "string" ? dbError.code : undefined,
        details: typeof dbError.details === "string" ? dbError.details : undefined,
        hint: typeof dbError.hint === "string" ? dbError.hint : undefined,
      });
    } else {
      console.error("Admin data reset failed", error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json({ error: "The survey data could not be reset. No reset was reported as successful." }, { status: 503 });
  }
}
