// media.js: browser-only: microphone meter, speech recognition, voice, camera body-language analysis, recording storage.
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// ---------- microphone level / pause analysis ----------
export class AudioMeter {
  constructor(stream) {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    const src = this.ctx.createMediaStreamSource(stream);
    this.an = this.ctx.createAnalyser(); this.an.fftSize = 1024; src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.log = []; this.floor = 0.01; this.calib = []; this.mute = false;
    this.iv = setInterval(() => this.tick(), 100);
  }
  tick() {
    this.an.getFloatTimeDomainData(this.buf);
    let s = 0; for (const v of this.buf) s += v * v;
    const rms = Math.sqrt(s / this.buf.length), t = performance.now();
    if (this.calib) { this.calib.push(rms); if (this.calib.length >= 15) { this.floor = this.calib.reduce((a, b) => a + b, 0) / 15; this.calib = null; } }
    const thr = Math.max(this.floor * 2.5, 0.015);
    const voice = !this.mute && !this.calib && rms > thr;
    this.log.push({ t, rms, voice });
    if (this.log.length > 9000) this.log.shift();
  }
  voiceNow() { const now = performance.now(); for (let i = this.log.length - 1; i >= 0 && now - this.log[i].t < 400; i--) if (this.log[i].voice) return true; return false; }
  level() { return this.log.length ? this.log[this.log.length - 1].rms : 0; }
  window(t0, t1) {
    const w = this.log.filter((e) => e.t >= t0 && e.t <= t1);
    const v = w.filter((e) => e.voice);
    if (!v.length) return { voicedMs: 0, meanVol: 0, volCV: 0, quietRatio: 0, pauses: 0, longestPause: 0 };
    const vols = v.map((e) => e.rms), mean = vols.reduce((a, b) => a + b, 0) / vols.length;
    const sd = Math.sqrt(vols.reduce((a, b) => a + (b - mean) ** 2, 0) / vols.length);
    const quiet = vols.filter((x) => x < Math.max(this.floor * 3.5, 0.025)).length / vols.length;
    const first = v[0].t, last = v[v.length - 1].t;
    let run = 0, pauses = 0, longest = 0;
    for (const e of w) {
      if (e.t < first || e.t > last) continue;
      if (!e.voice) run += 100; else { if (run >= 1200) pauses++; longest = Math.max(longest, run); run = 0; }
    }
    return { voicedMs: v.length * 100, meanVol: mean, volCV: mean ? sd / mean : 0, quietRatio: quiet, pauses, longestPause: longest };
  }
  stop() { clearInterval(this.iv); try { this.ctx.close(); } catch {} }
}

// ---------- interviewer voice ----------
export class Speaker {
  constructor() { this.voices = []; if ("speechSynthesis" in window) { const load = () => (this.voices = speechSynthesis.getVoices()); load(); speechSynthesis.onvoiceschanged = load; } }
  pick(lang, idx = 0) {
    const l = lang.toLowerCase();
    let c = this.voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === l);
    if (!c.length) c = this.voices.filter((v) => v.lang.toLowerCase().startsWith(l.slice(0, 2)));
    return c.length ? c[idx % c.length] : null;
  }
  say(text, { lang = "en-US", voiceIdx = 0, pitch = 1, rate = 1 } = {}) {
    return new Promise((res) => {
      if (!("speechSynthesis" in window)) { setTimeout(res, Math.min(6000, text.length * 55)); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pick(lang, voiceIdx); if (v) u.voice = v;
      u.lang = v ? v.lang : lang; u.pitch = pitch; u.rate = rate;
      let done = false, tm;
      const fin = () => { if (!done) { done = true; clearTimeout(tm); res(); } };
      u.onend = fin; u.onerror = fin;
      tm = setTimeout(fin, text.length * 90 + 4000);
      speechSynthesis.speak(u);
    });
  }
  cancel() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
}

