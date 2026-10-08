import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getAllResponses } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(value: unknown) {
  let text = Array.isArray(value) ? value.join("; ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  if (/^[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  try {
    const rows = await getAllResponses();
    const columns = ["id", "created_at", "wave", "participant_code", "heard_news", "news_sources", "news_language", "environmental_issues", "waste_answers", "knowledge_score", "clean_actions", "waste_disposal", "separates_waste", "services_used", "barriers"] as const;
    const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => cell(row[key])).join(","))].join("\r\n");
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ecotool-research-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    console.error("CSV export failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not create the CSV export." }, { status: 503 });
  }
}
