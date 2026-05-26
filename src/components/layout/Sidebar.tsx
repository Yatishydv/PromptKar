"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Search, Sparkles, Layout, Box, 
  Users, Trophy, Book, Bookmark, User,
  Plus, Flame, ChevronRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { useAuth } from "@/lib/auth-context";

const Sidebar = () => {
  const pathname = usePathname();
  const { userData } = useAuth();

  // Calculate current week's activity
  const getWeeklyActivity = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        active: userData?.activityDates?.includes(dateStr) || false
      });
    }
    return days;
  };

  const weeklyActivity = getWeeklyActivity();
  const streak = userData?.currentStreak || 0;

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Prompts", href: "/prompts" },
    { icon: Sparkles, label: "AI Enhancer", href: "/enhance" },
    { icon: Layout, label: "Categories", href: "/categories" },
    { icon: Users, label: "Community", href: "/community" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Book, label: "Blog", href: "/blog" },
  ];

  return (
    <aside className="hidden lg:flex w-[220px] bg-card border-r border-slate-100 flex-col h-full overflow-y-auto no-scrollbar py-6 px-4 shrink-0">
      {/* Navigation */}
      <nav className="space-y-0.5 mb-8">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Widgets */}
      <div className="space-y-6 mt-auto">
        {/* Create Card */}
        <Link href="/create" className="block group/create">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[1.5rem] p-5 relative overflow-hidden shadow-indigo hover:shadow-premium transition-all duration-300 cursor-pointer active:scale-[0.98]">
            <div className="absolute top-3.5 right-3.5 bg-card/20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover/create:rotate-90 transition-transform duration-300">
               <Plus className="text-white w-4 h-4" />
            </div>
            <div className="relative z-10 space-y-3.5">
               <div className="space-y-1.5">
                  <h4 className="font-extrabold text-white text-[15px]">Create Prompt</h4>
                  <p className="text-[11px] text-indigo-50/80 leading-relaxed font-bold">Share your ideas with the community and get likes.</p>
               </div>
               <Button className="w-full bg-card text-primary hover:bg-card text-[11px] font-black h-9.5 rounded-xl shadow-lg border-none flex items-center justify-center gap-1.5 whitespace-nowrap">
                  Create Now <ChevronRight className="w-3.5 h-3.5" />
               </Button>
            </div>
          </div>
        </Link>

        {/* Streak Widget */}
        <Link href="/streak" className="block group/streak">
          <div className="bg-card border border-slate-50 rounded-[1.5rem] p-5 shadow-sm shadow-slate-100/50 space-y-4 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50 transition-all cursor-pointer">
             <div className="space-y-1">
                <span className="text-[14px] font-black text-slate-900 flex items-center gap-1.5 group-hover/streak:text-indigo-600 transition-colors">
                  Your Streak <span className="text-orange-500 text-base">🔥</span>
                </span>
                <div className="text-xl font-black text-slate-900">{streak} Day{streak !== 1 ? 's' : ''}</div>
                <p className="text-[10px] text-slate-400 font-bold">
                  {streak === 0 ? "Start your journey today!" : streak > 5 ? "You're on fire! Keep it up." : "Keep it up! You're doing great."}
                </p>
             </div>
             
             <div className="space-y-2.5">
                <div className="flex justify-between items-center px-0.5 gap-1">
                   {weeklyActivity.map((day, i) => (
                      <div key={i} className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${day.active ? "bg-indigo-600 shadow-sm" : "border-2 border-slate-100"}`}>
                         {day.active && <div className="w-1.5 h-1.5 bg-card rounded-full opacity-80" />}
                      </div>
                   ))}
                </div>
                <div className="flex justify-between px-1">
                   {weeklyActivity.map((day, i) => (
                      <span key={i} className={`text-[9px] font-black uppercase ${day.active ? "text-indigo-600" : "text-slate-300"}`}>{day.label}</span>
                   ))}
                </div>
             </div>
          </div>
        </Link>

        {/* Upgrade Card */}
        <div className="bg-indigo-50 rounded-[1.5rem] p-5 border border-slate-100 space-y-5">
           <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-black text-slate-900">Upgrade to Pro</span>
              <span className="text-yellow-500 text-base">⭐</span>
           </div>
           <ul className="space-y-3">
              {[
                "Unlimited AI Enhances",
                "Advanced Analytics",
                "Priority Support",
                "Early Access"
              ].map(feature => (
                <li key={feature} className="flex items-center gap-2 text-[10.5px] font-bold text-slate-600">
                   <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" strokeWidth={3} />
                   {feature}
                </li>
              ))}
           </ul>
           <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-600/90 text-[12.5px] font-black h-10.5 rounded-xl shadow-lg shadow-indigo-100 border-none">
             Upgrade Now
           </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
