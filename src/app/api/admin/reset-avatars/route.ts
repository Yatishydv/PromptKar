import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * POST /api/admin/reset-avatars
 * 
 * Audits all users and resets their avatar to the default if they have a custom
 * uploaded Google/custom photo but do not meet the 365-day streak requirement
 * (and are not admins).
 */
export async function POST(request: Request) {
  try {
    await dbConnect();

    // Auth Check
    const requesterId = request.headers.get('x-requester-id');
    const requesterEmail = request.headers.get('x-requester-email');
    const requesterName = request.headers.get('x-requester-name');
    
    if (requesterId && requesterEmail !== "yatishydv@gmail.com") {
      const PendingAction = (await import("@/models/PendingAction")).default;
      await PendingAction.create({
        actionType: 'RESET_AVATARS',
        payload: {},
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
    }

    // Fetch all users
    const allUsers = await User.find({}).lean();
    
    let updatedCount = 0;
    let auditedCount = 0;

    for (const user of allUsers) {
      auditedCount++;
      const isAdmin = user.isAdmin || user.email === "yatishydv@gmail.com";
      const streak = user.currentStreak || 0;
      const avatar = user.avatar || "";
      const name = user.name || "User";

      // If they are admin or have a streak >= 365, they are allowed to have any photo
      if (isAdmin || streak >= 365) continue;

      // Define allowed avatar prefixes that don't require the 365 day streak.
      // E.g., ui-avatars (default), robohash, dicebear
      const isAllowedBaseAvatar = 
        avatar.includes("ui-avatars.com") || 
        avatar.includes("robohash.org") || 
        avatar.includes("api.dicebear.com");

      if (!isAllowedBaseAvatar && avatar !== "") {
        // This means they have a Google photo or some custom URL but they don't have the streak for it!
        // Reset them back to the default UI avatar.
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366F1&color=fff`;

        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { avatar: defaultAvatar } }
        );
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Audit complete! Scanned ${auditedCount} users, stripped unauthorized photos from ${updatedCount} user(s).`,
      usersAudited: auditedCount,
      usersFixed: updatedCount,
    });
  } catch (error: any) {
    console.error("Reset Avatars Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
