"use client";

import { useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "rw";
type Survey = {
  consent: boolean;
  resident_confirmed: boolean | null;
  wave: "baseline" | "follow_up";
  participant_code: string;
  heard_news: boolean | null;
  news_sources: string[];
  news_language: string;
  environmental_issues: string[];
  waste_answers: Record<string, string>;
  clean_actions: string[];
  waste_disposal: string;
  separates_waste: string;
  services_used: string[];
  barriers: string[];
};

const blankSurvey = (): Survey => ({
  consent: false,
  resident_confirmed: null,
  wave: "baseline",
  participant_code: "",
  heard_news: null,
  news_sources: [],
  news_language: "",
  environmental_issues: [],
  waste_answers: {},
  clean_actions: [],
  waste_disposal: "",
  separates_waste: "",
  services_used: [],
  barriers: [],
});

const words = {
  en: {
    language: "Language", english: "English", kinyarwanda: "Kinyarwanda",
    eyebrow: "Community research", title: "A few questions about our environment",
    intro: "This research aims to understand how adults in our local community access climate and environmental news, what they know about biodegradable and non-biodegradable waste, and what they do to keep the surroundings clean. We also want to learn what makes these actions difficult. The findings will show where information or support is needed and help guide a suitable community response. Responses are recorded without names, using a participant code.",
    consent: "The purpose was explained, and the resident agreed to take part.",
    resident_question: "Does this person live in our local community?", resident_confirmed: "Yes, lives here", not_resident: "No",
    code_label: "Participant code", code_help: "Write this code down so the same resident can be matched in the follow-up. Do not write a name.", code_enter: "Enter the code from the first survey.", code_error: "Enter the participant code from the first survey.", resident_error: "This survey is for residents of our local community.", saved_code: "Participant code",
    wave: "Survey round", baseline: "First survey", follow_up: "Follow-up survey",
    choose: "Choose one", prefer: "Prefer not to say",
    news: "In the past 7 days, have you heard or read climate or environmental news?",
    yes: "Yes", no: "No", sources: "Where did you hear or read it? Choose all that apply.",
    radio: "Radio", television: "Television", social_media: "Social media", community_meeting: "Community meeting", family_friends: "Family or friends", other: "Other", none: "None",
    language_question: "Which language do you usually use for this information?",
    rw: "Kinyarwanda", en: "English", other_language: "Another language",
    issues: "Which of these have you heard about or noticed? Choose all that apply.",
    flooding: "Flooding", drought: "Drought", soil_erosion: "Soil erosion", heat: "Extreme heat", waste_pollution: "Pollution from waste", not_sure: "Not sure",
    waste_intro: "Look at each picture or item. Can it break down naturally?",
    biodegradable: "Yes, biodegradable", non_biodegradable: "No, non-biodegradable", unsure: "Not sure",
    clean_actions_question: "Which actions help keep the surroundings clean? Choose all that apply.",
    separate_waste: "Separate waste where possible", use_collection: "Use waste collection", compost_action: "Compost food scraps", reduce_litter: "Keep rubbish off the ground", burn_waste: "Burn rubbish", dump_openly: "Dump rubbish in an open area",
    disposal_question: "How did your household dispose of most rubbish in the past 7 days?",
    collection: "Waste collection service", compost_disposal: "Compost heap", bushes_fields: "Bushes or fields", burn: "Burned it", waterway: "Waterway", not_sure_disposal: "Not sure", other_disposal: "Other",
    separation_question: "Does your household separate any rubbish before disposal?", often: "Often", sometimes: "Sometimes", not_sure_sep: "Not sure",
    services_question: "Which services has your household used? Choose all that apply.", recycling: "Recycling", composting: "Composting", no_services: "None",
    barrier_question: "What makes proper waste disposal difficult? Choose all that apply.", no_collection: "No collection service", no_bins: "No suitable bins", unsure_about_waste: "Unsure how to sort waste", distance: "Service is far away", cost: "Cost", time: "Not enough time", other_barrier: "Other",
    back: "Back", next: "Continue", submit: "Save answers", saving: "Saving…", step: "Step", of: "of",
    saved_title: "Answers saved", saved_body: "Thank you for helping us understand our community.", another: "Enter another survey", admin: "Research team sign-in",
    footer: "Please do not enter names, phone numbers, or addresses.", error: "We couldn’t save this survey. Check the connection and try again.",
    wave_help: "Choose the round for this interview.", consent_help: "Only continue after the resident agrees.",
  },
  rw: {
    language: "Ururimi", english: "Icyongereza", kinyarwanda: "Ikinyarwanda",
    eyebrow: "Ubushakashatsi mu baturage", title: "Ibibazo bike ku bidukikije", intro: "Ubu bushakashatsi bugamije kumenya uko abantu bakuru bo mu muryango dutuyemo babona amakuru ku mihindagurikire y’ikirere n’ibidukikije, ibyo bazi ku myanda ibora n’itabora, n’ibikorwa bakora kugira ngo aho batuye hasukure. Turashaka kandi kumenya inzitizi zituma ibyo bikorwa bigorana. Ibisubizo bizagaragaza aho hakenewe amakuru cyangwa ubufasha, bifashe gutegura igisubizo kiboneye ku baturage. Nta mazina yandikwa; hakoreshejwe kode y’uwitabiriye.",
    consent: "Intego yasobanuwe, kandi uwabajijwe yemeye kwitabira.", wave: "Icyiciro cy’ibazwa", baseline: "Ibarura rya mbere", follow_up: "Ibarura rikurikiraho",
    resident_question: "Ese uyu muntu atuye muri uyu muryango?", resident_confirmed: "Yego, aratuye hano", not_resident: "Oya",
    code_label: "Kode y’uwitabiriye", code_help: "Andika iyi kode kugira ngo tuzamenye uwitabiriye mu ibarura rikurikiraho. Ntukandike izina.", code_enter: "Andika kode yo mu ibarura rya mbere.", code_error: "Andika kode yo mu ibarura rya mbere.", resident_error: "Iri barura rigenewe abatuye muri uyu muryango.", saved_code: "Kode y’uwitabiriye",
    choose: "Hitamo", prefer: "Simbisubiza", news: "Mu minsi 7 ishize, wumvise cyangwa wasomye amakuru ku mihindagurikire y’ikirere cyangwa ibidukikije?", yes: "Yego", no: "Oya",
    sources: "Wabyumvise cyangwa wabibonye he? Hitamo ibisubizo byose bireba.", radio: "Radiyo", television: "Televiziyo", social_media: "Imbuga nkoranyambaga", community_meeting: "Inama y’abaturage", family_friends: "Umuryango cyangwa inshuti", other: "Ahandi", none: "Nta na hamwe",
    language_question: "Ni uruhe rurimi ukoresha kenshi kuri aya makuru?", rw: "Ikinyarwanda", en: "Icyongereza", other_language: "Urundi rurimi",
    issues: "Ni ibihe muri ibi wumviseho cyangwa wabonye? Hitamo ibisubizo byose bireba.", flooding: "Imyuzure", drought: "Amapfa", soil_erosion: "Isuri", heat: "Ubushyuhe bwinshi", waste_pollution: "Umwanda uterwa n’imyanda", not_sure: "Simbyizeye",
    waste_intro: "Reba buri shusho. Ese ikintu kiri muri yo gishobora kubora kikavamo ibisanzwe?", biodegradable: "Yego, kirabora", non_biodegradable: "Oya, ntikibora", unsure: "Simbyizeye",
    clean_actions_question: "Ni ibihe bikorwa bifasha kugira aho dutuye hasukuye? Hitamo byose bireba.", separate_waste: "Gutandukanya imyanda aho bishoboka", use_collection: "Gukoresha serivisi yo gutwara imyanda", compost_action: "Gukora ifumbire mu bisigazwa by’ibiryo", reduce_litter: "Kutajugunya imyanda hasi", burn_waste: "Gutwika imyanda", dump_openly: "Kujugunya imyanda ahatagaragara",
    disposal_question: "Mu minsi 7 ishize, urugo rwanyu rwataye imyanda myinshi gute?", compost_disposal: "Mu kirundo cy’ifumbire", collection: "Serivisi yo gutwara imyanda", bushes_fields: "Mu gihuru cyangwa mu murima", burn: "Yarayitwitse", waterway: "Mu mugezi cyangwa mu mazi", not_sure_disposal: "Simbyizeye", other_disposal: "Ubundi buryo",
    separation_question: "Ese urugo rwanyu rutandukanya imyanda mbere yo kuyijugunya?", often: "Kenshi", sometimes: "Rimwe na rimwe", not_sure_sep: "Simbyizeye",
    services_question: "Ni izihe serivisi urugo rwanyu rwakoresheje? Hitamo byose bireba.", recycling: "Gutunganya imyanda ngo yongere gukoreshwa", composting: "Gukora ifumbire", no_services: "Nta na imwe",
    barrier_question: "Ni iki gituma guta imyanda neza bigorana? Hitamo byose bireba.", no_collection: "Nta serivisi yo gutwara imyanda", no_bins: "Nta bikoresho biboneye byo gushyiramo imyanda", unsure_about_waste: "Kutamenya gutandukanya imyanda", distance: "Serivisi iri kure", cost: "Amafaranga", time: "Kubura umwanya", other_barrier: "Ikindi",
    back: "Subira inyuma", next: "Komeza", submit: "Bika ibisubizo", saving: "Turabika…", step: "Intambwe", of: "muri", saved_title: "Ibisubizo byabitswe", saved_body: "Murakoze kudufasha kumenya iby’abaturage.", another: "Andika irindi barura", admin: "Kwinjira kw’abashakashatsi", footer: "Ntimwandike amazina, nimero za telefoni, cyangwa aderesi.", error: "Ntidushoboye kubika ibisubizo. Reba interineti wongere ugerageze.", wave_help: "Hitamo icyiciro cy’iri barura.", consent_help: "Komeza ari uko uwabajijwe abyemeye.",
  },
} as const;

type Word = keyof typeof words.en;
const wasteItems = [
  { key: "cardboard_egg_carton", image: "/waste-quiz/egg-carton.svg" },
  { key: "paper_napkin", image: "/waste-quiz/paper-napkin.svg" },
  { key: "wooden_matchsticks", image: "/waste-quiz/matchsticks.svg" },
  { key: "disposable_diaper", image: "/waste-quiz/diaper.svg" },
  { key: "nylon_fishing_line", image: "/waste-quiz/fishing-line.svg" },
] as const;

export default function SurveyForm() {
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState<Survey>(blankSurvey());
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedCode, setSavedCode] = useState("");
  const w = (key: Word) => words[lang][key] ?? words.en[key];
  const set = <K extends keyof Survey,>(key: K, value: Survey[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: "news_sources" | "environmental_issues" | "clean_actions" | "services_used" | "barriers", value: string) => {
    setForm((current) => {
      const list = current[key] as string[];
      const exclusive = key === "environmental_issues" || key === "clean_actions" ? ["not_sure"] : key === "services_used" ? ["none", "not_sure"] : ["none"];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : exclusive.includes(value)
          ? [value]
          : [...list.filter((item) => !exclusive.includes(item)), value];
      return { ...current, [key]: next };
    });
  };

  const radio = (group: string, options: [string, string][], selected: string, onChange: (value: string) => void) => (
    <div className="choice-grid" role="group" aria-label={group}>
      {options.map(([value, label]) => (
        <button key={value} type="button" className={`choice ${selected === value ? "selected" : ""}`} aria-pressed={selected === value} onClick={() => onChange(value)}>
          <span className="choice-dot" />{label}
        </button>
      ))}
    </div>
  );
  const checks = (group: string, options: [string, string][], selected: string[], onToggle: (value: string) => void) => (
    <div className="choice-grid" role="group" aria-label={group}>
      {options.map(([value, label]) => (
        <button key={value} type="button" className={`choice ${selected.includes(value) ? "selected" : ""}`} aria-pressed={selected.includes(value)} onClick={() => onToggle(value)}>
          <span className="choice-check">{selected.includes(value) ? "✓" : ""}</span>{label}
        </button>
      ))}
    </div>
  );
  const field = (title: string, children: ReactNode, optional = false) => (
    <fieldset className="survey-field"><legend>{title}{optional && <span className="optional"> · {w("prefer")}</span>}</legend>{children}</fieldset>
  );

  useEffect(() => {
    if (form.wave === "baseline" && !form.participant_code) {
      const code = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
      setForm((current) => current.participant_code ? current : { ...current, participant_code: code });
    }
  }, [form.wave, form.participant_code]);

  useEffect(() => {
    document.documentElement.lang = lang === "rw" ? "rw" : "en";
  }, [lang]);

  function advance() {
    setError("");
    if (step === 0 && form.resident_confirmed !== true) {
      setError(form.resident_confirmed === false ? w("resident_error") : (lang === "rw" ? "Banza usubize niba atuye muri uyu muryango." : "Please confirm that this person lives in our local community."));
      return;
    }
    if (step === 0 && !form.consent) {
      setError(lang === "rw" ? "Andika ko uwabajijwe yemeye." : "Please record that the resident agreed to take part.");
      return;
    }
    if (step === 0 && !/^[A-Z0-9]{6,10}$/.test(form.participant_code)) {
      setError(w("code_error"));
      return;
    }
    if (step === 1 && (form.heard_news === null || !form.news_language)) {
      setError(lang === "rw" ? "Subiza ibibazo ku makuru." : "Please answer the news questions.");
      return;
    }
    if (step === 1 && (!form.news_sources.length || !form.environmental_issues.length)) {
      setError(lang === "rw" ? "Hitamo igisubizo kuri buri kibazo." : "Please choose an answer for each question.");
      return;
    }
    if (step === 2 && !form.clean_actions.length) {
      setError(lang === "rw" ? "Hitamo nibura igisubizo kimwe." : "Please choose at least one answer.");
      return;
    }
    setStep(step + 1);
  }

  async function submit() {
    setError("");
    if (!form.consent || form.resident_confirmed !== true || !/^[A-Z0-9]{6,10}$/.test(form.participant_code) || form.heard_news === null || !form.news_language || !form.news_sources.length || !form.environmental_issues.length || !form.clean_actions.length || !form.services_used.length || !form.barriers.length || !form.waste_disposal || !form.separates_waste) {
      setError(lang === "rw" ? "Subiza ibibazo bisigaye." : "Please answer the remaining required questions.");
      return;
    }
    if (wasteItems.some((item) => !form.waste_answers[item.key])) {
      setError(lang === "rw" ? "Subiza ikibazo kuri buri shusho y’imyanda." : "Please answer each waste picture question.");
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || w("error"));
      setSavedCode(form.participant_code);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : w("error"));
    } finally {
      setBusy(false);
    }
  }

  function startAgain() {
    setForm(blankSurvey());
    setStep(0);
    setSaved(false);
    setError("");
    setSavedCode("");
  }

  if (saved) return (
    <main className="page-shell">
      <header className="topbar"><a href="/" className="brand"><span className="brand-mark">e</span><span>EcoTool <small>{w("eyebrow")}</small></span></a><div className="language-switch"><span>{w("language")}</span><button onClick={() => setLang(lang === "en" ? "rw" : "en")}>{w(lang === "en" ? "kinyarwanda" : "english")}</button></div></header>
      <section className="success-card"><div className="success-icon">✓</div><p className="eyebrow">{w("saved_title")}</p><h1>{w("saved_body")}</h1><div className="participant-code"><small>{w("saved_code")}</small><strong>{savedCode}</strong><span>{w("code_help")}</span></div><button className="button button-primary" onClick={startAgain}>{w("another")}</button></section>
      <footer className="site-footer">{w("footer")}</footer>
    </main>
  );

  const steps = [w("wave"), w("news"), w("waste_intro"), w("disposal_question")];
  return (
    <main className="page-shell">
      <header className="topbar"><a href="/" className="brand"><span className="brand-mark">e</span><span>EcoTool <small>{w("eyebrow")}</small></span></a><div className="language-switch"><span>{w("language")}</span><button onClick={() => setLang(lang === "en" ? "rw" : "en")}>{w(lang === "en" ? "kinyarwanda" : "english")}</button></div></header>
      <div className="intro-block"><span className="eyebrow">{w("eyebrow")}</span><h1>{w("title")}</h1><p>{w("intro")}</p></div>
      <section className="survey-card" aria-label="Community survey">
        <div className="survey-progress"><div><span>{w("step")} {step + 1} {w("of")} 4</span><strong>{steps[step]}</strong></div><div className="progress-track"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div></div>
        {step === 0 && <div className="survey-step">
          {field(w("resident_question"), radio(w("resident_question"), [["yes", w("resident_confirmed")], ["no", w("not_resident")]], form.resident_confirmed === null ? "" : form.resident_confirmed ? "yes" : "no", (v) => set("resident_confirmed", v === "yes")))}
          {field(w("wave"), <>{radio(w("wave"), [["baseline", w("baseline")], ["follow_up", w("follow_up")]], form.wave, (v) => setForm((current) => ({ ...current, wave: v as Survey["wave"], participant_code: v === "follow_up" ? "" : current.participant_code })))}<p className="field-help">{w("wave_help")}</p></>)}
          {field(w("code_label"), form.wave === "baseline" ? <><input className="code-display" value={form.participant_code} readOnly aria-label={w("code_label")} /><p className="field-help">{w("code_help")}</p></> : <><input className="code-display" value={form.participant_code} onChange={(event) => set("participant_code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder={w("code_enter")} aria-label={w("code_label")} /><p className="field-help">{w("code_enter")}</p></>)}
          <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} /><span>{w("consent")}<small>{w("consent_help")}</small></span></label>
        </div>}
        {step === 1 && <div className="survey-step">
          {field(w("news"), radio(w("news"), [["yes", w("yes")], ["no", w("no")]], form.heard_news === null ? "" : form.heard_news ? "yes" : "no", (v) => set("heard_news", v === "yes")))}
          {field(w("sources"), checks(w("sources"), [["radio", w("radio")], ["television", w("television")], ["social_media", w("social_media")], ["community_meeting", w("community_meeting")], ["family_friends", w("family_friends")], ["other", w("other")], ["none", w("none")]], form.news_sources, (v) => toggle("news_sources", v)))}
          {field(w("language_question"), radio(w("language_question"), [["kinyarwanda", w("rw")], ["english", w("en")], ["other", w("other_language")]], form.news_language, (v) => set("news_language", v)))}
          {field(w("issues"), checks(w("issues"), [["flooding", w("flooding")], ["drought", w("drought")], ["soil_erosion", w("soil_erosion")], ["heat", w("heat")], ["waste_pollution", w("waste_pollution")], ["not_sure", w("not_sure")]], form.environmental_issues, (v) => toggle("environmental_issues", v)))}
        </div>}
        {step === 2 && <div className="survey-step">
          <p className="step-lead">{w("waste_intro")}</p>
          {wasteItems.map((item, index) => {
            const pictureLabel = lang === "rw" ? `Ishusho ${index + 1}` : `Image ${index + 1}`;
            return <div className="waste-row" key={item.key}>
              <div className="waste-illustration"><img src={item.image} alt={pictureLabel} /></div>
              <div className="waste-question">{radio(pictureLabel, [["biodegradable", w("biodegradable")], ["non_biodegradable", w("non_biodegradable")], ["not_sure", w("unsure")]], form.waste_answers[item.key] ?? "", (v) => setForm((current) => ({ ...current, waste_answers: { ...current.waste_answers, [item.key]: v } })))}</div>
            </div>;
          })}
          {field(w("clean_actions_question"), checks(w("clean_actions_question"), [["separate_waste", w("separate_waste")], ["use_collection", w("use_collection")], ["compost", w("compost_action")], ["reduce_litter", w("reduce_litter")], ["burn_waste", w("burn_waste")], ["dump_openly", w("dump_openly")], ["not_sure", w("unsure")]], form.clean_actions, (v) => toggle("clean_actions", v)))}
        </div>}
        {step === 3 && <div className="survey-step">
          {field(w("disposal_question"), radio(w("disposal_question"), [["collection", w("collection")], ["compost", w("compost_disposal")], ["bushes_fields", w("bushes_fields")], ["burn", w("burn")], ["waterway", w("waterway")], ["other", w("other_disposal")], ["not_sure", w("not_sure_disposal")]], form.waste_disposal, (v) => set("waste_disposal", v)))}
          {field(w("separation_question"), radio(w("separation_question"), [["often", w("often")], ["sometimes", w("sometimes")], ["no", w("no")], ["not_sure", w("not_sure_sep")]], form.separates_waste, (v) => set("separates_waste", v)))}
          {field(w("services_question"), checks(w("services_question"), [["collection", w("collection")], ["recycling", w("recycling")], ["composting", w("composting")], ["none", w("no_services")], ["not_sure", w("not_sure")]], form.services_used, (v) => toggle("services_used", v)))}
          {field(w("barrier_question"), checks(w("barrier_question"), [["no_collection", w("no_collection")], ["no_bins", w("no_bins")], ["unsure_about_waste", w("unsure_about_waste")], ["distance", w("distance")], ["cost", w("cost")], ["time", w("time")], ["none", w("none")], ["other", w("other_barrier")]], form.barriers, (v) => toggle("barriers", v)))}
        </div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">{step > 0 ? <button className="button button-quiet" onClick={() => { setError(""); setStep(step - 1); }}>{w("back")}</button> : <span />}{step < 3 ? <button className="button button-primary" onClick={advance}>{w("next")} <span aria-hidden="true">→</span></button> : <button className="button button-primary" disabled={busy} onClick={submit}>{busy ? w("saving") : w("submit")} <span aria-hidden="true">→</span></button>}</div>
      </section>
      <footer className="site-footer"><span>{w("footer")}</span><a href="/admin/login">{w("admin")} ↗</a></footer>
    </main>
  );
}
