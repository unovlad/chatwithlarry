import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BumpySkiesService } from "@/lib/bumpySkiesService";
import { FlightAwareService } from "@/lib/flightAwareService";

// Import existing services for flight data
const AERODATABOX_API_KEY = "91d95ae2d8mshb1dca2ef9fe542ep1c9b8cjsn3d640413bd67";
const AERODATABOX_HOST = "aerodatabox.p.rapidapi.com";

// Validation
const flightRequestSchema = z.object({
  airline: z.string().min(2).max(3),
  flight: z.string().min(1).max(4),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airline, flight } = flightRequestSchema.parse(body);
    
    const fullFlightNumber = `${airline.toUpperCase()}${flight}`;
    console.log(`🛫 Creating BumpySkies-style forecast for: ${fullFlightNumber}`);

    // Get flight route data
    const flightRoute = await getFlightRouteData(fullFlightNumber);
    if (!flightRoute) {
      return NextResponse.json(
        { error: `Flight ${fullFlightNumber} not found` },
        { status: 404 }
      );
    }

    // Create BumpySkies-style detailed forecast
    const bumpySkiesService = new BumpySkiesService();
    const forecast = await bumpySkiesService.createDetailedTurbulenceForecast(flightRoute);
    
    return NextResponse.json(forecast);
    
  } catch (error) {
    console.error("Error creating BumpySkies forecast:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create forecast", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function getFlightRouteData(flightNumber: string) {
  try {
    console.log(`🔍 Getting flight route data for ${flightNumber}...`);
    
    // Try AeroDataBox first
    const aeroDataBoxRoute = await getAeroDataBoxRoute(flightNumber);
    if (aeroDataBoxRoute) {
      return aeroDataBoxRoute;
    }
    
    // Fallback to FlightAware
    const flightAwareService = new FlightAwareService();
    const flightAwareRoute = await flightAwareService.getFlightRoute(flightNumber);
    if (flightAwareRoute) {
      return flightAwareRoute;
    }
    
    console.log(`❌ No flight data found for ${flightNumber}`);
    return null;
    
  } catch (error) {
    console.error("Error getting flight route:", error);
    return null;
  }
}

async function getAeroDataBoxRoute(flightNumber: string) {
  try {
    console.log(`📡 Fetching from AeroDataBox: ${flightNumber}`);
    
    const url = `https://${AERODATABOX_HOST}/flights/number/${flightNumber}?withAircraftImage=false&withLocation=true`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": AERODATABOX_API_KEY,
        "x-rapidapi-host": AERODATABOX_HOST,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(`❌ AeroDataBox API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const flight = data[0];
    
    if (!flight) {
      console.log(`❌ No flight data in AeroDataBox response`);
      return null;
    }

    console.log(`✅ AeroDataBox data received for ${flightNumber}`);
    
    // Convert AeroDataBox format to FlightRoute format
    return {
      flightNumber: flight.number,
      from: {
        iata: flight.departure.airport.iata,
        icao: flight.departure.airport.icao,
        name: flight.departure.airport.name,
        coordinates: {
          lat: flight.departure.airport.location.lat,
          lon: flight.departure.airport.location.lon,
        },
      },
      to: {
        iata: flight.arrival.airport.iata,
        icao: flight.arrival.airport.icao,
        name: flight.arrival.airport.name,
        coordinates: {
          lat: flight.arrival.airport.location.lat,
          lon: flight.arrival.airport.location.lon,
        },
      },
      airline: {
        name: flight.airline.name,
        iata: flight.airline.iata,
      },
      status: flight.status as "scheduled" | "live" | "landed" | "cancelled" | "unknown",
    };
    
  } catch (error) {
    console.error("Error fetching AeroDataBox data:", error);
    return null;
  }
}