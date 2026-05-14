import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Usage from "@/models/Usage";
import { enhancePromptWithHistory } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { prompt, history, style, userId, chatMode } = body;
    
    // Get IP for guest/device tracking
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";
    
    // If not logged in, we use IP. If logged in, we use userId.
    const identifier = userId || ip;
    
    // Updated to Hourly Limit: YYYY-MM-DD-HH
    const now = new Date();
    const hourIdentifier = `${now.toISOString().split("T")[0]}-${now.getHours()}`;

    // Check if user is Pro or Admin
    let isPro = false;
    let isAdmin = false;
    
    if (userId) {
      const user = await User.findOne({ firebaseUid: userId }).select("isPro isAdmin email").lean();
      if (user?.isPro) isPro = true;
      if (user?.isAdmin) isAdmin = true;
      
      // Hardcoded Admin Email Bypass (If user doesn't want to edit MongoDB)
      if (user?.email === "yatishydv@gmail.com") isAdmin = true;
    }

    if (!isPro) {
      // Check quota for free users / guests (5 per hour)
      const usage = await Usage.findOne({ identifier, date: hourIdentifier, type: 'enhance' });
      const currentCount = usage ? usage.count : 0;
      const HOURLY_LIMIT = 5; 

      if (currentCount >= HOURLY_LIMIT) {
        // If they are an admin, we DON'T block them. We let them pass but flag it for the UI.
        if (isAdmin) {
          const result = await enhancePromptWithHistory(prompt, history, style, chatMode);
          
          // Increment usage tracking anyway
          await Usage.findOneAndUpdate(
            { identifier, date: hourIdentifier, type: 'enhance' },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
          );

          return NextResponse.json({ 
            text: result,
            showAdminWarning: true,
            warningMessage: "Neural limit reached (5/5 for this hour). Oh, wait... you're an Admin? How precious. I suppose I can't actually stop you, can I? Proceed, 'Commander'. 🙄" 
          });
        }

        return NextResponse.json({ 
          error: "QUOTA_EXCEEDED",
          message: "Neural limit reached (5/5 for this hour). Upgrade to Pro for unlimited AI power! 🚀" 
        }, { status: 403 });
      }
    }

    // Standard flow (for Pro users or free users under the limit)
    const result = await enhancePromptWithHistory(prompt, history, style, chatMode);

    // Increment usage tracking (Hourly)
    await Usage.findOneAndUpdate(
      { identifier, date: hourIdentifier, type: 'enhance' },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ text: result });
  } catch (error: any) {
    console.error("Enhance API Error:", error);
    return NextResponse.json({ 
      error: "SERVER_ERROR", 
      message: error.message || "An error occurred during enhancement" 
    }, { status: 500 });
  }
}