// ---------- speech to text ----------
export class Recognizer {
  constructor(lang) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.ok = !!SR; this.final = ""; this.interim = ""; this.on = false; this.onUpdate = () => {};
    if (!SR) return;
    this.r = new SR(); this.r.lang = lang; this.r.continuous = true; this.r.interimResults = true;
    this.r.onresult = (e) => {
      let i = "";
      for (let k = e.resultIndex; k < e.results.length; k++) { const res = e.results[k]; if (res.isFinal) this.final += res[0].transcript + " "; else i += res[0].transcript; }
      this.interim = i; this.onUpdate(this.text());
    };
    this.r.onend = () => { if (this.on) try { this.r.start(); } catch {} };
    this.r.onerror = (e) => { if (e.error === "language-not-supported") { this.r.lang = "en-US"; } };
  }
  text() { return (this.final + this.interim).trim(); }
  reset() { this.final = ""; this.interim = ""; }
  start() { if (!this.ok) return; this.reset(); this.on = true; try { this.r.start(); } catch {} }
  stop() { if (!this.ok) return; this.on = false; try { this.r.stop(); } catch {} }
}

// ---------- camera: eye contact, posture, hands, expression (runs locally in the browser) ----------
export class CamAnalyzer {
  constructor(video) { this.video = video; this.ready = false; this.reset(); }
  async init() {
    try {
      const m = await import(MP + "/vision_bundle.mjs");
      const fs = await m.FilesetResolver.forVisionTasks(MP + "/wasm");
      this.face = await m.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" }, runningMode: "VIDEO", outputFaceBlendshapes: true, numFaces: 1 });
      this.pose = await m.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" }, runningMode: "VIDEO", numPoses: 1 });
      this.ready = true;
    } catch (e) { this.error = e; this.ready = false; }
    return this.ready;
  }
  reset() {
    this.c = { frames: 0, face: 0, eye: 0, down: 0, smile: 0, blinks: 0, headMove: 0, headSteps: 0, pose: 0, upright: 0, handsVisible: 0, handMotion: 0, handSteps: 0, events: [] };
    this.t0 = performance.now(); this.prevNose = null; this.prevW = [null, null]; this.blinkOn = false;
    this.streak = { eye: null, down: null, away: null };
  }
  start() { this.stop(); this.iv = setInterval(() => this.step(), 150); }
  stop() { clearInterval(this.iv); }
  ev(label) { this.c.events.push({ t: Math.round((performance.now() - this.t0) / 1000), label }); }
  step() {
    const v = this.video;
    if (!this.ready || !v || v.readyState < 2 || !v.videoWidth) return;
    const now = performance.now(), c = this.c; c.frames++;
    let fr; try { fr = this.face.detectForVideo(v, now); } catch { return; }
    const lm = fr.faceLandmarks && fr.faceLandmarks[0];
    const st = this.streak;
    if (lm) {
      c.face++; st.away = null;
      const bs = {}; ((fr.faceBlendshapes && fr.faceBlendshapes[0] && fr.faceBlendshapes[0].categories) || []).forEach((k) => (bs[k.categoryName] = k.score));
      const L = lm[234], R = lm[454], N = lm[1], T = lm[10], B = lm[152];
      const yaw = (N.x - L.x) / (R.x - L.x || 1), pitch = (N.y - T.y) / (B.y - T.y || 1);
      const lookH = Math.max(bs.eyeLookOutLeft || 0, bs.eyeLookInLeft || 0, bs.eyeLookOutRight || 0, bs.eyeLookInRight || 0);
      const down = ((bs.eyeLookDownLeft || 0) + (bs.eyeLookDownRight || 0)) / 2, up = ((bs.eyeLookUpLeft || 0) + (bs.eyeLookUpRight || 0)) / 2;
      const looksDown = down > 0.4 || pitch > 0.74;
      const eye = yaw > 0.38 && yaw < 0.62 && lookH < 0.5 && !looksDown && up < 0.5;
      if (eye) { c.eye++; st.eye = null; } else { if (st.eye === null) st.eye = now; else if (now - st.eye > 3500) { this.ev("Lost eye contact"); st.eye = now + 1e9; } }
      if (looksDown) { c.down++; if (st.down === null) st.down = now; else if (now - st.down > 2500) { this.ev("Looking down for a long time"); st.down = now + 1e9; } } else st.down = null;
      if (((bs.mouthSmileLeft || 0) + (bs.mouthSmileRight || 0)) / 2 > 0.35) c.smile++;
      const blink = ((bs.eyeBlinkLeft || 0) + (bs.eyeBlinkRight || 0)) / 2 > 0.5;
      if (blink && !this.blinkOn) c.blinks++; this.blinkOn = blink;
      const fw = R.x - L.x || 0.2;
      if (this.prevNose) { c.headMove += Math.hypot(N.x - this.prevNose.x, N.y - this.prevNose.y) / fw; c.headSteps++; }
      this.prevNose = { x: N.x, y: N.y };
    } else {
      if (st.away === null) st.away = now; else if (now - st.away > 2500) { this.ev("Out of frame"); st.away = now + 1e9; }
    }
    let pr; try { pr = this.pose.detectForVideo(v, now); } catch {}
    const p = pr && pr.landmarks && pr.landmarks[0];
    if (p) {
      c.pose++;
      const ls = p[11], rs = p[12], sw = Math.hypot(ls.x - rs.x, ls.y - rs.y) || 0.2;
      const ang = Math.abs(Math.atan2(ls.y - rs.y, ls.x - rs.x)), tilt = (Math.min(ang, Math.PI - ang) * 180) / Math.PI;
      const mid = (ls.y + rs.y) / 2, lift = (mid - p[0].y) / sw;
      if (tilt < 9 && lift > 0.7) c.upright++;
      let vis = 0, motion = 0;
      [p[15], p[16]].forEach((w, i) => {
        if (w && (w.visibility ?? 1) > 0.5 && w.y < mid + sw * 1.6) { vis++; if (this.prevW[i]) motion += Math.hypot(w.x - this.prevW[i].x, w.y - this.prevW[i].y) / sw; this.prevW[i] = { x: w.x, y: w.y }; } else this.prevW[i] = null;
      });
      if (vis) { c.handsVisible++; c.handSteps++; c.handMotion += motion; }
    }
  }
  summary() {
    const c = this.c, f = Math.max(1, c.face), p = Math.max(1, c.pose), mins = Math.max(0.1, (performance.now() - this.t0) / 60000);
    return { ok: c.face > 20, eye: c.eye / f, down: c.down / f, smile: c.smile / f, blinkPerMin: c.blinks / mins, headMove: c.headMove / Math.max(1, c.headSteps), upright: c.upright / p, handsVisible: c.handsVisible / p, handMotion: c.handMotion / Math.max(1, c.handSteps), events: c.events.slice() };
  }
}

