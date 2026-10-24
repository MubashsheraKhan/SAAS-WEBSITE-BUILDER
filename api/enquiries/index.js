import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser, FieldValue } = adminLib;
const clean = (v, n) => String(v || "").trim().slice(0, n);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const db = getAdminApp().firestore();
  if (req.method === "POST") {
    const businessId = clean(req.body?.businessId, 100), name = clean(req.body?.name, 100), phone = clean(req.body?.phone, 30), message = clean(req.body?.message, 1000), itemId = clean(req.body?.itemId, 100), source = ["website", "whatsapp", "service"].includes(req.body?.source) ? req.body.source : "website";
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(businessId) || name.length < 2 || !/^[+0-9() -]{7,30}$/.test(phone) || message.length < 3) return res.status(400).json({ error: "Enter your name, phone number and enquiry." });
    try {
      const businessRef = db.collection("businesses").doc(businessId), business = await businessRef.get();
      if (!business.exists || business.data().status !== "active" || !business.data().publishedVersion) return res.status(404).json({ error: "Website is not available." });
      const ref = businessRef.collection("enquiries").doc();
      await ref.set({ name, phone, message, itemId: itemId || null, source, status: "new", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return res.status(201).json({ ok: true, enquiryId: ref.id, message: "Enquiry sent. The business will contact you." });
    } catch (error) { console.error("enquiry_create_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not send your enquiry." }); }
  }
  const user = await requireUser(req, res); if (!user) return;
  const businessId = clean(req.method === "GET" ? req.query?.businessId : req.body?.businessId, 100);
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(businessId)) return res.status(400).json({ error: "Choose a valid workspace." });
  const businessRef = db.collection("businesses").doc(businessId), member = await businessRef.collection("members").doc(user.uid).get();
  if (!member.exists || !["owner", "admin"].includes(member.data().role)) return res.status(403).json({ error: "Workspace access denied." });
  const ref = businessRef.collection("enquiries");
  try {
    if (req.method === "GET") { const snap = await ref.orderBy("createdAt", "desc").limit(100).get(); return res.status(200).json({ ok: true, enquiries: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }); }
    if (req.method === "PATCH") {
      const enquiryId = clean(req.body?.enquiryId, 100), status = clean(req.body?.status, 30);
      if (!/^[A-Za-z0-9_-]{10,100}$/.test(enquiryId) || !["new", "contacted", "resolved", "spam"].includes(status)) return res.status(400).json({ error: "Invalid enquiry status." });
      const enquiryRef = ref.doc(enquiryId); if (!(await enquiryRef.get()).exists) return res.status(404).json({ error: "Enquiry not found." });
      await enquiryRef.update({ status, updatedAt: FieldValue.serverTimestamp(), updatedBy: user.uid }); return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST, PATCH"); return res.status(405).json({ error: "Method not allowed." });
  } catch (error) { console.error("enquiries_api_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not process enquiry." }); }
}
