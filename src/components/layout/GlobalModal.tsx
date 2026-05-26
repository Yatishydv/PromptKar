"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, Zap, Bell, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export function GlobalModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const modal = searchParams.get("modal");
  
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    if (modal) {
      try {
        // Handle Base64 encoded custom modals
        const decoded = Buffer.from(modal, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        setModalData(parsed);
        // Trigger confetti for custom modals
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#3b82f6', '#f59e0b', '#10b981']
        });
      } catch (e) {
        // Fallback to legacy string IDs if not valid Base64 JSON
        setModalData({ id: modal });
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setModalData(null);
    }
  }, [modal]);

  const handleClose = () => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'zap': return <Zap className="w-12 h-12 text-amber-500 mb-6 drop-shadow-lg" />;
      case 'award': return <Award className="w-12 h-12 text-blue-500 mb-6 drop-shadow-lg" />;
      case 'check': return <CheckCircle className="w-12 h-12 text-emerald-500 mb-6 drop-shadow-lg" />;
      default: return <Bell className="w-12 h-12 text-indigo-500 mb-6 drop-shadow-lg" />;
    }
  };

  // Build the content
  let title = "System Notification";
  let icon = getIcon('bell');
  let content = "You have a new alert.";

  if (modalData?.title) {
    title = modalData.title;
    icon = getIcon(modalData.icon);
    content = modalData.content;
  } else if (modalData?.id === "features") {
    title = "New Features Unlocked!";
    icon = getIcon('zap');
    content = "We've just released a ton of new features! Explore the platform to see what's new.";
  } else if (modalData?.id === "welcome") {
    title = "Welcome to PromptKar!";
    icon = getIcon('award');
    content = "We're thrilled to have you here. Start exploring the best AI prompts and templates today!";
  } else if (modalData?.id) {
    content = `System Alert: ${modalData.id}`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100 p-8 text-center relative"
            >
              <button 
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex justify-center">{icon}</div>
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-3">
                {title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                {content}
              </p>
              
              <button 
                onClick={handleClose}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"
              >
                Got it
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
