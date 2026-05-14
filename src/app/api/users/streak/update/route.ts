import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { updateStreak } from "@/lib/streak";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await dbConnect();
    const currentStreak = await updateStreak(userId);
    
    const milestones = [7, 30, 60, 90, 180, 270, 365];
    const reachedMilestone = milestones.includes(currentStreak);

    return NextResponse.json({ 
      streak: currentStreak,
      milestone: reachedMilestone ? currentStreak : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
