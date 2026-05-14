"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Heart, Send } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  const links = {
    Platform: [
      { label: "Home", href: "/" },
      { label: "Browse Prompts", href: "/prompts" },
      { label: "Categories", href: "/categories" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "AI Enhancer", href: "/enhance" },
    ],
    Create: [
      { label: "Create Prompt", href: "/create" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
    ],
    Account: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "Settings", href: "/settings" },
    ],
  };

  return (
    <footer className="bg-white border-t border-slate-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4 lg:col-span-5 space-y-6">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="PromptKar" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Empowering creators and engineers to build the future with AI. Join the world's most innovative prompt engineering community.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-sky-50 hover:border-sky-100 transition-all">
                <span className="text-sm font-black italic">X</span>
              </a>
              <a href="mailto:hello@promptkar.app"
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                <Send className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-8 lg:col-span-7 gap-8">
            {Object.entries(links).map(([group, items]) => (
              <div key={group} className="space-y-5">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{group}</h4>
                <ul className="space-y-3">
                  {items.map(item => (
                    <li key={item.href}>
                      <Link href={item.href}
                        className="text-[13px] text-slate-400 hover:text-indigo-600 font-bold transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-slate-400 font-bold">
            © {year} PromptKar. Built with <Heart className="w-3 h-3 inline text-rose-400 fill-rose-400 mx-1" /> for the community.
          </p>
          <div className="flex items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-wider">
            <Link href="/faq" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link href="/faq" className="hover:text-indigo-600 transition-colors">Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
