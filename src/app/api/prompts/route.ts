import { successResponse, handleApiError } from "@/lib/api-utils";
import dbConnect from "@/lib/mongodb";
import Prompt from "@/models/Prompt";
import User from "@/models/User";
import { notifyGoogleIndexingAPI } from "@/lib/indexing";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const trending = searchParams.get("trending");
    const authorId = searchParams.get("authorId");
    const likedBy = searchParams.get("likedBy");
    const limit = parseInt(searchParams.get("limit") || "20");

    const slugs = searchParams.get("slugs");

    const query: any = {};
    if (slugs) {
      query.slug = { $in: slugs.split(",").map(s => s.trim()).filter(Boolean) };
    } else {
      if (category && category !== "All") query.category = new RegExp(`^${category}$`, "i");
      if (authorId) query.authorId = authorId;
      if (likedBy) query.likedBy = likedBy;
    }

    let sort: any = { createdAt: -1 };
    if (trending === "true") sort = { likes: -1 };

    const prompts = await Prompt.find(query)
      .sort(sort)
      .limit(slugs ? 100 : limit)
      .lean();

    // Enrich with latest User data
    const enrichedPrompts = await Promise.all(prompts.map(async (p: any) => {
      if (p.authorId) {
        const author = await User.findOne({ firebaseUid: p.authorId }).select('avatar name username currentStreak isGlowActive isVerifiedActive customBadge customTitle').lean();
        if (author) {
          return {
            ...p,
            authorName: author.name || p.authorName,
            authorUsername: author.username || p.authorName,
            authorAvatar: author.avatar || p.authorAvatar,
            authorStreak: author.currentStreak || 0,
            isGlowActive: author.isGlowActive || false,
            isVerifiedActive: author.isVerifiedActive || false,
            customBadge: author.customBadge,
            customTitle: author.customTitle
          };
        }
      }
      return p;
    }));

    return successResponse(enrichedPrompts);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { authorId } = body;

    const prompt = await Prompt.create(body);

    // Streak Update Logic — ONLY on prompt creation
    let streakData = { updated: false, currentStreak: 0, isFirstDay: false };
    
    if (authorId) {
      const { updateStreak } = await import("@/lib/streak");
      const user = await User.findOne({ firebaseUid: authorId });
      
      if (user) {
        const todayStr = new Date().toISOString().split('T')[0];
        const alreadyActiveToday = user.activityDates?.includes(todayStr);
        
        const newStreak = await updateStreak(authorId);
        
        if (!alreadyActiveToday) {
          streakData = {
            updated: true,
            currentStreak: newStreak,
            isFirstDay: newStreak === 1 || !user.lastActiveAt
          };
        } else {
          streakData = {
            updated: false,
            currentStreak: newStreak,
            isFirstDay: false
          };
        }
      }
    }

    // Notify Google Indexing API asynchronously (do not block response)
    if (prompt.slug) {
      const url = `https://www.promptkar.site/prompt/${prompt.slug}`;
      notifyGoogleIndexingAPI(url, 'URL_UPDATED').catch(console.error);
    }

    return successResponse({ prompt, streakData }, 201);
  } catch (error: any) {
    return handleApiError(error);
  }
}
