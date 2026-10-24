export const DEFAULT_SECTIONS = [
  { id: "welcome", type: "hero", title: "Made with care, just for you", text: "Discover thoughtful products and personal service from our small business.", buttonText: "Explore with us", visible: true },
  { id: "about", type: "about", title: "A little about us", text: "We believe good businesses are built on trust, quality and genuine care.", visible: true },
  { id: "contact", type: "contact", title: "Let’s connect", text: "Have a question or want to place an order? We would love to hear from you.", visible: true }
];
export function normalizeSections(value) {
  if (!Array.isArray(value)) return DEFAULT_SECTIONS.map((section) => ({ ...section }));
  return value.slice(0, 8).map((section, index) => ({
    id: String(section.id || `section-${index + 1}`).slice(0, 40),
    type: ["hero", "about", "contact", "highlights"].includes(section.type) ? section.type : "about",
    title: String(section.title || "").slice(0, 100),
    text: String(section.text || "").slice(0, 500),
    buttonText: String(section.buttonText || "Contact us").slice(0, 40),
    visible: section.visible !== false
  }));
}