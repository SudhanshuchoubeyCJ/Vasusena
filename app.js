// app.js: router, home menu, mock interview setup, live rounds and results.
import { ROLES, LEVELS, FORMATS, ACCENTS, DIFFICULTY, MODE_LABEL, DEFAULT_KNOWLEDGE, CAT_LABEL, CONFIG, NEGOTIATION } from "./data.js";
import * as E from "./engine.js";
import { Recorder, recDB } from "./media.js";
import { $, app, nav, esc, sleep, store, user, isPro, firstName, canStart, markStart, usageThisWeek, addSession, toast, burst, modal, renderHeader, requireUser, showUpgrade, ring, bars, spark, lockedBlock, fakeBars, liveShell, startEnv, listen, say, accentOf, waitClick, track, endCurrent } from "./ui.js";
import { screens as moreScreens, startReminderLoop } from "./modules.js";
import { llmFollowUp } from "./llm.js";
import { icon, iconRow } from "./icons.js";
import { BRAND } from "./brand.js";

export let K = DEFAULT_KNOWLEDGE;
fetch("knowledge.json").then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && j.companyTypes) { K = j; } }).catch(() => {});

const screens = {};
export function go(name, arg) {
  endCurrent();
  (screens[name] || screens.home)(arg);
  window.scrollTo(0, 0);
  if (name !== "admin" && location.hash === "#admin") history.replaceState(null, "", location.pathname);
}
nav.go = go;
const FORMAT_ICON = { telephonic: "phone", virtual: "laptop", inperson: "handshake", boardroom: "landmark", ceo: "crown" };
const fi = (f) => icon(FORMAT_ICON[f] || "video");

// ---------------- HOME ----------------
screens.home = () => {
  const u = user(), pro = isPro();
  const left = Math.max(0, CONFIG.FREE_WEEKLY_LIMIT - usageThisWeek());
  const card = (t, p, to) => `<button class="card" data-go="${to}"><h3>${t}</h3><p>${p}</p><span class="card-go">Start</span></button>`;
  const fmt = (t, p) => `<div><dt>${t}</dt><dd>${p}</dd></div>`;
  app.innerHTML = `<section class="hero">
      <h1>Practise job interviews out loud and get a score out of 100</h1>
      <p class="lead">${BRAND.name} asks the questions, listens to your answers, watches your camera and tells you what to work on.</p>
      <div class="row hero-cta"><button class="btn primary big-btn" data-go="mock">Start a mock interview</button>${u ? "" : `<button class="btn ghost" id="si">Sign in</button>`}</div>
      <p class="note">${pro ? "Pro plan: unlimited sessions." : `Free plan: ${left} of ${CONFIG.FREE_WEEKLY_LIMIT} sessions left this week. <button class="link" data-upgrade>See what Pro adds</button>`}</p>
    </section>
    <section><h2 class="sect">Interview formats</h2>
      <dl class="formats">
        ${fmt("Telephonic", "Voice only, like a recruiter's screening call. The camera stays off.")}
        ${fmt("Virtual", "A video call. Your eye contact, posture and hand movement are analysed.")}
        ${fmt("In person", "A face-to-face conversation with the camera on.")}
        ${fmt("Boardroom", "A panel of interviewers asking in turn.")}
        ${fmt("CEO or founder", "A short, direct round about fit and judgement.")}
      </dl></section>
    <section><h2 class="sect">What you can practise</h2>
    <div class="grid">
      ${card("Mock interview", "Choose a role and company type. You get the rounds that company would run, from phone screen to final.", "mock")}
      ${card("Salary negotiation", "Negotiate an offer with a recruiter who wants to save the company money. See where you started and where you ended.", "salary")}
      ${card("Corporate language and politics", "Answer tricky workplace situations and rewrite blunt messages. See which phrases to use and avoid.", "politics")}
      ${card("Communication lab", "Get a random topic, 3 minutes to think and 2 minutes to speak. Receive a score and homework.", "speech")}
      ${card("Dashboard and practice plan", "Scores over time, weak areas, a 7-day practice plan and reminders.", "dash")}
      ${card("Share your experience", "Rate the app, report a problem or describe a real interview you had.", "feedback")}
    </div></section>
    <section><h2 class="sect">What gets measured</h2>
      <ul class="plain">
        <li>Eye contact and posture, from your camera</li>
        <li>Speaking pace, pauses and filler words</li>
        <li>Answer content: relevance, structure and depth</li>
        <li>How you handle follow-up and hard questions</li>
        <li>13 accent options, including Hinglish</li>
        <li>A score out of 100 for every round, and whether you qualify for the next</li>
      </ul></section>
    <div class="panel news"><h2 class="sect">What's new in interviews</h2><p class="note">Knowledge updated ${esc(K.updated || "")} (${esc(K.source || "")})</p><ul>${(K.trends || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
    <p class="note privacy">${icon("lock")} Video and audio stay on this device. Free plan: watch a recording once, then it is deleted. Pro: deleted after 24 hours.</p>`;
  const si = $("#si"); if (si) si.onclick = () => requireUser();
};

