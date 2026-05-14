"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { Flame, Trophy, Calendar, Zap, Star, ChevronLeft, Info, Share2, Sparkles, Medal, Palette, CheckCircle2, Camera, Check } from "lucide-react";
import Link from "next/link";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";

const StreakPage = () => {
  const { userData, user } = useAuth();
  const streak = userData?.currentStreak || 0;
  const activityDates = useMemo(() => userData?.activityDates || [], [userData]);

  // Generate last 30 days for the heatmap
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        active: activityDates.includes(dateStr)
      });
    }
    return days;
  }, [activityDates]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
          <Flame className="w-10 h-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 text-center">Sign in to track your streak</h1>
        <Link href="/login" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
          <Share2 className="w-3.5 h-3.5" /> Share Streak
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-pulse-slow">
                  <Flame className="w-12 h-12 text-white" />
                </div>
                {/* Orbital dots */}
                <div className="absolute inset-0 animate-spin-slow">
                   <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-5xl font-black tracking-tight">{streak} <span className="text-2xl text-slate-400 font-bold uppercase tracking-widest">Day Streak</span></h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
                You've been active for {streak} days in a row! You're among the top 5% of creators this week.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> Supercharged
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/5">
                  <Star className="w-3.5 h-3.5 text-indigo-400" /> Elite Rank
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
           <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <AuthorAvatar userId={user.uid} name={userData?.name} avatar={userData?.avatar} className="w-12 h-12" />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">{userData?.name || "Creator"}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Rank: #422</p>
           </div>
           <div className="h-px w-full bg-slate-50" />
           <div className="grid grid-cols-2 w-full gap-4">
              <div className="space-y-1">
                 <p className="text-2xl font-black text-slate-900">{activityDates.length}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Days</p>
              </div>
              <div className="space-y-1">
                 <p className="text-2xl font-black text-slate-900">{userData?.bestStreak || streak || 0}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Best Streak</p>
              </div>
           </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Calendar className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900">Activity Log</h2>
                <p className="text-sm text-slate-400 font-medium">Your platform engagement over the last 30 days.</p>
             </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
             <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-100 rounded-sm" /> Missed</div>
             <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-600 rounded-sm" /> Active</div>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {heatmapDays.map((day, i) => (
            <div key={day.dateStr} className="group relative">
               <div 
                 className={`aspect-square rounded-2xl transition-all duration-300 border flex flex-col items-center justify-center ${
                   day.active 
                    ? "bg-indigo-600 border-indigo-700 shadow-lg shadow-indigo-100 scale-105" 
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                 }`}
               >
                 <span className={`text-[10px] font-black ${day.active ? "text-white" : "text-slate-400"}`}>
                   {day.date.getDate()}
                 </span>
                 <span className={`text-[8px] font-bold uppercase ${day.active ? "text-indigo-200" : "text-slate-300"}`}>
                   {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                 </span>
               </div>
               
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                 {day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                 <br />
                 <span className={day.active ? "text-indigo-400" : "text-slate-400"}>{day.active ? "✓ Active Session" : "× No Activity"}</span>
               </div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-6 flex items-start gap-4">
           <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
           <p className="text-sm text-indigo-900 font-medium leading-relaxed">
             Maintain your streak to earn the <span className="font-black text-indigo-600 uppercase tracking-widest text-[11px]">"Golden Creator"</span> badge. Missing a day will reset your streak to 0, but your total activity history will always be preserved!
           </p>
        </div>
      </div>

      {/* Reward Roadmap */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
              <Trophy className="w-5 h-5" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 uppercase italic">Engineering Roadmap</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { days: 7, label: "Exclusive Badges", icon: Medal, color: "text-blue-500", bg: "bg-blue-50" },
             { days: 30, label: "Social Identity", icon: Share2, color: "text-purple-500", bg: "bg-purple-50" },
             { days: 60, label: "Identity Glow", icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-50" },
             { days: 90, label: "Featured Prompt", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
             { days: 180, label: "Custom Theme", icon: Palette, color: "text-rose-500", bg: "bg-rose-50" },
             { days: 270, label: "Verified Tick", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
             { days: 365, label: "Custom PFP Upload", icon: Camera, color: "text-slate-900", bg: "bg-slate-100" },
             { days: 500, label: "Master Engineer", icon: Medal, color: "text-yellow-600", bg: "bg-yellow-100" },
           ].map((item) => (
             <div key={item.days} className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden ${streak >= item.days ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-slate-100 opacity-60"}`}>
                {streak >= item.days && (
                  <div className="absolute top-0 right-0 p-2">
                    <div className="bg-emerald-500 text-white p-1 rounded-full"><Check className="w-2.5 h-2.5" strokeWidth={4} /></div>
                  </div>
                )}
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
                   <item.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.days} Day Milestone</p>
                   <p className="text-sm font-black text-slate-900">{item.label}</p>
                </div>
                {streak < item.days && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600" style={{ width: `${(streak / item.days) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{item.days - streak} to go</span>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Rewards & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
               <Trophy className="text-yellow-500" /> Active Milestones
            </h2>
            <div className="space-y-3">
               {[
                 { label: "7 Day Kickstart", icon: Zap, status: streak >= 7 ? "completed" : "in-progress", progress: Math.min((streak / 7) * 100, 100) },
                 { label: "14 Day Strategist", icon: Star, status: streak >= 14 ? "completed" : "locked", progress: Math.min((streak / 14) * 100, 100) },
                 { label: "30 Day Visionary", icon: Medal, status: streak >= 30 ? "completed" : "locked", progress: Math.min((streak / 30) * 100, 100) },
               ].map((m, i) => (
                 <div key={i} className={`p-5 rounded-3xl border transition-all ${m.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.status === 'completed' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             <m.icon className="w-5 h-5" />
                          </div>
                          <div>
                             <p className={`font-black text-sm ${m.status === 'completed' ? 'text-green-900' : 'text-slate-900'}`}>{m.label}</p>
                             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{m.status === 'completed' ? 'Unlocked' : 'In Progress'}</p>
                          </div>
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${m.status === 'completed' ? 'text-green-600' : 'text-slate-300'}`}>
                          {Math.round(m.progress)}%
                       </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${m.status === 'completed' ? 'bg-green-500' : 'bg-indigo-600'}`} 
                         style={{ width: `${m.progress}%` }} 
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
               <Sparkles className="text-indigo-600" /> Unlockables
            </h2>
            <div className="grid gap-4">
               {[
                 { title: "Custom Profile Glow", desc: "Unlock a unique animated glow for your profile avatar.", req: "10 Day Streak" },
                 { title: "Premium AI Models", desc: "Get early access to experimental Gemini Pro models.", req: "25 Day Streak" },
                 { title: "Verified Engineer", desc: "Receive a permanent verification tick next to your name.", req: "50 Total Active Days" },
               ].map((u, i) => (
                 <div key={i} className="group p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-100 transition-all cursor-default">
                    <h3 className="font-black text-slate-900 text-[15px] mb-1 group-hover:text-indigo-600 transition-colors">{u.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">{u.desc}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       Locked: {u.req}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default StreakPage;
