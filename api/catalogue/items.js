import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser, FieldValue } = adminLib;
const kinds = new Set(["product", "service"]);
function clean(input) {
  const name = String(input?.name || "").trim().slice(0, 100), kind = kinds.has(input?.kind) ? input.kind : "", price = Number(input?.price);
  if (name.length < 2 || !kind || !Number.isFinite(price) || price < 0 || price > 100000000) throw new Error("INVALID_ITEM");
  const imageUrl = String(input?.imageUrl || "").trim().slice(0, 500);
  if (imageUrl) { try { if (!["https:", "http:"].includes(new URL(imageUrl).protocol)) throw new Error(); } catch { throw new Error("INVALID_IMAGE"); } }
  return { name, kind, price: Math.round(price * 100) / 100, description: String(input?.description || "").trim().slice(0, 1000), imageUrl, stock: Math.max(0, Math.min(1000000, Math.floor(Number(input?.stock) || 0))), active: input?.active !== false, updatedAt: FieldValue.serverTimestamp() };
}
async function authorized(db, businessId, uid) {
  if (typeof businessId !== "string" || !/^[A-Za-z0-9_-]{10,100}$/.test(businessId)) return false;
  const businessRef = db.collection("businesses").doc(businessId);
  const [business, member] = await Promise.all([businessRef.get(), businessRef.collection("members").doc(uid).get()]);
  return business.exists && member.exists && ["owner", "admin"].includes(member.data().role);
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const user = await requireUser(req, res); if (!user) return;
  const businessId = req.method === "GET" ? req.query?.businessId : req.body?.businessId, db = getAdminApp().firestore();
  if (!await authorized(db, businessId, user.uid)) return res.status(403).json({ error: "Workspace access denied." });
  const ref = db.collection("businesses").doc(businessId).collection("catalogueItems");
  try {
    if (req.method === "GET") { const snap = await ref.orderBy("updatedAt", "desc").limit(200).get(); return res.status(200).json({ ok: true, items: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }); }
    if (["POST", "PUT"].includes(req.method)) {
      const item = clean(req.body?.item), itemId = String(req.body?.itemId || "");
      if (req.method === "PUT" && !/^[A-Za-z0-9_-]{10,100}$/.test(itemId)) return res.status(400).json({ error: "Choose a valid item." });
      const target = req.method === "PUT" ? ref.doc(itemId) : ref.doc();
      if (req.method === "PUT" && !(await target.get()).exists) return res.status(404).json({ error: "Item not found." });
      await target.set({ ...item, createdBy: user.uid, ...(req.method === "POST" ? { createdAt: FieldValue.serverTimestamp() } : {}) }, { merge: true });
      return res.status(req.method === "POST" ? 201 : 200).json({ ok: true, itemId: target.id });
    }
    if (req.method === "DELETE") { const itemId = String(req.body?.itemId || ""); if (!/^[A-Za-z0-9_-]{10,100}$/.test(itemId)) return res.status(400).json({ error: "Choose a valid item." }); await ref.doc(itemId).delete(); return res.status(200).json({ ok: true }); }
    res.setHeader("Allow", "GET, POST, PUT, DELETE"); return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    if (["INVALID_ITEM", "INVALID_IMAGE"].includes(error.message)) return res.status(400).json({ error: error.message === "INVALID_IMAGE" ? "Image URL must use HTTP or HTTPS." : "Enter a name, item type and valid non-negative price." });
    console.error("catalogue_items_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not process catalogue item." });
  }
}
