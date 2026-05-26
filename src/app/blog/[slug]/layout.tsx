import { Metadata, ResolvingMetadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    await dbConnect();
    const post = await Blog.findOne({ slug }).lean();

    if (!post) {
      return {
        title: 'Blog Not Found | PromptKar',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const ogImage = post.coverImage || previousImages;
    const title = `${post.title} | PromptKar Blog`;
    const description = post.excerpt || post.title || 'Read this amazing article on PromptKar.';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.promptkar.site/blog/${slug}`,
        type: 'article',
        publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
        authors: post.author ? [post.author] : ['PromptKar Community'],
        images: ogImage ? [ogImage] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: `https://www.promptkar.site/blog/${slug}`,
      }
    };
  } catch (error) {
    return {
      title: 'Blog | PromptKar',
    };
  }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
