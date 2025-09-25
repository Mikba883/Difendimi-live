import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Che cos'è Difendimi?",
      answer: "Difendimi è un assistente digitale esperto in diritto che ti aiuta a capire subito cosa dice la legge sul tuo caso, senza attese né parcelle."
    },
    {
      question: "Difendimi sostituisce un avvocato?",
      answer: "No. Difendimi non è uno studio legale e non fornisce consulenza personalizzata da parte di un avvocato. Ti aiuta però a orientarti tra le norme, a capire i tuoi diritti e a preparare la documentazione di base."
    },
    {
      question: "Come funziona l'analisi del caso?",
      answer: "Inserisci una descrizione semplice del tuo problema. Difendimi consulta la normativa vigente italiana ed europea e genera un dossier con: sintesi del caso, riferimenti normativi, opzioni procedurali e documenti utili."
    },
    {
      question: "Cosa ricevo con l'app?",
      answer: "• Sommario esecutivo del tuo caso\n• Dossier completo con riferimenti normativi\n• Qualifica giuridica del problema\n• Opzioni strategiche possibili\n• Passi operativi con termini e scadenze\n• Documenti e allegati da utilizzare"
    },
    {
      question: "I documenti sono validi legalmente?",
      answer: "I documenti generati sono bozze pronte all'uso (email, diffide, istanze, ecc.). Non sostituiscono un atto redatto da un avvocato, ma ti permettono di organizzarti subito e di risparmiare tempo e costi."
    },
    {
      question: "Quanto tempo ci vuole per ricevere il dossier?",
      answer: "Il dossier viene generato in pochi secondi, pronto da consultare o scaricare in PDF."
    },
    {
      question: "Difendimi è sicuro?",
      answer: "Sì. Difendimi non salva i dati dei tuoi casi e i dossier generati non contengono alcuna informazione personale o sensibile. Puoi quindi essere sicuro al 100%."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Torna alla home
        </Button>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">FAQ</h1>
          <p className="text-xl text-muted-foreground mb-12">Domande frequenti</p>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;