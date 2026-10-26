import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Apply the saved theme before first paint (dark by default, matching the portal look).
try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem("bim:theme") ?? '"dark"'); } catch { document.documentElement.dataset.theme = "dark"; }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
