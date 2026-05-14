"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles, ChevronRight, Flame, Heart,
  ArrowRight, LayoutGrid, Zap, MessageSquare, Layout, Box, Clock,
  Palette, Code, Camera, Loader2, Eye, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AIWidget, CreatorsWidget, CommunityWidget, TipWidget } from "@/components/home/Widgets";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import { formatDateTime } from "@/lib/utils";
import { fetcher } from "@/lib/api-client";
import { IPrompt, IBlog } from "@/types";

const CATEGORY_METADATA: Record<string, any> = {
  "Blog Writing": { icon: Layout, color: "bg-[#F0FDF4] text-emerald-600" },
  "Social Media": { icon: MessageSquare, color: "bg-[#FDF2F8] text-pink-600" },
  "Copywriting": { icon: LayoutGrid, color: "bg-[#FFF7ED] text-orange-600" },
  "Marketing": { icon: Zap, color: "bg-[#F5F3FF] text-indigo-600" },
  "Midjourney": { icon: Box, color: "bg-[#EFF6FF] text-blue-600" },
  "Design": { icon: Palette, color: "bg-[#F5F3FF] text-purple-600" },
  "Development": { icon: Code, color: "bg-slate-50 text-slate-600" },
  "Photography": { icon: Camera, color: "bg-red-50 text-red-600" },
};

const DEFAULT_META = { icon: Sparkles, color: "bg-slate-50 text-slate-400" };

