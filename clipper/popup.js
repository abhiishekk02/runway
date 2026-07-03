/* RUNWAY Clip — popup (NOIR, self-contained) */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let sort = "fit", filter = "", openId = null, selfWrite = 0;
const setQ = (l) => { selfWrite = Date.now(); return rwSetQueue(l); };
const PR = [{ k: "high", c: "#ff5d6c" }, { k: "med", c: "#f5c451" }, { k: "low", c: "#8b8b86" }];

/* kinetic wordmark */
(function () {
  const w = "RUNWAY".split("").map((c) => `<span>${c}</span>`).join("") + '<span class="dot">.</span>';
  $("#word").innerHTML = w;
})();

/* theme */
async function initTheme() {
  const t = (await rwLget(RWK_THEME)) || "noir";
  document.documentElement.dataset.theme = t;
}
$("#theme").addEventListener("click", async () => {
  const t = document.documentElement.dataset.theme === "noir" ? "bone" : "noir";
  document.documentElement.dataset.theme = t;
  await rwLset(RWK_THEME, t);
});

/* ── render ── */
function sortList(l) {
  const a = [...l];
  if (sort === "fit") a.sort((x, y) => (y.fit ?? -1) - (x.fit ?? -1));
  else if (sort === "new") a.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
  else if (sort === "az") a.sort((x, y) => (x.company || "").localeCompare(y.company || ""));
  return a;
}
function rowHTML(j, i) {
  const fit = j.fit != null ? `${j.fit}<small>FIT</small>` : "—";
  const prio = j.priority || "med";
  return `<div class="row ${openId === j.id ? "open sel" : ""}" data-id="${j.id}" style="animation-delay:${i * 32}ms">
    <div class="rtap">
      <div class="rhead"><div class="rco">${esc(j.company)}</div><div class="rfit">${fit}</div></div>
      <div class="rrole">${esc(j.role)}</div>
      <div class="rmeta">${esc(j.source || "clip")} · ${esc(j.date || "")} · <b>${esc(j.stage || "wishlist")}</b></div>
    </div>
    <div class="redit"><div class="in">
      <div class="fl"><label>Company</label><input data-f="company" value="${esc(j.company)}"/></div>
      <div class="fl"><label>Role</label><input data-f="role" value="${esc(j.role)}"/></div>
      <div class="two">
        <div class="fl"><label>Stage</label><div class="seg" data-seg>
          <button data-v="wishlist" class="${j.stage === "wishlist" ? "on" : ""}">Wishlist</button>
          <button data-v="applied" class="${j.stage === "applied" ? "on" : ""}">Applied</button>
        </div></div>
        <div class="fl"><label>Priority</label><div class="prio" data-prio>
          ${PR.map((p) => `<span class="pd ${prio === p.k ? "on" : ""}" data-v="${p.k}" style="background:${p.c}" title="${p.k}"></span>`).join("")}
        </div></div>
      </div>
      <div class="fl"><label>Tags</label><input data-f="tags" value="${esc(j.tags || "")}" placeholder="remote, backend…"/></div>
      <div class="fl"><label>Note</label><textarea data-f="note">${esc(j.note || "")}</textarea></div>
      <div class="racts">${j.url ? `<a class="rb" href="${esc(j.url)}" target="_blank">Open ↗</a>` : ""}<button class="rb del" data-del>Remove</button></div>
    </div></div>
  </div>`;
}
async function render() {
  const q = await rwQueue();
  $("#count").textContent = q.length;
  $("#clab").textContent = `Clips — ${String(q.length).padStart(2, "0")}`;
  let shown = filter ? q.filter((j) => (j.company + " " + j.role + " " + (j.tags || "")).toLowerCase().includes(filter)) : q;
  shown = sortList(shown);
  const box = $("#list");
  if (!shown.length) {
    box.innerHTML = `<div class="empty"><div class="g">${q.length ? "nothing matches." : "a clean runway."}</div><p>${q.length ? "TRY ANOTHER FILTER" : "CLIP A JOB TO BEGIN"}</p></div>`;
    return;
  }
  box.innerHTML = shown.map(rowHTML).join("");
  wire();
  if (openId) { const el = box.querySelector(`.row[data-id="${openId}"]`); if (el) el.scrollIntoView({ block: "nearest" }); }
}
function wire() {
  $$(".row").forEach((row) => {
    const id = row.dataset.id;
    const patch = async (fn) => { const l = await rwQueue(); const j = l.find((x) => x.id === id); if (j) { fn(j); await setQ(l); } };
    row.querySelector(".rtap").addEventListener("click", () => {
      const isOpen = row.classList.contains("open");
      $$(".row.open").forEach((r) => r !== row && r.classList.remove("open", "sel"));
      row.classList.toggle("open"); row.classList.toggle("sel");
      openId = row.classList.contains("open") ? id : null;
    });
    row.querySelectorAll("[data-f]").forEach((el) => { el.addEventListener("input", () => patch((j) => (j[el.dataset.f] = el.value))); el.addEventListener("click", (e) => e.stopPropagation()); });
    row.querySelectorAll("[data-seg] button").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); row.querySelectorAll("[data-seg] button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); patch((j) => (j.stage = b.dataset.v)); }));
    row.querySelectorAll("[data-prio] .pd").forEach((d) => d.addEventListener("click", (e) => { e.stopPropagation(); row.querySelectorAll("[data-prio] .pd").forEach((x) => x.classList.remove("on")); d.classList.add("on"); patch((j) => (j.priority = d.dataset.v)); }));
    row.querySelector("[data-del]").addEventListener("click", async (e) => {
      e.stopPropagation(); row.classList.add("out");
      setTimeout(async () => { openId = null; await setQ((await rwQueue()).filter((x) => x.id !== id)); render(); }, 320);
    });
  });
}

