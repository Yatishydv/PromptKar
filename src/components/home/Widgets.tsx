"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Heart, Users, ChevronRight, ChevronLeft, Lightbulb, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import useSWR from "swr";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const AIWidget = () => {
  const [text, setText] = useState("");

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <h3 className="font-bold text-sm text-slate-900">Prompt Enhancer</h3>
      </div>
      <textarea 
        placeholder="Enter prompt..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-4 resize-none"
      />
      <Link href={`/enhance?prompt=${encodeURIComponent(text)}`}>
        <Button className="w-full font-bold">Enhance Prompt</Button>
      </Link>
    </div>
  );
};

export const CreatorsWidget = () => {
  const { data: creators = [], isLoading } = useSWR('/api/users?sort=engagement&limit=5', fetcher);

  const rankColor = (i: number) => 
    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-500" : "text-slate-300";

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="font-bold text-sm text-slate-900">Top Creators</h3>
        </div>
        <Link href="/leaderboard" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">View All</Link>
      </div>
      
      <div className="space-y-5">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Ranking Creators...</p>
          </div>
        ) : creators.length === 0 ? (
          <p className="text-center py-4 text-xs font-bold text-slate-400 italic">No creators found yet.</p>
        ) : creators.map((c: any, i: number) => (
          <div key={c.username} className="flex items-center justify-between group">
             <div className="flex items-center gap-3">
               <div className={`w-5 text-[10px] font-black ${rankColor(i)}`}>
                 #{i + 1}
               </div>
               <AuthorAvatar 
                  userId={c.firebaseUid}
                  username={c.username}
                  avatar={c.avatar}
                  name={c.name || c.username}
                  className="w-8 h-8 ring-2 ring-slate-50"
               />
               <div className="flex flex-col">
                 <Link href={`/profile/${c.username}`} className="text-[11px] font-black text-slate-700 hover:text-indigo-600 truncate max-w-[80px]">
                    @{c.username}
                 </Link>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{c.name || c.username}</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <div className="flex items-center gap-1 text-[10px] font-black text-slate-600">
                    {c.totalLikes || 0} <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                 </div>
                 <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {c.followersCount || 0} <Users className="w-2.5 h-2.5" />
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommunityWidget = () => (
  <div className="bg-indigo-600 text-white p-6 rounded-xl">
    <h3 className="font-bold text-sm mb-2">Join the Community</h3>
    <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
      Share prompts, climb the leaderboard, and learn from 25K+ members.
    </p>
    <Link href="/login">
      <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold">
        Get Started
      </Button>
    </Link>
  </div>
);

export const TipWidget = () => (
  <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
    <div className="flex items-center gap-2 mb-3">
      <Lightbulb className="w-4 h-4 text-orange-500" />
      <h3 className="font-bold text-sm text-slate-900">Pro Tip</h3>
    </div>
    <p className="text-xs text-slate-600 leading-relaxed font-medium">
      Be specific with your prompts to get more accurate results from AI models.
    </p>
  </div>
);
