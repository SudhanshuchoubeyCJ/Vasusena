// ui.js: shared UI helpers, session environment (mic/camera/voice) and the live listen loop.
import { CONFIG, ACCENTS } from "./data.js";
import * as E from "./engine.js";
import { AudioMeter, Speaker, Recognizer, CamAnalyzer } from "./media.js";
import { icon, iconRow, iconNames } from "./icons.js";
export { icon, iconRow };

export const $ = (s, r = document) => r.querySelector(s);
export const app = document.getElementById("app");
export const nav = { go: () => {} };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const store = {
  get(k, d) { try { const v = localStorage.getItem("ic_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("ic_" + k, JSON.stringify(v)); } catch {} },
};

// ---------- account & plan (demo mode: stored in this browser only) ----------
export const user = () => store.get("user", null);
export const isPro = () => { const u = user(); return !!(u && u.proUntil && u.proUntil > Date.now()); };
export const firstName = () => { const u = user(); return u && u.name ? u.name.split(" ")[0] : "there"; };
export function usageThisWeek() { return store.get("usage", []).filter((t) => E.weekKey(t) === E.weekKey()).length; }
export function canStart() { return isPro() || usageThisWeek() < CONFIG.FREE_WEEKLY_LIMIT; }
export function markStart() { const u = store.get("usage", []); u.push(Date.now()); store.set("usage", u.slice(-200)); }
export function addSession(s) { const a = store.get("sessions", []); a.push(s); store.set("sessions", a.slice(-300)); }

export function toast(m) { const t = $("#toast"); t.textContent = m; t.className = "show"; clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ""), 3600); }
export function burst(names = "party-popper star trophy") {
  const list = iconNames(names);
  for (let i = 0; i < 14; i++) { const s = document.createElement("span"); s.className = "float f" + (i % 3); s.innerHTML = icon(list[i % list.length]); s.style.left = 5 + Math.random() * 90 + "vw"; s.style.animationDelay = Math.random() * 0.6 + "s"; document.body.appendChild(s); setTimeout(() => s.remove(), 3600); }
}
export function modal(html, { onClose } = {}) {
  const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="modal-box"><button class="x" aria-label="Close">×</button>${html}</div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); onClose && onClose(); };
  m.querySelector(".x").onclick = close; m.addEventListener("mousedown", (e) => { if (e.target === m) close(); });
  return { el: m, close };
}
export function renderHeader() { const u = user(); $("#acct").textContent = u ? `${u.name.split(" ")[0]} · ${isPro() ? "Pro" : "Free"}` : "Sign in"; }

export function requireUser() {
  return new Promise((res) => {
    if (user()) return res(user());
    let ok = false;
    const m = modal(`<h2>Sign in to save your progress</h2>
      <p class="note">Demo mode: your profile stays in this browser. Real Google / LinkedIn / GitHub login is added in the next phase.</p>
      <div class="row"><button class="btn prov" data-p="Google">Continue with Google</button><button class="btn prov" data-p="LinkedIn">LinkedIn</button><button class="btn prov" data-p="GitHub">GitHub</button><button class="btn prov" data-p="Email">Email</button></div>
      <form id="lf" class="form hidden"><label class="wide">Your name<input id="ln" maxlength="80" required></label><label class="wide">Email<input id="le" type="email" maxlength="120" required></label><button class="btn primary wide">Save & continue</button></form>`, { onClose: () => !ok && res(null) });
    let prov = "";
    m.el.querySelectorAll(".prov").forEach((b) => (b.onclick = () => { prov = b.dataset.p; $("#lf", m.el).classList.remove("hidden"); $("#ln", m.el).focus(); }));
    $("#lf", m.el).onsubmit = (e) => { e.preventDefault(); const u = { name: $("#ln", m.el).value.trim(), email: $("#le", m.el).value.trim(), provider: prov, joined: Date.now(), proUntil: 0 }; store.set("user", u); ok = true; m.close(); renderHeader(); res(u); };
  });
}
export function showUpgrade(reason = "") {
  const m = modal(`<h2>Go Pro</h2>${reason ? `<p>${esc(reason)}</p>` : ""}
    <ul><li>Unlimited mock interviews and all rounds, even after a failed round</li><li>Full report: charts, per-question feedback, voice &amp; body-language breakdown</li><li>Recording replay with timeline (kept for 24 hours)</li><li>Personal 7-day practice plans with reminders</li><li>Shareable progress for LinkedIn</li></ul>
    <p class="note">Free plan: ${CONFIG.FREE_WEEKLY_LIMIT} interviews per week, score out of 100 plus short tips, one-time recording view.</p>
    <div id="proSlot"><p class="note">Paid plans are not open yet. Check back soon.</p></div>`);
  fetch("/api/health", { cache: "no-store" }).then((r) => r.json()).then((h) => {
    const slot = $("#proSlot", m.el);
    if (h && h.demoPro && slot) slot.innerHTML = `<button class="btn primary" id="demoPro">Activate Pro (test mode, no payment taken)</button>`, wire();
  }).catch(() => {});
  const wire = () => { const b = $("#demoPro", m.el); if (b) b.onclick = demo; };
  const demo = async () => { const u = user() || (await requireUser()); if (!u) return; u.proUntil = Date.now() + 30 * 864e5; store.set("user", u); renderHeader(); m.close(); toast("Pro activated for 30 days (demo)"); nav.go(location.hash === "#admin" ? "admin" : "home"); };
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-upgrade]"); if (t) showUpgrade(t.dataset.upgrade || ""); });

