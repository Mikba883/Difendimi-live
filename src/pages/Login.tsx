import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, KeyRound, ArrowLeft, Chrome } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/case/new");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/case/new");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/case/new`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (error) {
      toast({
        title: "Errore di accesso",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privacyConsent) {
      const privacyError = document.getElementById('privacy-error');
      if (privacyError) {
        privacyError.classList.remove('hidden');
      }
      return;
    }

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/verify-email`;
    
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
        data: {
          privacy_consent: true,
          privacy_consent_date: new Date().toISOString(),
        }
      }
    });

    if (error) {
      toast({
        title: "Errore di registrazione",
        description: error.message === "User already registered" 
          ? "Questo utente è già registrato. Prova ad accedere."
          : error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else if (data) {
      // Redirect to verify email page
      navigate("/verify-email");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Errore di accesso",
        description: error.message === "Invalid login credentials" 
          ? "Credenziali non valide. Riprova."
          : error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50"
        onClick={() => navigate("/")}
        aria-label="Torna alla home"
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
          <CardTitle className="text-2xl text-center">Accedi o Registrati</CardTitle>
          <CardDescription className="text-center">
            Gestisci i tuoi casi in completa privacy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign In - Primary Option */}
          <div className="space-y-4 mb-6">
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continua con Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Oppure con email
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Registrati</TabsTrigger>
              <TabsTrigger value="signin">Accedi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ti invieremo un'email di conferma con link di verifica. Controlla la tua casella email per validare l'account.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy"
                      checked={privacyConsent}
                      onCheckedChange={(checked) => {
                        setPrivacyConsent(checked as boolean);
                        if (checked) {
                          const privacyError = document.getElementById('privacy-error');
                          if (privacyError) {
                            privacyError.classList.add('hidden');
                          }
                        }
                      }}
                      className="mt-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm leading-relaxed cursor-pointer select-none"
                    >
                      <span className="font-medium">☑ Difendimi è uno strumento digitale per comprendere i propri diritti; non costituisce rapporto di consulenza legale.</span>
                      <br />
                      <span className="text-muted-foreground">Accetto la{" "}
                        <Link to="/privacy" className="text-primary hover:underline font-medium">
                          Privacy Policy
                        </Link>
                        {" "}e i{" "}
                        <Link to="/terms" className="text-primary hover:underline font-medium">
                          Termini e Condizioni
                        </Link>
                      </span>
                    </label>
                  </div>
                  <p id="privacy-error" className="text-sm text-destructive hidden">
                    Devi accettare i termini e le condizioni per procedere
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio email...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Registrati
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : (
                    "Accedi"
                  )}
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Password dimenticata?
                  </Link>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            I tuoi dati sono protetti e completamente anonimi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;