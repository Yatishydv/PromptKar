import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Prompt from "@/models/Prompt";

export async function GET() {
  try {
    await dbConnect();

    // Aggregate category counts from MongoDB
    const aggregation = await Prompt.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, totalLikes: { $sum: "$likes" }, totalViews: { $sum: "$views" } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json(aggregation.map(c => ({
      name: c._id || "General",
      count: c.count,
      totalLikes: c.totalLikes,
      totalViews: c.totalViews,
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
