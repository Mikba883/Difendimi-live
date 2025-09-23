import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText,
  Scale,
  BookOpen,
  ListCheck,
  Calendar,
  Paperclip,
  Menu
} from "lucide-react";
import type { TabbedLegalReport } from "@/types/case";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReportSectionsProps {
  report: TabbedLegalReport;
}

const sectionIcons = {
  executive: { icon: FileText, label: "Sommario Esecutivo", color: "text-blue-600" },
  qualificazione: { icon: Scale, label: "Qualificazione Giuridica", color: "text-purple-600" },
  opzioni: { icon: BookOpen, label: "Opzioni Strategiche", color: "text-green-600" },
  passi: { icon: ListCheck, label: "Passi Operativi", color: "text-orange-600" },
  termini: { icon: Calendar, label: "Termini e Scadenze", color: "text-red-600" },
  allegati: { icon: Paperclip, label: "Documenti e Allegati", color: "text-gray-600" }
};

export function ReportSections({ report }: ReportSectionsProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Handle both camelCase and snake_case formats
  const normalizedReport = report ? {
    ...report,
    executive_summary: report.executive_summary || (report as any).executiveSummary,
    qualificazione_giuridica: report.qualificazione_giuridica || (report as any).qualificazioneGiuridica,
    passi_operativi: report.passi_operativi || (report as any).passiOperativi,
  } : null;

  // Scroll spy to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = Object.keys(sectionIcons);
      
      for (const section of sections) {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (top <= 100 && bottom > 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (section: string) => {
    const element = document.getElementById(`section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  if (!normalizedReport) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nessun report disponibile per questo caso.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Horizontal Navigation */}
      {!isMobile && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
          <TooltipProvider>
            <nav className="flex items-center justify-center gap-1 p-3">
              {Object.entries(sectionIcons).map(([key, { icon: Icon, label, color }]) => {
                const isActive = activeSection === key;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => scrollToSection(key)}
                        className={cn(
                          "transition-all duration-200",
                          isActive && "shadow-sm"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", !isActive && color)} />
                        <span className="ml-2 hidden lg:inline">{label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
        </div>
      )}

      {/* Mobile Floating Button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 w-14 bg-background border-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Mobile Menu Drawer */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Naviga alle sezioni</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            {Object.entries(sectionIcons).map(([key, { icon: Icon, label, color }]) => (
              <button
                key={key}
                onClick={() => scrollToSection(key)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  "hover:bg-muted",
                  activeSection === key && "bg-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5", color)} />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <div className="space-y-8">
        {normalizedReport.disclaimer && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {normalizedReport.disclaimer}
            </AlertDescription>
          </Alert>
        )}

        {/* Executive Summary */}
        <Card id="section-executive" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Sommario Esecutivo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {normalizedReport.executive_summary ? (
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {normalizedReport.executive_summary.summary || (normalizedReport.executive_summary as any).content}
                </p>
                {normalizedReport.executive_summary.key_points && (
                  <ul className="list-disc pl-5 space-y-2">
                    {normalizedReport.executive_summary.key_points.map((point, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nessun sommario disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Qualificazione Giuridica (with integrated Fonti) */}
        <Card id="section-qualificazione" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-600" />
              Qualificazione Giuridica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {normalizedReport.qualificazione_giuridica ? (
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground leading-relaxed">
                    {normalizedReport.qualificazione_giuridica.description || (normalizedReport.qualificazione_giuridica as any).content}
                  </p>
                </div>
                
                {normalizedReport.qualificazione_giuridica.articles && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Articoli di riferimento</h4>
                    <div className="space-y-2">
                      {normalizedReport.qualificazione_giuridica.articles.map((article, idx) => (
                        <div key={idx} className="bg-muted/30 rounded-lg p-3">
                          <p className="text-muted-foreground">{article}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrated Fonti */}
                {normalizedReport.fonti?.items?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium text-lg">Riferimenti Normativi</h4>
                    {normalizedReport.fonti.items.map((fonte, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-background">
                        <h5 className="font-medium">{fonte.title}</h5>
                        {fonte.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {fonte.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nessuna qualificazione disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Opzioni */}
        <Card id="section-opzioni" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Opzioni Strategiche
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {normalizedReport.opzioni?.rows?.length ? (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3">Opzione</th>
                      <th className="text-left p-3">Pro</th>
                      <th className="text-left p-3">Contro</th>
                      <th className="text-left p-3">Tempi</th>
                      <th className="text-left p-3">Costi</th>
                      <th className="text-left p-3">Esito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedReport.opzioni.rows.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{row.name || (row as any).option}</td>
                        <td className="p-3 text-sm text-green-600">{row.pro || (row as any).pros}</td>
                        <td className="p-3 text-sm text-red-600">{row.contro || (row as any).cons}</td>
                        <td className="p-3 text-sm">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {row.tempi || '-'}
                        </td>
                        <td className="p-3 text-sm">{row.costi || '-'}</td>
                        <td className="p-3 text-sm">{row.esito || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">Nessuna opzione disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Passi Operativi */}
        <Card id="section-passi" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <ListCheck className="h-5 w-5 text-orange-600" />
              Passi Operativi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {normalizedReport.passi_operativi?.checklist?.length ? (
              <div className="space-y-3">
                {normalizedReport.passi_operativi.checklist.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground flex-1">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nessun passo operativo disponibile.</p>
            )}
          </CardContent>
        </Card>

        {/* Termini e Scadenze */}
        <Card id="section-termini" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-red-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Termini e Scadenze
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {(normalizedReport.termini?.prescription || normalizedReport.termini?.decadenza) && (
                <div className="space-y-3">
                  {normalizedReport.termini.prescription && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <strong className="text-red-800">Prescrizione:</strong> {normalizedReport.termini.prescription}
                      </AlertDescription>
                    </Alert>
                  )}
                  {normalizedReport.termini.decadenza && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription>
                        <strong className="text-orange-800">Decadenza:</strong> {normalizedReport.termini.decadenza}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {normalizedReport.termini?.deadlines?.length > 0 && 
                normalizedReport.termini.deadlines.filter(
                  d => !d.description.toLowerCase().includes('ricorso') && 
                       !d.description.toLowerCase().includes('comunicazione al proprietario')
                ).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Altre scadenze importanti</h4>
                  {normalizedReport.termini.deadlines
                    .filter(d => !d.description.toLowerCase().includes('ricorso') && 
                                !d.description.toLowerCase().includes('comunicazione al proprietario'))
                    .map((deadline, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{deadline.description}</p>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          deadline.type === 'prescription' 
                            ? 'bg-red-100 text-red-700'
                            : deadline.type === 'decadenza'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        )}>
                          {deadline.type === 'prescription' ? 'Prescrizione' :
                           deadline.type === 'decadenza' ? 'Decadenza' : 'Altro'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!normalizedReport.termini?.prescription && 
               !normalizedReport.termini?.decadenza && 
               (!normalizedReport.termini?.deadlines || normalizedReport.termini.deadlines.length === 0) && (
                <p className="text-muted-foreground">Nessuna scadenza da segnalare.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allegati */}
        <Card id="section-allegati" className="animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-gray-600" />
              Documenti e Allegati
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {normalizedReport.allegati ? (
              <div className="space-y-4">
                {normalizedReport.allegati.present?.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✓ Documenti Presenti</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {normalizedReport.allegati.present.map((doc, idx) => (
                        <li key={idx} className="text-green-700">{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {normalizedReport.allegati.missing?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">✗ Documenti Mancanti</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {normalizedReport.allegati.missing.map((doc, idx) => (
                        <li key={idx} className="text-red-700">{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {normalizedReport.allegati.nice_to_have?.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">○ Documenti Opzionali</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {normalizedReport.allegati.nice_to_have.map((doc, idx) => (
                        <li key={idx} className="text-yellow-700">{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nessuna informazione sugli allegati.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}