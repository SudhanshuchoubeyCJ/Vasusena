// engine.js: pure logic (no browser APIs) so it can be unit-tested in Node.
import { FAMILY, LEVELS, MODE_FORMAT, ROLE_KW, TECH_Q, SENIOR_TECH_Q, GEN_Q, COMPANY_PRE, FOLLOW_ACK, HINGLISH_ACK, TIPS, PLAN_EX, WEIGHTS, DIFFICULTY, CAT_LABEL } from "./data.js";

export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
export const wc = (t) => ((t || "").trim().match(/\S+/g) || []).length;
const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
export function shuffle(a, rnd = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const levelIndex = (id) => Math.max(0, LEVELS.findIndex((l) => l.id === id));
export function weekKey(ts = Date.now()) { const d = new Date(ts); d.setHours(0, 0, 0, 0); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); }

// ---------- text analysis ----------
const FILL = /\b(um+|uh+|uhm|erm|er|ah+|you know|basically|actually|literally|kind of|sort of|i mean|matlab|yaani)\b/gi;
export function countFillers(t) { const m = (t || "").match(FILL) || []; const like = ((t || "").match(/\blike\b/gi) || []).length; return m.length + Math.floor(like / 2); }

const STOP = new Set("with that this have from your will they been were their about which would there what when where should could into also more than other such these those them then only over under between while within without being very much many most some each both able including include etc and the for are you our not but can has had its who how why any all per use using used work working experience role team skills strong knowledge good looking required requirements responsibilities candidate ability years year plus must preferred excellent".split(" "));
export function extractKeywords(jd, n = 8) {
  const f = {};
  (jd || "").toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/).forEach((w) => { w = w.replace(/^[-.]+|[-.]+$/g, ""); if (w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w)) f[w] = (f[w] || 0) + 1; });
  return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
}
export function familyFor(role, jd = "") {
  if (FAMILY[role]) return FAMILY[role];
  const t = (role + " " + jd).toLowerCase();
  const map = [["web", /(react|frontend|backend|api|node|django|java\b|spring|web)/], ["mobile", /(android|ios|swift|kotlin|flutter)/], ["infra", /(devops|kubernetes|docker|sre|cloud|network)/], ["security", /(security|pentest|soc|threat)/], ["data", /(sql|analyst|etl|tableau|power bi|data engineer)/], ["ai", /(machine learning|ml|llm|nlp|ai |deep learning)/], ["design", /(design|ux|ui\b|figma)/], ["product", /(product manager|product owner)/], ["mgmt", /(manager|director|head of|lead)/], ["qa", /(qa|testing|tester|sdet)/], ["content", /(seo|writer|content|marketing)/]];
  for (const [f, re] of map) if (re.test(t)) return f;
  return "other";
}

// ---------- rounds & questions ----------
export function buildRounds(cfg, K) {
  const ct = K.companyTypes[cfg.companyType] || K.companyTypes.other;
  const li = levelIndex(cfg.level);
  let rounds = cfg.campus ? K.campusRounds.map((r) => ({ ...r })) : ct.rounds.map((r) => ({ ...r }));
  if (!cfg.campus && li >= 3) {
    const add = li >= 4 ? K.seniorAdd.lead : K.seniorAdd.senior;
    const hasPanel = rounds.some((r) => r.mode === "panel"), hasCeo = rounds.some((r) => r.mode === "ceo");
    const insertAt = Math.max(1, rounds.length - 1); // before the final HR round
    add.forEach((r, i) => { if ((r.mode === "panel" && hasPanel) || (r.mode === "ceo" && hasCeo)) return; rounds.splice(insertAt + i, 0, { ...r }); });
  }
  if (li === 0) rounds = rounds.filter((r) => r.mode !== "ceo");
  const d = DIFFICULTY[cfg.difficulty] || DIFFICULTY.normal;
  return rounds.map((r, i) => {
    const format = cfg.format && cfg.format !== "auto" ? cfg.format : cfg.campus && r.mode !== "screening" ? "inperson" : MODE_FORMAT[r.mode] || "virtual";
    return { id: "r" + (i + 1), name: r.name, mode: r.mode, format, nQ: r.mode === "screening" ? 4 : r.mode === "ceo" || r.mode === "panel" ? 5 : 5, passMark: d.pass };
  });
}

