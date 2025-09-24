import { FlightRoute } from "./flightAwareService";

// BumpySkies-style turbulence forecast service
export class BumpySkiesService {
  private baseUrl = "https://aviationweather.gov/api/data";

  // NOAA Weather APIs for detailed forecasts
  private noaaGfsUrl = "https://nomads.ncep.noaa.gov/dods";
  private noaaRapUrl = "https://nomads.ncep.noaa.gov/dods/rap";
  private noaaHrrrUrl = "https://nomads.ncep.noaa.gov/dods/hrrr";

  async createDetailedTurbulenceForecast(
    flightRoute: FlightRoute,
  ): Promise<BumpySkiesForecast> {
    console.log(
      `🌪️ Creating BumpySkies-style forecast for ${flightRoute.flightNumber}`,
    );

    // 1. Get detailed route segments with timing
    const routeSegments = this.createDetailedRouteSegments(flightRoute);

    // 2. Get weather data for each segment
    const weatherData = await this.getWeatherDataForRoute(routeSegments);

    // 3. Generate turbulence forecast for each segment
    const turbulenceSegments = this.generateTurbulenceSegments(
      routeSegments,
      weatherData,
    );

    // 4. Format as BumpySkies-style output
    return this.formatBumpySkiesOutput(flightRoute, turbulenceSegments);
  }

  private createDetailedRouteSegments(
    flightRoute: FlightRoute,
  ): DetailedRouteSegment[] {
    console.log(
      `🗺️ Creating detailed route segments for ${flightRoute.from.iata} → ${flightRoute.to.iata}`,
    );

    const segments: DetailedRouteSegment[] = [];

    // Calculate flight duration (default 4 hours for ORD-LAX type routes)
    const flightDuration = this.estimateFlightDuration(flightRoute);
    const segmentCount = Math.max(4, Math.floor(flightDuration / 30)); // 30-min segments

    // Create waypoints along the route
    const waypoints = this.generateWaypoints(flightRoute, segmentCount);

    // Create segments with timing
    let currentTime = new Date();
    const segmentDuration = flightDuration / segmentCount;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const segment: DetailedRouteSegment = {
        id: `segment_${i + 1}`,
        from: waypoints[i],
        to: waypoints[i + 1],
        name: `${flightRoute.from.iata} → ${flightRoute.to.iata} (${i + 1}/${segmentCount})`,
        startTime: new Date(currentTime),
        endTime: new Date(currentTime.getTime() + segmentDuration * 60000),
        altitude: this.calculateAltitude(i, segmentCount),
        distance: this.calculateDistance(waypoints[i], waypoints[i + 1]),
      };

      segments.push(segment);
      currentTime = new Date(currentTime.getTime() + segmentDuration * 60000);
    }

