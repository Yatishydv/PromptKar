import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Prompt from "@/models/Prompt";
import User from "@/models/User";
import Notification from "@/models/Notification";
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    
    // Find the prompt by its slug
    const prompt = await Prompt.findOne({ slug }).lean() as any;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Fetch author details for latest avatar and badge
    if (prompt.authorId) {
      const author = await User.findOne({ firebaseUid: prompt.authorId })
        .select('email avatar name username currentStreak isAdmin customBadge customTitle isGlowActive isVerifiedActive')
        .lean() as any;
      if (author) {
        prompt.authorEmail = author.email;
        prompt.authorAvatar = author.avatar || prompt.authorAvatar;
        prompt.authorName = author.name || prompt.authorName;
        prompt.authorUsername = author.username || author.name || prompt.authorName;
        prompt.authorStreak = author.currentStreak || 0;
        prompt.authorIsAdmin = author.isAdmin || false;
        prompt.authorCustomBadge = author.customBadge || "";
        prompt.authorCustomTitle = author.customTitle || "";
        prompt.authorIsGlowActive = author.isGlowActive || false;
        prompt.authorIsVerifiedActive = author.isVerifiedActive || false;
      }
    }

    // Ensure history exists even for legacy prompts
    if (!prompt.history) {
      prompt.history = [];
    }

    return NextResponse.json(prompt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const body = await request.json();
    const { action, userId } = body; // action can be 'like', 'save', 'view'
    
    const prompt = await Prompt.findOne({ slug });
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (action === 'view') {
      prompt.views += 1;
    } else if (action === 'like' && userId) {
      const hasLiked = prompt.likedBy.includes(userId);
      if (hasLiked) {
        prompt.likedBy = prompt.likedBy.filter((id: string) => id !== userId);
        prompt.likes = prompt.likedBy.length; // Always sync with source of truth

        // Update User's totalLikes (decrement)
        await User.findOneAndUpdate(
          { firebaseUid: prompt.authorId },
          { $inc: { totalLikes: -1 } }
        );

        // Remove Notification on Unlike (Broad search for resilience)
        await Notification.findOneAndDelete({
          senderId: userId,
          type: 'like',
          targetId: slug
        });
      } else {
        prompt.likedBy.push(userId);
        prompt.likes = prompt.likedBy.length; // Always sync with source of truth

        // Update User's totalLikes (increment)
        const updatedAuthor = await User.findOneAndUpdate(
          { firebaseUid: prompt.authorId },
          { $inc: { totalLikes: 1 } },
          { new: true }
        ).lean();

        // Check for Milestone (100, 500, 1000 likes)
        if (updatedAuthor && [100, 500, 1000].includes(updatedAuthor.totalLikes)) {
          await Notification.create({
            recipientId: prompt.authorId,
            senderId: "system",
            senderName: "PromptKar Admin",
            senderUsername: "system",
            type: "milestone",
            targetId: "milestone",
            message: `Congratulations! You just hit ${updatedAuthor.totalLikes} total likes on your prompts! 🚀`,
            linkType: "profile",
            linkTarget: updatedAuthor.username,
            isRead: false,
          });
        }


        // Trigger Notification
        if (userId !== prompt.authorId) {
           const sender = await User.findOne({ firebaseUid: userId }).select('name username avatar').lean();
           if (sender) {
             const notification = await Notification.findOneAndUpdate(
               {
                 recipientId: prompt.authorId,
                 senderId: userId,
                 type: 'like',
                 targetId: slug
               },
               {
                 senderName: sender.name || "Someone", senderUsername: sender.username || sender.name || "someone",
                 senderAvatar: sender.avatar || "",
                 targetTitle: prompt.title,
                 isRead: false,
                 createdAt: new Date() // Refresh the timestamp
               },
               { upsert: true, new: true }
             );

             // Trigger Socket.io for real-time update
             try {
               socket.emit("send-notification", {
                 recipientId: prompt.authorId,
                 notification
               });
             } catch (err) {
               console.error("Socket error in prompt route:", err);
             }
           }
        }
      }
    } else if (action === 'save' && userId) {
      const hasSaved = prompt.savedBy.includes(userId);
      if (hasSaved) {
        prompt.savedBy = prompt.savedBy.filter((id: string) => id !== userId);
        prompt.bookmarks = Math.max(0, prompt.bookmarks - 1);
      } else {
        prompt.savedBy.push(userId);
        prompt.bookmarks += 1;
      }
    } else if (action === 'update' && body.updateData) {
      console.log(`[HISTORY] Atomic update for ${slug}`);
      
      // Save current version to history BEFORE applying new data
      await Prompt.findOneAndUpdate(
        { slug },
        { 
          $push: { 
            history: { 
              content: prompt.content, 
              updatedAt: new Date() 
            } 
          } 
        }
      );
      
      Object.assign(prompt, body.updateData);
    }

    await prompt.save();
    return NextResponse.json(prompt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    // Check headers for Head Admin validation (if this was triggered from the admin dashboard)
    const requesterId = request.headers.get('x-requester-id');
    const requesterEmail = request.headers.get('x-requester-email');
    const requesterName = request.headers.get('x-requester-name');

    if (requesterId && requesterEmail !== "yatishydv@gmail.com") {
      const PendingAction = (await import("@/models/PendingAction")).default;
      await PendingAction.create({
        actionType: 'DELETE_PROMPT',
        payload: { slug },
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
    }

    const prompt = await Prompt.findOne({ slug });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Use likedBy.length as the source of truth, NOT the likes counter
    // The likes counter can drift out of sync; likedBy is the actual list
    const actualLikesCount = prompt.likedBy?.length || 0;
    const authorId = prompt.authorId;

    // Delete the prompt
    await Prompt.deleteOne({ slug });

    // Recalculate the author's totalLikes from scratch (sum of all remaining prompts' likes)
    // This is more reliable than decrementing, which can drift over time
    if (authorId) {
      const remainingPrompts = await Prompt.find({ authorId }).select('likedBy').lean();
      const recalculatedTotal = remainingPrompts.reduce(
        (sum: number, p: any) => sum + (p.likedBy?.length || 0), 0
      );

      await User.findOneAndUpdate(
        { firebaseUid: authorId },
        { $set: { totalLikes: recalculatedTotal } }
      );
    }

    // Clean up notifications related to this prompt
    await Notification.deleteMany({ targetId: slug });

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
