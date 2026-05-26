import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { isValidObjectId } from "mongoose";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "createdAt";
    const limit = parseInt(searchParams.get("limit") || "20");
    const ids = searchParams.get("ids");
    const search = searchParams.get("search");

    let query: any = { firebaseUid: { $ne: null } };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (ids) {
      const idArray = ids.split(",").map(id => id.trim()).filter(Boolean);
      const mongoIds = idArray.filter(id => isValidObjectId(id));
      const firebaseUids = idArray.filter(id => id.length > 20);

      const conditions = [];
      if (firebaseUids.length > 0) conditions.push({ firebaseUid: { $in: firebaseUids } });
      if (mongoIds.length > 0) conditions.push({ _id: { $in: mongoIds } });

      if (conditions.length > 0) {
        query = { $or: conditions };
      } else {
        return NextResponse.json([]);
      }
    }

    // Use aggregation to handle array length sorting and complex sorts
    const pipeline: any[] = [
      { $match: query },
      { 
        $addFields: { 
          followersCount: { $size: { $ifNull: ["$followers", []] } } 
        } 
      }
    ];

    // Sorting logic
    const sortField: any = {};
    if (sort === "totalLikes") {
      sortField.totalLikes = -1;
      sortField.followersCount = -1; 
      sortField.createdAt = 1; // Older users first for same score
    } else if (sort === "followers") {
      sortField.followersCount = -1;
      sortField.totalLikes = -1;
      sortField.createdAt = 1; // Older users first for same score
    } else if (sort === "engagement") {
      // Combined score: Likes + Follows
      pipeline.push({
        $addFields: {
          engagementScore: { 
            $add: [
              { $ifNull: ["$totalLikes", 0] }, 
              { $ifNull: ["$followersCount", 0] }
            ] 
          }
        }
      });
      sortField.engagementScore = -1;
      sortField.createdAt = 1; // Older users first for same score
    } else {
      sortField.createdAt = -1; // Default to newest first for standard lists
    }

    pipeline.push({ $sort: sortField });
    pipeline.push({ $limit: ids ? 100 : limit });

    const users = await User.aggregate(pipeline);

    console.log(`[API] Found ${users.length} users with sort: ${sort}`);

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Users API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
