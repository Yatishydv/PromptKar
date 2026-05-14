import { successResponse, handleApiError } from "@/lib/api-utils";
import dbConnect from "@/lib/mongodb";
import Prompt from "@/models/Prompt";

export async function GET() {
  try {
    await dbConnect();
    
    const categories = await Prompt.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formattedCategories = categories.map(c => ({
      name: c._id,
      count: c.count
    }));

    return successResponse(formattedCategories);
  } catch (error: any) {
    return handleApiError(error);
  }
}
