import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for confirmation parameters from email link
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    
    const handleEmailConfirmation = async () => {
      if (token && type === "signup") {
        // Handle email confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup"
        });
        
        if (error) {
          toast({
            title: "Errore di verifica",
            description: "Il link di verifica non è valido o è scaduto",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email verificata",
            description: "Il tuo account è stato verificato con successo",
          });
          navigate("/case/new");
        }
      }
    };

    handleEmailConfirmation();

    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If already logged in, redirect to new case page
        navigate("/case/new");
      }
    };
    
    checkSession();

    // Listen for auth changes (when user clicks the magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // When user signs in via magic link, redirect to new case page
        navigate("/case/new");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50"
        onClick={() => navigate("/login")}
        aria-label="Torna al login"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent animate-pulse">
                D
              </span>
              <span className="text-3xl font-bold bg-gradient-to-r from-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                ifendimi
              </span>
            </span>
          </div>
          <CardTitle className="text-2xl text-center">Controlla la tua email</CardTitle>
          <CardDescription className="text-center">
            Ti abbiamo inviato un link di verifica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Abbiamo inviato un'email di conferma al tuo indirizzo. 
              Clicca sul link nell'email per verificare il tuo account e accedere a Difendimi.
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-center text-muted-foreground">
                <strong>Non hai ricevuto l'email?</strong><br />
                Controlla la cartella spam o posta indesiderata.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna al login
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Il link di verifica è valido per 24 ore
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;