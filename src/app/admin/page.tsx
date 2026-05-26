"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  LayoutDashboard, FileText, Sparkles, Users, BarChart3,
  Settings, Bell, Search, Plus, Edit2, Trash2, Check, X,
  Loader2, ExternalLink, ShieldCheck, Heart, Eye, Flame
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSystem } from "@/lib/system-context";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";

const ADMIN_EMAIL = "yatishydv@gmail.com";

const AdminPanel = () => {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { refreshSettings } = useSystem();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({
    maintenanceMode: false,
    announcementsEnabled: true,
    announcements: [],
    announcementCloseable: true
  });
  const [loading, setLoading] = useState(true);

  // Engagement state
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);
  const [likers, setLikers] = useState<any[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: 'all',
    username: '',
    message: '',
    linkType: 'none',
    linkTarget: '',
    modalTitle: '',
    modalIcon: 'zap',
    modalBody: ''
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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
    onConfirm: () => { },
    variant: "info"
  });

  const openDialog = (config: Partial<typeof dialogConfig>) => {
    setDialogConfig(prev => ({ ...prev, ...config, isOpen: true }));
  };

  const viewLikers = async (slug: string) => {
    if (selectedBlog === slug) {
      setSelectedBlog(null);
      return;
    }
    setSelectedBlog(slug);
    setLikersLoading(true);
    try {
      const res = await fetch(`/api/blogs/${slug}/interactions/all`);
      const data = await res.json();
      setLikers(data.users || []);
    } catch {
      toast.error("Failed to load likers");
    } finally {
      setLikersLoading(false);
    }
  };

  // Security check
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, pRes, uRes, bRes, settingsRes, approvalsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/prompts?limit=10"),
        fetch("/api/users?limit=10"),
        fetch("/api/blogs?limit=10"),
        fetch("/api/admin/settings"),
        // Only fetch approvals if Head Admin
        user?.email === "yatishydv@gmail.com" ? fetch("/api/admin/approvals") : Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats([
          { name: "Total Users", value: sData.users, icon: <Users className="w-5 h-5 text-blue-500" /> },
          { name: "Total Prompts", value: sData.prompts, icon: <Sparkles className="w-5 h-5 text-indigo-500" /> },
          { name: "Blog Posts", value: sData.blogs, icon: <FileText className="w-5 h-5 text-green-500" /> },
          { name: "Total Platform Views", value: sData.views, icon: <Eye className="w-5 h-5 text-emerald-500" /> },
        ]);
        if (showLoading) setLoading(false);
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSystemSettings(sData);
      }

      if (approvalsRes && approvalsRes.ok) {
        setApprovals(await approvalsRes.json());
      }

      if (pRes.ok) {
        const data = await pRes.ok ? await pRes.json() : { data: [] };
        setRecentPrompts(Array.isArray(data) ? data : data.data || []);
      }
      if (uRes.ok) {
        const data = await uRes.json();
        setRecentUsers(Array.isArray(data) ? data : data.data || []);
      }
      if (bRes.ok) {
        const data = await bRes.json();
        setBlogPosts(Array.isArray(data) ? data : data.data || []);
      }

    } catch (err) {
      console.error("Admin fetch error:", err);
      if (showLoading) toast.error("Failed to refresh real-time stats");
    } finally {
      if (showLoading) setLoading(false); // Ensure loading is false even on total failure
    }
  };

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'x-requester-id': user?.uid || '',
      'x-requester-email': user?.email || '',
      'x-requester-name': user?.displayName || ''
    };
    return fetch(url, { ...options, headers });
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      // Merge updates with current local state to ensure we always send a complete object
      const fullPayload = { ...systemSettings, ...updates };

      const res = await adminFetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload)
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Update failed");

      if (updated.queued) {
        toast.success(updated.message);
        return;
      }

      // Update local state with the exact object returned by the database
      setSystemSettings(updated);
      await refreshSettings();

      toast.success("Push successful! Site updated and saved.");
    } catch (err) {
      console.error("Critical Update Error:", err);
      toast.error("Failed to push updates");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      
      // Auto-refresh for Head Admin approvals and stats in the background without loading indicator
      let interval: NodeJS.Timeout;
      if (user?.email === "yatishydv@gmail.com") {
        interval = setInterval(() => {
          fetchData(false);
        }, 15000); // 15 seconds
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isAdmin, user?.email]);

  const handleDeletePrompt = async (slug: string) => {
    openDialog({
      title: "Delete Prompt",
      message: "Are you sure you want to delete this prompt forever? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/prompts/${slug}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) {
            if (data.queued) {
              toast.success(data.message);
            } else {
              toast.success("Prompt deleted");
              setRecentPrompts(prev => prev.filter(p => p.slug !== slug));
            }
          }
        } catch {
          toast.error("Failed to delete prompt");
        }
      }
    });
  };

  const handleDeleteBlog = async (slug: string) => {
    openDialog({
      title: "Delete Blog Post",
      message: "Are you sure you want to delete this article? All local metadata will be lost.",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/blogs/${slug}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) {
            if (data.queued) {
              toast.success(data.message);
            } else {
              toast.success("Blog deleted");
              setBlogPosts(prev => prev.filter(b => b.slug !== slug));
            }
          }
        } catch {
          toast.error("Failed to delete blog");
        }
      }
    });
  };

  const handleSyncBlogger = async () => {
    setSyncing(true);
    try {
      const res = await adminFetch("/api/admin/blog/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        if (!data.queued) fetchData(); // Refresh list only if actually executed
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.message) {
      toast.error("Message is required");
      return;
    }
    if (broadcastForm.targetAudience === 'specific' && !broadcastForm.username) {
      toast.error("Username is required for specific targets");
      return;
    }

    setIsBroadcasting(true);
    try {
      let finalLinkTarget = broadcastForm.linkTarget;
      if (broadcastForm.linkType === 'modal') {
        const modalData = {
          title: broadcastForm.modalTitle || 'System Notification',
          icon: broadcastForm.modalIcon || 'bell',
          content: broadcastForm.modalBody || broadcastForm.message
        };
        finalLinkTarget = Buffer.from(JSON.stringify(modalData)).toString('base64');
      }

      const res = await adminFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...broadcastForm,
          linkTarget: finalLinkTarget
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        setBroadcastForm({
          targetAudience: 'all',
          username: '',
          message: '',
          linkType: 'none',
          linkTarget: '',
          modalTitle: '',
          modalIcon: 'zap',
          modalBody: ''
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleResetStreak = async (userId: string | null = null, resetAll = false) => {
    openDialog({
      title: resetAll ? "Reset Community Streaks" : "Reset User Streak",
      message: resetAll
        ? "This will wipe all activity dates and streaks for EVERY user on the platform. This is irreversible."
        : "Are you sure you want to reset the streak for this user to zero?",
      variant: "danger",
      onConfirm: async () => {
        const loadingToast = toast.loading(resetAll ? "Resetting all streaks..." : "Resetting streak...");
        try {
          const res = await adminFetch("/api/admin/reset-streaks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, resetAll })
          });

          const data = await res.json();
          if (res.ok) {
            toast.success(data.message, { id: loadingToast });
            if (!data.queued) fetchData(); // Refresh data to show 0
          } else {
            throw new Error(data.error);
          }
        } catch (err: any) {
          toast.error(err.message || "Reset failed", { id: loadingToast });
        }
      }
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await adminFetch("/api/admin/users/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.firebaseUid,
          updates: {
            role: editingUser.role,
            customBadge: editingUser.customBadge,
            customTitle: editingUser.customTitle,
            isAdmin: editingUser.isAdmin,
            isPro: editingUser.isPro
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setEditingUser(null);
        if (!data.queued) fetchData(); // Refresh list
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleApproval = async (actionId: string, decision: 'APPROVED' | 'REJECTED') => {
    const loadingToast = toast.loading(`Processing action...`);
    try {
      const res = await adminFetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId,
          decision,
          headAdminEmail: user?.email
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: loadingToast });
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Approval failed", { id: loadingToast });
    }
  };

  if (authLoading || (loading && isAdmin)) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pb-20 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-5">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-8" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
          <Skeleton className="w-32 h-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-1 space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="w-full h-11 rounded-2xl" />)}
          </div>
          <div className="lg:col-span-4 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-32 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {[1, 2].map(i => <Skeleton key={i} className="w-full h-64 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-2xl border border-white/10 relative z-10 backdrop-blur-xl">
              <LayoutDashboard className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-[900] text-slate-900 tracking-tighter italic uppercase">Admin <span className="text-indigo-600">Hub</span></h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Secure Command Center • {user?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.blogger.com/u/1/blog/posts/6418707625664438874"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 text-white border-none rounded-xl h-11 px-6 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all no-underline"
          >
            <Plus className="w-4 h-4" /> New Blog Post
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-4 lg:pb-0 sticky top-20 lg:top-24 z-20 hide-scrollbar bg-background">
          {[
            { id: "dashboard", name: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "prompts", name: "Prompts", icon: <Sparkles className="w-4 h-4" /> },
            { id: "blogs", name: "Blog Posts", icon: <FileText className="w-4 h-4" /> },
            { id: "users", name: "Users", icon: <Users className="w-4 h-4" /> },
            { id: "streaks", name: "Streaks", icon: <Flame className="w-4 h-4" /> },
            { id: "settings", name: "Settings", icon: <Settings className="w-4 h-4" /> },
            ...(user?.email === "yatishydv@gmail.com" ? [
              { id: "approvals", name: "Approvals", icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
              { id: "broadcasts", name: "Broadcasts", icon: <Bell className="w-4 h-4 text-blue-500" /> }
            ] : [])
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-none shrink-0 lg:w-full ${activeTab === item.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600 bg-card lg:bg-transparent"
                }`}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-4 space-y-8">

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <Card key={stat.name} className="border-slate-100 shadow-sm overflow-hidden hover:border-indigo-100 transition-all group relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:from-indigo-500/10 transition-all duration-700" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                          idx === 0 ? "bg-blue-50 text-blue-600 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                          idx === 1 ? "bg-indigo-50 text-indigo-600 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.3)]" :
                          idx === 2 ? "bg-green-50 text-green-600 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                          "bg-emerald-50 text-emerald-600 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        }`}>
                          {stat.icon}
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-full backdrop-blur-sm border border-indigo-100/30">LIVE</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                      <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1 opacity-80">{stat.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity Lists */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Prompts */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Recent Prompts</CardTitle>
                    <button onClick={() => setActiveTab("prompts")} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">View All</button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {recentPrompts.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="relative group/avatar">
                              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover/avatar:opacity-50 transition duration-1000 group-hover/avatar:duration-200"></div>
                              <AuthorAvatar
                                userId={p.authorId}
                                name={p.authorName}
                                username={p.authorUsername || p.authorName}
                                avatar={p.authorAvatar}
                                className="w-10 h-10 relative border-2 border-card shadow-sm"
                                isAdmin={true}
                                isGlowActive={true}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900 line-clamp-1">{p.title}</div>
                              <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">@{p.authorName || "anon"}</div>
                            </div>
                          </div>
                          <Link href={`/prompt/${p.slug}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-100 hover:border-indigo-100 hover:bg-card text-slate-400 hover:text-indigo-600">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {recentPrompts.length === 0 && <div className="p-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">No prompts yet</div>}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Recent Users</CardTitle>
                    <button onClick={() => setActiveTab("users")} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">View All</button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {recentUsers.slice(0, 5).map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[2px] opacity-20 group-hover:opacity-40 transition-opacity" />
                              <AuthorAvatar 
                                name={u.name || u.username} 
                                username={u.username}
                                avatar={u.avatar} 
                                className="w-10 h-10 relative border-2 border-card shadow-sm" 
                                isAdmin={u.isAdmin}
                                isGlowActive={u.isGlowActive}
                                isVerifiedActive={u.isVerifiedActive}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900">@{u.username}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.name || u.username}</div>
                            </div>
                          </div>
                          <Link href={`/profile/${u.username}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-3 border-slate-100 hover:border-indigo-100 hover:text-indigo-600">Profile</Button>
                          </Link>
                        </div>
                      ))}
                      {recentUsers.length === 0 && <div className="p-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">No users yet</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PROMPTS TAB */}
          {activeTab === "prompts" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Recalculate Likes Card */}
              <Card className="border-indigo-100 bg-indigo-50/20 shadow-sm overflow-hidden mb-6">
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-indigo-500 shrink-0" />
                      Recalculate Like Counts
                    </h3>
                    <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest">Sync all user totalLikes from actual prompt data</p>
                  </div>
                  <Button
                    onClick={async () => {
                      const loadingToast = toast.loading("Recalculating all like counts...");
                      try {
                        const res = await adminFetch("/api/admin/recalculate-likes", { method: "POST" });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success(data.message, { id: loadingToast });
                          if (!data.queued) fetchData(); // Refresh data
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Recalculation failed", { id: loadingToast });
                      }
                    }}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white border-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 flex justify-center items-center gap-2 shrink-0"
                  >
                    <BarChart3 className="w-4 h-4" /> Recalculate Now
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-card border border-slate-100 p-4 rounded-2xl shadow-sm gap-4">
                <div className="relative w-full sm:flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input type="text" placeholder="Search prompts to manage..." className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold placeholder-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 sm:px-4 w-full sm:w-auto text-center sm:text-right">{recentPrompts.length} TOTAL</div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {recentPrompts.map((p, i) => (
                  <Card key={i} className="border-slate-100 hover:border-indigo-100 shadow-sm transition-all group overflow-hidden">
                    <div className="flex items-center gap-4 p-3">
                        <AuthorAvatar
                          userId={p.authorId}
                          name={p.authorName}
                          username={p.authorUsername || p.authorName}
                          avatar={p.authorAvatar}
                          className="w-14 h-14"
                        />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-slate-900 truncate">{p.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          <span className="text-indigo-600">@{p.authorName}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5" /> {p.likes}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pr-2">
                        <Link href={`/prompt/${p.slug}`} target="_blank">
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-100 hover:border-indigo-100 hover:text-indigo-600 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDeletePrompt(p.slug)}
                          variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-100 hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* BLOGS TAB */}
          {activeTab === "blogs" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-card border border-slate-100 p-4 rounded-2xl shadow-sm gap-4">
                <div className="relative w-full sm:flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input type="text" placeholder="Search articles..." className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold placeholder-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handleSyncBlogger}
                    disabled={syncing}
                    size="sm"
                    className="h-9 bg-emerald-600 text-white rounded-xl px-4 font-black text-[10px] uppercase tracking-widest border-none hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                  >
                    {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Sync Blogger
                  </Button>
                  <a
                    href="https://www.blogger.com/u/1/blog/posts/6418707625664438874"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 bg-indigo-600 text-white rounded-xl px-4 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md no-underline"
                  >
                    <Plus className="w-3 h-3" /> Create New
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {blogPosts.map((b, i) => (
                  <div key={i} className="space-y-2">
                    <Card className="border-slate-100 hover:border-indigo-100 shadow-sm transition-all group overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-3">
                        <div className="w-full sm:w-24 h-40 sm:h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-inner group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all">
                          <img src={b.coverImage || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=200&auto=format&fit=crop"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" alt="" />
                        </div>
                        <div className="flex-1 w-full min-w-0">
                          <h4 className="font-black text-sm text-slate-900 truncate">{b.title}</h4>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 sm:mt-1">
                            {b.tags?.length > 0 ? (
                              b.tags.slice(0, 3).map((t: string) => (
                                <span key={t} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">{t}</span>
                              ))
                            ) : (
                              <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">{b.category}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-500"><Eye className="w-2.5 h-2.5" /> {b.views}</span>
                            <span>•</span>
                            <button
                              onClick={() => viewLikers(b.slug)}
                              className="flex items-center gap-1 text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md transition-all active:scale-95"
                              title="View who liked this"
                            >
                              <Heart className="w-2.5 h-2.5" /> {b.likes || 0} <span className="lowercase text-[9px] font-bold opacity-60">(view)</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex w-full sm:w-auto gap-2 sm:pr-2 justify-end border-t border-slate-50 sm:border-none pt-3 sm:pt-0 mt-1 sm:mt-0">
                          {/* Content Edit (Blogger) */}
                          <a
                            href="https://www.blogger.com/u/1/blog/posts/6418707625664438874"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-100 bg-card text-slate-400 hover:border-indigo-100 hover:text-indigo-600 transition-all"
                            title="Edit Content on Blogger"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </a>

                          {/* Local Settings (Metadata) */}
                          <Link href={`/admin/blog/settings/${b.slug}`}>
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-100 hover:border-indigo-100 hover:text-indigo-600 transition-all" title="Manage Website Settings (Category, Meta, etc.)">
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            onClick={() => handleDeleteBlog(b.slug)}
                            variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-100 hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Expandable Likers View */}
                    {selectedBlog === b.slug && (
                      <div className="mx-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">People who liked this post</h5>
                          <button onClick={() => setSelectedBlog(null)}><X className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {likersLoading ? (
                            <div className="flex flex-wrap gap-2 py-2">
                              {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="w-24 h-8 rounded-xl" />
                              ))}
                            </div>
                          ) : likers.length > 0 ? (
                            likers.map((u: any) => (
                              <div key={u.userId} className="flex items-center gap-2 bg-card px-2.5 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                                <AuthorAvatar 
                                  name={u.name} 
                                  username={u.username || u.name}
                                  avatar={u.avatar} 
                                  className="w-6 h-6" 
                                  isAdmin={u.isAdmin}
                                  isGlowActive={u.isGlowActive}
                                  isVerifiedActive={u.isVerifiedActive}
                                />
                                <span className="text-[10px] font-bold text-slate-700">{u.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] font-bold text-indigo-300 italic w-full text-center py-2">No likes recorded for this post.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Reset Avatars Card */}
              <Card className="border-orange-100 bg-orange-50/20 shadow-sm overflow-hidden mb-6">
                <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-orange-900 flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-orange-500 shrink-0" />
                      Enforce Avatar Streak Rules
                    </h3>
                    <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest">Strip custom/Google photos from users lacking a 365-day streak</p>
                  </div>
                  <Button
                    onClick={async () => {
                      const loadingToast = toast.loading("Auditing user avatars...");
                      try {
                        const res = await adminFetch("/api/admin/reset-avatars", { method: "POST" });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success(data.message, { id: loadingToast });
                          if (!data.queued) fetchData(); // Refresh data
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Audit failed", { id: loadingToast });
                      }
                    }}
                    className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white border-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-100 flex justify-center items-center gap-2 shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" /> Audit & Reset Avatars
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-card border border-slate-100 p-4 rounded-2xl shadow-sm gap-4">
                <div className="relative w-full sm:flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input type="text" placeholder="Search community members..." className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold placeholder-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 sm:px-4 w-full sm:w-auto text-center sm:text-right">{recentUsers.length} MEMBERS</div>
              </div>

              <div className="bg-card border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                    <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stats</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AuthorAvatar 
                              name={u.name || u.username} 
                              username={u.username}
                              avatar={u.avatar} 
                              className="w-10 h-10" 
                              isAdmin={u.isAdmin}
                              isGlowActive={u.isGlowActive}
                              isVerifiedActive={u.isVerifiedActive}
                            />
                            <div>
                              <div className="text-xs font-black text-slate-900">@{u.username}</div>
                              <div className="text-[10px] font-bold text-slate-400">{u.name || "No Name"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {u.totalLikes}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {u.followers?.length || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {/* Hide actions for Head Admin if viewed by Sub-Admin */}
                          {!(u.email === "yatishydv@gmail.com" && user?.email !== "yatishydv@gmail.com") ? (
                            <>
                              <Button
                                onClick={() => setEditingUser(u)}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-100 text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50 rounded-lg"
                                title="Edit Role & Badges"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleResetStreak(u.firebaseUid)}
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-100 text-orange-500 hover:border-orange-100 hover:bg-orange-50 rounded-lg"
                                title="Reset Streak"
                              >
                                <Flame className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-300 pr-2">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Protected
                            </div>
                          )}
                          <Link href={`/profile/${u.username}`}>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-3 border-slate-100 hover:border-indigo-100 hover:text-indigo-600">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          )}

          {/* CLEAN REWRITE OF SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Card className="border-slate-100 shadow-2xl rounded-[40px] overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white">
                  <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Settings className="w-8 h-8 text-indigo-400" />
                    Platform Settings
                  </h2>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest opacity-80">Global control panel for site behavior</p>
                </div>

                <CardContent className="p-10 space-y-12">
                  {/* Toggles Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Maintenance Mode</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Lock site for everyone except you</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings((prev: any) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        className={`w-14 h-7 rounded-full relative transition-all ${systemSettings.maintenanceMode ? "bg-red-500 shadow-lg shadow-red-100" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-card rounded-full shadow-md transition-all ${systemSettings.maintenanceMode ? "right-1" : "left-1"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Global Announcements</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Toggle all site-wide alerts</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings((prev: any) => ({ ...prev, announcementsEnabled: !prev.announcementsEnabled }))}
                        className={`w-14 h-7 rounded-full relative transition-all ${systemSettings.announcementsEnabled ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-card rounded-full shadow-md transition-all ${systemSettings.announcementsEnabled ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Announcement Manager */}
                  {systemSettings.announcementsEnabled && (
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 animate-in zoom-in-95 duration-500">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200/50 pb-6 gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Live Broadcasts</h3>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-card border border-slate-100 text-indigo-600 rounded-full text-[10px] font-black uppercase shadow-sm">
                            <button
                              onClick={() => setSystemSettings((prev: any) => ({ ...prev, announcementCloseable: !prev.announcementCloseable }))}
                              className={`w-8 h-4 rounded-full relative transition-all ${systemSettings.announcementCloseable ? "bg-indigo-600" : "bg-slate-300"}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-card rounded-full transition-all ${systemSettings.announcementCloseable ? "right-0.5" : "left-0.5"}`} />
                            </button>
                            Dismissible
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSystemSettings((prev: any) => ({
                              ...prev,
                              announcements: [...(prev.announcements || []), { text: "Enter message here...", enabled: true }]
                            }));
                          }}
                          className="w-full sm:w-auto bg-slate-900 text-white rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Message
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(systemSettings.announcements || []).map((ann: any, idx: number) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-top-4 duration-300 relative">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-card border border-slate-100 text-slate-900 shadow-sm items-center justify-center font-black text-sm shrink-0">{idx + 1}</div>
                            <input
                              type="text"
                              value={ann.text}
                              onChange={(e) => {
                                setSystemSettings((prev: any) => {
                                  const arr = [...prev.announcements];
                                  arr[idx].text = e.target.value;
                                  return { ...prev, announcements: arr };
                                });
                              }}
                              className="w-full sm:flex-1 bg-card border border-slate-200 rounded-[20px] px-6 py-4 text-sm font-bold text-slate-700 focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 transition-all outline-none shadow-sm pr-14 sm:pr-6"
                              placeholder="Message text with [link text](url)..."
                            />
                            <Button
                              onClick={() => {
                                setSystemSettings((prev: any) => ({
                                  ...prev,
                                  announcements: prev.announcements.filter((_: any, i: number) => i !== idx)
                                }));
                              }}
                              className="absolute right-2 top-2 sm:relative sm:top-auto sm:right-auto w-10 h-10 sm:w-12 sm:h-12 p-0 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-[16px] sm:rounded-[20px] transition-all shadow-sm shrink-0"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Tip: Use <span className="text-indigo-600">[Some Text](https://...)</span> to create underlined links inside messages.</p>
                    </div>
                  )}

                  {/* Final Save */}
                  <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
                    <Button
                      onClick={() => handleUpdateSettings(systemSettings)}
                      className="w-full max-w-lg bg-indigo-600 text-white rounded-[24px] h-16 font-black text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.2)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4"
                    >
                      <Check className="w-6 h-6" /> PUSH UPDATES LIVE
                    </Button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Secure & Atomic Sync Active
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === "approvals" && user?.email === "yatishydv@gmail.com" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pending Actions</h2>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-1">Review actions requested by sub-admins</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4" /> Head Admin Access
                </div>
              </div>

              {approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Queue is Clear</h3>
                  <p className="text-sm font-bold text-slate-500 max-w-sm">No pending actions require your approval at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map((action) => (
                    <Card key={action._id} className="border-slate-100 shadow-sm hover:border-emerald-100 transition-all overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                {action.actionType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Users className="w-3 h-3" /> BY: {action.requestedByName} ({action.requestedByEmail})
                              </span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-mono text-slate-600 overflow-x-auto">
                              <pre>{JSON.stringify(action.payload, null, 2)}</pre>
                            </div>
                          </div>
                          
                          <div className="flex flex-row md:flex-col gap-3 shrink-0">
                            <Button
                              onClick={() => handleApproval(action._id, 'APPROVED')}
                              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleApproval(action._id, 'REJECTED')}
                              className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                            >
                              <X className="w-4 h-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BROADCASTS TAB (HEAD ADMIN ONLY) */}
          {activeTab === "broadcasts" && user?.email === "yatishydv@gmail.com" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900">Broadcast Notifications</CardTitle>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Send custom alerts directly to users</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Target Audience</label>
                        <select
                          value={broadcastForm.targetAudience}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                          className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="all">All Users (Global Broadcast)</option>
                          <option value="specific">Specific User</option>
                        </select>
                      </div>

                      {broadcastForm.targetAudience === 'specific' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Target Username</label>
                          <AutocompleteInput
                            type="users"
                            placeholder="e.g. johndoe"
                            value={broadcastForm.username}
                            onChange={(val) => setBroadcastForm({ ...broadcastForm, username: val })}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Message Text</label>
                      <textarea
                        placeholder="Type your notification message here..."
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                        rows={3}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">On Click Action</label>
                        <select
                          value={broadcastForm.linkType}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, linkType: e.target.value })}
                          className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="none">None (Just Info)</option>
                          <option value="url">Open External URL</option>
                          <option value="modal">Open Interactive Modal</option>
                          <option value="profile">Go to Profile</option>
                          <option value="prompt">Go to Prompt</option>
                        </select>
                      </div>

                      {broadcastForm.linkType !== 'none' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            {broadcastForm.linkType === 'url' ? 'Link URL' :
                             broadcastForm.linkType === 'modal' ? 'Modal ID / Parameter' :
                             broadcastForm.linkType === 'profile' ? 'Username' :
                             'Prompt Slug'}
                          </label>
                          {broadcastForm.linkType === 'profile' || broadcastForm.linkType === 'prompt' ? (
                            <AutocompleteInput
                              type={broadcastForm.linkType === 'profile' ? "users" : "prompts"}
                              placeholder={broadcastForm.linkType === 'profile' ? 'johndoe' : 'my-cool-prompt'}
                              value={broadcastForm.linkTarget}
                              onChange={(val) => setBroadcastForm({ ...broadcastForm, linkTarget: val })}
                            />
                          ) : broadcastForm.linkType === 'modal' ? (
                            <div className="space-y-4 pt-2">
                              <input
                                type="text"
                                placeholder="Modal Title (e.g. New Feature!)"
                                value={broadcastForm.modalTitle}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, modalTitle: e.target.value })}
                                className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                              />
                              <select
                                value={broadcastForm.modalIcon}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, modalIcon: e.target.value })}
                                className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                              >
                                <option value="zap">Lightning (Zap)</option>
                                <option value="award">Award / Trophy</option>
                                <option value="check">Success Check</option>
                                <option value="bell">Notification Bell</option>
                              </select>
                              <textarea
                                placeholder="Modal Body (Optional, defaults to message text)"
                                value={broadcastForm.modalBody}
                                onChange={(e) => setBroadcastForm({ ...broadcastForm, modalBody: e.target.value })}
                                rows={2}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder={
                                broadcastForm.linkType === 'url' ? 'https://...' :
                                ''
                              }
                              value={broadcastForm.linkTarget}
                              onChange={(e) => setBroadcastForm({ ...broadcastForm, linkTarget: e.target.value })}
                              className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleBroadcast}
                      disabled={isBroadcasting || !broadcastForm.message || (broadcastForm.targetAudience === 'specific' && !broadcastForm.username)}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 mt-4"
                    >
                      {isBroadcasting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending Broadcast...
                        </>
                      ) : (
                        <>
                          <Bell className="w-5 h-5 mr-2" />
                          Send Notification Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STREAKS TAB */}
          {activeTab === "streaks" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-red-100 bg-red-50/20 shadow-sm overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-red-900 flex items-center gap-2">
                      <Flame className="w-6 h-6 text-red-500" />
                      Danger Zone: Community Reset
                    </h3>
                    <p className="text-xs font-bold text-red-600/70 uppercase tracking-widest">Wipe all user streaks and activity dates globally</p>
                  </div>
                  <Button
                    onClick={() => handleResetStreak(null, true)}
                    className="bg-red-600 hover:bg-red-700 text-white border-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Reset All Streaks
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentUsers.map((u, i) => (
                  <Card key={i} className="border-slate-100 shadow-sm hover:border-indigo-100 transition-all group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AuthorAvatar 
                          name={u.name || u.username} 
                          username={u.username}
                          avatar={u.avatar} 
                          streak={u.currentStreak || 0}
                          isAdmin={u.isAdmin || u.username?.toLowerCase() === "yatishydv" || u.email?.toLowerCase() === "yatishydv@gmail.com"}
                          className="w-10 h-10" 
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900">@{u.username}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> {u.currentStreak}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Hide actions for Head Admin if viewed by Sub-Admin */}
                      {!(u.email === "yatishydv@gmail.com" && user?.email !== "yatishydv@gmail.com") ? (
                        <Button
                          onClick={() => handleResetStreak(u.firebaseUid)}
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-xl border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          Reset
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-300 pr-2">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Protected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
        confirmText="Confirm Action"
      />

      {/* User Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card rounded-[2.5rem] shadow-2xl z-[201] overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <AuthorAvatar name={editingUser.username} username={editingUser.username} avatar={editingUser.avatar} className="w-14 h-14 border-2 border-white/10" />
                    <div>
                      <h3 className="text-xl font-black">Edit Member Identity</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">@{editingUser.username} • {editingUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingUser(null)}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Role</label>
                    <select
                      value={editingUser.role || "member"}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none"
                    >
                      <option value="member">Standard Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                      <option value="partner">Verified Partner</option>
                      <option value="founder">Founder & Owner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Custom Badge (Emoji)</label>
                    <input
                      type="text"
                      value={editingUser.customBadge || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, customBadge: e.target.value })}
                      placeholder="e.g. 👑, 💎, 🛡️"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Custom Professional Title</label>
                  <input
                    type="text"
                    value={editingUser.customTitle || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, customTitle: e.target.value })}
                    placeholder="e.g. Lead Designer, System Admin..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-black uppercase text-slate-500">Admin Privileges</span>
                    <button
                      onClick={() => setEditingUser({ ...editingUser, isAdmin: !editingUser.isAdmin })}
                      className={`w-12 h-6 rounded-full relative transition-all ${editingUser.isAdmin ? "bg-red-500" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${editingUser.isAdmin ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-black uppercase text-slate-500">Pro Features</span>
                    <button
                      onClick={() => setEditingUser({ ...editingUser, isPro: !editingUser.isPro })}
                      className={`w-12 h-6 rounded-full relative transition-all ${editingUser.isPro ? "bg-indigo-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${editingUser.isPro ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={isUpdatingUser}
                  className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs border-none shadow-lg shadow-indigo-100"
                >
                  {isUpdatingUser ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Identity Changes"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
