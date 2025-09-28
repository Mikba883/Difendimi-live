import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    // Handle password reset token from URL
    const handlePasswordReset = async () => {
      // First check URL params (for newer Supabase versions)
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      const tokenHash = urlParams.get('token_hash');
      
      // Also check hash params (for compatibility)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      // Log for debugging
      console.log('Reset password params:', {
        type,
        tokenHash, 
        accessToken: !!accessToken,
        refreshToken: !!refreshToken
      });
      
      // Handle recovery type with token_hash
      if (type === 'recovery' && tokenHash) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          
          if (error) {
            console.error('Error verifying OTP:', error);
            toast({
              title: "Errore",
              description: "Link di reset non valido o scaduto",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }
        } catch (err) {
          console.error('Error during OTP verification:', err);
        }
      } 
      // Handle access token from hash (older method)
      else if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            toast({
              title: "Errore",
              description: "Link di reset non valido o scaduto",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }
        } catch (err) {
          console.error('Error during session setup:', err);
        }
      }
      // Check for existing session
      else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, redirecting to login');
          navigate("/login");
        }
      }
    };
    
    handlePasswordReset();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      setPasswordUpdated(true);
      setLoading(false);
      
      // Redirect to new case page after a moment
      setTimeout(() => {
        navigate("/case/new");
      }, 2000);
    }
  };

  if (passwordUpdated) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
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
            <CardTitle className="text-2xl text-center">Password aggiornata!</CardTitle>
            <CardDescription className="text-center">
              La tua password è stata reimpostata con successo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Reindirizzamento alla creazione di un nuovo caso...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
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
          <CardTitle className="text-2xl text-center">Reimposta la password</CardTitle>
          <CardDescription className="text-center">
            Inserisci la tua nuova password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                <KeyRound className="h-4 w-4 inline mr-2" />
                Nuova password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                minLength={6}
                placeholder="Minimo 6 caratteri"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <KeyRound className="h-4 w-4 inline mr-2" />
                Conferma password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ripeti la password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aggiornamento in corso...
                </>
              ) : (
                "Reimposta password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;