import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Prompt from "@/models/Prompt";

/**
 * POST /api/admin/recalculate-likes
 * 
 * Recalculates totalLikes for ALL users by summing up the actual
 * likedBy array lengths across all their prompts.
 * This fixes any drift between the cached totalLikes counter and reality.
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
        actionType: 'RECALCULATE_LIKES',
        payload: {},
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
    }

    // Aggregate: group all prompts by authorId, sum the likedBy array lengths
    const likesPerAuthor = await Prompt.aggregate([
      {
        $project: {
          authorId: 1,
          actualLikes: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      {
        $group: {
          _id: "$authorId",
          totalLikes: { $sum: "$actualLikes" }
        }
      }
    ]);

    // Build a map: authorId -> correct totalLikes
    const likesMap: Record<string, number> = {};
    for (const entry of likesPerAuthor) {
      if (entry._id) {
        likesMap[entry._id] = entry.totalLikes;
      }
    }

    // Get all users
    const allUsers = await User.find({}).select("firebaseUid totalLikes").lean();

    let updatedCount = 0;
    let fixedCount = 0;

    for (const user of allUsers) {
      const correctLikes = likesMap[user.firebaseUid] || 0;
      const currentLikes = user.totalLikes || 0;

      if (currentLikes !== correctLikes) {
        await User.findOneAndUpdate(
          { firebaseUid: user.firebaseUid },
          { $set: { totalLikes: correctLikes } }
        );
        fixedCount++;
      }
      updatedCount++;
    }

    // Also fix the likes counter on each prompt to match likedBy.length
    const allPrompts = await Prompt.find({}).select("likes likedBy").lean();
    let promptsFixed = 0;

    for (const prompt of allPrompts) {
      const actualLikes = prompt.likedBy?.length || 0;
      const storedLikes = prompt.likes || 0;

      if (storedLikes !== actualLikes) {
        await Prompt.findByIdAndUpdate(prompt._id, {
          $set: { likes: actualLikes }
        });
        promptsFixed++;
      }
    }

    return NextResponse.json({
      message: `Recalculation complete! Audited ${updatedCount} users, fixed ${fixedCount} user(s). Also synced ${promptsFixed} prompt(s).`,
      usersAudited: updatedCount,
      usersFixed: fixedCount,
      promptsSynced: promptsFixed,
    });
  } catch (error: any) {
    console.error("Recalculate Likes Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
