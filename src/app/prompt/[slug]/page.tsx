import { Metadata } from 'next';
import PromptClient from './PromptClient';
import connectDB from '@/lib/mongodb';
import Prompt from '@/models/Prompt';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    await connectDB();
    const prompt = await Prompt.findOne({ slug: params.slug }).lean();
    if (!prompt) return { title: 'Not Found' };
    
    return {
      title: `${prompt.title} | PromptKar`,
      description: prompt.description || "Discover this amazing AI prompt on PromptKar.",
      openGraph: {
        title: `${prompt.title} | PromptKar`,
        description: prompt.description || "Discover this amazing AI prompt on PromptKar.",
      }
    };
  } catch (e) {
    return { title: 'PromptKar' };
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const prompt = await Prompt.findOne({ slug: params.slug }).lean();
    
    let initialData = null;
    if (prompt) {
      initialData = JSON.parse(JSON.stringify(prompt));
      // Fix _id to id for PromptClient compatibility
      if (initialData._id) {
         initialData.id = initialData._id;
      }
    }
    
    return <PromptClient initialData={initialData} />;
  } catch (e) {
    return <PromptClient initialData={null} />;
  }
}
