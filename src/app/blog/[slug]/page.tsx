import { Metadata } from 'next';
import BlogClient from './BlogClient';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    await connectDB();
    const blog = await Blog.findOne({ slug }).lean();
    if (!blog) return { title: 'Not Found' };

    // Strip HTML tags from content for a clean text excerpt
    const cleanExcerpt = blog.excerpt
      || blog.content?.replace(/<[^>]*>/g, '').substring(0, 160).trim() + '...'
      || 'Discover powerful AI prompts and insights on PromptKar.';

    const title = `${blog.title} | PromptKar`;
    const images = blog.coverImage ? [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }] : [];

    return {
      title,
      description: cleanExcerpt,
      openGraph: {
        title,
        description: cleanExcerpt,
        type: 'article',
        siteName: 'PromptKar',
        url: `https://promptkar.site/blog/${slug}`,
        images,
        ...(blog.createdAt && { publishedTime: new Date(blog.createdAt).toISOString() }),
        ...(blog.author && { authors: [blog.author] }),
      },
      twitter: {
        card: blog.coverImage ? 'summary_large_image' : 'summary',
        title: blog.title,
        description: cleanExcerpt,
        ...(blog.coverImage && { images: [blog.coverImage] }),
      },
    };
  } catch (e) {
    return { title: 'PromptKar Blog' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();
    const blog = await Blog.findOne({ slug }).lean();
    
    let initialData = null;
    if (blog) {
      initialData = JSON.parse(JSON.stringify(blog));
    }
    
    return <BlogClient initialData={initialData} />;
  } catch (e) {
    return <BlogClient initialData={null} />;
  }
}
