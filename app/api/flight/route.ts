import { NextRequest, NextResponse } from "next/server";

const API_HOST = "aerodatabox.p.rapidapi.com";

export async function GET(req: NextRequest) {
  try {
    console.log("🛫 Flight API: Starting request");

    const { searchParams } = new URL(req.url);
    const flightNumber = searchParams.get("flightNumber");
    const withAircraftImage = searchParams.get("withAircraftImage") || "false";
    const withLocation = searchParams.get("withLocation") || "false";

    if (!flightNumber) {
      console.log("❌ Flight API: Missing flight number");
      return NextResponse.json(
        { error: "Missing required query param: flightNumber" },
        { status: 400 },
      );
    }

    const url = `https://${API_HOST}/flights/number/${flightNumber}?withAircraftImage=${withAircraftImage}&withLocation=${withLocation}`;

    console.log("🛫 Flight API: Flight number:", flightNumber);
    console.log("🛫 Flight API: URL:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": "91d95ae2d8mshb1dca2ef9fe542ep1c9b8cjsn3d640413bd67",
        "x-rapidapi-host": API_HOST,
      },
      cache: "no-store",
    });

    console.log("🛫 Flight API: Response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ Flight API: AeroDataBox API failed:", text);
      return NextResponse.json(
        { error: "AeroDataBox API failed", details: text },
        { status: res.status },
      );
    }

    const data = await res.json();
    console.log("✅ Flight API: Successfully received data:", {
      flightNumber,
      dataLength: JSON.stringify(data).length,
      source: "AeroDataBox",
    });

    return NextResponse.json({
      flightNumber,
      data,
      source: "AeroDataBox",
    });
  } catch (err) {
    console.log("💥 Flight API: Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error", details: `${err}` },
      { status: 500 },
    );
  }
}
