import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("[WEBHOOK] Missing STRIPE_WEBHOOK_SECRET");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    
    console.log(`[WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          const customerId = session.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          
          if ("email" in customer && customer.email) {
            // Update user profile with subscription info
            const { data: profile } = await supabase
              .from("profiles")
              .select("user_id")
              .eq("email", customer.email)
              .single();
            
            if (profile) {
              await supabase
                .from("profiles")
                .update({
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscription.id,
                  subscription_status: subscription.status,
                  subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                  subscription_price_id: subscription.items.data[0].price.id,
                  is_premium: true,
                })
                .eq("user_id", profile.user_id);
              
              console.log(`[WEBHOOK] Updated profile for user ${profile.user_id}`);
              
              // Track Purchase event server-side to Meta Pixel API
              try {
                const metaPixelResponse = await supabase.functions.invoke('meta-pixel-api', {
                  body: {
                    eventName: 'Purchase',
                    eventData: {
                      currency: 'EUR',
                      value: session.amount_total ? session.amount_total / 100 : 49.60,
                      content_type: 'product',
                      content_name: 'Premium Subscription',
                      content_category: 'subscription',
                      num_items: 1
                    },
                    userData: {
                      email: customer.email,
                      client_user_agent: req.headers.get('user-agent') || undefined,
                      event_source_url: `${Deno.env.get("SUPABASE_URL")}/stripe-webhook`
                    }
                  }
                });
                
                console.log(`[WEBHOOK] Purchase event tracked to Meta Pixel`, metaPixelResponse);
              } catch (metaError) {
                console.error(`[WEBHOOK] Failed to track Purchase event to Meta Pixel:`, metaError);
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              is_premium: subscription.status === "active",
            })
            .eq("user_id", profile.user_id);
          
          console.log(`[WEBHOOK] Updated subscription for user ${profile.user_id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Cancel subscription
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "canceled",
              is_premium: false,
            })
            .eq("user_id", profile.user_id);
          
          console.log(`[WEBHOOK] Canceled subscription for user ${profile.user_id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();
          
          if (profile) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                is_premium: true,
              })
              .eq("user_id", profile.user_id);
            
            console.log(`[WEBHOOK] Payment succeeded for user ${profile.user_id}`);
          }
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});