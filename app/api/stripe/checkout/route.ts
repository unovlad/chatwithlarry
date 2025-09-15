import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, user_id, user_email } = body;

    // Перевіряємо авторизацію
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let priceId: string;
    let mode: "subscription" | "payment" = "subscription";
    let successUrl: string;

    if (plan === "premium") {
      priceId = process.env.STRIPE_PREMIUM_PRICE_ID!;
      mode = "subscription";
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/plans?success=${plan}`;
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 500 },
      );
    }

    const sessionConfig: any = {
      success_url: successUrl,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
      mode: mode,
      payment_method_types: ["card"],
      metadata: {
        userid: user_id || user.id,
        plan: plan,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    };

    // Додаємо email користувача
    if (user_email || user.email) {
      sessionConfig.customer_email = user_email || user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("Created Stripe session:", {
      id: session.id,
      success_url: sessionConfig.success_url,
      mode: sessionConfig.mode,
      plan: plan,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    );
  }
}
