import { initGTM } from './lib/gtm';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./register-sw.ts";

// Prende l'ID di GTM dalle variabili d'ambiente
const GTM_ID = import.meta.env.VITE_GTM_ID;

// Chiama la funzione per inizializzare GTM senza nessuna condizione,
// in modo che funzioni sia in produzione che in modalità anteprima/sviluppo.
initGTM(GTM_ID);

// Il resto del tuo codice che avvia l'applicazione React
createRoot(document.getElementById("root")!).render(<App />);
