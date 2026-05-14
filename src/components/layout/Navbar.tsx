"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, Sun, ChevronDown, Sparkles, Plus, Zap, BookOpen, HelpCircle, LayoutGrid, Check, Megaphone, X, Menu, ArrowLeft, Trophy, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useSystem } from "@/lib/system-context";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { AuthorAvatar } from "@/components/ui/AuthorAvatar";
import { getRankTitle, getRankBadge } from "@/lib/permissions";

// ── Dropdown component ────────────────────────────────────────────────
const DropdownMenu = ({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { label: string; href: string; icon: any; desc: string }[];
  isActive: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-0.5 text-[12.5px] font-bold transition-all relative py-[22px] ${isActive || open ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
          }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ml-0.5 ${open ? "rotate-180" : ""}`} />
        {(isActive || open) && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-[12.5px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const PROMPTS_ITEMS = [
  { label: "Browse Prompts", href: "/prompts", icon: LayoutGrid, desc: "" },
  { label: "AI Enhancer", href: "/enhance", icon: Zap, desc: "" },
  { label: "Create Prompt", href: "/create", icon: Plus, desc: "" },
];

const RESOURCES_ITEMS = [
  { label: "Blog", href: "/blog", icon: BookOpen, desc: "" },
  { label: "FAQ", href: "/faq", icon: HelpCircle, desc: "" },
];

// ── Navbar ────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, userData, logout, isAdmin } = useAuth();
  const { settings } = useSystem();
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isMac, setIsMac] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Robust Mac detection
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";
    const userAgent = navigator.userAgent || "";
    setIsMac(/Mac/i.test(platform) || /Mac/i.test(userAgent));

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (showMobileMenu) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMobileMenu]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchVal.trim()) {
      router.push(`/prompts?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setShowMobileMenu(false);
    }
  };

  const isLink = (href: string) => pathname === href;
  const isInPrompts = ["/prompts", "/enhance", "/create"].includes(pathname);
  const isInResources = ["/blog", "/faq"].includes(pathname);

  const linkCls = (href: string) =>
    `text-[12.5px] font-bold transition-all relative py-[22px] ${isLink(href) ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
    }`;

  // Carousel & Rich Text Logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeAnnouncements = settings.announcements?.filter(a => a.enabled) || [];

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [activeAnnouncements.length]);

  const renderRichText = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-2 hover:text-indigo-200 transition-colors font-black cursor-pointer pointer-events-auto inline-block mx-1"
            onClick={(e) => e.stopPropagation()}
          >
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <nav className={`relative z-50 transition-all duration-300 w-full`}>
      {/* Multi-Announcement Carousel */}
      {settings.announcementsEnabled && activeAnnouncements.length > 0 && showAnnouncement && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 text-center relative overflow-hidden group h-[42px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-50" />

          <div className="relative w-full h-full flex items-center justify-center">
            {activeAnnouncements.map((ann: any, idx: number) => (
              <div
                key={idx}
                className={`absolute inset-0 flex items-center justify-center gap-3 transition-all duration-1000 ease-in-out transform ${idx === currentIndex
                    ? "opacity-100 translate-x-0"
                    : idx < currentIndex
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 translate-x-full"
                  }`}
              >
                <Megaphone className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {renderRichText(ann.text)}
                </div>
              </div>
            ))}

            {settings.announcementCloseable && (
              <button
                onClick={() => setShowAnnouncement(false)}
                className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <header className={`h-[64px] w-full bg-white border-b border-slate-100 px-4 md:px-8 flex items-center shrink-0 z-50`}>
        <button
          onClick={() => setShowMobileMenu(true)}
          className="lg:hidden p-2 -ml-2 mr-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand — LEFT */}
        <div className="flex-none">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="PromptKar" className="h-6.5 w-auto object-contain" />
          </Link>
        </div>

        {/* Spacer — pushes everything else to the right */}
        <div className="flex-1" />

        {/* Search + Nav tabs — RIGHT side before actions */}
        <div className="hidden lg:flex items-center gap-8">

          {/* Search */}
          <div className="relative group hidden xl:block w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3 group-focus-within:text-indigo-600 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search prompts..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-9 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600/20 transition-all text-[11px] font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white border border-slate-100 px-1 py-0.5 rounded text-[8px] font-bold text-slate-300">
              <span>{isMac ? '⌘' : 'Ctrl'}</span><span>K</span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="hidden xl:flex items-center gap-5">

            <Link href="/" className={linkCls("/")}>
              Home
              {isLink("/") && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-full" />}
            </Link>

            {/* Prompts + AI Enhance + Create — dropdown */}
            <DropdownMenu label="Prompts" items={PROMPTS_ITEMS} isActive={isInPrompts} />

            <Link href="/categories" className={linkCls("/categories")}>
              Categories
              {isLink("/categories") && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-full" />}
            </Link>

            <Link href="/leaderboard" className={linkCls("/leaderboard")}>
              Leaderboard
              {isLink("/leaderboard") && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-full" />}
            </Link>

            {/* Blog + FAQ — dropdown */}
            <DropdownMenu label="Blog & FAQ" items={RESOURCES_ITEMS} isActive={isInResources} />

          </nav>
        </div>

        {/* Right actions — Sun, Bell, Profile */}
        <div className="flex items-center gap-4 ml-8">
          <div className="flex items-center gap-1.5">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all text-slate-400">
              <Sun className="w-5 h-5" />
            </button>
            <NotificationDropdown />
          </div>

          {user ? (
            <div className="relative">
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-100 group cursor-pointer"
              >
                <div className="relative">
                  {userData?.avatar || user.photoURL ? (
                    <img
                      src={userData?.avatar || user.photoURL}
                      className="w-8 h-8 rounded-full border border-slate-100 shadow-sm group-hover:border-indigo-600 transition-all object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-indigo-100 uppercase">
                      {(userData?.name || userData?.username || user.displayName || "U")[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-[12.5px] font-black text-[#0F172A] flex items-center gap-1">
                    @{userData?.username || "user"}
                    <span className="ml-0.5 text-[10px]">{getRankBadge(userData?.currentStreak || 0, isAdmin, userData?.customBadge)}</span>
                    {isAdmin && (
                      <div className="bg-indigo-600 rounded-full p-0.5 shadow-sm ml-0.5">
                        <Check className="w-2 h-2 text-white stroke-[4]" />
                      </div>
                    )}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-all ${showProfileMenu ? "rotate-180" : ""}`} />
                </div>
              </div>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Your Rank</p>
                      <p className="text-[11px] font-black text-indigo-600 mt-1">{getRankTitle(userData?.currentStreak || 0, isAdmin, userData?.customTitle)}</p>
                    </div>
                    <Link
                      href={`/profile/${userData?.username || user.uid}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Settings
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-black text-indigo-600 hover:bg-indigo-50 transition-all"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="h-px bg-slate-50 my-1" />
                    <button
                      onClick={() => { logout(); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-all text-left"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-indigo-600 text-white rounded-xl px-4 h-8 font-bold text-[12.5px] shadow-indigo border-none">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[101] lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <Link href="/" onClick={() => setShowMobileMenu(false)} className="flex items-center">
                  <img src="/logo.png" alt="PromptKar" className="h-12 w-auto object-contain" />
                </Link>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-slate-400 hover:text-indigo-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Search prompts..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Prompts</p>
                    <div className="grid gap-1">
                      {PROMPTS_ITEMS.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-bold">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Resources</p>
                    <div className="grid gap-1">
                      <Link href="/categories" onClick={() => setShowMobileMenu(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname === "/categories" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-sm font-bold">Categories</span>
                      </Link>
                      {RESOURCES_ITEMS.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname === item.href ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-bold">{item.label}</span>
                        </Link>
                      ))}
                      <Link href="/leaderboard" onClick={() => setShowMobileMenu(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname === "/leaderboard" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-bold">Leaderboard</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                {!user ? (
                  <Link href="/login" onClick={() => setShowMobileMenu(false)}>
                    <Button className="w-full bg-indigo-600 text-white rounded-xl h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100">Sign In to Platform</Button>
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/profile/${userData?.username || user.uid}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100"
                    >
                      <AuthorAvatar userId={user.uid} name={userData?.name || userData?.username} avatar={userData?.avatar} className="w-10 h-10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">@{userData?.username || "user"}</p>
                        <p className="text-[10px] font-bold text-slate-400">View Profile</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                    </Link>

                    <Button
                      onClick={() => { logout(); setShowMobileMenu(false); }}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-red-100 bg-red-50/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out Account
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
