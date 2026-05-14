"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Heart, Eye, MessageSquare, Share2, 
  Settings, Grid, List, Bookmark,
  Calendar, MapPin, Link as LinkIcon,
  Flame, ShieldCheck, Check, Sparkles,
  MoreVertical, Edit2, ArrowRight, Award, Globe,
  UserPlus, UserCheck, Loader2, BarChart3,
  Trophy, Zap, Layers, Palette, X, Users, Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getRankTitle, getRankBadge } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ── Users List Modal ──────────────────────────────────────────────────
const UsersModal = ({ isOpen, onClose, title, userIds }: { isOpen: boolean, onClose: () => void, title: string, userIds: string[] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userIds?.length > 0) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const fetchedUsers = await Promise.all(
            userIds.map(id => fetch(`/api/users/${id}`).then(res => res.json()))
          );
          setUsers(fetchedUsers.filter(u => !u.error));
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, userIds]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" /> {title}
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
           </button>
        </div>

        <div className="p-4 bg-white border-b border-slate-50">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {loading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Community...</p>
             </div>
           ) : filteredUsers.length > 0 ? (
             <div className="grid gap-3">
                {filteredUsers.map((u) => (
                  <Link 
                    key={u.firebaseUid} 
                    href={`/profile/${u.username}`} 
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                  >
                    <AuthorAvatar avatar={u.avatar} name={u.name} className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                       <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                         {u.name}
                         {u.isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                       </h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">@{u.username}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
             </div>
           ) : (
             <div className="py-20 text-center space-y-4">
                <Users className="w-12 h-12 text-slate-100 mx-auto" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Creators Found</p>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser, userData: currentUserData, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [modalState, setModalState] = useState<{ open: boolean, title: string, userIds: string[] }>({ open: false, title: "", userIds: [] });
  
  const { data: profileData, error, isLoading, mutate: mutateProfile } = useSWR(username ? `/api/users/${username}` : null, fetcher);
  const { data: promptsRaw, isLoading: promptsLoading } = useSWR(profileData?.firebaseUid ? `/api/prompts?authorId=${profileData.firebaseUid}` : null, fetcher);
  const promptsData = Array.isArray(promptsRaw) ? promptsRaw : (promptsRaw as any)?.data || [];

  useEffect(() => {
    if (profileData && currentUser) {
      setIsFollowing(profileData.followers?.includes(currentUser.uid) || false);
    }
  }, [profileData, currentUser]);

  const isOwnProfile = currentUser?.uid === profileData?.firebaseUid;
  const isAdmin = profileData?.isAdmin || profileData?.username?.toLowerCase() === "yatishydv";

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Sign in to follow creators");
    setFollowLoading(true);
    
    try {
      const res = await fetch(`/api/users/${profileData.firebaseUid}/follow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.uid })
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        mutateProfile(); 
        refreshUserData();
        toast.success(data.isFollowing ? `Following @${profileData.username}` : `Unfollowed @${profileData.username}`);
      }
    } catch (err) {
      toast.error("Network sync failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting Identity...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-6 bg-white border border-slate-100 rounded-[3rem] shadow-soft mt-12">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
           <Layers className="w-10 h-10" />
        </div>
        <div className="space-y-2">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Identity Not Found</h1>
           <p className="text-slate-400 font-bold">The profile you are looking for does not exist in our community.</p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline" className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest">Return to Hub</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Cinematic Banner Header */}
      <div className={`relative group mb-32 ${isAdmin ? "final-boss-aura" : ""}`}>
        <div className="h-64 md:h-80 w-full overflow-hidden rounded-[3rem] shadow-premium relative bg-slate-900">
          <img 
            src={profileData.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] opacity-90"
            alt="Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
          
          {/* Admin Glow Overlay */}
          {isAdmin && (
            <>
              <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-indigo-600/30 to-transparent" />
            </>
          )}
        </div>

        {/* Profile Overlay */}
        <div className="absolute -bottom-20 md:-bottom-24 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative group/avatar">
              {/* Identity Glow / Aura */}
              {(isAdmin || profileData.isGlowActive) && (
                <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] blur-3xl opacity-40 animate-pulse" />
              )}
              <div className={`w-36 h-36 md:w-52 md:h-52 rounded-[2.8rem] border-8 ${isAdmin || profileData.isGlowActive ? "border-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.4)]" : "border-white shadow-2xl"} bg-white overflow-hidden relative z-10 transition-all duration-700 hover:rotate-1`}>
                <AuthorAvatar 
                  avatar={profileData.avatar} 
                  name={profileData.name} 
                  className="w-full h-full scale-[1.01]"
                  isGlowActive={profileData.isGlowActive}
                  isVerifiedActive={profileData.isVerifiedActive}
                  isAdmin={isAdmin}
                />
              </div>
              {(isAdmin || profileData.isVerifiedActive) && (
                 <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-indigo-500 z-20" title="Verified Creator">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
              )}
            </div>

            <div className="pb-4 text-center md:text-left space-y-1">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isAdmin ? "text-indigo-600 drop-shadow-sm" : "text-slate-900"}`}>{profileData.name}</h1>
                {(isAdmin || profileData.isVerifiedActive) && (
                  <ShieldCheck className="w-8 h-8 text-indigo-600" />
                )}
                <span className="text-2xl" title={getRankTitle(profileData.currentStreak || 0, isAdmin, profileData.customTitle)}>
                  {getRankBadge(profileData.currentStreak || 0, isAdmin, profileData.customBadge)}
                </span>
              </div>
              <p className={`text-[14px] font-black uppercase tracking-widest ${isAdmin ? "text-indigo-400" : "text-slate-400"}`}>@{profileData.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4">
             {isOwnProfile ? (
               <Link href="/settings">
                 <Button className="bg-slate-900 text-white h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all">
                   <Edit2 className="w-4 h-4" /> Edit Identity
                 </Button>
               </Link>
             ) : (
               <Button 
                 onClick={handleFollow}
                 disabled={followLoading}
                 className={`h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all ${
                   isFollowing 
                     ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200" 
                     : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo"
                 }`}
               >
                 {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                 {isFollowing ? "Following" : "Follow Creator"}
               </Button>
             )}
             <button className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <Share2 className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
           {/* Bio & Stats */}
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-soft space-y-8">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Statement</h3>
                 <p className="text-[14px] font-bold text-slate-600 leading-relaxed italic">
                   "{profileData.bio || "This creator has not yet defined their mission in the community."}"
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setModalState({ open: true, title: "Followers", userIds: profileData.followers || [] })}
                   className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center space-y-1 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                 >
                    <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{profileData.followers?.length || 0}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Followers</p>
                 </button>
                 <button 
                   onClick={() => setModalState({ open: true, title: "Following", userIds: profileData.following || [] })}
                   className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center space-y-1 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                 >
                    <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{profileData.following?.length || 0}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Following</p>
                 </button>
                 <div className={`p-6 rounded-[2rem] text-center space-y-1 col-span-2 relative overflow-hidden group ${isAdmin ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 border border-indigo-100/50"}`}>
                    <div className={`absolute top-0 right-0 w-12 h-12 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform ${isAdmin ? "bg-white/10" : "bg-indigo-600/5"}`} />
                    <p className={`text-2xl font-black flex items-center justify-center gap-2 ${isAdmin ? "text-white" : "text-indigo-600"}`}>
                       <Flame className={`w-6 h-6 ${isAdmin ? "fill-white" : "fill-indigo-600"}`} /> {profileData.currentStreak || 0}
                    </p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? "text-indigo-100" : "text-indigo-400"}`}>Mastery Day Streak</p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-3 text-slate-500">
                    <MapPin className="w-4.5 h-4.5 text-indigo-600/50" />
                    <span className="text-xs font-bold">{profileData.location || "Global Workspace"}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-500">
                    <Calendar className="w-4.5 h-4.5 text-indigo-600/50" />
                    <span className="text-xs font-bold">Joined {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                 </div>
                 {profileData.socialLinks?.website && (
                   <div className="flex items-center gap-3 text-slate-500">
                      <Globe className="w-4.5 h-4.5 text-indigo-600/50" />
                      <a href={profileData.socialLinks.website} target="_blank" className="text-xs font-bold hover:text-indigo-600 transition-colors">{profileData.socialLinks.website.replace(/^https?:\/\//, '')}</a>
                   </div>
                 )}
              </div>
           </div>

           {/* Expertise Card */}
           <div className={`rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl ${isAdmin ? "bg-indigo-600 text-white" : "bg-slate-900 text-white"}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 ${isAdmin ? "bg-white/20" : "bg-indigo-600/20"}`} />
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${isAdmin ? "text-indigo-100" : "text-indigo-400"}`}>Skill Mastery</h3>
                    <Award className={`w-5 h-5 ${isAdmin ? "text-white" : "text-indigo-400"}`} />
                 </div>
                 <div className="space-y-6">
                    {[
                      { label: "Architecture", val: 92, icon: Layers },
                      { label: "Visual Logic", val: 88, icon: Palette },
                      { label: "Efficiency", val: 95, icon: Zap }
                    ].map(skill => (
                      <div key={skill.label} className="space-y-3">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className={`flex items-center gap-2 ${isAdmin ? "text-white/80" : "text-white/60"}`}><skill.icon className="w-3 h-3" /> {skill.label}</span>
                            <span>{skill.val}%</span>
                         </div>
                         <div className={`h-1.5 w-full rounded-full overflow-hidden border ${isAdmin ? "bg-white/10 border-white/10" : "bg-white/5 border-white/5"}`}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.val}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] ${isAdmin ? "bg-white" : "bg-indigo-500"}`} 
                            />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Content Feed */}
        <div className="lg:col-span-8 space-y-10">
           {/* Tab Navigation */}
           <div className="flex items-center gap-10 border-b border-slate-100">
              {[
                { id: "prompts", label: "Directives", icon: Grid },
                { id: "saved", label: "Collection", icon: Bookmark },
                { id: "activity", label: "Flow", icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${
                    activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="profileTab"
                      className="absolute bottom-0 left-0 right-0 h-[4px] bg-indigo-600 rounded-full" 
                    />
                  )}
                </button>
              ))}
           </div>

           {/* Feed Content */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatePresence mode="wait">
                {activeTab === "prompts" && (
                  <motion.div 
                    key="prompts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-full"
                  >
                    {promptsLoading ? (
                      [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
                    ) : promptsData?.length > 0 ? (
                      promptsData.map((p: any) => (
                        <Link key={p.slug} href={`/prompt/${p.slug}`} className="group">
                          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-premium transition-all duration-500 h-full flex flex-col space-y-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                             <div className="flex items-center justify-between relative z-10">
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                                  {p.category}
                                </span>
                                <Heart className={`w-4.5 h-4.5 transition-all ${p.likedBy?.includes(currentUser?.uid) ? "text-rose-500 fill-current" : "text-slate-200 group-hover:text-rose-500"}`} />
                             </div>
                             <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">{p.title}</h3>
                             <p className="text-[13.5px] text-slate-500 font-medium line-clamp-3 leading-relaxed flex-1">{p.description}</p>
                             <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                   <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {p.views || 0}</span>
                                   <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {p.likes || 0}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                             </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-full py-24 text-center bg-white border border-slate-100 rounded-[3rem] shadow-soft">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <Sparkles className="w-10 h-10" />
                         </div>
                         <div className="space-y-1">
                            <p className="font-black text-slate-900 uppercase tracking-widest text-sm">No Active Directives</p>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">This creator has not yet published any prompts.</p>
                         </div>
                         {isOwnProfile && (
                           <Link href="/create" className="mt-8 inline-block">
                             <Button className="bg-indigo-600 text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[11px] shadow-indigo">Deploy First Prompt</Button>
                           </Link>
                         )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "saved" && (
                   <motion.div 
                    key="saved"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="col-span-full py-24 text-center bg-white border border-slate-100 rounded-[3rem] shadow-soft"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                       <Bookmark className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                       <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Locked Collection</p>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Save prompts to organize your intelligence library.</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "activity" && (
                   <motion.div 
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="col-span-full py-24 text-center bg-white border border-slate-100 rounded-[3rem] shadow-soft"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                       <Trophy className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                       <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Flow Data Encryption</p>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Activity logs are currently processing for this cycle.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {modalState.open && (
          <UsersModal 
            isOpen={modalState.open} 
            onClose={() => setModalState({ ...modalState, open: false })} 
            title={modalState.title} 
            userIds={modalState.userIds} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
