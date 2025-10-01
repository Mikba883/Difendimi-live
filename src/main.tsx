import { initGTM } from './lib/gtm';

const GTM_ID = import.meta.env.VITE_GTM_ID;

if (import.meta.env.PROD) {
  initGTM(GTM_ID);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./register-sw.ts";

createRoot(document.getElementById("root")!).render(<App />);
