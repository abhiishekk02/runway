/* RUNWAY Clip — service worker (badge, menu, shortcuts, auto-sync) */
importScripts("engine.js");

async function badge() {
  const l = await rwQueue();
  await chrome.action.setBadgeText({ text: l.length ? String(l.length) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#c6f24e" });
  await chrome.action.setBadgeTextColor?.({ color: "#0b0b0c" });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "rw-clip", title: "Clip this job to RUNWAY", contexts: ["page", "link"] });
    chrome.contextMenus.create({ id: "rw-sel", title: "Clip selection as note", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "rw-sep", type: "separator", contexts: ["all"] });
    chrome.contextMenus.create({ id: "rw-open", title: "Open RUNWAY", contexts: ["all"] });
  });
  badge();
});
chrome.runtime.onStartup.addListener(badge);

chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === "rw-open") rwOpen(); else rwClipTab(tab, info.selectionText || ""); });
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd === "clip-page") { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); rwClipTab(t, ""); }
  else if (cmd === "sync-now") rwSync(false);
});
chrome.storage.onChanged.addListener((c, a) => { if (a === "local" && c[RWK_Q]) badge(); });
chrome.tabs.onUpdated.addListener(async (id, info, tab) => {
  if (info.status !== "complete" || RW_BLOCK.test(tab.url || "")) return;
  const s = await rwSettings(); if (s.autoSync === false) return;
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: id }, func: () => !!document.querySelector('meta[name="runway-app"]') }); if (r && r.result) rwSendTab(id, { type: "RUNWAY_FORCE_SYNC" }); } catch (e) {}
});
badge();
