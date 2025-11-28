export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "standard" | "pro";
          status: "active" | "canceled" | "past_due" | "trialing";
          scrapes_used: number;
          scrapes_limit: number;
          billing_cycle: "monthly" | "yearly";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "standard" | "pro";
          status?: "active" | "canceled" | "past_due" | "trialing";
          scrapes_used?: number;
          scrapes_limit?: number;
          billing_cycle?: "monthly" | "yearly";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "standard" | "pro";
          status?: "active" | "canceled" | "past_due" | "trialing";
          scrapes_used?: number;
          scrapes_limit?: number;
          billing_cycle?: "monthly" | "yearly";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          business_id: string | null;
          place_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          website: string | null;
          full_address: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          category: string | null;
          types: string[] | null;
          rating: number | null;
          review_count: number | null;
          is_claimed: boolean | null;
          verified: boolean | null;
          price_level: string | null;
          working_hours: Json | null;
          photos: string[] | null;
          description: string | null;
          google_maps_link: string | null;
          status: "success" | "warning" | "error";
          scrape_query: string | null;
          scrape_location: string | null;
          scraped_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id?: string | null;
          place_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          full_address?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          category?: string | null;
          types?: string[] | null;
          rating?: number | null;
          review_count?: number | null;
          is_claimed?: boolean | null;
          verified?: boolean | null;
          price_level?: string | null;
          working_hours?: Json | null;
          photos?: string[] | null;
          description?: string | null;
          google_maps_link?: string | null;
          status?: "success" | "warning" | "error";
          scrape_query?: string | null;
          scrape_location?: string | null;
          scraped_at?: string;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          status?: "success" | "warning" | "error";
        };
      };
      scrape_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          location: string;
          results_count: number;
          country: string | null;
          language: string | null;
          apify_run_id: string | null;
          apify_dataset_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          location: string;
          results_count: number;
          country?: string | null;
          language?: string | null;
          apify_run_id?: string | null;
          apify_dataset_id?: string | null;
          created_at?: string;
        };
        Update: {
          results_count?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      plan_type: "free" | "standard" | "pro";
      subscription_status: "active" | "canceled" | "past_due" | "trialing";
      lead_status: "success" | "warning" | "error";
    };
  };
}
