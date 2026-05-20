"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Search, UserPlus, ArrowRight, 
  ShieldCheck, Flame, Zap, Sparkles, 
  TrendingUp, Star, Filter, Loader2,
  Globe, MessageSquare, Heart, ChevronRight
} from "lucide-react";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { Button } from "@/components/ui/Button";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getRankTitle, getRankBadge } from "@/lib/permissions";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "streak" | "name">("streak");
  const { data: usersRaw, isLoading } = useSWR('/api/users', fetcher);
  
  const users = useMemo(() => {
    const list = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || [];
    return list.filter((u: any) => u.username); // Ensure valid users
  }, [usersRaw]);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u: any) => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === "streak") {
      result.sort((a: any, b: any) => (b.currentStreak || 0) - (a.currentStreak || 0));
    } else if (sortBy === "newest") {
      result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "name") {
      result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return result;
  }, [users, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Light Pro Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-50 border border-card p-10 md:p-16 text-center space-y-6 shadow-sm">
         <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/80 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">
               <Users className="w-3 h-3" /> Community Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Connect with <span className="text-indigo-600">Top Creators</span>
            </h1>
            <p className="text-slate-500 text-base font-bold leading-relaxed">
              Explore the global intelligence network. Discover experts, track streaks, and collaborate with the community.
            </p>
         </div>

         {/* Search Bar */}
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <div className="relative w-full max-w-md group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                 type="text"
                 placeholder="Search creators..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-card border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
               />
            </div>
            <div className="flex items-center gap-2 bg-card border border-slate-100 rounded-xl px-4 py-2 shadow-sm">
               <TrendingUp className="w-4 h-4 text-indigo-600" />
               <span className="text-slate-900 text-sm font-black">{users.length}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Creators</span>
            </div>
         </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-8">
         <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Sort Creators</h3>
         </div>
         <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {[
              { id: "streak", label: "Streak" },
              { id: "newest", label: "Newest" },
              { id: "name", label: "Name" }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as any)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === option.id 
                    ? "bg-card text-indigo-600 shadow-sm border border-slate-100" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
         </div>
      </div>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u: any, index: number) => (
              <motion.div
                key={u.firebaseUid}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <Link href={`/profile/${u.username}`} className="group block h-full">
                  <div className="bg-card border border-slate-100 rounded-3xl p-6 hover:border-indigo-600 hover:shadow-soft transition-all h-full flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                       <div className="w-20 h-20 rounded-full border-2 border-slate-50 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                          <AuthorAvatar avatar={u.avatar} name={u.name} className="w-full h-full object-cover" />
                       </div>
                       {u.currentStreak > 0 && (
                         <div className="absolute -top-1 -right-1 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-card shadow-sm">
                            🔥
                         </div>
                       )}
                    </div>

                    <div className="space-y-1">
                       <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{u.name || u.username}</h3>
                       <p className="text-[10px] font-bold text-slate-400 lowercase leading-none">@{u.username}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                       <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                          {getRankTitle(u.currentStreak || 0, u.isAdmin, u.customTitle)}
                       </span>
                    </div>

                    <div className="mt-auto pt-4 w-full border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                             <Flame className="w-3 h-3 text-orange-500" /> {u.currentStreak || 0}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                             <Users className="w-3 h-3 text-indigo-600" /> {u.followersCount || 0}
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search className="w-6 h-6" />
               </div>
               <p className="text-sm font-black text-slate-900">No creators matched your search</p>
               <Button onClick={() => setSearchTerm("")} variant="ghost" className="text-indigo-600 font-bold text-xs uppercase">Clear search</Button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Footer */}
      <div className="bg-indigo-50 rounded-[2.5rem] p-10 md:p-16 text-center space-y-6 mt-12">
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Establish your identity</h2>
         <p className="text-slate-500 font-bold max-w-lg mx-auto text-sm">Join the global network of prompt engineers and start your streak today.</p>
         <div className="flex items-center justify-center gap-4">
            <Link href="/register">
               <Button className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-indigo border-none">Get Started</Button>
            </Link>
         </div>
      </div>
    </div>
  );
}
