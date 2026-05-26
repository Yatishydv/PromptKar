"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Layout, MessageSquare, LayoutGrid, Zap, Box,
  Palette, Code, Camera, Globe, ChevronRight, TrendingUp,
  Sparkles, Loader2, FileText, PenTool, Terminal, Heart, Eye, Rocket
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

// ── Category metadata (icon + colour + description) ─────────────────
const CATEGORY_META: Record<string, { icon: any; color: string; bg: string; desc: string }> = {
  "Image":        { icon: Camera,       color: "text-rose-600",    bg: "bg-rose-50",    desc: "Visual storytelling and artistic generation parameters." },
  "Marketing":    { icon: Zap,          color: "text-indigo-600",  bg: "bg-indigo-50",  desc: "Email sequences, SEO audits, and marketing logic." },
  "Coding":       { icon: Code,         color: "text-cyan-600",    bg: "bg-cyan-50",    desc: "Scripting, algorithm optimization, and architecture." },
  "Code":         { icon: Terminal,     color: "text-cyan-600",    bg: "bg-cyan-50",    desc: "Scripting, algorithm optimization, and architecture." },
  "Writing":      { icon: PenTool,      color: "text-amber-600",   bg: "bg-amber-50",   desc: "Creative prose, poetry, and technical documentation." },
  "Business":     { icon: Globe,        color: "text-blue-700",    bg: "bg-blue-50",    desc: "Strategy, operations, and corporate communication." },
  "Education":    { icon: FileText,     color: "text-green-600",   bg: "bg-green-50",   desc: "Study guides, tutoring, and learning accelerators." },
  "Blog Writing": { icon: Layout,       color: "text-emerald-600", bg: "bg-emerald-50", desc: "Articles, introductions, and creative storytelling arcs." },
  "Social Media": { icon: MessageSquare,color: "text-pink-600",    bg: "bg-pink-50",    desc: "Captions, viral hooks, and growth strategy guides." },
  "Copywriting":  { icon: LayoutGrid,   color: "text-orange-600",  bg: "bg-orange-50",  desc: "Sales pages, advertisements, and product descriptions." },
  "Midjourney":   { icon: Box,          color: "text-blue-600",    bg: "bg-blue-50",    desc: "Artistic prompts for world-class AI image generation." },
  "Design":       { icon: Palette,      color: "text-purple-600",  bg: "bg-purple-50",  desc: "UI patterns, design systems, and visual guidelines." },
  "Development":  { icon: Code,         color: "text-slate-600",   bg: "bg-slate-50",   desc: "Coding problems, debugging, and logic solutions." },
  "Photography":  { icon: Camera,       color: "text-red-600",     bg: "bg-red-50",     desc: "Lighting setups, composition, and camera settings." },
  "General":      { icon: Sparkles,     color: "text-indigo-500",  bg: "bg-indigo-50",  desc: "General-purpose prompts for any AI tool." },
  "Other":        { icon: Rocket,       color: "text-slate-500",   bg: "bg-slate-50",   desc: "Unique prompts that don't fit a single box." },
};

const DEFAULT_META = { icon: Sparkles, color: "text-slate-600", bg: "bg-slate-50", desc: "Explore specialized prompts in this category." };

const categorySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

// ── Page ─────────────────────────────────────────────────────────────
const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map(c => ({
              ...c,
              ...(CATEGORY_META[c.name] || DEFAULT_META),
              trending: c.count > 5,
            }))
          );
        } else {
          // DB is empty — show all known categories with 0 count as placeholders
          setCategories(
            Object.entries(CATEGORY_META).map(([name, meta]) => ({
              name,
              count: 0,
              totalLikes: 0,
              totalViews: 0,
              trending: false,
              ...meta,
            }))
          );
        }
      } catch (err: any) {
        setError(err.message);
        // Fallback to static list on error
        setCategories(
          Object.entries(CATEGORY_META).map(([name, meta]) => ({
            name, count: 0, totalLikes: 0, totalViews: 0, trending: false, ...meta,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-50 px-10 py-12 border border-card shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-card/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-card rounded-full w-fit shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Prompt Directory</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Categories</h1>
            <p className="text-slate-500 font-bold text-[14px] max-w-md">
              Discover specialized prompts across {categories.length} active categories to elevate your AI output.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-[280px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-[13px] font-medium shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Categories", value: categories.length, icon: LayoutGrid, color: "text-indigo-600 bg-indigo-50" },
          { label: "Total Prompts",    value: categories.reduce((a,c) => a + c.count, 0), icon: Sparkles, color: "text-rose-600 bg-rose-50" },
          { label: "Total Likes",      value: categories.reduce((a,c) => a + (c.totalLikes||0), 0), icon: Heart, color: "text-pink-600 bg-pink-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-[220px] rounded-[2.5rem]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-900">No categories found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
            <Link
              key={c.name}
              href={`/categories/${categorySlug(c.name)}`}
              className="group flex flex-col h-full bg-card border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300"
            >
              {/* Icon row */}
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${c.bg}`}>
                  <c.icon className={`w-6 h-6 ${c.color}`} />
                </div>
                {c.trending && c.count > 0 && (
                  <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </span>
                )}
              </div>

              {/* Name + desc */}
              <div className="space-y-2 mb-8 flex-1">
                <h4 className="font-black text-[17px] text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</h4>
                <p className="text-[12.5px] text-slate-400 font-bold leading-relaxed">{c.desc}</p>
              </div>

              {/* Stats + arrow */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto group-hover:border-indigo-50 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-[12px] font-black text-slate-900">
                    {c.count > 0 ? `${c.count} Prompt${c.count !== 1 ? "s" : ""}` : "Be the first!"}
                  </span>
                  {c.totalLikes > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> {c.totalLikes}
                      <Eye className="w-3 h-3 ml-1" /> {c.totalViews}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state CTA */}
      {!loading && categories.every(c => c.count === 0) && (
        <div className="text-center py-8">
          <div className="inline-flex flex-col items-center gap-3 bg-card border border-slate-100 rounded-3xl p-8 shadow-sm">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <p className="font-black text-slate-900">No prompts yet — be the first!</p>
            <p className="text-sm text-slate-400">Create your first prompt and it will appear in its category.</p>
            <Link href="/create" className="mt-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
              Create Prompt
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
