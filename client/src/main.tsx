import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./lib/site";
import "./styles.css";
import { watchErrors } from "./lib/reportError";

watchErrors();

// Apply the saved theme before first paint (dark by default, matching the portal look).
try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem("bim:theme") ?? '"dark"'); } catch { document.documentElement.dataset.theme = "dark"; }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </StrictMode>,
);
