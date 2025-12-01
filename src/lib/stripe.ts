import Stripe from "stripe";

// Use restricted key for better security, fallback to secret key for backwards compatibility
const getStripeKey = () => process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY;

// Lazy initialization to avoid build-time errors when env vars are not set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const stripeKey = getStripeKey();
    if (!stripeKey) {
      throw new Error("STRIPE_RESTRICTED_KEY is not set in environment variables");
    }
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Keep for backwards compatibility but use getStripe() for lazy loading
const stripeKey = getStripeKey();
export const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : (null as unknown as Stripe);

// Price IDs for each plan - loaded dynamically to ensure env vars are available
export function getStripePriceIds() {
  return {
    standard_monthly: process.env.STRIPE_STANDARD_PRICE_ID || "price_standard_monthly",
    pro_monthly: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
  };
}

// Plan configuration - use getStripePlan() for dynamic price ID loading
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    scrapeLimit: 20,
    priceId: null as string | null,
  },
  standard: {
    name: "Standard",
    price: 29,
    scrapeLimit: 500,
    priceId: null as string | null, // Will be set dynamically
  },
  pro: {
    name: "Pro",
    price: 79,
    scrapeLimit: 1000,
    priceId: null as string | null, // Will be set dynamically
  },
};

// Get plan with dynamically loaded price ID
export function getStripePlan(planId: "free" | "standard" | "pro") {
  const priceIds = getStripePriceIds();
  const plan = { ...STRIPE_PLANS[planId] };

  if (planId === "standard") {
    plan.priceId = priceIds.standard_monthly;
  } else if (planId === "pro") {
    plan.priceId = priceIds.pro_monthly;
  }

  return plan;
}

export type StripePlanId = keyof typeof STRIPE_PLANS;
