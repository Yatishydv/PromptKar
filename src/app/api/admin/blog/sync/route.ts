import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

const BLOGGER_BLOG_ID = process.env.BLOGGER_BLOG_ID || "6418707625664438874";

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check
    const requesterId = request.headers.get('x-requester-id');
    const requesterEmail = request.headers.get('x-requester-email');
    const requesterName = request.headers.get('x-requester-name');
    
    if (requesterId && requesterEmail !== "yatishydv@gmail.com") {
      const PendingAction = (await import("@/models/PendingAction")).default;
      await PendingAction.create({
        actionType: 'SYNC_BLOGGER',
        payload: {},
        requestedBy: requesterId,
        requestedByName: requesterName || 'Sub-Admin',
        requestedByEmail: requesterEmail || 'Unknown',
        status: 'PENDING'
      });
      return NextResponse.json({ message: "Action queued. Waiting for Head Admin approval.", queued: true });
    }
    
    // 1. Fetch from FREE Blogger RSS JSON Feed (No API Key required!)
    console.log(`Syncing from Blog ID: ${BLOGGER_BLOG_ID}...`);
    
    const response = await fetch(
      `https://www.blogger.com/feeds/${BLOGGER_BLOG_ID}/posts/default?alt=json&max-results=50`,
      { next: { revalidate: 0 } } // Force fresh data
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "No error body");
      console.error(`Blogger Fetch Failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Blogger feed error (${response.status}). Check if your blog is public at promptkarcheck.blogspot.com`);
    }

    const data = await response.json();
    const entries = data.feed.entry || [];

    let updatedCount = 0;
    let createdCount = 0;

    // 2. Map and Upsert
    for (const entry of entries) {
      // Extract Blogger ID from the entry ID string (e.g., tag:blogger.com,1999:blog-ID.post-POSTID)
      const bloggerPostId = entry.id.$t.split('post-')[1];
      const title = entry.title.$t;
      const content = entry.content.$t;
      
      // Extract high-quality image
      let coverImage = entry.media$thumbnail?.url?.replace('s72-c', 's1600') || "";
      if (!coverImage) {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) coverImage = imgMatch[1];
      }
      
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const blogData: any = {
        title,
        content,
        excerpt: content.replace(/<[^>]*>/g, "").slice(0, 160) + "...",
        category: (entry.category && entry.category[0]?.term) || "General",
        tags: entry.category?.map((c: any) => c.term) || [],
        coverImage,
        bloggerId: bloggerPostId,
        published: true,
        updatedAt: new Date(entry.updated.$t),
        createdAt: new Date(entry.published.$t),
      };

      // Check if exists by bloggerId
      const existing = await Blog.findOne({ bloggerId: bloggerPostId });
      
      if (existing) {
        // SNAP: If the current slug doesn't match the title's SEO version, fix it!
        if (existing.slug !== baseSlug || existing.title !== title) {
          let finalSlug = baseSlug;
          let counter = 1;
          while (await Blog.findOne({ slug: finalSlug, bloggerId: { $ne: bloggerPostId } })) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          blogData.slug = finalSlug;
        }
        await Blog.updateOne({ bloggerId: bloggerPostId }, { $set: blogData });
        updatedCount++;
      } else {
        // New post: ensure unique slug
        let finalSlug = baseSlug;
        let counter = 1;
        while (await Blog.findOne({ slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        await Blog.create({ ...blogData, slug: finalSlug });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `FREE Sync complete! ${createdCount} new posts, ${updatedCount} updated.`,
      stats: { created: createdCount, updated: updatedCount }
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
