import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Interaction from "@/models/Interaction";
import User from "@/models/User";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    
    // Get the post
    const post = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Get engagement totals
    const likeCount = await Interaction.countDocuments({ blogSlug: slug, type: 'like' });
    
    return new NextResponse(JSON.stringify({ ...post, likes: likeCount }), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    const body = await request.json();
    const { action, userId, email } = body;

    // SECURITY GUARD: Only admin can perform regular updates
    if (!action && email !== "yatishydv@gmail.com") {
        return NextResponse.json({ error: "Unauthorized: Architect access only" }, { status: 403 });
    }

    if (action === "like" && userId) {
      const existing = await Interaction.findOne({ userId, blogSlug: slug, type: 'like' });
      
      if (existing) {
        await Interaction.deleteOne({ _id: existing._id });
      } else {
        await Interaction.create({ userId, blogSlug: slug, type: 'like' });
      }

      // Re-calculate and sync the count back to the blog model for fast querying
      const count = await Interaction.countDocuments({ blogSlug: slug, type: 'like' });
      const updatedPost = await Blog.findOneAndUpdate(
        { slug }, 
        { $set: { likes: count } }, 
        { new: true }
      ).lean();

      return NextResponse.json({ ...updatedPost, liked: !existing });
    }

    if (action === "save" && userId) {
      const existing = await Interaction.findOne({ userId, blogSlug: slug, type: 'save' });
      if (existing) {
        await Interaction.deleteOne({ _id: existing._id });
      } else {
        await Interaction.create({ userId, blogSlug: slug, type: 'save' });
      }
      return NextResponse.json({ saved: !existing });
    }

    // Default: Regular update (for admin editing)
    // Sanitize body: remove immutable fields that might be present from a previous fetch
    const updateData = { ...body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.slug; // Slug should typically be immutable or handled separately

    const post = await Blog.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true, runValidators: true, strict: false }
    ).lean();

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    const post = await Blog.findOneAndDelete({ slug });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