export default function Home() {
  const { user } = useAuth();
  const [trendingPrompts, setTrendingPrompts] = useState<IPrompt[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: string; icon: any; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLike = async (e: React.MouseEvent, promptSlug: string, isLiked: boolean) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to like prompts!");

    try {
      // Optimistic update
      setTrendingPrompts(prev => prev.map(p => {
        if (p.slug === promptSlug) {
          return {
            ...p,
            likes: isLiked ? Math.max(0, (parseInt(p.likes.toString()) || 1) - 1) : (parseInt(p.likes.toString()) || 0) + 1,
            likedBy: isLiked ? p.likedBy.filter((id: string) => id !== user.uid) : [...(p.likedBy || []), user.uid]
          };
        }
        return p;
      }));

      // API Call to MongoDB
      await fetch(`/api/prompts/${promptSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', userId: user.uid })
      });

    } catch (error) {
      console.error("Error liking prompt:", error);
    }
  };

  const handleSave = async (e: React.MouseEvent, promptSlug: string, isSaved: boolean) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to save prompts!");

    try {
      // Optimistic update
      setTrendingPrompts(prev => prev.map(p => {
        if (p.slug === promptSlug) {
          return {
            ...p,
            bookmarks: isSaved ? Math.max(0, (parseInt(p.bookmarks.toString()) || 1) - 1) : (parseInt(p.bookmarks.toString()) || 0) + 1,
            savedBy: isSaved ? p.savedBy.filter((id: string) => id !== user.uid) : [...(p.savedBy || []), user.uid]
          };
        }
        return p;
      }));

      // API Call to MongoDB
      await fetch(`/api/prompts/${promptSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', userId: user.uid })
      });

    } catch (error) {
      console.error("Error saving prompt:", error);
    }
  };

  // Real-time fetching with SWR
  const { data: rawTrending, error: trendingError } = useSWR('/api/prompts?trending=true&limit=4', fetcher, {
    refreshInterval: 10000
  });

  const { data: liveBlogs } = useSWR('/api/blogs?limit=3', fetcher, {
    refreshInterval: 30000
  });

  const { data: allPrompts } = useSWR('/api/prompts?limit=1000', fetcher, {
    refreshInterval: 60000
  });

  useEffect(() => {
    if (rawTrending || trendingError) {
      const data = Array.isArray(rawTrending) ? rawTrending : (rawTrending as any)?.data;
      if (Array.isArray(data)) {
        const trendingList = data.map((d: IPrompt) => {
          const meta = CATEGORY_METADATA[d.category] || DEFAULT_META;
          return {
            ...d,
            id: d._id || d.slug,
            authorAvatar: d.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.authorName}`,
            icon: d.toolIcon || "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
            color: meta.color,
            tagColor: meta.color,
          };
        }) as IPrompt[];
        setTrendingPrompts(trendingList);
      }
      setLoading(false);
    }
  }, [rawTrending, trendingError]);

  useEffect(() => {
    const data = Array.isArray(allPrompts) ? allPrompts : (allPrompts as any)?.data;
    if (Array.isArray(data)) {
      const counts: Record<string, number> = {};
      data.forEach((doc: IPrompt) => {
        const rawCat = doc.category || "Other";
        const cat = rawCat.trim();
        counts[cat] = (counts[cat] || 0) + 1;
      });

      const catList = Object.entries(counts)
        .map(([name, count]) => {
          const meta = CATEGORY_METADATA[name] || DEFAULT_META;
          return {
            name,
            count: count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString(),
            icon: meta.icon,
            color: meta.color
          };
        })
        .sort((a, b) => parseInt(b.count) - parseInt(a.count))
        .slice(0, 10); // Show more categories

      setCategories(catList);
    }
  }, [allPrompts]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Center Content */}
      <div className="flex-1 space-y-10">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#EEF2FF] px-8 py-10 md:px-12 md:py-16 border border-white shadow-sm">
          <div className="relative z-10 max-w-md space-y-6">
            <div className="space-y-2">
              <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Find. Share. Improve.</h4>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-indigo-600 leading-[1] mb-1">
                AI Prompts
              </h1>
              <p className="text-slate-500 text-[13.5px] font-bold leading-relaxed max-w-xs">
                Discover powerful AI prompts and enhance your ideas with the power of AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link href="/prompts">
                <Button className="h-10.5 px-6 rounded-xl text-[12.5px] font-black bg-indigo-600 text-white shadow-indigo border-none">
                  Explore Prompts <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/enhance">
                <Button className="h-10.5 px-6 rounded-xl text-[12.5px] font-black bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 shadow-sm">
                  Improve with AI <Sparkles className="ml-2 w-3.5 h-3.5 text-indigo-600" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2.5">
                {[1, 2, 3, 4].map(i => (
                  <AuthorAvatar
                    key={i}
                    userId={`hero-user-${i}`}
                    name={`User ${i}`}
                    avatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=hero${i}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                    className="w-8 h-8 border-[2.5px] border-white"
                  />
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400">Join 25K+ prompt creators worldwide</p>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="absolute right-[2%] top-1/2 -translate-y-1/2 hidden xl:block animate-float">
            <div className="relative w-[420px] h-[420px]">
              <img
                src="/hero.png"
                alt="UI Illustration"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing Platform Data...</p>
          </div>
        ) : (
          <>
            {/* Trending */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="text-orange-500 text-lg">🔥</span> Trending
                </h2>
                <Link href="/prompts" className="text-[11px] font-black text-indigo-600 hover:underline">View all</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {trendingPrompts.map((p) => (
                  <Link key={p._id || p.slug} href={`/prompt/${p.slug}`}>
                    <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-soft hover:shadow-premium transition-all duration-300 group h-full flex flex-col relative">
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={(e) => handleSave(e, p.slug, p.savedBy?.includes(user?.uid || ""))}
                          className="p-1 hover:scale-110 transition-all group/btn"
                        >
                          <Bookmark className={`w-4 h-4 transition-all ${p.savedBy?.includes(user?.uid || "") ? "text-indigo-600 fill-indigo-600" : "text-slate-300 hover:text-slate-400"
                            }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">
                            {formatDateTime(p.createdAt)}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-black text-[15px] text-slate-900 leading-relaxed mb-6 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[40px]">
                        {p.title}
                      </h3>
                      <div className="mt-auto space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${p.tagColor}`}>{p.category}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handleLike(e, p.slug, p.likedBy?.includes(user?.uid || ""))}
                              className="flex items-center gap-1.5 text-[10.5px] font-black text-slate-400 hover:text-slate-900 transition-all"
                            >
                              <Heart className={`w-3.5 h-3.5 transition-all ${p.likedBy?.includes(user?.uid || "") ? "text-red-500 fill-red-500" : "text-slate-300 hover:text-red-500"
                                }`} /> {p.likes}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10.5px] font-black text-slate-400">
                              <Eye className="w-3.5 h-3.5" /> {p.views}
                            </div>
                          </div>
                          <AuthorAvatar
                            userId={p.authorId}
                            name={p.authorName}
                            username={p.authorUsername}
                            avatar={p.authorAvatar}
                            streak={p.authorStreak}
                            className="w-7 h-7"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Categories */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-900">Categories</h2>
                <Link href="/categories" className="text-[11px] font-black text-indigo-600 hover:underline">View all</Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {categories.map((c) => (
                  <Link key={c.name} href={`/categories/${c.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="bg-white border border-slate-100 p-6 rounded-[1.5rem] flex flex-col items-center text-center shadow-soft hover:bg-indigo-50/20 cursor-pointer group transition-all duration-300 h-full">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${c.color}`}>
                        <c.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-[14px] text-slate-900 mb-1">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 font-bold">{c.count} Prompts</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Blog */}
        <section className="space-y-6 pb-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black text-slate-900">Articles & Insights</h2>
            <Link href="/blog" className="text-[11px] font-black text-indigo-600 hover:underline">View all</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!liveBlogs ? (
               [1, 2, 3].map(i => (
                 <div key={i} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] h-[350px] animate-pulse" />
               ))
            ) : Array.isArray(liveBlogs) && liveBlogs.length > 0 ? (
               liveBlogs.map((b: IBlog) => (
                 <Link key={b.slug} href={`/blog/${b.slug}`}>
                   <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-soft group hover:shadow-premium transition-all duration-300 h-full flex flex-col cursor-pointer">
                     <div
                       className="overflow-hidden relative bg-slate-100 transition-all duration-500"
                       style={{ height: b.coverHeight ? `${Math.min(Math.max(b.coverHeight * 0.45, 140), 250)}px` : '176px' }}
                     >
                       <img src={b.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={b.title} />
                       <div className="absolute top-4 left-4">
                         <span className="bg-white/90 backdrop-blur-sm text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest text-indigo-600 shadow-sm">
                           {b.category}
                         </span>
                       </div>
                     </div>
                     <div className="p-6 flex-1 flex flex-col">
                       <h3 className="font-black text-[16px] text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                         {b.title}
                       </h3>
                       <p className="text-[12.5px] font-bold text-slate-400 leading-relaxed line-clamp-2 mb-4">
                         {b.excerpt}
                       </p>
                       <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50">
                         <div className="flex items-center gap-2">
                           <AuthorAvatar
                             name={b.author}
                             avatar={b.authorAvatar}
                             className="w-5 h-5"
                           />
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{b.readTime}</span>
                         </div>
                         <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                           READ <ArrowRight className="w-3 h-3" />
                         </span>
                       </div>
                     </div>
                   </div>
                 </Link>
               ))
            ) : (
               <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">
                 No articles found.
               </div>
            )}
          </div>
        </section>

      </div>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-[320px] space-y-6">
        <AIWidget />
        <CreatorsWidget />
        <CommunityWidget />
        <TipWidget />
      </aside>
    </div>
  );
}
