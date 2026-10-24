import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser, FieldValue } = adminLib;
const templates = new Set(["boutique", "catalogue", "services"]);
function cleanConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_CONFIG");
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
  const sections = Array.isArray(input.sections) ? input.sections.slice(0, 8).map((section, index) => ({
    id: String(section.id || `section-${index+1}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `section-${index+1}`,
    type: ["hero", "about", "highlights", "contact"].includes(section.type) ? section.type : "about",
    title: String(section.title || "").slice(0, 100),
    text: String(section.text || "").slice(0, 500),
    buttonText: String(section.buttonText || "Contact us").slice(0, 40),
    visible: section.visible !== false
  })) : [];
  const logoUrl = String(input.logoUrl || "").slice(0, 500);
  if (logoUrl) { try { if (!["https:", "http:"].includes(new URL(logoUrl).protocol)) throw new Error(); } catch { throw new Error("INVALID_LOGO_URL"); } }
  return { title: String(input.title || "").trim().slice(0, 80), tagline: String(input.tagline || "").trim().slice(0, 220), logoUrl, template: templates.has(input.template) ? input.template : "boutique", primaryColor: color(input.primaryColor, "#654b9d"), backgroundColor: color(input.backgroundColor, "#f8f6ff"), sections, updatedAt: FieldValue.serverTimestamp() };
}
async function authorize(db, businessId, uid) {
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(businessId || "")) return false;
  const member = await db.collection("businesses").doc(businessId).collection("members").doc(uid).get();
  return member.exists && ["owner", "admin"].includes(member.data().role);
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const user = await requireUser(req, res); if (!user) return;
  const businessId = req.method === "GET" ? req.query?.businessId : req.body?.businessId;
  const db = getAdminApp().firestore();
  if (!await authorize(db, businessId, user.uid)) return res.status(403).json({ error: "You do not have access to this workspace." });
  const draftRef = db.collection("businesses").doc(businessId).collection("website").doc("draft");
  if (req.method === "GET") {
    try { const snap = await draftRef.get(); return res.status(200).json({ ok: true, exists: snap.exists, config: snap.exists ? snap.data() : { title: "", tagline: "", logoUrl: "", template: "boutique", primaryColor: "#654b9d", backgroundColor: "#f8f6ff", sections: [] } }); }
    catch (error) { console.error("website_draft_read_failed", { code: error.code || "unknown" }); return res.status(500).json({ error: "Could not load website draft." }); }
  }
  if (req.method === "PUT") {
    try { const config = cleanConfig(req.body?.config); await draftRef.set({ ...config, updatedBy: user.uid }, { merge: true }); return res.status(200).json({ ok: true }); }
    catch (error) { if (["INVALID_CONFIG", "INVALID_LOGO_URL"].includes(error.message)) return res.status(400).json({ error: error.message === "INVALID_LOGO_URL" ? "Logo URL must be a valid HTTP or HTTPS URL." : "Invalid website configuration." }); console.error("website_draft_save_failed", { code: error.code || "unknown" }); return res.status(500).json({ error: "Could not save website draft." }); }
  }
  res.setHeader("Allow", "GET, PUT"); return res.status(405).json({ error: "Method not allowed." });
}