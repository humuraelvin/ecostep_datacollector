"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SurveyResponse } from "@/lib/types";

const labels: Record<string, string> = {
  baseline: "First survey", follow_up: "Follow-up", yes: "Yes", no: "No", often: "Often", sometimes: "Sometimes",
  kinyarwanda: "Kinyarwanda", english: "English", other: "Other", radio: "Radio", television: "Television", social_media: "Social media",
  community_meeting: "Community meeting", family_friends: "Family or friends", flooding: "Flooding", drought: "Drought", soil_erosion: "Soil erosion",
  heat: "Extreme heat", waste_pollution: "Waste pollution", biodegradable: "Biodegradable", non_biodegradable: "Non-biodegradable", not_sure: "Not sure",
  separate_waste: "Separates waste", use_collection: "Uses collection", compost: "Composts", reduce_litter: "Prevents litter", burn_waste: "Burns waste", dump_openly: "Dumps openly",
  collection: "Waste collection", bushes_fields: "Bushes or fields", burn: "Burned", waterway: "Waterway", recycling: "Recycling", composting: "Composting",
  none: "None", no_collection: "No collection service", no_bins: "No suitable bins", unsure_about_waste: "Unsure how to sort", distance: "Distance", cost: "Cost", time: "Time",
  not_sure_disposal: "Not sure", not_sure_sep: "Not sure",
};
const readable = (value: string) => labels[value] ?? value.replaceAll("_", " ");
const RESET_PHRASE = "DELETE ALL RESPONSES";
const percent = (part: number, total: number) => total ? Math.round((part / total) * 100) : 0;

