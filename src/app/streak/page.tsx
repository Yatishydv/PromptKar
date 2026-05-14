"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Flame, Trophy, Calendar, Zap, Star, ChevronRight, Share2, Sparkles, Medal, Palette, CheckCircle2, Camera, Check, Clock, Layout, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const StreakPage = () => {
  const { userData, user } = useAuth();
  const streak = userData?.currentStreak || 0;
  const activityDates = useMemo(() => userData?.activityDates || [], [userData]);

  // Logic for Monthly Calendar
  const groupedMonths = useMemo(() => {
    const months: Record<string, { date: Date; dateStr: string; active: boolean }[]> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        days.push({ date, dateStr, active: activityDates.includes(dateStr) });
      }
      months[monthKey] = days;
    }
    return months;
  }, [activityDates]);

  const monthNames = Object.keys(groupedMonths);
  const [selectedMonth, setSelectedMonth] = useState(monthNames[0]);

  const handleShare = async () => {
    const shareData = {
      title: 'My PromptKar Streak',
      text: `I'm on a ${streak} day streak at PromptKar! Join me and master the community.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Link and streak info copied to clipboard!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300"><Flame className="w-10 h-10" /></div>
        <h1 className="text-2xl font-black text-slate-900 text-center uppercase tracking-tight">Sign In Required</h1>
        <Link href="/login" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Sign In</Link>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-4 pt-12">
      {/* Top Header Bento Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Streak Card */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-60 group-hover:bg-indigo-100 transition-colors" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100"><Flame className="w-8 h-8" /></div>
              <button 
                onClick={handleShare}
                className="px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <Share2 className="w-3 h-3" /> Share Journey
              </button>
            </div>
            <div className="mt-12">
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{streak} <span className="text-xl text-slate-400 font-bold uppercase tracking-[0.2em] ml-2">Days</span></h1>
              <p className="text-slate-500 font-medium mt-4 max-w-xs">Your consistency is synchronized with the global platform. Every day counts toward your legacy.</p>
            </div>
          </div>
        </div>

        {/* Mini Stats Bento */}
        <div className="grid grid-rows-2 gap-6 md:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Activity</p>
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-black">{activityDates.length}</h2>
              <Zap className="w-8 h-8 text-indigo-400 mb-1" />
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Personal Best</p>
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-black text-slate-900">{userData?.bestStreak || streak}</h2>
              <Trophy className="w-8 h-8 text-yellow-500 mb-1 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
        </div>

        {/* Rank Bento */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
           <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><Star className="w-6 h-6" /></div>
              <ArrowUpRight className="w-6 h-6 text-indigo-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Global Tier</p>
              <h2 className="text-2xl font-black text-indigo-900 italic">Elite Creator</h2>
              <div className="mt-4 h-1.5 w-full bg-indigo-200 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 w-3/4 rounded-full" />
              </div>
           </div>
        </div>
      </div>

      {/* Main History & Roadmap Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Bento */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900"><Calendar className="w-5 h-5" /></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Activity Archive</h2>
            </div>
            <div className="relative group">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-100 rounded-xl py-2 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:border-indigo-600/20 transition-all cursor-pointer"
              >
                {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/50">
            <div className="grid grid-cols-7 gap-3 mb-6">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                <div key={d} className="text-center text-[9px] font-black text-slate-300 tracking-[0.2em]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {(() => {
                const monthData = groupedMonths[selectedMonth] || [];
                const firstDay = monthData[0]?.date.getDay() || 0;
                const padding = [];
                for (let i = 0; i < firstDay; i++) padding.push(<div key={`pad-${i}`} className="aspect-square" />);
                return padding;
              })()}
              {(groupedMonths[selectedMonth] || []).map(day => {
                const isToday = day.dateStr === todayStr;
                return (
                  <div key={day.dateStr} className="group relative">
                    <div className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 ${
                      day.active 
                        ? "bg-white border-slate-200 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    } ${isToday ? "scale-110 z-10 border-slate-300 shadow-md" : ""}`}>
                      {day.active && <Flame className="w-4 h-4 md:w-6 md:h-6 text-yellow-500 animate-pulse-slow" />}
                      <span className={`text-[10px] md:text-xs font-black mt-1 ${
                        isToday ? "text-indigo-600" : day.active ? "text-slate-900" : "text-slate-400"
                      }`}>{day.date.getDate()}</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-30 pointer-events-none uppercase tracking-widest shadow-xl translate-y-1 group-hover:translate-y-0">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      {isToday && " (TODAY)"}
                      <span className="mx-2 opacity-20">|</span> 
                      {day.active ? "✓ Activity Active" : "× Missed"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Roadmap Rewards Bento */}
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm space-y-8 flex flex-col h-full">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600"><Trophy className="w-5 h-5" /></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Roadmap Journey</h2>
           </div>

           <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {[
                { days: 7, label: "Exclusive Badges", icon: Medal, bg: "bg-blue-50 text-blue-500" },
                { days: 30, label: "Social Identity", icon: Share2, bg: "bg-purple-50 text-purple-500" },
                { days: 60, label: "Identity Glow", icon: Sparkles, bg: "bg-indigo-50 text-indigo-500" },
                { days: 90, label: "Featured Prompt", icon: Star, bg: "bg-amber-50 text-amber-500" },
              ].map((item) => (
                <div key={item.days} className={`p-5 rounded-3xl border transition-all ${streak >= item.days ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-slate-100 opacity-60"}`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}><item.icon className="w-5 h-5" /></div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.days} Days</p>
                         <p className="text-xs font-black text-slate-900">{item.label}</p>
                      </div>
                      {streak >= item.days ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-slate-300" />}
                   </div>
                </div>
              ))}
           </div>

           <button 
             onClick={handleShare}
             className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
           >
              <Share2 className="w-3.5 h-3.5" /> Share Achievements
           </button>
        </div>
      </div>
    </div>
  );
};

export default StreakPage;
