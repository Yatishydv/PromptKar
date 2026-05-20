"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

interface StreakAnimationProps {
  show: boolean;
  streak: number;
  isFirstDay: boolean;
  onClose: () => void;
}

export const StreakAnimation: React.FC<StreakAnimationProps> = ({ show, streak, isFirstDay, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  // Particle embers for the fire effect
  const embers = Array.from({ length: 8 });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: -100, x: "-50%", scale: 0.8 }}
          animate={{ opacity: 1, y: 40, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.9, transition: { duration: 0.3 } }}
          className="fixed top-0 left-1/2 z-[200] w-full max-w-[280px]"
        >
          <div className="relative">
            {/* The Glass Card */}
            <div className="bg-card/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-6 shadow-[0_30px_100px_rgba(234,88,12,0.15)] overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/20 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10">
                {/* Fire Container */}
                <div className="relative shrink-0">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.8,
                      ease: "easeInOut" 
                    }}
                  >
                    <Flame className="w-14 h-14 text-orange-600 fill-orange-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.6)]" />
                  </motion.div>

                  {/* Embers/Particles */}
                  {embers.map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 0, x: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        y: -40 - Math.random() * 40,
                        x: (Math.random() - 0.5) * 40,
                        scale: [0, 1, 0]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1 + Math.random(),
                        delay: Math.random() * 2
                      }}
                      className="absolute top-4 left-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full blur-[1px]"
                    />
                  ))}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                       <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">{isFirstDay ? "New Streak!" : "Keep it up!"}</span>
                       <Sparkles className="w-3 h-3 text-orange-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-slate-900 tracking-tighter">{streak}</span>
                       <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Days</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500/80 leading-none mt-1">
                      {isFirstDay ? "Journey Started" : "Daily Activity Core"}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Progress Line */}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-300 origin-left"
              />
            </div>

            {/* Reflection Shine */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] pointer-events-none"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
