/* ============================================================
   RUNWAY Clip — engine (shared everywhere)
   content scripts · popup · options (<script>) · worker (importScripts)
   Tab/scripting APIs are only *called* from popup + worker.
   ============================================================ */
var RWK_Q = "rw.queue";
var RWK_S = "rw.synced";
var RWK_SET = "rw.settings";
var RWK_THEME = "rw.theme";
var RW_BLOCK = /^(chrome|edge|brave|about|chrome-extension|devtools|view-source):/i;
var RW_DEF = { appUrl: "", skills: [], defaultStage: "wishlist", autoSync: true, blocklist: [] };

/* storage */
const rwLget = (k) => new Promise((r) => chrome.storage.local.get(k, (o) => r(o[k])));
const rwLset = (k, v) => new Promise((r) => chrome.storage.local.set({ [k]: v }, r));
const rwQueue = () => rwLget(RWK_Q).then((l) => l || []);
const rwSetQueue = (l) => rwLset(RWK_Q, l);
function rwSettings() {
  return new Promise((r) => {
    try { chrome.storage.sync.get(RWK_SET, (o) => r(Object.assign({}, RW_DEF, (o && o[RWK_SET]) || {}))); }
    catch (e) { r(Object.assign({}, RW_DEF)); }
  });
}
const rwSaveSettings = (s) => new Promise((r) => chrome.storage.sync.set({ [RWK_SET]: s }, r));

/* scoring */
function rwFit(text, skills) {
  if (!skills || !skills.length) return null;
  const t = (text || "").toLowerCase();
  let h = 0;
  skills.forEach((s) => { s = (s || "").trim().toLowerCase(); if (s && t.includes(s)) h++; });
  return Math.round((h / skills.length) * 100);
}
function rwMatched(text, skills) {
  const t = (text || "").toLowerCase();
  return (skills || []).map((s) => s.trim()).filter((s) => s && t.includes(s.toLowerCase()));
}
const rwBlocked = (co, bl) => { const c = (co || "").toLowerCase(); return (bl || []).some((b) => b && c.includes(b.trim().toLowerCase())); };

function rwPayload(list) {
  return list.map((j) => {
    const x = [];
    if (j.fit != null) x.push("Fit " + j.fit + "%");
    if (j.priority && j.priority !== "med") x.push("Priority: " + j.priority);
    if (j.tags) x.push("Tags: " + j.tags);
    const note = [j.note, x.join(" · ")].filter(Boolean).join("  ·  ").slice(0, 500);
    return { id: j.id, company: j.company, role: j.role, stage: j.stage || "wishlist", source: j.source || "clip", date: j.date, url: j.url, note };
  });
}

/* save (storage-only → works in content scripts too) */
async function rwEnrich(job) {
  const s = await rwSettings();
  if (!job.stage || job.stage === "wishlist") job.stage = s.defaultStage || "wishlist";
  const fit = rwFit([job.role, job.company, job.note, job._desc].join(" "), s.skills);
  if (fit != null) job.fit = fit;
  if (!job.priority) job.priority = "med";
  delete job._desc;
  return { job, s };
}
async function rwSave(raw) {
  const { job, s } = await rwEnrich(raw);
  if (rwBlocked(job.company, s.blocklist)) return { status: "blocked", job };
  const q = await rwQueue();
  const synced = (await rwLget(RWK_S)) || [];
  if (q.some((j) => j.id === job.id)) return { status: "dup", job };
  if (synced.includes(job.id)) return { status: "synced", job };
  q.unshift(job);
  await rwSetQueue(q);
  return { status: "added", job };
}
async function rwRemember(ids) {
  const set = new Set((await rwLget(RWK_S)) || []);
  ids.forEach((i) => set.add(i));
  await rwLset(RWK_S, [...set].slice(-3000));
}

