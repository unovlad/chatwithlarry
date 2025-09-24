"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plane,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Building,
  Calendar,
  Route,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  incrementGuestTurbulenceCount,
  getGuestSession,
  getRemainingTurbulenceRequests,
} from "@/lib/guestStorage";
import { AuthModal } from "@/components/auth/AuthModal";

interface TurbulenceForecast {
  flightNumber: string;
  route: {
    from: string;
    to: string;
  };
  severity: "smooth" | "light" | "moderate" | "severe";
  forecast: Array<{
    segment: string;
    severity: "smooth" | "light" | "moderate" | "severe";
    altitude: string;
    probability: number;
  }>;
  lastUpdated: string;
  flightInfo: {
    airline: {
      name: string;
      iata: string;
      icao: string;
    };
    aircraft: {
      registration: string;
      model: string;
    };
    status: string;
    distance: {
      km: number;
      miles: number;
      nm: number;
    };
    schedule: {
      departure: {
        airport: string;
        scheduled: string;
        terminal?: string;
        gate?: string;
      };
      arrival: {
        airport: string;
        scheduled: string;
        terminal?: string;
      };
    };
    lastUpdated: string;
  };
  dataSource: {
    flightRoute: "real" | "aerodatabox" | "none";
    turbulenceReports: "real" | "none";
    pirepsCount: number;
    aviationStackAvailable: boolean;
    aerodataboxAvailable: boolean;
  };
}

interface ForecastDisplayProps {
  flightNumber: string;
}

