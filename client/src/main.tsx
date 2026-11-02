import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SiteProvider } from "./lib/site";
import "./styles.css";
import { watchErrors } from "./lib/reportError";

watchErrors();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteProvider>
      <App />
    </SiteProvider>
  </StrictMode>,
);
