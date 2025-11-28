import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS, StripePlanId } from "@/lib/stripe";
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
    const { planId } = body;

    if (!planId || !["standard", "pro"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planId as StripePlanId];

    if (!plan.priceId) {
      return NextResponse.json(
        { error: "This plan does not require payment" },
        { status: 400 }
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
    };

    // If customer already exists in Stripe, use their ID
    if (subscription?.stripe_customer_id) {
      sessionOptions.customer = subscription.stripe_customer_id;
    } else {
      // Create new customer with user's email
      sessionOptions.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

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
