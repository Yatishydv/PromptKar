export interface IUserSocialLinks {
  website?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
}

export interface IUser {
  _id?: string;
  firebaseUid: string;
  name?: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  totalLikes: number;
  savedPrompts: string[];
  followers: string[];
  following: string[];
  banner?: string;
  location?: string;
  socialLinks?: IUserSocialLinks;
  currentStreak: number;
  lastActiveAt: Date | string;
  activityDates: string[];
  isPro: boolean;
  isAdmin: boolean;
  role?: string;
  customBadge?: string;
  customTitle?: string;
  selectedTheme?: string;
  featuredPromptId?: string;
  isVerifiedActive?: boolean;
  isGlowActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
