import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import slugify from "slugify";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: any = { published: true };
    if (category && category !== "All") query.category = category;
    if (featured === "true") query.featured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const posts = await Blog.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich with interaction counts
    const Interaction = (await import("@/models/Interaction")).default;
    const enrichedPosts = await Promise.all(posts.map(async (p: any) => {
      const likes = await Interaction.countDocuments({ blogSlug: p.slug, type: 'like' });
      return { ...p, likes };
    }));

    return new NextResponse(JSON.stringify(enrichedPosts), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // SECURITY GUARD: Only admin can create posts
    if (body.email !== "yatishydv@gmail.com") {
        return NextResponse.json({ error: "Unauthorized: Architect access only" }, { status: 403 });
    }

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Generate slug if not provided
    if (!body.slug) {
      body.slug = slugify(body.title, { lower: true, strict: true }) + "-" + Date.now().toString(36);
    }

    // Estimate read time (~200 words per minute)
    const wordCount = body.content.split(/\s+/).length;
    body.readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const post = await Blog.create(body);
    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
