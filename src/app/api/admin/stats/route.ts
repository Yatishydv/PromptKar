import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Prompt from "@/models/Prompt";
import Blog from "@/models/Blog";

export async function GET() {
  try {
    await dbConnect();

    // Use Promise.all with countDocuments for maximum speed
    const [userCount, promptCount, blogCount, viewsData] = await Promise.all([
      User.countDocuments(),
      Prompt.countDocuments(),
      Blog.countDocuments(),
      Prompt.aggregate([
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
      ])
    ]);

    const blogViews = await Blog.aggregate([
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const totalViews = (viewsData[0]?.totalViews || 0) + (blogViews[0]?.totalViews || 0);

    return NextResponse.json({
      users: userCount,
      prompts: promptCount,
      blogs: blogCount,
      views: totalViews
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
