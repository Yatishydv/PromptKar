export interface IBlog {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorAvatar: string;
  authorBio: string;
  coverImage: string;
  coverHeight: number;
  featured: boolean;
  published: boolean;
  readTime: string;
  views: number;
  likes: number;
  likedBy: string[];
  savedBy: string[];
  bloggerId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
