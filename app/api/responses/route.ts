import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = {
  wave: ["baseline", "follow_up"],
  news_sources: ["radio", "television", "social_media", "community_meeting", "family_friends", "other", "none"],
  news_language: ["kinyarwanda", "english", "other"],
  environmental_issues: ["flooding", "drought", "soil_erosion", "heat", "waste_pollution", "none", "not_sure"],
  clean_actions: ["separate_waste", "use_collection", "compost", "reduce_litter", "burn_waste", "dump_openly", "not_sure"],
  waste_disposal: ["collection", "compost", "bushes_fields", "burn", "waterway", "other", "not_sure"],
  separates_waste: ["often", "sometimes", "no", "not_sure"],
  services_used: ["collection", "recycling", "composting", "none", "not_sure"],
  barriers: ["no_collection", "no_bins", "unsure_about_waste", "distance", "cost", "time", "none", "other"],
} as const;

type ChoiceKey = keyof typeof allowed;
function isChoice<K extends ChoiceKey>(key: K, value: unknown): value is (typeof allowed)[K][number] {
  return typeof value === "string" && (allowed[key] as readonly string[]).includes(value);
}
function isChoices<K extends ChoiceKey>(key: K, value: unknown): value is (typeof allowed)[K][number][] {
  return Array.isArray(value) && value.length <= 10 && value.every((item) => isChoice(key, item));
}

const wasteKeys = ["food_scraps", "leaves", "plastic_bottle", "glass", "metal"] as const;
const correctWaste: Record<(typeof wasteKeys)[number], string> = {
  food_scraps: "biodegradable",
  leaves: "biodegradable",
  plastic_bottle: "non_biodegradable",
  glass: "non_biodegradable",
  metal: "non_biodegradable",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.consent !== true) return NextResponse.json({ error: "Consent is required." }, { status: 400 });
    if (body.resident_confirmed !== true) return NextResponse.json({ error: "This survey is for residents of the local community." }, { status: 400 });
    if (!isChoice("wave", body.wave)) {
      return NextResponse.json({ error: "Please choose the survey round." }, { status: 400 });
    }
    if (typeof body.participant_code !== "string" || !/^[A-Z0-9]{6,10}$/.test(body.participant_code)) {
      return NextResponse.json({ error: "Please enter the participant code." }, { status: 400 });
    }
    if (typeof body.heard_news !== "boolean" || !isChoices("news_sources", body.news_sources) || body.news_sources.length === 0 || !isChoice("news_language", body.news_language)) {
      return NextResponse.json({ error: "Please complete the news questions." }, { status: 400 });
    }
    if (!isChoices("environmental_issues", body.environmental_issues) || body.environmental_issues.length === 0 || !isChoices("clean_actions", body.clean_actions) || body.clean_actions.length === 0) {
      return NextResponse.json({ error: "Please complete the environmental questions." }, { status: 400 });
    }
    if (!body.waste_answers || typeof body.waste_answers !== "object" || Array.isArray(body.waste_answers)) {
      return NextResponse.json({ error: "Please complete the waste picture questions." }, { status: 400 });
    }
    const wasteAnswers: Record<string, string> = {};
    for (const key of wasteKeys) {
      const answer = body.waste_answers[key];
      if (answer !== "biodegradable" && answer !== "non_biodegradable" && answer !== "not_sure") {
        return NextResponse.json({ error: "Please answer each waste picture question." }, { status: 400 });
      }
      wasteAnswers[key] = answer;
    }
    if (!isChoice("waste_disposal", body.waste_disposal) || !isChoice("separates_waste", body.separates_waste) ||
        !isChoices("services_used", body.services_used) || body.services_used.length === 0 || !isChoices("barriers", body.barriers) || body.barriers.length === 0) {
      return NextResponse.json({ error: "Please complete the household practice questions." }, { status: 400 });
    }

    const knowledgeScore = wasteKeys.reduce((score, key) => score + (wasteAnswers[key] === correctWaste[key] ? 1 : 0), 0);
    const { data, error } = await getDatabase().from("research_responses").insert({
      wave: body.wave,
      participant_code: body.participant_code,
      resident_confirmed: body.resident_confirmed,
      heard_news: body.heard_news,
      news_sources: body.news_sources,
      news_language: body.news_language,
      environmental_issues: body.environmental_issues,
      waste_answers: wasteAnswers,
      clean_actions: body.clean_actions,
      waste_disposal: body.waste_disposal,
      separates_waste: body.separates_waste,
      services_used: body.services_used,
      barriers: body.barriers,
      knowledge_score: knowledgeScore,
    }).select("id").single();
    if (error?.code === "23505") return NextResponse.json({ error: "This participant code already has a survey for this round." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id, knowledgeScore }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Response submission failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "We could not save this survey. Please check the connection and try again." }, { status: 503 });
  }
}
