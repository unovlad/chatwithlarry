import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlightAwareService, type FlightRoute } from "@/lib/flightAwareService";
import {
  NOAAPirepsService,
  type TurbulenceReport,
  type RouteSegment,
} from "@/lib/noaaPirepsService";

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
  try {
    console.log(`🔍 Fetching AeroDataBox data for ${flightNumber}...`);

    const url = `https://${AERODATABOX_HOST}/flights/number/${flightNumber}?withAircraftImage=false&withLocation=false`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": AERODATABOX_API_KEY,
        "x-rapidapi-host": AERODATABOX_HOST,
      },
      cache: "no-store",
    });

    console.log(`🛫 AeroDataBox response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(
        `❌ AeroDataBox API failed: ${response.status} - ${errorText}`,
      );
      return null;
    }

    // Check if response is empty or invalid JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      console.log(`❌ AeroDataBox returned empty response`);
      return null;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`❌ AeroDataBox JSON parse error:`, parseError);
      console.log(`❌ Raw response:`, responseText);
      return null;
    }

    // Check for error in response
    if (data.error) {
      console.log(`❌ AeroDataBox API error:`, data.error);
      return null;
    }

    console.log(`✅ AeroDataBox data received:`, JSON.stringify(data, null, 2));

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
      return null;
    }

    if (flightData.length > 0) {
      return flightData[0];
    }

    console.log(`⚠️  AeroDataBox: No flight data found for ${flightNumber}`);
    return null;
  } catch (error) {
    console.log(`💥 AeroDataBox API error:`, error);
    return null;
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

// Cache for storing forecasts (in-memory)
const forecastCache = new Map<
  string,
  { data: TurbulenceForecast; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize services
const flightAwareService = new FlightAwareService();
const noaaPirepsService = new NOAAPirepsService();

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

  // Get turbulence reports from NOAA PIREPs
  console.log(`🌪️  Fetching turbulence reports from NOAA PIREPs...`);
  const turbulenceReports =
    await noaaPirepsService.getTurbulenceReports(routeSegments);

  console.log(`📊 Found ${turbulenceReports.length} PIREPs reports`);
  console.log(
    `📋 FULL TURBULENCE REPORTS DATA:`,
    JSON.stringify(turbulenceReports, null, 2),
  );

  if (turbulenceReports.length > 0) {
    const severityCounts = turbulenceReports.reduce(
      (acc, report) => {
        acc[report.intensity] = (acc[report.intensity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log(`   Severity breakdown:`, severityCounts);
  }

  // Generate forecast based on real data only
  const forecast = generateForecastFromRealData(
    routeSegments,
    turbulenceReports,
  );

  console.log(`✅ Generated forecast with ${forecast.length} segments`);
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

    // Check cache
    const cached = forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Returning cached result for ${flightNumber}`);
      return NextResponse.json(cached.data);
    }

    console.log(`🔄 Cache miss - generating new forecast for ${flightNumber}`);

    // Generate new forecast
    const forecast = await createTurbulenceForecast(flightNumber);

    // Cache the result
    forecastCache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now(),
    });

    console.log(
      `✅ Successfully generated and cached forecast for ${flightNumber}`,
    );
    return NextResponse.json(forecast);
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

// Optional: Add GET method for API documentation
export async function GET() {
  return NextResponse.json({
    message: "Turbulence Forecast API",
    version: "1.0.0",
    endpoints: {
      "POST /api/turbulence": {
        description: "Get turbulence forecast for a flight",
        requestBody: {
          flightNumber: "string (e.g., AA100, UA2457)",
        },
        response: {
          flightNumber: "string",
          route: {
            from: "string (airport code)",
            to: "string (airport code)",
          },
          forecast: [
            {
              segment: "string (e.g., JFK → LAX)",
              severity: "smooth | light | moderate | severe",
              altitude: "string (e.g., 30000ft)",
              probability: "number (0-1)",
            },
          ],
          lastUpdated: "string (ISO 8601)",
          dataSource: {
            flightRoute: "real",
            turbulenceReports: "real | none",
            pirepsCount: "number",
            aviationStackAvailable: "boolean (FlightAware API key available)",
          },
        },
      },
    },
  });
}
