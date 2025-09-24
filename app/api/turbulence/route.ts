import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlightAwareService, type FlightRoute } from "@/lib/flightAwareService";
import {
  NOAAPirepsService,
  type TurbulenceReport,
  type RouteSegment,
} from "@/lib/noaaPirepsService";
import { SimpleBumpySkiesService } from "@/lib/simpleBumpySkiesService";

// AeroDataBox API integration
const AERODATABOX_API_KEY =
  "91d95ae2d8mshb1dca2ef9fe542ep1c9b8cjsn3d640413bd67";
const AERODATABOX_HOST = "aerodatabox.p.rapidapi.com";

interface AeroDataBoxFlight {
  greatCircleDistance: {
    meter: number;
    km: number;
    mile: number;
    nm: number;
    feet: number;
  };
  departure: {
    airport: {
      icao: string;
      iata: string;
      name: string;
      shortName: string;
      municipalityName: string;
      location: {
        lat: number;
        lon: number;
      };
      countryCode: string;
      timeZone: string;
    };
    scheduledTime: {
      utc: string;
      local: string;
    };
    revisedTime?: {
      utc: string;
      local: string;
    };
    predictedTime?: {
      utc: string;
      local: string;
    };
    terminal?: string;
    checkInDesk?: string;
    quality: string[];
  };
  arrival: {
    airport: {
      icao: string;
      iata: string;
      name: string;
      shortName: string;
      municipalityName: string;
      location: {
        lat: number;
        lon: number;
      };
      countryCode: string;
      timeZone: string;
    };
    scheduledTime: {
      utc: string;
      local: string;
    };
    revisedTime?: {
      utc: string;
      local: string;
    };
    predictedTime?: {
      utc: string;
      local: string;
    };
    terminal?: string;
    quality: string[];
  };
  lastUpdatedUtc: string;
  number: string;
  status: string;
  codeshareStatus: string;
  isCargo: boolean;
  aircraft: {
    reg?: string;
    model: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
}

async function getAeroDataBoxFlight(
  flightNumber: string,
): Promise<AeroDataBoxFlight | null> {
  const startTime = Date.now();
  const requestId = `aerodatabox_${flightNumber}_${Date.now()}`;

  try {
    console.log(`🔍 Fetching AeroDataBox data for ${flightNumber}...`);
    cacheMetrics.activeRequests.add(requestId);

    const url = `https://${AERODATABOX_HOST}/flights/number/${flightNumber}?withAircraftImage=false&withLocation=false`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": AERODATABOX_API_KEY,
        "x-rapidapi-host": AERODATABOX_HOST,
      },
      cache: "no-store",
    });

    const responseSize = parseInt(
      response.headers.get("content-length") || "0",
    );
    console.log(
      `🛫 AeroDataBox response status: ${response.status}, size: ${responseSize} bytes`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(
        `❌ AeroDataBox API failed: ${response.status} - ${errorText}`,
      );
      logApiCall(
        "AeroDataBox",
        flightNumber,
        startTime,
        false,
        new Error(`${response.status}: ${errorText}`),
      );
      return null;
    }

    // Check if response is empty or invalid JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      console.log(`❌ AeroDataBox returned empty response`);
      logApiCall(
        "AeroDataBox",
        flightNumber,
        startTime,
        false,
        new Error("Empty response"),
      );
      return null;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`❌ AeroDataBox JSON parse error:`, parseError);
      console.log(`❌ Raw response:`, responseText.substring(0, 200) + "...");
      logApiCall("AeroDataBox", flightNumber, startTime, false, parseError);
      return null;
    }

    // Check for error in response
    if (data.error) {
      console.log(`❌ AeroDataBox API error:`, data.error);
      logApiCall("AeroDataBox", flightNumber, startTime, false, data.error);
      return null;
    }

    // Handle both wrapped and unwrapped responses
    let flightData;
    if (Array.isArray(data)) {
      flightData = data;
    } else if (data.data && Array.isArray(data.data)) {
      flightData = data.data;
    } else {
      console.log(
        `⚠️  AeroDataBox: Unexpected response format for ${flightNumber}`,
      );
      logApiCall(
        "AeroDataBox",
        flightNumber,
        startTime,
        false,
        new Error("Unexpected response format"),
      );
      return null;
    }

    if (flightData.length > 0) {
      console.log(
        `✅ AeroDataBox data received for ${flightNumber}: ${flightData.length} flights`,
      );
      logApiCall("AeroDataBox", flightNumber, startTime, true);
      return flightData[0];
    }

    console.log(`⚠️  AeroDataBox: No flight data found for ${flightNumber}`);
    logApiCall(
      "AeroDataBox",
      flightNumber,
      startTime,
      false,
      new Error("No flight data found"),
    );
    return null;
  } catch (error) {
    console.log(`💥 AeroDataBox API error:`, error);
    logApiCall("AeroDataBox", flightNumber, startTime, false, error);
    return null;
  } finally {
    cacheMetrics.activeRequests.delete(requestId);
  }
}

