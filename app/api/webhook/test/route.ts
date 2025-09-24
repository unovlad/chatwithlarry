import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== TEST WEBHOOK RECEIVED ===");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.text();
    console.log("Body:", body);

    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      bodyLength: body.length,
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json({ error: "Test webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test webhook endpoint is working",
    timestamp: new Date().toISOString(),
  });
}



