import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2, Mail, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import logoShield from "@/assets/logo-shield.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Generate a secure random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privacyConsent) {
      toast({
        title: "Consenso richiesto",
        description: "Devi accettare i termini e le condizioni per procedere.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Generate a password for the user
    const autoPassword = generatePassword();
    setGeneratedPassword(autoPassword);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password: autoPassword,
      options: {
        emailRedirectTo: redirectUrl,
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
    } else if (data?.user) {
      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (otpError) {
        toast({
          title: "Errore invio OTP",
          description: otpError.message,
          variant: "destructive",
        });
        setLoading(false);
      } else {
        toast({
          title: "Codice OTP inviato",
          description: "Controlla la tua email per il codice di verifica.",
        });
        setShowOtpInput(true);
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      toast({
        title: "Errore verifica OTP",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Account verificato",
        description: `La tua password è: ${generatedPassword}. Salvala in un posto sicuro!`,
        duration: 10000,
      });
      
      // Update profile with privacy consent
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          privacy_consent: true,
          privacy_consent_date: new Date().toISOString()
        }).eq("user_id", user.id);
      }
      
      navigate("/dashboard");
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoShield} 
              alt="Difendimi.AI" 
              className="h-16 w-16 drop-shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl text-center">Difendimi.AI</CardTitle>
          <CardDescription className="text-center">
            Accedi per gestire i tuoi casi in completa privacy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Registrati</TabsTrigger>
              <TabsTrigger value="signin">Accedi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup">
              {!showOtpInput ? (
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
                      Ti invieremo un codice OTP e genereremo una password sicura per te
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyConsent}
                      onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ho letto e accetto la{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      , i{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Termini e Condizioni
                      </Link>
                      {" "}e il{" "}
                      <Link to="/disclaimer" className="text-primary hover:underline">
                        Disclaimer Legale
                      </Link>
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !privacyConsent}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Registrati con Email
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">
                      <KeyRound className="h-4 w-4 inline mr-2" />
                      Codice OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Inserisci il codice ricevuto via email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Controlla la tua email per il codice di verifica
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifica in corso...
                      </>
                    ) : (
                      "Verifica e Accedi"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                  >
                    Torna indietro
                  </Button>
                </form>
              )}
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