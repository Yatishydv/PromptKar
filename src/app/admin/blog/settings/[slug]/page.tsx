"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Globe, Settings, 
  Tag, Layers, Sparkles, Image as ImageIcon,
  Check, Loader2, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

const ADMIN_EMAIL = "yatishydv@gmail.com";

const BlogSettingsPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: "General",
    tags: [] as string[],
    featured: false,
    published: true,
    coverImage: "",
    bloggerId: "",
    excerpt: ""
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blogs/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data);
        setFormData({
          category: data.category || "General",
          tags: data.tags || [],
          featured: data.featured || false,
          published: data.published !== false,
          coverImage: data.coverImage || "",
          bloggerId: data.bloggerId || "",
          excerpt: data.excerpt || ""
        });
      } catch (err) {
        toast.error("Failed to load post settings");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/blogs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: ADMIN_EMAIL // Security check
        })
      });

      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Settings...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Post <span className="text-indigo-600">Settings</span></h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Managing: {post?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-xl px-6 h-11 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" /> Platform Visibility
            </h3>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Display Title (SEO)</span>
                <input 
                  type="text"
                  value={post?.title}
                  onChange={(e) => setPost({...post, title: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Article Title"
                />
                <p className="text-[9px] text-slate-400 font-bold mt-1.5 px-1 uppercase tracking-tight">
                  URL Preview: <span className="text-indigo-600">/blog/{post?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}</span>
                </p>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</span>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                >
                  <option>General</option>
                  <option>Developer</option>
                  <option>Tutorial</option>
                  <option>Business</option>
                  <option>Creative</option>
                  <option>Marketing</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Short Excerpt (SEO Description)</span>
                <textarea 
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  placeholder="Describe this post for Google search results..."
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tags (Comma separated)</span>
                <input 
                  type="text"
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData({...formData, tags: e.target.value.split(",").map(t => t.trim())})}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="nextjs, react, blogger..."
                />
              </label>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" /> Media Assets
            </h3>
            <div className="space-y-4">
               <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cover Image URL</span>
                  <input 
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="https://..."
                  />
                </label>
                {formData.coverImage && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
            </div>
          </section>
        </div>

        {/* Right Column: Controls & Blogger Link */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Status</h3>
            <div className="space-y-4">
               <button 
                onClick={() => setFormData({...formData, featured: !formData.featured})}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.featured ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-50"}`}
               >
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 uppercase">Featured Post</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Show in top carousel</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative ${formData.featured ? "bg-indigo-600" : "bg-slate-300"}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.featured ? "right-1" : "left-1"}`} />
                  </div>
               </button>

               <button 
                onClick={() => setFormData({...formData, published: !formData.published})}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.published ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
               >
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 uppercase">Published</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Live on website</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative ${formData.published ? "bg-emerald-500" : "bg-red-500"}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.published ? "right-1" : "left-1"}`} />
                  </div>
               </button>
            </div>
          </section>

          <section className="bg-indigo-900 text-white rounded-3xl p-8 shadow-xl space-y-6">
            <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-400" /> Blogger Connection
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-indigo-300 leading-relaxed">
                Connect this post to a specific Blogger post ID to enable the 1-click edit button.
              </p>
              <label className="block">
                <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Blogger Post ID</span>
                <input 
                  type="text"
                  value={formData.bloggerId}
                  onChange={(e) => setFormData({...formData, bloggerId: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                  placeholder="Paste ID from Blogger URL"
                />
              </label>
              {formData.bloggerId && (
                <a 
                  href={`https://www.blogger.com/blog/post/edit/6418707625664438874/${formData.bloggerId}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-white text-indigo-900 py-3 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Test Blogger Link
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BlogSettingsPage;
