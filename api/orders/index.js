import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser, FieldValue } = adminLib;
const text = (value, max) => String(value || "").trim().slice(0, max);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const db = getAdminApp().firestore();
  if (req.method === "POST") {
    const businessId = text(req.body?.businessId, 100), customerName = text(req.body?.customerName, 100), phone = text(req.body?.phone, 30), address = text(req.body?.address, 500), note = text(req.body?.note, 500), raw = Array.isArray(req.body?.items) ? req.body.items.slice(0, 30) : [];
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(businessId) || customerName.length < 2 || !/^[+0-9() -]{7,30}$/.test(phone) || !raw.length) return res.status(400).json({ error: "Enter your name, phone number and at least one item." });
    try {
      const businessRef = db.collection("businesses").doc(businessId), businessSnap = await businessRef.get();
      if (!businessSnap.exists || businessSnap.data().status !== "active" || !businessSnap.data().publishedVersion) return res.status(404).json({ error: "Store is not available." });
      const refs = raw.map(item => businessRef.collection("catalogueItems").doc(text(item.id, 100))), snaps = await Promise.all(refs.map(ref => ref.get())), items = [];
      let total = 0;
      for (let i = 0; i < snaps.length; i++) {
        if (!snaps[i].exists) return res.status(400).json({ error: "One of the selected items is unavailable." });
        const item = snaps[i].data(), quantity = Math.max(1, Math.min(99, Math.floor(Number(raw[i].quantity) || 1)));
        if (!item.active || item.kind !== "product") return res.status(400).json({ error: "Only active products can be ordered online." });
        if (item.stock > 0 && quantity > item.stock) return res.status(400).json({ error: "Requested quantity exceeds available stock for " + item.name + "." });
        items.push({ itemId: refs[i].id, name: item.name, unitPrice: item.price, quantity, lineTotal: Math.round(item.price * quantity * 100) / 100 }); total += item.price * quantity;
      }
      const ref = businessRef.collection("orders").doc();
      await ref.set({ customerName, phone, address, note, items, total: Math.round(total * 100) / 100, currency: "INR", status: "new", paymentStatus: "unpaid", source: "storefront", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return res.status(201).json({ ok: true, orderId: ref.id, message: "Order request received. The seller will contact you to confirm payment and delivery." });
    } catch (error) { console.error("order_create_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not submit order. Please try again." }); }
  }
  const user = await requireUser(req, res); if (!user) return;
  const businessId = text(req.method === "GET" ? req.query?.businessId : req.body?.businessId, 100);
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(businessId)) return res.status(400).json({ error: "Choose a valid workspace." });
  const businessRef = db.collection("businesses").doc(businessId), member = await businessRef.collection("members").doc(user.uid).get();
  if (!member.exists || !["owner", "admin"].includes(member.data().role)) return res.status(403).json({ error: "Workspace access denied." });
  const ref = businessRef.collection("orders");
  try {
    if (req.method === "GET") { const snap = await ref.orderBy("createdAt", "desc").limit(100).get(); return res.status(200).json({ ok: true, orders: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }); }
    if (req.method === "PATCH") {
      const orderId = text(req.body?.orderId, 100), status = text(req.body?.status, 30);
      if (!/^[A-Za-z0-9_-]{10,100}$/.test(orderId) || !["new", "confirmed", "processing", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid order status." });
      const orderRef = ref.doc(orderId); if (!(await orderRef.get()).exists) return res.status(404).json({ error: "Order not found." });
      await orderRef.update({ status, updatedAt: FieldValue.serverTimestamp(), updatedBy: user.uid }); return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST, PATCH"); return res.status(405).json({ error: "Method not allowed." });
  } catch (error) { console.error("orders_api_failed", { businessId, code: error.code || "unknown" }); return res.status(500).json({ error: "Could not process order request." }); }
}
