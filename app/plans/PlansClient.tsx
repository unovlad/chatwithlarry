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
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  // Розраховуємо дні до закінчення підписки
  useEffect(() => {
    if (subscriptionEndDate) {
      const endDate = new Date(subscriptionEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays > 0 ? diffDays : 0);
    }
  }, [subscriptionEndDate]);

  // Оновлюємо профіль кожні 5 хвилин
  useEffect(() => {
    const interval = setInterval(
      async () => {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("users")
          .select("subscription_plan, subscription_end_date")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserPlan(profile.subscription_plan);
          setSubscriptionEndDate(profile.subscription_end_date);
        }
      },
      5 * 60 * 1000,
    ); // 5 хвилин

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

  // Обробляємо параметри URL після оплати
  useEffect(() => {
    const success = searchParams.get("success");
    const plan = searchParams.get("plan");

    if (success === "true" && plan) {
      toast.success(`Payment successful! Welcome to ${plan} plan.`);
      setIsSuccessModalOpen(true);

      // Оновлюємо профіль користувача після успішної оплати
      const updateProfile = async () => {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("users")
          .select("subscription_plan, subscription_end_date")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserPlan(profile.subscription_plan);
          setSubscriptionEndDate(profile.subscription_end_date);
        }
      };

      updateProfile();
    }
  }, [searchParams, user.id]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Current Plan Status */}
          {userPlan === "premium" && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Current Plan: Premium
                  </h3>
                  {daysLeft !== null && (
                    <p className="text-blue-700">
                      {daysLeft > 0
                        ? `${daysLeft} days remaining in your subscription`
                        : "Your subscription has expired"}
                    </p>
                  )}
                  {subscriptionEndDate && (
                    <p className="text-sm text-blue-600 mt-1">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                >
                  Manage Subscription
                </Button>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose your plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock the full potential of Larry AI with our premium features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for getting started"
              features={["30 messages per month", "Basic chat functionality"]}
              cta={userPlan === "free" ? "Current Plan" : "Start Free"}
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
                "Advanced AI capabilities",
                "Priority response time",
                "Email support",
                "Advanced document processing",
                "Custom AI instructions",
                "Export conversations",
                "API access",
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
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  What happens to my data if I cancel?
                </h3>
                <p className="text-gray-600">
                  Your data remains safe and accessible. You can export your
                  conversations before canceling, and your account will remain
                  active until the end of your billing period.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately, and we&apos;ll prorate any
                  differences.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Failed</DialogTitle>
            <DialogDescription>
              Something went wrong with the payment. Please try again or contact
              support if the problem persists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push("/chat")}>
              Go to Chat
            </Button>
            <Button onClick={() => setIsErrorModalOpen(false)}>
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Welcome to Premium!</DialogTitle>
            <DialogDescription>
              Your subscription has been activated. You now have access to all
              premium features including unlimited messages and advanced AI
              capabilities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push("/chat")}>
              Start Chatting
            </Button>
            <Button
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.replace("/plans");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
