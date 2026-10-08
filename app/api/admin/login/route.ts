import { NextResponse } from "next/server";
import { createAdminSession, credentialsAreConfigured, isDefaultProductionPassword, matchesAdminCredentials } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!credentialsAreConfigured() || isDefaultProductionPassword()) {
    return NextResponse.json({ error: "Admin sign-in is not configured for this deployment." }, { status: 503 });
  }
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || !matchesAdminCredentials(email, password)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sign-in could not be completed." }, { status: 400 });
  }
}
