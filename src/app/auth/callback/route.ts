import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const supabase = await createClient();

  // Handle password recovery token
  if (type === "recovery" && token) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (!error) {
      return NextResponse.redirect(`${origin}/forgot-password`);
    }
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_token`);
  }

  // Handle OAuth and magic link code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Use admin client to bypass RLS for creating profile/subscription
        const adminSupabase = createAdminClient() as any;

        // Check if profile exists, if not create it
        const { data: existingProfile } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          // Create profile
          await adminSupabase.from("profiles").insert({
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          });
        }

        // Check if subscription exists, if not create free subscription
        const { data: existingSubscription } = await adminSupabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingSubscription) {
          // Create free subscription
          await adminSupabase.from("subscriptions").insert({
            user_id: user.id,
            plan: "free",
            status: "active",
            scrapes_limit: 20,
            scrapes_used: 0,
          });
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
