import { auth } from "../config/firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

const form = document.querySelector("#business-form");
const message = document.querySelector("#message");
const list = document.querySelector("#business-list");
const createPanel = document.querySelector("#create-panel");
const count = document.querySelector("#workspace-count");
const setupCount = document.querySelector("#setup-count");
const accountLabel = document.querySelector("#account-label");
let currentUser = null;
let authReady = false;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function businessTypeLabel(type) {
  return ({ ecommerce: "Ecommerce store", catalogue: "Product catalogue", service: "Service business" })[type] || "Business";
}

function statusLabel(status) {
  return ({ setup: "Setup", active: "Active", suspended: "Suspended" })[status] || "Setup";
}

async function apiRequest(path, options = {}) {
  if (!currentUser) throw new Error("Please log in again.");
  const send = async (forceRefresh = false) => {
    const token = await currentUser.getIdToken(forceRefresh);
    return fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
  };
  let response = await send(false);
  // Recover once from an expired/stale Firebase ID token without replaying indefinitely.
  if (response.status === 401) response = await send(true);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function renderBusinesses(businesses) {
  count.textContent = String(businesses.length);
  setupCount.textContent = String(businesses.filter((business) => business.status === "setup").length);
  if (!businesses.length) {
    list.innerHTML = '<div class="rounded-2xl border border-dashed border-iris-200 bg-white p-8 md:col-span-2 xl:col-span-3"><h3 class="font-semibold text-plum-900">Your first workspace starts here</h3><p class="mt-2 text-sm text-slate-600">Create a workspace for your shop, catalogue or service business.</p><button id="empty-create" class="btn-primary mt-4" type="button">Create workspace</button></div>';
    document.querySelector("#empty-create")?.addEventListener("click", openCreate);
    return;
  }
  list.innerHTML = businesses.map((business) => `
    <article class="flex min-h-52 flex-col rounded-2xl border border-iris-100 bg-white p-6 shadow-soft">
      <div class="flex items-start justify-between gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-iris-100 text-lg font-bold text-iris-700" aria-hidden="true">${escapeHtml((business.name || "B").charAt(0).toUpperCase())}</div><span class="rounded-full bg-iris-50 px-3 py-1 text-xs font-semibold text-iris-700">${escapeHtml(statusLabel(business.status))}</span></div>
      <h3 class="mt-4 text-lg font-bold text-plum-900">${escapeHtml(business.name)}</h3>
      <p class="mt-1 text-sm text-slate-500">${escapeHtml(businessTypeLabel(business.type))}</p>
      <div class="mt-auto flex items-center justify-between gap-3 pt-5"><span class="truncate text-xs text-slate-400">ID: ${escapeHtml(business.id.slice(0, 8))}</span><a class="btn-primary !px-3 !py-2" href="/dashboard/website-builder.html?businessId=${escapeHtml(business.id)}">Open editor</a></div>
    </article>`).join("");
}

async function loadBusinesses() {
  if (!currentUser) return;
  list.innerHTML = '<div class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading workspaces…</div>';
  try {
    const result = await apiRequest("/api/business/list");
    renderBusinesses(result.businesses || []);
  } catch (error) {
    list.innerHTML = `<div class="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-700">${escapeHtml(error.message)} <button id="retry-load" class="ml-2 underline" type="button">Try again</button></div>`;
    document.querySelector("#retry-load")?.addEventListener("click", loadBusinesses);
  }
}

function openCreate() {
  createPanel.classList.remove("hidden");
  document.querySelector("#business-name")?.focus();
}
function closeCreate() {
  createPanel.classList.add("hidden");
}

document.querySelector("#show-create")?.addEventListener("click", openCreate);
document.querySelector("#hide-create")?.addEventListener("click", closeCreate);
document.querySelector("#refresh-businesses")?.addEventListener("click", loadBusinesses);
document.querySelector("#logout")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("/login.html");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }
  if (authReady && currentUser?.uid === user.uid) return;
  currentUser = user;
  authReady = true;
  accountLabel.textContent = user.email || "Signed in";
  await loadBusinesses();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  message.textContent = "Creating workspace…";
  message.className = "text-sm text-slate-500";
  try {
    await apiRequest("/api/business/create", {
      method: "POST",
      body: JSON.stringify({ name: form.elements.name.value.trim(), type: form.elements.type.value })
    });
    message.textContent = "Workspace created.";
    message.className = "text-sm text-emerald-700";
    form.reset();
    await loadBusinesses();
    closeCreate();
  } catch (error) {
    message.textContent = error.message || "Could not create workspace.";
    message.className = "text-sm text-red-600";
  } finally {
    button.disabled = false;
  }
});
