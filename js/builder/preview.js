function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function safeColor(value, fallback) { return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback; }
function safeImageUrl(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
export function renderPreview(config, { published = false } = {}) {
  const title = escapeHtml(config.title || "Your business");
  const tagline = escapeHtml(config.tagline || "A welcoming place for your customers.");
  const primary = safeColor(config.primaryColor, "#654b9d");
  const background = safeColor(config.backgroundColor, "#f8f6ff");
  const logo = safeImageUrl(config.logoUrl);
  const sections = (Array.isArray(config.sections) ? config.sections : []).filter((section) => section.visible !== false);
  const sectionHtml = sections.map((section) => {
    const heading = escapeHtml(section.title), text = escapeHtml(section.text);
    if (section.type === "hero") return `<section class="hero"><p class="eyebrow">WELCOME</p><h1>${heading || title}</h1><p>${text || tagline}</p><a class="cta" href="#contact">${escapeHtml(section.buttonText || "Get in touch")}</a></section>`;
    if (section.type === "highlights") return `<section class="panel"><h2>${heading}</h2><p>${text}</p><div class="chips"><span>Thoughtfully selected</span><span>Personal service</span><span>Made for you</span></div></section>`;
    if (section.type === "contact") return `<section id="contact" class="panel contact"><h2>${heading || "Let’s connect"}</h2><p>${text}</p><a class="cta" href="https://wa.me/" target="_blank" rel="noopener noreferrer">${escapeHtml(section.buttonText || "Contact us")}</a><p class="note">Add your WhatsApp number in a future settings update.</p></section>`;
    return `<section class="panel"><h2>${heading || "About us"}</h2><p>${text}</p></section>`;
  }).join("");
  const isService = config.template === "services";
  const templateName = ({ boutique: "Boutique", catalogue: "Catalogue", services: "Services" })[config.template] || "Boutique";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${tagline}"><title>${title}</title><style>
  *{box-sizing:border-box}body{margin:0;background:${background};color:#33283b;font:16px/1.65 Inter,ui-sans-serif,system-ui,sans-serif}header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px clamp(18px,5vw,64px);background:#fff;border-bottom:1px solid #ece7f6}header img{max-height:48px;max-width:150px;object-fit:contain}header strong{font-size:1.05rem;color:${primary}}header span{font-size:.75rem;color:#807587}main{max-width:1050px;margin:auto;padding:32px 20px 64px}.hero{padding:clamp(36px,8vw,90px) clamp(22px,6vw,70px);border-radius:26px;background:linear-gradient(135deg,#fff, ${background});border:1px solid #eee8f8}.eyebrow{font-size:.72rem;font-weight:800;letter-spacing:.2em;color:${primary}}h1{font-size:clamp(2rem,6vw,4.2rem);line-height:1.08;letter-spacing:-.04em;max-width:760px;margin:12px 0 18px;color:#35213d}h2{font-size:clamp(1.4rem,3vw,2rem);line-height:1.2;color:#35213d;margin:0 0 12px}.hero p:not(.eyebrow){max-width:680px;color:#6b6171;font-size:1.08rem}.cta{display:inline-block;margin-top:14px;border-radius:12px;background:${primary};color:white;padding:12px 20px;text-decoration:none;font-weight:700}.panel{margin-top:20px;padding:clamp(22px,4vw,38px);background:white;border:1px solid #eee8f8;border-radius:22px}.panel p{color:#6b6171;max-width:760px}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.chips span{padding:8px 12px;border-radius:99px;background:${background};color:${primary};font-size:.88rem}.contact{background:#fff}.note{font-size:.75rem!important;color:#8c8292!important}footer{text-align:center;padding:24px;color:#82788a;font-size:.8rem}footer b{color:${primary}}@media(max-width:520px){header{padding:16px}header span{display:none}main{padding:18px 12px 36px}.hero{border-radius:18px}.panel{border-radius:18px}}
  </style></head><body><header>${logo ? `<img src="${escapeHtml(logo)}" alt="${title} logo" referrerpolicy="no-referrer">` : `<strong>${title}</strong>`}<span>${templateName} ${isService ? "website" : "storefront"}</span></header><main>${sectionHtml || `<section class="hero"><h1>${title}</h1><p>${tagline}</p></section>`}</main><footer>Made with <b>Webaura by III</b></footer></body></html>`;
}