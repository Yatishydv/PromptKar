"use client";

import React from "react";
import { Check, Flame, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRankBadge, getRankTitle } from "@/lib/permissions";

interface AuthorAvatarProps {
  userId?: string;
  name?: string;
  avatar?: string;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  isAdmin?: boolean;
  streak?: number;
  username?: string;
  isGlowActive?: boolean;
  isVerifiedActive?: boolean;
  customBadge?: string;
  customTitle?: string;
}

export const AuthorAvatar = ({ 
  userId, 
  name = "Anonymous", 
  avatar, 
  className = "w-8 h-8",
  showName = false,
  nameClassName = "text-xs font-medium",
  isAdmin: forceIsAdmin,
  streak = 0,
  username,
  isGlowActive = false,
  isVerifiedActive = false,
  customBadge,
  customTitle
}: AuthorAvatarProps) => {
  const router = useRouter();
  
  const isAdmin = forceIsAdmin || 
                  name.toLowerCase() === "yatishydv" || 
                  name === "Yatishydv" || 
                  username?.toLowerCase() === "yatishydv";

  const isTeam = name.toLowerCase().includes("promptkar") || name.toLowerCase().includes("team");
  
  const displayAvatar = isTeam 
    ? "/team_avatar.png" 
    : (avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || name}&backgroundColor=b6e3f4,c0aede,d1d4f9`);

  const hasAvatar = !!displayAvatar;

  const handleClick = (e: React.MouseEvent) => {
    if (username) {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/profile/${username}`);
    }
  };

  const showGlow = isGlowActive || (isAdmin && isGlowActive === undefined);
  const showVerified = isAdmin || isVerifiedActive;

  return (
    <div 
      className={`flex items-center gap-2 ${username ? "cursor-pointer group/avatar" : ""}`}
      onClick={handleClick}
    >
      <div className={`relative ${className} rounded-full border border-slate-200/50 bg-card transition-all z-10 ${username ? "group-hover/avatar:border-indigo-600" : ""} ${showGlow ? "ring-4 ring-indigo-600/40 premium-glow-indigo" : ""}`}>
        <div className="w-full h-full rounded-full overflow-hidden">
          {hasAvatar ? (
            <img 
              src={displayAvatar} 
              alt={name} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center rounded-full">
              <span className="text-[40%] font-bold text-slate-400 uppercase">
                {name[0] || "U"}
              </span>
            </div>
          )}
        </div>
        {/* Identity Badge Overlays */}
        {showVerified && (
          <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow-sm z-20">
            <div className="bg-indigo-600 rounded-full p-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        )}
        {!showVerified && (isAdmin || streak >= 7) && (
          <div className="absolute -bottom-1 -right-1 bg-card rounded-full w-5 h-5 flex items-center justify-center shadow-sm z-20 text-[10px]">
            {getRankBadge(streak, isAdmin, customBadge)}
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex flex-col min-w-0">
          <div className={`${nameClassName} flex items-center gap-1 text-slate-900 leading-none`}>
            <span className="font-bold truncate group-hover/avatar:text-indigo-600">{name}</span>
            {isAdmin && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Owner</span>}
          </div>
          <span className="text-[10px] font-medium text-slate-400 lowercase">@{username}</span>
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
               <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-0.5">
                 <Flame className="w-2.5 h-2.5 fill-yellow-500/20" /> {streak}
               </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