export default function AdminDashboard() {
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPhrase, setResetPhrase] = useState("");
  const [resetAcknowledged, setResetAcknowledged] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const resetDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetch("/api/admin/responses", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load data.");
      setRows(data.responses);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load data.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const dialog = resetDialogRef.current;
    if (!dialog) return;
    if (resetOpen && !dialog.open) dialog.showModal();
    if (!resetOpen && dialog.open) dialog.close();
  }, [resetOpen]);

  const baseline = useMemo(() => rows.filter((row) => row.wave === "baseline"), [rows]);
  const followUp = useMemo(() => rows.filter((row) => row.wave === "follow_up"), [rows]);
  const paired = useMemo(() => {
    const byCode = new Map<string, { baseline?: SurveyResponse; followUp?: SurveyResponse }>();
    rows.forEach((row) => {
      const entry = byCode.get(row.participant_code) ?? {};
      if (row.wave === "baseline") entry.baseline = row;
      else entry.followUp = row;
      byCode.set(row.participant_code, entry);
    });
    return [...byCode.values()].filter((entry): entry is { baseline: SurveyResponse; followUp: SurveyResponse } => Boolean(entry.baseline && entry.followUp));
  }, [rows]);
  const newsPercent = percent(rows.filter((row) => row.heard_news).length, rows.length);
  const separatePercent = percent(rows.filter((row) => row.separates_waste === "often" || row.separates_waste === "sometimes").length, rows.length);
  const averageScore = rows.length ? (rows.reduce((sum, row) => sum + row.knowledge_score, 0) / rows.length).toFixed(1) : "0.0";
  const baseScore = paired.length ? (paired.reduce((sum, entry) => sum + entry.baseline.knowledge_score, 0) / paired.length).toFixed(1) : "—";
  const followScore = paired.length ? (paired.reduce((sum, entry) => sum + entry.followUp.knowledge_score, 0) / paired.length).toFixed(1) : "—";
  const averageChange = paired.length ? (paired.reduce((sum, entry) => sum + entry.followUp.knowledge_score - entry.baseline.knowledge_score, 0) / paired.length) : null;
  const filteredRows = rows.filter((row) => `${row.id} ${row.participant_code} ${row.wave}`.toLowerCase().includes(query.toLowerCase()));
  const topBarriers = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => row.barriers.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  function openResetDialog() {
    setResetError("");
    setResetPassword("");
    setResetPhrase("");
    setResetAcknowledged(false);
    setResetSuccess("");
    setResetOpen(true);
  }

  async function resetAllResponses(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError("");
    setResetBusy(true);
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword, confirmation: resetPhrase.trim(), acknowledged: resetAcknowledged }),
      });
      const result = await response.json();
      if (response.status === 401 && String(result.error).toLowerCase().includes("session")) {
        window.location.assign("/admin/login");
        return;
      }
      if (!response.ok) throw new Error(result.error || "The data reset could not be completed.");
      setRows([]);
      setQuery("");
      setOpenId("");
      setResetSuccess(`${Number(result.deletedCount).toLocaleString()} survey responses were permanently deleted. The dashboard is now reset.`);
      setResetPassword("");
      setResetPhrase("");
      setResetAcknowledged(false);
      setResetOpen(false);
    } catch (reason) {
      setResetError(reason instanceof Error ? reason.message : "The data reset could not be completed.");
    } finally {
      setResetBusy(false);
    }
  }

  return <main className="admin-shell">
    <header className="admin-topbar"><a href="/" className="brand"><span className="brand-mark">e</span><span>EcoTool <small>Research dashboard</small></span></a><div className="admin-top-actions"><span className="secure-badge"><i /> Admin view</span><button className="button button-quiet" onClick={logout}>Sign out</button></div></header>
    <div className="admin-content">
      <section className="dashboard-heading"><div><span className="eyebrow">LOCAL COMMUNITY STUDY</span><h1>Research overview</h1><p>Collected responses, knowledge patterns, and household practices.</p></div><a className="button button-primary" href="/api/admin/export"><span className="download-icon">↓</span> Download CSV</a></section>
      {loading && <div className="loading-panel"><span className="spinner" />Loading research data…</div>}
      {!loading && error && <div className="error-panel"><strong>Could not load the dashboard.</strong><span>{error}</span><small>Check the Supabase connection and run the setup SQL.</small></div>}
      {!loading && !error && <>
        <section className="metric-grid">
          <Metric label="Survey responses" value={rows.length.toLocaleString()} helper={`${baseline.length} first · ${followUp.length} follow-up`} tone="green" icon="↗" />
          <Metric label="Heard environmental news" value={`${newsPercent}%`} helper={`${rows.filter((row) => row.heard_news).length} of ${rows.length} residents`} tone="blue" icon="◉" />
          <Metric label="Average waste score" value={`${averageScore}/5`} helper="Correct picture classifications" tone="amber" icon="✳" />
          <Metric label="Matched residents" value={String(paired.length)} helper={averageChange === null ? "Complete both survey rounds" : `${averageChange > 0 ? "+" : ""}${averageChange.toFixed(1)} average score change`} tone="purple" icon="⌁" />
        </section>
        <section className="analysis-grid">
          <article className="panel comparison-panel"><div className="panel-heading"><div><span className="panel-kicker">KNOWLEDGE CHECK</span><h2>Picture answers</h2></div><span className="panel-icon green-icon">✳</span></div><p className="panel-copy">Average correct answers among residents with both surveys.</p><div className="score-compare"><ScoreColumn label="First survey" value={paired.length ? Number(baseScore) : 0} count={paired.length} /><div className="score-arrow">→</div><ScoreColumn label="Follow-up" value={paired.length ? Number(followScore) : 0} count={paired.length} /></div><div className="chart-legend"><span><i className="legend-dot green-dot" /> First survey</span><span><i className="legend-dot peach-dot" /> Follow-up</span></div></article>
          <article className="panel"><div className="panel-heading"><div><span className="panel-kicker">HOUSEHOLD PRACTICE</span><h2>Waste separation</h2></div><span className="panel-icon purple-icon">⌁</span></div><p className="panel-copy">Residents’ reported waste-separation frequency.</p><div className="round-counts"><div><span className="round-number">{percent(rows.filter((row) => row.separates_waste === "often").length, rows.length)}%</span><span>Often</span><div className="round-track"><i style={{ width: `${percent(rows.filter((row) => row.separates_waste === "often").length, rows.length)}%` }} /></div></div><div><span className="round-number">{separatePercent}%</span><span>Often or sometimes</span><div className="round-track peach-track"><i style={{ width: `${separatePercent}%` }} /></div></div></div><div className="round-foot">Based on answers from {rows.length} surveys.</div></article>
          <article className="panel"><div className="panel-heading"><div><span className="panel-kicker">WHAT GETS IN THE WAY</span><h2>Reported barriers</h2></div><span className="panel-icon peach-icon">◎</span></div><p className="panel-copy">Most selected challenges from all responses.</p>{topBarriers.length ? <div className="bar-list">{topBarriers.map(([key, value]) => <Bar key={key} label={readable(key)} value={value} max={topBarriers[0][1]} />)}</div> : <Empty text="Barriers will appear when surveys are submitted." />}</article>
          <article className="panel wave-panel"><div className="panel-heading"><div><span className="panel-kicker">COLLECTION PROGRESS</span><h2>Survey rounds</h2></div><span className="panel-icon blue-icon">⌂</span></div><div className="round-counts"><div><span className="round-number">{baseline.length}</span><span>First survey</span><div className="round-track"><i style={{ width: `${percent(baseline.length, rows.length)}%` }} /></div></div><div><span className="round-number">{followUp.length}</span><span>Follow-up</span><div className="round-track peach-track"><i style={{ width: `${percent(followUp.length, rows.length)}%` }} /></div></div></div><div className="round-foot">A follow-up comparison is most useful when the same residents complete both rounds.</div></article>
          <article className="panel"><div className="panel-heading"><div><span className="panel-kicker">NEWS ACCESS</span><h2>Where information comes from</h2></div><span className="panel-icon purple-icon">◌</span></div><div className="bar-list">{[["radio", rows.filter((r) => r.news_sources.includes("radio")).length], ["television", rows.filter((r) => r.news_sources.includes("television")).length], ["social_media", rows.filter((r) => r.news_sources.includes("social_media")).length], ["community_meeting", rows.filter((r) => r.news_sources.includes("community_meeting")).length]].map(([key, value]) => <Bar key={String(key)} label={readable(String(key))} value={Number(value)} max={Math.max(1, rows.length)} />)}</div></article>
        </section>
        <section className="responses-panel panel"><div className="responses-head"><div><span className="panel-kicker">RECORDS</span><h2>All collected surveys <span className="record-count">{rows.length}</span></h2></div><div className="response-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search survey records" /></label><a className="button button-outline" href="/api/admin/export">Export CSV</a></div></div>
          {!filteredRows.length ? <Empty text={rows.length ? "No records match that search." : "Your saved surveys will appear here."} /> : <div className="response-list">{filteredRows.map((row, index) => <ResponseRow key={row.id} row={row} index={index + 1} opened={openId === row.id} onToggle={() => setOpenId(openId === row.id ? "" : row.id)} />)}</div>}
        </section>
        <section className="reset-panel" aria-labelledby="reset-panel-title">
          <div className="reset-panel-copy">
            <span className="reset-panel-icon" aria-hidden="true">!</span>
            <div><span className="reset-kicker">DANGER ZONE</span><h2 id="reset-panel-title">Reset collected data</h2><p>Permanently erase every survey response from the database. This cannot be undone.</p></div>
          </div>
          <div className="reset-panel-action"><span>{rows.length.toLocaleString()} response{rows.length === 1 ? "" : "s"} currently stored</span><button className="button reset-open-button" type="button" onClick={openResetDialog} disabled={rows.length === 0}>Erase all survey data</button></div>
          {resetSuccess && <p className="reset-success" role="status">{resetSuccess}</p>}
        </section>
        <p className="data-note">This dashboard shows the records currently saved in your research database. The CSV contains one row per response and can be imported into Google Sheets.</p>
      </>}
    </div>
    <dialog
      ref={resetDialogRef}
      className="reset-dialog"
      aria-labelledby="reset-dialog-title"
      aria-describedby="reset-dialog-description"
      onCancel={(event) => { event.preventDefault(); if (!resetBusy) setResetOpen(false); }}
      onClick={(event) => { if (event.target === event.currentTarget && !resetBusy) setResetOpen(false); }}
    >
      <div className="reset-dialog-header"><span className="reset-dialog-icon" aria-hidden="true">!</span><div><span className="reset-kicker">PERMANENT ACTION</span><h2 id="reset-dialog-title">Erase all survey data?</h2></div></div>
      <p id="reset-dialog-description" className="reset-dialog-intro">This will permanently delete every response currently stored in the research database. The charts, comparisons, and CSV export will all return to zero. This action cannot be undone.</p>
      <div className="reset-count-box"><strong>{rows.length.toLocaleString()} response{rows.length === 1 ? "" : "s"} will be deleted</strong><span>New responses submitted after the reset can still be collected.</span></div>
      <form className="reset-form" onSubmit={resetAllResponses}>
        <label className="reset-input-label">Confirm with your admin password<input type="password" autoComplete="current-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} required /></label>
        <label className="reset-acknowledge"><input type="checkbox" checked={resetAcknowledged} onChange={(event) => setResetAcknowledged(event.target.checked)} /><span>I understand that all collected survey responses will be permanently erased.</span></label>
        <label className="reset-input-label">Type <strong>{RESET_PHRASE}</strong> to continue<input type="text" autoComplete="off" value={resetPhrase} onChange={(event) => setResetPhrase(event.target.value)} placeholder={RESET_PHRASE} required /></label>
        {resetError && <p className="reset-error" role="alert">{resetError}</p>}
        <div className="reset-dialog-actions"><button className="button button-quiet" type="button" onClick={() => setResetOpen(false)} disabled={resetBusy}>Keep my data</button><button className="button reset-submit-button" type="submit" disabled={resetBusy || !resetAcknowledged || resetPhrase.trim() !== RESET_PHRASE || !resetPassword}>{resetBusy ? "Erasing responses…" : "Permanently erase all data"}</button></div>
      </form>
    </dialog>
  </main>;
}

