"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar, Clock, ArrowLeft, Bookmark,
  Tag, Heart, Link2, ChevronRight, Sparkles,
  Loader2, Eye, Share2, Trash2, Edit2, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Dialog } from "@/components/ui/Dialog";

const ADMIN_EMAIL = "yatishydv@gmail.com";

const categoryColors: Record<string, string> = {
  Education: "bg-green-50 text-green-700",
  Tutorial: "bg-indigo-50 text-indigo-700",
  Creative: "bg-pink-50 text-pink-700",
  Business: "bg-amber-50 text-amber-700",
  Marketing: "bg-purple-50 text-purple-700",
  Development: "bg-cyan-50 text-cyan-700",
};

// Render markdown-ish content: headings, code blocks, paragraphs
// Render native HTML content with professional typography
// Isolated renderer for Blogger content using Shadow DOM or Iframe to prevent CSS leakage
const BloggerRenderer = ({ content }: { content: string }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Auto-resize iframe to content height
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleResize = () => {
      if (iframe.contentWindow?.document.body) {
        iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
      }
    };

    iframe.onload = () => {
      // Inject some base styles to ensure links open in top window
      const doc = iframe.contentWindow?.document;
      if (doc) {
        const base = doc.createElement('base');
        base.target = '_top';
        doc.head.appendChild(base);
        
        // Hide scrollbars in the iframe
        doc.body.style.overflow = 'hidden';
        doc.body.style.margin = '0';
        doc.body.style.padding = '0';
        
        handleResize();
      }
    };

    // Poll for height changes (images loading etc)
    const interval = setInterval(handleResize, 1000);
    return () => clearInterval(interval);
  }, [content]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={content}
      className="w-full border-none transition-all duration-500"
      title="Blog Content"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
    />
  );
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "danger" | "info" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "info"
  });

  const openDialog = (config: Partial<typeof dialogConfig>) => {
    setDialogConfig(prev => ({ ...prev, ...config, isOpen: true }));
  };

  // Code Enhancer: Add copy buttons to code blocks
  useEffect(() => {
    if (loading || !post) return;
    
    // Tiny delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const blocks = document.querySelectorAll('pre');
      blocks.forEach(block => {
        if (block.querySelector('.copy-btn')) return; // Already added
        
        block.style.position = 'relative';
        const btn = document.createElement('button');
        btn.innerHTML = 'COPY';
        btn.className = 'copy-btn absolute top-4 right-4 px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest hover:bg-indigo-500 z-10 shadow-lg';
        block.classList.add('group'); // For hover effect
        
        btn.onclick = () => {
          const code = block.innerText.replace('COPY', '').trim();
          navigator.clipboard.writeText(code);
          btn.innerHTML = 'COPIED!';
          btn.classList.replace('bg-indigo-600', 'bg-green-500');
          setTimeout(() => {
            btn.innerHTML = 'COPY';
            btn.classList.replace('bg-green-500', 'bg-indigo-600');
          }, 2000);
        };
        block.appendChild(btn);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [loading, post, slug]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const url = user ? `/api/blogs/${slug}?userId=${user.uid}` : `/api/blogs/${slug}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        if (data.success && data.data) {
          setPost(data.data);
          setLikeCount(data.data.likes || 0);
        } else {
          setNotFound(true);
          return;
        }

        // Fetch user engagement from new interaction logic
        if (user) {
          const interactionRes = await fetch(`/api/blogs/${slug}/interactions?userId=${user.uid}`);
          if (interactionRes.ok) {
            const { liked: isLiked, saved: isSaved } = await interactionRes.json();
            setLiked(isLiked);
            setSaved(isSaved);
          }
        }

        // Fetch comments
        fetchComments();

        // Fetch related
        const rel = await fetch(`/api/blogs?category=${encodeURIComponent(data.category)}&limit=4`);
        if (rel.ok) {
          const relData = await rel.json();
          if (relData.success && Array.isArray(relData.data)) {
            setRelated(relData.data.filter((p: any) => p.slug !== slug).slice(0, 3));
          }
        }
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [slug, user]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {}
  };

  const handlePostComment = async () => {
    if (!user || !commentInput.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userName: userData?.name || user.displayName || "User",
          userAvatar: userData?.avatar || user.photoURL || "",
          content: commentInput
        }),
      });
      if (res.ok) {
        setCommentInput("");
        fetchComments();
        toast.success("Comment posted!");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    openDialog({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/blogs/${slug}/comments?commentId=${commentId}&userId=${user.uid}`, {
            method: "DELETE"
          });
          if (res.ok) {
            toast.success("Comment deleted");
            fetchComments();
          }
        } catch {
          toast.error("Failed to delete comment");
        }
      }
    });
  };

  const handleLike = async () => {
    if (!user) return toast.error("Sign in to like articles");
    if (!post || liking) return;
    
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);

    try {
      const res = await fetch(`/api/blogs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikeCount(data.likes);
        setLiked(data.liked);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async () => {
    if (!user) return toast.error("Sign in to save articles");
    if (!post || saving) return;
    
    setSaving(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    toast.success(!wasSaved ? "Saved to library!" : "Removed from library");

    try {
      const res = await fetch(`/api/blogs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
      }
    } catch {
      setSaved(wasSaved);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || "")}&url=${encodeURIComponent(url)}`);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleDelete = async () => {
    openDialog({
      title: "Delete Article",
      message: `Are you sure you want to delete "${post?.title}"? This is permanent.`,
      variant: "danger",
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await fetch(`/api/blogs/${slug}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Article deleted");
            router.push("/blog");
          } else toast.error("Failed to delete");
        } finally { setDeleting(false); }
      }
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading article...</p>
    </div>
  );

  if (notFound || !post) return (
    <div className="text-center py-32 space-y-4">
      <p className="text-5xl">📄</p>
      <h1 className="font-black text-2xl text-slate-900">Article not found</h1>
      <p className="text-slate-400 text-sm">This article may have been removed or doesn't exist.</p>
      <Link href="/blog" className="inline-block mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm">
        ← Back to Blog
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Back */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors group">
          <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Blog
        </Link>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <a 
              href="https://www.blogger.com/u/1/blog/posts/6418707625664438874"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-indigo-200 hover:text-indigo-600 transition-all no-underline"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* Immersive Cover Section */}
      {post.coverImage && (
        <div className="relative w-full mb-16 px-4 md:px-0">
          <div 
            className="relative w-full rounded-[3.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)] bg-slate-100 transition-all duration-1000 ease-out animate-in fade-in zoom-in-95"
            style={{ height: post.coverHeight ? `${post.coverHeight}px` : '500px' }}
          >
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border border-white/10 ${categoryColors[post.category] || "bg-card/20 text-white"}`}>
                  {post.category}
                </span>
                <h1 className="text-4xl md:text-6xl font-[1000] text-white tracking-[-0.04em] leading-[0.9] drop-shadow-2xl">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">
        {/* Article */}
        <article>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-semibold mb-5">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readTime}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.views} views</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-8">{post.title}</h1>

          {/* Author */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-10">
            <AuthorAvatar 
              name={post.author}
              avatar={post.authorAvatar}
              className="w-12 h-12"
            />
            <div>
              <p className="font-black text-slate-900 text-sm">{post.author}</p>
              {post.authorBio && <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-sm">{post.authorBio}</p>}
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[200px]">
             <BloggerRenderer content={post.content} />
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-100">
              <Tag className="w-4 h-4 text-slate-300 mt-0.5" />
              {post.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-4 mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <button onClick={handleLike} disabled={liking} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${liked ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-card text-slate-500 border border-slate-200 hover:border-rose-100 hover:text-rose-500"} ${liking ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-rose-500" : ""}`} /> {likeCount}
            </button>
            <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${saved ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-card text-slate-500 border border-slate-200 hover:border-indigo-100 hover:text-indigo-600"} ${saving ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Bookmark className={`w-4 h-4 ${saved ? "fill-indigo-600" : ""}`} /> {saved ? "Saved" : "Save"}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => handleShare("twitter")} className="w-9 h-9 rounded-xl bg-card border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-100 transition-all">
                <span className="font-black text-sm">𝕏</span>
              </button>
              <button onClick={() => handleShare()} className="w-9 h-9 rounded-xl bg-card border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-12 space-y-8">
            <div className="flex items-center gap-3">
               <MessageSquare className="w-6 h-6 text-slate-400" />
               <h3 className="text-xl font-black text-slate-900">Comments ({comments.length})</h3>
            </div>

            {/* Post Comment */}
            {user ? (
              <div className="bg-card border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <AuthorAvatar 
                      name={userData?.name || user.displayName || "User"}
                      avatar={userData?.avatar || user.photoURL}
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-black text-slate-900">Posting as {userData?.name || user.displayName || "Anonymous"}</span>
                 </div>
                 <textarea 
                   value={commentInput} 
                   onChange={(e) => setCommentInput(e.target.value)}
                   placeholder="Share your thoughts..." 
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all resize-none"
                   rows={3}
                 />
                 <div className="flex justify-end">
                    <button 
                      onClick={handlePostComment}
                      disabled={!commentInput.trim() || postingComment}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {postingComment ? "Posting..." : "Post Comment"}
                    </button>
                 </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
                 <p className="text-sm font-bold text-slate-500 mb-4">Sign in to join the conversation</p>
                 <button onClick={() => router.push("/login")} className="px-6 py-2.5 bg-card border border-slate-200 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Sign In</button>
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-6">
              {comments.map((c: any) => (
                <div key={c._id} className="flex gap-4 group">
                   <AuthorAvatar 
                     name={c.userName}
                     avatar={c.userAvatar}
                     className="w-10 h-10"
                   />
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <h5 className="text-sm font-black text-slate-900">{c.userName}</h5>
                            {c.userId === user?.uid && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">You</span>}
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(c.createdAt).toLocaleDateString()}</span>
                            {c.userId === user?.uid && (
                              <button 
                                onClick={() => handleDeleteComment(c._id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                         </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
                   </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-center py-12 text-sm font-bold text-slate-400 italic">No comments yet. Be the first!</p>}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {related.length > 0 && (
            <div className="bg-card border border-slate-100 rounded-2xl p-5">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Related
              </h3>
              <div className="space-y-3">
                {related.map(rel => (
                  <Link key={rel.slug} href={`/blog/${rel.slug}`} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0 group-hover:text-indigo-600" />
                    <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">{rel.title}</p>
                  </Link>
                ))}
              </div>
              <Link href="/blog" className="flex items-center gap-1 text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-4 hover:underline">
                All articles <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto opacity-80" />
            <p className="font-black text-sm">Try these prompts now</p>
            <p className="text-xs text-white/70">Browse our community library of AI prompts.</p>
            <Link href="/prompts" className="block mt-2 bg-card text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
              Browse Prompts
            </Link>
          </div>
        </aside>
      </div>

      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
        confirmText="Confirm"
      />
    </div>
  );
};

export default BlogPostPage;
