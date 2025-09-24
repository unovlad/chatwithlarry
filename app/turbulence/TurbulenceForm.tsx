"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getGuestSession,
  incrementGuestTurbulenceCount,
  getRemainingTurbulenceRequests,
} from "@/lib/guestStorage";

export function TurbulenceForm() {
  const [flightNumber, setFlightNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const router = useRouter();
  const { user, canSendMessage, incrementTurbulenceCount } = useAuth();

  // Get remaining turbulence requests count for guests
  const guestRemainingTurbulenceRequests =
    isHydrated && !user ? getRemainingTurbulenceRequests() : 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const validateFlightNumber = (flightNum: string): string | null => {
    const trimmed = flightNum.trim().toUpperCase();

    if (!trimmed) {
      return "Please enter a flight number";
    }

    if (trimmed.length > 10) {
      return "Flight number is too long (maximum 10 characters)";
    }

    if (trimmed.length < 3) {
      return "Flight number is too short (minimum 3 characters)";
    }

    if (!/^[A-Z]{2,3}\d{1,4}$/.test(trimmed)) {
      return "Invalid flight number format. Use format like AA100, DL456, or UA2457";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasUserInteracted(true);

    const validationError = validateFlightNumber(flightNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check limits before processing request
    if (!user) {
      // Guest user - check 1 request limit
      const guestSession = getGuestSession();
      if (!guestSession.canSendTurbulenceRequest) {
        toast.error(
          "You've reached the limit of 1 turbulence request. Please sign up to continue.",
        );
        return;
      }
    } else {
      // Authenticated user - check message limit (requires 3 tokens)
      const canSend = canSendMessage();
      if (isHydrated && !canSend) {
        toast.error(
          "You've reached the limit of messages. Please upgrade your plan to continue.",
        );
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      // Redirect to forecast page - increment will happen only on successful API response
      router.push(
        `/forecast/${flightNumber
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")}`,
      );
    } catch (err) {
      setError("Error processing request");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="flightNumber"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Flight Number
        </label>
        <Input
          id="flightNumber"
          type="text"
          placeholder="e.g.  AA100, DL456"
          value={flightNumber}
          onChange={(e) => {
            const cleanValue = e.target.value
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "");
            setFlightNumber(cleanValue);

            // Clear error when user starts typing correctly
            if (error && cleanValue.length > 0) {
              const validationError = validateFlightNumber(cleanValue);
              if (!validationError) {
                setError("");
              }
            }
          }}
          className="text-center text-lg font-mono"
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-red-600 text-sm text-center">{error}</div>}

      {/* Guest limit message - only show after user interaction */}
      {isHydrated &&
        !user &&
        guestRemainingTurbulenceRequests === 0 &&
        hasUserInteracted && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700 text-center">
              You&apos;ve reached the limit of 1 turbulence request. Sign up to
              continue.
            </p>
          </div>
        )}

      {/* Authenticated user limit message */}
      {isHydrated && user && !canSendMessage() && hasUserInteracted && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700 text-center">
            You&apos;ve reached the limit of messages. Upgrade your plan to
            continue.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Get Forecast
          </>
        )}
      </Button>
    </form>
  );
}
