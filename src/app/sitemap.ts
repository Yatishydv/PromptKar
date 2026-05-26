import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Prompt from '@/models/Prompt';

// Revalidate the sitemap every hour so it always includes new prompts/blogs/users
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.promptkar.site';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/prompts`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    await dbConnect();

    // Query prompts and generate sitemap entries
    const prompts = await Prompt.find().select('slug updatedAt').lean();
    const promptEntries = prompts.map((prompt: any) => ({
      url: `${baseUrl}/prompt/${prompt.slug}`,
      lastModified: prompt.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Query blogs and generate sitemap entries
    const Blog = (await import('@/models/Blog')).default;
    const blogs = await Blog.find({ published: true }).select('slug updatedAt').lean();
    const blogEntries = blogs.map((blog: any) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Query users and generate sitemap entries
    const User = (await import('@/models/User')).default;
    const users = await User.find({}).select('username updatedAt').lean();
    const userEntries = users.map((u: any) => ({
      url: `${baseUrl}/profile/${u.username}`,
      lastModified: u.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...promptEntries, ...blogEntries, ...userEntries];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticRoutes;
  }
}
