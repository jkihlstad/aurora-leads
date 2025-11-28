import { NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

interface DbSubscription {
  plan: string;
  status: string;
  scrapes_used: number;
  scrapes_limit: number;
  current_period_end: string | null;
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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    // Verify the session belongs to this user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: "Session does not belong to this user" },
        { status: 403 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const planId = session.metadata?.planId as keyof typeof STRIPE_PLANS;
    const plan = STRIPE_PLANS[planId];

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = session.customer as any;
    const subscription = session.subscription as any;

    // Fetch the updated subscription from database (should be updated by webhook)
    const { data } = await (supabase as any)
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const dbSubscription = data as DbSubscription | null;

    return NextResponse.json({
      success: true,
      plan: {
        id: planId,
        name: plan.name,
        scrapeLimit: plan.scrapeLimit,
      },
      customer: {
        id: customer?.id,
        email: customer?.email || session.customer_email,
      },
      subscription: {
        id: subscription?.id,
        status: subscription?.status,
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      },
      // Include database subscription state for client sync
      dbSubscription: dbSubscription ? {
        plan: dbSubscription.plan,
        status: dbSubscription.status,
        scrapesUsed: dbSubscription.scrapes_used,
        scrapesLimit: dbSubscription.scrapes_limit,
        currentPeriodEnd: dbSubscription.current_period_end,
      } : null,
    });
  } catch (error: any) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