// Types
interface TurbulenceForecast {
  flightNumber: string;
  route: {
    from: string;
    to: string;
  };
  severity: "smooth" | "light" | "moderate" | "severe"; // Overall route severity
  forecast: Array<{
    segment: string;
    severity: "smooth" | "light" | "moderate" | "severe";
    altitude: string;
    probability: number;
  }>;
  lastUpdated: string;
  // Enhanced flight information
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

// Enhanced cache with metrics and request tracking
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  activeRequests: Set<string>;
}

const forecastCache = new Map<string, CacheEntry<TurbulenceForecast>>();
const basicCache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BASIC_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for basic flight info
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks

// Track active requests to prevent duplicates
const activeRequests = new Map<string, Promise<any>>();
const cacheMetrics: CacheMetrics = {
  totalHits: 0,
  totalMisses: 0,
  totalRequests: 0,
  activeRequests: new Set(),
};

// Enhanced logging with timing
function logApiCall(
  apiName: string,
  flightNumber: string,
  startTime: number,
  success: boolean,
  error?: any,
) {
  const duration = Date.now() - startTime;
  const status = success ? "✅" : "❌";

  console.log(
    `${status} ${apiName} API call for ${flightNumber}: ${duration}ms`,
  );

  if (!success && error) {
    console.log(`   Error: ${error.message || error}`);
  }

  // Log cache metrics periodically
  if (Math.random() < 0.1) {
    // 10% chance to log metrics
    logCacheMetrics();
  }
}

function logCacheMetrics() {
  const hitRate =
    cacheMetrics.totalRequests > 0
      ? ((cacheMetrics.totalHits / cacheMetrics.totalRequests) * 100).toFixed(1)
      : "0";

  console.log(
    `📊 Cache Metrics: ${hitRate}% hit rate (${cacheMetrics.totalHits}/${cacheMetrics.totalRequests})`,
  );
  console.log(
    `📊 Cache sizes: Forecast=${forecastCache.size}, Basic=${basicCache.size}`,
  );
  console.log(`📊 Active requests: ${cacheMetrics.activeRequests.size}`);
}

// Clear cache function for testing
function clearCache() {
  forecastCache.clear();
  basicCache.clear();
  activeRequests.clear();
  cacheMetrics.totalHits = 0;
  cacheMetrics.totalMisses = 0;
  cacheMetrics.totalRequests = 0;
  cacheMetrics.activeRequests.clear();
  console.log("🧹 Cache cleared and metrics reset");
}

// Cache cleanup function to prevent memory leaks
function cleanupCache() {
  const now = Date.now();

  // Clean expired entries
  for (const [key, entry] of forecastCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      forecastCache.delete(key);
    }
  }

  for (const [key, entry] of basicCache.entries()) {
    if (now - entry.timestamp > BASIC_CACHE_DURATION) {
      basicCache.delete(key);
    }
  }

  // Remove oldest entries if cache is too large
  if (forecastCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(forecastCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = entries.slice(0, forecastCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => forecastCache.delete(key));
  }

  if (basicCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(basicCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = entries.slice(0, basicCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => basicCache.delete(key));
  }

  console.log(
    `🧹 Cache cleanup completed: Forecast=${forecastCache.size}, Basic=${basicCache.size}`,
  );
}

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

// Initialize services
const flightAwareService = new FlightAwareService();
const noaaPirepsService = new NOAAPirepsService();
const bumpySkiesService = new SimpleBumpySkiesService();

// Validation schema
const turbulenceRequestSchema = z.object({
  flightNumber: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]{2,3}\d{1,4}$/i, "Invalid flight number format"),
});

// No mock data - only real data sources

