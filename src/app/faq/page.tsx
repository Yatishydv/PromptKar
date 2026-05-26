"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import {
  Plus, Minus, Search, HelpCircle, MessageCircle,
  Sparkles, BookOpen, Zap, Shield, User, CreditCard,
  ChevronRight, Bell, PlusCircle
} from "lucide-react";

// Helper to resolve icon by string name
const getIconByName = (name: string) => {
  switch (name) {
    case 'sparkles': return Sparkles;
    case 'zap': return Zap;
    case 'shield': return Shield;
    case 'user': return User;
    case 'creditcard': return CreditCard;
    case 'bell': return Bell;
    default: return HelpCircle;
  }
};

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Getting Started": return { color: "text-indigo-600", bg: "bg-indigo-50" };
    case "Prompts & AI Tools": return { color: "text-amber-600", bg: "bg-amber-50" };
    case "Account & Profile": return { color: "text-blue-600", bg: "bg-blue-50" };
    case "Pricing & Usage": return { color: "text-green-600", bg: "bg-green-50" };
    case "Privacy & Security": return { color: "text-purple-600", bg: "bg-purple-50" };
    case "Administration": return { color: "text-red-600", bg: "bg-red-50" };
    default: return { color: "text-slate-600", bg: "bg-slate-50" };
  }
};

