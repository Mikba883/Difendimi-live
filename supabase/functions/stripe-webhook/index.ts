// Stripe Webhook → aggiorna tabella profiles (is_premium, subscription info)

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Secrets (inseriti da Supabase Dashboard o CLI)
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper per risposta JSON
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Aggiorna per user_id (metadata)
async function updateProfileByUserId(user_id: string, data: Record<string, unknown>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("user_id", user_id);

  if (error) throw new Error(error.message);
}

// Aggiorna per stripe_customer_id (fallback se manca user_id)
async function updateProfileByCustomerId(customer_id: string, data: Record<string, unknown>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customer_id);

  if (error) throw new Error(error.message);
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return json(400, { error: "Missing stripe-signature" });
  if (!STRIPE_WEBHOOK_SECRET) return json(500, { error: "Missing webhook secret" });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return json(400, { error: "Invalid signature" });
  }

  console.log(`[WEBHOOK] Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const user_id = (session.metadata?.user_id as string) || null;
        const customerId = session.customer as string | null;

        let subscriptionId: string | null = null;
        let status: string | null = null;
        let endISO: string | null = null;
        let priceId: string | null = null;

        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          subscriptionId = sub.id;
          status = sub.status;
          endISO = new Date(sub.current_period_end * 1000).toISOString();
          priceId = sub.items.data?.[0]?.price?.id ?? null;
        }

        const updateData = {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: status,
          subscription_end_date: endISO,
          subscription_price_id: priceId,
          is_premium: session.mode === "subscription"
            ? status === "active" || status === "trialing"
            : true,
        };

        if (user_id) await updateProfileByUserId(user_id, updateData);
        else if (customerId) await updateProfileByCustomerId(customerId, updateData);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const isPremium = sub.status === "active" || sub.status === "trialing";

        const updateData = {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          subscription_end_date: new Date(sub.current_period_end * 1000).toISOString(),
          subscription_price_id: sub.items.data?.[0]?.price?.id ?? null,
          is_premium: isPremium,
        };

        const user_id = (sub.metadata?.user_id as string) || null;
        if (user_id) await updateProfileByUserId(user_id, updateData);
        else await updateProfileByCustomerId(customerId, updateData);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const updateData = {
          subscription_status: "canceled",
          is_premium: false,
        };

        const user_id = (sub.metadata?.user_id as string) || null;
        if (user_id) await updateProfileByUserId(user_id, updateData);
        else await updateProfileByCustomerId(customerId, updateData);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const customerId = sub.customer as string;

        const updateData = {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          subscription_status: "active",
          subscription_end_date: new Date(sub.current_period_end * 1000).toISOString(),
          subscription_price_id: sub.items.data?.[0]?.price?.id ?? null,
          is_premium: true,
        };

        const user_id = (sub.metadata?.user_id as string) || null;
        if (user_id) await updateProfileByUserId(user_id, updateData);
        else await updateProfileByCustomerId(customerId, updateData);
        break;
      }

      default:
        console.log(`[WEBHOOK] Ignored event: ${event.type}`);
    }

    return json(200, { received: true });
  } catch (e) {
    console.error("[WEBHOOK] Error processing event:", e);
    return json(500, { error: String(e) });
  }
});