// ---------------- MOCK SETUP ----------------
screens.mock = () => {
  const d = store.get("lastcfg", { role: "Backend", company: "", companyType: "bigtech", level: "mid", campus: "0", format: "auto", difficulty: "normal", accent: "in", jd: "" });
  const inRoles = ROLES.includes(d.role);
  app.innerHTML = `<div class="panel"><h2>${icon("mic")} Mock interview setup</h2><p class="muted">Tell me what you're preparing for. I'll build the rounds the way companies like this usually run them.</p>
    <form id="f" class="form">
      <label>Target role<select id="role">${ROLES.map((r) => `<option ${r === d.role ? "selected" : ""}>${r}</option>`).join("")}<option value="__custom" ${inRoles ? "" : "selected"}>Other role (describe below)</option></select></label>
      <label id="crw" class="${inRoles ? "hidden" : ""}">Role name<input id="customRole" value="${inRoles ? "" : esc(d.role)}" placeholder="e.g. Marketing Manager"></label>
      <label class="wide">Job description (optional, but makes questions much more relevant)<textarea id="jd" rows="4" placeholder="Paste the job description here…">${esc(d.jd)}</textarea></label>
      <label>Company name<input id="company" value="${esc(d.company)}" placeholder="e.g. Acme Corp"></label>
      <label>Company type<select id="ctype">${Object.entries(K.companyTypes).map(([k, v]) => `<option value="${k}" ${k === d.companyType ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select></label>
      <label>Experience level<select id="level">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === d.level ? "selected" : ""}>${l.label}</option>`).join("")}</select></label>
      <label>Hiring type<select id="campus"><option value="0" ${d.campus === "0" ? "selected" : ""}>Off campus (regular hiring)</option><option value="1" ${d.campus === "1" ? "selected" : ""}>On campus (college placement)</option></select></label>
      <label>Interview format<select id="format">${FORMATS.map((f) => `<option value="${f.id}" ${f.id === d.format ? "selected" : ""}>${f.label}</option>`).join("")}</select></label>
      <label>Interviewer language / accent<select id="accent">${ACCENTS.map((a) => `<option value="${a.id}" ${a.id === d.accent ? "selected" : ""}>${a.label}</option>`).join("")}</select></label>
      <label>Difficulty<select id="diff">${Object.entries(DIFFICULTY).map(([k, v]) => `<option value="${k}" ${k === d.difficulty ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
      <div class="wide"><b>Rounds for this company &amp; level</b><div class="note">Go through all rounds in order, or practise just one round.</div><div id="rounds"></div></div>
      <div class="wide row"><button class="btn primary">Continue → camera &amp; mic check</button><button type="button" class="btn ghost" data-go="home">Back</button></div>
    </form><p class="note">Accent choice sets the interviewer's voice and the speech-recognition language. Availability depends on your browser and operating system.</p></div>`;
  const val = (id) => $("#" + id).value;
  const readCfg = () => ({ role: val("role") === "__custom" ? val("customRole").trim() || "Custom role" : val("role"), jd: val("jd").trim(), company: val("company").trim(), companyType: val("ctype"), level: val("level"), campus: val("campus") === "1", format: val("format"), difficulty: val("diff"), accent: val("accent") });
  let scope = "all";
  const drawRounds = () => {
    $("#crw").classList.toggle("hidden", val("role") !== "__custom");
    const rounds = E.buildRounds(readCfg(), K);
    if (scope !== "all" && !rounds[+scope]) scope = "all";
    $("#rounds").innerHTML = `<label style="flex-direction:row;gap:8px;align-items:center"><input type="radio" name="scope" value="all" ${scope === "all" ? "checked" : ""}> <b>All rounds</b>: all ${rounds.length} rounds in order</label>` + rounds.map((r, i) => `<label style="flex-direction:row;gap:8px;align-items:center"><input type="radio" name="scope" value="${i}" ${String(scope) === String(i) ? "checked" : ""}> ${i + 1}. ${esc(r.name)} <span class="tag">${MODE_LABEL[r.mode]}</span><span class="tag">${fi(r.format)} ${r.format}</span></label>`).join("");
    app.querySelectorAll("[name=scope]").forEach((x) => (x.onchange = () => (scope = x.value)));
  };
  app.querySelectorAll("#f select, #f input, #f textarea").forEach((el) => el.addEventListener("change", drawRounds));
  drawRounds();
  $("#f").onsubmit = async (e) => {
    e.preventDefault();
    const cfg = readCfg(); store.set("lastcfg", { ...cfg, campus: cfg.campus ? "1" : "0", role: val("role") === "__custom" ? cfg.role : val("role") });
    if (!(await requireUser())) return;
    if (!canStart()) return showUpgrade(`You've used your ${CONFIG.FREE_WEEKLY_LIMIT} free sessions this week.`);
    precheck(cfg, E.buildRounds(cfg, K), scope === "all" ? null : +scope);
  };
};

async function precheck(cfg, rounds, scopeIdx) {
  const list = scopeIdx === null ? rounds : [rounds[scopeIdx]];
  const needCam = list.some((r) => r.format !== "telephonic");
  const a = await waitClick(`<h2>Before we start</h2>
    <p><b>${esc(cfg.role)}</b>${cfg.company ? " at <b>" + esc(cfg.company) + "</b>" : ""} · ${list.length} round${list.length > 1 ? "s" : ""} · ${DIFFICULTY[cfg.difficulty].label} difficulty</p>
    <ul><li>${needCam ? "Allow <b>camera and microphone</b> when asked. Sit in good light with your face and shoulders in frame, and look at the camera lens." : "Telephonic rounds need only your <b>microphone</b>."}</li>
    <li>Use <b>Chrome or Edge</b> for voice recognition, and headphones if possible.</li>
    <li>It's <b>live</b>: no pausing. The interviewer may interrupt or ask "why / how" follow-ups, just like a real one.</li>
    <li>Greet the interviewer when they say hello. Your first impression is scored too.</li></ul>
    <div class="banner info">${icon("lock")} Your video is analysed in your browser. It is stored on this device only. Free plan: deleted after you watch it once. Pro: deleted automatically after 24 hours.</div>`,
    [{ id: "go", label: "I'm ready to start", cls: "primary" }, { id: "back", label: "Back" }]);
  if (a === "go") journey(cfg, rounds, scopeIdx); else go("mock");
}

// ---------------- JOURNEY ----------------
async function journey(cfg, rounds, scopeIdx) {
  const run = track({ aborted: false });
  markStart();
  const list = scopeIdx === null ? rounds : [rounds[scopeIdx]];
  const acc = accentOf(cfg.accent);
  const env = track(await startEnv({ camera: list.some((r) => r.format !== "telephonic"), lang: acc.rec }));
  const results = [];
  let i = 0;
  while (i < list.length && !run.aborted) {
    const round = list[i], free = !isPro();
    const go1 = await waitClick(`<h2>Round ${i + 1} of ${list.length}: ${esc(round.name)}</h2><p><span class="tag">${MODE_LABEL[round.mode]}</span><span class="tag">${fi(round.format)} ${round.format}</span><span class="tag">pass mark ${round.passMark}</span></p>
      <p class="muted">${round.format === "telephonic" ? "This is a phone-style call: camera analysis is off, so voice and answers carry the score." : round.format === "boardroom" ? "A small panel will take turns asking you questions." : round.format === "ceo" ? "Expect big-picture questions from a founder-style interviewer." : "Take a breath, smile, and begin when ready."}</p>`,
      [{ id: "go", label: "Begin round", cls: "primary" }, { id: "quit", label: "Leave" }]);
    if (go1 === "quit" || run.aborted) break;
    const res = await playRound(env, cfg, round, run, i, list.length, acc);
    if (!res || run.aborted) break;
    results.push(res);
    const action = await showResult(res, { cfg, round, next: list[i + 1], idx: i, list, results });
    if (action === "next") i++;
    else if (action === "retry") results.pop();
    else if (action === "restart") { env.stop(); return go("mock"); }
    else break;
  }
  env.stop();
  if (run.aborted) return;
  if (i >= list.length && results.length > 1) finalSummary(cfg, results); else go("home");
}

const sleepSay = async (env, ui, run, text, p, acc, D) => { if (run.aborted) return; await say(env, ui, text, p, acc.tts, D.tone === "pressure" ? 1.08 : 1); };

async function playRound(env, cfg, round, run, idx, total, acc) {
  const D = DIFFICULTY[cfg.difficulty], hing = !!acc.hinglish, name = firstName();
  const telephonic = round.format === "telephonic", useCam = env.camOn && !telephonic;
  const ui = track(liveShell(`${round.name} · ${cfg.role}`, { video: useCam }));
  ui.sub(`${MODE_LABEL[round.mode]} · ${round.format} · round ${idx + 1}/${total}`);
  $("#endBtn").onclick = () => { run.aborted = true; env.speaker.cancel(); toast("Session ended."); go("home"); };
  if (useCam) env.attachVideo(ui.video);
  if (useCam && env.cam) env.cam.reset();
  const recorder = new Recorder(env.stream); if (env.stream) recorder.start();
  const t0 = performance.now();
  const recName = NEGOTIATION.recruiters[(idx + Math.floor(t0)) % NEGOTIATION.recruiters.length];
  const panel = round.format === "boardroom" || round.mode === "panel";
  const personas = panel
    ? [{ n: "Ms. Rao (HR)", e: "user-round", idx: 0, pitch: 1.1 }, { n: "Mr. Collins (Tech lead)", e: "laptop", idx: 1, pitch: 0.85 }, { n: "Dr. Sen (Director)", e: "briefcase-business", idx: 2, pitch: 1 }]
    : [round.mode === "ceo" || round.format === "ceo" ? { n: "Founder / CEO", e: "crown", idx: 0, pitch: 0.9 } : { n: `${recName} · ${MODE_LABEL[round.mode]} interviewer`, e: telephonic ? "phone" : "user-round", idx: 0, pitch: 1 }];
  const S = (text, p) => sleepSay(env, ui, run, text, p, acc, D);
  const L = (o) => listen(env, ui, run, { firstWord: 14000, silence: D.silence, maxDur: D.maxDur, interruptAt: D.interruptAt, nudge: true, ...o });
  const qs = E.pickQuestions(round, cfg, K);
  const answers = [], events = [];
  const mark = (label) => events.push({ t: Math.round((performance.now() - t0) / 1000), label });

  // greeting: scored as first impression
  const p0 = personas[0];
  await S(telephonic ? `Hello ${name}, this is ${recName}${cfg.company ? " from " + cfg.company : ""}. Can you hear me clearly?` : `Hello ${name}, thanks for joining${cfg.company ? " us at " + cfg.company : ""}. How are you today?`, p0);
  const g = await L({ firstWord: 9000, silence: 2200, maxDur: 20000, interruptAt: 0 });
  if (run.aborted) return null;
  const gcam = useCam && env.cam && env.cam.ready ? env.cam.summary() : null;
  const greeting = E.greetingScore(g.text, gcam && gcam.ok ? gcam : null);
  let bridge = (hing ? "Achha, theek hai. " : "Great to hear. ") + (E.openingPre(cfg) || "") + " ";
  if (Math.random() < 0.7) bridge += E.companyBrief(cfg, K) + ". ";
  bridge += hing ? "Chaliye shuru karte hain. " : "Let's get started. ";

  for (let qi = 0; qi < qs.length && !run.aborted; qi++) {
    const q = qs[qi], p = personas[qi % personas.length];
    mark(`Q${qi + 1}: ${q.q.slice(0, 60)}${q.q.length > 60 ? "…" : ""}`);
    await S(bridge + q.q, p); bridge = "";
    if (run.aborted) return null;
    let a = await L({});
    const push = (a, text, isFollow) => { const an = E.analyzeAnswer(a.text, q); const rec = { q: text, type: q.type, text: a.text, words: a.words, dur: a.dur, typed: a.typed, timedOut: a.timedOut, interrupted: !!a.interrupted, isFollow, an, aud: a.aud }; answers.push(rec); return rec; };
    let last = push(a, q.q, false), depth = 0;
    while (!run.aborted) {
      const fu0 = E.followUp(last, q, cfg, depth);
      const prob = { friendly: 0.65, normal: 0.8, tough: 1, stress: 1 }[cfg.difficulty];
      if (!fu0 || (depth === 0 && Math.random() > prob && !last.interrupted)) break;
      // depth/probability stay rule-based; the LLM (if available) only rewrites the question to fit the answer
      const fu = last.text ? await llmFollowUp({ role: cfg.role, company: cfg.company, level: cfg.level, tone: D.tone, question: last.q, answer: last.text }, fu0) : fu0;
      if (last.interrupted) mark("Interviewer interrupted");
      await S((last.interrupted ? (hing ? "Ek minute, main beech mein bolunga. " : "Sorry to interrupt. I want to make sure we cover everything. ") : E.ackLine(last, cfg, hing) + " ") + fu, p);
      if (run.aborted) return null;
      a = await L({}); last = push(a, fu, true); depth++;
    }
    bridge = qi < qs.length - 1 ? E.ackLine(last, cfg, hing) + " Next question. " : "";
  }
  if (run.aborted) return null;
  await S(`Thank you ${name}, that's all from my side for this round. It was a pleasure speaking with you.`, p0);

  const camSum = useCam && env.cam && env.cam.ready ? env.cam.summary() : null;
  const aud = env.meter.window(t0, performance.now());
  const blob = env.stream ? await recorder.stop() : null;
  const score = E.scoreRound({ answers, cam: camSum, aud, round, greeting });
  let recId = null;
  if (blob) { recId = "rec_" + Date.now() + "_" + idx; await recDB.put(recId, { blob, expiresAt: Date.now() + 864e5, viewed: false }); }
  const timeline = [...(camSum ? camSum.events : []), ...events].sort((x, y) => x.t - y.t);
  addSession({ id: recId || "s_" + Date.now(), ts: Date.now(), kind: "interview", title: `${cfg.role} · ${round.name}`, score: score.overall, cats: score.cats, qualified: score.qualified, pro: isPro() });
  ui.destroy();
  return { ...score, answers, timeline, recId, round };
}

// ---------------- RESULTS ----------------
function voiceHTML(res) {
  const a = res.aud || {};
  const row = (l, v, hint) => `<tr><td>${l}</td><td><b>${v}</b></td><td class="muted">${hint}</td></tr>`;
  return `<table>${row("Speaking pace", res.wpm ? res.wpm + " words/min" : "n/a (typed)", "Ideal: 110–160")}${row("Filler words", res.fillerPer100 + " per 100 words", "Aim for under 4")}${row("Long pauses (1.2s+)", a.pauses ?? "n/a", "A few thoughtful pauses are good")}${row("Longest pause", a.longestPause ? (a.longestPause / 1000).toFixed(1) + "s" : "n/a", "Under 4s feels confident")}${row("Voice energy variation", a.volCV ? Math.round(a.volCV * 100) + "%" : "n/a", "Higher means less monotone")}${row("First impression (greeting)", (res.greeting ?? "n/a"), "Greeting words, smile and eye contact in the first seconds")}</table><p class="note">Speech recognition usually removes “um/uh”, so pauses are also used to estimate hesitation.</p>`;
}
function bodyHTML(res) {
  const c = res.cam; if (!c) return `<p class="muted">Camera-based analysis wasn't available for this round (telephonic, camera off, or the model couldn't load).</p>`;
  return bars([["Eye contact", c.eye], ["Not looking down", c.lookDown], ["Posture", c.posture], ["Hand gestures", c.gesture], ["Expression / warmth", c.expression], ["Composure (calm, steady)", c.composure]]) + `<ul>${c.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><p class="note">Camera metrics are estimates to guide your practice, not a verdict on your personality.</p>`;
}
function qaHTML(res) {
  return `<table><tr><th>Question / follow-up</th><th>Your answer</th><th>Score</th><th>How to improve</th></tr>${res.answers.map((a) => `<tr><td>${a.isFollow ? "↳ " : ""}${esc(a.q)}</td><td>${a.timedOut ? "<i>(no answer)</i>" : esc(a.text.slice(0, 180)) + (a.text.length > 180 ? "…" : "")}${a.interrupted ? " <span class='tag'>interrupted</span>" : ""}</td><td><b style="color:${E.avg([a.an.total]) >= 70 ? "var(--good)" : E.avg([a.an.total]) >= 50 ? "var(--mid)" : "var(--bad)"}">${a.an.total}</b></td><td>${a.timedOut ? "Always say something, even your thinking process." : a.an.missing.length ? esc(a.an.missing.join("; ")) : "Strong answer"}</td></tr>`).join("")}</table>`;
}

function showResult(res, ctx) {
  const { cfg, round, next, list, results } = ctx, pro = isPro(), pass = res.qualified;
  const m = E.motivation(res.overall), tips = E.tipsFor(res.cats, 3), weak = E.weakAreas(res.cats, 3);
  burst(m.emoji);
  let banner;
  if (pass && next) banner = `<div class="banner ok">${icon("circle-check")} <b>You qualified for the next round:</b> ${esc(next.name)}.</div>`;
  else if (pass) banner = `<div class="banner ok">${icon("flag")} <b>You cleared this round</b>. That was the last round!</div>`;
  else if (pro) banner = `<div class="banner no">${icon("triangle-alert")} Score ${res.overall} is below the pass mark (${round.passMark}). In a real process this might end here. As a Pro member you can retry this round or continue anyway.</div>`;
  else banner = `<div class="banner no">${icon("triangle-alert")} Score ${res.overall} is below the pass mark (${round.passMark}), so your free interview ends here. Subscribe to retry, continue to the next rounds and see your full analysis.</div>`;
  let h = `<div class="panel"><div class="two">${ring(res.overall)}<div><h2>${esc(round.name)} · ${esc(cfg.role)}</h2><div class="big iconrow">${iconRow(m.emoji)}</div><p>${esc(m.text)}</p></div></div>${banner}`;
  const catRows = Object.entries(res.cats).map(([k, v]) => [CAT_LABEL[k], v]);
  if (!pro) {
    h += `<h3>Quick suggestions</h3><ul>${tips.map((t) => `<li><b>${esc(t.area)}:</b> ${esc(t.tip)}</li>`).join("")}</ul>${lockedBlock(`<h3>Score breakdown</h3>${fakeBars()}<h3>Voice &amp; body language</h3>${fakeBars()}`)}`;
  } else {
    h += `<h3>Score breakdown</h3>${bars(catRows)}<h3>Voice analysis</h3>${voiceHTML(res)}<h3>Body language</h3>${bodyHTML(res)}<h3>Question-by-question</h3>${qaHTML(res)}`;
    h += `<h3>What to practise next</h3><ul>${weak.map((w, i) => `<li><b>${esc(w.label)} (${w.score}):</b> ${esc(tips[i] ? tips[i].tip : "")}</li>`).join("")}</ul>`;
    if (results.length > 1) h += `<h3>Your scores so far</h3>${spark(results.map((r) => r.overall))}`;
    if (res.timeline.length) h += `<h3>Timeline</h3><p>${res.timeline.map((e) => `<span class="tag">${Math.floor(e.t / 60)}:${String(e.t % 60).padStart(2, "0")} ${esc(e.label)}</span>`).join(" ")}</p>`;
  }
  const btns = [];
  if (pass && next) btns.push(["next", "Next round →", "primary"]);
  if (pass && !next) btns.push(["menu", "Finish", "primary"]);
  if (!pass && pro) { btns.push(["retry", "Retry this round", "primary"]); if (next) btns.push(["next", "Continue to next round", ""]); else btns.push(["menu", "Finish", ""]); }
  if (!pass && !pro) { btns.push(["upgrade", "Subscribe to continue", "primary"]); btns.push(["restart", "Start over (new interview)", ""]); }
  if (res.recId) btns.push(["watch", pro ? "▶ Watch recording (24h)" : "▶ Watch recording (one time)", ""]);
  btns.push(["fb", "Rate this session", ""]); btns.push(["menu", "Back to menu", "ghost"]);
  h += `<div class="row">${btns.map(([id, l, c]) => `<button class="btn ${c}" data-a="${id}">${l}</button>`).join("")}</div>
    <p class="note">Scores are coaching aids based on your words, voice and camera, not hiring decisions. Keep practising; you're improving every round.</p></div>`;
  app.innerHTML = h;
  window.scrollTo(0, 0);
  return new Promise((resolve) => {
    app.querySelectorAll("[data-a]").forEach((b) => (b.onclick = async () => {
      const a = b.dataset.a;
      if (a === "upgrade") return showUpgrade("Subscribe to retry rounds, continue to the next rounds and see your full report.");
      if (a === "watch") return watchRec(res, pro);
      if (a === "fb") return go("feedback", { from: `${cfg.role} · ${round.name}` });
      resolve(a);
    }));
  });
}

export async function watchRec(res, pro) {
  const r = await recDB.get(res.recId);
  if (!r || r.expiresAt < Date.now()) return toast("This recording has already been deleted (privacy).");
  if (!pro && r.viewed) return showUpgrade("Free plan includes one viewing of each recording. Upgrade to watch it again.");
  const url = URL.createObjectURL(r.blob);
  const m = modal(`<h3>Your recording</h3><video id="rv" src="${url}" controls playsinline style="width:100%;border-radius:12px"></video>
    ${pro && res.timeline ? `<p>${res.timeline.map((e) => `<button class="chip" data-t="${e.t}">${Math.floor(e.t / 60)}:${String(e.t % 60).padStart(2, "0")} ${esc(e.label)}</button>`).join(" ")}</p>` : ""}
    <p class="note">${pro ? "This recording is deleted automatically 24 hours after the interview." : "This is your one free viewing. The recording is deleted when you close this window."}</p>`,
    { onClose: async () => { URL.revokeObjectURL(url); if (!pro) await recDB.del(res.recId); } });
  m.el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const v = $("#rv", m.el); try { v.currentTime = +b.dataset.t; v.play(); } catch {} }));
  if (!pro) { r.viewed = true; await recDB.put(res.recId, r); }
}