const fill = (s, cfg) => s.replace(/\{role\}/g, cfg.role).replace(/\{company\}/g, cfg.company || "our company");
export function pickQuestions(round, cfg, K, rnd = Math.random) {
  const fam = familyFor(cfg.role, cfg.jd);
  const li = levelIndex(cfg.level);
  const jdKw = extractKeywords(cfg.jd, 6);
  const roleKw = ROLE_KW[fam] || ROLE_KW.other;
  let pool = [];
  const tech = () => { let p = shuffle(TECH_Q[fam] || TECH_Q.other, rnd); if (li >= 3) p = p.slice(0, 3).concat(shuffle(SENIOR_TECH_Q, rnd).slice(0, 2)); return p; };
  const jdQs = jdKw.slice(0, 2).map((k) => ({ q: `The job description highlights "${k}". Walk me through your hands-on experience with it.`, kw: [k] }));
  switch (round.mode) {
    case "screening": { const g = GEN_Q.screening; pool = [g[0], ...shuffle(g.slice(1), rnd)]; break; }
    case "technical": pool = [...jdQs.slice(0, 1), ...tech()]; break;
    case "case": pool = shuffle(GEN_Q.case[fam] || GEN_Q.case.default, rnd); break;
    case "behavioral": pool = shuffle(GEN_Q.behavioral, rnd); break;
    case "managerial": pool = shuffle(GEN_Q.managerial.concat(GEN_Q.behavioral.slice(0, 2)), rnd); break;
    case "hr": pool = shuffle(GEN_Q.hr, rnd); break;
    case "panel": pool = shuffle([...tech().slice(0, 2), ...GEN_Q.managerial.slice(0, 2), ...GEN_Q.behavioral.slice(0, 2)], rnd); break;
    case "ceo": pool = shuffle(GEN_Q.ceo, rnd); break;
    default: pool = shuffle(GEN_Q.behavioral, rnd);
  }
  if (cfg.difficulty === "stress") pool = [...pool.slice(0, round.nQ - 1), pick(GEN_Q.stress, rnd)];
  return pool.slice(0, round.nQ).map((q) => ({ q: fill(q.q, cfg), kw: [...(q.kw || []), ...roleKw.slice(0, 3), ...jdKw.slice(0, 2)], type: round.mode, baseKw: q.kw || [] }));
}

export function companyBrief(cfg, K, rnd = Math.random) {
  const ct = K.companyTypes[cfg.companyType] || K.companyTypes.other;
  return `A quick word about us${cfg.company ? " at " + cfg.company : ""}: ` + pick(ct.brief, rnd);
}
export function openingPre(cfg, rnd = Math.random) { const tone = DIFFICULTY[cfg.difficulty]?.tone; if (tone === "warm") return pick(COMPANY_PRE.warm, rnd); if (tone === "firm" || tone === "pressure") return pick(COMPANY_PRE.tough, rnd); return ""; }

