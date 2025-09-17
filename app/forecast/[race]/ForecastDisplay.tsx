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
  const router = useRouter();

  const fetchForecast = useCallback(async () => {
    try {
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
        throw new Error(errorData.error || "Error fetching forecast");
      }

      const data = await response.json();
      setForecast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [flightNumber]);

  useEffect(() => {
    if (flightNumber) {
      fetchForecast();
    }
  }, [flightNumber, fetchForecast]);

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

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">
          Getting forecast for flight {flightNumber}...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-xl text-red-600">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/turbulence")} variant="outline">
            Back to Form
          </Button>
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
                <div className="flex-1 mx-4 relative">
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
    </>
  );
}
