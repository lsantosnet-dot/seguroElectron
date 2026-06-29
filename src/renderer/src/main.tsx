import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, getInitialTheme } from "./lib/theme";
import "./index.css";

// Aplica o tema antes do primeiro render para evitar "flash" da cor errada.
applyTheme(getInitialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
