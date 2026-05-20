import { Metadata } from 'next';
import BlogClient from './BlogClient';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug: params.slug }).lean();
    if (!blog) return { title: 'Not Found' };
    
    return {
      title: `${blog.title} | PromptKar Blog`,
      description: blog.excerpt || blog.content?.substring(0, 150) || "Read this amazing post on PromptKar.",
      openGraph: {
        title: `${blog.title} | PromptKar Blog`,
        description: blog.excerpt || blog.content?.substring(0, 150) || "Read this amazing post on PromptKar.",
        images: blog.coverImage ? [blog.coverImage] : [],
      }
    };
  } catch (e) {
    return { title: 'PromptKar Blog' };
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug: params.slug }).lean();
    
    let initialData = null;
    if (blog) {
      initialData = JSON.parse(JSON.stringify(blog));
    }
    
    return <BlogClient initialData={initialData} />;
  } catch (e) {
    return <BlogClient initialData={null} />;
  }
}
