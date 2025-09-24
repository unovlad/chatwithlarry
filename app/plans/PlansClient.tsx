"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PricingCard } from "@/components/ui/pricing-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabaseClient";
import { Footer } from "@/components/Footer";
import type { User } from "@/types/user";

interface PlansClientProps {
  user: User;
}

export default function PlansClient({ user }: PlansClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "premium">(
    user.subscription_plan as "free" | "premium",
  );
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    user.subscription_end_date || null,
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>(
    user.subscription_status || "active",
  );
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  // Calculate days until subscription expires
  useEffect(() => {
    if (subscriptionEndDate) {
      const endDate = new Date(subscriptionEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays > 0 ? diffDays : 0);
    }
  }, [subscriptionEndDate]);

  // Update profile every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      async () => {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("users")
          .select(
            "subscription_plan, subscription_end_date, subscription_status",
          )
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserPlan(profile.subscription_plan);
          setSubscriptionEndDate(profile.subscription_end_date);
          setSubscriptionStatus(profile.subscription_status);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [user.id]);

  const handlePremiumSubscribe = () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "premium",
            user_id: user.id,
            user_email: user.email,
          }),
        });

        const data = await response.json();

        if (data.error) {
          console.error(data.error);
          toast.error("Payment failed. Please try again.");
          setIsErrorModalOpen(true);
          setIsLoading(false);
        } else if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error(error);
        toast.error("Payment failed. Please try again.");
        setIsErrorModalOpen(true);
        setIsLoading(false);
      }
    });
  };

  // Handle URL parameters after payment
  useEffect(() => {
    const success = searchParams.get("success");
    const plan = searchParams.get("plan");

    if (success === "true" && plan) {
      toast.success(`Payment successful! Welcome to ${plan} plan.`);
      setIsSuccessModalOpen(true);

      // Update user profile after successful payment
      const updateProfile = async () => {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("users")
          .select(
            "subscription_plan, subscription_end_date, subscription_status",
          )
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserPlan(profile.subscription_plan);
          setSubscriptionEndDate(profile.subscription_end_date);
          setSubscriptionStatus(profile.subscription_status);
        }
      };

      updateProfile();
    }
  }, [searchParams, user.id]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* Current Plan Status */}
          {userPlan === "premium" && (
            <div
              className={`mb-6 sm:mb-8 p-4 sm:p-6 border rounded-lg ${
                subscriptionStatus === "cancelled"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3
                    className={`text-base sm:text-lg font-semibold mb-2 ${
                      subscriptionStatus === "cancelled"
                        ? "text-orange-900"
                        : "text-blue-900"
                    }`}
                  >
                    Current Plan: Premium
                    {subscriptionStatus === "cancelled" && " (Cancelled)"}
                  </h3>
                  {daysLeft !== null && subscriptionStatus !== "cancelled" && (
                    <p className="text-sm sm:text-base text-blue-700">
                      {daysLeft > 0
                        ? `${daysLeft} days remaining in your subscription`
                        : "Your subscription has expired"}
                    </p>
                  )}
                  {subscriptionStatus === "cancelled" &&
                    subscriptionEndDate && (
                      <p className="text-sm sm:text-base text-orange-700">
                        Your subscription will end on{" "}
                        {new Date(subscriptionEndDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  {subscriptionEndDate &&
                    subscriptionStatus !== "cancelled" && (
                      <p className="text-xs sm:text-sm text-blue-600 mt-1">
                        Next billing:{" "}
                        {new Date(subscriptionEndDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        "/api/stripe/customer-portal",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        },
                      );

                      const data = await response.json();

                      if (data.error) {
                        console.error(data.error);
                        toast.error("Failed to open customer portal");
                      } else if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      console.error(error);
                      toast.error("Failed to open customer portal");
                    }
                  }}
                  variant="outline"
                  className=""
                >
                  {subscriptionStatus === "cancelled"
                    ? "Reactivate Subscription"
                    : "Manage Subscription"}
                </Button>
              </div>
            </div>
          )}

          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Choose your plan
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Unlock the full potential of Larry AI with our premium features
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for getting started"
              features={["30 messages per month", "Basic chat functionality"]}
              cta={userPlan === "free" ? "Current Plan" : "Free"}
              active={userPlan === "free"}
              onClick={() => {}}
            />

            <PricingCard
              name="Premium"
              price="$9"
              period="month"
              description="For power users and professionals"
              features={[
                "Unlimited messages",
                "Unlimited Turbulence Forecasts",
                "Advanced AI capabilities",
                "Priority response time",
              ]}
              cta={
                isLoading
                  ? "Processing..."
                  : userPlan === "premium"
                    ? "Current Plan"
                    : "Upgrade to Premium"
              }
              active={userPlan === "premium"}
              popular={true}
              onClick={
                userPlan === "premium"
                  ? undefined
                  : isLoading
                    ? undefined
                    : handlePremiumSubscribe
              }
            />
          </div>

          {/* FAQ Section */}
          <div className="mt-12 sm:mt-16 max-w-3xl mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  What happens to my data if I cancel?
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Your data remains safe and accessible. You can export your
                  conversations before canceling, and your account will remain
                  active until the end of your billing period.
                </p>
              </div>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately, and we&apos;ll prorate any
                  differences.
                </p>
              </div>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  The free plan gives you 30 messages per month to try out our
                  service. No credit card required to get started!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer fixed marginTop={false} />

      {/* Error Modal */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="mx-4 sm:mx-0 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Payment Failed
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Something went wrong with the payment. Please try again or contact
              support if the problem persists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => router.push("/chat")}
              className="w-full sm:w-auto"
            >
              Go to Chat
            </Button>
            <Button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="mx-4 sm:mx-0 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Welcome to Premium!
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Your subscription has been activated. You now have access to all
              premium features including unlimited messages and advanced AI
              capabilities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => router.push("/chat")}
              className="w-full sm:w-auto"
            >
              Start Chatting
            </Button>
            <Button
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.replace("/plans");
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
