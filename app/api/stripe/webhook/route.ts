import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = await createClient();

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userid;
        const plan = session.metadata?.plan;

        console.log("Checkout session completed:", {
          sessionId: session.id,
          userId,
          plan,
          mode: session.mode,
        });

        if (userId && plan === "premium") {
          // Get subscription ID
          const subscriptionId = session.subscription as string;

          if (subscriptionId) {
            // Get subscription details
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const currentPeriodEnd = new Date(
              (subscription as any).current_period_end * 1000,
            );

            // Update user profile
            await supabase
              .from("users")
              .update({
                subscription_plan: "premium",
                subscription_status: "active",
                stripe_subscription_id: subscriptionId,
                subscription_start_date: new Date().toISOString(),
                subscription_end_date: currentPeriodEnd.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);

            console.log("Updated user subscription:", userId);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          // Get subscription details
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = new Date(
            (subscription as any).current_period_end * 1000,
          );

          // Update subscription end date
          await supabase
            .from("users")
            .update({
              subscription_status: "active",
              subscription_end_date: currentPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          console.log("Updated subscription period:", subscriptionId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          // Mark subscription as inactive
          await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          console.log("Marked subscription as past due:", subscriptionId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Return user to free plan
        await supabase
          .from("users")
          .update({
            subscription_plan: "free",
            subscription_status: "cancelled",
            subscription_end_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        console.log("Cancelled subscription:", subscriptionId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = new Date(
          (subscription as any).current_period_end * 1000,
        );

        // Update subscription status
        await supabase
          .from("users")
          .update({
            subscription_status:
              subscription.status === "active" ? "active" : "inactive",
            subscription_end_date: currentPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        console.log(
          "Updated subscription:",
          subscriptionId,
          subscription.status,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
