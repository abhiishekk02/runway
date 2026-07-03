/* RUNWAY Clip — on-page clip button (storage-only) */
(function () {
  "use strict";
  if (window.__rwc) return;
  window.__rwc = true;

  async function one(job, silent) {
    if (typeof rwSave !== "function") { toast("Reload the extension", false); return {}; }
    const r = await rwSave(job);
    if (!silent) toast(r.status === "added" ? `Clipped ${job.company}` : r.status === "dup" ? "Already clipped" : r.status === "blocked" ? "Blocked (blocklist)" : r.status === "synced" ? "Already in RUNWAY" : "Clipped", r.status === "added");
    return r;
  }
  async function clip(sel) {
    if (typeof globalThis.__rwScrape !== "function") return toast("Reload the page", false);
    const r = await one(globalThis.__rwScrape(sel || ""));
    if (r.status === "added") pulse("__rw_b", "Clipped ✓");
  }
  async function clipAll() {
    const jobs = globalThis.__rwScrapeList ? globalThis.__rwScrapeList() : [];
    if (!jobs.length) return toast("No job cards here", false);
    let n = 0; for (const j of jobs) { const r = await one(j, true); if (r.status === "added") n++; }
    toast(`Clipped ${n} · skipped ${jobs.length - n}`, n > 0); pulse("__rw_a", `${n} ✓`);
  }

  function toast(m, good) {
    let t = document.getElementById("__rwt");
    if (!t) { t = document.createElement("div"); t.id = "__rwt";
      t.style.cssText = "position:fixed;z-index:2147483647;left:50%;bottom:26px;transform:translateX(-50%) translateY(12px);background:#0b0b0c;color:#fff;font:600 13px system-ui;padding:11px 18px;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.5);opacity:0;transition:.28s cubic-bezier(.34,1.56,.34,1);border:1px solid rgba(255,255,255,.12)"; document.body.appendChild(t); }
    t.textContent = m; t.style.borderLeft = "3px solid " + (good ? "#c6f24e" : "#ff5d6c");
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; });
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(12px)"; }, 2100);
  }
  function pulse(id, label) { const b = document.getElementById(id); if (!b) return; b.querySelector(".l").textContent = label; clearTimeout(b._t); b._t = setTimeout(() => (b.querySelector(".l").textContent = b.dataset.l), 1700); }

  const isList = () => /\/jobs\/(search|collections)|[?&]q=|viewjob|\/Job\/|\/jobs\?/.test(location.href);
  function mk(id, label, bottom, fn) {
    if (document.getElementById(id)) return;
    const b = document.createElement("button"); b.id = id; b.dataset.l = label;
    b.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#c6f24e;display:inline-block"></span><span class="l">${label}</span>`;
    b.style.cssText = `position:fixed;z-index:2147483647;right:18px;bottom:${bottom}px;display:inline-flex;align-items:center;gap:8px;background:#0b0b0c;color:#fff;border:1px solid rgba(255,255,255,.16);font:700 12.5px 'Segoe UI',system-ui;padding:11px 16px;border-radius:13px;cursor:pointer;box-shadow:0 12px 30px -10px rgba(0,0,0,.7);transition:transform .2s cubic-bezier(.34,1.56,.34,1),border-color .2s`;
    b.onmouseenter = () => { b.style.transform = "translateY(-2px)"; b.style.borderColor = "#c6f24e"; };
    b.onmouseleave = () => { b.style.transform = "none"; b.style.borderColor = "rgba(255,255,255,.16)"; };
    b.addEventListener("click", fn);
    document.body.appendChild(b);
  }
  function mount() {
    if (!document.body) return;
    mk("__rw_b", "Clip", 18, () => clip((window.getSelection && String(window.getSelection())) || ""));
    const a = document.getElementById("__rw_a");
    if (isList() && !a) mk("__rw_a", "Clip all", 60, clipAll); else if (!isList() && a) a.remove();
  }
  mount();
  let last = location.href;
  setInterval(() => { mount(); if (location.href !== last) { last = location.href; mount(); } }, 1500);
  chrome.runtime.onMessage.addListener((m, _s, send) => { if (m && m.type === "RW_CLIP") { clip(m.sel || ""); send({ ok: true }); } return false; });
})();
