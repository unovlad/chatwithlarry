interface PIREPFeature {
  receiptTime: string;
  obsTime: number;
  qcField: number;
  icaoId: string;
  acType: string;
  lat: number;
  lon: number;
  fltLvl: number;
  fltLvlType: string;
  clouds: Array<{
    cover: string;
    base: number;
    top: number;
  }> | null;
  visib: number | null;
  wxString: string;
  temp: number | null;
  wdir: number | null;
  wspd: number | null;
  icgBas1: number | null;
  icgTop1: number | null;
  icgInt1: string;
  icgType1: string;
  icgBas2: number | null;
  icgTop2: number | null;
  icgInt2: string;
  icgType2: string;
  tbBas1: number | null;
  tbTop1: number | null;
  tbInt1: string;
  tbType1: string;
  tbFreq1: string;
  tbBas2: number | null;
  tbTop2: number | null;
  tbInt2: string;
  tbType2: string;
  tbFreq2: string;
  vertGust: number | null;
  brkAction: string;
  pirepType: string;
  rawOb: string;
}

type PIREPResponse = PIREPFeature[];

interface TurbulenceReport {
  id: string;
  coordinates: { lat: number; lon: number };
  altitude: number;
  intensity: "smooth" | "light" | "moderate" | "severe";
  type: "CAT" | "CHOP" | "NEG";
  frequency: "OCNL" | "CONT" | "NEG";
  reportTime: string;
  distance: number; // Distance from route segment in km
}

interface RouteSegment {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  name: string;
}

export class NOAAPirepsService {
  private baseUrl = "https://aviationweather.gov/api/data/pirep";
  private maxDistanceKm = 200; // Maximum distance to consider turbulence reports

