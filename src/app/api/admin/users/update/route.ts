import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sanitize updates - only allow specific fields to be updated by admin
    const allowedUpdates: any = {};
    const allowedKeys = ["isAdmin", "isPro", "role", "customBadge", "customTitle"];
    
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        allowedUpdates[key] = updates[key];
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: allowedUpdates },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `User @${updatedUser.username} updated successfully`, 
      user: updatedUser 
    });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
