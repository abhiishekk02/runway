/* RUNWAY Clip — options */
const $ = (s) => document.querySelector(s);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const parse = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

function chips() { $("#chips").innerHTML = parse($("#skills").value).map((s) => `<span class="chip">${esc(s)}</span>`).join(""); }

async function initTheme() {
  const t = (await rwLget(RWK_THEME)) || "noir";
  document.documentElement.dataset.theme = t;
  document.querySelectorAll(".tcard").forEach((c) => c.classList.toggle("on", c.dataset.t === t));
}
document.querySelectorAll(".tcard").forEach((c) => c.addEventListener("click", async () => {
  const t = c.dataset.t;
  document.documentElement.dataset.theme = t;
  document.querySelectorAll(".tcard").forEach((x) => x.classList.toggle("on", x === c));
  await rwLset(RWK_THEME, t);
}));

async function load() {
  const s = await rwSettings();
  $("#appUrl").value = s.appUrl || "";
  $("#skills").value = (s.skills || []).join(", ");
  $("#defaultStage").value = s.defaultStage || "wishlist";
  $("#autoSync").checked = s.autoSync !== false;
  $("#autoL").textContent = $("#autoSync").checked ? "Enabled" : "Disabled";
  $("#blocklist").value = (s.blocklist || []).join(", ");
  chips();
}
$("#skills").addEventListener("input", chips);
$("#autoSync").addEventListener("change", () => { $("#autoL").textContent = $("#autoSync").checked ? "Enabled" : "Disabled"; });
$("#save").addEventListener("click", async () => {
  await rwSaveSettings({ appUrl: $("#appUrl").value.trim(), skills: parse($("#skills").value), defaultStage: $("#defaultStage").value, autoSync: $("#autoSync").checked, blocklist: parse($("#blocklist").value) });
  const el = $("#saved"); el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 1800);
});
$("#reset").addEventListener("click", async () => { if (!confirm("Reset settings?")) return; await rwSaveSettings(Object.assign({}, RW_DEF)); load(); });

initTheme();
load();
