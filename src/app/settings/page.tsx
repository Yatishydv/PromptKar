"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Camera, Shield, Bell, Globe, 
  CheckCircle2, ChevronRight, MessageSquare,
  MapPin, Code, Send, LayoutGrid, Sparkles, 
  Lock, X, Loader2, ArrowLeft, Image as ImageIcon,
  Save, UserCircle, Palette, Upload, ShieldCheck,
  Check, RefreshCcw, Cpu, Ghost, Cat, Skull, 
  User as UserIcon, Zap, Smile, Bug, Coffee, 
  ArrowRight, Flag, Trophy, Target, Star, Award,
  Milestone, Zap as ZapIcon, BadgeCheck, Palette as PaletteIcon,
  Crown, Verified, Flame, Share2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import confetti from 'canvas-confetti';

// ── Configuration ──────────────────────────────────────────────────
const AVATAR_SECTIONS = [
  { id: "set1", name: "Robots", icon: Cpu, engine: "robohash" },
  { id: "set2", name: "Monsters", icon: Skull, engine: "robohash" },
  { id: "set3", name: "Ghosts", icon: Ghost, engine: "robohash" },
  { id: "set4", name: "Kitties", icon: Cat, engine: "robohash" },
  { id: "set5", name: "Humans", icon: UserIcon, engine: "robohash" },
  { id: "adventurer", name: "Explorers", icon: MapPin, engine: "dicebear" },
  { id: "bottts", name: "Mecha", icon: Zap, engine: "dicebear" },
  { id: "avataaars", name: "Comics", icon: Smile, engine: "dicebear" },
  { id: "pixel-art", name: "8-Bit", icon: LayoutGrid, engine: "dicebear" },
  { id: "big-smile", name: "Emojis", icon: Coffee, engine: "dicebear" },
];

const PREDEFINED_BANNERS = [
  "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2564&auto=format&fit=crop"
];

const STREAK_THRESHOLDS: Record<string, number> = {
  "set1": 0, "set2": 0, "set3": 0, "set4": 0, "set5": 0,
  "adventurer": 3, "bottts": 7, "avataaars": 10, "pixel-art": 15, "big-smile": 20
};

const ROADMAP_MILESTONES = [
  { days: 7, id: "badges", label: "Exclusive Badges", reward: "Badges", icon: Award, tab: "basic" },
  { days: 30, id: "social", label: "Social Identity", reward: "Social Branding", icon: Globe, tab: "links" },
  { days: 60, id: "glow", label: "Identity Glow", reward: "Avatar Aura", icon: Sparkles, tab: "appearance" },
  { days: 90, id: "featured", label: "Featured Prompt", reward: "Main Grid Slot", icon: Flag, tab: "basic" },
  { days: 180, id: "theme", label: "Custom Theme", reward: "Dashboard Skins", icon: PaletteIcon, tab: "appearance" },
  { days: 270, id: "verified", label: "Verified Tick", reward: "Verified Status", icon: BadgeCheck, tab: "basic" },
  { days: 365, id: "upload", label: "Custom PFP Upload", reward: "Profile Sync", icon: Camera, tab: "appearance" },
  { days: 500, id: "master", label: "Master Engineer", reward: "Global Admin Powers", icon: Crown, tab: "basic" },
];

