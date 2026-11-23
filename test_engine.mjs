import assert from "node:assert/strict";
import { DEFAULT_KNOWLEDGE as K, POLITICS, REWRITES, ROLES } from "./data.js";
import * as E from "./engine.js";

// rounds
const base = { role: "Backend", company: "Acme", companyType: "bigtech", level: "senior", campus: false, format: "auto", difficulty: "normal", jd: "" };
let r = E.buildRounds(base, K);
assert.ok(r.length >= 7, "bigtech senior has many rounds");
assert.ok(r.some((x) => x.mode === "panel"), "senior adds panel");
r = E.buildRounds({ ...base, level: "lead", companyType: "startup" }, K);
assert.ok(r.some((x) => x.mode === "ceo"), "lead gets ceo round");
r = E.buildRounds({ ...base, level: "fresher", campus: true }, K);
assert.equal(r.length, 3); assert.ok(r.every((x) => x.mode === "screening" || x.format === "inperson"));
r = E.buildRounds({ ...base, format: "telephonic" }, K); assert.ok(r.every((x) => x.format === "telephonic"));

// questions for every default role and mode
for (const role of ROLES) for (const mode of ["screening", "technical", "case", "behavioral", "managerial", "hr", "panel", "ceo"]) {
  const qs = E.pickQuestions({ mode, nQ: 5 }, { ...base, role, jd: "We need React and TypeScript with GraphQL experience" }, K);
  assert.ok(qs.length >= 3, `${role}/${mode} has questions`);
  assert.ok(qs.every((q) => q.q && !q.q.includes("{")), `${role}/${mode} placeholders filled`);
}
assert.equal(E.familyFor("Marketing Analyst Lead", "sql dashboards"), "data");

// answer analysis
const q = { q: "x", kw: ["api", "cache", "latency"], type: "technical" };
const good = E.analyzeAnswer("I would profile the API first because latency usually comes from the database. For example in my last project I added a cache and cut latency by 40%, however the trade-off was stale data so I used short TTLs. The result was faster pages.", q);
const bad = E.analyzeAnswer("um I don't know basically", q);
assert.ok(good.total > bad.total + 30, `good ${good.total} vs bad ${bad.total}`);
assert.ok(E.countFillers("um basically like you know") >= 3);

// follow-ups
assert.ok(E.followUp({ text: "short", words: 1 }, q, base, 0));
assert.equal(E.followUp({ text: "short", words: 1 }, q, base, 1), null);
assert.ok(E.followUp({ text: "short", words: 1 }, q, { ...base, difficulty: "stress" }, 1));

// scoring
const mk = (a, extra = {}) => ({ text: "t", words: 60, dur: 30, typed: false, an: a, type: "technical", ...extra });
const cam = { ok: true, eye: 0.7, down: 0.05, smile: 0.2, upright: 0.9, handsVisible: 0.4, handMotion: 0.03, headMove: 0.005, blinkPerMin: 18 };
const aud = { voicedMs: 20000, volCV: 0.4, quietRatio: 0.1, pauses: 1, longestPause: 1500 };
const rs = E.scoreRound({ answers: [mk(good), mk(good)], cam, aud, round: { mode: "technical", passMark: 60 }, greeting: 80 });
const rb = E.scoreRound({ answers: [mk(bad, { words: 4 })], cam: { ...cam, eye: 0.1, down: 0.6, upright: 0.3 }, aud, round: { mode: "technical", passMark: 60 }, greeting: 0 });
assert.ok(rs.overall > rb.overall && rs.qualified && !rb.qualified, `${rs.overall} vs ${rb.overall}`);
const rt = E.scoreRound({ answers: [mk(good)], cam: null, aud, round: { mode: "hr", passMark: 60 } });
assert.ok(!("body" in rt.cats), "telephonic skips body");
assert.equal(E.tipsFor(rs.cats).length, 3);
assert.equal(E.planFromWeakAreas(rs.cats).length, 7);

// negotiation
assert.equal(E.parseMoney("I'm looking for 18 LPA").value, 1800000);
assert.equal(E.parseMoney("around $120k").value, 120000);
assert.equal(E.parseMoney("1,50,000 per year").value, 150000);
let st = E.newNegotiation({ offer: 1500000, target: 1800000, difficulty: "normal", currency: "INR" });
let t1 = E.negotiationTurn(st, "Thank you, I'm excited. Based on market research and my experience delivering results, I'm targeting 18 LPA.");
assert.ok(st.offer > 1500000 && st.offer <= st.ceiling);
E.negotiationTurn(st, "I appreciate that. Can we work together on a joining bonus too? 17.5 LPA would work because of my skills.");
E.negotiationTurn(st, "That sounds good, I accept.");
assert.ok(st.done);
const ns = E.scoreNegotiation(st); assert.ok(ns.overall > 50, "good negotiator " + ns.overall);
let st2 = E.newNegotiation({ offer: 1500000, target: 1800000, difficulty: "normal", currency: "INR" });
E.negotiationTurn(st2, "ok I accept");
const ns2 = E.scoreNegotiation(st2); assert.ok(ns2.overall < ns.overall - 25, `early accept ${ns2.overall} vs ${ns.overall}`);

// politics / rewrite / speech lab
const p = E.politicsScore("I would talk to my manager privately, maybe it was a misunderstanding, ask for visibility and credit, and agree going forward to share my work.", POLITICS[0]);
assert.ok(p.score >= 80, "politics " + p.score);
assert.ok(E.politicsScore("He is a liar and a thief, I will go to HR immediately first", POLITICS[0]).score < 30);
assert.ok(E.rewriteScore("I noticed some readability issues — could we refactor them together?", REWRITES[0]).score >= 60);
const sp = E.speechLabScore({ text: "Today I want to talk about learning. First, it builds skills. Second, for example, it opens doors. Also it keeps us curious. In conclusion, learn always. ".repeat(3), durSec: 110, aud });
assert.ok(sp.overall > 55 && sp.home.length);
console.log("All engine tests passed ✅");
