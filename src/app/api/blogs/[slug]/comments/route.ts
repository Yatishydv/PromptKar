import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Comment from "@/models/Comment";
import User from "@/models/User";

export async function GET(req: Request, context: any) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    
    // Fetch comments
    const comments = await Comment.find({ blogSlug: slug }).sort({ createdAt: -1 }).lean();
    
    // Enrich comments with STRICT user data (Intelligent Fallback)
    const enrichedComments = await Promise.all(comments.map(async (c: any) => {
      const userData = await User.findOne({ firebaseUid: c.userId }).select('avatar name').lean();
      
      // PRIORITY 1: Latest Avatar from User Profile
      // PRIORITY 2: Original Avatar saved with Comment
      // PRIORITY 3: Uniform Placeholder
      let finalAvatar = userData?.avatar || c.userAvatar || "/avatar-placeholder.png";
      
      // Cleanup: if it's 'null' or 'undefined' string
      if (finalAvatar === "null" || finalAvatar === "undefined") {
        finalAvatar = "/avatar-placeholder.png";
      }

      return {
        ...c,
        userName: userData?.name || c.userName || "Member",
        userAvatar: finalAvatar
      };
    }));

    return NextResponse.json(enrichedComments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    const body = await req.json();
    const { userId, userName, userAvatar, content } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SELF-HEALING: Ensure user exists in MongoDB
    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { 
        $setOnInsert: { 
          firebaseUid: userId,
          email: userId === "yatishydv@gmail.com" ? "yatishydv@gmail.com" : "",
          username: userName.toLowerCase().replace(/\s+/g, '_'),
        },
        $set: { 
          name: userName,
          avatar: userAvatar
        }
      },
      { upsert: true, new: true }
    );

    const comment = await Comment.create({
      blogSlug: slug,
      userId,
      userName,
      userAvatar,
      content
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");
    const userId = searchParams.get("userId");

    if (!commentId || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    if (comment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
