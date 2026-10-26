// Arabic for page content: interface text that exactly matches a known English string is swapped
// for its translation as React renders it. User data (input values, documents, AI answers, codes)
// is never touched — only whole text nodes and placeholder/title/aria-label attributes.

let dict: Record<string, string> | null = null;
let observer: MutationObserver | null = null;
const ATTRS = ["placeholder", "title", "aria-label"] as const;
// content that is data, not interface
const SKIP = "textarea, input, select option[value], code, pre, .mono, .md, .no-i18n, [contenteditable], .preview, .title-input";

function translateText(node: Text) {
  const raw = node.nodeValue;
  if (!raw || !dict) return;
  const text = raw.trim();
  if (!text || !/[A-Za-z]/.test(text)) return;
  const ar = dict[text];
  if (!ar) return;
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP)) return;
  node.nodeValue = raw.replace(text, ar);
}

function translateElement(el: Element) {
  if (!dict) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && dict[v.trim()] && !el.closest(".no-i18n")) el.setAttribute(a, dict[v.trim()]);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateElement(root as Element);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text); else translateElement(n as Element);
  }
}

/** Start translating the page (Arabic) or stop (English). Switching back to English reloads to restore text. */
export async function applyDomLocale(locale: "en" | "ar") {
  if (locale === "en") {
    if (observer) { observer.disconnect(); observer = null; dict = null; location.reload(); }
    return;
  }
  if (observer) return;
  dict = (await import("./locales/ar.json")).default as Record<string, string>;
  walk(document.body);
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") translateText(m.target as Text);
      else if (m.type === "attributes") translateElement(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
}

/** Translate a whole block of content directly (used for Markdown lessons, which the DOM layer skips). */
export const tr = (s: string) => (dict && dict[s]) || s;