async function finalSummary(cfg, results) {
  const avg = Math.round(E.avg(results.map((r) => r.overall)));
  const a = await waitClick(`<h2>${icon("party-popper")} All rounds complete</h2><div class="two">${ring(avg, "average")}<div><p>You finished ${results.length} rounds for <b>${esc(cfg.role)}</b>${cfg.company ? " at " + esc(cfg.company) : ""}.</p></div></div>
    ${bars(results.map((r) => [r.round.name, r.overall]))}${spark(results.map((r) => r.overall))}
    <p>Share your progress so recruiters can see you're serious about growing.</p>`, [{ id: "share", label: "Share on LinkedIn", cls: "primary" }, { id: "dash", label: "Dashboard & practice plan" }, { id: "fb", label: "Rate this app" }, { id: "menu", label: "Menu" }]);
  if (a === "share") { const text = `I just completed mock interviews for ${cfg.role} on ${BRAND.name}. Average score ${avg}/100. Improving every day! #interviewprep`; try { await navigator.clipboard.writeText(text); } catch {} window.open("https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(text), "_blank", "noopener"); toast("Post text copied. Paste it on LinkedIn."); go("home"); }
  else go(a === "menu" ? "home" : a === "fb" ? "feedback" : a);
}

// ---------------- boot ----------------
Object.assign(screens, moreScreens);
document.addEventListener("click", (e) => { const t = e.target.closest("[data-go]"); if (t) { e.preventDefault(); go(t.dataset.go); } });
$("#acct").onclick = async () => { const u = user(); if (!u) return requireUser().then(() => { renderHeader(); go("home"); }); const m = modal(`<h3>${esc(u.name)}</h3><p class="note">${esc(u.email)} · signed in via ${esc(u.provider || "email")} (demo)</p><p>Plan: <b>${isPro() ? "Pro until " + new Date(u.proUntil).toLocaleDateString() : "Free"}</b></p><div class="row">${isPro() ? "" : `<button class="btn primary" data-upgrade>Go Pro</button>`}<button class="btn" id="so">Sign out</button></div>`); $("#so", m.el).onclick = () => { localStorage.removeItem("ic_user"); m.close(); renderHeader(); go("home"); }; };
renderHeader();
recDB.purge(); setInterval(() => recDB.purge(), 60000);
startReminderLoop();
go(location.hash === "#admin" ? "admin" : "home");
window.addEventListener("hashchange", () => { if (location.hash === "#admin") go("admin"); });

// brand: one source of truth (brand.js) feeds the page title, header and footer
document.title = `${BRAND.name} · Interview and speaking practice`;
document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = BRAND.name));
document.querySelectorAll("[data-brand-mark]").forEach((el) => (el.textContent = BRAND.name.charAt(0)));
document.querySelectorAll("[data-brand-tag]").forEach((el) => (el.textContent = BRAND.tagline));
