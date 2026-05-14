/**
 * Score formula: Score = Likes + (Views / 10) + (Bookmarks * 2)
 */
export function calculateTrendingScore(likes: number, views: number, bookmarks: number) {
  return likes + (views / 10) + (bookmarks * 2);
}

export async function likePrompt(promptSlug: string, userId: string) {
  try {
    const res = await fetch(`/api/prompts/${promptSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', userId })
    });
    if (!res.ok) throw new Error("Like failed");
    const data = await res.json();
    return data.likedBy.includes(userId);
  } catch (err) {
    console.error("Engagement Like Error:", err);
    return false;
  }
}

export async function bookmarkPrompt(promptSlug: string, userId: string) {
  try {
    const res = await fetch(`/api/prompts/${promptSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', userId })
    });
    if (!res.ok) throw new Error("Bookmark failed");
    const data = await res.json();
    return data.savedBy.includes(userId);
  } catch (err) {
    console.error("Engagement Bookmark Error:", err);
    return false;
  }
}

export async function trackView(promptSlug: string) {
  try {
    await fetch(`/api/prompts/${promptSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' })
    });
  } catch (err) {
    console.error("Engagement Track View Error:", err);
  }
}
