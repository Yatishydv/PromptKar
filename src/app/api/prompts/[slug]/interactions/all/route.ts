import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Prompt from "@/models/Prompt";
import User from "@/models/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const prompt = await Prompt.findOne({ slug }).select("likedBy").lean();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (!prompt.likedBy || prompt.likedBy.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch user details for those who liked
    const users = await User.find({
      firebaseUid: { $in: prompt.likedBy }
    }).select("name username avatar firebaseUid").lean();

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
