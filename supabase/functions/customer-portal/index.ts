import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`[CUSTOMER-PORTAL] Request received: ${req.method} from ${req.headers.get("origin")}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[CUSTOMER-PORTAL] No authorization header provided");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("[CUSTOMER-PORTAL] Attempting to get user with token");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("[CUSTOMER-PORTAL] Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    
    if (!user?.email) {
      console.error("[CUSTOMER-PORTAL] User or email not found");
      throw new Error("User not authenticated or email not available");
    }

    console.log(`[CUSTOMER-PORTAL] Creating portal session for user: ${user.email}`);

    // Initialize Stripe with better error handling
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CUSTOMER-PORTAL] STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Get customer ID with better logging
    console.log(`[CUSTOMER-PORTAL] Searching for Stripe customer with email: ${user.email}`);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.error(`[CUSTOMER-PORTAL] No Stripe customer found for email: ${user.email}`);
      throw new Error("No Stripe customer found for this user. Please ensure you have an active subscription.");
    }

    const customerId = customers.data[0].id;
    console.log(`[CUSTOMER-PORTAL] Found customer: ${customerId}`);

    // Get origin and ensure it's not localhost in production
    const origin = req.headers.get("origin") || "https://difendimiai.com";
    console.log(`[CUSTOMER-PORTAL] Using return URL: ${origin}/dashboard`);
    
    // Create portal session with configuration ID if provided
    const portalConfig = {
      customer: customerId,
      return_url: `${origin}/dashboard`,
      // If you have a specific portal configuration ID, uncomment and use it:
      // configuration: 'bpc_1SCHJhGUM0wmwBaNiZt2hHdU',
    };
    
    console.log(`[CUSTOMER-PORTAL] Creating portal session with config:`, portalConfig);
    const portalSession = await stripe.billingPortal.sessions.create(portalConfig);

    console.log(`[CUSTOMER-PORTAL] Successfully created portal session: ${portalSession.id}`);
    console.log(`[CUSTOMER-PORTAL] Portal URL: ${portalSession.url}`);

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CUSTOMER-PORTAL] Detailed error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Provide more helpful error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes("No Stripe customer")) {
      userFriendlyMessage = "Non hai un abbonamento attivo. Per favore sottoscrivi un piano prima di gestire l'abbonamento.";
    } else if (errorMessage.includes("Authentication")) {
      userFriendlyMessage = "Sessione scaduta. Per favore effettua nuovamente l'accesso.";
    } else if (errorMessage.includes("Stripe configuration")) {
      userFriendlyMessage = "Errore di configurazione del sistema di pagamento. Contatta il supporto.";
    }
    
    return new Response(
      JSON.stringify({ 
        error: userFriendlyMessage,
        details: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});