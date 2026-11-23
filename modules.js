// modules.js: salary negotiation, corporate politics, communication lab, dashboard, feedback, admin, reminders.
import { ROLES, ACCENTS, DIFFICULTY, CONFIG, NEGOTIATION, POLITICS, REWRITES, JARGON, TOPICS, CAT_LABEL } from "./data.js";
import * as E from "./engine.js";
import { icon, iconRow } from "./icons.js";
import { BRAND } from "./brand.js";
import { $, app, nav, esc, sleep, store, user, isPro, firstName, canStart, markStart, usageThisWeek, addSession, toast, burst, modal, renderHeader, requireUser, showUpgrade, ring, bars, spark, lockedBlock, fakeBars, liveShell, startEnv, listen, say, accentOf, waitClick, track, col } from "./ui.js";

export const screens = {};
const go = (n, a) => nav.go(n, a);
const opts = (arr, sel) => arr.map((x) => `<option value="${x.id ?? x}" ${(x.id ?? x) === sel ? "selected" : ""}>${x.label ?? x}</option>`).join("");
const pick = (a) => a[Math.floor(Math.random() * a.length)];
async function gate() { if (!(await requireUser())) return false; if (!canStart()) { showUpgrade(`You've used your ${CONFIG.FREE_WEEKLY_LIMIT} free sessions this week.`); return false; } return true; }
const freeTips = (list) => `<h3>Quick suggestions</h3><ul>${list.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
const closing = (id) => `<div class="row"><button class="btn primary" data-go="${id}">Practise again</button><button class="btn" data-go="feedback">Rate this session</button><button class="btn" data-go="dash">Dashboard</button><button class="btn ghost" data-go="home">Menu</button></div>`;

// =============== SALARY NEGOTIATION ===============
const PSY = {
  "Anchoring": "The recruiter made you name the first number. Whoever anchors first shapes the range, so go first, slightly above your real target.",
  "Scarcity": "Mentioning 'other candidates' creates pressure. Stay calm and restate your value instead of lowering your number.",
  "Budget limit": "A 'fixed budget' is a standard limit. Respond by exploring non-cash value: bonus, equity, review date, flexibility.",
  "Budget ceiling": "You reached the top of the base-pay band. The next gains are usually in joining bonus, ESOPs and faster reviews.",
  "Foot-in-the-door": "Small concessions are used to get you to commit. Keep negotiating the whole package, not just the next step.",
  "Reciprocity": "A concession invites you to concede back. Move in smaller steps than they do.",
  "Non-cash sweetener": "Offering perks can replace base pay. Ask for them in addition, not instead.",
  "Firm stance": "Ultimatums reduce goodwill. A collaborative tone gets further.",
  "Strategic silence": "Silence is uncomfortable, and people often fill it by lowering their ask. Staying silent too long can also stall the talk.",
  "Early acceptance": "Accepting at once leaves money on the table; most companies expect a counter.",
};
screens.salary = () => {
  const d = store.get("salcfg", { role: "Backend", company: "", currency: "INR", offer: 15, target: 18, difficulty: "normal", accent: "in" });
  app.innerHTML = `<div class="panel"><h2>${icon("banknote")} Salary negotiation round</h2><p class="muted">I'll play a recruiter who must protect the company's budget. Negotiate the best package you can, politely and with facts. Speak or type.</p>
    <form id="f" class="form"><label>Role<input id="role" value="${esc(d.role)}" required></label><label>Company<input id="company" value="${esc(d.company)}" placeholder="optional"></label>
    <label>Currency<select id="cur">${NEGOTIATION.currencies.map((c) => `<option value="${c.id}" ${c.id === d.currency ? "selected" : ""}>${c.label}</option>`).join("")}</select></label>
    <label><span id="ol">Offer on the table</span><input id="offer" type="number" step="any" min="1" value="${d.offer}" required></label>
    <label><span id="tl">Your target</span><input id="target" type="number" step="any" min="1" value="${d.target}" required></label>
    <label>Recruiter style<select id="diff">${Object.entries(DIFFICULTY).map(([k, v]) => `<option value="${k}" ${k === d.difficulty ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
    <label>Accent<select id="accent">${opts(ACCENTS.map((a) => ({ id: a.id, label: a.label })), d.accent)}</select></label>
    <div class="wide row"><button class="btn primary">Start negotiation</button><button type="button" class="btn ghost" data-go="home">Back</button></div></form>
    <p class="note">For INR, enter amounts in LPA (e.g. 15 means ₹15 LPA). For other currencies enter the full yearly amount.</p></div>`;
  const unit = () => { const inr = $("#cur").value === "INR"; $("#ol").textContent = "Offer on the table" + (inr ? " (LPA)" : " (per year)"); $("#tl").textContent = "Your target" + (inr ? " (LPA)" : " (per year)"); };
  $("#cur").onchange = unit; unit();
  $("#f").onsubmit = async (e) => {
    e.preventDefault(); if (!(await gate())) return;
    const mult = $("#cur").value === "INR" ? 100000 : 1;
    const cfg = { role: $("#role").value.trim(), company: $("#company").value.trim(), currency: $("#cur").value, offer: +$("#offer").value, target: +$("#target").value, difficulty: $("#diff").value, accent: $("#accent").value };
    store.set("salcfg", cfg);
    if (cfg.target <= cfg.offer) return toast("Your target should be higher than the offer.");
    salaryRun({ ...cfg, offer: cfg.offer * mult, target: cfg.target * mult });
  };
};
async function salaryRun(cfg) {
  markStart();
  const run = track({ aborted: false }), acc = accentOf(cfg.accent);
  const env = track(await startEnv({ camera: false, lang: acc.rec }));
  const ui = track(liveShell(`Salary negotiation · ${cfg.role}`));
  $("#endBtn").onclick = () => { run.aborted = true; env.speaker.cancel(); go("home"); };
  const rec = pick(NEGOTIATION.recruiters), p = { n: `${rec} · Recruiter`, e: "user-round", idx: 0, pitch: 1 };
  const S = (t) => (run.aborted ? null : say(env, ui, t, p, acc.tts));
  const st = E.newNegotiation({ offer: cfg.offer, target: cfg.target, difficulty: cfg.difficulty, currency: cfg.currency, role: cfg.role, company: cfg.company });
  ui.sub("Tip: back every ask with value, name your number first, and stay warm.");
  await S(`Hi ${firstName()}, congratulations! We're delighted to offer you the ${cfg.role} position${cfg.company ? " at " + cfg.company : ""}. The package we've approved is ${E.fmtMoney(cfg.offer, cfg.currency)} per year. How are you feeling about it?`);
  let silent = 0;
  while (!st.done && !run.aborted && st.round < 8) {
    const a = await listen(env, ui, run, { firstWord: 30000, silence: 2800, maxDur: 90000, interruptAt: 0, nudge: true });
    if (run.aborted) return;
    if (a.timedOut) { silent++; st.tactics.add("Strategic silence"); if (silent >= 2) { st.done = true; st.final = st.offer; await S("It looks like we're at a pause. Let me keep the current offer open for you."); break; } await S("Take your time. I'm happy to wait while you think about what would make this offer work for you."); continue; }
    const r = E.negotiationTurn(st, a.text);
    await S(r.reply);
  }
  if (run.aborted) return;
  if (st.final == null) st.final = st.offer;
  const sc = E.scoreNegotiation(st), pro = isPro();
  addSession({ id: "n_" + Date.now(), ts: Date.now(), kind: "salary", title: `Salary negotiation · ${cfg.role}`, score: sc.overall, cats: {}, pro });
  env.stop(); ui.destroy(); burst(E.motivation(sc.overall).emoji);
  const gain = st.final - cfg.offer, m = E.motivation(sc.overall);
  let h = `<div class="panel"><div class="two">${ring(sc.overall)}<div><h2>Negotiation result</h2><p>Started at <b>${E.fmtMoney(cfg.offer, cfg.currency)}</b> → closed at <b>${E.fmtMoney(st.final, cfg.currency)}</b> (${gain >= 0 ? "+" : ""}${E.fmtMoney(Math.abs(gain), cfg.currency)}). Your target was ${E.fmtMoney(cfg.target, cfg.currency)}.</p><p><span class="iconrow">${iconRow(m.emoji)}</span> ${esc(m.text)}</p></div></div>`;
  if (!pro) h += freeTips(sc.notes.length ? sc.notes : ["Nice negotiation! Try a tougher recruiter next."]) + lockedBlock(`<h3>Score breakdown</h3>${fakeBars()}<h3>Tactics used on you</h3><p>…</p>`);
  else h += `<h3>Score breakdown</h3>${bars([["Outcome (vs your target)", sc.outcome], ["Negotiation tactics", sc.tactics], ["Tone & rapport", sc.tone]])}
    <p class="note">The company would have been willing to go up to ${E.fmtMoney(st.ceiling, cfg.currency)}. You left ${E.fmtMoney(Math.max(0, st.ceiling - st.final), cfg.currency)} of room on the table.</p>
    <h3>Psychology the recruiter used</h3>${sc.tacticsUsed.length ? `<ul>${sc.tacticsUsed.map((t) => `<li><b>${esc(t)}:</b> ${esc(PSY[t] || "")}</li>`).join("")}</ul>` : "<p>None this time.</p>"}
    <h3>How to improve</h3><ul>${(sc.notes.length ? sc.notes : ["Excellent. Keep practising at a tougher difficulty."]).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    <h3>Conversation</h3><table>${st.log.map((l) => `<tr><td><b>You</b></td><td>${esc(l.you)}</td></tr><tr><td><b>Recruiter</b></td><td>${esc(l.rec)}</td></tr>`).join("")}</table>`;
  app.innerHTML = h + closing("salary") + `<p class="note">Practice simulation. Real offers and company budgets differ. Use market data for your role and city.</p></div>`;
}

// =============== CORPORATE LANGUAGE & POLITICS ===============
screens.politics = () => {
  app.innerHTML = `<div class="panel"><h2>${icon("building-2")} Corporate language &amp; politics</h2><p class="muted">Workplaces run on tone, timing and relationships. Handle 3 tricky situations and rewrite 3 blunt messages, by voice or typing.</p>
    <h3>Common corporate terms</h3><div class="grid">${JARGON.map((j) => `<div class="card" style="cursor:default"><b>${esc(j.term)}</b><p>${esc(j.meaning)}</p><p><i>${esc(j.ex)}</i></p></div>`).join("")}</div>
    <div class="banner info"><b>Golden rules:</b> assume positive intent · talk privately before escalating · use facts, not blame · propose a way forward · protect relationships.</div>
    <div class="row"><button class="btn primary" id="go">Start training</button><button class="btn ghost" data-go="home">Back</button></div></div>`;
  $("#go").onclick = async () => { if (await gate()) politicsRun(); };
};
async function politicsRun() {
  markStart();
  const run = track({ aborted: false }), acc = accentOf("in");
  const env = track(await startEnv({ camera: false, lang: acc.rec }));
  const ui = track(liveShell("Corporate politics training"));
  $("#endBtn").onclick = () => { run.aborted = true; env.speaker.cancel(); go("home"); };
  const sc = E.shuffle(POLITICS).slice(0, 3), rw = E.shuffle(REWRITES).slice(0, 3), p = { n: "Workplace coach", e: "briefcase-business", idx: 0, pitch: 1 };
  const out = [];
  await say(env, ui, `Hi ${firstName()}! I'll describe a tricky situation. Tell me exactly what you'd say or do. Then we'll practise rewriting blunt messages politely.`, p, acc.tts);
  const items = [...sc.map((s) => ({ kind: "sc", s })), ...rw.map((r) => ({ kind: "rw", r }))];
  for (let i = 0; i < items.length && !run.aborted; i++) {
    const it = items[i];
    ui.sub(`Item ${i + 1} of ${items.length}`);
    await say(env, ui, it.kind === "sc" ? `Situation: ${it.s.scenario}` : `Rewrite this politely, as you'd say it at work: "${it.r.blunt}"`, p, acc.tts);
    if (run.aborted) return;
    const a = await listen(env, ui, run, { firstWord: 40000, silence: 3500, maxDur: 90000, interruptAt: 0, nudge: true });
    if (run.aborted) return;
    const r = it.kind === "sc" ? E.politicsScore(a.text, it.s) : E.rewriteScore(a.text, it.r);
    out.push({ it, text: a.text, r });
    if (i < items.length - 1) await say(env, ui, pick(["Thanks, noted.", "Good, let's keep going.", "Okay, next one."]), p, acc.tts);
  }
  if (run.aborted) return;
  const avg = Math.round(E.avg(out.map((o) => o.r.score))), pro = isPro(), m = E.motivation(avg);
  addSession({ id: "p_" + Date.now(), ts: Date.now(), kind: "politics", title: "Corporate language & politics", score: avg, cats: {}, pro });
  env.stop(); ui.destroy(); burst(m.emoji);
  const miss = [...new Set(out.flatMap((o) => o.r.miss || []))].slice(0, 5);
  let h = `<div class="panel"><div class="two">${ring(avg)}<div><h2>Workplace diplomacy score</h2><p><span class="iconrow">${iconRow(m.emoji)}</span> ${esc(m.text)}</p></div></div>`;
  if (!pro) h += freeTips(["Assume positive intent and talk privately before escalating.", "Use facts and impact, not blame, and always propose a way forward.", ...miss]) + lockedBlock(`<h3>Situation-by-situation feedback</h3>${fakeBars()}`);
  else h += `<h3>Item by item</h3>` + out.map((o) => `<div class="day"><b>${o.it.kind === "sc" ? esc(o.it.s.title) : "Rewrite: “" + esc(o.it.r.blunt) + "”"}</b>: <b style="color:${col(o.r.score)}">${o.r.score}</b><br>
      <span class="muted">You said:</span> ${o.text ? esc(o.text) : "<i>(no answer)</i>"}<br>
      ${o.r.hit && o.r.hit.length ? `<span style="color:var(--good)">${icon("check")} ${o.r.hit.map(esc).join(" · ")}</span><br>` : ""}${o.r.miss && o.r.miss.length ? `<span style="color:var(--mid)">${icon("circle-x")} Missing: ${o.r.miss.map(esc).join(" · ")}</span><br>` : ""}${o.r.bad && o.r.bad.length ? `<span style="color:var(--bad)">${icon("triangle-alert")} Avoid: ${o.r.bad.map(esc).join(" · ")}</span><br>` : ""}${o.r.rude ? `<span style="color:var(--bad)">${icon("triangle-alert")} Tone sounded harsh.</span><br>` : ""}
      <b>A strong version:</b> ${esc(o.it.kind === "sc" ? o.it.s.model : o.it.r.model)}</div>`).join("");
  app.innerHTML = h + closing("politics") + `</div>`;
}

// =============== COMMUNICATION LAB ===============
screens.speech = () => {
  let topic = pick(TOPICS);
  const draw = () => { app.innerHTML = `<div class="panel"><h2>${icon("messages-square")} Communication lab</h2><p class="muted">You get a random topic, <b>3 minutes to prepare</b> (you can pause the clock) and then <b>2 minutes to speak</b>. I'll score pace, clarity, structure and voice, then give you homework.</p>
    <div class="banner info" style="font-size:20px"><b>Your topic:</b> ${esc(topic)}</div><div class="row"><button class="btn" id="sh">${icon("shuffle")} Different topic</button><button class="btn primary" id="go">Start (3:00 prep)</button><button class="btn ghost" data-go="home">Back</button></div></div>`; $("#sh").onclick = () => { topic = pick(TOPICS); draw(); }; $("#go").onclick = async () => { if (await gate()) speechRun(topic); }; };
  draw();
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
async function speechRun(topic) {
  markStart();
  const run = track({ aborted: false }), acc = accentOf(store.get("lastcfg", {}).accent || "in");
  const env = track(await startEnv({ camera: false, lang: acc.rec }));
  const voiceMode = env.meter.real && env.rec.ok;
  // 1) preparation
  let left = 180, paused = false, started = false;
  app.innerHTML = `<div class="panel"><h2>Prepare your talk</h2><div class="banner info" style="font-size:20px">${esc(topic)}</div><div class="timer" id="tm">${mmss(left)}</div><p class="muted" style="text-align:center">Jot down: opening line · 2–3 points · a closing line. (Speaking starts automatically at 0:00.)</p><div class="row" style="justify-content:center"><button class="btn" id="pz">⏸ Pause</button><button class="btn primary" id="rd">I'm ready to speak</button></div></div>`;
  const prep = new Promise((res) => {
    const iv = setInterval(() => { if (run.aborted) { clearInterval(iv); return res(); } if (!paused && --left <= 0) { clearInterval(iv); res(); } const t = $("#tm"); if (t) t.textContent = mmss(Math.max(0, left)); }, 1000);
    $("#pz").onclick = () => { paused = !paused; $("#pz").textContent = paused ? "▶ Resume" : "⏸ Pause"; };
    $("#rd").onclick = () => { clearInterval(iv); res(); };
  });
  await prep; if (run.aborted) return;
  // 2) speech
  let sl = 120, typedMode = !voiceMode;
  app.innerHTML = `<div class="panel"><h2>${icon("mic")} Speak now</h2><div class="banner info">${esc(topic)}</div><div class="timer" id="tm">${mmss(sl)}</div><div class="meter"><i id="lvl"></i></div>
    ${typedMode ? `<textarea id="tt" rows="6" style="width:100%" placeholder="Voice isn't available here. Type your speech instead"></textarea>` : `<p class="you" id="live"></p>`}
    <div class="row"><button class="btn primary" id="fin">Finish</button></div></div>`;
  const t0 = performance.now(); if (voiceMode) { env.rec.onUpdate = (t) => { const l = $("#live"); if (l) l.textContent = t; }; env.rec.start(); }
  await new Promise((res) => { const iv = setInterval(() => { const l = $("#lvl"); if (l) l.style.width = Math.min(100, env.meter.level() * 700) + "%"; }, 120); const tick = setInterval(() => { if (run.aborted || --sl <= 0) { clearInterval(tick); clearInterval(iv); res(); } const t = $("#tm"); if (t) t.textContent = mmss(Math.max(0, sl)); }, 1000); $("#fin").onclick = () => { clearInterval(tick); clearInterval(iv); res(); }; });
  if (run.aborted) return;
  const t1 = performance.now(), text = typedMode ? ($("#tt") ? $("#tt").value : "") : env.rec.text();
  const aud = env.meter.window(t0, t1), durSec = Math.min(120, Math.round((t1 - t0) / 1000));
  if (voiceMode) env.rec.stop(); env.stop();
  const sc = E.speechLabScore({ text, durSec, aud }), pro = isPro(), m = E.motivation(sc.overall);
  addSession({ id: "sp_" + Date.now(), ts: Date.now(), kind: "speech", title: "Communication lab", score: sc.overall, cats: {}, pro });
  burst(m.emoji);
  const voiceTips = [];
  if (aud.quietRatio > 0.35) voiceTips.push("Your volume was low at times. Project from your diaphragm and keep sentence endings strong.");
  if (aud.volCV && aud.volCV < 0.18) voiceTips.push("Your voice was quite flat. Emphasise key words and vary pitch to sound engaging.");
  if (aud.pauses > 6) voiceTips.push("Many long pauses: prepare a clear outline so your next point is ready.");
  if (!voiceTips.length) voiceTips.push("Your voice delivery was steady. Try adding deliberate pauses before key points.");
  let h = `<div class="panel"><div class="two">${ring(sc.overall)}<div><h2>Your speech score</h2><p><span class="iconrow">${iconRow(m.emoji)}</span> ${esc(m.text)}</p><p class="muted">${sc.words} words · ${sc.wpm ? sc.wpm + " wpm" : "pace n/a"} · ${sc.fillers} filler words</p></div></div>`;
  if (!pro) h += freeTips(sc.tips) + lockedBlock(`<h3>Detailed scores</h3>${fakeBars()}<h3>Homework &amp; voice coaching</h3><p>…</p>`);
  else h += `<h3>Detailed scores</h3>${bars([["Pace", sc.cats.pace], ["Clarity (fillers)", sc.cats.clarity], ["Structure", sc.cats.structure], ["Vocabulary variety", sc.cats.variety], ["Using the full time", sc.cats.timeUse], ["Voice", sc.cats.voice]])}
    <h3>How to improve</h3><ul>${sc.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><h3>Voice coaching</h3><ul>${voiceTips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    <h3>${icon("book-open")} Homework for this week</h3><ul>${sc.home.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><h3>What you said</h3><p class="muted">${text ? esc(text) : "<i>(nothing captured)</i>"}</p>`;
  app.innerHTML = h + closing("speech") + `</div>`;
}

// =============== DASHBOARD & PLAN ===============
const ICON = { interview: icon("mic"), salary: icon("banknote"), politics: icon("building-2"), speech: icon("messages-square") };
screens.dash = () => {
  const all = store.get("sessions", []).slice().sort((a, b) => b.ts - a.ts), pro = isPro();
  const itv = all.filter((s) => s.kind === "interview" && s.cats && s.cats.content != null);
  const avgCats = {}; itv.forEach((s) => Object.entries(s.cats).forEach(([k, v]) => ((avgCats[k] = avgCats[k] || []).push(v))));
  const catRows = Object.entries(avgCats).map(([k, v]) => [CAT_LABEL[k] || k, Math.round(E.avg(v))]);
  const plan = store.get("plan", null), prefs = store.get("prefs", { time: "19:00", minutes: 20, notify: false });
  app.innerHTML = `<div class="panel"><h2>${icon("chart-line")} Your progress</h2>${all.length ? `${spark(all.slice(0, 15).reverse().map((s) => s.score))}<p class="note">Last ${Math.min(15, all.length)} sessions · ${all.length} total · plan: ${pro ? "Pro" : "Free"}</p>` : `<p class="muted">No sessions yet. Try a mock interview.</p>`}
    ${catRows.length ? (pro ? `<h3>Average by skill</h3>${bars(catRows)}` : lockedBlock(`<h3>Average by skill</h3>${fakeBars()}`)) : ""}
    <div class="row"><button class="btn primary" id="share">Share progress on LinkedIn</button></div></div>
    <div class="panel"><h2>${icon("calendar-days")} Daily practice plan</h2><form id="pf" class="form"><label>Comfortable practice time<input type="time" id="pt" value="${prefs.time}"></label><label>Minutes per day<select id="pm">${[10, 15, 20, 30, 45].map((m) => `<option ${m === prefs.minutes ? "selected" : ""}>${m}</option>`).join("")}</select></label>
      <label class="wide" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="pn" ${prefs.notify ? "checked" : ""}> Remind me to practise (browser notifications)</label><div class="wide row"><button class="btn primary">${plan ? "Regenerate" : "Generate"} my 7-day plan</button></div></form>
      <div id="plan">${plan ? planHTML(plan) : `<p class="muted">Based on your latest interview, I'll build a 7-day plan aimed at your weakest areas.</p>`}</div>
      <p class="note">Reminders work while this tab is open. Background push reminders arrive in the next phase.</p></div>
    <div class="panel"><h2>History</h2>${all.length ? `<table>${all.slice(0, 25).map((s) => `<tr><td>${ICON[s.kind] || "•"}</td><td>${esc(s.title)}</td><td class="muted">${new Date(s.ts).toLocaleString()}</td><td><b style="color:${col(s.score)}">${s.score}</b></td></tr>`).join("")}</table>` : `<p class="muted">Nothing here yet.</p>`}</div>`;
  $("#share").onclick = async () => { const best = all.length ? Math.max(...all.map((s) => s.score)) : 0; const text = `I've completed ${all.length} practice sessions on ${BRAND.name}. Best score ${best}/100. Getting interview-ready one session at a time! #interviewprep`; try { await navigator.clipboard.writeText(text); } catch {} window.open("https://www.linkedin.com/feed/?shareActive=true&text=" + encodeURIComponent(text), "_blank", "noopener"); toast("Post text copied. Paste it on LinkedIn."); };
  $("#pf").onsubmit = async (e) => {
    e.preventDefault();
    const pr = { time: $("#pt").value, minutes: +$("#pm").value, notify: $("#pn").checked };
    if (pr.notify && "Notification" in window && Notification.permission === "default") { const r = await Notification.requestPermission(); if (r !== "granted") { pr.notify = false; toast("Notifications are off. You can enable them in your browser settings."); } }
    else if (pr.notify && !("Notification" in window)) { pr.notify = false; toast("This browser doesn't support notifications."); }
    store.set("prefs", pr);
    const cats = itv.length ? itv[0].cats : { content: 60, structure: 55, comm: 60, voice: 62, body: 58, pressure: 56 };
    const p = { created: Date.now(), days: E.planFromWeakAreas(cats, pr.minutes), done: [] }; store.set("plan", p);
    $("#plan").innerHTML = planHTML(p); toast("Your 7-day plan is ready");
  };
  document.querySelectorAll("[data-day]").forEach((c) => (c.onchange = () => { const p = store.get("plan"); const d = +c.dataset.day; p.done = c.checked ? [...new Set([...(p.done || []), d])] : (p.done || []).filter((x) => x !== d); store.set("plan", p); if (c.checked) burst("thumbs-up flame"); }));
};
function planHTML(p) { return p.days.map((d) => `<div class="day"><label style="flex-direction:row;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" data-day="${d.day}" ${(p.done || []).includes(d.day) ? "checked" : ""}> <b>Day ${d.day} · ${esc(d.focus)}</b></label><ul>${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join(""); }
export function startReminderLoop() {
  setInterval(() => {
    const pr = store.get("prefs", null); if (!pr || !pr.notify) return;
    const n = new Date(), hm = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"), day = n.toDateString();
    if (hm === pr.time && store.get("lastNotified", "") !== day) {
      store.set("lastNotified", day); toast("⏰ Time for your interview practice!");
      if ("Notification" in window && Notification.permission === "granted") new Notification(BRAND.name, { body: "Your practice time! A few minutes today keeps the nerves away" });
    }
  }, 30000);
}

// =============== FEEDBACK ===============
screens.feedback = (arg) => {
  let rating = 0;
  app.innerHTML = `<div class="panel"><h2>${icon("star")} Share your experience</h2><p class="muted">Your feedback helps make the agent better. ${arg && arg.from ? `You're rating: <b>${esc(arg.from)}</b>.` : ""}</p>
    <div class="stars" id="st">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-r="${i}" aria-label="${i} stars">${icon("star")}</button>`).join("")}</div>
    <form id="f" class="form"><label class="wide">Your real-life interview experience (company, role, rounds, questions asked), optional<textarea id="exp" rows="4"></textarea></label>
    <label class="wide">Suggestions, bugs or problems you found<textarea id="sug" rows="4"></textarea></label>
    <div class="wide banner info">${icon("gift")} If your suggestion or bug report really helps improve the product, we may give you <b>1 month of Pro free</b>. The owner reviews and approves each reward; after the free month, the plan renews automatically unless you cancel.</div>
    <div class="wide row"><button class="btn primary">Send feedback</button><button type="button" class="btn ghost" data-go="home">Cancel</button></div></form></div>`;
  document.querySelectorAll("#st button").forEach((b) => (b.onclick = () => { rating = +b.dataset.r; document.querySelectorAll("#st button").forEach((x) => x.classList.toggle("on", +x.dataset.r <= rating)); }));
  $("#f").onsubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast("Please choose a star rating first.");
    const u = user(), fb = { id: "fb_" + Date.now(), ts: Date.now(), name: u ? u.name : "Guest", email: u ? u.email : "", rating, experience: $("#exp").value.trim(), suggestion: $("#sug").value.trim(), from: (arg && arg.from) || "", status: "pending" };
    const all = store.get("feedback", []); all.push(fb); store.set("feedback", all);
    let sent = false;
    try { const r = await fetch(CONFIG.FEEDBACK_ENDPOINT || "/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fb) }); sent = r.ok; } catch {}
    if (!sent && CONFIG.OWNER_EMAIL) window.location.href = `mailto:${CONFIG.OWNER_EMAIL}?subject=${encodeURIComponent(BRAND.name + " feedback (" + rating + "/5)")}&body=${encodeURIComponent(`${fb.name} <${fb.email}>\n\nExperience:\n${fb.experience}\n\nSuggestions:\n${fb.suggestion}`)}`;
    burst("heart star"); toast("Thank you! Your feedback was saved"); go("home");
  };
};

// =============== OWNER REVIEW (open with #admin) ===============
screens.admin = () => {
  app.innerHTML = `<div class="panel"><h2>Owner review</h2><form id="pf" class="row"><input id="pc" type="password" placeholder="Owner token" autocomplete="off" required><button class="btn primary">Open</button></form><p class="note">The token is checked on the server and never stored in this page.</p></div>`;
  $("#pf").onsubmit = async (e) => {
    e.preventDefault();
    const token = $("#pc").value;
    let server = null;
    try { server = await fetch("/api/health", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)); } catch {}
    if (!(server && server.ok)) return toast("The server is not reachable. Owner review only works with the server running.");
    if (!server.admin) return toast("Set ADMIN_TOKEN in the server's .env file first.");
    const r = await fetch("/api/admin/feedback", { headers: { Authorization: "Bearer " + token } });
    if (r.status === 429) return toast("Too many attempts. Wait a minute and try again.");
    if (!r.ok) return toast("Wrong token.");
    adminServer(token, (await r.json()).items);
  };
};
function adminServer(token, items) {
  const avg = items.length ? E.avg(items.map((f) => f.rating)).toFixed(1) : "–";
  app.innerHTML = `<div class="panel"><h2>Feedback inbox</h2><p>${items.length} items · average rating ${avg}/5</p>${items.map((f) => `<div class="day"><b>${icon("star", "on").repeat(f.rating)}</b> ${esc(f.name)} <span class="muted">${esc(f.email)} · ${new Date(f.ts).toLocaleString()} · ${esc(f.status)}</span>
    ${f.from ? `<div class="note">After: ${esc(f.from)}</div>` : ""}${f.experience ? `<p><b>Experience:</b> ${esc(f.experience)}</p>` : ""}${f.suggestion ? `<p><b>Suggestion:</b> ${esc(f.suggestion)}</p>` : ""}
    <div class="row"><button class="btn small primary" data-ap="${esc(f.id)}">Approve</button><button class="btn small" data-rj="${esc(f.id)}">Reject</button></div></div>`).join("") || "<p class='muted'>No feedback yet.</p>"}
    <p class="note">Approval is recorded on the server. Giving the free month automatically needs real sign-in and payments, so for now grant it by hand.</p></div>`;
  document.querySelectorAll("[data-ap],[data-rj]").forEach((b) => (b.onclick = async () => {
    const status = b.dataset.ap ? "approved" : "rejected", id = b.dataset.ap || b.dataset.rj;
    const r = await fetch("/api/admin/feedback", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!r.ok) return toast("Could not save.");
    const list = await fetch("/api/admin/feedback", { headers: { Authorization: "Bearer " + token } }).then((x) => x.json());
    toast("Marked " + status); adminServer(token, list.items);
  }));
}