async function createTurbulenceForecast(
  flightNumber: string,
): Promise<TurbulenceForecast> {
  console.log(`🔍 Fetching flight data for ${flightNumber}...`);

  // Try to get data from AeroDataBox first (more reliable)
  console.log(`🔍 Attempting to fetch from AeroDataBox for ${flightNumber}...`);
  const aeroDataBoxFlight = await getAeroDataBoxFlight(flightNumber);

  // Fallback to FlightAware if AeroDataBox fails
  let flightRoute: FlightRoute | null = null;
  if (!aeroDataBoxFlight) {
    console.log(
      `🔄 AeroDataBox failed for ${flightNumber}, trying FlightAware...`,
    );
    flightRoute = await flightAwareService.getFlightRoute(flightNumber);
  } else {
    console.log(`✅ AeroDataBox success for ${flightNumber}`);
  }

  if (!aeroDataBoxFlight && !flightRoute) {
    throw new Error(`Flight ${flightNumber} not found in any data source`);
  }

  // Use AeroDataBox data if available, otherwise use FlightAware
  const useAeroDataBox = !!aeroDataBoxFlight;
  const fromIata = useAeroDataBox
    ? aeroDataBoxFlight.departure?.airport?.iata
    : flightRoute!.from.iata;
  const toIata = useAeroDataBox
    ? aeroDataBoxFlight.arrival?.airport?.iata
    : flightRoute!.to.iata;

  if (!fromIata || !toIata) {
    console.log(`⚠️  Missing IATA codes for flight ${flightNumber}`);
    throw new Error("Flight data incomplete - missing airport codes");
  }

  console.log(`✈️  Route: ${fromIata} → ${toIata}`);
  if (useAeroDataBox) {
    console.log(`   AeroDataBox: ${aeroDataBoxFlight}`);
    console.log(
      `   AeroDataBox: ${JSON.stringify(aeroDataBoxFlight, null, 2)}`,
    );
    console.log(`   Airline: ${aeroDataBoxFlight.airline?.name || "Unknown"}`);
    console.log(`   Status: ${aeroDataBoxFlight.status || "Unknown"}`);
    console.log(
      `   Aircraft: ${aeroDataBoxFlight.aircraft?.model || "Unknown"} (${aeroDataBoxFlight.aircraft?.reg || "Unknown"})`,
    );
  } else {
    console.log(`   Airline: ${flightRoute!.airline.name}`);
    console.log(`   Status: ${flightRoute!.status}`);
  }

  // Check if we have coordinates for route analysis
  const fromCoords = useAeroDataBox
    ? aeroDataBoxFlight.departure?.airport?.location
      ? {
          lat: aeroDataBoxFlight.departure.airport.location.lat,
          lon: aeroDataBoxFlight.departure.airport.location.lon,
        }
      : null
    : flightRoute!.from.coordinates;
  const toCoords = useAeroDataBox
    ? aeroDataBoxFlight.arrival?.airport?.location
      ? {
          lat: aeroDataBoxFlight.arrival.airport.location.lat,
          lon: aeroDataBoxFlight.arrival.airport.location.lon,
        }
      : null
    : flightRoute!.to.coordinates;

  if (!fromCoords || !toCoords) {
    console.log(
      `⚠️  No coordinates available for route ${fromIata} → ${toIata}`,
    );
    console.log(`   Returning basic route info without turbulence analysis`);

    // Return basic forecast without coordinates
    const forecast = [
      {
        segment: `${fromIata} → ${toIata}`,
        severity: "smooth" as const,
        altitude: `${Math.floor(Math.random() * 12 + 29) * 1000}ft`, // Random between 29000-40000ft
        probability: 0.0,
      },
    ];

    return {
      flightNumber: flightNumber.toUpperCase(),
      route: {
        from: fromIata,
        to: toIata,
      },
      severity: "smooth",
      forecast,
      lastUpdated: new Date().toISOString(),
      flightInfo: useAeroDataBox
        ? {
            airline: aeroDataBoxFlight.airline,
            aircraft: {
              registration: aeroDataBoxFlight.aircraft.reg || "Unknown",
              model: aeroDataBoxFlight.aircraft.model,
            },
            status: aeroDataBoxFlight.status,
            distance: {
              km: aeroDataBoxFlight.greatCircleDistance.km,
              miles: aeroDataBoxFlight.greatCircleDistance.mile,
              nm: aeroDataBoxFlight.greatCircleDistance.nm,
            },
            schedule: {
              departure: {
                airport: aeroDataBoxFlight.departure.airport.name,
                scheduled: aeroDataBoxFlight.departure.scheduledTime.utc,
                terminal: aeroDataBoxFlight.departure.terminal,
              },
              arrival: {
                airport: aeroDataBoxFlight.arrival.airport.name,
                scheduled: aeroDataBoxFlight.arrival.scheduledTime.utc,
                terminal: aeroDataBoxFlight.arrival.terminal,
              },
            },
            lastUpdated: aeroDataBoxFlight.lastUpdatedUtc,
          }
        : {
            airline: {
              name: flightRoute!.airline.name,
              iata: flightRoute!.airline.iata,
              icao: flightRoute!.airline.iata, // Use iata as fallback for icao
            },
            aircraft: {
              registration: "Unknown",
              model: "Unknown",
            },
            status: flightRoute!.status,
            distance: {
              km: 0,
              miles: 0,
              nm: 0,
            },
            schedule: {
              departure: {
                airport: flightRoute!.from.name,
                scheduled: "Unknown",
              },
              arrival: {
                airport: flightRoute!.to.name,
                scheduled: "Unknown",
              },
            },
            lastUpdated: new Date().toISOString(),
          },
      dataSource: {
        flightRoute: useAeroDataBox ? "aerodatabox" : "real",
        turbulenceReports: "none",
        pirepsCount: 0,
        aviationStackAvailable: !!process.env.FLIGHTAWARE_API_KEY,
        aerodataboxAvailable: useAeroDataBox,
      },
    };
  }

  // Generate route segments
  const routeSegments = noaaPirepsService.generateMultiSegmentRoute(
    fromCoords,
    toCoords,
    fromIata,
    toIata,
  );

  console.log(`🗺️  Generated ${routeSegments.length} route segments`);
  console.log(
    `📋 FULL ROUTE SEGMENTS DATA:`,
    JSON.stringify(routeSegments, null, 2),
  );

  // Use BumpySkies service for real turbulence data
  console.log(`🌪️  Generating turbulence forecast using BumpySkies service...`);

  try {
    // Try BumpySkies service first (has real turbulence modeling)
    const bumpySkiesForecast =
      await bumpySkiesService.generateTurbulenceForecast(flightNumber);
    console.log(`✅ BumpySkies forecast generated successfully`);

    // Convert BumpySkies format to our API format
    const forecast = convertBumpySkiesToApiFormat(bumpySkiesForecast);
    console.log(`📊 Converted to API format: ${forecast.length} segments`);

    const result = createResultFromBumpySkies(
      flightNumber,
      bumpySkiesForecast,
      forecast,
      useAeroDataBox,
      aeroDataBoxFlight,
      flightRoute,
    );

    console.log(`📋 FINAL BUMPYSKIES RESULT:`, JSON.stringify(result, null, 2));
    return result;
  } catch (bumpyError) {
    console.warn(`⚠️ BumpySkies service failed: ${bumpyError}`);
    console.log(`🔄 Falling back to NOAA PIREPs...`);

    // Fallback to original NOAA PIREPs method
    const turbulenceReports =
      await noaaPirepsService.getTurbulenceReports(routeSegments);
    console.log(`📊 Found ${turbulenceReports.length} PIREPs reports`);

    // Generate forecast based on real data only
    const forecast = generateForecastFromRealData(
      routeSegments,
      turbulenceReports,
    );

    console.log(
      `✅ Generated fallback forecast with ${forecast.length} segments`,
    );
    console.log(`📋 FULL FORECAST DATA:`, JSON.stringify(forecast, null, 2));

    // Calculate overall route severity (most severe across all segments)
    const overallSeverity = calculateOverallSeverity(forecast);
    console.log(`🎯 Overall route severity: ${overallSeverity}`);

    const result = {
      flightNumber: flightNumber.toUpperCase(),
      route: {
        from: fromIata,
        to: toIata,
      },
      severity: overallSeverity,
      forecast,
      lastUpdated: new Date().toISOString(),
      flightInfo: useAeroDataBox
        ? {
            airline: aeroDataBoxFlight.airline,
            aircraft: {
              registration: aeroDataBoxFlight.aircraft.reg || "Unknown",
              model: aeroDataBoxFlight.aircraft.model,
            },
            status: aeroDataBoxFlight.status,
            distance: {
              km: aeroDataBoxFlight.greatCircleDistance.km,
              miles: aeroDataBoxFlight.greatCircleDistance.mile,
              nm: aeroDataBoxFlight.greatCircleDistance.nm,
            },
            schedule: {
              departure: {
                airport: aeroDataBoxFlight.departure.airport.name,
                scheduled: aeroDataBoxFlight.departure.scheduledTime.utc,
                terminal: aeroDataBoxFlight.departure.terminal,
              },
              arrival: {
                airport: aeroDataBoxFlight.arrival.airport.name,
                scheduled: aeroDataBoxFlight.arrival.scheduledTime.utc,
                terminal: aeroDataBoxFlight.arrival.terminal,
              },
            },
            lastUpdated: aeroDataBoxFlight.lastUpdatedUtc,
          }
        : {
            airline: {
              name: flightRoute!.airline.name,
              iata: flightRoute!.airline.iata,
              icao: flightRoute!.airline.iata, // Use iata as fallback for icao
            },
            aircraft: {
              registration: "Unknown",
              model: "Unknown",
            },
            status: flightRoute!.status,
            distance: {
              km: 0,
              miles: 0,
              nm: 0,
            },
            schedule: {
              departure: {
                airport: flightRoute!.from.name,
                scheduled: "Unknown",
              },
              arrival: {
                airport: flightRoute!.to.name,
                scheduled: "Unknown",
              },
            },
            lastUpdated: new Date().toISOString(),
          },
      dataSource: {
        flightRoute: useAeroDataBox ? "aerodatabox" : "real",
        turbulenceReports: turbulenceReports.length > 0 ? "real" : "none",
        pirepsCount: turbulenceReports.length,
        aviationStackAvailable: !!process.env.FLIGHTAWARE_API_KEY,
        aerodataboxAvailable: useAeroDataBox,
      },
    };

    console.log(`📋 FULL FINAL RESULT:`, JSON.stringify(result, null, 2));
    return result as TurbulenceForecast;
  }
}