const SettingsPage = () => {
  const router = useRouter();
  const { user, userData, isAdmin, refreshUserData, loading: authLoading } = useAuth();
  
  const [simStreak, setSimStreak] = useState<number | null>(null);
  const [simRegularUser, setSimRegularUser] = useState(false);
  const [userPrompts, setUserPrompts] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [activeTab, setActiveTab] = useState("basic");
  const [activeSection, setActiveSection] = useState("set2");
  const [sectionLoading, setSectionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);


  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    avatar: "",
    banner: "",
    selectedTheme: "Standard",
    featuredPromptId: "",
    isVerifiedActive: false,
    isGlowActive: false,
    socialLinks: {
      website: "",
      twitter: "",
      github: "",
      instagram: ""
    }
  });

  // Check for unsaved changes
  const isDirty = useMemo(() => {
    if (!userData) return false;
    return (
      formData.name !== (userData.name || "") ||
      formData.username !== (userData.username || "") ||
      formData.bio !== (userData.bio || "") ||
      formData.location !== (userData.location || "") ||
      formData.avatar !== (userData.avatar || "") ||
      formData.banner !== (userData.banner || "") ||
      formData.selectedTheme !== (userData.selectedTheme || "Standard") ||
      formData.featuredPromptId !== (userData.featuredPromptId || "") ||
      formData.isVerifiedActive !== !!userData.isVerifiedActive ||
      formData.isGlowActive !== !!userData.isGlowActive ||
      formData.socialLinks.website !== (userData.socialLinks?.website || "") ||
      formData.socialLinks.twitter !== (userData.socialLinks?.twitter || "") ||
      formData.socialLinks.github !== (userData.socialLinks?.github || "") ||
      formData.socialLinks.instagram !== (userData.socialLinks?.instagram || "")
    );
  }, [formData, userData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/prompts?authorId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUserPrompts(data);
          else if (data && Array.isArray(data.data)) setUserPrompts(data.data);
        })
        .catch(err => console.error("Failed to fetch prompts for featured selection"));
    }
  }, [user]);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        username: (userData.username || "").toLowerCase(),
        bio: userData.bio || "",
        location: userData.location || "",
        avatar: userData.avatar || "",
        banner: userData.banner || "",
        selectedTheme: userData.selectedTheme || "Standard",
        featuredPromptId: userData.featuredPromptId || "",
        isVerifiedActive: !!userData.isVerifiedActive,
        isGlowActive: !!userData.isGlowActive,
        socialLinks: {
          website: userData.socialLinks?.website || "",
          twitter: userData.socialLinks?.twitter || "",
          github: userData.socialLinks?.github || "",
          instagram: userData.socialLinks?.instagram || ""
        }
      });
    }
  }, [userData]);

  useEffect(() => {
    const fetchUserPrompts = async () => {
      if (!user?.uid) return;
      try {
        const res = await fetch(`/api/prompts?authorId=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setUserPrompts(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch user prompts", err);
      }
    };
    fetchUserPrompts();
  }, [user]);

  useEffect(() => {
    setSectionLoading(true);
    const timer = setTimeout(() => setSectionLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeSection]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Architectural image required.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit for Base64 MongoDB storage
      toast.error("File exceeds 2MB limit for cloud sync.");
      return;
    }

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, [type]: base64String }));
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} synchronized to profile!`);
        if (type === 'avatar') setUploadingAvatar(false);
        else setUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(`Profile link failed for ${type}.`);
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  // Image Upload Handlers


  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Profile name required";
    if (!/^[a-z0-9_]{3,15}$/.test(formData.username)) {
      newErrors.username = "Handle must be 3-15 chars (lowercase/numbers/_)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!user?.uid) return;
    if (!validate()) {
      toast.error("Correction required in identity parameters.");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          username: formData.username.toLowerCase()
        })
      });
      if (res.ok) {
        toast.success("Profile Studio Synchronized!");
        await refreshUserData();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#A855F7', '#EC4899']
        });
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Profile Sync Failed");
      }
    } catch (err) {
      toast.error("Critical Connection Failure");
    } finally {
      setIsSaving(false);
    }
  };

  const getStreakStatus = () => {
    const effectiveIsAdmin = isAdmin && !simRegularUser;
    const effectiveStreak = simStreak !== null ? simStreak : (userData?.currentStreak || 0);
    if (effectiveIsAdmin) return { hasAccess: true, daysLeft: 999, streak: effectiveStreak, isGrace: false };
    const streak = effectiveStreak;
    const lastActiveAt = userData?.lastActiveAt;
    const now = new Date();
    let daysSinceActive = 0;
    if (lastActiveAt) {
      const lastDate = new Date(lastActiveAt);
      daysSinceActive = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    const isInGracePeriod = streak === 0 && daysSinceActive <= 5;
    return { hasAccess: streak > 0 || isInGracePeriod, daysLeft: Math.max(0, 5 - daysSinceActive), streak, isGrace: isInGracePeriod };
  };

  const streakStatus = getStreakStatus();
  const effectiveIsAdmin = isAdmin && !simRegularUser;

  const tabs = [
    { id: "basic", label: "My Info", icon: User },
    { id: "appearance", label: "Look & Feel", icon: PaletteIcon },
    { id: "roadmap", label: "Roadmap", icon: Target },
    { id: "links", label: "Social Links", icon: Globe },
  ];

  if (!mounted || authLoading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse">ESTABLISHING CONNECTION...</div>;
  if (!user) return <div className="p-20 text-center font-black text-slate-400">UNAUTHORIZED ACCESS</div>;

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Hub / Settings</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Identity <span className="text-indigo-600">Vault</span></h1>
            <p className="text-slate-400 font-bold text-sm">Configure your global presence and sync parameters.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <button 
            onClick={() => {
              const text = `Check out my Identity Vault on PromptKar! I'm on a ${streakStatus.streak} day streak.`;
              if (navigator.share) {
                navigator.share({ title: 'PromptKar Identity', text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(`${text} ${window.location.href}`);
                toast.success("Identity link copied!");
              }
            }}
            className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ml-2"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <div className="px-6 py-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</p>
             <p className="text-lg font-black text-slate-900">{streakStatus.streak} Days</p>
          </div>
          <Button 
            onClick={handleUpdate} 
            disabled={isSaving || !isDirty} 
            className={`h-14 px-10 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 ${
              isDirty 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Syncing..." : "Commit Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-soft space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-2xl scale-[1.02] z-10" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Preview Card */}
          <div className="bg-white border border-slate-100 rounded-[3rem] p-6 shadow-soft space-y-6">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Live Identity Preview</p>
             <div className="space-y-4">
                <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-slate-50">
                   {formData.banner ? (
                     <img src={formData.banner} className="w-full h-full object-cover" alt="Banner" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="flex flex-col items-center -mt-12 relative z-10">
                   <AuthorAvatar 
                     avatar={formData.avatar} 
                     name={formData.name} 
                     username={formData.username}
                     className="w-20 h-20 border-4 border-white shadow-xl" 
                     isGlowActive={formData.isGlowActive}
                     isVerifiedActive={formData.isVerifiedActive}
                     isAdmin={effectiveIsAdmin}
                   />
                   <div className="text-center mt-3">
                      <p className="font-black text-slate-900 leading-tight">@{formData.username || "username"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formData.name || "Full Name"}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Admin Lab */}
          {isAdmin && (
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />
               <div className="flex items-center gap-3 relative z-10">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Admin Lab</h3>
               </div>
               <div className="space-y-4 relative z-10">
                  <button onClick={() => setSimRegularUser(!simRegularUser)} className={`w-full p-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${simRegularUser ? "bg-amber-500" : "bg-indigo-600"}`}>
                    {simRegularUser ? "Simulate User" : "Real Admin Mode"}
                  </button>
                   <div className="grid grid-cols-2 gap-2">
                      {[0, 7, 60, 365].map(d => (
                        <button 
                          key={d} 
                          onClick={() => {
                            setSimStreak(d);
                            if (d > 0) {
                              confetti({
                                particleCount: 80,
                                spread: 50,
                                origin: { y: 0.8 },
                                colors: ['#6366F1', '#4F46E5']
                              });
                            }
                          }} 
                          className={`p-2 rounded-xl text-[9px] font-black border ${simStreak === d ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/10 text-slate-400"}`}
                        >
                          {d}D
                        </button>
                      ))}
                      <button onClick={() => setSimStreak(null)} className="col-span-2 p-2 rounded-xl text-[8px] font-black bg-white/5 border border-white/10 text-slate-400 uppercase tracking-widest">Reset Simulation</button>
                   </div>
               </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9">
           <AnimatePresence mode="wait">
             {/* 1. Basic Info */}
             {activeTab === "basic" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                   <Card className="border-slate-100 shadow-soft rounded-[3rem] p-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Creator Full Name</label>
                            <input 
                              type="text" 
                              value={formData.name} 
                              onChange={e => setFormData({ ...formData, name: e.target.value })} 
                              className={`w-full bg-slate-50 border ${errors.name ? "border-red-500" : "border-slate-100"} rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all`} 
                            />
                            {errors.name && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.name}</p>}
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Handle (@username)</label>
                            <input 
                              type="text" 
                              value={formData.username} 
                              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })} 
                              className={`w-full bg-slate-50 border ${errors.username ? "border-red-500" : "border-slate-100"} rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all`} 
                            />
                            {errors.username && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.username}</p>}
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">My Story (Bio)</label>
                            <textarea 
                              rows={4} 
                              value={formData.bio} 
                              onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-indigo-600/30 transition-all resize-none" 
                              placeholder="Tell the community about yourself and your creative journey..."
                            />
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Location</label>
                            <div className="relative">
                              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <input 
                                type="text" 
                                value={formData.location} 
                                onChange={e => setFormData({ ...formData, location: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all" 
                                placeholder="Where are you creating from?"
                              />
                            </div>
                         </div>
                      </div>
                   </Card>

                   {/* Featured Prompt Selection */}
                   {(effectiveIsAdmin || streakStatus.streak >= 90) && (
                     <Card className="border-indigo-100 bg-white shadow-soft rounded-[3rem] p-10">
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                 <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <Flag className="w-6 h-6 text-indigo-600" />
                                    Featured Prompt
                                 </h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pin your best work to the top of your profile</p>
                              </div>
                           </div>
                           <select 
                             value={formData.featuredPromptId}
                             onChange={e => setFormData({ ...formData, featuredPromptId: e.target.value })}
                             className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all cursor-pointer"
                           >
                              <option value="">None Selected (Default Feed)</option>
                              {userPrompts.map(p => (
                                <option key={p._id} value={p._id}>{p.title}</option>
                              ))}
                           </select>
                        </div>
                     </Card>
                   )}

                   {/* Verification Toggle */}
                   {(effectiveIsAdmin || streakStatus.streak >= 270) && (
                     <Card className="border-emerald-100 bg-emerald-50/20 shadow-soft rounded-[3rem] p-10 border-dashed">
                        <div className="flex items-center justify-between gap-6">
                           <div className="space-y-2">
                              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                 <BadgeCheck className="w-6 h-6 text-emerald-600" />
                                 Profile Verification
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Toggle your permanent engineering credentials</p>
                           </div>
                           <button 
                             onClick={() => setFormData({ ...formData, isVerifiedActive: !formData.isVerifiedActive })}
                             className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                               formData.isVerifiedActive ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" : "bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                             }`}
                           >
                              {formData.isVerifiedActive ? "Verified" : "Initiate Verification"}
                           </button>
                        </div>
                     </Card>
                   )}
                </motion.div>
             )}

             {/* 2. Appearance */}
             {activeTab === "appearance" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                   {/* Aura Toggle */}
                   {(effectiveIsAdmin || streakStatus.streak >= 60) && (
                     <Card className="border-indigo-100 bg-indigo-50/20 shadow-soft rounded-[3rem] p-10 border-dashed">
                        <div className="flex items-center justify-between gap-6">
                           <div className="space-y-2">
                              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                 <Sparkles className="w-6 h-6 text-indigo-600" />
                                 Identity Glow (Aura)
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project a cyber-glow through your profile matrix</p>
                           </div>
                           <button 
                             onClick={() => setFormData({ ...formData, isGlowActive: !formData.isGlowActive })}
                             className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                               formData.isGlowActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                             }`}
                           >
                              {formData.isGlowActive ? "Glow Active" : "Ignite Aura"}
                           </button>
                        </div>
                     </Card>
                   )}

                   <Card className="border-slate-100 shadow-soft rounded-[3rem] p-12 overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-8 mb-10">
                          <div className="space-y-1">
                             <h4 className="text-2xl font-black text-slate-900 tracking-tight">Identity Image</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select from engine or upload master-file</p>
                          </div>
                           <div className="flex flex-col gap-4 w-full">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Master Link</label>
                                {(effectiveIsAdmin || streakStatus.streak >= 365) && (
                                  <div className="flex gap-2">
                                    <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      onChange={(e) => handleFileUpload(e, 'avatar')} 
                                      accept="image/*"
                                    />
                                    <button 
                                      onClick={() => fileInputRef.current?.click()} 
                                      disabled={uploadingAvatar}
                                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                    >
                                      {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                      {uploadingAvatar ? "Uploading..." : "Upload Master File"}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <input 
                                type="text" 
                                value={formData.avatar} 
                                onChange={e => setFormData({ ...formData, avatar: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all" 
                                placeholder="https://your-image-url.com/pfp.png"
                              />
                           </div>
                       </div>
                       
                       <div className="flex flex-col xl:flex-row gap-12">
                         <div className="w-full xl:w-72 space-y-10">
                            <div className="flex flex-col items-center gap-4">
                               <AuthorAvatar 
                                 avatar={formData.avatar} 
                                 name={formData.name} 
                                 className="w-44 h-44" 
                                 isGlowActive={formData.isGlowActive}
                                 isVerifiedActive={formData.isVerifiedActive}
                                 isAdmin={effectiveIsAdmin}
                               />
                               {uploadingAvatar && <p className="text-[10px] font-black text-indigo-600 animate-pulse">SYNCING MASTER FILE...</p>}
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Active Platform Identity</p>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avatar & Profile Image</label>
                               <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {AVATAR_SECTIONS.map((s) => {
                                     const threshold = STREAK_THRESHOLDS[s.id] || 0;
                                     const isLocked = !effectiveIsAdmin && streakStatus.streak < threshold;
                                     return (
                                        <button 
                                          key={s.id} 
                                          disabled={isLocked} 
                                          onClick={() => setActiveSection(s.id)} 
                                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest relative ${isLocked ? "opacity-30 bg-slate-50 cursor-not-allowed" : activeSection === s.id ? "bg-slate-900 text-white shadow-xl" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                                        >
                                           {isLocked ? <Lock className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                                           <span className="flex-1 text-left">{s.name}</span>
                                           {isLocked && <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-2 py-1 rounded-lg">{threshold}D</span>}
                                        </button>
                                     );
                                  })}
                               </div>
                            </div>
                         </div>
                         <div className="flex-1 space-y-6">
                            <div className="relative h-[550px] overflow-y-auto pr-4 custom-scrollbar">
                               <AnimatePresence mode="wait">
                                  {sectionLoading ? (
                                     <motion.div key="loader" className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibrating sets...</p></motion.div>
                                  ) : (
                                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                        {Array.from({ length: 30 }).map((_, i) => {
                                           const s = AVATAR_SECTIONS.find(x => x.id === activeSection);
                                           const url = s?.engine === "robohash" ? `https://robohash.org/node-${i}-${activeSection}?set=${activeSection}&bgset=bg2` : `https://api.dicebear.com/7.x/${activeSection}/svg?seed=node-${i}`;
                                           return (
                                             <button 
                                               key={i} 
                                               onClick={() => setFormData({ ...formData, avatar: url })} 
                                               className={`aspect-square rounded-full overflow-hidden border-4 transition-all ${formData.avatar === url ? "border-indigo-600 shadow-xl scale-105 z-10" : "border-transparent opacity-60 hover:opacity-100"}`}
                                             >
                                               <img src={url} className="w-full h-full object-cover" alt="Variant" />
                                             </button>
                                           );
                                        })}
                                     </motion.div>
                                  )}
                               </AnimatePresence>
                            </div>
                         </div>
                       </div>
                   </Card>

                    <Card className="border-slate-100 shadow-soft rounded-[3rem] p-12 space-y-10 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-100/40 transition-colors" />
                       <div className="relative z-10 space-y-8">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                             <div className="space-y-1">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Cinematic Header</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Define your visual atmosphere</p>
                             </div>
                             <div className="flex items-center gap-4">
                                {(effectiveIsAdmin || streakStatus.streak >= 365) && (
                                  <div className="flex gap-2">
                                    <input 
                                      type="file" 
                                      ref={bannerInputRef} 
                                      className="hidden" 
                                      onChange={(e) => handleFileUpload(e, 'banner')} 
                                      accept="image/*"
                                    />
                                    <button 
                                      onClick={() => bannerInputRef.current?.click()} 
                                      disabled={uploadingBanner}
                                      className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
                                    >
                                      {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                      {uploadingBanner ? "Processing..." : "Custom Header"}
                                    </button>
                                  </div>
                                )}
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             <div className="h-56 w-full rounded-[2.5rem] border-8 border-white shadow-2xl bg-slate-50 overflow-hidden relative">
                                {formData.banner ? (
                                  <img src={formData.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Banner" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                                )}
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {PREDEFINED_BANNERS.map((url, i) => (
                                   <button 
                                     key={i} 
                                     onClick={() => setFormData({ ...formData, banner: url })} 
                                     className={`h-24 rounded-2xl overflow-hidden border-4 transition-all relative group/item ${formData.banner === url ? "border-indigo-600 shadow-xl scale-95" : "border-transparent opacity-60 hover:opacity-100"}`}
                                   >
                                     <img src={url} className="w-full h-full object-cover" alt="Banner" />
                                     {formData.banner === url && <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </Card>

                   {/* Themes */}
                   <Card className="border-slate-100 shadow-soft rounded-[3rem] p-10">
                      <div className="space-y-10">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1"><h4 className="text-xl font-black text-slate-900 tracking-tight">Platform Theme Studio</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global platform skins</p></div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${streakStatus.streak >= 180 || effectiveIsAdmin ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>{streakStatus.streak >= 180 || effectiveIsAdmin ? "Milestone Unlocked" : "Locked: 180D Streak"}</span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                              { id: "Standard", name: "Standard", color: "bg-slate-900" },
                              { id: "Cyber", name: "Cyber-Luxe", color: "bg-indigo-600" },
                              { id: "Midnight", name: "Midnight", color: "bg-purple-900" },
                              { id: "Matrix", name: "Emerald", color: "bg-emerald-600" }
                            ].map((t) => {
                               const isThemeLocked = !effectiveIsAdmin && streakStatus.streak < 180 && t.id !== "Standard";
                               return (
                                 <button 
                                   key={t.id} 
                                   disabled={isThemeLocked} 
                                   onClick={() => setFormData({ ...formData, selectedTheme: t.id })} 
                                   className={`p-6 rounded-[2rem] border-4 transition-all relative group text-left ${isThemeLocked ? "opacity-40 cursor-not-allowed bg-slate-50 border-transparent" : formData.selectedTheme === t.id ? "border-indigo-600 bg-white shadow-xl scale-105" : "border-transparent bg-white shadow-soft hover:bg-slate-50"}`}
                                 >
                                   <div className="space-y-4">
                                     <div className={`w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white shadow-lg`}>
                                       {isThemeLocked ? <Lock className="w-5 h-5" /> : <PaletteIcon className="w-5 h-5" />}
                                     </div>
                                     <div>
                                       <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">{t.name}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isThemeLocked ? "Restricted" : "Active"}</p>
                                     </div>
                                   </div>
                                   {formData.selectedTheme === t.id && !isThemeLocked && <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"><Check className="w-3.5 h-3.5" /></div>}
                                 </button>
                               );
                            })}
                         </div>
                      </div>
                   </Card>
                </motion.div>
             )}

                   {/* 3. Engineering Roadmap */}
                   {activeTab === "roadmap" && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                         <div className="space-y-12">
                            {/* Roadmap Progress Overview */}
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
                               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                  <div className="space-y-2 text-center md:text-left">
                                     <h2 className="text-3xl font-black tracking-tighter uppercase">Creator <span className="text-indigo-400">Roadmap</span></h2>
                                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Your progression through the community ranks</p>
                                  </div>
                                  <div className="flex-1 w-full max-w-md space-y-4">
                                     <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Streak Progress</p>
                                        <p className="text-2xl font-black tracking-tighter">{streakStatus.streak}<span className="text-xs text-slate-500 ml-1">/ 500 DAYS</span></p>
                                     </div>
                                     <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1 border border-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }} 
                                          animate={{ width: `${Math.min(100, (streakStatus.streak / 500) * 100)}%` }} 
                                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                                        />
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                               {ROADMAP_MILESTONES.map((ms, i) => {
                                  const isAchieved = effectiveIsAdmin || streakStatus.streak >= ms.days;
                                  return (
                                     <div 
                                       key={i} 
                                       className={`group p-8 rounded-[2.5rem] border transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                                         isAchieved 
                                           ? "bg-white border-indigo-100 shadow-xl hover:shadow-2xl hover:-translate-y-1" 
                                           : "bg-slate-50/50 border-slate-100 opacity-60"
                                       }`}
                                     >
                                        {isAchieved && <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 group-hover:w-4 transition-all" />}
                                        
                                        <div className="space-y-6">
                                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                             isAchieved 
                                               ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 group-hover:scale-110" 
                                               : "bg-slate-100 text-slate-400"
                                           }`}>
                                             <ms.icon className="w-7 h-7" />
                                           </div>
                                           <div className="space-y-1">
                                              <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{ms.days}D</p>
                                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{ms.label}</p>
                                           </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-50 mt-4">
                                           {isAchieved ? (
                                             <button 
                                               onClick={() => setActiveTab(ms.tab)} 
                                               className="w-full py-3 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                                             >
                                               Configure Reward
                                             </button>
                                           ) : (
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                               <Lock className="w-3 h-3" /> {ms.days - streakStatus.streak} Days Remaining
                                             </p>
                                           )}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      </motion.div>
                   )}

             {/* 4. Social Links */}
             {activeTab === "links" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                   <Card className="border-slate-100 shadow-soft rounded-[3rem] p-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {[
                           { id: "website", label: "Personal Site", icon: Globe },
                           { id: "twitter", label: "Twitter / X", icon: X },
                           { id: "github", label: "GitHub Repo", icon: Code },
                           { id: "instagram", label: "Instagram", icon: Camera },
                         ].map(l => (
                           <div key={l.id} className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{l.label}</label>
                             <div className="relative">
                               <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300">
                                 <l.icon className="w-full h-full" />
                               </div>
                               <input 
                                 type="text" 
                                 value={(formData.socialLinks as any)[l.id]} 
                                 onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [l.id]: e.target.value } })} 
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-black focus:outline-none focus:border-indigo-600/30 transition-all" 
                                 placeholder={`https://...`}
                               />
                             </div>
                           </div>
                         ))}
                      </div>
                   </Card>
                </motion.div>
             )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
