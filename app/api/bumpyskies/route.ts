import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bumpySkiesSchema = z.object({
  airline_code: z.string().min(2).max(3),
  flight_number: z.string().min(1),
});

interface BumpySkiesResponse {
  data: Array<{
    position?: string;
    forecasts?: string[];
  }>;
  scraper_id: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airline_code, flight_number } = bumpySkiesSchema.parse(body);

    // Call parse.bot scraper endpoint
    const response = await fetch(
      "https://api.parse.bot/scraper/b9cee3bd-87a5-4a7f-87dd-096227edfe6b/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.PARSE_BOT_API_KEY || "",
        },
        body: JSON.stringify({
          airline_code,
          flight_number,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Parse.bot API error: ${response.status}`);
    }

    const data: BumpySkiesResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      scraper_id: data.scraper_id,
      status: data.status,
    });
  } catch (error) {
    console.error("BumpySkies API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input parameters",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch turbulence forecast",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const airline_code = searchParams.get("airline");
  const flight_number = searchParams.get("flight");

  if (!airline_code || !flight_number) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing airline or flight parameters",
      },
      { status: 400 },
    );
  }

  try {
    const { airline_code: validatedAirline, flight_number: validatedFlight } =
      bumpySkiesSchema.parse({ airline_code, flight_number });

    // Call parse.bot scraper endpoint
    const response = await fetch(
      "https://api.parse.bot/scraper/b9cee3bd-87a5-4a7f-87dd-096227edfe6b/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.PARSE_BOT_API_KEY || "",
        },
        body: JSON.stringify({
          airline_code: validatedAirline,
          flight_number: validatedFlight,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Parse.bot API error: ${response.status}`);
    }

    const data: BumpySkiesResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      scraper_id: data.scraper_id,
      status: data.status,
    });
  } catch (error) {
    console.error("BumpySkies API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input parameters",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch turbulence forecast",
      },
      { status: 500 },
    );
  }
}
