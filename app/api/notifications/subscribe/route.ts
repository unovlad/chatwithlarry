import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // In a production environment, you would store this subscription in a database
    // For now, we'll just log it
    console.log("Push subscription received:", subscription);

    // You could store it in a database like this:
    // await db.pushSubscriptions.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys,
    //     userId: user.id, // if you have user authentication
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing push subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store subscription" },
      { status: 500 },
    );
  }
}