const FAQPage = () => {
  const { user } = useAuth();
  const isHeadAdmin = user?.email === "yatishydv@gmail.com";

  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>("0-0");
  const [activeCategory, setActiveCategory] = useState("All");

  // Admin Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "Getting Started", iconName: "sparkles" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFaq, setEditFaq] = useState({ question: "", answer: "", category: "Getting Started", iconName: "sparkles" });

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      if (res.ok) setFaqs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHeadAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-requester-email": user.email
        },
        body: JSON.stringify(newFaq)
      });
      if (res.ok) {
        toast.success("FAQ Added Successfully!");
        setNewFaq({ question: "", answer: "", category: "Getting Started", iconName: "sparkles" });
        setShowAddForm(false);
        fetchFaqs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add FAQ");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFaq = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!isHeadAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-requester-email": user.email
        },
        body: JSON.stringify(editFaq)
      });
      if (res.ok) {
        toast.success("FAQ Updated Successfully!");
        setEditingId(null);
        fetchFaqs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update FAQ");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!isHeadAdmin || !confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/faqs/${id}`, {
        method: "DELETE",
        headers: { 
          "x-requester-email": user.email
        }
      });
      if (res.ok) {
        toast.success("FAQ Deleted Successfully!");
        fetchFaqs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete FAQ");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  // Group FAQS dynamically
  const groupedFaqs = useMemo(() => {
    const groups: Record<string, any> = {};
    faqs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = {
          category: faq.category,
          icon: getIconByName(faq.iconName),
          ...getCategoryStyles(faq.category),
          questions: []
        };
      }
      groups[faq.category].questions.push({ q: faq.question, a: faq.answer, _id: faq._id, iconName: faq.iconName });
    });
    return Object.values(groups);
  }, [faqs]);

  const filteredFAQs = useMemo(() => {
    if (!search.trim() && activeCategory === "All") return groupedFaqs;

    return groupedFaqs.map(cat => ({
      ...cat,
      questions: cat.questions.filter((q: any) =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (q.q.toLowerCase().includes(search.toLowerCase()) ||
         q.a.toLowerCase().includes(search.toLowerCase()))
      ),
    })).filter(cat => cat.questions.length > 0);
  }, [search, activeCategory, groupedFaqs]);

  const totalFiltered = filteredFAQs.reduce((a, c) => a + c.questions.length, 0);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-24 text-center text-slate-400 font-medium">Loading FAQs...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 px-4 sm:px-6">
      {/* Hero */}
      <div className="text-center space-y-5 py-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest border border-indigo-100">
          <HelpCircle className="w-3 h-3" /> Support Center
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
          Frequently Asked <span className="text-indigo-600">Questions</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
          Everything you need to know about PromptKar, prompt engineering, and making the most of AI tools.
        </p>

        {isHeadAdmin && (
          <div className="absolute right-0 top-0 mt-8">
            <button 
              onClick={() => {
                setEditingId(null);
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              {showAddForm ? "Cancel" : "Add FAQ"}
            </button>
          </div>
        )}

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

      {/* Admin Add FAQ Form */}
      {isHeadAdmin && showAddForm && (
        <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-8 shadow-xl shadow-indigo-100/50 mb-10 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Head Admin Options</h3>
              <p className="text-xs font-medium text-slate-400">Add a new dynamic FAQ directly to the database</p>
            </div>
          </div>
          
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                <select 
                  value={newFaq.category} 
                  onChange={(e) => setNewFaq({...newFaq, category: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Getting Started">Getting Started</option>
                  <option value="Prompts & AI Tools">Prompts & AI Tools</option>
                  <option value="Account & Profile">Account & Profile</option>
                  <option value="Pricing & Usage">Pricing & Usage</option>
                  <option value="Privacy & Security">Privacy & Security</option>
                  <option value="Administration">Administration</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Icon Name</label>
                <select 
                  value={newFaq.iconName} 
                  onChange={(e) => setNewFaq({...newFaq, iconName: e.target.value})}
                  className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="sparkles">Sparkles</option>
                  <option value="zap">Lightning (Zap)</option>
                  <option value="user">User</option>
                  <option value="shield">Shield</option>
                  <option value="bell">Bell</option>
                  <option value="creditcard">Credit Card</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question</label>
              <input 
                required
                type="text" 
                value={newFaq.question}
                onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                placeholder="e.g. How does the AI Enhancer work?"
                className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Answer</label>
              <textarea 
                required
                value={newFaq.answer}
                onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                placeholder="Provide a detailed, accurate response..."
                rows={3}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              {isSubmitting ? 'Saving to Database...' : 'Publish New FAQ'}
            </button>
          </form>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveCategory("All")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
            activeCategory === "All" ? "bg-indigo-600 text-white border-indigo-600" : "bg-card text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          All ({faqs.length})
        </button>
        {groupedFaqs.map(cat => (
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
                {cat.questions.map((item: any, qi: number) => {
                  const key = `${ci}-${qi}`;
                  const isOpen = openKey === key;
                  
                  if (editingId === item._id) {
                    return (
                      <div key={key} className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-md shadow-indigo-50">
                        <form onSubmit={(e) => handleUpdateFaq(e, item._id)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                                <select 
                                  value={editFaq.category} 
                                  onChange={(e) => setEditFaq({...editFaq, category: e.target.value})}
                                  className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  <option value="Getting Started">Getting Started</option>
                                  <option value="Prompts & AI Tools">Prompts & AI Tools</option>
                                  <option value="Account & Profile">Account & Profile</option>
                                  <option value="Pricing & Usage">Pricing & Usage</option>
                                  <option value="Privacy & Security">Privacy & Security</option>
                                  <option value="Administration">Administration</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Icon Name</label>
                                <select 
                                  value={editFaq.iconName} 
                                  onChange={(e) => setEditFaq({...editFaq, iconName: e.target.value})}
                                  className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  <option value="sparkles">Sparkles</option>
                                  <option value="zap">Lightning (Zap)</option>
                                  <option value="user">User</option>
                                  <option value="shield">Shield</option>
                                  <option value="bell">Bell</option>
                                  <option value="creditcard">Credit Card</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question</label>
                              <input 
                                required
                                type="text" 
                                value={editFaq.question}
                                onChange={(e) => setEditFaq({...editFaq, question: e.target.value})}
                                className="w-full h-11 bg-slate-50 border-slate-100 text-sm font-medium rounded-xl px-4 focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Answer</label>
                              <textarea 
                                required
                                value={editFaq.answer}
                                onChange={(e) => setEditFaq({...editFaq, answer: e.target.value})}
                                rows={3}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button 
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                Cancel
                                </button>
                            </div>
                        </form>
                      </div>
                    )
                  }

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
                          {isHeadAdmin && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={() => {
                                        setEditFaq({ question: item.q, answer: item.a, category: cat.category, iconName: item.iconName || 'sparkles' });
                                        setEditingId(item._id);
                                        setShowAddForm(false);
                                    }}
                                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteFaq(item._id)}
                                    className="text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                                >
                                    Delete
                                </button>
                            </div>
                          )}
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
            "mainEntity": faqs.map(q => ({
              "@type": "Question",
              "name": q.question,
              "acceptedAnswer": { "@type": "Answer", "text": q.answer },
            })),
          }),
        }}
      />
    </div>
  );
};

export default FAQPage;
