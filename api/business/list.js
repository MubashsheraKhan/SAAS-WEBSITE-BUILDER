import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp, requireUser } = adminLib;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const snapshot = await getAdminApp().firestore()
      .collection("businesses")
      .where("ownerUid", "==", user.uid)
      .limit(50)
      .get();
    const businesses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Untitled business",
        type: data.type || "catalogue",
        slug: data.slug || "",
        status: data.status || "setup",
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null
      };
    });
    return res.status(200).json({ ok: true, businesses });
  } catch (error) {
    console.error("business_list_failed", { uid: user.uid, code: error.code || "unknown" });
    return res.status(500).json({ error: "Could not load your businesses." });
  }
}
