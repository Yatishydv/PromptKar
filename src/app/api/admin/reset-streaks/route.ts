import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userId, resetAll } = await request.json();

    // Auth Check
    const requesterId = request.headers.get('x-requester-id');
    const requesterEmail = request.headers.get('x-requester-email');
    const requesterName = request.headers.get('x-requester-name');
    
    if (requesterId && requesterEmail !== "yatishydv@gmail.com") {
      const PendingAction = (await import("@/models/PendingAction")).default;
      await PendingAction.create({
        actionType: 'RESET_STREAKS',
        payload: { userId, resetAll },
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
    }

    // Protection: DO NOT allow the main head admin's streak to be reset
    if (userId) {
      const targetUser = await User.findOne({ $or: [{ firebaseUid: userId }, { username: userId }] }).lean();
      if (targetUser && (targetUser.email === "yatishydv@gmail.com" || targetUser.username?.toLowerCase() === "yatishydv")) {
        return NextResponse.json({ error: "The Head Admin account is completely untouchable." }, { status: 403 });
      }
    }

    if (resetAll) {
      const result = await User.updateMany(
        { email: { $ne: "yatishydv@gmail.com" } }, // Exclude Head Admin from global reset
        {
          $set: {
            currentStreak: 0,
            activityDates: [],
            lastActiveAt: new Date(0)
          }
        }
      );
      return NextResponse.json({ 
        message: "All user streaks reset to 0 (except Head Admin)", 
        count: result.modifiedCount 
      });
    }

    if (userId) {
      const result = await User.findOneAndUpdate(
        { $or: [{ firebaseUid: userId }, { username: userId }] },
        {
          $set: {
            currentStreak: 0,
            activityDates: [],
            lastActiveAt: new Date(0)
          }
        },
        { new: true }
      );
      
      if (!result) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ 
        message: `Streak reset for @${result.username}`,
        user: result
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
