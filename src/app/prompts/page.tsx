"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Search, Filter, SlidersHorizontal, Eye, Heart, Bookmark, ArrowRight, Grid, List as ListIcon, Loader2, Copy } from "lucide-react";
import Link from "next/link";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PromptsContent = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(search || "");
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Update searchTerm if URL changes
  useEffect(() => {
    if (search) setSearchTerm(search);
  }, [search]);

  const { data: rawPrompts } = useSWR(
    `/api/prompts${activeCategory !== "All" ? `?category=${encodeURIComponent(activeCategory)}` : ""}`,
    fetcher
  );

  useEffect(() => {
    if (rawPrompts) {
      const data = Array.isArray(rawPrompts) ? rawPrompts : (rawPrompts as any)?.data;
      if (Array.isArray(data)) {
        setPrompts(data);
        setLoading(false);
        
        if (activeCategory === "All") {
          const foundCategories = new Set<string>();
          data.forEach((p: any) => {
            if (p.category) foundCategories.add(p.category);
          });
          setCategories(["All", ...Array.from(foundCategories).sort()]);
        }
      }
    }
  }, [rawPrompts, activeCategory]);

  const filteredPrompts = prompts.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Explore Prompts</h1>
          <p className="text-slate-500 text-sm font-medium">Discover the best AI prompts shared by our community.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-card text-indigo-600 shadow-sm" : "text-slate-500"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-card text-indigo-600 shadow-sm" : "text-slate-500"}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-600 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                  : "bg-card border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredPrompts.map((p) => (
            <Link key={p.slug} href={`/prompt/${p.slug}`}>
              <Card className="h-full flex flex-col p-6 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold">
                       <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views}</span>
                       <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likes}</span>
                    </div>
                 </div>
                 <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                 <p className="text-sm text-slate-500 line-clamp-2 flex-1">{p.description}</p>
                 <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <AuthorAvatar 
                      username={p.authorUsername} 
                      avatar={p.authorAvatar} 
                      name={p.authorName}
                      isGlowActive={p.isGlowActive}
                      isVerifiedActive={p.isVerifiedActive}
                      customBadge={p.customBadge}
                      customTitle={p.customTitle}
                      showName={true}
                      nameClassName="text-xs font-bold"
                    />
                    <span className="text-[10px] font-semibold text-slate-400">{formatDateTime(p.createdAt)}</span>
                 </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const PromptsPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>}>
      <PromptsContent />
    </Suspense>
  );
};

export default PromptsPage;