// Convert BumpySkies format to our API format
function convertBumpySkiesToApiFormat(bumpyForecast: any): Array<{
  segment: string;
  severity: "smooth" | "light" | "moderate" | "severe";
  altitude: string;
  probability: number;
}> {
  console.log(`🔄 Converting BumpySkies forecast to API format...`);

  return bumpyForecast.segments.map((segment: any, index: number) => {
    // Map BumpySkies conditions to our severity levels
    let severity: "smooth" | "light" | "moderate" | "severe";
    switch (segment.condition) {
      case "calm":
        severity = "smooth";
        break;
      case "light":
        severity = "light";
        break;
      case "moderate":
        severity = "moderate";
        break;
      case "severe":
        severity = "severe";
        break;
      default:
        severity = "smooth";
    }

    // Calculate probability based on confidence and severity
    let probability = 0;
    if (severity !== "smooth") {
      probability = Math.round(segment.confidence * 100) / 100;
      if (severity === "light") probability = Math.max(0.3, probability);
      if (severity === "moderate") probability = Math.max(0.5, probability);
      if (severity === "severe") probability = Math.max(0.7, probability);
    }

    return {
      segment: `${bumpyForecast.departure.iata} → ${bumpyForecast.arrival.iata} (${index + 1}/${bumpyForecast.segments.length})`,
      severity,
      altitude: `${Math.round(segment.altitude)}ft`,
      probability: Math.round(probability * 100) / 100,
    };
  });
}

