"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Minus, Search, HelpCircle, MessageCircle,
  Sparkles, BookOpen, Zap, Shield, User, CreditCard,
  ChevronRight
} from "lucide-react";

// ── FAQ data with categories ─────────────────────────────────────────
const FAQS = [
  {
    category: "Getting Started",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    questions: [
      {
        q: "What is PromptKar?",
        a: "PromptKar is a social platform and directory for AI prompt engineering. We help you discover high-quality prompts for tools like ChatGPT, Midjourney, Claude, and Stable Diffusion — and provide AI-powered tools to improve your own prompts.",
      },
      {
        q: "How do I get started?",
        a: "Simply create a free account, browse the prompt library, and start exploring. You can like, save, and copy any prompt instantly. To share your own prompts, click 'Create' in the navigation bar.",
      },
      {
        q: "Do I need an account to browse prompts?",
        a: "No! You can browse, view, and copy prompts without an account. However, you'll need to register to like prompts, save them to your profile, follow creators, and publish your own.",
      },
    ],
  },
  {
    category: "Prompts & AI Tools",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    questions: [
      {
        q: "How do I improve my prompts with AI?",
        a: "Visit the 'AI Enhancer' page (under the Prompts menu in the navbar), paste your basic prompt, and our Gemini-powered engine will rewrite it into a more effective, detailed version. You can also visit any prompt page and click 'Enhance with AI'.",
      },
      {
        q: "What AI tools are supported?",
        a: "PromptKar supports prompts for ChatGPT (GPT-3.5 & GPT-4), Claude, Gemini, Midjourney, Stable Diffusion, DALL-E 3, GitHub Copilot, and more. Browse by category to find prompts for your specific tool.",
      },
      {
        q: "How is the prompt ranking score calculated?",
        a: "Our trending score uses the formula: Score = Likes + (Views ÷ 10) + (Saves × 2). This balances community engagement with reach and long-term bookmarking value.",
      },
      {
        q: "Can I edit my prompts after publishing?",
        a: "Yes! Navigate to any of your prompts on your profile page, click the three-dot menu, and select 'Edit'. You can update the title, content, description, tags, and category at any time.",
      },
    ],
  },
  {
    category: "Account & Profile",
    icon: User,
    color: "text-blue-600",
    bg: "bg-blue-50",
    questions: [
      {
        q: "How do I customise my profile?",
        a: "Go to Settings (click your avatar → Settings). From there you can upload a profile photo, add a banner image, write a bio, add your location, and link your social accounts (Twitter/X, GitHub, Instagram, and website).",
      },
      {
        q: "What is the profile URL format?",
        a: "Your profile URL is promptkar.app/profile/[your-username]. Your username is set during registration and can be updated in Settings. It's unique to your account.",
      },
      {
        q: "How do I follow another creator?",
        a: "Visit any creator's profile page and click the 'Follow' button. They'll receive a real-time notification. You can unfollow at any time by clicking 'Following ✓' which will toggle back.",
      },
      {
        q: "How do saved prompts work?",
        a: "Click the bookmark icon on any prompt to save it. Saved prompts appear in the 'Saved' tab on your profile page, so you can access them anytime without searching.",
      },
    ],
  },
  {
    category: "Pricing & Usage",
    icon: CreditCard,
    color: "text-green-600",
    bg: "bg-green-50",
    questions: [
      {
        q: "Is PromptKar free to use?",
        a: "Yes! Browsing, saving, following creators, and publishing prompts is completely free. Our AI Enhancer tool is also free for standard usage. We may introduce premium features in the future, but core functionality will always remain free.",
      },
      {
        q: "Can I use these prompts for commercial projects?",
        a: "Generally, yes. Prompts shared on PromptKar are intended for public use. However, always respect the specific AI tool's terms of service (e.g., OpenAI, Anthropic) when using their outputs commercially.",
      },
      {
        q: "Is there a limit on how many prompts I can publish?",
        a: "Currently there is no hard limit. We ask that all prompts are original, high-quality, and not spam. Low-quality or duplicate prompts may be removed by our moderation team.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    icon: Shield,
    color: "text-purple-600",
    bg: "bg-purple-50",
    questions: [
      {
        q: "How is my data stored?",
        a: "User authentication is handled securely via Firebase Auth. Profile data and prompts are stored in MongoDB with standard encryption. We never sell your personal data to third parties.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings → Account → Delete Account. This will permanently remove your profile, prompts, and all associated data. This action cannot be undone.",
      },
      {
        q: "Who can see my saved prompts?",
        a: "Saved prompts are visible on your public profile. If you'd like them to be private, we recommend using the browser bookmark feature instead until we ship private collections.",
      },
    ],
  },
];

const ALL_QUESTIONS = FAQS.flatMap(cat =>
  cat.questions.map(q => ({ ...q, category: cat.category }))
);

const FAQPage = () => {
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>("0-0");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFAQs = useMemo(() => {
    if (!search.trim() && activeCategory === "All") return FAQS;

    return FAQS.map(cat => ({
      ...cat,
      questions: cat.questions.filter(q =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (q.q.toLowerCase().includes(search.toLowerCase()) ||
         q.a.toLowerCase().includes(search.toLowerCase()))
      ),
    })).filter(cat => cat.questions.length > 0);
  }, [search, activeCategory]);

  const totalFiltered = filteredFAQs.reduce((a, c) => a + c.questions.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      {/* Hero */}
      <div className="text-center space-y-5 py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest border border-indigo-100">
          <HelpCircle className="w-3 h-3" /> Support Center
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
          Frequently Asked <span className="text-indigo-600">Questions</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
          Everything you need to know about PromptKar, prompt engineering, and making the most of AI tools.
        </p>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all text-sm font-medium shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs font-black">✕</button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveCategory("All")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
            activeCategory === "All" ? "bg-indigo-600 text-white border-indigo-600" : "bg-card text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          All ({ALL_QUESTIONS.length})
        </button>
        {FAQS.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
              activeCategory === cat.category ? `${cat.bg} ${cat.color} border-current` : "bg-card text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            <cat.icon className="w-3 h-3" />
            {cat.category}
          </button>
        ))}
      </div>

      {/* Results count when filtering */}
      {(search || activeCategory !== "All") && (
        <p className="text-center text-sm text-slate-400 font-medium -mt-4">
          {totalFiltered} result{totalFiltered !== 1 ? "s" : ""} found
          {(search || activeCategory !== "All") && (
            <button
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
              className="ml-2 text-indigo-600 font-black hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      )}

      {/* FAQ Accordion */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-20">
          <HelpCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-900">No results found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different keyword or browse all categories.</p>
          <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-3 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
            Show all FAQs
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredFAQs.map((cat, ci) => (
            <div key={cat.category}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl ${cat.bg} flex items-center justify-center`}>
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <h2 className="font-black text-slate-900 text-base">{cat.category}</h2>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-black text-slate-300">{cat.questions.length} Q</span>
              </div>

              {/* Questions */}
              <div className="space-y-2">
                {cat.questions.map((item, qi) => {
                  const key = `${ci}-${qi}`;
                  const isOpen = openKey === key;
                  return (
                    <div
                      key={key}
                      className={`bg-card border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-indigo-200 shadow-md shadow-indigo-50" : "border-slate-100 hover:border-slate-200"}`}
                    >
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left"
                      >
                        <span className={`font-black text-sm leading-snug pr-4 ${isOpen ? "text-indigo-600" : "text-slate-900"}`}>
                          {item.q}
                        </span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${isOpen ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Still need help */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-3xl p-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-card shadow-md flex items-center justify-center mx-auto">
          <MessageCircle className="w-7 h-7 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Still have questions?</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Can't find what you're looking for? Browse our blog for guides or explore the prompts yourself.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/blog" className="flex items-center gap-2 justify-center bg-card border border-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-black hover:border-indigo-200 hover:text-indigo-600 transition-all">
            <BookOpen className="w-4 h-4" /> Browse Blog
          </Link>
          <Link href="/prompts" className="flex items-center gap-2 justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-colors">
            <Sparkles className="w-4 h-4" /> Explore Prompts <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Schema markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": ALL_QUESTIONS.map(q => ({
              "@type": "Question",
              "name": q.q,
              "acceptedAnswer": { "@type": "Answer", "text": q.a },
            })),
          }),
        }}
      />
    </div>
  );
};

export default FAQPage;
