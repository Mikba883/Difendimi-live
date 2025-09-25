import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
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
            Privacy Policy di Difendimi
          </h1>
          
          <p className="text-muted-foreground mb-6">Ultimo aggiornamento: 25 settembre 2025</p>
          
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <p>La presente informativa descrive le modalità di trattamento dei dati personali degli utenti del sito e dei servizi Difendimi ("Sito" o "Servizi").</p>
            
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Titolare del trattamento</h2>
              <p>Michele Baroni<br/>
              Indirizzo: Dubai Knowledge Park, Dubai, UAE<br/>
              Email: support@difendimiai.com</p>
              <p className="mt-2"><strong>Nota:</strong> Difendimi è un servizio informativo/organizzativo. Non è uno studio legale e non fornisce consulenza legale professionale.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Tipologie di dati trattati</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dati identificativi e di contatto:</strong> nome, cognome, email, eventuale telefono, contenuti inviati tramite form o chat.</li>
                <li><strong>Dati contrattuali e di pagamento:</strong> informazioni di fatturazione, esito transazioni (gestite tramite terzi es. Stripe/PayPal – Difendimi non conserva i numeri di carta).</li>
                <li><strong>Dati tecnici e di utilizzo:</strong> indirizzo IP, log di accesso, user-agent, identificativi di sessione, cookie e strumenti analoghi.</li>
                <li><strong>Eventuali dati allegati dall'utente:</strong> documenti/testi inseriti nei campi di analisi per generare dossier o bozze.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Finalità e basi giuridiche</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Erogazione dei Servizi, gestione account e assistenza (art. 6.1.b GDPR / esigenza contrattuale; legittimo interesse per sicurezza tecnica art. 6.1.f).</li>
                <li>Adempimenti amministrativi, fiscali e antifrode (art. 6.1.c GDPR / obbligo di legge; legittimo interesse 6.1.f).</li>
                <li>Comunicazioni informative/commerciali (newsletter, novità), solo previo consenso (art. 6.1.a).</li>
                <li>Analytics e miglioramento del Sito (art. 6.1.f; se cookie/ID non anonimizzati: consenso 6.1.a).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Modalità del trattamento e misure di sicurezza</h2>
              <p>Trattamenti con strumenti elettronici e misure tecniche/organizzative adeguate (controlli di accesso, cifratura in transito, logging). I dati sono conservati su infrastrutture di fornitori selezionati.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Conservazione</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dati contrattuali/fatturazione: fino a 10 anni.</li>
                <li>Dati di supporto: 24 mesi salvo necessità difensive.</li>
                <li>Marketing: fino a revoca del consenso.</li>
                <li>Cookie/ID online: secondo durate definite nella Cookie Policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Destinatari</h2>
              <p>Fornitori cloud/hosting, piattaforme di pagamento, strumenti di email/CRM, consulenti (legali/contabili), soggetti legittimati per legge. Tali soggetti operano come autonomi titolari o responsabili ex art. 28 GDPR, ove applicabile.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Trasferimenti extra-UE</h2>
              <p>I dati possono essere trattati o conservati al di fuori dello SEE (es. UAE/USA). In tal caso, ove si applichi il GDPR, vengono adottate garanzie adeguate (es. Clausole Contrattuali Standard UE e misure supplementari).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Diritti degli interessati (GDPR artt. 15–22)</h2>
              <p>Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca del consenso.</p>
              <p>Per esercizio diritti o informazioni: support@difendimiai.com</p>
              <p>Reclamo (UE): Garante per la protezione dei dati personali – www.garanteprivacy.it</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">9. Minori</h2>
              <p>Il Servizio non è destinato a minori di 16 anni. Se ritieni che un minore ci abbia fornito dati, scrivi a support@difendimiai.com per la rimozione.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">10. Cookie e tracking</h2>
              <p>Vedi <a href="/cookie" className="text-primary hover:underline">Cookie Policy</a> per dettagli su categorie, basi giuridiche, tempi e gestione del consenso.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">11. Modifiche</h2>
              <p>Possiamo aggiornare questa informativa. Le modifiche hanno effetto dalla pubblicazione sul Sito.</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;