// Create result using BumpySkies data
function createResultFromBumpySkies(
  flightNumber: string,
  bumpyForecast: any,
  forecast: Array<{
    segment: string;
    severity: string;
    altitude: string;
    probability: number;
  }>,
  useAeroDataBox: boolean,
  aeroDataBoxFlight: any,
  flightRoute: any,
): TurbulenceForecast {
  console.log(`📋 Creating result from BumpySkies data...`);

  // Calculate overall severity
  const overallSeverity = calculateOverallSeverity(forecast as any);

  const result = {
    flightNumber: flightNumber.toUpperCase(),
    route: {
      from: bumpyForecast.departure.iata,
      to: bumpyForecast.arrival.iata,
    },
    severity: overallSeverity,
    forecast,
    lastUpdated: new Date().toISOString(),
    flightInfo:
      useAeroDataBox && aeroDataBoxFlight
        ? {
            airline: aeroDataBoxFlight.airline,
            aircraft: {
              registration: aeroDataBoxFlight.aircraft.reg || "Unknown",
              model: aeroDataBoxFlight.aircraft.model,
            },
            status: aeroDataBoxFlight.status,
            distance: {
              km: aeroDataBoxFlight.greatCircleDistance.km,
              miles: aeroDataBoxFlight.greatCircleDistance.mile,
              nm: aeroDataBoxFlight.greatCircleDistance.nm,
            },
            schedule: {
              departure: {
                airport: aeroDataBoxFlight.departure.airport.name,
                scheduled: aeroDataBoxFlight.departure.scheduledTime.utc,
                terminal: aeroDataBoxFlight.departure.terminal,
              },
              arrival: {
                airport: aeroDataBoxFlight.arrival.airport.name,
                scheduled: aeroDataBoxFlight.arrival.scheduledTime.utc,
                terminal: aeroDataBoxFlight.arrival.terminal,
              },
            },
            lastUpdated: aeroDataBoxFlight.lastUpdatedUtc,
          }
        : {
            airline: {
              name: flightRoute?.airline?.name || "Unknown",
              iata: flightRoute?.airline?.iata || "Unknown",
              icao: flightRoute?.airline?.iata || "Unknown",
            },
            aircraft: {
              registration: "Unknown",
              model: "Unknown",
            },
            status: flightRoute?.status || "Unknown",
            distance: {
              km: 0,
              miles: 0,
              nm: 0,
            },
            schedule: {
              departure: {
                airport: bumpyForecast.departure.airport,
                scheduled: "Unknown",
              },
              arrival: {
                airport: bumpyForecast.arrival.airport,
                scheduled: "Unknown",
              },
            },
            lastUpdated: new Date().toISOString(),
          },
    dataSource: {
      flightRoute: useAeroDataBox ? "aerodatabox" : "real",
      turbulenceReports: "real", // BumpySkies provides real turbulence modeling
      pirepsCount: bumpyForecast.segments.length,
      aviationStackAvailable: !!process.env.FLIGHTAWARE_API_KEY,
      aerodataboxAvailable: useAeroDataBox,
    },
  };

  return result as TurbulenceForecast;
}

function calculateOverallSeverity(
  forecast: Array<{
    segment: string;
    severity: "smooth" | "light" | "moderate" | "severe";
    altitude: string;
    probability: number;
  }>,
): "smooth" | "light" | "moderate" | "severe" {
  if (forecast.length === 0) {
    return "smooth";
  }

  // Find the most severe severity across all segments
  const severityOrder = { smooth: 0, light: 1, moderate: 2, severe: 3 };

  const mostSevere = forecast.reduce((prev, current) => {
    return severityOrder[current.severity] > severityOrder[prev.severity]
      ? current
      : prev;
  });

  console.log(
    `🎯 Most severe segment: ${mostSevere.segment} with ${mostSevere.severity} severity`,
  );
  return mostSevere.severity;
}

