import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { z } from "zod";

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name is too long"),
});

const deleteProfileSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        { error: "Error fetching profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error("Error in profile fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update profile
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: validatedData.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Error updating profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error in profile update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = deleteProfileSchema.parse(body);

    // Check if email matches user email
    if (validatedData.email !== user.email) {
      return NextResponse.json(
        { error: "Email does not match your account" },
        { status: 400 },
      );
    }

    // Delete all user chats (cascade delete messages)
    const { error: chatsError } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", user.id);

    if (chatsError) {
      console.error("Error deleting user chats:", chatsError);
      return NextResponse.json(
        { error: "Error deleting chats" },
        { status: 500 },
      );
    }

    // Delete user profile
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (userError) {
      console.error("Error deleting user profile:", userError);
      return NextResponse.json(
        { error: "Error deleting profile" },
        { status: 500 },
      );
    }

    // Sign out from account
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error signing out:", signOutError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 },
      );
    }
    console.error("Error in profile deletion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
