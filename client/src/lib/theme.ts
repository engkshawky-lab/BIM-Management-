import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const getTheme = (): Theme => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
const subscribe = (listener: () => void) => {
  window.addEventListener("bim:theme", listener);
  return () => window.removeEventListener("bim:theme", listener);
};
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // A blocked storage area must not prevent switching this page's theme.
  try { localStorage.setItem("bim:theme", JSON.stringify(theme)); }
  catch (error) { console.warn("Could not persist theme preference", error); }
  window.dispatchEvent(new Event("bim:theme"));
}
export function useTheme() {
  return [useSyncExternalStore(subscribe, getTheme), setTheme] as const;
}
