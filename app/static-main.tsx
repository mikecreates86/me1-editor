import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import { ME1Editor } from "./ME1Editor";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ME1Editor />
  </StrictMode>,
);