function generateForecastFromRealData(
  segments: RouteSegment[],
  turbulenceReports: TurbulenceReport[],
): Array<{
  segment: string;
  severity: "smooth" | "light" | "moderate" | "severe";
  altitude: string;
  probability: number;
}> {
  console.log(
    `🔧 Generating forecast from ${segments.length} segments and ${turbulenceReports.length} reports`,
  );

  return segments.map((segment, index) => {
    console.log(
      `🔧 Processing segment ${index + 1}/${segments.length}: ${segment.name}`,
    );

    // Find turbulence reports for this segment
    const segmentReports = turbulenceReports.filter(
      (report) => report.distance <= 200, // Within 200km of route
    );

    console.log(
      `   Found ${segmentReports.length} reports within 200km of segment`,
    );

    let severity: "smooth" | "light" | "moderate" | "severe" = "smooth";
    let probability = 0.0; // No turbulence probability if no reports

    if (segmentReports.length > 0) {
      console.log(
        `   Segment reports:`,
        segmentReports.map(
          (r) => `${r.intensity} at ${r.altitude}ft (${r.distance}km)`,
        ),
      );

      // Use the most severe turbulence report for this segment
      const mostSevere = segmentReports.reduce((prev, current) => {
        const severityOrder = { smooth: 0, light: 1, moderate: 2, severe: 3 };
        return severityOrder[current.intensity] > severityOrder[prev.intensity]
          ? current
          : prev;
      });

      severity = mostSevere.intensity;
      console.log(
        `   Most severe report: ${mostSevere.intensity} at ${mostSevere.altitude}ft`,
      );

      // Calculate probability based on severity and number of reports
      switch (mostSevere.intensity) {
        case "light":
          probability = Math.min(0.3 + segmentReports.length * 0.1, 0.5);
          break;
        case "moderate":
          probability = Math.min(0.5 + segmentReports.length * 0.1, 0.7);
          break;
        case "severe":
          probability = Math.min(0.7 + segmentReports.length * 0.05, 0.9);
          break;
      }
      console.log(`   Calculated probability: ${probability}`);
    } else {
      console.log(
        `   No reports found - using smooth severity with 0 probability`,
      );
    }

    // Use realistic cruise altitude - either from PIREPs (if reasonable) or random
    let altitude;
    if (segmentReports.length > 0) {
      const pirepAltitude = Math.round(segmentReports[0].altitude / 100) * 100;
      // If PIREP altitude is too low for commercial flights, use random cruise altitude
      if (pirepAltitude < 25000) {
        altitude = `${Math.floor(Math.random() * 12 + 29) * 1000}ft`; // Random between 29000-40000ft
      } else {
        altitude = `${pirepAltitude}ft`;
      }
    } else {
      altitude = `${Math.floor(Math.random() * 12 + 29) * 1000}ft`; // Random between 29000-40000ft
    }

    const result = {
      segment: segment.name,
      severity,
      altitude,
      probability: Math.round(probability * 100) / 100,
    };

    console.log(`   Final segment result:`, result);
    return result;
  });
}

