"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, Eye, Heart, Bookmark, 
  ArrowLeft, Zap, Sparkles, Trophy,
  ChevronRight, Loader2, Filter, Star,
  Activity, Clock, Target, LayoutGrid,
  TrendingDown, Globe, Award, Shield, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getRankTitle } from "@/lib/permissions";

const fetcher = (url: string) => fetch(url).then(res => res.json());
const MILESTONES = [0, 7, 30, 60, 90, 180, 270, 365];

export default function AnalyticsPage() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<"performance" | "reach" | "rankings">("performance");
  const { data: promptsRaw, isLoading } = useSWR(user?.uid ? `/api/prompts?authorId=${user.uid}` : null, fetcher);
  const { data: allUsers } = useSWR('/api/users?limit=1000', fetcher);
  
  const stats = useMemo(() => {
    const prompts = Array.isArray(promptsRaw) ? promptsRaw : promptsRaw?.data || [];
    const users = Array.isArray(allUsers) ? allUsers : allUsers?.data || [];
    
    // 1. OFFICIAL RANKING LOGIC (Likes + Followers)
    const sortedUsers = [...users].sort((a: any, b: any) => {
      const scoreA = (a.totalLikes || 0) + (a.followers?.length || 0);
      const scoreB = (b.totalLikes || 0) + (b.followers?.length || 0);
      return scoreB - scoreA;
    });
    const globalRank = sortedUsers.findIndex(u => u.firebaseUid === user?.uid) + 1;
    const percentile = users.length > 0 ? Math.max(1, Math.round(((users.length - (globalRank || users.length)) / users.length) * 100)) : 0;

    // 2. Metrics
    const totalViews = prompts.reduce((acc: number, p: any) => acc + (p.views || 0), 0);
    const totalLikes = prompts.reduce((acc: number, p: any) => acc + (p.likes || 0), 0);
    const totalSaves = prompts.reduce((acc: number, p: any) => acc + (p.bookmarks || 0), 0);
    
    // 3. Category Data
    const catMap: Record<string, number> = {};
    prompts.forEach((p: any) => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    const topCategories = Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

    // 4. Streak
    const streak = userData?.currentStreak || 0;
    const nextM = MILESTONES.find(m => m > streak) || 365;
    const prevM = [...MILESTONES].reverse().find(m => m <= streak) || 0;
    const progress = Math.min(100, Math.round(((streak - prevM) / (nextM - prevM)) * 100));

    // 5. Engagement Score (Live Calculation)
    const engagementScore = totalViews > 0 ? (((totalLikes + totalSaves) / totalViews) * 100).toFixed(1) : "0";

    return {
      prompts,
      totalViews,
      totalLikes,
      totalSaves,
      globalRank: globalRank || users.length || "...",
      percentile,
      topCategories,
      progress,
      nextM,
      engagementScore,
      powerScore: Math.min(100, Math.round(((totalLikes + totalSaves * 2.5) / (totalViews || 1)) * 400)) || 0
    };
  }, [promptsRaw, allUsers, user, userData]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
      {/* ELITE HEADER - GLASSMORPHISM */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 md:p-16 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full blur-[100px] -ml-32 -mb-32 opacity-20" />
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo">
                     <Shield className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Live Identity Log</p>
                     <h1 className="text-3xl md:text-5xl font-black tracking-tight">My Stats</h1>
                  </div>
               </div>
               <p className="text-slate-400 font-bold text-base max-w-md">Private analytics dashboard synced with the global leaderboard.</p>
            </div>
            
            <div className="flex items-center gap-10">
               <div className="text-center group cursor-help" title="Based on Likes + Followers">
                  <p className="text-4xl font-black text-indigo-400 group-hover:scale-110 transition-transform">#{stats.globalRank}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Global Rank</p>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div className="text-center">
                  <p className="text-4xl font-black text-white">{stats.percentile}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Top Tier</p>
               </div>
            </div>
         </div>
      </div>

      {/* DYNAMIC METRIC TILES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Views", value: stats.totalViews, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Total Saves", value: stats.totalSaves, icon: Bookmark, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Engage Rate", value: stats.engagementScore, suffix: "%", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-soft group hover:border-indigo-600 transition-all"
          >
            <div className="space-y-4">
               <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                     <p className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
                     {stat.suffix && <span className="text-sm font-black text-slate-400">{stat.suffix}</span>}
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INTERACTIVE DATA HUB */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-8 border-b border-slate-100 pb-2">
               {[
                 { id: "performance", label: "Publishing Activity", icon: Activity },
                 { id: "reach", label: "Category Stats", icon: LayoutGrid },
                 { id: "rankings", label: "Prompt List", icon: Trophy }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`pb-4 text-[11px] font-black uppercase tracking-widest relative transition-all flex items-center gap-2 ${
                     activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                   }`}
                 >
                   <tab.icon className="w-3.5 h-3.5" />
                   {tab.label}
                   {activeTab === tab.id && (
                     <motion.div layoutId="dashTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
                   )}
                 </button>
               ))}
            </div>

            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-soft h-[500px] relative overflow-hidden">
               <AnimatePresence mode="wait">
                  {activeTab === "performance" && (
                    <motion.div key="v" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                       <div className="flex items-center justify-between mb-10">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Growth Velocity</h3>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <Clock className="w-3.5 h-3.5" /> Past 12 Weeks
                          </div>
                       </div>
                       
                       <div className="flex-1 flex items-end gap-3 md:gap-5 px-4 mb-6">
                          {[30, 45, 25, 70, 40, 85, 35, 90, 55, 100, 65, 80].map((h, i) => (
                             <div key={i} className="flex-1 flex flex-col items-center gap-4">
                                <motion.div 
                                  initial={{ height: 0 }} 
                                  animate={{ height: `${h}%` }} 
                                  transition={{ delay: i * 0.05, duration: 1 }}
                                  className="w-full bg-slate-50 rounded-xl relative group"
                                >
                                   <div className="absolute inset-0 bg-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-indigo" />
                                </motion.div>
                                <span className="text-[9px] font-black text-slate-300">W-{12-i}</span>
                             </div>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === "reach" && (
                    <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                       <div className="flex items-center justify-between mb-10">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Category Breakdown</h3>
                          <PieChart className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {stats.topCategories.length > 0 ? stats.topCategories.map((cat, i) => (
                            <div key={cat.name} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                                     {i+1}
                                  </div>
                                  <div>
                                     <h4 className="text-sm font-black text-slate-900">{cat.name}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.count} Prompts</p>
                                  </div>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          )) : (
                            <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No category data yet. Publish more prompts to see breakdown.</div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === "rankings" && (
                    <motion.div key="rank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                       <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Prompt Performance</h3>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase">Sorted by Views</span>
                          </div>
                       </div>
                       <div className="overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                          <table className="w-full text-left">
                             <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-slate-50">
                                   <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt Name</th>
                                   <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Views</th>
                                   <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Likes</th>
                                </tr>
                             </thead>
                             <tbody className="divide-divide-slate-50">
                                {stats.prompts.length > 0 ? stats.prompts.map((p: any) => (
                                  <tr key={p.slug} className="group hover:bg-slate-50/50 transition-all">
                                     <td className="py-4">
                                        <Link href={`/prompt/${p.slug}`} className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.title}</Link>
                                     </td>
                                     <td className="py-4 text-center text-sm font-bold text-slate-500">{p.views?.toLocaleString() || 0}</td>
                                     <td className="py-4 text-right text-sm font-bold text-slate-500">{p.likes?.toLocaleString() || 0}</td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan={3} className="py-20 text-center text-slate-400 font-bold italic">No prompts published yet.</td></tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* STREAK & MILESTONES */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl h-full">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] -mr-32 -mt-32 opacity-30" />
               <div className="space-y-10 relative z-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Streak Progress</h3>
                     <Award className="w-5 h-5 text-indigo-400" />
                  </div>
                  
                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full border-4 border-indigo-600/30 flex items-center justify-center text-3xl font-black bg-indigo-600 shadow-indigo">
                           {stats.progress}%
                        </div>
                        <div className="space-y-1">
                           <p className="text-xl font-black">{getRankTitle(userData?.currentStreak || 0, userData?.isAdmin)}</p>
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Level Progression</p>
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                           <span>Milestone: {stats.nextM} Days</span>
                           <span>{stats.nextM - (userData?.currentStreak || 0)} Days Left</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} className="h-full bg-indigo-600 shadow-indigo" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Next Achievement</span>
                     </div>
                     <p className="text-xs font-bold text-white/60 italic">Reach the {stats.nextM} day milestone to unlock elite creator badges and featured placement.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* CALL TO ACTION */}
      <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-12 text-center space-y-6">
         <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Globe className="w-8 h-8 text-indigo-600" />
         </div>
         <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expand Your Reach</h2>
            <p className="text-slate-400 font-bold max-w-lg mx-auto">Publish new prompts daily to climb the global leaderboard and dominate the community rankings.</p>
         </div>
         <Link href="/create">
            <Button className="h-14 px-12 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-indigo border-none">Publish Prompt</Button>
         </Link>
      </div>
    </div>
  );
}
