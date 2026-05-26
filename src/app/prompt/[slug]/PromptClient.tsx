"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Sparkles, Heart, Bookmark, Eye, Copy, Check, Share2,
  MessageSquare, History, User, Calendar, Tag, ArrowLeft,
  ThumbsUp, Flame, Lightbulb, Loader2, BarChart3
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Dialog } from "@/components/ui/Dialog";
import { getRankBadge, getRankTitle } from "@/lib/permissions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
import { useAuth } from "@/lib/auth-context";
import { likePrompt, bookmarkPrompt, trackView } from "@/lib/engagement";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

const PromptClient = ({ initialData }: { initialData: any }) => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAdmin: isUserAdmin } = useAuth();
  const [promptData, setPromptData] = useState<any>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const { data: freshData } = useSWR(slug ? `/api/prompts/${slug}` : null, fetcher, {
    fallbackData: initialData,
    refreshInterval: 3000
  });

  useEffect(() => {
    if (freshData) {
      if (freshData.error) {
        setPromptData(null);
        setLoading(false);
        return;
      }
      console.log("[DEBUG] Fresh data received:", freshData.slug, "History count:", freshData.history?.length);
      setPromptData({ ...freshData, id: freshData._id || freshData.slug });
      setLoading(false);
      if (user) {
        setIsLiked(freshData.likedBy?.includes(user.uid) || false);
        setIsBookmarked(freshData.savedBy?.includes(user.uid) || false);
      }
    }
  }, [freshData, user]);

  useEffect(() => {
    if (activeTab === "history") {
      console.log("[DEBUG] History Tab Active. Current History:", promptData?.history);
    }
  }, [activeTab, promptData]);

  useEffect(() => {
    const trackInitialView = async () => {
      if (slug) {
        await fetch(`/api/prompts/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view' })
        });
      }
    };
    trackInitialView();
  }, [slug]);

  const handleLike = async () => {
    if (!user) return toast.error("Please sign in to like this prompt");

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    setPromptData({
      ...promptData,
      likes: !wasLiked ? (promptData.likes || 0) + 1 : Math.max(0, (promptData.likes || 0) - 1),
      likedBy: !wasLiked
        ? [...(promptData.likedBy || []), user.uid]
        : (promptData.likedBy || []).filter((id: string) => id !== user.uid)
    });

    try {
      await fetch(`/api/prompts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', userId: user.uid })
      });

      // Backend now handles notification
    } catch (err) {
      console.error(err);
      setIsLiked(wasLiked); // Revert on failure
    }
  };

  const handleCopy = () => {
    if (!promptData?.content) {
      toast.error("Prompt content not found");
      return;
    }

    try {
      navigator.clipboard.writeText(promptData.content);
      setIsCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleBookmark = async () => {
    if (!user) return toast.error("Please sign in to save this prompt");

    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    setPromptData({
      ...promptData,
      bookmarks: !wasBookmarked ? (promptData.bookmarks || 0) + 1 : Math.max(0, (promptData.bookmarks || 0) - 1),
      savedBy: !wasBookmarked
        ? [...(promptData.savedBy || []), user.uid]
        : (promptData.savedBy || []).filter((id: string) => id !== user.uid)
    });

    try {
      await fetch(`/api/prompts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', userId: user.uid })
      });

      // Backend now handles notification
    } catch (err) {
      console.error(err);
      setIsBookmarked(wasBookmarked); // Revert on failure
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: promptData?.title || "Check out this AI Prompt",
          text: promptData?.description || "Check out this prompt on PromptKar!",
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleReaction = async (reaction: string) => {
    if (!user) return toast.error("Please sign in to react");
    try {
      // Backend now handles notification
      toast.success("Reaction sent!");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-24 mt-8">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
            </div>
            <Skeleton className="h-96 w-full rounded-[2rem]" />
          </div>
          <div className="space-y-8">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="max-w-6xl mx-auto px-4 text-center py-24 space-y-6">
        <h1 className="text-3xl font-bold">Prompt not found</h1>
        <p className="text-foreground/40">The prompt you're looking for doesn't exist or has been removed.</p>
        <Link href="/prompts"><Button variant="primary">Back to Directory</Button></Link>
      </div>
    );
  }

  const formattedDate = formatDateTime(promptData.createdAt);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
      {/* Back Link */}
      <Link href="/prompts" className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to directory</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {promptData.category}
              </span>
              <div className="flex items-center gap-4 text-foreground/40 text-sm">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {promptData.views}</span>
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {promptData.likes}</span>
                <span className="flex items-center gap-1"><Bookmark className="w-4 h-4" /> {promptData.bookmarks}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight flex-1">{promptData.title}</h1>
              {user?.uid === promptData.authorId && (
                <div className="flex items-center gap-2">
                  <Link href={`/edit/${slug}`}>
                    <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50">
                      Edit Prompt
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>

                  <Dialog
                    isOpen={showDeleteDialog}
                    onClose={() => setShowDeleteDialog(false)}
                    title="Delete Prompt"
                    message="Are you sure you want to delete this prompt forever? This action is permanent and cannot be reversed."
                    variant="danger"
                    confirmText="Delete Forever"
                    onConfirm={async () => {
                      try {
                        const res = await fetch(`/api/prompts/${slug}`, { method: 'DELETE' });
                        if (res.ok) {
                          toast.success("Prompt erased");
                          router.push("/prompts");
                        }
                      } catch (err) {
                        toast.error("Deletion failed");
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-foreground/60 text-lg leading-relaxed">
              {promptData.description}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            {["content", "history", "analytics"].filter(tab => {
              if (tab === "content") return true;
              return user?.uid === promptData.authorId || isUserAdmin;
            }).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === tab ? "text-primary" : "text-foreground/40 hover:text-foreground"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Prompt Display */}
          {activeTab === "content" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <Card className="relative border border-slate-100 bg-card overflow-hidden rounded-[2rem] shadow-soft">
                  <CardContent className="p-8 md:p-10">
                    <div className="relative">
                      <div className="bg-slate-900 rounded-[1.5rem] border border-slate-800 shadow-2xl relative group/prompt overflow-hidden">
                        {/* High-Visibility Persistent Copy Button */}
                        <div className="absolute top-6 right-6 z-40">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopy();
                            }}
                            className={`h-10 px-5 rounded-xl text-[11px] font-black transition-all flex items-center gap-2.5 border shadow-xl active:scale-95 ${isCopied
                                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                                : "bg-slate-800 text-slate-200 border-slate-700 hover:text-white hover:bg-slate-700 hover:border-slate-600 backdrop-blur-sm"
                              }`}
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {isCopied ? "COPIED TO CLIPBOARD" : "COPY PROMPT"}
                          </Button>
                        </div>

                        <div className="p-10 md:p-14 pt-20 md:pt-14 text-[14px] md:text-[15.5px] font-mono leading-[1.9] text-indigo-100/90 whitespace-pre-wrap break-words tracking-tight selection:bg-indigo-500/40">
                          {promptData.content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interactions */}
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "secondary" : "outline"}
                    className="gap-2 rounded-full h-11"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    {isLiked ? "Liked" : "Like"}
                  </Button>
                  <Button
                    variant={isBookmarked ? "primary" : "outline"}
                    className="gap-2 rounded-full h-11"
                    onClick={handleBookmark}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>
                  <div className="flex bg-slate-50 border border-slate-100 rounded-full px-2 py-1 gap-1">
                    <button
                      onClick={() => handleReaction("thumbsup")}
                      className="p-1.5 hover:bg-card rounded-full transition-all hover:scale-110 active:scale-95"
                    >
                      <ThumbsUp className="w-4.5 h-4.5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleReaction("fire")}
                      className="p-1.5 hover:bg-card rounded-full transition-all hover:scale-110 active:scale-95"
                    >
                      <Flame className="w-4.5 h-4.5 text-orange-500" />
                    </button>
                    <button
                      onClick={() => handleReaction("lightbulb")}
                      className="p-1.5 hover:bg-card rounded-full transition-all hover:scale-110 active:scale-95"
                    >
                      <Lightbulb className="w-4.5 h-4.5 text-yellow-500" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/enhance?prompt=${encodeURIComponent(promptData.content)}`}>
                    <Button variant="glass" className="gap-2 h-11 border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                      <Sparkles className="w-4 h-4" /> Improve with AI
                    </Button>
                  </Link>
                  <Button variant="outline" className="p-2 w-11 h-11 rounded-xl" onClick={handleShare}>
                    <Share2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (user?.uid === promptData.authorId || isUserAdmin) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {promptData.history && promptData.history.length > 0 ? (
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100" />

                  <div className="space-y-8">
                    {promptData.history?.slice().reverse().map((ver: any, i: number) => (
                      <div key={i} className="relative pl-14">
                        {/* Dot */}
                        <div className="absolute left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-card shadow-sm" />

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                              Version {promptData.history.length - i}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                              {formatDateTime(ver.updatedAt)}
                            </span>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 group/ver relative">
                            <p className="text-[12px] text-slate-600 font-mono leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                              {ver.content}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ver.content);
                                toast.success("Old version copied!");
                              }}
                              className="absolute top-4 right-4 p-2 bg-card rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Original Version */}
                    <div className="relative pl-14">
                      <div className="absolute left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-card shadow-sm shadow-indigo-100" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                            Original Creation
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-card/5 rounded-3xl border border-white/5">
                  <History className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                  <h4 className="font-bold mb-2">No version history yet</h4>
                  <p className="text-xs text-foreground/40">This prompt is in its original masterpiece state.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (user?.uid === promptData.authorId || isUserAdmin) && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Eye className="w-5 h-5 text-indigo-600 mb-3" />
                  <div className="text-2xl font-black text-slate-900">{promptData.views || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Views</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Heart className="w-5 h-5 text-rose-500 mb-3" />
                  <div className="text-2xl font-black text-slate-900">{promptData.likes || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Likes</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Bookmark className="w-5 h-5 text-emerald-500 mb-3" />
                  <div className="text-2xl font-black text-slate-900">{promptData.bookmarks || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Saves</div>
                </div>
              </div>

              {/* Likers List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Community Interaction</h4>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-8">
                  <LikersList slug={slug as string} />
                </div>
              </div>

              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                <BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Advanced metrics coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-foreground/40 font-bold">Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <AuthorAvatar
                  userId={promptData.authorId}
                  name={promptData.authorName}
                  username={promptData.authorUsername}
                  avatar={promptData.authorAvatar}
                  isGlowActive={promptData.authorIsGlowActive}
                  isVerifiedActive={promptData.authorIsVerifiedActive}
                  isAdmin={promptData.authorIsAdmin}
                  customBadge={promptData.authorCustomBadge}
                  customTitle={promptData.authorCustomTitle}
                  className="w-14 h-14"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => router.push(`/profile/${promptData.authorUsername}`)}>
                      @{promptData.authorUsername || "anonymous"}
                    </h4>
                    <span className="text-lg" title={getRankTitle(promptData.authorStreak || 0, promptData.authorIsAdmin, promptData.authorCustomTitle)}>
                      {getRankBadge(promptData.authorStreak || 0, promptData.authorIsAdmin, promptData.authorCustomBadge)}
                    </span>
                    {promptData.authorIsAdmin && (
                      <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">Owner</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/40">
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-bold border border-orange-100 uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" /> {promptData.authorStreak || 0} Day Streak
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">• {getRankTitle(promptData.authorStreak || 0, promptData.authorIsAdmin, promptData.authorCustomTitle)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">Follow Creator</Button>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground/60"><Calendar className="w-4 h-4" /> Created</div>
                <div className="font-medium">{formattedDate}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground/60"><Tag className="w-4 h-4" /> Category</div>
                <div className="font-medium">{promptData.category}</div>
              </div>
              <hr className="border-border" />
              <div className="space-y-3">
                <div className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {promptData.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-card/5 border border-white/10 text-foreground/60">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Prompts */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/40">Related Prompts</h4>
            {[1, 2].map(i => (
              <div key={i} className="group cursor-pointer">
                <div className="text-xs text-primary font-bold mb-1">Image</div>
                <h5 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">Minimalist Architecture Design</h5>
                <p className="text-xs text-foreground/40 line-clamp-2 mt-1">A wide angle shot of a minimalist concrete house in the forest...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LikersList = ({ slug }: { slug: string }) => {
  const { data, error, isLoading } = useSWR(`/api/prompts/${slug}/interactions/all`, fetcher);

  if (isLoading) return <div className="flex items-center gap-4"><Skeleton className="h-12 w-32 rounded-2xl" /><Skeleton className="h-12 w-32 rounded-2xl" /></div>;
  if (error) return <div className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">Failed to load interactions</div>;

  const users = data?.users || [];

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <Heart className="w-8 h-8 text-slate-200 mb-3" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No likes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {users.map((u: any) => (
        <Link key={u.firebaseUid} href={`/profile/${u.username}`}>
          <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group">
            <AuthorAvatar 
              name={u.name} 
              avatar={u.avatar} 
              isGlowActive={u.isGlowActive}
              isVerifiedActive={u.isVerifiedActive}
              isAdmin={u.isAdmin}
              className="w-8 h-8" 
            />
            <div>
              <div className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{u.name}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{u.username}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PromptClient;
