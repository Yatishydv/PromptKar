export interface IPromptHistory {
  content: string;
  updatedAt: Date | string;
}

export interface IPrompt {
  _id?: string;
  title: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  likes: number;
  views: number;
  bookmarks: number;
  likedBy: string[];
  savedBy: string[];
  toolIcon?: string;
  slug: string;
  level: string;
  history: IPromptHistory[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
