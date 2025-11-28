import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Price IDs for each plan - these should be created in Stripe Dashboard
// and the IDs added to environment variables
export const STRIPE_PRICE_IDS = {
  standard_monthly: process.env.STRIPE_STANDARD_PRICE_ID || "price_standard_monthly",
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
};

// Plan configuration with Stripe price IDs
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    scrapeLimit: 20,
    priceId: null,
  },
  standard: {
    name: "Standard",
    price: 29,
    scrapeLimit: 500,
    priceId: STRIPE_PRICE_IDS.standard_monthly,
  },
  pro: {
    name: "Pro",
    price: 79,
    scrapeLimit: 1000,
    priceId: STRIPE_PRICE_IDS.pro_monthly,
  },
};

export type StripePlanId = keyof typeof STRIPE_PLANS;
