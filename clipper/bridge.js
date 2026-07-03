/* RUNWAY Clip — bridge (runs only on the RUNWAY app) */
(function () {
  "use strict";
  if (!document.querySelector('meta[name="runway-app"]')) return;
  if (window.__rwBridge) return;
  window.__rwBridge = true;

  let auto = true;
  rwSettings().then((s) => (auto = s.autoSync !== false));
  chrome.storage.onChanged.addListener((c, a) => { if (a === "sync" && c[RWK_SET]) { const v = c[RWK_SET].newValue; auto = !v || v.autoSync !== false; } });

  function push() {
    try { chrome.storage.local.get(RWK_Q, (o) => { const l = (o && o[RWK_Q]) || []; if (l.length) window.postMessage({ type: "RUNWAY_SYNC", jobs: rwPayload(l) }, "*"); }); } catch (e) {}
  }
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.type !== "RUNWAY_ACK" || !Array.isArray(d.ids)) return;
    chrome.storage.local.get([RWK_Q, RWK_S], (o) => {
      const rem = ((o && o[RWK_Q]) || []).filter((j) => !d.ids.includes(j.id));
      const set = new Set((o && o[RWK_S]) || []); d.ids.forEach((i) => set.add(i));
      chrome.storage.local.set({ [RWK_Q]: rem, [RWK_S]: [...set].slice(-3000) });
    });
  });
  chrome.runtime.onMessage.addListener((m, _s, send) => { if (m && m.type === "RUNWAY_FORCE_SYNC") { push(); send({ ok: true }); } return false; });
  [200, 800, 2000, 4000].forEach((ms) => setTimeout(() => auto && push(), ms));
  chrome.storage.onChanged.addListener((c, a) => { if (a === "local" && c[RWK_Q] && auto) push(); });
  setInterval(() => auto && push(), 5000);
})();
