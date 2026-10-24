import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp } = adminLib;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed." }); }
  const slug = String(req.query?.slug || "").slice(0, 100);
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return res.status(400).json({ error: "Invalid website address." });
  try {
    const db = getAdminApp().firestore(), found = await db.collection("businesses").where("slug", "==", slug).limit(1).get();
    if (found.empty) return res.status(404).json({ error: "Website not found." });
    const business = found.docs[0], data = business.data();
    if (data.status !== "active" || !data.publishedVersion) return res.status(404).json({ error: "This website is not published." });
    const snap = await business.ref.collection("catalogueItems").where("active", "==", true).limit(100).get();
    return res.status(200).json({ ok: true, businessId: business.id, name: data.name, slug, type: data.type, items: snap.docs.map(doc => { const item = doc.data(); return { id: doc.id, name: item.name, kind: item.kind, price: item.price, description: item.description || "", imageUrl: item.imageUrl || "", stock: item.stock || 0 }; }) });
  } catch (error) { console.error("public_catalogue_failed", { code: error.code || "unknown" }); return res.status(500).json({ error: "Could not load this catalogue." }); }
}
