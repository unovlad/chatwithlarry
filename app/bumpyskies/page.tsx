"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plane, MapPin, Clock, Wind } from "lucide-react";

interface TurbulenceSegment {
  segmentId: string;
  startTime: string;
  endTime: string;
  condition: "calm" | "light" | "moderate" | "severe";
  duration: number;
  description: string;
  confidence: number;
  altitude: number;
}

interface BumpySkiesForecast {
  flight: string;
  route: string;
  departure: {
    airport: string;
    iata: string;
    time: string;
  };
  arrival: {
    airport: string;
    iata: string;
    time: string;
  };
  segments: TurbulenceSegment[];
  formatted_forecast: string[];
  data_sources: {
    weather: string;
    route: string;
    processing: string;
  };
  generated_at: string;
  service: string;
  disclaimer: string;
}

export default function BumpySkiesPage() {
  const [flightNumber, setFlightNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<BumpySkiesForecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flightNumber.trim()) {
      setError("Please enter a flight number");
      return;
    }

    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      const response = await fetch(
        `/api/bumpyskies?flight=${encodeURIComponent(flightNumber)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to fetch forecast",
        );
      }

      setForecast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTurbulenceColor = (condition: string) => {
    switch (condition) {
      case "calm":
        return "text-green-600 bg-green-50 border-green-200";
      case "light":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "moderate":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "severe":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTurbulenceIcon = (condition: string) => {
    switch (condition) {
      case "calm":
        return "😌";
      case "light":
        return "🌤️";
      case "moderate":
        return "🌪️";
      case "severe":
        return "⚡";
      default:
        return "❓";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Plane className="h-10 w-10 text-blue-600" />
            BumpySkies Clone
          </h1>
          <p className="text-lg text-gray-600">
            Turbulence forecast for your flight using NOAA weather data
          </p>
        </div>

        {/* Flight Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Flight Number</CardTitle>
            <CardDescription>
              Get turbulence forecast for your upcoming flight (e.g., JBU1290,
              AAL111)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                type="text"
                placeholder="Flight number (e.g., JBU1290)"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !flightNumber.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Get Forecast"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-600 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forecast Display */}
        {forecast && (
          <div className="space-y-6">
            {/* Flight Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  {forecast.flight} - {forecast.route}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Departure:</span>
                    <span>
                      {forecast.departure.iata} - {forecast.departure.airport}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({forecast.departure.time})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Arrival:</span>
                    <span>
                      {forecast.arrival.iata} - {forecast.arrival.airport}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({forecast.arrival.time})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Turbulence Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5" />
                  Turbulence Forecast
                </CardTitle>
                <CardDescription>
                  Forecast data from {forecast.data_sources.weather}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecast.formatted_forecast.map((line, index) => (
                    <div
                      key={index}
                      className="text-sm font-mono bg-gray-50 p-3 rounded border-l-4 border-blue-500"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Detailed Forecast Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {forecast.segments.map((segment, index) => (
                    <div
                      key={segment.segmentId}
                      className={`p-4 rounded-lg border-2 ${getTurbulenceColor(segment.condition)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getTurbulenceIcon(segment.condition)}
                          </span>
                          <div>
                            <div className="font-medium">
                              {segment.description}
                            </div>
                            <div className="text-sm opacity-75">
                              {segment.startTime} - {segment.endTime} (
                              {segment.duration} minutes)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.round(segment.confidence * 100)}% confidence
                          </div>
                          <div className="text-xs opacity-75">
                            {segment.altitude.toLocaleString()} ft
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-600">
                      Weather Data
                    </div>
                    <div>{forecast.data_sources.weather}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">
                      Flight Route
                    </div>
                    <div>{forecast.data_sources.route}</div>
                  </div>
                  <div>
                    <div className="font-medium text-purple-600">
                      Processing
                    </div>
                    <div>{forecast.data_sources.processing}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> {forecast.disclaimer}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Generated at:{" "}
                  {new Date(forecast.generated_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Example Usage */}
        {!forecast && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Try These Examples</CardTitle>
              <CardDescription>
                Click on any flight number below to see a sample forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  "JBU1290",
                  "AAL100",
                  "AAL111",
                  "UAL456",
                  "DAL789",
                  "SWA123",
                ].map((flight) => (
                  <Button
                    key={flight}
                    variant="outline"
                    size="sm"
                    onClick={() => setFlightNumber(flight)}
                    className="justify-start"
                  >
                    {flight}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
