import { NextResponse } from "next/server";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// Helper to get plan type from Stripe price ID
function getPlanFromPriceId(priceId: string): "free" | "standard" | "pro" {
  if (priceId === STRIPE_PLANS.standard.priceId) return "standard";
  if (priceId === STRIPE_PLANS.pro.priceId) return "pro";
  return "free";
}

// Helper to get scrape limit from plan
function getScrapeLimitFromPlan(plan: "free" | "standard" | "pro"): number {
  return STRIPE_PLANS[plan].scrapeLimit;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient() as any;

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const planId = session.metadata?.planId as "standard" | "pro" | undefined;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      console.log("Checkout completed:", {
        planId,
        userId,
        customerId,
        subscriptionId,
        customerEmail: session.customer_email,
      });

      if (!userId || !planId) {
        console.error("Missing userId or planId in session metadata");
        break;
      }

      // Get subscription details from Stripe
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId) as any;
      const priceId = subscription.items.data[0]?.price.id;

      // Get payment method details if available
      let paymentMethodBrand: string | null = null;
      let paymentMethodLast4: string | null = null;

      if (subscription.default_payment_method) {
        const paymentMethod = await getStripe().paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        if (paymentMethod.card) {
          paymentMethodBrand = paymentMethod.card.brand;
          paymentMethodLast4 = paymentMethod.card.last4;
        }
      }

      // Update subscription in database
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: planId,
          status: "active",
          scrapes_used: 0, // Reset scrapes on new subscription
          scrapes_limit: getScrapeLimitFromPlan(planId),
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          payment_method_brand: paymentMethodBrand,
          payment_method_last4: paymentMethodLast4,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
      } else {
        console.log(`Subscription updated for user ${userId} to plan ${planId}`);
      }

      break;
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Subscription created:", subscription.id);
      // Handled in checkout.session.completed
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);

      console.log("Subscription updated:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan,
      });

      // Find user by Stripe customer ID
      const { data: subscriptionData, error: findError } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (findError || !subscriptionData) {
        console.error("Could not find subscription for customer:", customerId);
        break;
      }

      // Update subscription status
      const updateData: Record<string, any> = {
        status: subscription.status === "active" ? "active" :
                subscription.status === "past_due" ? "past_due" :
                subscription.status === "canceled" ? "canceled" : "active",
        plan,
        scrapes_limit: getScrapeLimitFromPlan(plan),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      };

      // Get updated payment method if available
      if (subscription.default_payment_method) {
        const paymentMethod = await getStripe().paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        if (paymentMethod.card) {
          updateData.payment_method_brand = paymentMethod.card.brand;
          updateData.payment_method_last4 = paymentMethod.card.last4;
        }
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("stripe_customer_id", customerId);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log("Subscription deleted:", subscription.id);

      // Downgrade user to free plan
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          scrapes_limit: STRIPE_PLANS.free.scrapeLimit,
          stripe_subscription_id: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
        })
        .eq("stripe_customer_id", customerId);

      if (updateError) {
        console.error("Error downgrading subscription:", updateError);
      } else {
        console.log(`Subscription downgraded to free for customer ${customerId}`);
      }

      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      console.log("Invoice paid:", invoice.id);

      // Only reset scrapes for subscription invoices (not one-time payments)
      if (!subscriptionId) break;

      // Get subscription to determine plan
      const invoiceSubscription = await getStripe().subscriptions.retrieve(subscriptionId) as any;
      const priceId = invoiceSubscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);

      // Reset monthly scrape count
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          scrapes_used: 0,
          current_period_start: new Date(invoiceSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(invoiceSubscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      if (updateError) {
        console.error("Error resetting scrapes:", updateError);
      } else {
        console.log(`Scrapes reset for customer ${customerId}`);
      }

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;

      console.log("Invoice payment failed:", invoice.id);

      // Update subscription status to past_due
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "past_due",
        })
        .eq("stripe_customer_id", customerId);

      if (updateError) {
        console.error("Error updating subscription status:", updateError);
      }

      // TODO: Send email notification to user about payment failure
      // This would typically be done via a service like SendGrid, Resend, etc.

      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
