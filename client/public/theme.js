// Blocking, same-origin bootstrap: allowed by script-src 'self', before CSS/React.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = () => {
    // Storage may be disabled. Keep the OS preference usable in that case.
    try {
      const value = localStorage.getItem("bim:theme");
      return value === '"light"' || value === "light" ? "light"
        : value === '"dark"' || value === "dark" ? "dark" : null;
    } catch { return null; }
  };
  const apply = () => {
    root.dataset.theme = savedTheme() ?? (system.matches ? "dark" : "light");
    window.dispatchEvent(new Event("bim:theme"));
  };
  system.addEventListener("change", apply);
  window.addEventListener("storage", (event) => {
    if (event.key === "bim:theme" || event.key === null) apply();
  });
  apply();
  // the user's theme colour (client/src/lib/appearance.ts caches the generated stylesheet)
  try {
    const css = localStorage.getItem("bim:palette-css");
    if (css && /^:root:root\{[^<]*$/.test(css)) {
      const style = document.createElement("style"); style.id = "bim-palette"; style.textContent = css;
      document.head.appendChild(style);
    }
  } catch { /* storage unavailable: default colours */ }
})();