function Metric({ label, value, helper, tone, icon }: { label: string; value: string; helper: string; tone: string; icon: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong>{value}</strong><small>{helper}</small></article>;
}

function ScoreColumn({ label, value, count }: { label: string; value: number; count: number }) {
  const height = Math.min(100, value / 5 * 100);
  return <div className="score-column"><div className="score-bar-area"><span>{value.toFixed(1)}<small>/5</small></span><div className="score-bar"><i style={{ height: `${height}%` }} /></div></div><strong>{label}</strong><small>{count} {count === 1 ? "response" : "responses"}</small></div>;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max(value ? 6 : 0, (value / max) * 100) : 0;
  return <div className="bar-row"><div><span>{label}</span><strong>{value}</strong></div><div className="bar-track"><i style={{ width: `${width}%` }} /></div></div>;
}

function Empty({ text }: { text: string }) { return <div className="empty-state"><span>◌</span><p>{text}</p></div>; }

function ResponseRow({ row, index, opened, onToggle }: { row: SurveyResponse; index: number; opened: boolean; onToggle: () => void }) {
  const classified = Object.values(row.waste_answers).filter((answer) => answer === "biodegradable" || answer === "non_biodegradable").length;
  return <article className={`response-record ${opened ? "expanded" : ""}`}>
    <button className="response-summary" onClick={onToggle} aria-expanded={opened}>
      <span className="response-index">{String(index).padStart(2, "0")}</span><span className="response-wave"><i className={row.wave === "follow_up" ? "dot peach" : "dot"} />{readable(row.wave)}<small className="participant-tag"> · {row.participant_code}</small></span>
      <span className="response-date">{new Date(row.created_at).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}</span>
      <span className="response-result"><strong>{row.knowledge_score}/5</strong><small>waste score</small></span><span className="expand-mark">{opened ? "−" : "+"}</span>
    </button>
    {opened && <div className="response-detail"><Detail label="Participant code" value={row.participant_code} /><Detail label="Heard news" value={row.heard_news ? "Yes" : "No"} /><Detail label="News language" value={readable(row.news_language)} /><Detail label="News sources" value={row.news_sources.map(readable).join(", ") || "—"} /><Detail label="Issues known" value={row.environmental_issues.map(readable).join(", ") || "—"} /><Detail label="Waste item answers" value={Object.entries(row.waste_answers).map(([key, answer]) => `${readable(key)}: ${readable(answer)}`).join(" · ")} /><Detail label="Waste score" value={`${row.knowledge_score} of 5 correct (${classified} items classified)`} /><Detail label="Helpful actions selected" value={row.clean_actions.map(readable).join(", ") || "—"} /><Detail label="Waste disposal" value={readable(row.waste_disposal)} /><Detail label="Separates waste" value={readable(row.separates_waste)} /><Detail label="Services used" value={row.services_used.map(readable).join(", ") || "—"} /><Detail label="Barriers" value={row.barriers.map(readable).join(", ") || "—"} /><Detail label="Record ID" value={row.id} /></div>}
  </article>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-cell"><small>{label}</small><span>{value}</span></div>; }
