"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, BookOpen, Calendar, Clock, ArrowRight,
  Sparkles, TrendingUp, Loader2, Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Dialog } from "@/components/ui/Dialog";

const ADMIN_EMAIL = "yatishydv@gmail.com"; // ← set to your email

const categoryColors: Record<string, string> = {
  Education: "bg-green-50 text-green-700 border-green-100",
  Tutorial: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Creative: "bg-pink-50 text-pink-700 border-pink-100",
  Business: "bg-amber-50 text-amber-700 border-amber-100",
  Marketing: "bg-purple-50 text-purple-700 border-purple-100",
  Development: "bg-cyan-50 text-cyan-700 border-cyan-100",
};

const BlogPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ isOpen: boolean; slug: string; title: string }>({
    isOpen: false,
    slug: "",
    title: ""
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (slug: string, title: string) => {
    setShowDeleteDialog({ isOpen: true, slug, title });
  };

  const confirmDelete = async () => {
    const { slug } = showDeleteDialog;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/blogs/${slug}`, { method: "DELETE" });
      if (res.ok) setPosts(p => p.filter(x => x.slug !== slug));
    } finally { 
      setDeleting(null);
      setShowDeleteDialog({ isOpen: false, slug: "", title: "" });
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(posts.map(p => p.category)));
    return ["All", ...cats];
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(q));
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [posts, search, activeCategory]);

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 px-10 py-16 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <BookOpen className="w-3 h-3" /> PromptKar Journal
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">The Art of<br />Prompting</h1>
            <p className="text-white/70 max-w-md text-sm font-medium leading-relaxed">
              Deep dives, tutorials, and expert insights into AI prompt engineering. Updated weekly.
            </p>
            {isAdmin && (
              <a 
                href="https://www.blogger.com/u/1/blog/posts/6418707625664438874"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-50 transition-colors no-underline"
              >
                ✏️ Write New Article
              </a>
            )}
          </div>
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:bg-white/20 transition-all text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto text-xs font-bold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading articles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="font-black text-slate-900 text-lg">No articles found</h3>
          <p className="text-slate-400 text-sm mt-1">Try a different search or category.</p>
          <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="font-black text-sm text-slate-900 uppercase tracking-widest">Featured</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featured.map(post => (
                  <PostCard key={post.slug} post={post} isAdmin={isAdmin} deleting={deleting} onDelete={handleDelete} large />
                ))}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              {featured.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h2 className="font-black text-sm text-slate-900 uppercase tracking-widest">More Articles</h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rest.map(post => (
                  <PostCard key={post.slug} post={post} isAdmin={isAdmin} deleting={deleting} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-10 text-center space-y-5">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Weekly Prompt Insights</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">Join 12,000+ subscribers. Get the best prompt engineering tips every Tuesday.</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input type="email" placeholder="you@example.com" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-300 transition-all" />
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-colors whitespace-nowrap">Subscribe</button>
        </div>
      </div>

      <Dialog 
        isOpen={showDeleteDialog.isOpen}
        onClose={() => setShowDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${showDeleteDialog.title}"? This will permanently remove the post from PromptKar.`}
        variant="danger"
        confirmText="Delete Post"
      />
    </div>
  );
};

// ── Post card ────────────────────────────────────────────────────────
function PostCard({ post, isAdmin, deleting, onDelete, large }: {
  post: any; isAdmin: boolean; deleting: string | null;
  onDelete: (slug: string, title: string) => void; large?: boolean;
}) {
  const cats: Record<string, string> = {
    Education: "bg-green-50 text-green-700 border-green-100",
    Tutorial: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Creative: "bg-pink-50 text-pink-700 border-pink-100",
    Business: "bg-amber-50 text-amber-700 border-amber-100",
    Marketing: "bg-purple-50 text-purple-700 border-purple-100",
    Development: "bg-cyan-50 text-cyan-700 border-cyan-100",
  };
  const catCls = cats[post.category] || "bg-slate-50 text-slate-700 border-slate-100";
  
  // Calculate a proportional height for the list view
  const cardHeight = post.coverHeight ? `${Math.min(Math.max(post.coverHeight * 0.55, 160), 350)}px` : (large ? "220px" : "180px");

  return (
    <div className="group bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col h-full relative">
      {/* Admin delete button */}
      {isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); onDelete(post.slug, post.title); }}
          disabled={deleting === post.slug}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
          title="Delete post"
        >
          {deleting === post.slug ? "…" : "✕"}
        </button>
      )}

      <Link href={`/blog/${post.slug}`} className="flex flex-col flex-1">
        <div 
          className="relative overflow-hidden bg-slate-100 transition-all duration-500"
          style={{ height: cardHeight }}
        >
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-indigo-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
            {(post.tags && post.tags.length > 0 ? post.tags.slice(0, 3) : [post.category]).map((tag: string) => (
              <span key={tag} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cats[tag] || catCls}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold mb-2">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
            {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>}
          </div>
          <h3 className={`font-black text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 ${large ? "text-lg" : "text-base"}`}>
            {post.title}
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <AuthorAvatar 
                name={post.author}
                avatar={post.authorAvatar}
                className={`${large ? "w-7 h-7" : "w-6 h-6"}`}
              />
              <span className="text-[11px] font-bold text-slate-500">{post.author}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default BlogPage;
