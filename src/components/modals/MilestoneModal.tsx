"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Flame, X, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getRankTitle, getRankBadge } from "@/lib/permissions";
import Link from "next/link";

interface MilestoneModalProps {
  streak: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({ streak, isOpen, onClose }) => {
  const rank = getRankTitle(streak);
  const badge = getRankBadge(streak);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Top Glow */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent" />
            
            <div className="p-10 flex flex-col items-center text-center space-y-8 relative z-10">
               {/* Animated Icon Container */}
               <div className="relative">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200"
                  >
                     <PartyPopper className="w-12 h-12" />
                  </motion.div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-indigo-200 rounded-full opacity-50"
                  />
               </div>

               <div className="space-y-3">
                  <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em]">New Milestone Reached</h2>
                  <h1 className="text-4xl font-[900] text-slate-900 italic tracking-tight leading-none uppercase">Congratulations!</h1>
                  <p className="text-slate-500 font-medium">You've unlocked a new engineering rank on PromptKar.</p>
               </div>

               <div className="w-full bg-slate-50/80 rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
                  <div className="flex items-center justify-center gap-4">
                     <span className="text-4xl">{badge}</span>
                     <div className="h-10 w-px bg-slate-200" />
                     <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Rank Earned</p>
                        <p className="text-xl font-black text-slate-900">{rank}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-white/80 py-2 px-4 rounded-full border border-slate-100">
                     <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                     <span className="text-sm font-black text-slate-900">{streak} Day Streak Unlocked</span>
                  </div>
               </div>

               <div className="flex flex-col w-full gap-3">
                  <Link href="/streak" className="w-full" onClick={onClose}>
                    <Button className="w-full bg-indigo-600 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all border-none">
                      Check My Rewards <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 h-10"
                  >
                    Close for now
                  </Button>
               </div>
            </div>

            {/* Confetti Elements */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
            <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
            <div className="absolute bottom-10 left-20 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
