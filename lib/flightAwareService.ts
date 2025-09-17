interface FlightAwarePosition {
  fa_flight_id: string;
  altitude: number;
  altitude_change: "C" | "D" | "L"; // Climbing, Descending, Level
  groundspeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  update_type: "P" | "E" | "S"; // Position, Estimated, Surface
}

interface FlightAwareTrack {
  actual_distance: number;
  positions: FlightAwarePosition[];
}

interface FlightAwareAirport {
  code: string;
  code_icao: string;
  code_iata: string;
  code_lid: string;
  timezone: string;
  name: string;
  city: string;
  airport_info_url: string;
}

interface FlightAwareFlight {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string;
  atc_ident: string;
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: FlightAwareAirport;
  destination: FlightAwareAirport;
  departure_delay: number;
  arrival_delay: number;
  filed_ete: number;
  progress_percent: number;
  status: string;
  aircraft_type: string;
  route_distance: number;
  filed_airspeed: number;
  filed_altitude: number;
  route: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string;
  scheduled_off: string;
  estimated_off: string;
  actual_off: string;
  scheduled_on: string;
  estimated_on: string;
  actual_on: string;
  scheduled_in: string;
  estimated_in: string;
  actual_in: string;
  foresight_predictions_available: boolean;
}

interface FlightAwareResponse {
  links: {
    next: string;
  };
  num_pages: number;
  flights: FlightAwareFlight[];
}

interface FlightRoute {
  flightNumber: string;
  from: {
    iata: string;
    icao: string;
    name: string;
    coordinates?: { lat: number; lon: number };
  };
  to: {
    iata: string;
    icao: string;
    name: string;
    coordinates?: { lat: number; lon: number };
  };
  airline: {
    name: string;
    iata: string;
  };
  status: "scheduled" | "live" | "landed" | "cancelled" | "unknown";
  livePosition?: {
    lat: number;
    lon: number;
    altitude: number;
    updated: string;
  };
  route?: string; // Filed route string
  track?: FlightAwarePosition[]; // Flight track positions
}

// Airport coordinates database (major airports)
const AIRPORT_COORDINATES: Record<
  string,
  { lat: number; lon: number; name: string }
> = {
  JFK: {
    lat: 40.6413,
    lon: -73.7781,
    name: "John F. Kennedy International Airport",
  },
  LAX: {
    lat: 33.9425,
    lon: -118.4081,
    name: "Los Angeles International Airport",
  },
  ORD: { lat: 41.9786, lon: -87.9048, name: "O'Hare International Airport" },
  DFW: {
    lat: 32.8968,
    lon: -97.038,
    name: "Dallas/Fort Worth International Airport",
  },
  DEN: { lat: 39.8561, lon: -104.6737, name: "Denver International Airport" },
  ATL: {
    lat: 33.6407,
    lon: -84.4277,
    name: "Hartsfield-Jackson Atlanta International Airport",
  },
  SEA: {
    lat: 47.4502,
    lon: -122.3088,
    name: "Seattle-Tacoma International Airport",
  },
  MIA: { lat: 25.7959, lon: -80.287, name: "Miami International Airport" },
  PHX: {
    lat: 33.4342,
    lon: -112.0116,
    name: "Phoenix Sky Harbor International Airport",
  },
  LAS: {
    lat: 36.084,
    lon: -115.1537,
    name: "Harry Reid International Airport",
  },
  SFO: {
    lat: 37.6213,
    lon: -122.379,
    name: "San Francisco International Airport",
  },
  BOS: { lat: 42.3656, lon: -71.0096, name: "Logan International Airport" },
  EWR: {
    lat: 40.6895,
    lon: -74.1745,
    name: "Newark Liberty International Airport",
  },
  LGA: { lat: 40.7769, lon: -73.874, name: "LaGuardia Airport" },
  IAH: {
    lat: 29.9902,
    lon: -95.3368,
    name: "George Bush Intercontinental Airport",
  },
  MCO: { lat: 28.4312, lon: -81.3081, name: "Orlando International Airport" },
  CLT: {
    lat: 35.2144,
    lon: -80.9473,
    name: "Charlotte Douglas International Airport",
  },
  DTW: {
    lat: 42.2162,
    lon: -83.3554,
    name: "Detroit Metropolitan Wayne County Airport",
  },
  MSP: {
    lat: 44.8848,
    lon: -93.2223,
    name: "Minneapolis-Saint Paul International Airport",
  },
  PHL: {
    lat: 39.8729,
    lon: -75.2437,
    name: "Philadelphia International Airport",
  },
};