// ---------- answer analysis ----------
const RE = {
  situation: /\b(when|at my|in my last|in my previous|project|situation|context|was working|once|during)\b/i,
  task: /\b(responsib|goal|needed to|had to|task|objective|asked to|challenge)\b/i,
  action: /\b(i (decided|built|led|implemented|created|designed|wrote|analy[sz]ed|proposed|worked|used|set up|organi[sz]ed|fixed|reviewed|talked|spoke|planned))\b/i,
  result: /\b(result|outcome|impact|improv|reduc|increas|saved|delivered|learned|learnt|achiev|%)\b/i,
  def: /\b(is|means|refers to|defined as|works by)\b/i,
  example: /\b(for example|for instance|such as|e\.g\.|in my project|i used)\b/i,
  trade: /\b(trade-?off|however|depending|on the other hand|because|alternatively|downside|pros and cons)\b/i,
  greeting: /\b(hello|hi|hey|good (morning|afternoon|evening)|namaste|greetings)\b/i,
  thanks: /\b(thank|pleasure|nice to meet|glad|happy to be here|appreciate)\b/i,
};
export function analyzeAnswer(text, q, rnd = Math.random) {
  const t = text || "";
  const words = wc(t);
  const kw = Array.from(new Set((q.kw || []).map((k) => k.toLowerCase())));
  const lower = t.toLowerCase();
  const hits = kw.filter((k) => lower.includes(k));
  const need = Math.max(2, Math.min(4, Math.ceil(kw.length / 3)));
  let relevance = clamp((hits.length / need) * 100);
  if (words < 8) relevance = Math.min(relevance, 25);
  const nums = (t.match(/\b\d+(\.\d+)?%?/g) || []).length;
  let depth = words < 15 ? 20 : words < 35 ? 50 : words < 60 ? 75 : words <= 200 ? 95 : 80;
  depth = clamp(depth + Math.min(10, nums * 5));
  const star = ["situation", "task", "action", "result"].filter((k) => RE[k].test(t)).length * 25;
  const tech = ["def", "example", "trade"].filter((k) => RE[k].test(t)).length * 34;
  const behavioural = ["behavioral", "managerial", "hr", "ceo", "screening", "stress", "panel"].includes(q.type);
  let structure = clamp(behavioural ? Math.max(star, tech * 0.8) : Math.max(tech, star * 0.8));
  if (words < 12) structure = Math.min(structure, 25);
  const fillers = countFillers(t);
  const fillerPer100 = words ? (fillers / words) * 100 : 0;
  const clarity = clamp(100 - fillerPer100 * 6 - (words > 0 && words < 10 ? 30 : 0));
  const total = Math.round(relevance * 0.4 + depth * 0.25 + structure * 0.25 + clarity * 0.1);
  const missing = [];
  if (relevance < 50) missing.push("use more role-specific terms" + (kw.length ? ` (e.g. ${kw.slice(0, 3).join(", ")})` : ""));
  if (nums === 0 && !["screening", "hr"].includes(q.type)) missing.push("add a number or measurable result");
  if (structure < 50) missing.push(behavioural ? "structure it as Situation → Action → Result" : "give a definition, an example and a trade-off");
  if (words < 30) missing.push("go into more depth (aim for 45–120 words)");
  if (fillerPer100 > 5) missing.push("cut filler words");
  return { words, relevance: Math.round(relevance), depth: Math.round(depth), structure: Math.round(structure), clarity: Math.round(clarity), fillers, fillerPer100: +fillerPer100.toFixed(1), nums, hits, total, missing };
}

export function greetingScore(text, cam) {
  const g = RE.greeting.test(text || ""), th = RE.thanks.test(text || "");
  let s = (g ? 50 : 0) + (th ? 20 : 0) + (wc(text) >= 3 ? 10 : 0);
  if (cam) s += (cam.smile > 0.1 ? 10 : 0) + (cam.eye > 0.4 ? 10 : 0); else s += 20;
  return Math.round(clamp(s));
}

export function followUp(a, q, cfg, depth, rnd = Math.random) {
  const d = DIFFICULTY[cfg.difficulty] || DIFFICULTY.normal;
  if (depth >= d.followUps || a.timedOut) return null;
  const t = a.text || "";
  const opts = [];
  if (a.words < 20) opts.push("Could you walk me through that in a bit more detail: how exactly did you approach it?");
  if (!/\d/.test(t) && !["screening", "hr"].includes(q.type)) opts.push("Can you put a number on it: what was the measurable impact of what you did?");
  if (!/\bi\b/i.test(t) && /\bwe\b/i.test(t)) opts.push("You said 'we' quite a lot. What was your own specific contribution?");
  if (/because|trade-?off|decid|chose/i.test(t)) opts.push("Why did you choose that approach over the alternatives?");
  if (!RE.result.test(t)) opts.push("How did it turn out in the end, and what did you learn from it?");
  opts.push("Where did things not go as planned, and how did you handle that?");
  if (d.tone === "firm" || d.tone === "pressure") opts.push("Suppose you had half the time and half the budget: how would you re-plan this?");
  if (d.tone === "pressure") opts.push("Honestly, that sounds fairly generic. What would make your answer different from other candidates?");
  return pick(opts, rnd);
}
export function ackLine(a, cfg, hinglish, rnd = Math.random) {
  const tone = DIFFICULTY[cfg.difficulty]?.tone || "neutral";
  if (hinglish && rnd() < 0.5) return pick(HINGLISH_ACK, rnd);
  if (a.timedOut) return "No problem, let's move on.";
  if (a.words < 10 && tone === "warm") return "That's okay, take your time. We'll come back to this.";
  return pick(FOLLOW_ACK[tone] || FOLLOW_ACK.neutral, rnd);
}

