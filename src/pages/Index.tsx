import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileText, Download, Sparkles, CheckCircle, Star, Users, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-shield.png";
import { InstallPWA } from "@/components/InstallPWA";
import { useState, useEffect } from "react";
import { CaseStatusBadge } from "@/components/case/CaseStatusBadge";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [installComponent, setInstallComponent] = useState<React.ReactNode>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDownloadApp = () => {
    if (installComponent) {
      (installComponent as any).props.onClick();
    } else {
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) {
        window.open(manifest.getAttribute('href') || '', '_blank');
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { label: 'Come funziona', id: 'come-funziona' },
    { label: 'Preview', id: 'preview' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', link: '/faq' }
  ];

  return (
    <div className="min-h-screen">
      <InstallPWA onInstallReady={(component) => setInstallComponent(component)} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300">
        {/* Header/Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background shadow-md' : 'bg-transparent'
        }`}>
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Difendimi" className="h-8 w-8" />
              <span className={`text-xl font-bold ${scrolled ? 'text-foreground' : 'text-white'}`}>
                Difendimi
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                item.link ? (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => navigate(item.link)}
                    className={scrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/20'}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => scrollToSection(item.id!)}
                    className={scrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/20'}
                  >
                    {item.label}
                  </Button>
                )
              ))}
              <Button
                onClick={handleDownloadApp}
                variant="ghost"
                className={scrolled ? 'text-foreground border-border hover:bg-muted' : 'text-white border-white hover:bg-white/20'}
              >
                <Download className="mr-2 h-4 w-4" />
                Scarica l'app
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className={scrolled ? '' : 'text-white border-white hover:bg-white/20'}
              >
                Accedi
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                size="sm"
                className={scrolled ? '' : 'text-white border-white hover:bg-white/20'}
              >
                Accedi
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={scrolled ? 'text-foreground' : 'text-white'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-background border-t">
              <div className="container mx-auto p-4 space-y-2">
                {menuItems.map((item) => (
                  item.link ? (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={() => {
                        navigate(item.link);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      {item.label}
                    </Button>
                  ) : (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => scrollToSection(item.id!)}
                      className="w-full justify-start"
                    >
                      {item.label}
                    </Button>
                  )
                ))}
                <Button
                  onClick={handleDownloadApp}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Scarica l'app
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-4 pb-20 pt-32">
          <div className="container mx-auto max-w-4xl text-center text-white">
            <p className="mb-4 text-lg">Fai valere i tuoi diritti</p>
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Scopri cosa dice la legge
            </h1>
            <p className="mb-8 text-xl text-white/90">
              Ottieni subito un dossier completo con riferimenti normativi, 
              opzioni procedurali e documenti pratici per il tuo caso specifico.
            </p>
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-white text-rose-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Analizza subito il tuo caso
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <section id="come-funziona" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Come funziona</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">1</span>
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Descrivi il tuo caso</h3>
              <p className="text-muted-foreground">
                Racconta in parole semplici qual è il tuo problema legale
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">2</span>
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analisi normativa</h3>
              <p className="text-muted-foreground">
                Il sistema consulta la normativa vigente italiana ed europea
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">3</span>
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ricevi il dossier</h3>
              <p className="text-muted-foreground">
                Ottieni un report completo con riferimenti normativi e passi da seguire
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison with ChatGPT Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Perché Difendimi è meglio delle AI generiche</h2>
          <div className="overflow-x-auto max-w-5xl mx-auto">
            <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-4 text-left">Caratteristica</th>
                  <th className="p-4 text-center">Difendimi</th>
                  <th className="p-4 text-center">ChatGPT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Focus</td>
                  <td className="p-4 text-center">✅ Specializzato sul diritto italiano ed europeo</td>
                  <td className="p-4 text-center text-muted-foreground">Generalista, copre qualsiasi argomento</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Affidabilità normativa</td>
                  <td className="p-4 text-center">✅ Consulta banche dati ufficiali (Normattiva, EUR-Lex, ecc.)</td>
                  <td className="p-4 text-center text-muted-foreground">Non ha accesso diretto a banche dati giuridiche ufficiali</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Output</td>
                  <td className="p-4 text-center">✅ Documenti pratici (schede, dossier PDF, bozze email/diffide)</td>
                  <td className="p-4 text-center text-muted-foreground">Risposte testuali generiche</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Personalizzazione</td>
                  <td className="p-4 text-center">✅ Analisi del tuo caso specifico e guida passo passo</td>
                  <td className="p-4 text-center text-muted-foreground">Risposte standard, non sempre contestualizzate alla normativa vigente</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Usabilità</td>
                  <td className="p-4 text-center">✅ Interfaccia semplice, pensata per chi non è giurista</td>
                  <td className="p-4 text-center text-muted-foreground">Richiede competenze per formulare prompt corretti</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Obiettivo</td>
                  <td className="p-4 text-center">✅ Farti valere i tuoi diritti in tempi rapidi e senza parcelle</td>
                  <td className="p-4 text-center text-muted-foreground">Rispondere in modo ampio a qualsiasi curiosità</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Cosa ricevi con l'app</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Esplora un esempio di dossier completo generato da Difendimi. 
            Clicca per ingrandire e navigare tra le sezioni.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 shadow-lg">
              <div className="mb-6">
                <CaseStatusBadge status="completed" />
                <h3 className="text-2xl font-bold mt-4">Caso di esempio: Ritardo nella consegna</h3>
                <p className="text-muted-foreground">Generato il {new Date().toLocaleDateString('it-IT')}</p>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-lg mb-2">Sommario Esecutivo</h4>
                  <p className="text-muted-foreground">
                    Il consumatore ha diritto al risarcimento per ritardo nella consegna superiore a 30 giorni
                    secondo l'art. 61 del Codice del Consumo. La merce ordinata online non è stata consegnata
                    nei termini pattuiti causando un danno documentabile.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-lg mb-2">Riferimenti Normativi</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Art. 61 D.Lgs. 206/2005 - Codice del Consumo</li>
                    <li>• Art. 1218 Codice Civile - Responsabilità del debitore</li>
                    <li>• Direttiva 2011/83/UE sui diritti dei consumatori</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-lg mb-2">Opzioni Strategiche</h4>
                  <div className="space-y-3 text-muted-foreground">
                    <div>
                      <span className="font-medium">1. Risoluzione stragiudiziale:</span>
                      <p className="ml-4">Invio diffida con richiesta di adempimento entro 7 giorni</p>
                    </div>
                    <div>
                      <span className="font-medium">2. Procedura ADR:</span>
                      <p className="ml-4">Attivazione conciliazione presso Camera di Commercio</p>
                    </div>
                    <div>
                      <span className="font-medium">3. Azione giudiziale:</span>
                      <p className="ml-4">Decreto ingiuntivo presso Giudice di Pace (valore < €5000)</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-lg mb-2">Documenti Allegati</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Bozza diffida.docx
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Modulo reclamo.pdf
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button onClick={() => navigate("/login")} size="lg">
                  Genera il tuo dossier personalizzato
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Scegli il tuo piano</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-6">€0<span className="text-lg font-normal text-muted-foreground">/mese</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Analisi del tuo caso specifico</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Interrogazione del sistema normativo italiano</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Report standard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Principali riferimenti normativi</span>
                </li>
              </ul>
              <Button 
                onClick={() => navigate("/login")} 
                variant="outline" 
                className="w-full"
              >
                Inizia gratis
              </Button>
            </Card>

            <Card className="p-8 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Consigliato
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-3xl font-bold mb-6">€4,13<span className="text-lg font-normal text-muted-foreground">/mese</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="font-semibold">Tutte le funzionalità Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Dossier completo dettagliato</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Qualifica giuridica approfondita</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Opzioni strategiche personalizzate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Passi operativi con tempistiche</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Termini e scadenze dettagliate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Documenti e allegati pronti all'uso</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Export PDF illimitati</span>
                </li>
              </ul>
              <Button 
                onClick={() => navigate("/premium")} 
                className="w-full"
              >
                Passa a Premium
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section className="py-20 bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Scarica l'app Difendimi</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Porta sempre con te il tuo assistente legale digitale. 
            Disponibile su tutti i dispositivi, senza costi di installazione.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleDownloadApp}
              size="lg"
              className="bg-white text-rose-600 hover:bg-gray-100"
            >
              <Download className="mr-2 h-5 w-5" />
              Scarica l'app
            </Button>
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/20"
            >
              Prova online
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Difendimi" className="h-8 w-8" />
              <span className="text-xl font-bold">Difendimi</span>
            </div>
            <p className="text-muted-foreground text-center">
              Scopri cosa dice la legge senza attese né parcelle
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Difendimi. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;