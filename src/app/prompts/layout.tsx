import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore AI Prompts',
  description: 'Browse our massive library of top-tier AI prompts for ChatGPT, Midjourney, Claude, and more. Filter by category, tools, and levels.',
  alternates: {
    canonical: 'https://promptkar.site/prompts',
  }
};

export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
