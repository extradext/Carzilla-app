/**
 * Vite entrypoint.
 *
 * IMPORTANT:
 * - UI only; do not implement diagnostic logic here.
 * - Engine calls (if any) should remain placeholders until core/diagnostics are implemented.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
