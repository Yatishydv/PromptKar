"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, ArrowLeft, Send, Sparkles, Camera, 
  Code, PenTool, Globe, FileText, Layout, 
  MessageSquare, LayoutGrid, Box, Palette, 
  Terminal, Rocket, Zap, Heart, Eye, Bookmark, 
  Copy, ChevronRight, Check, Loader2, History
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import slugify from "slugify";

const CATEGORIES = [
  "Image", "Marketing", "Coding", "Writing", "Business", 
  "Education", "Blog Writing", "Social Media", "Copywriting", 
  "Midjourney", "Design", "Development", "Photography", 
  "General", "Other"
];

const CATEGORY_ICONS: Record<string, any> = {
  "Image": Camera,
  "Marketing": Zap,
  "Coding": Code,
  "Writing": PenTool,
  "Business": Globe,
  "Education": FileText,
  "Blog Writing": Layout,
  "Social Media": MessageSquare,
  "Copywriting": LayoutGrid,
  "Midjourney": Box,
  "Design": Palette,
  "Development": Code,
  "Photography": Camera,
  "General": Sparkles,
  "Other": Rocket
};

const CreatePromptPage = () => {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "General",
    tags: "",
    level: "Standard"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Opening the Studio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-card rounded-[2.5rem] p-12 text-center shadow-2xl border border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <Plus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Login Required</h1>
          <p className="text-slate-500 mb-8 font-bold leading-relaxed text-sm">Please sign in to create and share prompts.</p>
          <Button onClick={() => router.push("/login")} className="w-full bg-indigo-600 h-12 rounded-xl font-black text-xs uppercase tracking-widest">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.description) {
      toast.error("Please fill in all the basic info!");
      return;
    }

    setIsSubmitting(true);
    const slug = slugify(formData.title, { lower: true, strict: true }) + "-" + Math.random().toString(36).substring(2, 7);

    const payload = {
      ...formData,
      slug,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      authorId: user.uid,
      authorName: userData?.displayName || user.displayName || "Anonymous",
      authorUsername: userData?.username || user.displayName || "user",
      authorAvatar: userData?.photoURL || user.photoURL || "",
      likes: 0,
      views: 0,
      createdAt: new Date(),
      history: [{ content: formData.content, updatedAt: new Date() }]
    };

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Prompt shared successfully!");
        router.push(`/prompt/${slug}`);
      }
    } catch (err: any) {
      toast.error("Failed to share prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPreview = () => {
    if (!formData.content) return;
    navigator.clipboard.writeText(formData.content);
    setIsCopied(true);
    toast.success("Preview copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/prompts" className="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create <span className="text-indigo-600">New Prompt</span></h1>
          <p className="text-[14px] text-slate-400 font-bold">Share your best AI instructions with the community.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Form Column */}
        <div className="col-span-12 lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-card border border-slate-100 rounded-[2.5rem] p-10 shadow-sm space-y-10">
              {/* Basics Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest">The Basics</label>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase ml-1">Name your Prompt</p>
                    <input 
                      type="text"
                      placeholder="e.g., Professional Blog Writer"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-[15px] font-bold text-slate-900 focus:border-indigo-600/10 focus:bg-card focus:ring-0 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase ml-1">What does it do?</p>
                    <textarea 
                      placeholder="Give it a short, simple description..."
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-[14px] font-medium text-slate-600 focus:border-indigo-600/10 focus:bg-card focus:ring-0 transition-all placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Organization</label>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase ml-1">Category</p>
                    <div className="relative">
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase ml-1">Level</p>
                    <div className="relative">
                      <select 
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase ml-1">Tags / Keywords (comma separated)</p>
                  <input 
                    type="text"
                    placeholder="e.g., seo, marketing, writing"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-[14px] font-medium text-slate-600 focus:border-indigo-600/10 focus:bg-card focus:ring-0 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest">The Prompt Content</label>
                </div>
                <div className="space-y-2">
                  <textarea 
                    placeholder="Paste your prompt instructions here..."
                    rows={10}
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-6 px-6 text-[14px] font-mono leading-relaxed text-slate-700 focus:border-indigo-600/10 focus:bg-card focus:ring-0 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white h-20 rounded-[2rem] font-black text-lg shadow-indigo group"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" /> Sharing Prompt...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Share Prompt <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Preview Column */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="sticky top-10 space-y-8">
            <div className="flex items-center gap-2 ml-4">
               <Eye className="w-4 h-4 text-slate-400" />
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Live Preview</span>
            </div>

            <Card className="relative border border-slate-100 bg-card overflow-hidden rounded-[2.5rem] shadow-premium group">
               <div className="p-8 md:p-10 space-y-8">
                  {/* Preview Header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                        {formData.category}
                      </span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                      {formData.title || "Untitled Prompt"}
                    </h1>
                    <p className="text-slate-500 text-[13px] font-medium leading-relaxed line-clamp-2">
                      {formData.description || "Your prompt's description."}
                    </p>
                  </div>

                  {/* Preview Prompt Box */}
                  <div className="bg-slate-900 rounded-[1.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-5 right-5 z-20">
                      <button 
                        onClick={handleCopyPreview}
                        className={`h-8 px-4 rounded-lg text-[9px] font-black flex items-center gap-2 border transition-all ${isCopied ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700"}`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    <div className="p-10 pt-16 text-[12px] font-mono leading-[1.8] text-indigo-100/90 whitespace-pre-wrap min-h-[160px]">
                      {formData.content || "Your prompt content will appear here..."}
                    </div>
                  </div>

                  {/* Preview Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <AuthorAvatar 
                      userId={user.uid} 
                      name={userData?.name || user.displayName || "Engineer"} 
                      avatar={userData?.avatar || user.photoURL || ""} 
                      showName={true}
                      nameClassName="text-[12px] font-black text-slate-900"
                    />
                  </div>
               </div>
            </Card>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-premium group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-card/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                     <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="text-xl font-black tracking-tight">Need help?</h4>
                     <p className="text-[12.5px] font-bold text-indigo-100 mt-1">Try our AI Enhancer to refine your instructions before sharing.</p>
                  </div>
                  <Button 
                    onClick={() => router.push("/enhance")}
                    className="w-full bg-card text-indigo-600 hover:bg-indigo-50 border-none rounded-xl h-11 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Open AI Lab
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePromptPage;
