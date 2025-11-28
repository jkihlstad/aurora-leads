import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    // Cast to any to bypass strict typing
    const db = adminSupabase as any;

    // Check if profile exists
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await db.from("profiles").insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Check if subscription exists
    const { data: existingSubscription } = await db
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingSubscription) {
      // Create free subscription
      const { data: newSubscription, error: subError } = await db
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "free",
          status: "active",
          scrapes_limit: 20,
          scrapes_used: 0,
        })
        .select()
        .single();

      if (subError) {
        console.error("Error creating subscription:", subError);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        created: true,
        subscription: newSubscription,
      });
    }

    return NextResponse.json({
      success: true,
      created: false,
      subscription: existingSubscription,
    });
  } catch (error: any) {
    console.error("Profile init error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize profile" },
      { status: 500 }
    );
  }
}
