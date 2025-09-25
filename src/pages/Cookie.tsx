import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Cookie = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Home
        </Button>
        
        <Card className="max-w-4xl mx-auto p-8 border-primary/10">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Cookie Policy di Difendimi
          </h1>
          
          <p className="text-muted-foreground mb-6">Ultimo aggiornamento: 25 settembre 2025</p>
          
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Cosa sono i cookie</h2>
              <p>I cookie sono piccoli file salvati sul dispositivo per far funzionare il Sito, migliorarne le prestazioni, condurre analisi e – previo consenso – personalizzare contenuti/annunci.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Tipologie di cookie/ID usati</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tecnici/necessari (no consenso):</strong> sessione, autenticazione, preferenze, sicurezza, load balancing.</li>
                <li><strong>Funzionali (consenso se comportano identificazione non strettamente necessaria):</strong> memorizzano scelte dell'utente.</li>
                <li><strong>Analitici/statistici:</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Con anonimizzazione/senza tracciamento cross-site: legittimo interesse.</li>
                    <li>Senza anonimizzazione o con identificativi persistenti: richiedono consenso.</li>
                  </ul>
                </li>
                <li><strong>Marketing/profilazione (consenso):</strong> retargeting, misurazione annunci, identificatori pubblicitari.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Base giuridica</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tecnici/strettamente necessari:</strong> esecuzione del servizio richiesto.</li>
                <li><strong>Analitici non anonimizzati/marketing:</strong> consenso dell'utente tramite banner.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Gestione del consenso</h2>
              <p>Alla prima visita appare un banner che consente di accettare, rifiutare o personalizzare. Puoi modificare le scelte in ogni momento dalla pagina /cookie-preferences o dalle impostazioni del browser.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Durata indicativa</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tecnici:</strong> sessione / fino a 12 mesi.</li>
                <li><strong>Analitici/marketing:</strong> fino a 13 mesi (salvo periodi diversi dichiarati dal fornitore).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Terze parti</h2>
              <p>Alcune tecnologie sono fornite da terzi (es. piattaforme analytics/ads). Le relative policy possono prevedere trattamenti in Paesi extra-UE; in ambito GDPR sono adottate garanzie adeguate (es. SCC). I link alle loro informative sono disponibili nel pannello preferenze.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Disattivazione via browser</h2>
              <p>È possibile bloccare/eliminare i cookie dalle impostazioni del browser. La disattivazione dei cookie tecnici può compromettere funzionalità del Sito.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Contatti</h2>
              <p>Per domande su cookie e consenso: support@difendimiai.com</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Cookie;