export function ForecastDisplay({ flightNumber }: ForecastDisplayProps) {
  const [forecast, setForecast] = useState<TurbulenceForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const { user, canSendMessage, incrementTurbulenceCount } = useAuth();

  // Check if user can make turbulence request
  const canMakeRequest = useCallback((): boolean => {
    if (!isHydrated) return false;

    if (user) {
      // Authenticated user - check if they have enough tokens (requires 3)
      return canSendMessage();
    } else {
      // Guest user - check if they have remaining turbulence requests
      const guestSession = getGuestSession();
      return guestSession.canSendTurbulenceRequest;
    }
  }, [isHydrated, user, canSendMessage]);

  const fetchFullForecast = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/turbulence?flightNumber=${flightNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error fetching full forecast");
      }

      const fullData = await response.json();
      setForecast(fullData);
    } catch (err) {
      console.error("Error fetching full forecast:", err);
    } finally {
      setIsLoadingFull(false);
    }
  }, [flightNumber]);

  // Initialize hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Reset fetch state when flightNumber changes
    setHasFetched(false);
    setForecast(null);
    setError("");
    setAuthChecked(false);
  }, [flightNumber]);

  // Check authorization after hydration
  useEffect(() => {
    if (isHydrated && !authChecked) {
      console.log(`🔐 Checking authorization for forecast ${flightNumber}:`, {
        user: user ? "authenticated" : "guest",
        canMakeRequest: canMakeRequest(),
        isHydrated,
      });

      if (!canMakeRequest()) {
        // User doesn't have permission to make request
        if (!user) {
          // Guest user - show auth modal
          console.log(
            `🚫 Guest user limit reached for ${flightNumber}, showing auth modal`,
          );
          setShowAuthModal(true);
          setIsLoading(false);
        } else {
          // Authenticated user - show upgrade message
          console.log(
            `🚫 Authenticated user limit reached for ${flightNumber}`,
          );
          setError(
            "You've reached the limit of messages. Please upgrade your plan to continue.",
          );
          setIsLoading(false);
        }
      } else {
        // User can make request, proceed with fetch
        console.log(
          `✅ User authorized for ${flightNumber}, proceeding with fetch`,
        );
        setAuthChecked(true);
      }
    }
  }, [isHydrated, authChecked, user, canMakeRequest, flightNumber]);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        console.log(`🚀 Starting forecast fetch for ${flightNumber}...`);
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/turbulence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ flightNumber }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log(`❌ API Error for ${flightNumber}:`, {
            status: response.status,
            errorData,
          });

          // Handle different types of errors
          if (response.status === 400) {
            // Validation error
            if (errorData.details && Array.isArray(errorData.details)) {
              const validationErrors = errorData.details;
              const hasLengthError = validationErrors.some(
                (err: any) => err.code === "too_big",
              );
              const hasFormatError = validationErrors.some(
                (err: any) => err.code === "invalid_string",
              );

              if (hasLengthError || hasFormatError) {
                throw new Error("INVALID_FLIGHT_FORMAT");
              }
            }
            throw new Error("VALIDATION_ERROR");
          } else if (response.status === 404) {
            throw new Error("FLIGHT_NOT_FOUND");
          } else if (response.status === 422) {
            throw new Error("ROUTE_DATA_INCOMPLETE");
          } else if (response.status >= 500) {
            throw new Error("SERVER_ERROR");
          }

          throw new Error(errorData.error || "Unknown error");
        }

        const data = await response.json();
        console.log(`✅ Forecast data received for ${flightNumber}:`, {
          loading: data.loading,
          hasForecast: !!data.forecast,
          severity: data.severity,
        });
        setForecast(data);

        // If basic forecast is loading, fetch full forecast
        if (data.loading) {
          console.log(
            `⏳ Basic forecast loaded, fetching full forecast for ${flightNumber}...`,
          );
          setIsLoadingFull(true);
          // Delay to avoid immediate GET request
          setTimeout(() => {
            fetchFullForecast();
          }, 1000);
        }

        // Only increment counter on successful API response
        if (!user) {
          // Guest user - increment turbulence requests counter
          console.log(
            `📊 Incrementing guest turbulence count for ${flightNumber}...`,
          );
          const success = incrementGuestTurbulenceCount();
          if (!success) {
            console.warn("Failed to increment guest turbulence count");
          } else {
            console.log(`✅ Guest turbulence count incremented successfully`);
          }
        } else {
          // Authenticated user - spend 3 tokens
          console.log(
            `📊 Spending 3 tokens for authenticated user on ${flightNumber}...`,
          );
          try {
            await incrementTurbulenceCount();
            console.log(`✅ Tokens deducted successfully`);
          } catch (error) {
            console.error("Error incrementing turbulence count:", error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (flightNumber && !hasFetched && authChecked && canMakeRequest()) {
      fetchForecast();
      setHasFetched(true);
    }
  }, [
    flightNumber,
    user,
    incrementTurbulenceCount,
    hasFetched,
    authChecked,
    canMakeRequest,
    fetchFullForecast,
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "smooth":
        return "text-green-600 bg-green-100";
      case "light":
        return "text-yellow-600 bg-yellow-100";
      case "moderate":
        return "text-orange-600 bg-orange-100";
      case "severe":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "smooth":
        return "Smooth";
      case "light":
        return "Light Turbulence";
      case "moderate":
        return "Moderate Turbulence";
      case "severe":
        return "Severe Turbulence";
      default:
        return "Unknown";
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    // Redirect to turbulence form
    router.push("/turbulence");
  };

  const getErrorMessage = (
    error: string,
  ): { title: string; message: string; type: "error" | "warning" | "info" } => {
    switch (error) {
      case "INVALID_FLIGHT_FORMAT":
        return {
          title: "Invalid Flight Number",
          message:
            "Please enter a valid flight number (e.g., AA100, DL456). Flight numbers should be 2-3 letters followed by 1-4 numbers.",
          type: "warning",
        };
      case "FLIGHT_NOT_FOUND":
        return {
          title: "Flight Not Found",
          message: `Flight ${flightNumber} was not found. Please check the flight number and try again. Make sure it's a real flight that's currently active.`,
          type: "info",
        };
      case "ROUTE_DATA_INCOMPLETE":
        return {
          title: "Route Data Unavailable",
          message:
            "We couldn't get complete route information for this flight. This might be a charter flight or the route data is not available.",
          type: "info",
        };
      case "SERVER_ERROR":
        return {
          title: "Service Temporarily Unavailable",
          message:
            "Our turbulence service is temporarily unavailable. Please try again in a few minutes.",
          type: "error",
        };
      case "VALIDATION_ERROR":
        return {
          title: "Invalid Request",
          message:
            "The flight number format is not valid. Please enter a proper flight number.",
          type: "warning",
        };
      default:
        if (error.includes("limit") || error.includes("upgrade")) {
          return {
            title: "Limit Reached",
            message: error,
            type: "warning",
          };
        }
        return {
          title: "Error",
          message: error || "An unexpected error occurred. Please try again.",
          type: "error",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">
          Getting forecast for flight {flightNumber}...
        </h2>
        {isHydrated && (
          <div className="mt-4 text-sm text-gray-600">
            {user ? (
              <p>Using 3 tokens from your plan</p>
            ) : (
              <p>Using your 1 free turbulence request</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const errorInfo = getErrorMessage(error);
    const isLimitError =
      errorInfo.type === "warning" && error.includes("limit");

    // Icon and colors based on error type
    const getIconAndColors = () => {
      switch (errorInfo.type) {
        case "warning":
          return {
            icon: (
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            ),
            titleClass: "text-xl text-orange-600",
            bgClass: "bg-orange-50 border-orange-200",
            textClass: "text-orange-700",
          };
        case "info":
          return {
            icon: <Info className="w-12 h-12 mx-auto mb-4 text-blue-500" />,
            titleClass: "text-xl text-blue-600",
            bgClass: "bg-blue-50 border-blue-200",
            textClass: "text-blue-700",
          };
        default:
          return {
            icon: (
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            ),
            titleClass: "text-xl text-red-600",
            bgClass: "bg-red-50 border-red-200",
            textClass: "text-red-700",
          };
      }
    };

    const { icon, titleClass, bgClass, textClass } = getIconAndColors();

    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          {icon}
          <CardTitle className={titleClass}>{errorInfo.title}</CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Flight format help for validation errors */}
          {(error === "INVALID_FLIGHT_FORMAT" ||
            error === "VALIDATION_ERROR") && (
            <div className={`p-4 border rounded-lg ${bgClass}`}>
              <p className={`text-sm ${textClass} mb-2 font-medium`}>
                Valid flight number examples:
              </p>
              <div className={`text-sm ${textClass} space-y-1`}>
                <div>• AA100 (American Airlines)</div>
                <div>• DL456 (Delta)</div>
                <div>• UA2457 (United)</div>
                <div>• BA212 (British Airways)</div>
              </div>
            </div>
          )}

          {/* Limit error actions */}
          {isLimitError && !user && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-3">
                Sign up to get unlimited turbulence forecasts and more features!
              </p>
              <Button
                onClick={() => router.push("/auth")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign Up Now
              </Button>
            </div>
          )}
          {isLimitError && user && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 mb-3">
                Upgrade your plan to continue using turbulence forecasts!
              </p>
              <Button
                onClick={() => router.push("/plans")}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Upgrade Plan
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/forecast")} variant="outline">
              Try Another Flight
            </Button>
            {error === "FLIGHT_NOT_FOUND" && (
              <Button
                onClick={() =>
                  window.open("https://www.flightradar24.com", "_blank")
                }
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                Check Flight Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return null;
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Turbulence Forecast
      </h1>
      {/* Flight Info */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12  rounded-full flex items-center justify-center">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Flight {forecast.flightNumber}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {forecast.route.from} → {forecast.route.to}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Flight Timeline */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                {/* Departure */}
                <div className="flex-1 text-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {forecast.route.from}
                  </div>
                  <div className="text-sm font-medium text-gray-800 mt-1">
                    {forecast.flightInfo.schedule.departure.airport}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {forecast.flightInfo.schedule.departure.scheduled !==
                    "Unknown"
                      ? new Date(
                          forecast.flightInfo.schedule.departure.scheduled,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date TBD"}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {forecast.flightInfo.schedule.departure.scheduled !==
                    "Unknown"
                      ? new Date(
                          forecast.flightInfo.schedule.departure.scheduled,
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Time TBD"}
                  </div>
                  {forecast.flightInfo.schedule.departure.terminal && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      Gate {forecast.flightInfo.schedule.departure.terminal}
                    </div>
                  )}
                </div>

                {/* Timeline Line */}
                <div className="flex-1 mx-4 relative hiddenx sm:block">
                  <div className="h-0.5 bg-green-400 w-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-green-400 rounded-full p-1">
                    <Plane className="w-3 h-3 text-green-600" />
                  </div>
                </div>

                {/* Arrival */}
                <div className="flex-1 text-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {forecast.route.to}
                  </div>
                  <div className="text-sm font-medium text-gray-800 mt-1">
                    {forecast.flightInfo.schedule.arrival.airport}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {forecast.flightInfo.schedule.arrival.scheduled !==
                    "Unknown"
                      ? new Date(
                          forecast.flightInfo.schedule.arrival.scheduled,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date TBD"}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {forecast.flightInfo.schedule.arrival.scheduled !==
                    "Unknown"
                      ? new Date(
                          forecast.flightInfo.schedule.arrival.scheduled,
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Time TBD"}
                  </div>
                  {forecast.flightInfo.schedule.arrival.terminal && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Terminal {forecast.flightInfo.schedule.arrival.terminal}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Travel Time */}
              {forecast.flightInfo.distance.km > 0 && (
                <div className="text-center mt-4">
                  <div className="text-sm font-semibold text-gray-700">
                    Total Travel Time:{" "}
                    {Math.round(forecast.flightInfo.distance.km / 800)}h{" "}
                    {Math.round(
                      ((forecast.flightInfo.distance.km / 800) % 1) * 60,
                    )}
                    m
                  </div>
                </div>
              )}
            </div>

            {/* Main Flight Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Airline Info */}
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {forecast.flightInfo.airline.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {forecast.flightInfo.airline.iata} /{" "}
                    {forecast.flightInfo.airline.icao}
                  </p>
                </div>
              </div>

              {/* Aircraft Info */}
              <div className="flex items-center space-x-3">
                <Plane className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {forecast.flightInfo.aircraft.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {forecast.flightInfo.aircraft.registration}
                  </p>
                </div>
              </div>

              {/* Distance */}

              {forecast.flightInfo.distance.km > 0 && (
                <div className="flex items-center space-x-3">
                  <Route className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {forecast.flightInfo.distance.miles.toLocaleString()}{" "}
                      miles
                    </p>
                    <p className="text-xs text-gray-500">
                      {forecast.flightInfo.distance.km.toLocaleString()} km
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Segments */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detailed Forecast by Segments</CardTitle>
          <CardDescription>
            Turbulence forecast for each part of the route
            {isLoadingFull && (
              <div className="flex items-center mt-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading detailed analysis...
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecast.forecast.map((segment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-lg">{segment.segment}</h4>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(segment.severity)}`}
                  >
                    {getSeverityText(segment.severity)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4" />
                    <span>Altitude: {segment.altitude}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Try Again Button */}
      <div className="text-center mt-6">
        <Button
          onClick={() => router.push("/turbulence")}
          variant="outline"
          className="px-8 py-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold"
        >
          Try Another Flight
        </Button>
      </div>

      {/* Auth Modal for guest users */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        defaultMode="signup"
      />
    </>
  );
}
