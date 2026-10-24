import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser, FieldValue } = adminLib;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed." }); }
  const user = await requireUser(req, res); if (!user) return;
  const businessId = req.body?.businessId;
  if (typeof businessId !== "string" || !/^[A-Za-z0-9_-]{10,100}$/.test(businessId)) return res.status(400).json({ error: "Choose a valid business workspace." });
  const db = getAdminApp().firestore(), businessRef = db.collection("businesses").doc(businessId);
  try {
    const member = await businessRef.collection("members").doc(user.uid).get();
    if (!member.exists || !["owner", "admin"].includes(member.data().role)) return res.status(403).json({ error: "You do not have permission to publish this website." });
    const [businessSnap, draftSnap] = await Promise.all([businessRef.get(), businessRef.collection("website").doc("draft").get()]);
    if (!businessSnap.exists || !draftSnap.exists) return res.status(409).json({ error: "Save your website draft before publishing." });
    const business = businessSnap.data(), draft = draftSnap.data();
    if (!String(draft.title || business.name || "").trim()) return res.status(400).json({ error: "Add a website name before publishing." });
    if (!Array.isArray(draft.sections) || !draft.sections.some((section) => section.visible !== false && (section.title || section.text))) return res.status(400).json({ error: "Add at least one visible homepage section before publishing." });
    const publishedRef = businessRef.collection("website").doc("published");
    const prior = await publishedRef.get(), version = Number(prior.data()?.version || 0) + 1;
    const snapshot = { title: draft.title || business.name, tagline: draft.tagline || "", logoUrl: draft.logoUrl || "", template: draft.template || "boutique", primaryColor: draft.primaryColor || "#654b9d", backgroundColor: draft.backgroundColor || "#f8f6ff", sections: draft.sections, version, publishedAt: FieldValue.serverTimestamp(), publishedBy: user.uid };
    await publishedRef.set(snapshot);
    await businessRef.set({ status: "active", publishedVersion: version, publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const slug = business.slug || businessId;
    return res.status(200).json({ ok: true, version, url: `/site.html?slug=${encodeURIComponent(slug)}` });
  } catch (error) { console.error("website_publish_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not publish your website. Please try again." }); }
}