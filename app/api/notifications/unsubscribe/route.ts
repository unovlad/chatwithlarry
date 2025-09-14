import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // In a production environment, you would remove this subscription from your database
    console.log("Push unsubscription received:", subscription);

    // You could remove it from a database like this:
    // await db.pushSubscriptions.delete({
    //   where: {
    //     endpoint: subscription.endpoint,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove subscription" },
      { status: 500 },
    );
  }
}
