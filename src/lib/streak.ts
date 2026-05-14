import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

/**
 * Updates a user's activity streak.
 * Call this whenever a user performs a key action.
 */
export async function updateStreak(firebaseUid: string) {
  console.log(`[STREAK] Update requested for ${firebaseUid} at ${new Date().toISOString()}`);
  try {
    await dbConnect();
    const user = await User.findOne({ firebaseUid });
    if (!user) return null;

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Check if already active today
    if (user.activityDates.includes(today)) {
      return user.currentStreak;
    }

    // Check if active yesterday
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    let newStreak = 1;
    if (user.activityDates.includes(yesterday)) {
      newStreak = user.currentStreak + 1;
    }

    // Keep only the last 30 days of activity to keep document small
    const updatedActivityDates = [...user.activityDates, today].slice(-30);

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: { 
          currentStreak: newStreak,
          lastActiveAt: now,
          activityDates: updatedActivityDates
        }
      },
      { new: true }
    );

    return updatedUser.currentStreak;
  } catch (error) {
    console.error("Streak Update Error:", error);
    return null;
  }
}
