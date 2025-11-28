"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export type PlanType = "free" | "standard" | "pro";

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  scrapeLimit: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    scrapeLimit: 20,
    features: [
      "20 scrapes total",
      "Basic lead data",
      "CSV export",
      "Email support",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 29,
    scrapeLimit: 500,
    features: [
      "500 scrapes per month",
      "Full lead data with photos",
      "CSV & JSON export",
      "Priority email support",
      "Dashboard analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    scrapeLimit: 1000,
    features: [
      "1,000 scrapes per month",
      "Full lead data with photos",
      "CSV, JSON & API export",
      "24/7 priority support",
      "Advanced analytics",
      "API access",
      "Custom integrations",
    ],
  },
];

export interface SubscriptionData {
  currentPlan: PlanType;
  status: "active" | "canceled" | "past_due" | "trialing";
  scrapesUsed: number;
  scrapesLimit: number;
  billingCycle: "monthly" | "yearly";
  currentPeriodEnd: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
  } | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionData;
  loading: boolean;
  incrementScrapesUsed: (count: number) => Promise<void>;
  canScrape: (count: number) => boolean;
  getRemainingScapes: () => number;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const getDefaultSubscription = (): SubscriptionData => ({
  currentPlan: "free",
  status: "active",
  scrapesUsed: 0,
  scrapesLimit: 20,
  billingCycle: "monthly",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  paymentMethod: null,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>(getDefaultSubscription);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(getDefaultSubscription());
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      // No subscription found - try to create one via API
      console.log("No subscription found, initializing...");
      try {
        const response = await fetch("/api/profile/init", {
          method: "POST",
        });

        if (response.ok) {
          const result = await response.json();
          if (result.subscription) {
            const subData = result.subscription;
            setSubscription({
              currentPlan: subData.plan as PlanType,
              status: subData.status as SubscriptionData["status"],
              scrapesUsed: subData.scrapes_used,
              scrapesLimit: subData.scrapes_limit,
              billingCycle: subData.billing_cycle as "monthly" | "yearly",
              currentPeriodEnd: subData.current_period_end,
              stripeCustomerId: subData.stripe_customer_id || undefined,
              stripeSubscriptionId: subData.stripe_subscription_id || undefined,
              cancelAtPeriodEnd: subData.cancel_at_period_end,
              paymentMethod: subData.payment_method_brand && subData.payment_method_last4
                ? {
                    brand: subData.payment_method_brand,
                    last4: subData.payment_method_last4,
                  }
                : null,
            });
            setLoading(false);
            return;
          }
        }
      } catch (initError) {
        console.error("Error initializing subscription:", initError);
      }

      // Fallback to default if init fails
      setSubscription(getDefaultSubscription());
    } else if (data) {
      const subData = data as any;
      setSubscription({
        currentPlan: subData.plan as PlanType,
        status: subData.status as SubscriptionData["status"],
        scrapesUsed: subData.scrapes_used,
        scrapesLimit: subData.scrapes_limit,
        billingCycle: subData.billing_cycle as "monthly" | "yearly",
        currentPeriodEnd: subData.current_period_end,
        stripeCustomerId: subData.stripe_customer_id || undefined,
        stripeSubscriptionId: subData.stripe_subscription_id || undefined,
        cancelAtPeriodEnd: subData.cancel_at_period_end,
        paymentMethod: subData.payment_method_brand && subData.payment_method_last4
          ? {
              brand: subData.payment_method_brand,
              last4: subData.payment_method_last4,
            }
          : null,
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Set up real-time subscription updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as any;
          setSubscription({
            currentPlan: data.plan as PlanType,
            status: data.status as SubscriptionData["status"],
            scrapesUsed: data.scrapes_used,
            scrapesLimit: data.scrapes_limit,
            billingCycle: data.billing_cycle as "monthly" | "yearly",
            currentPeriodEnd: data.current_period_end,
            stripeCustomerId: data.stripe_customer_id || undefined,
            stripeSubscriptionId: data.stripe_subscription_id || undefined,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            paymentMethod: data.payment_method_brand && data.payment_method_last4
              ? {
                  brand: data.payment_method_brand,
                  last4: data.payment_method_last4,
                }
              : null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const incrementScrapesUsed = async (count: number) => {
    if (!user) return;

    const supabase = createClient() as any;
    const newCount = subscription.scrapesUsed + count;

    const { error } = await supabase
      .from("subscriptions")
      .update({ scrapes_used: newCount })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating scrapes used:", error);
    } else {
      setSubscription((prev) => ({
        ...prev,
        scrapesUsed: newCount,
      }));
    }
  };

  const canScrape = (count: number): boolean => {
    return subscription.scrapesUsed + count <= subscription.scrapesLimit;
  };

  const getRemainingScapes = (): number => {
    return Math.max(0, subscription.scrapesLimit - subscription.scrapesUsed);
  };

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        incrementScrapesUsed,
        canScrape,
        getRemainingScapes,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
