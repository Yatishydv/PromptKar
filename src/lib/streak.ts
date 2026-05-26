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

    // Preserve full activity history
    const updatedActivityDates = [...user.activityDates, today];

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

    // Milestone Hook
    if (newStreak !== user.currentStreak) {
      const milestones = [10, 30, 60, 100, 365];
      if (milestones.includes(newStreak)) {
        // dynamic import or require to avoid circular deps if any, but regular import at top works since it's just a model
        const NotificationModel = (await import("@/models/Notification")).default;
        await NotificationModel.create({
          recipientId: firebaseUid,
          senderId: "system",
          senderName: "PromptKar Admin",
          senderUsername: "system",
          type: "milestone",
          targetId: "streak_milestone",
          message: `Incredible! You've hit a ${newStreak}-day streak! Keep up the great work! 🔥`,
          linkType: "profile",
          linkTarget: updatedUser?.username || "",
          isRead: false,
        });
      }
    }

    return updatedUser?.currentStreak || newStreak;
  } catch (error) {
    console.error("Streak Update Error:", error);
    return null;
  }
}

/**
 * Validates a user's streak and resets it if they missed a day.
 * Does NOT increment the streak, just ensures it's not stale.
 */
export async function validateStreak(firebaseUid: string) {
  try {
    await dbConnect();
    const user = await User.findOne({ firebaseUid });
    if (!user || user.currentStreak === 0) return 0;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    // If active today or yesterday, streak is still alive
    if (user.activityDates.includes(today) || user.activityDates.includes(yesterday)) {
      return user.currentStreak;
    }

    // Missed more than 1 day -> Reset to 0
    console.log(`[STREAK] Resetting streak for ${firebaseUid} (missed yesterday)`);
    await User.updateOne({ firebaseUid }, { $set: { currentStreak: 0 } });
    return 0;
  } catch (error) {
    console.error("Streak Validation Error:", error);
    return 0;
  }
}
