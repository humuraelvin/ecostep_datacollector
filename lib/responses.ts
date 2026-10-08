import { getDatabase } from "@/lib/db";
import type { SurveyResponse } from "@/lib/types";

export async function getAllResponses(): Promise<SurveyResponse[]> {
  const db = getDatabase();
  const rows: SurveyResponse[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await db
      .from("research_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as SurveyResponse[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}
