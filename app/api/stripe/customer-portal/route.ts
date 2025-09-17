import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("stripe_customer_id, subscription_plan, subscription_status")
      .eq("id", user.id)
      .single();

    console.log("User profile for customer portal:", {
      userId: user.id,
      profile,
      profileError,
    });

    if (!profile || !profile.stripe_customer_id) {
      console.log("No stripe_customer_id found for user:", user.id);

      // If user has active subscription, create customer in Stripe
      if (
        profile?.subscription_plan === "premium" &&
        profile?.subscription_status === "active"
      ) {
        console.log("Creating Stripe customer for existing premium user");
        try {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userid: user.id,
            },
          });

          // Update user with customer ID
          const { error: updateError } = await supabase
            .from("users")
            .update({
              stripe_customer_id: customer.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating user with customer ID:", updateError);
            return NextResponse.json(
              { error: "Failed to create customer" },
              { status: 500 },
            );
          }

          console.log("Created and linked Stripe customer:", customer.id);

          // Use new customer ID
          const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
          });

          return NextResponse.json({ url: session.url });
        } catch (error) {
          console.error("Error creating Stripe customer:", error);
          return NextResponse.json(
            { error: "Failed to create customer" },
            { status: 500 },
          );
        }
      }

      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 },
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
