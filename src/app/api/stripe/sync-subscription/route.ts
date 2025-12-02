import { NextResponse } from "next/server";
import { getStripe, STRIPE_PLANS, getStripePriceIds } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Helper to get plan type from Stripe price ID
function getPlanFromPriceId(priceId: string): "free" | "standard" | "pro" {
  const priceIds = getStripePriceIds();
  if (priceId === priceIds.standard_monthly) return "standard";
  if (priceId === priceIds.pro_monthly) return "pro";
  return "free";
}

// POST - Sync subscription from Stripe to database
// This is useful when webhooks can't reach localhost
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    // Use regular client - RLS policies allow users to manage their own data
    const db = supabase as any;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user's subscription from database
    const { data: dbSub } = await db
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    let customerId = dbSub?.stripe_customer_id;
    let subscriptionId = dbSub?.stripe_subscription_id;

    // If no customer ID in database, try to find by email in Stripe
    if (!customerId) {
      const customers = await getStripe().customers.list({
        email: user.email!,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (!customerId) {
      return NextResponse.json({
        success: true,
        message: "No Stripe customer found for this user",
        plan: "free",
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - downgrade to free
      await db
        .from("subscriptions")
        .update({
          plan: "free",
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          scrapes_limit: STRIPE_PLANS.free.scrapeLimit,
        })
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        message: "No active subscription found - set to free plan",
        plan: "free",
      });
    }

    // Get the active subscription
    const subscription = subscriptions.data[0] as any;
    const priceId = subscription.items.data[0]?.price.id;
    const plan = getPlanFromPriceId(priceId);

    // Get payment method details
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
    const updateData: Record<string, any> = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan: plan,
      status: "active",
      scrapes_limit: STRIPE_PLANS[plan].scrapeLimit,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      payment_method_brand: paymentMethodBrand,
      payment_method_last4: paymentMethodLast4,
    };

    // Only add dates if they exist
    if (subscription.current_period_start) {
      updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
    }
    if (subscription.current_period_end) {
      updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
    }

    const { error: updateError } = await db
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription synced successfully`,
      plan: plan,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      },
    });
  } catch (error: any) {
    console.error("Sync subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}
