import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { createClient } from "@/lib/supabase/server";

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// State abbreviation extraction from address
const US_STATES: { [key: string]: string } = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

const STATE_ABBRS = Object.values(US_STATES);

function extractStateFromAddress(address: string): string | undefined {
  if (!address) return undefined;

  // Try to find state abbreviation pattern (e.g., ", CA " or ", CA,")
  const abbrMatch = address.match(/,\s*([A-Z]{2})(?:\s|,|$)/);
  if (abbrMatch && STATE_ABBRS.includes(abbrMatch[1])) {
    return abbrMatch[1];
  }

  // Try to find full state name
  for (const [stateName, abbr] of Object.entries(US_STATES)) {
    if (address.toLowerCase().includes(stateName.toLowerCase())) {
      return abbr;
    }
  }

  return undefined;
}

function extractCityFromAddress(address: string): string | undefined {
  if (!address) return undefined;

  // Try to extract city (usually before state abbreviation)
  const parts = address.split(",");
  if (parts.length >= 2) {
    // City is typically the second-to-last part before state
    const cityPart = parts[parts.length - 2]?.trim();
    if (cityPart && !cityPart.match(/^\d/)) {
      return cityPart;
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to scrape leads." },
        { status: 401 }
      );
    }

    // Check subscription limits
    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .select("scrapes_used, scrapes_limit, status")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscriptionData) {
      console.error("Error fetching subscription:", subError);
      return NextResponse.json(
        { error: "Unable to verify subscription. Please try again." },
        { status: 500 }
      );
    }

    const subscription = subscriptionData as {
      scrapes_used: number;
      scrapes_limit: number;
      status: string;
    };

    const body = await request.json();
    const {
      query,
      location,
      limit = 20,
      country = "us",
      lang = "en",
      zoom = "13",
    } = body;

    // Validate limit (max 500)
    const validatedLimit = Math.min(Math.max(1, limit), 500);

    // Check if user has enough scrapes remaining
    const remainingScrapes = subscription.scrapes_limit - subscription.scrapes_used;
    if (remainingScrapes < validatedLimit) {
      return NextResponse.json(
        {
          error: `Insufficient scrapes. You have ${remainingScrapes} scrapes remaining. ` +
                 `Please reduce your limit or upgrade your plan.`
        },
        { status: 403 }
      );
    }

    // Check if subscription is active
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        { error: "Your subscription is not active. Please update your payment method." },
        { status: 403 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Prepare Apify Actor input matching the API documentation
    // All parameters as per: query, location, limit, country, lang, zoom (string)
    const actorInput: Record<string, unknown> = {
      query: query,
      location: location,
      limit: validatedLimit,
      country: country,
      lang: lang,
      zoom: String(zoom),
    };

    console.log("Starting Apify scrape with input:", JSON.stringify(actorInput, null, 2));

    // Run the actor and wait for it to finish
    // Using Google Maps Search Scraper by powerai
    // https://apify.com/powerai/google-map-search-scraper
    const run = await client
      .actor("powerai/google-map-search-scraper")
      .call(actorInput);

    console.log("Scrape finished. Run ID:", run.id);
    console.log("Fetching results from dataset:", run.defaultDatasetId);

    // Fetch results from the run's default dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`Retrieved ${items.length} results`);

    // Map Google Maps data to our UI's expected format with ALL fields
    const mappedResults = items.map((item: any, index: number) => {
      // Extract email from various possible locations
      let email = "N/A";
      if (item.email) {
        email = item.email;
      } else if (item.emails && item.emails.length > 0) {
        email = item.emails[0];
      }

      // Get address string - using full_address from new API
      const addressStr = item.full_address || item.address || "";

      // Extract location data - city is now directly available
      const state = extractStateFromAddress(addressStr) || item.state;
      const city = item.city || extractCityFromAddress(addressStr);

      // Get phone number from new API
      const phone = item.phone_number || item.phone || undefined;

      // Determine status based on data completeness
      let status: "success" | "warning" | "error" = "warning";
      if (item.website && email !== "N/A" && phone) {
        status = "success";
      } else if (!item.website && email === "N/A" && !phone) {
        status = "error";
      }

      // Extract types/categories - keep as array
      const typesArray = Array.isArray(item.types) ? item.types : [];
      const categories = typesArray.length > 0 ? typesArray.join(", ") : "N/A";

      return {
        id: index,
        // Core Business Info
        business_id: item.business_id || undefined,
        place_id: item.place_id || undefined,
        name: item.name || "Unknown Business",

        // Contact Info
        phone: phone,
        phone_number: item.phone_number || undefined,
        email: email,
        website: item.website || undefined,
        linkedin: item.website || "#",

        // Location
        full_address: item.full_address || undefined,
        address: addressStr || undefined,
        city: city,
        state: state,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        timezone: item.timezone || undefined,

        // Business Details
        types: typesArray.length > 0 ? typesArray : undefined,
        category: categories !== "N/A" ? categories : undefined,
        company: categories || addressStr || "N/A",
        industry: categories !== "N/A" ? categories : undefined,
        price_level: item.price_level || undefined,

        // Ratings & Reviews
        rating: item.rating || undefined,
        review_count: item.review_count || undefined,
        reviewCount: item.review_count || undefined,

        // Verification
        is_claimed: item.is_claimed || false,
        verified: item.verified || item.is_claimed || email !== "N/A",

        // Links
        place_link: item.place_link || undefined,
        url: item.url || item.place_link || undefined,

        // Media & Hours
        photos: item.photos || undefined,
        working_hours: item.working_hours || undefined,
        description: item.description || undefined,

        // Meta
        status: status,
        scrapedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      data: mappedResults,
      meta: {
        total: mappedResults.length,
        runId: run.id,
        datasetId: run.defaultDatasetId,
      }
    });
  } catch (error: any) {
    console.error("Apify Error:", error);

    // Provide more detailed error messages
    let errorMessage = "An error occurred during scraping";
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.statusCode === 401) {
      errorMessage = "Invalid API token. Please check your APIFY_API_TOKEN in .env.local";
    }
    if (error.statusCode === 402) {
      errorMessage = "Insufficient Apify credits. Please add credits to your account.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.statusCode || 500 }
    );
  }
}
