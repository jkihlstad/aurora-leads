import { NextResponse } from "next/server";
import { getStripe, getStripePlan, StripePlanId } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

interface SubscriptionRecord {
  stripe_customer_id: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, promoCode } = body;

    if (!planId || !["standard", "pro"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const plan = getStripePlan(planId as "standard" | "pro");

    if (!plan.priceId || plan.priceId === "price_standard_monthly" || plan.priceId === "price_pro_monthly") {
      console.error("No price ID found for plan:", planId, "- check STRIPE_STANDARD_PRICE_ID and STRIPE_PRO_PRICE_ID env vars");
      return NextResponse.json(
        { error: "Price configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Get user's subscription to check for existing Stripe customer ID
    const { data } = await (supabase as any)
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    const subscription = data as SubscriptionRecord | null;

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings?canceled=true`,
      metadata: {
        planId: planId,
        userId: user.id, // Include user ID for webhook processing
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
      // Enable promo codes on checkout page
      allow_promotion_codes: true,
    };

    // If a promo code was provided, try to apply it
    if (promoCode && promoCode.trim()) {
      try {
        // Look up the promotion code
        const promotionCodes = await getStripe().promotionCodes.list({
          code: promoCode.trim(),
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          // Use discounts instead of allow_promotion_codes when we have a specific code
          sessionOptions.discounts = [
            {
              promotion_code: promotionCodes.data[0].id,
            },
          ];
          // Remove allow_promotion_codes since we're using discounts
          delete sessionOptions.allow_promotion_codes;
        }
      } catch (error) {
        console.error("Error looking up promo code:", error);
        // Continue without the promo code if lookup fails
      }
    }

    // If customer already exists in Stripe, use their ID
    if (subscription?.stripe_customer_id) {
      sessionOptions.customer = subscription.stripe_customer_id;
    } else {
      // Create new customer with user's email
      sessionOptions.customer_email = user.email;
    }

    const session = await getStripe().checkout.sessions.create(sessionOptions);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
