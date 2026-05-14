import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userId, resetAll } = await request.json();

    if (resetAll) {
      const result = await User.updateMany(
        {},
        {
          $set: {
            currentStreak: 0,
            activityDates: [],
            lastActiveAt: new Date(0)
          }
        }
      );
      return NextResponse.json({ 
        message: "All streaks reset to 0", 
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