/* ── sort ── */
$$("#sort button").forEach((b) => b.addEventListener("click", () => { $$("#sort button").forEach((x) => x.classList.toggle("on", x === b)); sort = b.dataset.s; render(); }));

/* ── connection ── */
let connTimer;
async function conn() {
  const apps = await rwFindApps();
  const c = $("#conn");
  c.className = "conn" + (apps.length ? " ok" : "");
  $("#connt").textContent = apps.length ? "connected" : "no app";
}
function flashConn(text, ok) { clearTimeout(connTimer); const c = $("#conn"); c.className = "conn" + (ok ? " ok" : ""); $("#connt").textContent = text; connTimer = setTimeout(conn, 2600); }

/* ── confetti ── */
function confetti() {
  const cols = ["#c6f24e", "#f6f6f3", "#ff5d6c", "#7cc0ff"];
  for (let i = 0; i < 20; i++) {
    const c = document.createElement("div"); c.className = "cf";
    c.style.background = cols[i % cols.length]; c.style.left = 50 + (Math.random() - 0.5) * 34 + "%"; c.style.top = "62%";
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "1px";
    c.style.transition = `transform ${0.9 + Math.random() * 0.6}s cubic-bezier(.2,.7,.3,1), opacity 1.2s`;
    document.body.appendChild(c);
    requestAnimationFrame(() => { c.style.transform = `translate(${(Math.random() - 0.5) * 280}px, ${-150 - Math.random() * 120}px) rotate(${Math.random() * 540}deg)`; c.style.opacity = "0"; });
    setTimeout(() => c.remove(), 1700);
  }
}

/* ── actions ── */
async function clipPage() {
  flashConn("clipping…", false);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const r = await rwClipTab(tab, "");
  const isFile = tab && tab.url && tab.url.startsWith("file://");
  if (r.status === "added") flashConn(`clipped ${r.job.company}`.toLowerCase(), true);
  else if (r.status === "dup") flashConn("already clipped", false);
  else if (r.status === "synced") flashConn("already in runway", false);
  else if (r.status === "blocked") flashConn("blocked", false);
  else if (r.reason === "unsupported") flashConn("can't clip browser page", false);
  else if (isFile) flashConn("enable file url access", false);
  else flashConn("couldn't read page", false);
  render();
}
async function syncNow() {
  flashConn("syncing…", false);
  const r = await rwSync(true);
  if (!r.app) { flashConn("no runway tab", false); alert("No RUNWAY tab found.\nOpen your RUNWAY app first. If it's a local file, enable “Allow access to file URLs” on the extension's details page."); }
  else if (r.count) { confetti(); flashConn("synced ✓", true); }
  else flashConn("nothing to sync", false);
  setTimeout(render, 500);
}
$("#clip").addEventListener("click", clipPage);
$("#sync").addEventListener("click", syncNow);

