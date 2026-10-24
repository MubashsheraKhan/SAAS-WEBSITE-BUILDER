import { auth } from "../config/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { DEFAULT_SECTIONS, normalizeSections } from "./sections.js";
import { renderPreview } from "./preview.js";

const $ = (selector) => document.querySelector(selector);
const select = $("#business-select"), saveStatus = $("#save-status"), message = $("#editor-message");
const fields = { title: $("#site-title"), tagline: $("#tagline"), logoUrl: $("#logo-url"), template: $("#template-select"), primaryColor: $("#primary-color"), backgroundColor: $("#background-color") };
let user = null, businesses = [], activeBusinessId = "", config = null, saveTimer = null, saving = false, dirty = false;

function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
async function api(path, options = {}) {
  if (!user) throw new Error("Please sign in again.");
  const token = await user.getIdToken();
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function readFields() {
  return { ...config, title: fields.title.value.trim().slice(0, 80), tagline: fields.tagline.value.trim().slice(0, 220), logoUrl: fields.logoUrl.value.trim().slice(0, 500), template: fields.template.value, primaryColor: fields.primaryColor.value, backgroundColor: fields.backgroundColor.value, sections: normalizeSections(config.sections) };
}
function paintPreview() { if (!config) return; const next = readFields(); $("#preview-frame").srcdoc = renderPreview(next); }
function renderSections() {
  const root = $("#sections-list");
  root.innerHTML = config.sections.map((section, index) => `<article class="rounded-xl border border-slate-200 p-3" data-section="${escapeHtml(section.id)}"><div class="mb-3 flex items-center justify-between gap-2"><span class="text-xs font-semibold uppercase tracking-wide text-iris-700">Section ${index + 1}</span><label class="flex items-center gap-2 text-xs"><input data-field="visible" type="checkbox" ${section.visible ? "checked" : ""}> Visible</label></div><label class="mb-1 block text-xs font-medium">Section type</label><select data-field="type" class="field !py-2 text-sm"><option value="hero" ${section.type === "hero" ? "selected" : ""}>Welcome / hero</option><option value="about" ${section.type === "about" ? "selected" : ""}>About</option><option value="highlights" ${section.type === "highlights" ? "selected" : ""}>Highlights</option><option value="contact" ${section.type === "contact" ? "selected" : ""}>Contact</option></select><label class="mb-1 mt-3 block text-xs font-medium">Heading</label><input data-field="title" class="field !py-2 text-sm" maxlength="100" value="${escapeHtml(section.title)}"><label class="mb-1 mt-3 block text-xs font-medium">Text</label><textarea data-field="text" class="field !py-2 text-sm" rows="3" maxlength="500">${escapeHtml(section.text)}</textarea><div class="mt-3 flex items-center justify-between"><input data-field="buttonText" class="field !w-2/3 !py-2 text-sm" maxlength="40" value="${escapeHtml(section.buttonText || "Contact us")}" aria-label="Button text"><button data-remove-section class="text-xs font-semibold text-red-600" type="button">Remove</button></div></article>`).join("");
  root.querySelectorAll("[data-section]").forEach((card) => {
    const id = card.dataset.section;
    card.querySelectorAll("[data-field]").forEach((control) => control.addEventListener("input", () => {
      const section = config.sections.find((item) => item.id === id); if (!section) return;
      section[control.dataset.field] = control.type === "checkbox" ? control.checked : control.value;
      changed();
    }));
    card.querySelector("[data-remove-section]")?.addEventListener("click", () => { config.sections = config.sections.filter((item) => item.id !== id); renderSections(); changed(); });
  });
}
function fillForm(next) {
  config = { ...next, sections: normalizeSections(next.sections) };
  fields.title.value = config.title || "";
  fields.tagline.value = config.tagline || "";
  fields.logoUrl.value = config.logoUrl || "";
  fields.template.value = config.template || "boutique";
  fields.primaryColor.value = config.primaryColor || "#654b9d";
  fields.backgroundColor.value = config.backgroundColor || "#f8f6ff";
  renderSections(); paintPreview(); dirty = false;
}
function changed() { if (!config) return; dirty = true; saveStatus.textContent = "Unsaved changes"; message.textContent = ""; paintPreview(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 900); }
async function loadConfig() {
  if (!activeBusinessId) return;
  saveStatus.textContent = "Loading draft…"; message.textContent = "";
  const result = await api(`/api/websites/config?businessId=${encodeURIComponent(activeBusinessId)}`);
  fillForm(result.config); saveStatus.textContent = result.exists ? "Draft loaded" : "New draft";
}
async function saveDraft() {
  if (!config || !activeBusinessId || saving || !dirty) return;
  saving = true; saveStatus.textContent = "Saving draft…";
  try {
    const result = await api("/api/websites/config", { method: "PUT", body: JSON.stringify({ businessId: activeBusinessId, config: readFields() }) });
    dirty = false; saveStatus.textContent = "Draft saved"; message.textContent = "Your private draft is saved.";
  } catch (error) { saveStatus.textContent = "Could not save"; message.textContent = error.message; message.className = "text-sm text-red-600"; }
  finally { saving = false; if (dirty) saveTimer = setTimeout(saveDraft, 1000); }
}
async function loadBusinesses() {
  const result = await api("/api/business/list"); businesses = result.businesses || [];
  select.innerHTML = businesses.length ? businesses.map((business) => `<option value="${escapeHtml(business.id)}">${escapeHtml(business.name)} · ${escapeHtml(business.type)}</option>`).join("") : '<option value="">Create a workspace first</option>';
  if (!businesses.length) { message.textContent = "Create a business workspace from the dashboard first."; return; }
  const params = new URLSearchParams(location.search), requested = params.get("businessId");
  activeBusinessId = businesses.some((business) => business.id === requested) ? requested : businesses[0].id;
  select.value = activeBusinessId; await loadConfig();
}
select.addEventListener("change", async () => { if (dirty) await saveDraft(); activeBusinessId = select.value; await loadConfig().catch((error) => { message.textContent = error.message; }); });
Object.values(fields).forEach((field) => field.addEventListener("input", changed));
$("#add-section").addEventListener("click", () => {
  if (config.sections.length >= 8) { message.textContent = "A homepage can have up to 8 sections."; return; }
  config.sections.push({ id: `section-${Date.now()}`, type: "about", title: "New section", text: "Add details about your business.", buttonText: "Contact us", visible: true }); renderSections(); changed();
});
$("#preview-button").addEventListener("click", () => { paintPreview(); $("#preview-frame").scrollIntoView({ behavior: "smooth", block: "start" }); });
$("#publish-button").addEventListener("click", async () => {
  if (!activeBusinessId || !config) return;
  if (dirty) await saveDraft();
  $("#publish-button").disabled = true; saveStatus.textContent = "Publishing…";
  try {
    const result = await api("/api/websites/publish", { method: "POST", body: JSON.stringify({ businessId: activeBusinessId }) });
    saveStatus.textContent = "Website published"; message.className = "text-sm text-emerald-700"; message.textContent = "Your live version is published.";
    $("#preview-label").textContent = "Published v" + result.version;
    if (result.url) message.innerHTML = `Published successfully. <a class="underline" target="_blank" rel="noopener noreferrer" href="${escapeHtml(result.url)}">Open live website</a>`;
  } catch (error) { saveStatus.textContent = "Publish failed"; message.className = "text-sm text-red-600"; message.textContent = error.message; }
  finally { $("#publish-button").disabled = false; }
});
onAuthStateChanged(auth, async (signedInUser) => {
  if (!signedInUser) { location.replace("/login.html"); return; }
  user = signedInUser;
  try { await loadBusinesses(); } catch (error) { saveStatus.textContent = "Could not load"; message.textContent = error.message; message.className = "text-sm text-red-600"; }
});
window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });