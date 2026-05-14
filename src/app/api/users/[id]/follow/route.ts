import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params; // Target user's firebaseUid
    const { followerId } = await request.json();

    if (!followerId) {
      return NextResponse.json({ error: "Follower ID required" }, { status: 400 });
    }

    if (id === followerId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findOne({ firebaseUid: id });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const alreadyFollowing = targetUser.followers?.includes(followerId) ?? false;

    if (alreadyFollowing) {
      // Unfollow
      await User.findOneAndUpdate({ firebaseUid: id }, { $pull: { followers: followerId } });
      await User.findOneAndUpdate({ firebaseUid: followerId }, { $pull: { following: id } });

      // Remove Notification on Unfollow
      await Notification.findOneAndDelete({
        recipientId: id,
        senderId: followerId,
        type: 'follow'
      });

      return NextResponse.json({ isFollowing: false, message: "Unfollowed successfully" });
    } else {
      // Follow
      await User.findOneAndUpdate({ firebaseUid: id }, { $addToSet: { followers: followerId } });
      await User.findOneAndUpdate({ firebaseUid: followerId }, { $addToSet: { following: id } });

      // Trigger Notification
      const follower = await User.findOne({ firebaseUid: followerId }).select('name username avatar').lean();
      if (follower) {
        await Notification.findOneAndUpdate(
          {
            recipientId: id,
            senderId: followerId,
            type: 'follow'
          },
          {
            senderName: follower.name || "Someone",
            senderUsername: follower.username || follower.name || "someone",
            senderAvatar: follower.avatar || "",
            targetId: followerId,
            isRead: false,
            createdAt: new Date()
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({ isFollowing: true, message: "Followed successfully" });
    }
  } catch (error: any) {
    console.error("Follow API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
