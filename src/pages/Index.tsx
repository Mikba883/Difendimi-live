import { Shield, ArrowRight, CheckCircle, Lock, Scale, Clock, Download, Brain, FileText, Zap, Users, Star, MessageSquare, ChevronRight, ClipboardList, FileCheck, Target, Calendar, Paperclip, Check, X, Eye, Maximize2, Menu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportSections } from "@/components/case/ReportSections";
import { DEMO_CASE_DATA } from "@/data/demoCase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const Index = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Check auth status first
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }
    };
    
    checkAuth();

    // Scroll handler for navbar
    const handleScroll = () => {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navigate]);

  const handleMainButtonClick = () => {
    navigate("/login");
  };

  const handleDownloadApp = () => {
    // The InstallPWA component now handles all installation logic
    // This function can trigger a custom event that InstallPWA listens to
    const event = new CustomEvent('trigger-pwa-install');
    window.dispatchEvent(event);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/98 backdrop-blur-md border-b shadow-sm' 
          : 'bg-transparent backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <span className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent animate-pulse">
                  D
                </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  ifendimi
                </span>
              </span>
              <span className="text-xs font-medium text-primary/60 ml-1">.AI</span>
            </div>

            {/* Desktop Menu - Center */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('come-funziona')}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isScrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                Come funziona
              </button>
              <button 
                onClick={() => scrollToSection('preview')}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isScrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                Preview
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isScrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isScrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                FAQ
              </button>
            </div>

            {/* Desktop Buttons - Right */}
            <div className="hidden md:flex gap-4">
              <Button 
                variant={isScrolled ? "outline" : "ghost"}
                onClick={handleDownloadApp}
                className={isScrolled ? "" : "text-white border-white/20 hover:bg-white/10"}
              >
                <Download className="mr-2 h-4 w-4" />
                Scarica l'app
              </Button>
              <Button 
                onClick={handleMainButtonClick} 
                variant={isScrolled ? "default" : "outline"}
                className={isScrolled ? "" : "bg-white text-primary hover:bg-white/90"}
              >
                Accedi
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <Button 
                onClick={handleMainButtonClick} 
                variant="default" 
                size="sm"
                className={isScrolled ? "" : "bg-white text-primary hover:bg-white/90"}
              >
                Accedi
              </Button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={isScrolled ? "" : "text-white hover:bg-white/10"}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    <button 
                      onClick={() => scrollToSection('come-funziona')}
                      className="text-left text-sm font-medium hover:text-primary transition-colors"
                    >
                      Come funziona
                    </button>
                    <button 
                      onClick={() => scrollToSection('preview')}
                      className="text-left text-sm font-medium hover:text-primary transition-colors"
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => scrollToSection('pricing')}
                      className="text-left text-sm font-medium hover:text-primary transition-colors"
                    >
                      Pricing
                    </button>
                    <button 
                      onClick={() => scrollToSection('faq')}
                      className="text-left text-sm font-medium hover:text-primary transition-colors"
                    >
                      FAQ
                    </button>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadApp}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Scarica l'app
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with gradient background */}
      <div id="hero" className="relative bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500">
        {/* Hero Content */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Fai valere i tuoi diritti</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in text-white">
                Scopri cosa dice la
                <span className="text-white"> legge</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 animate-fade-in" style={{animationDelay: "0.1s"}}>
                Senza attese, senza parcelle, con l'intelligenza artificiale
              </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: "0.2s"}}>
              <Button 
                size="lg"
                onClick={handleMainButtonClick}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-3xl px-10 py-8 text-xl font-semibold transition-all transform hover:scale-105"
              >
                Analizza subito il tuo caso
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span>100% Anonimo</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-white" />
                <span>Privacy Garantita</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-white" />
                <span>AI Avanzata</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Come Funziona Section */}
    <section id="come-funziona" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Come <span className="bg-gradient-primary bg-clip-text text-transparent">Funziona</span>
          </h2>
          <p className="text-xl text-muted-foreground">Tre semplici passi verso la chiarezza legale</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">1</span>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Racconta il tuo caso</h3>
              <p className="text-muted-foreground">
                Descrivi la situazione con parole tue. L'AI comprenderà e ti guiderà.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">2</span>
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Analisi intelligente</h3>
              <p className="text-muted-foreground">
                Il sistema consulta la normativa vigente italiana ed europea.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">3</span>
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ricevi documenti</h3>
              <p className="text-muted-foreground">
                Ottieni schede informative chiare e PDF scaricabili.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* Comparison Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Perché Difendimi è <span className="bg-gradient-primary bg-clip-text text-transparent">diverso</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Confronto tra Difendimi.AI e le AI generiche
          </p>
        </div>
        
        <Card className="max-w-6xl mx-auto overflow-hidden border-primary/20">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-bold text-foreground">Caratteristica</TableHead>
                  <TableHead className="font-bold text-center text-primary">Difendimi.AI</TableHead>
                  <TableHead className="font-bold text-center text-muted-foreground">ChatGPT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Focus</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Specializzato sul diritto italiano ed europeo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Generalista, copre qualsiasi argomento
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Affidabilità normativa</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Consulta banche dati ufficiali (Normattiva, EUR-Lex, ecc.)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <X className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Non ha accesso diretto a banche dati giuridiche ufficiali</span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Output</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Documenti pratici (schede, dossier PDF, bozze email/diffide)
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Risposte testuali generiche
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Personalizzazione</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Analisi del tuo caso specifico e guida passo passo</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Risposte standard, non sempre contestualizzate alla normativa vigente
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Usabilità</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Interfaccia semplice, pensata per chi non è giurista
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Richiede competenze per formulare prompt corretti
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Obiettivo</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-medium">Farti valere i tuoi diritti in tempi rapidi e senza parcelle</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Rispondere in modo ampio a qualsiasi curiosità
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </section>

    {/* What You Get Section - Interactive Preview */}
    <section id="preview" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Cosa <span className="bg-gradient-primary bg-clip-text text-transparent">riceverai</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Esplora un esempio reale di analisi generata da Difendimi
          </p>
        </div>
        
        {/* Preview Card */}
        <Card className="max-w-4xl mx-auto border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Esempio: Multa per divieto di sosta</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Vedi come appare un'analisi completa del tuo caso
                </p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                DEMO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Mini preview of sections */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Sommario Esecutivo
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {DEMO_CASE_DATA.executive_summary?.summary}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Scale className="h-4 w-4 text-primary" />
                    Qualifica Giuridica
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {DEMO_CASE_DATA.qualificazione_giuridica?.description}
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => setShowPreview(true)}
                  className="shadow-elegant"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Vedi esempio completo
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/case/new")}
                >
                  Analizza il tuo caso
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Pricing Section */}
    <section id="pricing" className="py-20 bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Scegli il tuo <span className="bg-gradient-primary bg-clip-text text-transparent">piano</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Inizia gratis o sblocca tutte le funzionalità con Premium
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Per iniziare subito</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-muted-foreground ml-2">sempre gratis</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analisi del tuo caso specifico</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Interrogazione del sistema normativo italiano</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Report standard</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Principali riferimenti normativi</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Inizia gratis
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative overflow-hidden border-primary shadow-lg">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              PIÙ POPOLARE
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Per professionisti e casi complessi</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€4,13</span>
                <span className="text-muted-foreground ml-2">/mese</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Tutto il piano Free, più:</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dossier completo</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Qualifica giuridica dettagliata</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Opzioni strategiche complete</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Passi operativi guidati</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Termini e scadenze specifiche</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Documenti e allegati personalizzati</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Export PDF illimitati</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                onClick={() => navigate("/login")}
              >
                Inizia Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* FAQ Section */}
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Domande <span className="bg-gradient-primary bg-clip-text text-transparent">Frequenti</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Tutto quello che devi sapere su Difendimi
          </p>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Che cos'è Difendimi?
                </AccordionTrigger>
                <AccordionContent>
                  Difendimi è un assistente digitale esperto in diritto che ti aiuta a capire subito cosa dice la legge sul tuo caso, senza attese né parcelle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Difendimi sostituisce un avvocato?
                </AccordionTrigger>
                <AccordionContent>
                  No. Difendimi non è uno studio legale e non fornisce consulenza personalizzata da parte di un avvocato. Ti aiuta però a orientarti tra le norme, a capire i tuoi diritti e a preparare la documentazione di base.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Come funziona l'analisi del caso?
                </AccordionTrigger>
                <AccordionContent>
                  Inserisci una descrizione semplice del tuo problema. Difendimi consulta la normativa vigente italiana ed europea e genera un dossier con: sintesi del caso, riferimenti normativi, opzioni procedurali e documenti utili.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Cosa ricevo con l'app?
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Sommario esecutivo del tuo caso</li>
                    <li>Dossier completo con riferimenti normativi</li>
                    <li>Qualifica giuridica del problema</li>
                    <li>Opzioni strategiche possibili</li>
                    <li>Passi operativi con termini e scadenze</li>
                    <li>Documenti e allegati da utilizzare</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  I documenti sono validi legalmente?
                </AccordionTrigger>
                <AccordionContent>
                  I documenti generati sono bozze pronte all'uso (email, diffide, istanze, ecc.). Non sostituiscono un atto redatto da un avvocato, ma ti permettono di organizzarti subito e di risparmiare tempo e costi.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  Quanto tempo ci vuole per ricevere il dossier?
                </AccordionTrigger>
                <AccordionContent>
                  Il dossier viene generato in pochi secondi, pronto da consultare o scaricare in PDF.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">
                  Difendimi è sicuro?
                </AccordionTrigger>
                <AccordionContent>
                  Sì. Difendimi non salva i dati dei tuoi casi e i dossier generati non contengono alcuna informazione personale o sensibile. Puoi quindi essere sicuro al 100%.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Download App Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Porta Difendimi.AI <span className="bg-gradient-primary bg-clip-text text-transparent">sempre con te</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Scarica l'app e accedi alle informazioni legali ovunque ti trovi
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto border-primary/20 bg-background/95 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <Download className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Installa l'applicazione</h3>
            <p className="text-muted-foreground mb-8">
              Con un semplice click, installa Difendimi.AI sul tuo dispositivo e accedi rapidamente quando ne hai bisogno. Nessun download da store, installazione diretta dal browser.
            </p>
            <Button
              size="lg"
              onClick={handleMainButtonClick}
              className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant px-12"
            >
              <Download className="h-5 w-5 mr-2" />
              Scarica l'app
            </Button>
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Sicura</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Veloce</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Disclaimer Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto border-primary/20 bg-background/50 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Nota Importante</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Difendimi.AI fornisce esclusivamente informazioni educative basate su fonti ufficiali.
              Per questioni legali specifiche, consulta sempre un professionista qualificato.
              Il servizio è progettato per aiutarti a comprendere meglio le normative applicabili.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Difendimi.AI</span>
            </div>
            <p className="text-background/70 text-sm">
              Scopri cosa dice la legge senza attese né parcelle
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Esplora</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="hover:text-background transition text-left"
                >
                  Come funziona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('preview')} 
                  className="hover:text-background transition text-left"
                >
                  Preview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('pricing')} 
                  className="hover:text-background transition text-left"
                >
                  Prezzi
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('faq')} 
                  className="hover:text-background transition text-left"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legale</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/privacy" className="hover:text-background transition">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-background transition">Termini di Servizio</a></li>
              <li><a href="/cookie" className="hover:text-background transition">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          <p>&copy; 2024 Difendimi.AI. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
    

    {/* Preview Modal */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Esempio di Analisi - Multa per divieto di sosta</DialogTitle>
            <Badge variant="secondary">DEMO</Badge>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto h-[calc(90vh-80px)]">
          <ReportSections report={DEMO_CASE_DATA} />
        </div>
      </DialogContent>
    </Dialog>

  </div>
  );
};

export default Index;