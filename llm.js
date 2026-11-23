// llm.js: optional AI layer. Everything falls back to the built-in logic, so the app never breaks without it.
let avail = null;
export async function llmAvailable() {
  if (avail !== null) return avail;
  try { const r = await fetch("/api/health", { cache: "no-store" }); const j = r.ok ? await r.json() : null; avail = !!(j && j.llm); } catch { avail = false; }
  return avail;
}
// Replaces the template follow-up with one that reacts to what the candidate actually said.
// Waits at most 4.5s (a live interview can't have long dead air), then uses `fallback`.
export async function llmFollowUp(ctx, fallback) {
  if (!(await llmAvailable())) return fallback;
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 4500);
  try {
    const r = await fetch("/api/llm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ctx), signal: ac.signal });
    if (!r.ok) return fallback;
    const q = ((await r.json()).text || "").trim();
    return q.length > 8 && q.length < 300 && q.endsWith("?") ? q : fallback;
  } catch { return fallback; } finally { clearTimeout(timer); }
}