  async getTurbulenceReports(
    segments: RouteSegment[],
  ): Promise<TurbulenceReport[]> {
    try {
      // Create bounding box from route segments
      const bbox = this.createBoundingBox(segments);
      // Note: NOAA API may not support bbox parameter, fallback to global if needed
      const url = `${this.baseUrl}?format=json&bbox=${bbox}`;

      console.log(`🌪️  Fetching PIREPs from: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TurbulenceForecastAPI/1.0",
        },
      });

      if (!response.ok) {
        console.warn(
          `NOAA PIREPs API error: ${response.status} - ${response.statusText}`,
        );
        // Try fallback to global bounding box if bbox parameter failed
        if (bbox !== "-180,-90,180,90") {
          console.log("🔄 Trying fallback to global bounding box...");
          const fallbackUrl = `${this.baseUrl}?format=json`;
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              "User-Agent": "TurbulenceForecastAPI/1.0",
            },
          });

          if (fallbackResponse.ok) {
            const fallbackText = await fallbackResponse.text();
            if (fallbackText && fallbackText.trim() !== "") {
              try {
                const fallbackPireps = JSON.parse(fallbackText);
                console.log(
                  `✅ Fallback successful: got ${fallbackPireps.length} PIREPs globally`,
                );
                return this.processPirepsData(fallbackPireps, segments);
              } catch (parseError) {
                console.error("❌ Fallback parse error:", parseError);
              }
            }
          }
        }
        return []; // Return empty array instead of throwing error
      }

      const responseText = await response.text();
      console.log(`📊 NOAA API response length: ${responseText.length}`);

      if (!responseText || responseText.trim() === "") {
        console.log(`⚠️  NOAA API returned empty response`);
        return [];
      }

      let pireps: PIREPFeature[];
      try {
        pireps = JSON.parse(responseText);
        console.log(`✅ Successfully parsed ${pireps.length} PIREPs from NOAA`);
      } catch (parseError) {
        console.error(`❌ Failed to parse NOAA API response:`, parseError);
        console.log(`Response preview: ${responseText.substring(0, 200)}...`);
        return [];
      }

      return this.processPirepsData(pireps, segments);
    } catch (error) {
      console.error("Error fetching PIREPs data from NOAA:", error);
      return [];
    }
  }

  private createBoundingBox(segments: RouteSegment[], bufferDeg = 2): string {
    if (segments.length === 0) {
      console.warn("⚠️ No segments provided, using global bounding box");
      return "-180,-90,180,90";
    }

    let minLat = Infinity,
      minLon = Infinity;
    let maxLat = -Infinity,
      maxLon = -Infinity;

    // Find bounds from all route segments
    segments.forEach((segment) => {
      [segment.from, segment.to].forEach((point) => {
        if (point.lat < minLat) minLat = point.lat;
        if (point.lat > maxLat) maxLat = point.lat;
        if (point.lon < minLon) minLon = point.lon;
        if (point.lon > maxLon) maxLon = point.lon;
      });
    });

    // Add buffer and clamp to valid ranges
    minLat = Math.max(-90, minLat - bufferDeg);
    maxLat = Math.min(90, maxLat + bufferDeg);
    minLon = Math.max(-180, minLon - bufferDeg);
    maxLon = Math.min(180, maxLon + bufferDeg);

    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    console.log(
      `🗺️ Created bounding box for route: ${bbox} (buffer: ±${bufferDeg}°)`,
    );

    return bbox;
  }

  private mapTurbulenceIntensity(
    noaaIntensity: string,
  ): "smooth" | "light" | "moderate" | "severe" {
    switch (noaaIntensity.toUpperCase()) {
      case "NEG":
        return "smooth";
      case "LGT":
        return "light";
      case "MOD":
        return "moderate";
      case "SEV":
      case "EXT":
        return "severe";
      default:
        return "smooth";
    }
  }

  private calculateDistanceToSegment(
    point: { lat: number; lon: number },
    segmentStart: { lat: number; lon: number },
    segmentEnd: { lat: number; lon: number },
  ): number {
    // Calculate distance from point to line segment using the formula for distance from point to line
    const A = point.lat - segmentStart.lat;
    const B = point.lon - segmentStart.lon;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lon - segmentStart.lon;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) {
      // Segment is a point
      return this.calculateHaversineDistance(point, segmentStart);
    }

    let param = dot / lenSq;

    let xx: number, yy: number;

    if (param < 0) {
      xx = segmentStart.lat;
      yy = segmentStart.lon;
    } else if (param > 1) {
      xx = segmentEnd.lat;
      yy = segmentEnd.lon;
    } else {
      xx = segmentStart.lat + param * C;
      yy = segmentStart.lon + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lon - yy;

    return this.calculateHaversineDistance(point, { lat: xx, lon: yy });
  }

  private calculateHaversineDistance(
    point1: { lat: number; lon: number },
    point2: { lat: number; lon: number },
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lon - point1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private processPirepsData(
    pireps: PIREPFeature[],
    segments: RouteSegment[],
  ): TurbulenceReport[] {
    console.log(`📊 Processing ${pireps.length} PIREPs from NOAA`);

    if (pireps.length === 0) {
      console.log(`⚠️  No PIREPs found in the specified area and time range`);
      return [];
    }

    // Count reports with turbulence data
    const turbulencePireps = pireps.filter(
      (pirep) => pirep.tbInt1 && pirep.tbInt1 !== "" && pirep.tbInt1 !== "NEG",
    );
    console.log(
      `🌪️  Found ${turbulencePireps.length} PIREPs with turbulence data out of ${pireps.length} total PIREPs`,
    );

    if (turbulencePireps.length === 0) {
      console.log(
        `⚠️  No turbulence PIREPs found within route area. Consider fallback to GFS/NOMADS forecast.`,
      );
      return [];
    }

    const turbulenceReports: TurbulenceReport[] = [];

    for (const pirep of turbulencePireps) {
      console.log(
        `   Processing turbulence report: ${pirep.tbInt1} at (${pirep.lat}, ${pirep.lon})`,
      );

      const coordinates = {
        lat: pirep.lat,
        lon: pirep.lon,
      };

      // Find the closest segment
      let closestSegment: RouteSegment | null = null;
      let minDistance = Infinity;

      for (const segment of segments) {
        const distance = this.calculateDistanceToSegment(
          coordinates,
          segment.from,
          segment.to,
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestSegment = segment;
        }
      }

      // Only include reports within our radius
      if (minDistance <= this.maxDistanceKm && closestSegment) {
        console.log(
          `   ✅ Including ${pirep.tbInt1} turbulence at ${pirep.fltLvl * 100}ft, ${minDistance.toFixed(1)}km from route`,
        );
        turbulenceReports.push({
          id: `${pirep.icaoId}-${pirep.obsTime}`,
          coordinates,
          altitude: pirep.fltLvl * 100, // Convert flight level to feet
          intensity: this.mapTurbulenceIntensity(pirep.tbInt1),
          type: pirep.tbType1 as "CAT" | "CHOP" | "NEG",
          frequency: pirep.tbFreq1 as "OCNL" | "CONT" | "NEG",
          reportTime: new Date(pirep.obsTime * 1000).toISOString(),
          distance: minDistance,
        });
      } else {
        console.log(
          `   ❌ Excluding ${pirep.tbInt1} turbulence at ${pirep.fltLvl * 100}ft, ${minDistance.toFixed(1)}km from route (max: ${this.maxDistanceKm}km)`,
        );
      }
    }

    console.log(
      `🌪️  Found ${turbulenceReports.length} turbulence reports within ${this.maxDistanceKm}km of route`,
    );
    return turbulenceReports;
  }

  // Generate route segments between airports
  generateRouteSegments(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    segmentName: string,
  ): RouteSegment[] {
    // For simplicity, create a single segment between airports
    // In a real implementation, you might want to create multiple waypoints
    // based on actual flight routes or airways

    return [
      {
        from,
        to,
        name: segmentName,
      },
    ];
  }

  // Generate multiple segments for longer routes
  generateMultiSegmentRoute(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    fromIata: string,
    toIata: string,
  ): RouteSegment[] {
    const distance = this.calculateHaversineDistance(from, to);

    // If distance is less than 1000km, use single segment
    if (distance < 1000) {
      return this.generateRouteSegments(from, to, `${fromIata} → ${toIata}`);
    }

    // For longer routes, create intermediate waypoints
    const numSegments = Math.min(Math.ceil(distance / 500), 4); // Max 4 segments
    const segments: RouteSegment[] = [];

    for (let i = 0; i < numSegments; i++) {
      const startLat = from.lat + (to.lat - from.lat) * (i / numSegments);
      const startLon = from.lon + (to.lon - from.lon) * (i / numSegments);
      const endLat = from.lat + (to.lat - from.lat) * ((i + 1) / numSegments);
      const endLon = from.lon + (to.lon - from.lon) * ((i + 1) / numSegments);

      const segmentName =
        i === numSegments - 1
          ? `${fromIata} → ${toIata}`
          : `${fromIata} → ${toIata} (${i + 1}/${numSegments})`;

      segments.push({
        from: { lat: startLat, lon: startLon },
        to: { lat: endLat, lon: endLon },
        name: segmentName,
      });
    }

    return segments;
  }
}

export type { TurbulenceReport, RouteSegment };
