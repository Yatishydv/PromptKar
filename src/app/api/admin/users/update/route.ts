import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { userId, updates, requesterEmail, requesterId, requesterName } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isHeadAdmin = requesterEmail === "yatishydv@gmail.com";

    // Protection: DO NOT allow anyone to modify the main head admin
    const targetUser = await User.findOne({ firebaseUid: userId }).lean();
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // If the target is the Head Admin, only the Head Admin can modify it, OR maybe NO ONE can modify it via this API.
    if (targetUser.email === "yatishydv@gmail.com" || targetUser.username?.toLowerCase() === "yatishydv") {
      // Even if Head Admin, maybe we block it, but let's allow Head Admin to modify themselves if they want, but absolutely reject for others.
      if (!isHeadAdmin) {
        return NextResponse.json({ error: "The Head Admin account is completely untouchable by sub-admins." }, { status: 403 });
      }
    }

    if (!isHeadAdmin && requesterId) {
      const PendingAction = (await import("@/models/PendingAction")).default;
      await PendingAction.create({
        actionType: 'UPDATE_USER_ROLE',
        payload: { userId, updates },
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
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
