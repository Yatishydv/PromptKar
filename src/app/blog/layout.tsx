import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Updates',
  description: 'Read the latest updates, tips, tutorials, and community news from the PromptKar team.',
  alternates: {
    canonical: 'https://promptkar.site/blog',
  }
};

export default function BlogListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
