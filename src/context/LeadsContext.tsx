"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export interface LeadData {
  id: string;
  // Core Business Info
  business_id?: string;
  place_id?: string;
  name: string;

  // Contact Info
  phone?: string;
  phone_number?: string;
  email: string;
  website?: string;
  linkedin?: string;

  // Location
  full_address?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;

  // Business Details
  types?: string[];
  category?: string;
  company?: string;
  industry?: string;
  price_level?: string;

  // Ratings & Reviews
  rating?: number;
  review_count?: number;
  reviewCount?: number;

  // Verification
  is_claimed?: boolean;
  verified?: boolean;

  // Links
  place_link?: string;
  url?: string;
  google_maps_link?: string;

  // Media & Hours
  photos?: string[] | Array<{src: string; max_size?: number[]; min_size?: number[]}>;
  working_hours?: string[] | any[] | Record<string, any>;
  description?: string | string[];

  // Meta
  status: "success" | "error" | "warning";
  scrape_query?: string;
  scrape_location?: string;
  scraped_at?: string;
  scrapedAt?: string;
}

interface LeadsContextType {
  leads: LeadData[];
  setLeads: (leads: LeadData[]) => void;
  addLeads: (newLeads: LeadData[], query?: string, location?: string) => Promise<void>;
  clearLeads: () => Promise<void>;
  deleteLeads: (ids: string[]) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshLeads: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      return;
    }

    const supabase = createClient();

    // First ensure profile exists (needed for RLS)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // Profile doesn't exist yet - try to initialize it
      try {
        await fetch("/api/profile/init", { method: "POST" });
      } catch (e) {
        console.log("Profile init in progress...");
      }
      // Return empty leads for now, will refresh after profile is created
      setLeads([]);
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("scraped_at", { ascending: false });

    if (error) {
      // Don't log error if it's just "no rows" - that's expected for new users
      if (error.code !== "PGRST116") {
        console.error("Error fetching leads:", error);
      }
      setLeads([]);
      return;
    }

    if (data) {
      const mappedLeads: LeadData[] = data.map((lead: any) => ({
        id: lead.id,
        business_id: lead.business_id,
        place_id: lead.place_id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || "",
        website: lead.website,
        full_address: lead.full_address,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postal_code: lead.postal_code,
        latitude: lead.latitude,
        longitude: lead.longitude,
        category: lead.category,
        types: lead.types,
        rating: lead.rating,
        review_count: lead.review_count,
        is_claimed: lead.is_claimed,
        verified: lead.verified,
        price_level: lead.price_level,
        working_hours: lead.working_hours,
        photos: lead.photos,
        description: lead.description,
        google_maps_link: lead.google_maps_link,
        status: lead.status,
        scrape_query: lead.scrape_query,
        scrape_location: lead.scrape_location,
        scraped_at: lead.scraped_at,
        scrapedAt: lead.scraped_at,
      }));
      setLeads(mappedLeads);
    }
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLeads = async (newLeads: LeadData[], query?: string, location?: string) => {
    if (!user) {
      // Fall back to local state for non-authenticated users
      setLeads((prev) => [...prev, ...newLeads]);
      return;
    }

    const supabase = createClient();

    // Map leads to database format
    const leadsToInsert = newLeads.map((lead, index) => ({
      user_id: user.id,
      business_id: lead.business_id,
      place_id: lead.place_id,
      name: lead.name,
      email: lead.email || null,
      phone: lead.phone || lead.phone_number || null,
      website: lead.website || null,
      full_address: lead.full_address || null,
      address: lead.address || null,
      city: lead.city || null,
      state: lead.state || null,
      country: lead.country || null,
      postal_code: lead.postal_code || null,
      latitude: lead.latitude || null,
      longitude: lead.longitude || null,
      category: lead.category || null,
      types: lead.types || null,
      rating: lead.rating || null,
      review_count: lead.review_count || lead.reviewCount || null,
      is_claimed: lead.is_claimed || null,
      verified: lead.verified || null,
      price_level: lead.price_level || null,
      working_hours: lead.working_hours || null,
      photos: Array.isArray(lead.photos)
        ? lead.photos.map(p => typeof p === 'string' ? p : p.src)
        : null,
      description: typeof lead.description === 'string'
        ? lead.description
        : Array.isArray(lead.description)
        ? lead.description.join(' ')
        : null,
      google_maps_link: lead.google_maps_link || lead.place_link || lead.url || null,
      status: lead.status,
      scrape_query: query || null,
      scrape_location: location || null,
      scraped_at: lead.scraped_at || lead.scrapedAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("leads")
      .insert(leadsToInsert as any)
      .select();

    if (error) {
      console.error("Error inserting leads:", error);
      // Fall back to local state on error
      setLeads((prev) => [...prev, ...newLeads]);
      return;
    }

    // Also record scrape history
    if (query && location) {
      await supabase.from("scrape_history").insert({
        user_id: user.id,
        query,
        location,
        results_count: newLeads.length,
      } as any);
    }

    // Refresh leads from database
    await fetchLeads();
  };

  const clearLeads = async () => {
    if (!user) {
      setLeads([]);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing leads:", error);
      return;
    }

    setLeads([]);
  };

  const deleteLeads = async (ids: string[]) => {
    if (!user) {
      setLeads((prev) => prev.filter((lead) => !ids.includes(lead.id)));
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("leads")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting leads:", error);
      return;
    }

    setLeads((prev) => prev.filter((lead) => !ids.includes(lead.id)));
  };

  const refreshLeads = async () => {
    setIsLoading(true);
    await fetchLeads();
    setIsLoading(false);
  };

  return (
    <LeadsContext.Provider
      value={{ leads, setLeads, addLeads, clearLeads, deleteLeads, isLoading, setIsLoading, refreshLeads }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
}