/* ── command palette ── */
const CMDS = [
  { k: "✂", t: "Clip this page", h: "clip", run: clipPage },
  { k: "→", t: "Sync to RUNWAY", h: "sync", run: syncNow },
  { k: "↗", t: "Open RUNWAY", h: "open", run: async () => { const r = await rwOpen(); if (!r.opened) alert("Set your RUNWAY app URL in Settings."); else window.close(); } },
  { k: "◐", t: "Toggle theme", h: "view", run: () => $("#theme").click() },
  { k: "➕", t: "Manual add", h: "new", run: manualAdd },
  { k: "⧉", t: "Copy queue JSON", h: "data", run: async () => navigator.clipboard.writeText(JSON.stringify(await rwQueue(), null, 2)).catch(() => {}) },
  { k: "⬇", t: "Export JSON", h: "data", run: async () => dl("runway-clips.json", JSON.stringify(await rwQueue(), null, 2), "application/json") },
  { k: "⬇", t: "Export CSV", h: "data", run: exportCsv },
  { k: "⬆", t: "Import JSON", h: "data", run: () => $("#file").click() },
  { k: "🧹", t: "Clear synced history", h: "data", run: async () => { await rwLset(RWK_S, []); flashConn("synced history cleared", true); } },
  { k: "🗑", t: "Clear queue", h: "danger", run: async () => { if (confirm("Clear the queue?")) { await setQ([]); render(); } } },
  { k: "⚙", t: "Settings", h: "app", run: () => chrome.runtime.openOptionsPage() },
];
let palItems = [], palSel = 0;
function openPal() { $("#palette").classList.add("on"); $("#palIn").value = ""; buildPal(""); setTimeout(() => $("#palIn").focus(), 20); }
function closePal() { $("#palette").classList.remove("on"); }
async function buildPal(q) {
  q = q.toLowerCase(); palSel = 0;
  const cmds = CMDS.filter((c) => !q || c.t.toLowerCase().includes(q)).map((c) => ({ ...c, cmd: true }));
  const clips = (await rwQueue()).filter((j) => q && (j.company + " " + j.role).toLowerCase().includes(q)).slice(0, 6)
    .map((j) => ({ k: "•", t: `${j.company} — ${j.role}`, h: "clip", run: () => { openId = j.id; closePal(); render(); } }));
  palItems = [...cmds, ...clips];
  $("#palRes").innerHTML = palItems.map((it, i) => `<div class="pit ${i === 0 ? "sel" : ""}" data-i="${i}"><span class="k">${it.k}</span><span class="t">${esc(it.t)}</span><span class="h">${it.h}</span></div>`).join("") || '<div class="pit"><span class="t" style="color:var(--dim)">No matches</span></div>';
  $$("#palRes .pit[data-i]").forEach((el) => el.addEventListener("click", () => { palItems[+el.dataset.i].run(); closePal(); }));
}
function palMove(d) { palSel = Math.max(0, Math.min(palItems.length - 1, palSel + d)); $$("#palRes .pit").forEach((el, i) => el.classList.toggle("sel", i === palSel)); const s = $("#palRes .pit.sel"); if (s) s.scrollIntoView({ block: "nearest" }); }
$("#pal").addEventListener("click", openPal);
$("#palette [data-close]").addEventListener("click", closePal);
$("#palIn").addEventListener("input", (e) => buildPal(e.target.value));
$("#palIn").addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
  else if (e.key === "Enter") { const it = palItems[palSel]; if (it) { it.run(); if (!it.cmd || it.h !== "clip") closePal(); else closePal(); } }
  else if (e.key === "Escape") closePal();
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#palette").classList.contains("on") ? closePal() : openPal(); }
  else if (e.key === "Escape") closePal();
});

/* ── helpers ── */
async function manualAdd() {
  const co = prompt("Company:"); if (!co) return;
  const role = prompt("Role:", "Software Engineer") || "Software Engineer";
  const l = await rwQueue();
  l.unshift({ id: "manual:" + Date.now() + Math.random().toString(36).slice(2, 6), company: co.slice(0, 80), role: role.slice(0, 120), stage: "wishlist", priority: "med", source: "manual", date: new Date().toISOString().slice(0, 10), url: "", note: "", tags: "" });
  await setQ(l); render();
}
function dl(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
async function exportCsv() {
  const l = await rwQueue(); const cols = ["company", "role", "stage", "priority", "fit", "tags", "url", "note", "date"];
  dl("runway-clips.csv", [cols.join(","), ...l.map((j) => cols.map((c) => `"${String(j[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n"), "text/csv");
}
$("#file").addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return; const r = new FileReader();
  r.onload = async () => { try { const inc = JSON.parse(r.result); if (!Array.isArray(inc)) throw 0; const l = await rwQueue(); const ids = new Set(l.map((j) => j.id)); inc.forEach((j) => { if (j && j.company) { if (!j.id || ids.has(j.id)) j.id = "imp:" + Date.now() + Math.random().toString(36).slice(2, 6); l.push(j); } }); await setQ(l); render(); } catch (err) { alert("Invalid JSON"); } };
  r.readAsText(f);
});

/* live */
chrome.storage.onChanged.addListener((c, a) => { if (a === "local" && c[RWK_Q] && Date.now() - selfWrite > 400) render(); });

initTheme();
render();
conn();
