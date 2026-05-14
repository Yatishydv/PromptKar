"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./Button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "warning";
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info"
}) => {
  // Prevent scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50",
      button: "bg-red-600 hover:bg-red-700 text-white",
      border: "border-red-100"
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
      bg: "bg-orange-50",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
      border: "border-orange-100"
    },
    info: {
      icon: <AlertCircle className="w-6 h-6 text-indigo-500" />,
      bg: "bg-indigo-50",
      button: "bg-indigo-600 hover:bg-indigo-700 text-white",
      border: "border-indigo-100"
    }
  };

  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100"
            >
              {/* Header Icon Section */}
              <div className={`h-32 ${style.bg} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center z-10"
                >
                  {style.icon}
                </motion.div>
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white/50 backdrop-blur-sm rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 text-center space-y-3">
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="p-8 pt-0 grid grid-cols-2 gap-4">
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="rounded-2xl h-12 font-black text-xs uppercase tracking-widest border-slate-100 text-slate-400 hover:bg-slate-50 transition-all"
                >
                  {cancelText}
                </Button>
                <Button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`rounded-2xl h-12 font-black text-xs uppercase tracking-widest border-none shadow-lg transition-all active:scale-95 ${style.button}`}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
