import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo",
      secondary: "bg-slate-900 text-white hover:bg-slate-800 active:bg-black shadow-lg",
      outline: "border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100",
      ghost: "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100",
      danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-lg shadow-red-100",
      glass: "bg-white/70 backdrop-blur-md border border-white/50 text-slate-700 shadow-soft hover:bg-white/90",
    };

    const sizes = {
      sm: "px-4 py-2 text-[11px] font-black uppercase tracking-widest",
      md: "px-6 py-2.5 text-[12.5px] font-black uppercase tracking-widest",
      lg: "px-8 py-3 text-[14px] font-black uppercase tracking-widest",
      icon: "p-2 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 justify-center rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-95 select-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
