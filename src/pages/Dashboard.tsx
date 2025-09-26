import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Trash2, LogOut, Shield, User, ChevronDown, CreditCard, BarChart3, Calendar, FileCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Case {
  id: string;
  title: string;
  created_at: string;
  doc_availability: {
    relazione: boolean;
    diffida: boolean;
    adr: boolean;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    checkAuth();
    fetchCases();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUserEmail(session.user.email || "");
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, created_at, doc_availability")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases((data || []).map(item => ({
        ...item,
        doc_availability: item.doc_availability as {
          relazione: boolean;
          diffida: boolean;
          adr: boolean;
        }
      })));
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i casi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;

      setCases(cases.filter(c => c.id !== caseId));
      toast({
        title: "Caso eliminato",
        description: "Il caso è stato eliminato con successo.",
      });
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il caso.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {},
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Errore",
        description: "Impossibile aprire il portale clienti. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const totalCases = cases.length;
  const totalDocuments = cases.reduce((acc, c) => {
    let count = 0;
    if (c.doc_availability?.relazione) count++;
    if (c.doc_availability?.diffida) count++;
    if (c.doc_availability?.adr) count++;
    return acc + count;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-7 w-7 text-primary animate-pulse-slow" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Difendimi.AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {userEmail}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleManageSubscription}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Gestisci abbonamento
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Casi Totali</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCases}</div>
                <p className="text-xs text-muted-foreground">Casi gestiti</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documenti Generati</CardTitle>
                <FileCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDocuments}</div>
                <p className="text-xs text-muted-foreground">Documenti totali</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ultimo Caso</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cases.length > 0 
                    ? format(new Date(cases[0].created_at), "d MMM", { locale: it })
                    : "-"
                  }
                </div>
                <p className="text-xs text-muted-foreground">Data creazione</p>
              </CardContent>
            </Card>
          </div>

          {/* Title and New Case Button */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">I tuoi casi</h2>
            <p className="text-muted-foreground mb-6">
              Gestisci i tuoi casi legali in completa privacy e sicurezza
            </p>
            <Button 
              onClick={() => navigate("/case/new")} 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold transform hover:scale-[1.02]"
            >
              <Plus className="h-6 w-6 mr-3" />
              <span className="font-semibold">Nuovo Caso</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Cases Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cases.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun caso presente</h3>
                <p className="text-muted-foreground mb-6">
                  Inizia creando il tuo primo caso
                </p>
                <Button onClick={() => navigate("/case/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea il tuo primo caso
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 to-primary-hover/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {caseItem.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(caseItem.created_at), "d MMMM yyyy", { locale: it })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {caseItem.doc_availability?.relazione && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                          <FileCheck className="h-3 w-3" />
                          Relazione
                        </span>
                      )}
                      {caseItem.doc_availability?.diffida && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                          <FileCheck className="h-3 w-3" />
                          Diffida
                        </span>
                      )}
                      {caseItem.doc_availability?.adr && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
                          <FileCheck className="h-3 w-3" />
                          ADR
                        </span>
                      )}
                      {!caseItem.doc_availability?.relazione && 
                       !caseItem.doc_availability?.diffida && 
                       !caseItem.doc_availability?.adr && (
                        <span className="text-xs text-muted-foreground">
                          Nessun documento
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary-hover"
                        onClick={() => navigate(`/case/${caseItem.id}`)}
                      >
                        Apri caso
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione non può essere annullata. Il caso sarà eliminato permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCase(caseItem.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;