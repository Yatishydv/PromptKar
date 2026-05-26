"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Medal, Star, Heart, Eye, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Skeleton } from "@/components/ui/Skeleton";

const LeaderboardPage = () => {
  const [activeType, setActiveType] = useState<"users" | "prompts">("users");
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topPrompts, setTopPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [usersRes, promptsRes] = await Promise.allSettled([
          fetch("/api/users?sort=engagement&limit=10"),
          fetch("/api/prompts?trending=true&limit=10"),
        ]);

        if (usersRes.status === "fulfilled" && usersRes.value.ok) {
          const d = await usersRes.value.json();
          // The users API returns an array directly, but prompts use the success wrapper
          setTopUsers(Array.isArray(d) ? d : d.data || []);
        }
        if (promptsRes.status === "fulfilled" && promptsRes.value.ok) {
          const d = await promptsRes.value.json();
          setTopPrompts(Array.isArray(d) ? d : d.data || []);
        }
      } catch (error) {
        console.error("Leaderboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const medalColor = (i: number) =>
    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-500" : "text-slate-300";

  const rankBg = (i: number) =>
    i === 0 ? "bg-card border-yellow-400/30" :
    i === 1 ? "bg-card border-slate-300/30" :
    i === 2 ? "bg-card border-orange-400/30" : "bg-card border-slate-100";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-black uppercase tracking-widest border border-yellow-100">
          <Trophy className="w-3 h-3" /> Hall of Fame
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Global Leaderboard</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm font-medium">
          Celebrating the most influential creators and highest-ranked prompts in the community.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setActiveType("users")}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeType === "users" ? "bg-card text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Top Creators
          </button>
          <button
            onClick={() => setActiveType("prompts")}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeType === "prompts" ? "bg-card text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Top Prompts
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="w-full h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : activeType === "users" ? (
        <div className="space-y-3">
          {topUsers.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-slate-100">
              <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-900">No creators yet</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to share prompts and earn likes!</p>
            </div>
          ) : topUsers.map((user, index) => (
            <div key={user._id || user.firebaseUid} className={`flex items-center gap-5 p-4 rounded-2xl border transition-all hover:shadow-md ${rankBg(index)}`}>
              {/* Rank */}
              <div className="w-10 text-center font-black text-2xl text-slate-200 shrink-0">
                {index < 3 ? <Medal className={`w-6 h-6 mx-auto ${medalColor(index)}`} /> : <span className="text-sm text-slate-300">#{index + 1}</span>}
              </div>

              {/* Avatar */}
              <AuthorAvatar 
                userId={user.firebaseUid}
                name={user.name || user.username}
                username={user.username}
                avatar={user.avatar}
                className="w-12 h-12"
              />

              {/* Info */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.location.href = `/profile/${user.username}`}>
                <p className="font-black text-slate-900 truncate">{user.name || "Anonymous"}</p>
                <p className="text-[10px] text-slate-400 font-medium lowercase">@{user.username}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-black text-slate-900">{user.totalLikes || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 text-rose-400" /> Likes
                  </p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-black text-slate-900">{user.followers?.length || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</p>
                </div>
                <Link href={`/profile/${user.username || user.firebaseUid}`}>
                  <Button className="bg-slate-900 text-white border-none rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {topPrompts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-slate-100">
              <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-900">No prompts yet</p>
              <p className="text-slate-400 text-sm mt-1">Create prompts and earn likes to appear here!</p>
            </div>
          ) : topPrompts.map((prompt, index) => (
            <div key={prompt._id || prompt.slug} className={`flex items-center gap-5 p-4 rounded-2xl border transition-all hover:shadow-md ${rankBg(index)}`}>
              {/* Rank */}
              <div className="w-10 text-center shrink-0">
                {index < 3 ? <Medal className={`w-6 h-6 mx-auto ${medalColor(index)}`} /> : <span className="text-sm font-black text-slate-300">#{index + 1}</span>}
              </div>

              {/* Tool icon replacements */}
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-400/50" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{prompt.category}</span>
                </div>
                <p className="font-black text-slate-900 truncate">{prompt.title}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-black text-slate-900">{prompt.likes || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 text-rose-400" /> Likes
                  </p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-black text-slate-900">{prompt.views || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" /> Views
                  </p>
                </div>
                <Link href={`/prompt/${prompt.slug}`}>
                  <Button className="bg-indigo-600 text-white border-none rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center gap-1">
                    Try <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {[
          { icon: "🥇", title: "Top 10 Badge", desc: "Exclusive badge shown on your profile and every prompt you share." },
          { icon: "🔥", title: "Featured Spotlight", desc: "Your best prompts pinned to the trending section for all visitors." },
          { icon: "⚡", title: "Premium Tools", desc: "Unlock advanced analytics and bulk enhancement tools for free." },
        ].map(item => (
          <div key={item.title} className="bg-card border border-slate-100 rounded-2xl p-5 text-center hover:shadow-md transition-all">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h4 className="font-black text-slate-900 text-sm mb-1">{item.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