/* tab helpers (popup + worker) */
async function rwScrapeTab(id, sel) {
  await chrome.scripting.executeScript({ target: { tabId: id }, files: ["scrape.js"] });
  const [r] = await chrome.scripting.executeScript({ target: { tabId: id }, func: (s) => (globalThis.__rwScrape ? globalThis.__rwScrape(s) : null), args: [sel || ""] });
  return r && r.result;
}
function rwToastTab(id, msg, ok) {
  chrome.scripting.executeScript({
    target: { tabId: id },
    func: (m, good) => {
      let t = document.getElementById("__rwt");
      if (!t) { t = document.createElement("div"); t.id = "__rwt";
        t.style.cssText = "position:fixed;z-index:2147483647;left:50%;bottom:26px;transform:translateX(-50%) translateY(12px);background:#0b0b0c;color:#fff;font:600 13px system-ui;padding:11px 18px;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.5);opacity:0;transition:.28s cubic-bezier(.34,1.56,.34,1);border:1px solid rgba(255,255,255,.12)"; document.body.appendChild(t); }
      t.textContent = m; t.style.borderLeft = "3px solid " + (good ? "#c6f24e" : "#ff5d6c");
      requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; });
      clearTimeout(window.__rwtT); window.__rwtT = setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(12px)"; }, 2200);
    },
    args: [msg, !!ok],
  }).catch(() => {});
}
async function rwClipTab(tab, sel) {
  if (!tab || !tab.id) return { status: "error", reason: "no tab" };
  if (RW_BLOCK.test(tab.url || "")) return { status: "error", reason: "unsupported" };
  try {
    const raw = await rwScrapeTab(tab.id, sel);
    if (!raw) { rwToastTab(tab.id, "Couldn't read this page", false); return { status: "error", reason: "empty" }; }
    const r = await rwSave(raw);
    const good = r.status === "added";
    rwToastTab(tab.id, good ? `Clipped ${r.job.company}` : r.status === "blocked" ? `Blocked: ${r.job.company}` : r.status === "synced" ? `Already in RUNWAY` : `Already clipped`, good);
    return r;
  } catch (e) { return { status: "error", reason: e.message }; }
}
async function rwFindApps() {
  const tabs = await chrome.tabs.query({});
  const out = [];
  for (const t of tabs) {
    if (!t.id || RW_BLOCK.test(t.url || "")) continue;
    try { const [r] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: () => !!document.querySelector('meta[name="runway-app"]') }); if (r && r.result) out.push(t); }
    catch (e) {}
  }
  return out;
}
const rwSendTab = (id, m) => new Promise((res) => { try { chrome.tabs.sendMessage(id, m, (r) => res(!chrome.runtime.lastError && r && r.ok)); } catch (e) { res(false); } });
async function rwPushTab(id) {
  const list = await rwQueue();
  if (!list.length) return 0;
  await chrome.scripting.executeScript({ target: { tabId: id }, func: (jobs) => window.postMessage({ type: "RUNWAY_SYNC", jobs }, "*"), args: [rwPayload(list)] });
  return list.length;
}
async function rwSync(focus) {
  const apps = await rwFindApps();
  if (!apps.length) return { app: false, count: 0 };
  const list = await rwQueue();
  for (const t of apps) {
    const bridged = await rwSendTab(t.id, { type: "RUNWAY_FORCE_SYNC" });
    if (!bridged) { const n = await rwPushTab(t.id); if (n) { await rwRemember(list.map((j) => j.id)); setTimeout(() => rwSetQueue([]), 1200); } }
    if (focus) { try { await chrome.tabs.update(t.id, { active: true }); if (t.windowId) await chrome.windows.update(t.windowId, { focused: true }); } catch (e) {} }
  }
  return { app: true, count: list.length };
}
async function rwOpen() {
  const apps = await rwFindApps();
  if (apps.length) { try { await chrome.tabs.update(apps[0].id, { active: true }); if (apps[0].windowId) await chrome.windows.update(apps[0].windowId, { focused: true }); } catch (e) {} return { opened: true }; }
  const s = await rwSettings();
  if (s.appUrl) { await chrome.tabs.create({ url: s.appUrl }); return { opened: true }; }
  return { opened: false };
}
