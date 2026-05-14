import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Interaction from "@/models/Interaction";

export async function GET(req: Request, context: any) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ liked: false, saved: false });

    const [liked, saved] = await Promise.all([
      Interaction.exists({ userId, blogSlug: slug, type: "like" }),
      Interaction.exists({ userId, blogSlug: slug, type: "save" })
    ]);

    return NextResponse.json({ 
      liked: !!liked, 
      saved: !!saved 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