// ---------- scoring ----------
export function camScore(c) {
  if (!c || !c.ok) return null;
  const eye = c.eye < 0.55 ? (c.eye / 0.55) * 100 : c.eye <= 0.88 ? 100 : 88;
  const lookDown = clamp(100 - Math.max(0, c.down - 0.12) * 220);
  const posture = clamp(c.upright * 100 * 1.1);
  const hv = c.handsVisible, hm = c.handMotion;
  let gesture = 70; if (hv < 0.05) gesture = 60; else if (hv >= 0.15 && hv <= 0.75 && hm < 0.04) gesture = 92; else if (hm > 0.09) gesture = 62; else gesture = 80;
  const smile = c.smile >= 0.08 && c.smile <= 0.6 ? 95 : c.smile < 0.08 ? 65 : 75;
  const composure = clamp(100 - Math.max(0, c.headMove - 0.01) * 2200 - Math.max(0, c.blinkPerMin - 30) * 1.5);
  const body = clamp(eye * 0.28 + lookDown * 0.12 + posture * 0.2 + gesture * 0.15 + smile * 0.1 + composure * 0.15);
  const notes = [];
  if (c.eye < 0.5) notes.push("Eye contact was low. Look at the camera lens when making key points.");
  if (c.down > 0.25) notes.push("You looked down often (reading or thinking?). Keep notes minimal.");
  if (c.upright < 0.6) notes.push("Posture slouched at times. Sit tall with relaxed shoulders.");
  if (hv < 0.05) notes.push("Your hands were not visible; show them at chest height for natural gestures.");
  else if (hm > 0.09) notes.push("Hand movement was quite high; keep gestures smooth and purposeful.");
  if (c.smile < 0.06) notes.push("A little more warmth (a natural smile) helps rapport.");
  if (composure < 60) notes.push("Head or blink movement suggests nervousness. Slow down and breathe.");
  if (!notes.length) notes.push("Body language looked natural and confident.");
  return { eye: Math.round(eye), lookDown: Math.round(lookDown), posture: Math.round(posture), gesture: Math.round(gesture), expression: Math.round(smile), composure: Math.round(composure), body: Math.round(body), notes };
}
export function paceScore(wpm) { if (!wpm) return 70; if (wpm >= 110 && wpm <= 160) return 100; if (wpm < 110) return clamp(100 - (110 - wpm) * 1.4); return clamp(100 - (wpm - 160) * 1.6); }
export function voiceScore(aud) {
  if (!aud || !aud.voicedMs) return 70;
  let s = 100;
  if (aud.volCV < 0.18) s -= 15; // monotone / flat energy
  if (aud.quietRatio > 0.35) s -= 20;
  s -= Math.min(25, Math.max(0, aud.pauses - 3) * 4);
  if (aud.longestPause > 4500) s -= 10;
  return Math.round(clamp(s));
}
export function modeGroup(mode) { return mode === "technical" || mode === "case" ? "technical" : mode === "managerial" || mode === "ceo" || mode === "panel" ? "leader" : "people"; }