export class FlightAwareService {
  private apiKey: string;
  private baseUrl = "https://aeroapi.flightaware.com/aeroapi";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FLIGHTAWARE_API_KEY || "";
  }

  async getFlightRoute(flightNumber: string): Promise<FlightRoute | null> {
    if (!this.apiKey) {
      console.warn(
        "FlightAware API key not provided, falling back to mock data",
      );
      return this.getMockRoute(flightNumber);
    }

    try {
      // First, get flight information
      const flightInfo = await this.getFlightInfo(flightNumber);
      if (!flightInfo) {
        console.warn(`No flight data found for ${flightNumber}`);
        return this.getMockRoute(flightNumber);
      }

      // Get flight track if available
      let track: FlightAwarePosition[] = [];
      if (flightInfo.fa_flight_id) {
        try {
          const trackData = await this.getFlightTrack(flightInfo.fa_flight_id);
          track = trackData.positions || [];
        } catch (error) {
          console.warn(`Could not fetch track for ${flightNumber}:`, error);
        }
      }

      return {
        flightNumber: flightInfo.ident_iata || flightInfo.ident,
        from: {
          iata: flightInfo.origin.code_iata,
          icao: flightInfo.origin.code_icao,
          name: flightInfo.origin.name,
          coordinates: this.getAirportCoordinates(flightInfo.origin.code_iata),
        },
        to: {
          iata: flightInfo.destination.code_iata,
          icao: flightInfo.destination.code_icao,
          name: flightInfo.destination.name,
          coordinates: this.getAirportCoordinates(
            flightInfo.destination.code_iata,
          ),
        },
        airline: {
          name: flightInfo.operator,
          iata: flightInfo.operator_iata,
        },
        status: this.determineFlightStatus(flightInfo),
        livePosition: this.getCurrentPosition(track),
        route: flightInfo.route,
        track: track,
      };
    } catch (error) {
      console.error("Error fetching flight data from FlightAware:", error);
      return this.getMockRoute(flightNumber);
    }
  }

  private async getFlightInfo(
    flightNumber: string,
  ): Promise<FlightAwareFlight | null> {
    const url = `${this.baseUrl}/flights/${flightNumber}`;
    const response = await fetch(url, {
      headers: {
        "x-apikey": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("FlightAware API rate limit exceeded, using mock data");
        return null; // Return null instead of mock route
      }
      throw new Error(`FlightAware API error: ${response.status}`);
    }

    const data: FlightAwareResponse = await response.json();

    if (!data.flights || data.flights.length === 0) {
      return null;
    }

    // Return the most recent flight
    return data.flights[0];
  }

  private async getFlightTrack(faFlightId: string): Promise<FlightAwareTrack> {
    const url = `${this.baseUrl}/flights/${faFlightId}/track`;
    const response = await fetch(url, {
      headers: {
        "x-apikey": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`FlightAware Track API error: ${response.status}`);
    }

    return await response.json();
  }

  private getAirportCoordinates(
    iata: string,
  ): { lat: number; lon: number } | undefined {
    const airport = AIRPORT_COORDINATES[iata];
    return airport ? { lat: airport.lat, lon: airport.lon } : undefined;
  }

  private determineFlightStatus(
    flight: FlightAwareFlight,
  ): "scheduled" | "live" | "landed" | "cancelled" | "unknown" {
    if (flight.cancelled) {
      return "cancelled";
    }

    if (flight.actual_in) {
      return "landed";
    }

    if (flight.actual_off && !flight.actual_in) {
      return "live";
    }

    if (flight.actual_out && !flight.actual_off) {
      return "live";
    }

    return "scheduled";
  }

  private getCurrentPosition(
    track: FlightAwarePosition[],
  ):
    | { lat: number; lon: number; altitude: number; updated: string }
    | undefined {
    if (track.length === 0) {
      return undefined;
    }

    // Get the most recent position
    const latestPosition = track[track.length - 1];

    return {
      lat: latestPosition.latitude,
      lon: latestPosition.longitude,
      altitude: latestPosition.altitude,
      updated: latestPosition.timestamp,
    };
  }

  private getMockRoute(flightNumber: string): FlightRoute {
    // Fallback to mock data when API is not available
    const airports = Object.keys(AIRPORT_COORDINATES);
    const hash = flightNumber
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fromIata = airports[hash % airports.length];
    const toIata = airports[(hash + 1) % airports.length];

    const fromAirport = AIRPORT_COORDINATES[fromIata];
    const toAirport = AIRPORT_COORDINATES[toIata];

    return {
      flightNumber,
      from: {
        iata: fromIata,
        icao: fromIata, // Mock ICAO
        name: fromAirport.name,
        coordinates: { lat: fromAirport.lat, lon: fromAirport.lon },
      },
      to: {
        iata: toIata,
        icao: toIata, // Mock ICAO
        name: toAirport.name,
        coordinates: { lat: toAirport.lat, lon: toAirport.lon },
      },
      airline: {
        name: "Mock Airlines",
        iata: "MA",
      },
      status: "scheduled",
    };
  }
}

export type { FlightRoute, FlightAwarePosition };
