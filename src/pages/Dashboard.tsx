import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Trash2, LogOut, Shield, User } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Difendimi.AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <User className="h-4 w-4 mr-2" />
                {userEmail}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Title and New Case Button - Centered */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">I tuoi casi</h2>
            <p className="text-muted-foreground mb-6">
              Gestisci i tuoi casi in completa privacy
            </p>
            <Button onClick={() => navigate("/case/new")} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Nuovo Caso
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {caseItem.title}
                    </CardTitle>
                    <CardDescription>
                      Creato il {format(new Date(caseItem.created_at), "d MMMM yyyy", { locale: it })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      {caseItem.doc_availability?.relazione && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Relazione
                        </span>
                      )}
                      {caseItem.doc_availability?.diffida && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Diffida
                        </span>
                      )}
                      {caseItem.doc_availability?.adr && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          ADR
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/case/${caseItem.id}`)}
                      >
                        Apri
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
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
                            <AlertDialogAction onClick={() => handleDeleteCase(caseItem.id)}>
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