import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { sendSubscriptionConfirmationEmail } from "@/lib/emailService";
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

    const supabase = createServiceClient();

    console.log("Processing webhook event:", event.type, "Event ID:", event.id);

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
          customer: session.customer,
          metadata: session.metadata,
        });

        if (userId && plan === "premium") {
          // Get subscription ID
          const subscriptionId = session.subscription as string;

          console.log("Processing subscription:", {
            subscriptionId,
            userId,
            plan,
          });

          if (subscriptionId) {
            try {
              // Get subscription details
              const subscription =
                await stripe.subscriptions.retrieve(subscriptionId);

              console.log("Retrieved subscription:", {
                id: subscription.id,
                status: subscription.status,
                current_period_end: (subscription as any).current_period_end,
                current_period_start: (subscription as any)
                  .current_period_start,
              });

              const currentPeriodEnd = (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : null;

              // Update user profile
              const updateData: any = {
                subscription_plan: "premium",
                subscription_status: "active",
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: session.customer as string,
                subscription_start_date: new Date().toISOString(),
                messages_limit: 99999,
                updated_at: new Date().toISOString(),
              };

              if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
                updateData.subscription_end_date =
                  currentPeriodEnd.toISOString();
              }

              console.log("Updating user with data:", updateData);

              // First check if user exists
              const { data: existingUser, error: fetchError } = await supabase
                .from("users")
                .select("id, email, subscription_plan, full_name")
                .eq("id", userId)
                .single();

              if (fetchError) {
                console.error("Error fetching user:", fetchError);
                return NextResponse.json(
                  { error: "User not found" },
                  { status: 404 },
                );
              }

              console.log("Found user:", existingUser);

              const { data, error } = await supabase
                .from("users")
                .update(updateData)
                .eq("id", userId)
                .select();

              if (error) {
                console.error("Error updating user subscription:", error);
              } else {
                console.log("Successfully updated user subscription:", {
                  userId,
                  updatedRows: data?.length || 0,
                  data: data,
                });

                // Send confirmation email
                if (existingUser?.email) {
                  try {
                    const emailResult = await sendSubscriptionConfirmationEmail(
                      existingUser.email,
                      existingUser?.full_name || "User",
                      plan,
                    );

                    if (emailResult.success) {
                      console.log(
                        "Subscription confirmation email sent successfully",
                      );
                    } else {
                      console.error(
                        "Failed to send subscription confirmation email:",
                        emailResult.error,
                      );
                    }
                  } catch (emailError) {
                    console.error(
                      "Error sending subscription confirmation email:",
                      emailError,
                    );
                  }
                }
              }
            } catch (subscriptionError) {
              console.error(
                "Error retrieving subscription:",
                subscriptionError,
              );
            }
          } else {
            console.log("No subscription ID found in session");
          }
        } else {
          console.log("Missing userId or plan:", { userId, plan });
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
          const currentPeriodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : null;

          // Update subscription end date
          const updateData: any = {
            subscription_plan: "premium",
            subscription_status: "active",
            messages_limit: 99999,
            updated_at: new Date().toISOString(),
          };

          if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
            updateData.subscription_end_date = currentPeriodEnd.toISOString();
          }

          const { error } = await supabase
            .from("users")
            .update(updateData)
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating subscription period:", error);
          } else {
            console.log("Updated subscription period:", subscriptionId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          // Mark subscription as inactive
          const { error } = await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Error marking subscription as past due:", error);
          } else {
            console.log("Marked subscription as past due:", subscriptionId);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Return user to free plan
        const { error } = await supabase
          .from("users")
          .update({
            subscription_plan: "free",
            subscription_status: "cancelled",
            subscription_end_date: null,
            messages_limit: 30,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error cancelling subscription:", error);
        } else {
          console.log("Cancelled subscription:", subscriptionId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000)
          : null;

        // Update subscription status
        const updateData: any = {
          subscription_status:
            subscription.status === "active" ? "active" : "inactive",
          updated_at: new Date().toISOString(),
        };

        if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
          updateData.subscription_end_date = currentPeriodEnd.toISOString();
        }

        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(
            "Updated subscription:",
            subscriptionId,
            subscription.status,
          );
        }
        break;
      }

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        console.log("Customer created:", {
          customerId: customer.id,
          email: customer.email,
        });

        // If there is metadata with userid, update user
        if (customer.metadata?.userid) {
          const { error } = await supabase
            .from("users")
            .update({
              stripe_customer_id: customer.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", customer.metadata.userid);

          if (error) {
            console.error("Error updating user with customer ID:", error);
          } else {
            console.log(
              "Updated user with customer ID:",
              customer.metadata.userid,
            );
          }
        }
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
