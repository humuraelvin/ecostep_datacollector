import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