// ---------- recording (kept in the browser's own storage only) ----------
export class Recorder {
  constructor(stream) { this.stream = stream; }
  start() {
    this.chunks = [];
    try {
      const mime = ["video/webm;codecs=vp9,opus", "video/webm", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m));
      this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
      this.mr.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
      this.mr.start(1000);
    } catch { this.mr = null; }
  }
  stop() {
    return new Promise((res) => {
      if (!this.mr || this.mr.state === "inactive") return res(null);
      this.mr.onstop = () => res(new Blob(this.chunks, { type: this.mr.mimeType }));
      this.mr.stop();
    });
  }
}

const open = () => new Promise((res, rej) => { const r = indexedDB.open("ic_rec", 1); r.onupgradeneeded = () => r.result.createObjectStore("rec"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const recDB = {
  async put(id, val) { const d = await open(); return new Promise((res, rej) => { const tx = d.transaction("rec", "readwrite"); tx.objectStore("rec").put(val, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
  async get(id) { const d = await open(); return new Promise((res, rej) => { const r = d.transaction("rec").objectStore("rec").get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async del(id) { const d = await open(); return new Promise((res) => { const tx = d.transaction("rec", "readwrite"); tx.objectStore("rec").delete(id); tx.oncomplete = res; tx.onerror = res; }); },
  async purge() {
    try {
      const d = await open();
      await new Promise((res) => {
        const tx = d.transaction("rec", "readwrite"), os = tx.objectStore("rec"), req = os.openCursor();
        req.onsuccess = () => { const cur = req.result; if (!cur) return; if (cur.value && cur.value.expiresAt < Date.now()) cur.delete(); cur.continue(); };
        tx.oncomplete = res; tx.onerror = res;
      });
    } catch {}
  },
};
