/**
 * Streak-based feature permissions
 */

export const STREAK_TIERS = {
  AI_PRO: 0,
  SOCIAL_LINKS: 30,
  FEATURED_PROMPT: 100,
  STREAK_FREEZE: 150,
  PROFILE_PHOTO: 365,
};

export const checkPermission = (userStreak: number, tier: keyof typeof STREAK_TIERS, isAdmin?: boolean) => {
  if (isAdmin) return true; // Admin bypass
  return userStreak >= STREAK_TIERS[tier];
};

export const getRankTitle = (streak: number, isAdmin?: boolean, customTitle?: string) => {
  if (customTitle) return customTitle;
  if (isAdmin) return "Founder & Owner";
  if (streak >= 365) return "Legendary Creator";
  if (streak >= 270) return "Master Creator";
  if (streak >= 180) return "Principal Creator";
  if (streak >= 90) return "Elite Creator";
  if (streak >= 60) return "Lead Creator";
  if (streak >= 30) return "Senior Creator";
  if (streak >= 7) return "Active Member";
  return "New Member";
};

export const getRankBadge = (streak: number, isAdmin?: boolean, customBadge?: string) => {
  if (customBadge) return customBadge;
  if (isAdmin) return "💎";
  if (streak >= 365) return "🏆";
  if (streak >= 270) return "👑";
  if (streak >= 180) return "🌌";
  if (streak >= 90) return "🌠";
  if (streak >= 60) return "🔥";
  if (streak >= 30) return "⚡";
  if (streak >= 7) return "✨";
  return "🌱";
};

export const getTierRequirement = (tier: keyof typeof STREAK_TIERS) => {
  return STREAK_TIERS[tier];
};
