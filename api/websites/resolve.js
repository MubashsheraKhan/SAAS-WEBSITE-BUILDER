import adminLib from "../_lib/firebase-admin.cjs";
const { getAdminApp } = adminLib;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed." }); }
  const requestedSlug = typeof req.query?.slug === "string" ? req.query.slug.trim() : "";
  const slug = requestedSlug.toLowerCase();
  if (!/^[a-z0-9-]{3,80}$/i.test(requestedSlug)) return res.status(400).json({ error: "Provide a valid website address." });
  try {
    const db = getAdminApp().firestore();
    // Workspace IDs may contain uppercase letters in older generated slug suffixes.
    let found = await db.collection("businesses").where("slug", "==", requestedSlug).limit(1).get();
    if (found.empty && requestedSlug !== slug) found = await db.collection("businesses").where("slug", "==", slug).limit(1).get();
    if (found.empty) return res.status(404).json({ error: "This website could not be found." });
    const businessDoc = found.docs[0], business = businessDoc.data();
    if (business.status !== "active" || !business.publishedVersion) return res.status(404).json({ error: "This website has not been published yet." });
    const published = await businessDoc.ref.collection("website").doc("published").get();
    if (!published.exists) return res.status(404).json({ error: "This website has not been published yet." });
    const data = published.data();
    return res.status(200).json({ ok: true, business: { name: business.name || data.title, type: business.type || "catalogue", slug }, config: { title: data.title, tagline: data.tagline, logoUrl: data.logoUrl, template: data.template, primaryColor: data.primaryColor, backgroundColor: data.backgroundColor, sections: data.sections, version: data.version } });
  } catch (error) { console.error("website_resolve_failed", { code: error.code || "unknown" }); return res.status(500).json({ error: "Could not load this website right now." }); }
}