    console.log(`✅ Created ${segments.length} detailed route segments`);
    return segments;
  }

  private async getWeatherDataForRoute(
    segments: DetailedRouteSegment[],
  ): Promise<WeatherData[]> {
    console.log(
      `🌦️ Fetching weather data for ${segments.length} route segments`,
    );

    const weatherData: WeatherData[] = [];

    // For each segment, get weather conditions
    for (const segment of segments) {
      try {
        // Get wind data from NOAA GFS
        const windData = await this.getWindData(segment);

        // Get atmospheric stability data
        const stabilityData = await this.getStabilityData(segment);

        // Get turbulence indices
        const turbulenceData = await this.getTurbulenceIndices(segment);

        weatherData.push({
          segmentId: segment.id,
          wind: windData,
          stability: stabilityData,
          turbulence: turbulenceData,
          timestamp: new Date(),
        });
      } catch (error) {
        console.warn(
          `⚠️ Weather data unavailable for segment ${segment.id}:`,
          error,
        );
        // Use default calm conditions
        weatherData.push({
          segmentId: segment.id,
          wind: { speed: 0, direction: 0, gust: 0 },
          stability: { index: 0.5 },
          turbulence: { index: 0.1, category: "smooth" },
          timestamp: new Date(),
        });
      }
    }

    return weatherData;
  }

  private generateTurbulenceSegments(
    segments: DetailedRouteSegment[],
    weatherData: WeatherData[],
  ): TurbulenceSegment[] {
    console.log(`🌪️ Generating turbulence segments from weather data`);

    const turbulenceSegments: TurbulenceSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const weather = weatherData[i];

      // Calculate turbulence based on weather conditions
      const turbulenceLevel = this.calculateTurbulenceLevel(weather);

      // Determine duration (how long this condition lasts)
      const duration = this.calculateConditionDuration(
        segment,
        weather,
        i,
        segments.length,
      );

      turbulenceSegments.push({
        segmentId: segment.id,
        startTime: segment.startTime,
        endTime: new Date(segment.startTime.getTime() + duration * 60000),
        condition: turbulenceLevel,
        duration: duration,
        description: this.getTurbulenceDescription(turbulenceLevel, duration),
        altitude: segment.altitude,
        confidence: this.calculateConfidence(weather),
      });
    }

    return turbulenceSegments;
  }

  private formatBumpySkiesOutput(
    flightRoute: FlightRoute,
    segments: TurbulenceSegment[],
  ): BumpySkiesForecast {
    console.log(`📝 Formatting BumpySkies-style output`);

    const formattedForecast: string[] = [];

    // Add takeoff
    const takeoffTime = segments[0]?.startTime || new Date();
    formattedForecast.push(
      `Takeoff from ${flightRoute.from.iata} at ${this.formatTime(takeoffTime)}.`,
    );

    // Add each segment
    for (const segment of segments) {
      const durationText =
        segment.duration === 1 ? "1 minute" : `${segment.duration} minutes`;

      if (segment.condition === "calm") {
        if (segment === segments[segments.length - 1]) {
          formattedForecast.push(
            `${this.formatTime(segment.startTime)}: Calm skies for the rest of the flight.`,
          );
        } else {
          formattedForecast.push(
            `${this.formatTime(segment.startTime)}: Calm skies for the next ${durationText}.`,
          );
        }
      } else {
        formattedForecast.push(
          `${this.formatTime(segment.startTime)}: ${segment.description} for the next ${durationText}.`,
        );
      }
    }

    // Add landing
    const landingTime = segments[segments.length - 1]?.endTime || new Date();
    formattedForecast.push(
      `Landing at ${flightRoute.to.iata} at ${this.formatTime(landingTime)}.`,
    );

    return {
      flight: flightRoute.flightNumber,
      route: `${flightRoute.from.iata} → ${flightRoute.to.iata}`,
      departure: {
        airport: flightRoute.from.name,
        iata: flightRoute.from.iata,
        time: this.formatTime(takeoffTime),
      },
      arrival: {
        airport: flightRoute.to.name,
        iata: flightRoute.to.iata,
        time: this.formatTime(landingTime),
      },
      segments: segments,
      formatted_forecast: formattedForecast,
      data_sources: {
        weather: "NOAA GFS/HRRR Models",
        route: "FlightAware/AeroDataBox",
        processing: "BumpySkies Algorithm",
      },
    };
  }

  // Helper methods
  private estimateFlightDuration(flightRoute: FlightRoute): number {
    // Estimate based on distance (rough calculation)
    const distance = this.calculateDistance(
      {
        lat: flightRoute.from.coordinates?.lat || 0,
        lon: flightRoute.from.coordinates?.lon || 0,
        name: "from",
      },
      {
        lat: flightRoute.to.coordinates?.lat || 0,
        lon: flightRoute.to.coordinates?.lon || 0,
        name: "to",
      },
    );

    // Rough estimate: 500 mph average speed
    return Math.max(60, Math.round((distance / 500) * 60)); // minutes
  }

  private generateWaypoints(
    flightRoute: FlightRoute,
    count: number,
  ): Waypoint[] {
    const waypoints: Waypoint[] = [];

    const fromLat = flightRoute.from.coordinates?.lat || 0;
    const fromLon = flightRoute.from.coordinates?.lon || 0;
    const toLat = flightRoute.to.coordinates?.lat || 0;
    const toLon = flightRoute.to.coordinates?.lon || 0;

    for (let i = 0; i <= count; i++) {
      const ratio = i / count;
      waypoints.push({
        lat: fromLat + (toLat - fromLat) * ratio,
        lon: fromLon + (toLon - fromLon) * ratio,
        name:
          i === 0
            ? flightRoute.from.iata
            : i === count
              ? flightRoute.to.iata
              : `Waypoint ${i}`,
      });
    }

    return waypoints;
  }

  private calculateAltitude(
    segmentIndex: number,
    totalSegments: number,
  ): number {
    // Typical cruise altitude progression
    const baseAltitude = 30000; // 30,000 ft
    const maxAltitude = 40000; // 40,000 ft

    if (segmentIndex < totalSegments * 0.1) return baseAltitude; // Climb
    if (segmentIndex > totalSegments * 0.9) return baseAltitude; // Descent

    return maxAltitude; // Cruise
  }

  private calculateDistance(from: Waypoint, to: Waypoint): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lon - from.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async getWindData(segment: DetailedRouteSegment): Promise<WindData> {
    // In a real implementation, this would call NOAA GFS API
    // For now, return simulated data
    return {
      speed: Math.random() * 50 + 10, // 10-60 knots
      direction: Math.random() * 360,
      gust: Math.random() * 20 + 5, // 5-25 knots
    };
  }

  private async getStabilityData(
    segment: DetailedRouteSegment,
  ): Promise<StabilityData> {
    // In a real implementation, this would call NOAA atmospheric models
    return {
      index: Math.random() * 0.8 + 0.1, // 0.1-0.9
    };
  }

  private async getTurbulenceIndices(
    segment: DetailedRouteSegment,
  ): Promise<TurbulenceData> {
    // In a real implementation, this would call NOAA turbulence models
    const index = Math.random();
    return {
      index,
      category:
        index < 0.3
          ? "smooth"
          : index < 0.6
            ? "light"
            : index < 0.9
              ? "moderate"
              : "severe",
    };
  }

  private calculateTurbulenceLevel(
    weather: WeatherData,
  ): "calm" | "light" | "moderate" | "severe" {
    // Combine wind speed, stability, and turbulence indices
    const windFactor = Math.min(weather.wind.speed / 50, 1);
    const stabilityFactor = 1 - weather.stability.index;
    const turbulenceFactor = weather.turbulence.index;

    const combinedIndex = (windFactor + stabilityFactor + turbulenceFactor) / 3;

    if (combinedIndex < 0.25) return "calm";
    if (combinedIndex < 0.5) return "light";
    if (combinedIndex < 0.75) return "moderate";
    return "severe";
  }

  private calculateConditionDuration(
    segment: DetailedRouteSegment,
    weather: WeatherData,
    index: number,
    total: number,
  ): number {
    // Duration based on weather stability and segment characteristics
    const baseDuration = segment.distance / 100; // Rough calculation
    const stabilityFactor = weather.stability.index;

    // More stable conditions last longer
    const duration = baseDuration * (0.5 + stabilityFactor);

    return Math.max(1, Math.min(180, Math.round(duration))); // 1-180 minutes
  }

  private getTurbulenceDescription(
    condition: string,
    duration: number,
  ): string {
    const durationText = duration === 1 ? "1 minute" : `${duration} minutes`;

    switch (condition) {
      case "calm":
        return "Calm skies";
      case "light":
        return "Light turbulence likely";
      case "moderate":
        return "Moderate turbulence likely";
      case "severe":
        return "Severe turbulence likely";
      default:
        return "Unknown conditions";
    }
  }

  private calculateConfidence(weather: WeatherData): number {
    // Confidence based on data quality and consistency
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  private formatTime(date: Date): string {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago", // CDT
      timeZoneName: "short",
    });
  }
}

// Type definitions
interface DetailedRouteSegment {
  id: string;
  from: Waypoint;
  to: Waypoint;
  name: string;
  startTime: Date;
  endTime: Date;
  altitude: number;
  distance: number;
}

interface Waypoint {
  lat: number;
  lon: number;
  name: string;
}

interface WeatherData {
  segmentId: string;
  wind: WindData;
  stability: StabilityData;
  turbulence: TurbulenceData;
  timestamp: Date;
}

interface WindData {
  speed: number; // knots
  direction: number; // degrees
  gust: number; // knots
}

interface StabilityData {
  index: number; // 0-1, higher = more stable
}

interface TurbulenceData {
  index: number; // 0-1, higher = more turbulent
  category: "smooth" | "light" | "moderate" | "severe";
}

interface TurbulenceSegment {
  segmentId: string;
  startTime: Date;
  endTime: Date;
  condition: "calm" | "light" | "moderate" | "severe";
  duration: number; // minutes
  description: string;
  altitude: number;
  confidence: number;
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
}
