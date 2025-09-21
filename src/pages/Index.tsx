import { Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow animate-pulse-glow">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Difendimi.AI
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-2xl mb-12">
            La tua difesa intelligente nel mondo digitale
          </p>
          
          {/* Call to action placeholder */}
          <div className="flex flex-col items-center gap-6">
            <div className="px-8 py-4 rounded-lg bg-card border border-border shadow-md">
              <p className="text-foreground">
                Benvenuto nel tuo nuovo progetto. Inizia a costruire qualcosa di straordinario.
              </p>
            </div>
            
            {/* Features grid placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-5 h-5 bg-primary rounded-sm"></div>
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Sicurezza</h3>
                <p className="text-sm text-muted-foreground">Protezione avanzata con tecnologia AI</p>
              </div>
              
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <div className="w-5 h-5 bg-secondary rounded-sm"></div>
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Intelligenza</h3>
                <p className="text-sm text-muted-foreground">Algoritmi intelligenti per la tua difesa</p>
              </div>
              
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <div className="w-5 h-5 bg-accent rounded-sm"></div>
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Innovazione</h3>
                <p className="text-sm text-muted-foreground">Tecnologia all'avanguardia sempre aggiornata</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;