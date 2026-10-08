export type SurveyResponse = {
  id: string;
  created_at: string;
  wave: "baseline" | "follow_up";
  participant_code: string;
  resident_confirmed: boolean;
  heard_news: boolean;
  news_sources: string[];
  news_language: string;
  environmental_issues: string[];
  waste_answers: Record<string, string>;
  clean_actions: string[];
  waste_disposal: string;
  separates_waste: string;
  services_used: string[];
  barriers: string[];
  knowledge_score: number;
};
