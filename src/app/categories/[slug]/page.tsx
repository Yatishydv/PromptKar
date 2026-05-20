"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Heart, Sparkles, MessageSquare, Layout, 
  ChevronLeft, ArrowRight, Filter, Search,
  Zap, Clock, User, Bookmark, Loader2,
  LayoutGrid, Box, Palette, Code, Camera, 
  PenTool, Terminal, Globe, Eye, Copy
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";

// Shared metadata mapping
const CATEGORY_METADATA: Record<string, any> = {
  "Blog Writing": { icon: Layout, color: "text-emerald-600", bg: "bg-emerald-50/50", iconBg: "bg-emerald-600" },
  "Social Media": { icon: MessageSquare, color: "text-pink-600", bg: "bg-pink-50/50", iconBg: "bg-pink-600" },
  "Copywriting": { icon: LayoutGrid, color: "text-orange-600", bg: "bg-orange-50/50", iconBg: "bg-orange-600" },
  "Marketing": { icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50/50", iconBg: "bg-indigo-600" },
  "Midjourney": { icon: Box, color: "text-blue-600", bg: "bg-blue-50/50", iconBg: "bg-blue-600" },
  "Design": { icon: Palette, color: "text-purple-600", bg: "bg-purple-50/50", iconBg: "bg-purple-600" },
  "Development": { icon: Code, color: "text-slate-600", bg: "bg-slate-50/50", iconBg: "bg-slate-600" },
  "Photography": { icon: Camera, color: "text-red-600", bg: "bg-red-50/50", iconBg: "bg-red-600" },
  "Image": { icon: Camera, color: "text-rose-600", bg: "bg-rose-50/50", iconBg: "bg-rose-600" },
  "Writing": { icon: PenTool, color: "text-amber-600", bg: "bg-amber-50/50", iconBg: "bg-amber-600" },
  "Code": { icon: Terminal, color: "text-cyan-600", bg: "bg-cyan-50/50", iconBg: "bg-cyan-600" },
  "Business": { icon: Globe, color: "text-blue-700", bg: "bg-blue-50/50", iconBg: "bg-blue-700" },
};

const DEFAULT_META = { icon: Sparkles, color: "text-slate-600", bg: "bg-slate-50/50", iconBg: "bg-indigo-600" };

const CategoryDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const categoryName = (slug as string)
    .split('-')
    .map(word => {
      if (word.toLowerCase() === "ai") return "AI";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  const meta = CATEGORY_METADATA[categoryName] || DEFAULT_META;
  const CategoryIcon = meta.icon;

  const handleLike = async (e: React.MouseEvent, promptSlug: string, isLiked: boolean) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to like prompts!");
    
    try {
      // Optimistic update
      setPrompts(prev => prev.map(p => {
        if (p.slug === promptSlug) {
          return {
            ...p,
            likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
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
      setPrompts(prev => prev.map(p => {
        if (p.slug === promptSlug) {
          return {
            ...p,
            bookmarks: isSaved ? Math.max(0, (p.bookmarks || 1) - 1) : (p.bookmarks || 0) + 1,
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

  useEffect(() => {
    const fetchCategoryPrompts = async () => {
      setLoading(true);
      try {
        const queryParam = categoryName !== "All" ? `?category=${encodeURIComponent(categoryName)}` : "";
        const res = await fetch(`/api/prompts${queryParam}`);
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : (rawData as any)?.data;
        
        if (Array.isArray(data)) {
          setPrompts(data.map(p => ({ ...p, id: p._id || p.slug })));
        }
      } catch (error) {
        console.error("Error fetching category prompts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPrompts();
  }, [categoryName]);

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-24 max-w-[1400px] mx-auto">
      {/* Refined Navigation & Header */}
      <div className="space-y-8">
        <Link href="/categories" className="inline-flex items-center gap-2 text-slate-400 font-bold text-[13px] hover:text-indigo-600 transition-all group">
          <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-indigo-100 group-hover:bg-indigo-50/30">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
          Back to categories
        </Link>
        
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-2">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 ${meta.iconBg} rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-100`}>
                  <CategoryIcon className="w-6 h-6 text-white" />
               </div>
               <div className="space-y-0.5">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">{categoryName}</h1>
                  <div className={`flex items-center gap-2 text-[12px] font-black ${meta.color} uppercase tracking-widest`}>
                     <div className={`w-1 h-1 rounded-full ${meta.iconBg}`} />
                     {loading ? "..." : prompts.length} Verified Prompts
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group w-full sm:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder={`Search ${categoryName} prompts...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-[13px] font-medium shadow-sm"
                />
             </div>
             <button className="h-12 px-5 flex items-center gap-2.5 bg-card border border-slate-100 rounded-2xl text-slate-900 font-bold text-[13px] hover:bg-slate-50 transition-all shadow-sm">
                <Filter className="w-4 h-4 text-slate-400" /> Filter
             </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Filtering Data Hub...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPrompts.length > 0 ? filteredPrompts.map((p, idx) => (
            <div
              key={p.id} 
              className="group relative bg-card border border-slate-100/80 p-8 rounded-[2.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full"
            >
              {/* Top Row: User & Difficulty */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3.5">
                   <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm">
                      <AuthorAvatar 
                        name={p.authorName || "anonymous"} username={p.authorUsername || p.authorName}
                        avatar={p.authorAvatar}
                        className="w-10 h-10"
                      />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-900 leading-tight">@{p.authorUsername || "anonymous"}</span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                         <Clock className="w-3 h-3" /> {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : "Recent"}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                      <Bookmark className="w-4 h-4" />
                   </button>
                   <span className="px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/20">
                      {p.level || "Standard"}
                   </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="space-y-6 mb-10 flex-1">
                <h3 className="text-[20px] font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                   {p.title}
                </h3>
                
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-[12.5px] font-mono leading-relaxed text-indigo-100/80 relative overflow-hidden group/prompt transition-all shadow-inner">
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       navigator.clipboard.writeText(p.content);
                       toast.success("Prompt copied!");
                     }}
                     className="absolute top-2 right-2 p-2 bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all z-30 backdrop-blur-sm"
                   >
                      <Copy className="w-3 h-3" />
                   </button>
                   <p className="line-clamp-3 relative z-10 selection:bg-indigo-500/30">
                      {p.content}
                   </p>
                </div>

                <p className="text-[13px] text-slate-400 font-bold leading-relaxed line-clamp-2">
                   {p.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                   {p.tags?.map((tag: string) => (
                     <span key={tag} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                        #{tag}
                     </span>
                   ))}
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex flex-wrap items-center justify-between pt-6 border-t border-slate-50 mt-auto group-hover:border-indigo-50 transition-colors gap-4">
                 <div className="flex items-center gap-5">
                    <button 
                      onClick={(e) => handleLike(e, p.slug, p.likedBy?.includes(user?.uid))}
                      className="flex items-center gap-2 group/like transition-all z-20 relative"
                    >
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                         p.likedBy?.includes(user?.uid) ? "bg-red-50" : "bg-slate-50 group-hover/like:bg-red-50"
                       }`}>
                          <Heart className={`w-4.5 h-4.5 transition-all ${
                            p.likedBy?.includes(user?.uid) ? "text-red-500 fill-red-500" : "text-slate-300 group-hover/like:text-red-500"
                          }`} />
                       </div>
                       <span className={`text-[13px] font-black transition-colors ${
                         p.likedBy?.includes(user?.uid) ? "text-slate-900" : "text-slate-400 group-hover/like:text-slate-900"
                       }`}>
                        {p.likes >= 1000 ? `${(p.likes / 1000).toFixed(1)}K` : p.likes || 0}
                       </span>
                    </button>
                    <div className="flex items-center gap-2 text-slate-400">
                       <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50">
                          <Eye className="w-4.5 h-4.5" />
                       </div>
                       <span className="text-[13px] font-black">{p.views >= 1000 ? `${(p.views / 1000).toFixed(1)}K` : p.views || 0}</span>
                    </div>
                    <button 
                      onClick={(e) => handleSave(e, p.slug, p.savedBy?.includes(user?.uid))}
                      className="flex items-center gap-2 text-slate-400 group/save transition-all z-20 relative"
                    >
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                         p.savedBy?.includes(user?.uid) ? "bg-indigo-50" : "bg-slate-50 group-hover/save:bg-indigo-50"
                       }`}>
                          <Bookmark className={`w-4.5 h-4.5 transition-all ${
                            p.savedBy?.includes(user?.uid) ? "text-indigo-600 fill-indigo-600" : "text-slate-300 group-hover/save:text-indigo-600"
                          }`} />
                       </div>
                       <span className={`text-[13px] font-black transition-colors ${
                         p.savedBy?.includes(user?.uid) ? "text-slate-900" : "text-slate-400 group-hover/save:text-slate-900"
                       }`}>
                         {p.bookmarks >= 1000 ? `${(p.bookmarks / 1000).toFixed(1)}K` : p.bookmarks || 0}
                       </span>
                    </button>
                 </div>
                 
                 <Link href={`/prompt/${p.slug}`}>
                   <Button className="h-11 px-6 rounded-xl bg-slate-900 text-white text-[13px] font-black flex items-center gap-2 hover:bg-indigo-600 hover:scale-105 shadow-lg shadow-slate-200 transition-all duration-300 border-none">
                      Try Prompt <ArrowRight className="w-4 h-4" />
                   </Button>
                 </Link>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-24 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Layout className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-900">No prompts found</h3>
               <p className="text-slate-400 font-bold">Be the first to share a prompt in the {categoryName} category!</p>
               <Link href="/create">
                  <Button className="mt-4 bg-indigo-600">Create Prompt</Button>
               </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryDetailPage;
