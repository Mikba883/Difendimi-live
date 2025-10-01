import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./register-sw.ts";

createRoot(document.getElementById("root")!).render(<App />);