export function scoreRound({ answers, cam, aud, round, greeting }) {
  const real = answers.filter((a) => !a.timedOut);
  const all = answers;
  const content = all.length ? avg(all.map((a) => a.an.relevance * 0.6 + a.an.depth * 0.4)) : 0;
  const structure = all.length ? avg(all.map((a) => a.an.structure)) : 0;
  const words = real.reduce((s, a) => s + a.words, 0);
  const secs = real.reduce((s, a) => s + (a.dur || 0), 0);
  const wpm = secs > 5 && words > 15 && real.some((a) => !a.typed) ? Math.round(words / (secs / 60)) : 0;
  const fillers = real.reduce((s, a) => s + a.an.fillers, 0);
  const fillerPer100 = words ? (fillers / words) * 100 : 0;
  const commRaw = paceScore(wpm) * 0.35 + clamp(100 - fillerPer100 * 6) * 0.35 + avg(all.map((a) => a.an.clarity)) * 0.15 + (greeting != null ? greeting * 0.15 : 70 * 0.15);
  const comm = clamp(commRaw);
  const voice = voiceScore(aud);
  const cs = camScore(cam);
  const hard = all.filter((a) => a.isFollow || ["stress", "case", "ceo", "panel"].includes(a.type));
  const pressure = hard.length ? avg(hard.map((a) => a.an.total)) : content;
  const cats = { content, structure, comm, voice, pressure };
  const w = { ...WEIGHTS[modeGroup(round.mode)] };
  if (cs) cats.body = cs.body; else { const share = w.body; delete w.body; Object.keys(w).forEach((k) => (w[k] += share / Object.keys(w).length)); }
  let overall = 0, tw = 0; Object.keys(w).forEach((k) => { overall += (cats[k] || 0) * w[k]; tw += w[k]; });
  overall = Math.round(clamp(overall / (tw || 1)));
  const rc = {}; Object.keys(cats).forEach((k) => (rc[k] = Math.round(clamp(cats[k]))));
  return { overall, cats: rc, cam: cs, wpm, fillers, fillerPer100: +fillerPer100.toFixed(1), aud, greeting, qualified: overall >= round.passMark, unanswered: all.filter((a) => a.timedOut).length };
}

export function weakAreas(cats, n = 3) { return Object.entries(cats).sort((a, b) => a[1] - b[1]).slice(0, n).map(([k, v]) => ({ key: k, label: CAT_LABEL[k], score: v })); }
export function tipsFor(cats, n = 3, rnd = Math.random) {
  const out = []; weakAreas(cats, n).forEach((w) => out.push({ area: w.label, tip: pick(TIPS[w.key], rnd) })); return out;
}
// "emoji" holds icon names (see icons.js), kept under the old field name so existing callers keep working.
export function motivation(score) {
  if (score >= 85) return { emoji: "trophy party-popper", text: "Excellent. You sounded like someone I'd hire." };
  if (score >= 70) return { emoji: "star thumbs-up", text: "Strong performance. A few points to polish and you'll be in good shape." };
  if (score >= 55) return { emoji: "flame thumbs-up", text: "Good progress. Each practice round gets you closer." };
  return { emoji: "sprout star", text: "You've finished your first mock. That's the hardest step. The areas below are where to work next." };
}

// ---------- practice plan ----------
export function planFromWeakAreas(cats, minutes = 20, rnd = Math.random) {
  const weak = weakAreas(cats, 3);
  const days = [];
  for (let d = 0; d < 7; d++) {
    const w = weak[d % weak.length];
    const ex = PLAN_EX[w.key];
    const tasks = [`${ex[d % ex.length]} (${Math.round(minutes * 0.6)} min)`];
    if (d === 2 || d === 5) tasks.push(`One mock interview round, ${DIFFICULTY.normal.label.toLowerCase()} mode (${Math.round(minutes * 0.4)} min)`);
    else tasks.push(`Reflect on the last practice and note one improvement (${Math.round(minutes * 0.4)} min)`);
    days.push({ day: d + 1, focus: w.label, tasks });
  }
  return days;
}

