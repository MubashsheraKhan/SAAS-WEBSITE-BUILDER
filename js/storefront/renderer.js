import { renderPreview } from "../builder/preview.js";
const status = document.querySelector("#site-status"), frame = document.querySelector("#published-site");
const slug = new URLSearchParams(location.search).get("slug");
function showError(message) { status.innerHTML = ""; const title = document.createElement("p"); title.className = "font-semibold text-plum-900"; title.textContent = "Website unavailable"; const body = document.createElement("p"); body.className = "mt-2 text-sm text-slate-500"; body.textContent = message; status.append(title, body); }
if (!slug) showError("No website address was provided.");
else fetch(`/api/websites/resolve?slug=${encodeURIComponent(slug)}`, { headers: { Accept: "application/json" } })
  .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not load this website."); return data; })
  .then((data) => { document.title = `${data.config.title || data.business.name} — Webaura by III`; frame.srcdoc = renderPreview(data.config, { published: true }); frame.classList.remove("hidden"); frame.style.height = "100vh"; status.classList.add("hidden"); })
  .catch((error) => showError(error.message || "Could not load this website."));
