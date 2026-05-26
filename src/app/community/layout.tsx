import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the PromptKar community! Discuss prompt engineering, share your creations, and collaborate with other AI enthusiasts.',
  alternates: {
    canonical: 'https://www.promptkar.site/community',
  }
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