// ---------- speech lab ----------
export function speechLabScore({ text, durSec, aud, prepSkipped }) {
  const words = wc(text);
  const wpm = durSec > 5 ? Math.round(words / (durSec / 60)) : 0;
  const fillers = countFillers(text), fp = words ? (fillers / words) * 100 : 0;
  const t = text.toLowerCase();
  const opener = /(today|let me|i'?d like to|i want to talk|my topic|i believe|to begin|firstly|first of all)/.test(t);
  const points = (t.match(/\b(first|second|third|another|also|moreover|for example|for instance|in addition|on the other hand)\b/g) || []).length;
  const closer = /(in conclusion|to sum up|to conclude|in summary|finally|overall|to wrap up|that'?s why)/.test(t);
  const structure = clamp((opener ? 30 : 0) + Math.min(45, points * 15) + (closer ? 25 : 0));
  const unique = new Set(t.match(/[a-z']+/g) || []).size; const variety = words ? clamp((unique / words) * 140) : 0;
  const use = clamp((durSec / 120) * 100 > 100 ? 100 : (durSec / 120) * 100);
  const pace = paceScore(wpm), clarity = clamp(100 - fp * 6), voice = voiceScore(aud);
  const overall = Math.round(pace * 0.2 + clarity * 0.2 + structure * 0.25 + variety * 0.1 + use * 0.1 + voice * 0.15);
  const cats = { pace: Math.round(pace), clarity: Math.round(clarity), structure: Math.round(structure), variety: Math.round(variety), timeUse: Math.round(use), voice: Math.round(voice) };
  const tips = [], home = [];
  if (pace < 75) { tips.push(wpm > 160 ? "You spoke fast. Pause at every full stop." : "Your pace was slow. Practise reading aloud slightly quicker."); home.push("Read a news article aloud for 5 minutes with a timer, aiming for 130 words per minute."); }
  if (fp > 4) { tips.push("Filler words crept in. Replace them with silent pauses."); home.push("Record a 1-minute talk daily and count the fillers; reduce by half in a week."); }
  if (structure < 60) { tips.push("Use a clear opening, 2–3 points and a closing line."); home.push("Practise the 'Opening → Point 1 → Point 2 → Point 3 → Closing' format on a random topic each day."); }
  if (use < 70) { tips.push("You finished early. Add an example or story to use the full time."); home.push("Prepare one personal story for every common topic (work, failure, leadership)."); }
  if (voice < 75) { tips.push("Work on vocal energy: vary your volume and avoid trailing off."); home.push("Do 3 minutes of loud/soft/medium sentence drills, then record yourself."); }
  if (!tips.length) tips.push("Excellent delivery. Keep pushing the difficulty with harder topics.");
  if (!home.length) home.push("Try a new topic daily and speak for 2 minutes without notes.");
  return { overall, cats, wpm, fillers, fillerPer100: +fp.toFixed(1), words, tips, home, qualified: overall >= 60 };
}

// ---------- corporate politics ----------
export function politicsScore(text, sc) {
  let s = 0, hit = [], miss = [];
  sc.tests.forEach((t) => { if (t.re.test(text)) { s += t.w; hit.push(t.label); } else miss.push(t.label); });
  const bad = sc.avoid.filter((a) => a.re.test(text)).map((a) => a.label);
  s -= bad.length * 20; if (wc(text) < 15) s = Math.min(s, 35);
  return { score: Math.round(clamp(s)), hit, miss, bad };
}
export function rewriteScore(text, rw) {
  let hit = 0; rw.keys.forEach((k) => { if (k.test(text)) hit++; });
  const rude = /(stupid|idiot|useless|shut up|your fault|lazy|wrong)\b/i.test(text);
  let s = (hit / rw.keys.length) * 100; if (rude) s -= 40; if (wc(text) < 6) s = Math.min(s, 30);
  return { score: Math.round(clamp(s)), hit, rude };
}

// ---------- salary negotiation ----------
export function parseMoney(t, currency = "INR") {
  const s = (t || "").toLowerCase().replace(/,/g, "");
  let m = s.match(/(\d+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?|lac)\b/); if (m) return { value: +m[1] * 100000 };
  m = s.match(/(\d+(?:\.\d+)?)\s*(m|million)\b/); if (m) return { value: +m[1] * 1000000 };
  m = s.match(/(\d+(?:\.\d+)?)\s*(k|thousand)\b/); if (m) return { value: +m[1] * 1000 };
  m = s.match(/(?:[$₹€£]|rs\.?|inr|usd|eur|gbp)?\s*(\d{5,})/); if (m) return { value: +m[1] };
  if (currency === "INR") { m = s.match(/\b(\d{1,2}(?:\.\d+)?)\s*(?:l\b|per annum|ctc)/); if (m) return { value: +m[1] * 100000 }; }
  return null;
}
export function newNegotiation({ offer, target, difficulty, currency, role, company }) {
  const cap = { friendly: 0.22, normal: 0.15, tough: 0.1, stress: 0.07 }[difficulty] || 0.15;
  return { offer, start: offer, target, ceiling: Math.round(offer * (1 + cap)), difficulty, currency, role, company, round: 0, tactics: new Set(), flags: { justify: 0, collab: 0, anchor: false, nonSalary: 0, aggressive: 0, thanks: 0, researched: 0, acceptedEarly: false }, firstMoney: null, done: false, log: [] };
}
const money = (v, cur) => (cur === "INR" ? `₹${(v / 100000).toFixed(2)} LPA` : (cur === "USD" ? "$" : cur === "EUR" ? "€" : "£") + Math.round(v).toLocaleString("en-US"));
export const fmtMoney = money;
export function negotiationTurn(st, text, rnd = Math.random) {
  st.round++;
  const f = st.flags, t = (text || "").toLowerCase();
  const m = parseMoney(text, st.currency);
  const justify = /(because|experience|delivered|impact|market|research|benchmark|skills?|certif|results?|saved|led|built|value|scope|responsib)/.test(t);
  const collab = /(we can|work together|package|flexib|find a (middle|way)|mutually|both|open to)/.test(t);
  const nonSalary = /(bonus|esop|equity|stock|joining|remote|work from home|learning|training|leave|insurance|review|appraisal|relocation|title|notice)/.test(t);
  const aggressive = /(or else|take it or leave|final offer|insult|ridiculous|unacceptable|walk away|not negotiable)/.test(t);
  const thanks = /(thank|appreciate|excited|enthusias|grateful|love to join|looking forward)/.test(t);
  const researched = /(market|benchmark|glassdoor|levels|industry|range|average|survey|salary report)/.test(t);
  const accept = /\b(i accept|accept the offer|deal\b|it'?s a deal|sounds good|i'?ll take it|happy to accept|okay with that|ok with that)\b/.test(t);
  if (justify) f.justify++; if (collab) f.collab++; if (nonSalary) f.nonSalary++; if (aggressive) f.aggressive++; if (thanks) f.thanks++; if (researched) f.researched++;
  const cur = st.currency; let reply = "", tactic = null;
  if (m && st.firstMoney === null) { st.firstMoney = m.value; if (m.value >= st.target * 0.98) f.anchor = true; }
  if (accept) {
    if (st.round <= 1 || (st.round === 2 && st.offer === st.start)) { f.acceptedEarly = true; st.tactics.add("Early acceptance"); }
    st.done = true; st.final = st.offer; reply = f.acceptedEarly ? `Wonderful, we're delighted to have you! I'll send the offer letter at ${money(st.offer, cur)} today.` : `Great, we have a deal at ${money(st.offer, cur)}. Congratulations and welcome aboard!`;
    return { reply, tactic: null, done: true };
  }
  if (aggressive) { st.tactics.add("Firm stance"); reply = pick(["I want us to keep this collaborative. Let me see what I can do, but ultimatums make it harder for me to advocate for you.", "I hear you, but a friendly conversation will get you further than an ultimatum."], rnd); if (m && m.value > st.offer) { st.offer = Math.min(st.ceiling, st.offer + (st.ceiling - st.offer) * 0.05); } return { reply: reply + ` My current number is ${money(st.offer, cur)}.`, tactic: "Firm stance", done: false }; }
  if (!m) {
    if (nonSalary) { tactic = "Non-cash sweetener"; st.tactics.add(tactic); const bump = (st.ceiling - st.offer) * 0.12; st.offer = Math.min(st.ceiling, st.offer + bump); reply = `I can look at non-salary items like a joining bonus or a review after six months. That allows me to stretch the base slightly to ${money(st.offer, cur)}. What matters most to you?`; }
    else { tactic = "Anchoring"; st.tactics.add(tactic); reply = pick([`Our budgeted range for this role is tight, and ${money(st.offer, cur)} is already competitive. What number did you have in mind?`, `I'd love to find a number that works for both of us. Based on your background, what compensation are you targeting?`], rnd); }
  } else {
    const ask = m.value, gap = ask - st.offer, room = st.ceiling - st.offer;
    if (gap <= 0) { st.offer = ask; st.done = true; st.final = ask; return { reply: `That's actually within our range. Let's go with ${money(ask, cur)}. Welcome aboard!`, tactic: null, done: true }; }
    let frac = justify ? 0.5 : 0.2; if (collab) frac += 0.05; if (researched) frac += 0.05;
    let step = Math.min(gap * frac, room * (justify ? 0.5 : 0.25));
    if (st.round >= 4 && justify) step = Math.max(step, room * 0.4);
    const before = st.offer; st.offer = Math.round(Math.min(st.ceiling, st.offer + step));
    if (room <= 1 || st.offer >= st.ceiling - 1) { tactic = "Budget ceiling"; reply = `I've gone as far as I can on base: ${money(st.ceiling, cur)} is the top of what's approved. Is there anything else, like a joining bonus or a faster review cycle, that would make this work?`; st.offer = st.ceiling; }
    else if (!justify) { tactic = "Scarcity"; reply = `I understand your number, but I do have other strong candidates in the pipeline. Could you tell me what makes you worth that premium? For now I can move to ${money(st.offer, cur)}.`; }
    else if (ask > st.ceiling * 1.15) { tactic = "Budget limit"; reply = `That's above what I can get approved. I can raise the offer to ${money(st.offer, cur)}, and I'd need to justify any more to finance.`; }
    else { tactic = pick(["Foot-in-the-door", "Reciprocity"], rnd); reply = `Thanks for explaining your value. That helps me make the case internally. I can move from ${money(before, cur)} to ${money(st.offer, cur)}. Can you meet me closer to that?`; }
    st.tactics.add(tactic);
  }
  if (st.round >= 6 && !st.done) { st.done = true; st.final = st.offer; reply += ` Since we've gone back and forth, let's close at ${money(st.offer, cur)}. Shall we?`; }
  st.log.push({ you: text, rec: reply, offer: st.offer });
  return { reply, tactic, done: st.done };
}
export function scoreNegotiation(st) {
  const final = st.final ?? st.offer, f = st.flags;
  const goal = Math.min(st.target, st.ceiling), span = Math.max(1, goal - st.start);
  const outcome = clamp(((final - st.start) / span) * 100) * 0.4;
  let tactics = 0; const notes = [];
  if (f.justify >= 1) { tactics += 10; } else notes.push("Back up every ask with value: results, skills, market data.");
  if (f.anchor) tactics += 8; else notes.push("Name your number first and anchor slightly above your real target.");
  if (f.collab >= 1) tactics += 6; else notes.push("Use collaborative language: 'how can we make this work?'");
  if (f.nonSalary >= 1) tactics += 6; else notes.push("Explore non-salary items: joining bonus, equity, review date, remote days.");
  if (!f.acceptedEarly) tactics += 5; else notes.push("You accepted too quickly. Companies expect negotiation; pause and counter first.");
  if (f.researched >= 1) tactics += 5; else notes.push("Mention market research or benchmarks to anchor your ask in facts.");
  const tone = (f.aggressive ? 0 : 10) + (f.thanks ? 10 : 4);
  if (f.aggressive) notes.push("Avoid ultimatums. They reduce goodwill.");
  if (!f.thanks) notes.push("Express genuine enthusiasm and gratitude while negotiating.");
  const overall = Math.round(clamp(outcome + tactics + tone));
  const saved = Math.max(0, st.ceiling - final);
  return { overall, outcome: Math.round(outcome / 0.4), tactics: Math.round((tactics / 40) * 100), tone: Math.round((tone / 20) * 100), notes, final, saved, tacticsUsed: Array.from(st.tactics) };
}