// ---------- charts ----------
export const col = (v) => (v >= 75 ? "var(--good)" : v >= 55 ? "var(--mid)" : "var(--bad)");
export const ring = (score, label = "/100") => `<div class="ring" style="--p:${score}"><b>${score}</b><span>${label}</span></div>`;
export const bars = (items) => items.map(([l, v]) => `<div class="bar"><span>${esc(l)}</span><div class="track"><i style="width:${v}%;background:${col(v)}"></i></div><b>${v}</b></div>`).join("");
export function spark(arr, w = 300, h = 70) {
  if (arr.length < 2) return `<div class="note">Complete more sessions to see your trend</div>`;
  const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * (w - 10) + 5},${h - 6 - (v / 100) * (h - 12)}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="Score trend"><polyline fill="none" stroke="var(--brand2)" stroke-width="3" points="${pts}"/>${arr.map((v, i) => `<circle cx="${(i / (arr.length - 1)) * (w - 10) + 5}" cy="${h - 6 - (v / 100) * (h - 12)}" r="3.5" fill="var(--brand)"/>`).join("")}</svg>`;
}
export const lockedBlock = (html) => `<div class="locked"><div class="blur">${html}</div><div class="lock-cta"><b>${icon("lock")} Detailed analysis is a Pro feature</b><p class="note">Pro adds graphs, per-question feedback, a voice and body-language breakdown, a timeline replay and a personal practice plan.</p><button class="btn primary" data-upgrade>Get Pro</button></div></div>`;
export const fakeBars = () => bars([["Answer content", 72], ["Structure", 64], ["Communication", 70], ["Voice", 66], ["Body language", 74], ["Hard questions", 61]]);

// ---------- live session shell ----------
export function liveShell(title, { video = false } = {}) {
  app.innerHTML = `<div class="live"><div class="live-top"><div><b id="rt">${esc(title)}</b><div class="muted" id="rs"></div></div><div class="pill" id="timer">00:00</div></div>
    <div class="live-main"><div class="stage"><div class="avatar" id="av">${icon("user-round")}</div><div class="who muted" id="who">Interviewer</div><div class="wave"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="me ${video ? "" : "hidden"}"><video id="me" autoplay muted playsinline></video><div class="rec">● REC</div></div></div>
    <div class="cap" id="cap">…</div><div class="you" id="you"></div>
    <div class="meter" title="Your microphone level"><i id="lvl"></i></div>
    <form id="typed"><input id="typedIn" placeholder="Mic not working? Type your answer and press Enter" autocomplete="off"><button class="btn">Send</button></form>
    <div class="row"><button id="endBtn" class="btn ghost">End session</button><span class="note">Live session: no pausing, just like a real interview. Headphones help the mic avoid hearing the interviewer.</span></div></div>`;
  const ui = {
    cap: (t) => ($("#cap").textContent = t), who: (n, e) => { $("#who").textContent = n; if (e) $("#av").innerHTML = icon(e); },
    you: (t) => ($("#you").textContent = t ? "You: " + t : ""), speaking: (b) => $("#av").classList.toggle("speaking", b), sub: (t) => ($("#rs").textContent = t),
    onTyped: null, video: $("#me"), level: (v) => { const l = $("#lvl"); if (l) l.style.width = Math.min(100, v * 700) + "%"; },
  };
  $("#typed").onsubmit = (e) => { e.preventDefault(); const v = $("#typedIn").value.trim(); if (v && ui.onTyped) { $("#typedIn").value = ""; ui.onTyped(v); } };
  const t0 = Date.now();
  ui.iv = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); const el = $("#timer"); if (el) el.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }, 1000);
  ui.destroy = () => clearInterval(ui.iv);
  return ui;
}

// ---------- environment: mic + optional camera ----------
const nullMeter = { real: false, mute: false, voiceNow: () => false, level: () => 0, window: () => ({ voicedMs: 0, meanVol: 0, volCV: 0, quietRatio: 0, pauses: 0, longestPause: 0 }), stop() {} };
export async function startEnv({ camera, lang }) {
  let stream = null, camOn = false;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: camera ? { width: 640, height: 480, facingMode: "user" } : false }); camOn = !!camera; }
  catch (e) { if (camera) { try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); toast("Camera unavailable. Continuing with voice only."); } catch { toast("Microphone unavailable. You can type your answers instead."); } } else toast("Microphone unavailable. You can type your answers instead."); }
  const env = { stream, camOn, speaker: new Speaker(), rec: new Recognizer(lang), meter: nullMeter, cam: null, recorder: null };
  if (stream && stream.getAudioTracks().length) { env.meter = new AudioMeter(stream); env.meter.real = true; }
  if (!env.rec.ok) toast("Speech recognition isn't supported in this browser. Use Chrome or Edge, or type your answers.");
  env.attachVideo = (el) => {
    if (!el || !stream || !env.camOn) return; el.srcObject = stream; el.muted = true;
    if (!env.cam) { env.cam = new CamAnalyzer(el); env.cam.init().then((ok) => { if (ok) env.cam.start(); else toast("Body-language model couldn't load (internet needed). Voice scoring still works."); }); } else env.cam.video = el;
  };
  env.lvlIv = null;
  env.stop = () => { clearInterval(env.lvlIv); env.speaker.cancel(); env.rec.stop(); env.meter.stop(); env.cam && env.cam.stop(); stream && stream.getTracks().forEach((t) => t.stop()); };
  return env;
}

export function listen(env, ui, run, o) {
  return new Promise((res) => {
    const voiceMode = env.meter.real && env.rec.ok;
    env.rec.reset(); if (voiceMode) { env.rec.onUpdate = (t) => ui.you(t); env.rec.start(); }
    ui.you("");
    const t0 = performance.now();
    let tStart = null, lastVoice = t0, done = false, typed = null, nudged = false, iv;
    const finish = (extra = {}) => {
      if (done) return; done = true; clearInterval(iv); if (voiceMode) env.rec.stop(); ui.onTyped = null;
      const t1 = performance.now(), text = (typed !== null ? typed : env.rec.text()) || "";
      const aud = env.meter.window(tStart ?? t0, t1);
      const dur = typed !== null ? 0 : tStart ? (Math.max(lastVoice, tStart + 500) - tStart) / 1000 : 0;
      res({ text, words: E.wc(text), dur, aud, typed: typed !== null, timedOut: !text.trim(), ...extra });
    };
    ui.onTyped = (t) => { typed = t; ui.you(t); finish(); };
    iv = setInterval(() => {
      ui.level && ui.level(env.meter.level());
      if (run.aborted) return finish({ aborted: true });
      const now = performance.now();
      if (voiceMode && env.meter.voiceNow()) { lastVoice = now; if (tStart === null) tStart = now; }
      if (tStart === null) {
        if (!nudged && o.nudge && now - t0 > o.firstWord * 0.6) { nudged = true; ui.cap("Take your time. I'm listening"); }
        if (now - t0 > (voiceMode ? o.firstWord : Math.max(o.firstWord, 60000))) finish();
      } else if (voiceMode) {
        const gotText = env.rec.text().length > 0;
        if (now - lastVoice > o.silence && (gotText || now - lastVoice > o.silence + 2500)) finish();
        else if (o.interruptAt && now - tStart > o.interruptAt) finish({ interrupted: true });
        else if (now - tStart > o.maxDur) finish({ interrupted: true });
      }
    }, 150);
  });
}
export async function say(env, ui, text, p = {}, lang = "en-US", rate = 1) {
  ui.who(p.n || "Interviewer", p.e); ui.cap(text); ui.you(""); ui.speaking(true); env.meter.mute = true;
  await env.speaker.say(text, { lang, voiceIdx: p.idx || 0, pitch: p.pitch || 1, rate });
  env.meter.mute = false; ui.speaking(false); await sleep(250);
}
export const accentOf = (id) => ACCENTS.find((a) => a.id === id) || ACCENTS[0];
export function waitClick(html, buttons) {
  return new Promise((res) => {
    app.innerHTML = `<div class="panel">${html}<div class="row">${buttons.map((b) => `<button class="btn ${b.cls || ""}" data-a="${b.id}">${b.label}</button>`).join("")}</div></div>`;
    app.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => res(b.dataset.a)));
    window.scrollTo(0, 0);
  });
}

// ---------- running-session tracking (so leaving a screen stops mic/camera) ----------
export const cur = { items: [] };
export function track(o) { cur.items.push(o); return o; }
export function endCurrent() {
  cur.items.forEach((o) => { try { if ("aborted" in o) o.aborted = true; o.destroy && o.destroy(); o.stop && o.stop(); } catch {} });
  cur.items = [];
}
