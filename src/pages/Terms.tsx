import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
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
            Termini e Condizioni di Servizio – Difendimi
          </h1>
          
          <p className="text-muted-foreground mb-6">Ultimo aggiornamento: 25 settembre 2025</p>
          
          <div className="prose prose-sm max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Informazioni sul gestore</h2>
              <p>Michele Baroni<br/>
              Indirizzo: Dubai Knowledge Park, Dubai, UAE<br/>
              Email: support@difendimiai.com</p>
              <p className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <strong>Disclaimer fondamentale:</strong> Difendimi fornisce strumenti digitali informativi e organizzativi (schede riepilogo, dossier, bozze documentali). Non è uno studio legale né offre consulenza legale professionale o patrocinio. Le informazioni sono di carattere generale e non sostituiscono il parere personalizzato di un avvocato abilitato.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Oggetto del Servizio</h2>
              <p>Accesso a funzionalità software che aiutano l'utente a organizzare le proprie informazioni e generare documenti/bozze standard. L'utente resta unico responsabile delle decisioni e dell'uso dei materiali prodotti.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Account e idoneità</h2>
              <p>Registrando un account, dichiari di fornire dati veritieri e di avere capacità di agire. Sei responsabile della custodia delle credenziali e delle azioni svolte con il tuo account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Uso consentito e divieti</h2>
              <p>È vietato:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>usare il Servizio in violazione di leggi/regolamenti;</li>
                <li>caricare contenuti illeciti o dati di terzi senza titolo;</li>
                <li>tentare accessi non autorizzati o interferire con la sicurezza;</li>
                <li>decompilare, copiare o riutilizzare codice o contenuti senza autorizzazione;</li>
                <li>utilizzare i contenuti generati come parere legale.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Contenuti dell'utente</h2>
              <p>Garantisci di avere i diritti necessari sui contenuti caricati e manlevi Difendimi da responsabilità per pretese di terzi derivanti dai tuoi contenuti.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Piani, prezzi, pagamenti e rinnovi</h2>
              <p>Prezzi, caratteristiche e periodicità sono indicati su /pricing. I pagamenti sono processati da provider terzi (es. Stripe/PayPal). Gli abbonamenti si rinnovano automaticamente salvo disdetta prima della data di rinnovo. Eventuali prove gratuite, sconti e promozioni sono disciplinati dalle condizioni pubblicate al momento dell'offerta.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Diritto di recesso e rimborsi</h2>
              <p><strong>Consumatori UE:</strong> diritto di recesso entro 14 giorni dalla conclusione, salvo attivazione immediata del contenuto/servizio digitale con tuo consenso informato e accettazione della perdita del diritto di recesso.</p>
              <p><strong>Rimborsi:</strong> se previsti, modalità e tempistiche sono descritte su /refunds.</p>
              <p>Per esercitare recesso o chiedere rimborsi: support@difendimiai.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Assistenza e disponibilità del Servizio</h2>
              <p>Il Servizio è fornito "as is" e "as available". Potrebbero verificarsi manutenzioni, aggiornamenti o interruzioni. Faremo sforzi ragionevoli per garantire continuità e tempi di risposta adeguati.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">9. Proprietà intellettuale</h2>
              <p>Software, banche dati, marchi, testi, grafica e interfacce sono di proprietà di Michele Baroni o dei suoi licenzianti. Non è concesso alcun diritto diverso da quelli strettamente necessari all'uso del Servizio secondo questi Termini.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">10. Limitazione di responsabilità</h2>
              <p>Nella misura massima consentita dalla legge applicabile, Difendimi e il Titolare non rispondono di:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>perdite indirette/consequenziali;</li>
                <li>mancato guadagno;</li>
                <li>danni derivanti da uso non conforme del Servizio o basato su contenuti generati come se fossero consulenza legale.</li>
              </ul>
              <p>Resta ferma la responsabilità che non può essere esclusa per disposizione imperativa di legge.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">11. Indennizzo (manleva)</h2>
              <p>Accetti di tenere indenne Difendimi e il Titolare da pretese, danni e spese (incluse spese legali) derivanti da violazioni dei presenti Termini o da contenuti inviati attraverso il Servizio.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">12. Privacy e cookie</h2>
              <p>Il trattamento dei dati personali è disciplinato dalla <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. L'uso di cookie/ID è regolato dalla <a href="/cookie" className="text-primary hover:underline">Cookie Policy</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">13. Modifiche ai Termini</h2>
              <p>Potremo aggiornare questi Termini; le modifiche avranno effetto dalla pubblicazione. L'uso successivo del Servizio implica accettazione delle modifiche.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">14. Legge applicabile e foro competente</h2>
              <p>Questi Termini sono regolati dalla legge degli Emirati Arabi Uniti (UAE). Foro esclusivo competente: Dubai, UAE.</p>
              <p><strong>Consumatori UE:</strong> restano ferme le tutele inderogabili del vostro Paese di residenza e la possibilità di adire il foro del consumatore.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">15. Risoluzione delle controversie (solo UE, se applicabile)</h2>
              <p>Link alla piattaforma ODR della Commissione Europea (B2C): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-4">16. Contatti</h2>
              <p>Assistenza contrattuale, privacy e reclami: support@difendimiai.com</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;