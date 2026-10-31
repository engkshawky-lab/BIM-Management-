import { useEffect, useRef, type RefObject } from "react";

/** Elements a keyboard user can Tab to inside a dialog. */
const FOCUSABLE = [
  "a[href]", "area[href]", "button:not([disabled])", "input:not([disabled]):not([type=hidden])", "select:not([disabled])",
  "textarea:not([disabled])", "iframe", "audio[controls]", "video[controls]", "[contenteditable]:not([contenteditable=false])", "[tabindex]:not([tabindex='-1'])",
].join(",");

const focusables = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("inert") && (el.offsetParent !== null || el === document.activeElement));

// Open dialogs, innermost last: only the top one reacts to Escape / Tab.
const stack: object[] = [];
let seq = 0;

/**
 * Modal dialog behaviour for the element the returned ref is attached to:
 * moves focus into it on open (an [autofocus]/[data-autofocus] element, else the first focusable, else the dialog itself),
 * keeps Tab / Shift+Tab inside it, closes on Escape and returns focus to the element that opened it.
 * Pass `active` = false while the dialog is not rendered (for dialogs drawn inline by their page).
 * Pair it with role="dialog" aria-modal="true" and an aria-label / aria-labelledby on the same element.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void, active = true): RefObject<T> {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const token = {};
    stack.push(token);
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (root) {
      if (!root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
      if (!root.hasAttribute("role")) root.setAttribute("role", "dialog");
      if (!root.hasAttribute("aria-modal")) root.setAttribute("aria-modal", "true");
      // name the dialog after its first heading unless the caller gave it a name
      if (!root.hasAttribute("aria-label") && !root.hasAttribute("aria-labelledby")) {
        const h = root.querySelector("h1, h2, h3");
        if (h) { if (!h.id) h.id = `dlg-${++seq}`; root.setAttribute("aria-labelledby", h.id); }
      }
      if (!root.contains(document.activeElement)) {
        const first = root.querySelector<HTMLElement>("[autofocus],[data-autofocus]") ?? focusables(root)[0] ?? root;
        first.focus({ preventScroll: true });
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token || !ref.current) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close.current(); return; }
      if (e.key !== "Tab") return;
      const list = focusables(ref.current);
      if (!list.length) { e.preventDefault(); ref.current.focus(); return; }
      const first = list[0], last = list[list.length - 1], active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current || !ref.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !ref.current.contains(active))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active]);
  return ref;
}

/**
 * Non-modal popover / menu: closes on Escape (returning focus to `trigger`) and on a pointer press outside `root`.
 * Active only while `open` is true.
 */
export function useDismiss(open: boolean, onClose: () => void, root: RefObject<HTMLElement>, trigger?: RefObject<HTMLElement>) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || stack.length) return;
      close.current();
      trigger?.current?.focus();
    };
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) close.current(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open, root, trigger]);
}
