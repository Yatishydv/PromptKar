import { Metadata, ResolvingMetadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Prompt from '@/models/Prompt';

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
    const prompt = await Prompt.findOne({ slug }).lean();

    if (!prompt) {
      return {
        title: 'Prompt Not Found | PromptKar',
      };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const title = `${prompt.title} | PromptKar`;
    const description = prompt.description || `Check out this amazing AI prompt by ${prompt.authorName} on PromptKar.`;

    return {
      title,
      description,
      keywords: prompt.tags,
      openGraph: {
        title,
        description,
        url: `https://www.promptkar.site/prompt/${slug}`,
        type: 'article',
        publishedTime: (prompt as any).createdAt ? new Date((prompt as any).createdAt).toISOString() : undefined,
        authors: prompt.authorName ? [prompt.authorName] : ['PromptKar Community'],
        images: previousImages,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: `https://www.promptkar.site/prompt/${slug}`,
      }
    };
  } catch (error) {
    return {
      title: 'Prompt | PromptKar',
    };
  }
}

export default function PromptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
