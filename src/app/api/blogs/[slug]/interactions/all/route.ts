import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Interaction from "@/models/Interaction";
import User from "@/models/User";

export async function GET(req: Request, context: any) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    
    // Fetch all likes for this blog
    const likes = await Interaction.find({ blogSlug: slug, type: 'like' }).sort({ createdAt: -1 }).lean();
    
    // Enrich with user names and avatars
    const enrichedLikes = await Promise.all(likes.map(async (l: any) => {
      const userData = await User.findOne({ firebaseUid: l.userId }).select('name username email avatar').lean();
      
      const name = userData?.name || "Sync Pending";
      let avatar = userData?.avatar;
      if (!avatar || avatar === "null") {
        avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
      }

      return {
        userId: l.userId,
        name: name,
        username: userData?.username || `user_${l.userId.slice(-4)}`,
        email: userData?.email || "N/A",
        avatar: avatar
      };
    }));

    return NextResponse.json({
      total: enrichedLikes.length,
      users: enrichedLikes
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