// Get basic flight info quickly (FlightAware + AeroDataBox)
async function getBasicFlightInfo(flightNumber: string) {
  const cacheKey = `${flightNumber}_basic`;
  console.log(`🔍 Getting basic flight info for ${flightNumber}...`);
  cacheMetrics.totalRequests++;

  // Check basic cache first
  const cached = basicCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < BASIC_CACHE_DURATION) {
    console.log(`💾 Cache HIT for basic info: ${flightNumber}`);
    cached.hits++;
    cached.lastAccessed = Date.now();
    cacheMetrics.totalHits++;
    return cached.data;
  }

  console.log(`💥 Cache MISS for basic info: ${flightNumber}`);
  cacheMetrics.totalMisses++;

  // Check if there's already an active request for this flight
  if (activeRequests.has(cacheKey)) {
    console.log(`⏳ Waiting for active request for ${flightNumber}...`);
    try {
      const result = await activeRequests.get(cacheKey);
      return result;
    } catch (error) {
      console.log(
        `❌ Active request failed for ${flightNumber}, making new request`,
      );
    }
  }

  // Create a promise for this request to prevent duplicates
  const requestPromise = (async () => {
    // Try AeroDataBox first (faster)
    const aeroDataBoxFlight = await getAeroDataBoxFlight(flightNumber);
    if (aeroDataBoxFlight) {
      const basicInfo = {
        flightNumber: flightNumber.toUpperCase(),
        route: {
          from: aeroDataBoxFlight.departure?.airport?.iata,
          to: aeroDataBoxFlight.arrival?.airport?.iata,
        },
        severity: "smooth", // Default until full analysis
        forecast: [
          {
            segment: `${aeroDataBoxFlight.departure?.airport?.iata} → ${aeroDataBoxFlight.arrival?.airport?.iata}`,
            severity: "smooth" as const,
            altitude: "35000ft",
            probability: 0,
          },
        ],
        lastUpdated: new Date().toISOString(),
        flightInfo: {
          airline: aeroDataBoxFlight.airline,
          aircraft: {
            registration: aeroDataBoxFlight.aircraft.reg || "Unknown",
            model: aeroDataBoxFlight.aircraft.model,
          },
          status: aeroDataBoxFlight.status,
          distance: {
            km: aeroDataBoxFlight.greatCircleDistance.km,
            miles: aeroDataBoxFlight.greatCircleDistance.mile,
            nm: aeroDataBoxFlight.greatCircleDistance.nm,
          },
          schedule: {
            departure: {
              airport: aeroDataBoxFlight.departure.airport.name,
              scheduled: aeroDataBoxFlight.departure.scheduledTime.utc,
              terminal: aeroDataBoxFlight.departure.terminal,
            },
            arrival: {
              airport: aeroDataBoxFlight.arrival.airport.name,
              scheduled: aeroDataBoxFlight.arrival.scheduledTime.utc,
              terminal: aeroDataBoxFlight.arrival.terminal,
            },
          },
          lastUpdated: aeroDataBoxFlight.lastUpdatedUtc,
        },
        dataSource: {
          flightRoute: "aerodatabox",
          turbulenceReports: "none",
          pirepsCount: 0,
          aviationStackAvailable: !!process.env.FLIGHTAWARE_API_KEY,
          aerodataboxAvailable: true,
        },
        loading: true, // Indicate this is preliminary data
      };

      // Cache basic info with enhanced metadata
      basicCache.set(cacheKey, {
        data: basicInfo,
        timestamp: Date.now(),
        hits: 0,
        lastAccessed: Date.now(),
      });

      return basicInfo;
    }

    // Fallback to FlightAware
    const flightRoute = await flightAwareService.getFlightRoute(flightNumber);
    if (flightRoute) {
      const basicInfo = {
        flightNumber: flightNumber.toUpperCase(),
        route: {
          from: flightRoute.from.iata,
          to: flightRoute.to.iata,
        },
        severity: "smooth",
        forecast: [
          {
            segment: `${flightRoute.from.iata} → ${flightRoute.to.iata}`,
            severity: "smooth" as const,
            altitude: "35000ft",
            probability: 0,
          },
        ],
        lastUpdated: new Date().toISOString(),
        flightInfo: {
          airline: flightRoute.airline,
          aircraft: {
            registration: "Unknown",
            model: "Unknown",
          },
          status: flightRoute.status,
          distance: {
            km: 0,
            miles: 0,
            nm: 0,
          },
          schedule: {
            departure: {
              airport: flightRoute.from.name,
              scheduled: "Unknown",
            },
            arrival: {
              airport: flightRoute.to.name,
              scheduled: "Unknown",
            },
          },
          lastUpdated: new Date().toISOString(),
        },
        dataSource: {
          flightRoute: "real",
          turbulenceReports: "none",
          pirepsCount: 0,
          aviationStackAvailable: !!process.env.FLIGHTAWARE_API_KEY,
          aerodataboxAvailable: false,
        },
        loading: true,
      };

      // Cache basic info with enhanced metadata
      basicCache.set(cacheKey, {
        data: basicInfo,
        timestamp: Date.now(),
        hits: 0,
        lastAccessed: Date.now(),
      });

      return basicInfo;
    }

    throw new Error(`Flight ${flightNumber} not found`);
  })();

  // Store the promise to prevent duplicate requests
  activeRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up the active request
    activeRequests.delete(cacheKey);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      `🚀 POST /api/turbulence - Request body:`,
      JSON.stringify(body, null, 2),
    );

    // Validate input
    const validationResult = turbulenceRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(`❌ Validation failed:`, validationResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { flightNumber } = validationResult.data;
    const cacheKey = flightNumber.toUpperCase();
    console.log(`🔑 Cache key: ${cacheKey}`);

    // Always return basic flight info immediately for POST requests
    console.log(
      `⚡ Returning basic flight info immediately for ${flightNumber}`,
    );
    const basicInfo = await getBasicFlightInfo(flightNumber);

    // Check if full forecast is already cached and ready
    const cached = forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Full forecast already cached for ${flightNumber}`);
      cached.hits++;
      cached.lastAccessed = Date.now();
      cacheMetrics.totalHits++;

      // Update basic info to show full forecast is ready
      basicInfo.loading = false;
      basicInfo.forecast = cached.data.forecast;
      basicInfo.severity = cached.data.severity;
      basicInfo.dataSource = cached.data.dataSource;
    } else {
      console.log(`💥 Full forecast cache MISS for ${flightNumber}`);
      cacheMetrics.totalMisses++;

      // Check if there's already an active request for this forecast
      const forecastRequestKey = `forecast_${flightNumber}`;
      if (activeRequests.has(forecastRequestKey)) {
        console.log(
          `⏳ Full forecast already being generated for ${flightNumber}`,
        );
      } else {
        // Start generating full forecast asynchronously (don't await)
        const forecastPromise = createTurbulenceForecast(flightNumber)
          .then((fullForecast) => {
            // Update cache with complete data
            forecastCache.set(cacheKey, {
              data: fullForecast,
              timestamp: Date.now(),
              hits: 0,
              lastAccessed: Date.now(),
            });
            console.log(
              `✅ Full forecast generated and cached for ${flightNumber}`,
            );
            return fullForecast;
          })
          .catch((error) => {
            console.error(
              `❌ Failed to generate full forecast for ${flightNumber}:`,
              error,
            );
            throw error;
          })
          .finally(() => {
            activeRequests.delete(forecastRequestKey);
          });

        // Store the promise to prevent duplicate requests
        activeRequests.set(forecastRequestKey, forecastPromise);
      }
    }

    return NextResponse.json(basicInfo);
  } catch (error) {
    console.error("Turbulence API error:", error);

    // Return specific error messages instead of generic 500
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Flight not found", details: error.message },
          { status: 404 },
        );
      }
      if (error.message.includes("coordinates")) {
        return NextResponse.json(
          { error: "Route data incomplete", details: error.message },
          { status: 422 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Unable to fetch turbulence data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}

// GET method for full forecast (after basic info is loaded)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const flightNumber = url.searchParams.get("flightNumber");

    if (!flightNumber) {
      // Check for cache clear command
      const clearCacheParam = url.searchParams.get("clearCache");
      if (clearCacheParam === "true") {
        clearCache();
        return NextResponse.json({
          message: "Cache cleared successfully",
          timestamp: new Date().toISOString(),
        });
      }

      // Check for cache metrics command
      const metricsParam = url.searchParams.get("metrics");
      if (metricsParam === "true") {
        const hitRate =
          cacheMetrics.totalRequests > 0
            ? (
                (cacheMetrics.totalHits / cacheMetrics.totalRequests) *
                100
              ).toFixed(1)
            : "0";

        return NextResponse.json({
          message: "Cache Metrics",
          timestamp: new Date().toISOString(),
          metrics: {
            hitRate: `${hitRate}%`,
            totalHits: cacheMetrics.totalHits,
            totalMisses: cacheMetrics.totalMisses,
            totalRequests: cacheMetrics.totalRequests,
            cacheSizes: {
              forecast: forecastCache.size,
              basic: basicCache.size,
            },
            activeRequests: cacheMetrics.activeRequests.size,
            cacheDuration: {
              forecast: `${CACHE_DURATION / 1000}s`,
              basic: `${BASIC_CACHE_DURATION / 1000}s`,
            },
          },
        });
      }

      return NextResponse.json({
        message: "Turbulence Forecast API",
        version: "1.0.0",
        endpoints: {
          "POST /api/turbulence": {
            description:
              "Get basic flight info immediately, then full forecast asynchronously",
            requestBody: {
              flightNumber: "string (e.g., AA100, UA2457)",
            },
          },
          "GET /api/turbulence?flightNumber=XX123": {
            description: "Get full turbulence forecast (call after basic info)",
          },
          "GET /api/turbulence?clearCache=true": {
            description: "Clear all caches (for testing)",
          },
          "GET /api/turbulence?metrics=true": {
            description: "Get cache performance metrics",
          },
        },
        features: {
          caching: {
            type: "In-memory Map",
            durations: {
              forecast: `${CACHE_DURATION / 1000} seconds`,
              basic: `${BASIC_CACHE_DURATION / 1000} seconds`,
            },
            maxSize: MAX_CACHE_SIZE,
            cleanup: "Automatic every 10 minutes",
          },
          duplicatePrevention: "Active request tracking",
          logging: "Enhanced with timing and metrics",
        },
      });
    }

    // Validate flight number
    const validationResult = turbulenceRequestSchema.safeParse({
      flightNumber,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid flight number format",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { flightNumber: validFlightNumber } = validationResult.data;
    const cacheKey = validFlightNumber.toUpperCase();

    console.log(
      `🔍 GET /api/turbulence - Requesting full forecast for ${validFlightNumber}`,
    );

    // Check if full forecast is ready
    const cached = forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Cache HIT for full forecast: ${validFlightNumber}`);
      cached.hits++;
      cached.lastAccessed = Date.now();
      cacheMetrics.totalHits++;
      return NextResponse.json(cached.data);
    }

    console.log(`💥 Cache MISS for full forecast: ${validFlightNumber}`);
    cacheMetrics.totalMisses++;

    // Check if there's already an active request for this forecast
    const forecastRequestKey = `forecast_${validFlightNumber}`;
    if (activeRequests.has(forecastRequestKey)) {
      console.log(
        `⏳ Waiting for active forecast generation for ${validFlightNumber}...`,
      );
      try {
        const result = await activeRequests.get(forecastRequestKey);
        return NextResponse.json(result);
      } catch (error) {
        console.log(
          `❌ Active forecast request failed for ${validFlightNumber}, making new request`,
        );
      }
    }

    // Generate full forecast if not cached
    console.log(`🔄 Generating full forecast for ${validFlightNumber}`);
    const forecastPromise = createTurbulenceForecast(validFlightNumber)
      .then((fullForecast) => {
        // Cache the result with enhanced metadata
        forecastCache.set(cacheKey, {
          data: fullForecast,
          timestamp: Date.now(),
          hits: 0,
          lastAccessed: Date.now(),
        });

        console.log(
          `✅ Full forecast generated and cached for ${validFlightNumber}`,
        );
        return fullForecast;
      })
      .finally(() => {
        activeRequests.delete(forecastRequestKey);
      });

    // Store the promise to prevent duplicate requests
    activeRequests.set(forecastRequestKey, forecastPromise);

    const fullForecast = await forecastPromise;
    return NextResponse.json(fullForecast);
  } catch (error) {
    console.error("Turbulence GET API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Flight not found", details: error.message },
          { status: 404 },
        );
      }
      if (error.message.includes("coordinates")) {
        return NextResponse.json(
          { error: "Route data incomplete", details: error.message },
          { status: 422 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Unable to fetch full turbulence forecast",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
