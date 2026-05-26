import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { targetAudience, username, message, linkType, linkTarget, senderName, senderAvatar } = body;

    // Verify it's the head admin calling this
    const requesterEmail = request.headers.get("x-requester-email");
    if (requesterEmail !== "yatishydv@gmail.com") {
      return NextResponse.json({ error: "Only Head Admin can broadcast notifications." }, { status: 403 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const baseNotification = {
      senderId: "system_admin",
      senderName: senderName || "PromptKar Admin",
      senderUsername: "admin",
      senderAvatar: senderAvatar || "https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff",
      type: "admin_message" as const,
      targetId: "broadcast",
      message,
      linkType: linkType || "none",
      linkTarget: linkTarget || "",
      isRead: false,
    };

    if (targetAudience === "specific") {
      if (!username) return NextResponse.json({ error: "Username required for specific target." }, { status: 400 });
      
      const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
      if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

      await Notification.create({
        ...baseNotification,
        recipientId: user.firebaseUid
      });
      return NextResponse.json({ message: `Notification sent to @${user.username}` });
    } 
    
    if (targetAudience === "all") {
      // Find all users
      const users = await User.find({}, 'firebaseUid').lean();
      const notifications = users.map(user => ({
        ...baseNotification,
        recipientId: user.firebaseUid
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
      return NextResponse.json({ message: `Broadcast sent to ${notifications.length} users.` });
    }

    return NextResponse.json({ error: "Invalid target audience." }, { status: 400 });

  } catch (error: any) {
    console.error("Admin notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
