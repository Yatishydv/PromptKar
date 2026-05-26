"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Send, History, Trash2, Copy,
  Check, RotateCcw, Zap, Target, Palette,
  ChevronRight, MessageSquare, Plus, User,
  Bot, Search, X, Lock, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Content } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
  timestamp: number;
  versions?: string[];
  activeVersion?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

const AIEnhancerContent = () => {
  const { userData, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");
  const initialStyle = searchParams.get("style") || "Standard";

  // 1. Refs
  const isMounted = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");
  const [chatMode, setChatMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [bypassMessage, setBypassMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const styles = ["Standard", "Creative", "Detailed", "SEO"];

  // Auto-set input and trigger if params exist
  useEffect(() => {
    if (initialPrompt && !isMounted.current) {
      setInput(initialPrompt);
      // Wait for mount to ensure context is ready
      const timer = setTimeout(() => {
        handleEnhance(initialPrompt, initialStyle);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, initialStyle]);

  // 3. Effects
  useEffect(() => {
    setSuggestions([]);
  }, [input]);



  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("enhancer_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (err) {
        console.error("History Parse Error:", err);
      }
    }
    isMounted.current = true;
  }, []);

  // Save history only after initial mount and when it changes
  useEffect(() => {
    if (isMounted.current) {
      localStorage.setItem("enhancer_history", JSON.stringify(history));
    }
  }, [history]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const saveCurrentSession = (updatedMessages: ChatMessage[]) => {
    const sessionId = activeChatId || crypto.randomUUID();
    const sessionTitle = updatedMessages[0]?.parts[0]?.text?.slice(0, 40) || "Untitled Prompt";

    const newSession: ChatSession = {
      id: sessionId,
      title: sessionTitle,
      messages: updatedMessages,
      lastUpdated: Date.now()
    };

    setHistory(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      return [newSession, ...filtered];
    });

    if (!activeChatId) setActiveChatId(sessionId);
  };

  const handleEnhance = async (overridePrompt?: string, overrideStyle?: string, fromIndex?: number) => {
    const promptToUse = overridePrompt || input;
    const styleToUse = overrideStyle || selectedStyle;

    if (!promptToUse.trim() || isLoading) return;

    // If editing, handle versioning
    let baseMessages = messages;
    if (fromIndex !== undefined) {
      const targetMsg = messages[fromIndex];
      const oldText = targetMsg.parts[0].text;

      const updatedVersions = [...(targetMsg.versions || [oldText])];
      if (!updatedVersions.includes(promptToUse)) {
        updatedVersions.push(promptToUse);
      }

      const updatedUserMessage: ChatMessage = {
        ...targetMsg,
        parts: [{ text: promptToUse }],
        versions: updatedVersions,
        activeVersion: updatedVersions.indexOf(promptToUse)
      };

      baseMessages = messages.slice(0, fromIndex);
      const newMessages = [...baseMessages, updatedUserMessage];
      setMessages(newMessages);
      setEditIndex(null);
      setIsLoading(true);

      try {
        const geminiHistory: Content[] = baseMessages.slice(-15).map(m => ({
          role: m.role,
          parts: m.parts
        }));

        // Now calling the server API instead of direct client-side Gemini
        const res = await fetch("/api/ai/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptToUse,
            history: geminiHistory,
            style: styleToUse,
            userId: user?.uid,
            chatMode: chatMode
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.error === "QUOTA_EXCEEDED") {
            setIsAdminBypass(false);
            setShowUpgradeModal(true);
            throw new Error(data.message);
          }
          throw new Error(data.message || "Neural link failed");
        }

        // Handle Admin Bypass Flag (Server allowed the request, but warned us)
        if (data.showAdminWarning) {
          const currentHour = new Date().getHours();
          const lastShown = localStorage.getItem("last_admin_warning_hour");
          if (lastShown !== String(currentHour)) {
            setIsAdminBypass(true);
            setBypassMessage(data.warningMessage);
            setShowUpgradeModal(true);
            localStorage.setItem("last_admin_warning_hour", String(currentHour));
          }
        }

        const aiMessage: ChatMessage = {
          role: "model",
          parts: [{ text: data.text }],
          timestamp: Date.now()
        };
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        saveCurrentSession(finalMessages);
      } catch (err: any) {
        toast.error(err.message || "Version update failed");
      } finally {
        setIsLoading(false);
      }
      return; // Stop here for edit flow
    } else {
      // Quick check: If this exact prompt was just enhanced, don't hit the API again
      const cachedSession = history.find(s => s.messages[0]?.parts[0]?.text === promptToUse);
      if (cachedSession && cachedSession.messages.length > 1 && messages.length === 0) {
        setMessages(cachedSession.messages);
        setActiveChatId(cachedSession.id);
        toast.success("Retrieved from neural cache");
        return;
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: promptToUse }],
      timestamp: Date.now(),
      versions: [promptToUse],
      activeVersion: 0
    };

    const newMessages = [...baseMessages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Trim history to reduce token count
      const geminiHistory: Content[] = baseMessages.slice(-15).map(m => ({
        role: m.role,
        parts: m.parts
      }));

      // Secure API call with quota checking
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          history: geminiHistory,
          style: styleToUse,
          userId: user?.uid,
          chatMode: chatMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setIsAdminBypass(false);
          setShowUpgradeModal(true);
          throw new Error(data.message);
        }
        throw new Error(data.message || "Failed to connect to AI");
      }

      // Handle Admin Bypass Flag
      if (data.showAdminWarning) {
        const currentHour = new Date().getHours();
        const lastShown = localStorage.getItem("last_admin_warning_hour");
        if (lastShown !== String(currentHour)) {
          setIsAdminBypass(true);
          setBypassMessage(data.warningMessage);
          setShowUpgradeModal(true);
          localStorage.setItem("last_admin_warning_hour", String(currentHour));
        }
      }

      const aiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: data.text }],
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (error: any) {
      console.error("Enhance Error:", error);
      toast.error(error.message || "Failed to enhance prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
  };

  const loadChatFromHistory = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveChatId(session.id);
  };

  const handleRegenerate = async () => {
    if (messages.length < 1 || isLoading) return;

    const lastUserMsgIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserMsgIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserMsgIdx;
    const lastUserInput = messages[actualIdx].parts[0].text;

    const trimmedMessages = messages.slice(0, actualIdx + 1);
    setMessages(trimmedMessages);
    setIsLoading(true);

    try {
      const geminiHistory: Content[] = trimmedMessages.slice(-15).slice(0, -1).map(m => ({
        role: m.role,
        parts: m.parts
      }));

      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: lastUserInput,
          history: geminiHistory,
          style: selectedStyle,
          userId: user?.uid,
          chatMode: chatMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setIsAdminBypass(false);
          setShowUpgradeModal(true);
          throw new Error(data.message);
        }
        throw new Error(data.message || "Regeneration failed");
      }

      // Handle Admin Bypass Flag
      if (data.showAdminWarning) {
        const currentHour = new Date().getHours();
        const lastShown = localStorage.getItem("last_admin_warning_hour");
        if (lastShown !== String(currentHour)) {
          setIsAdminBypass(true);
          setBypassMessage(data.warningMessage);
          setShowUpgradeModal(true);
          localStorage.setItem("last_admin_warning_hour", String(currentHour));
        }
      }

      const aiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: data.text }],
        timestamp: Date.now()
      };

      const finalMessages = [...trimmedMessages, aiMessage];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchVersion = (msgIdx: number, versionIdx: number) => {
    const msg = messages[msgIdx];
    if (!msg.versions || versionIdx < 0 || versionIdx >= msg.versions.length) return;

    const newText = msg.versions[versionIdx];
    handleEnhance(newText, selectedStyle, msgIdx);
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedHistory = history.filter((s) => s.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("enhancer_history", JSON.stringify(updatedHistory));
    if (activeChatId === id) {
      startNewChat();
    }
    toast.success("Chat deleted");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("enhancer_history");
    toast.success("History cleared");
  };


  const extractPrompt = (text: string) => {
    const match = text.match(/### 🚀 Enhanced Prompt\n([\s\S]*?)\n---/);
    const extracted = match ? match[1].trim() : text;
    return extracted.replace(/\*\*|\*|#/g, '').trim();
  };

  const copyToClipboard = (text: string, onlyPrompt = false) => {
    const content = onlyPrompt ? extractPrompt(text) : text;
    navigator.clipboard.writeText(content);
    toast.success(onlyPrompt ? "Engineered prompt copied!" : "Full analysis copied!");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header section to match website UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            AI Prompt <span className="text-indigo-600">Enhancer</span>
            <div className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Beta</div>
          </h1>
          <p className="text-slate-400 font-bold text-[12px] mt-0.5">Upgrade basic prompts into professional engineering directives.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={startNewChat}
            variant="outline"
            className="rounded-xl border-slate-100 font-bold text-[12px] h-9 px-4 flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Session
          </Button>
          <Button
            className="bg-indigo-600 text-white rounded-xl font-bold text-[12px] h-9 px-5 shadow-indigo border-none"
            onClick={() => router.push("/prompts")}
          >
            Browse
          </Button>
        </div>
      </div>

      {/* Intelligence Control Panel */}
      <div className="bg-card border border-slate-100 rounded-[1.5rem] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${chatMode ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}>
            {chatMode ? <MessageSquare className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">
              {chatMode ? "Neural Chat Assistant" : "Prompt Engineering Lab"}
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${chatMode ? "bg-orange-100 text-orange-600" : "bg-indigo-100 text-indigo-600"}`}>
                {chatMode ? "Conversational" : "Structural"}
              </span>
            </h4>
            <p className="text-[11px] font-bold text-slate-400">
              {chatMode ? "Free-flowing conversation and general assistance." : "Crafting professional prompts and structured inputs."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setChatMode(false)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!chatMode ? "bg-card text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Professional
          </button>
          <button
            onClick={() => setChatMode(true)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatMode ? "bg-card text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Main Container - Card Style to match website UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-240px)] lg:min-h-[650px] relative">
        {/* Internal Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 bg-card border border-slate-100 rounded-[2rem] flex-col overflow-hidden shadow-sm shadow-slate-100/50">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-black text-slate-900 uppercase tracking-wider">History</span>
            </div>
            <button onClick={clearHistory} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-slate-200" />
                </div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No previous labs</p>
              </div>
            ) : (
              history.map((session) => (
                <div key={session.id} className="relative group/item">
                  <button
                    onClick={() => loadChatFromHistory(session)}
                    className={`w-full p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden ${activeChatId === session.id
                        ? "bg-indigo-50/50 border-indigo-100 text-indigo-600"
                        : "bg-card border-transparent hover:bg-slate-50 text-slate-500"
                      }`}
                  >
                    <p className="text-[12.5px] font-bold line-clamp-1 pr-6">{session.title}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50">
                      {new Date(session.lastUpdated).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={(e) => deleteFromHistory(e, session.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-12 lg:col-span-9 flex flex-col bg-card border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-100/50 relative h-[600px] lg:h-full">
          {/* Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 py-10">
                <div className="w-16 h-16 rounded-[1.75rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Engineering Lab</h3>
                  <p className="text-[13.5px] font-bold text-slate-400 leading-relaxed">
                    Paste your basic prompt below and our AI will reconstruct it with professional directives, structure, and constraints.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    "Write a blog post intro",
                    "Design a modern app logo",
                    "Marketing email for shoes",
                    "Midjourney cyberpunk city"
                  ].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setInput(tip)}
                      className="p-3 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 hover:bg-slate-50 hover:border-indigo-100 hover:text-indigo-600 transition-all text-left"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-3 group/msg relative">
                    <div className={`p-6 rounded-[2.5rem] border ${msg.role === "user"
                        ? "bg-slate-900 text-white border-slate-800 rounded-tr-none"
                        : "bg-slate-50 text-slate-900 border-slate-100 rounded-tl-none"
                      }`}>
                      {editIndex === idx ? (
                        <div className="space-y-4 min-w-[300px] animate-in fade-in zoom-in-95 duration-200">
                          <textarea
                            autoFocus
                            value={editInput}
                            onChange={(e) => setEditInput(e.target.value)}
                            className="w-full bg-card/5 border border-white/10 rounded-2xl p-5 text-white text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[120px] shadow-inner"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditIndex(null)}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-card/5 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEnhance(editInput, selectedStyle, idx)}
                              className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
                            >
                              Save & Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[14px] font-medium leading-relaxed prose prose-slate max-w-none prose-headings:text-indigo-600 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-sm prose-hr:border-slate-200 prose-strong:text-indigo-600 prose-strong:font-black">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.parts[0].text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && msg.versions && msg.versions.length > 1 && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-900/40 border border-white/10 rounded-xl text-[9px] font-black text-white/50 uppercase tracking-widest backdrop-blur-md self-start">
                        <button
                          onClick={() => switchVersion(idx, (msg.activeVersion || 0) - 1)}
                          disabled={(msg.activeVersion || 0) === 0 || isLoading}
                          className="hover:text-indigo-400 disabled:opacity-20 transition-colors p-1"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                        <span className="text-white/80">{(msg.activeVersion || 0) + 1} <span className="opacity-40 mx-0.5">/</span> {msg.versions.length}</span>
                        <button
                          onClick={() => switchVersion(idx, (msg.activeVersion || 0) + 1)}
                          disabled={(msg.activeVersion || 0) === msg.versions.length - 1 || isLoading}
                          className="hover:text-indigo-400 disabled:opacity-20 transition-colors p-1"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {msg.role === "user" && editIndex !== idx && (
                      <button
                        onClick={() => {
                          setEditIndex(idx);
                          setEditInput(msg.parts[0].text);
                        }}
                        className="absolute -left-12 top-2 w-8 h-8 flex items-center justify-center rounded-full bg-card/5 text-white/20 hover:text-indigo-400 hover:bg-card/10 opacity-0 group-hover/msg:opacity-100 transition-all border border-white/5"
                        title="Edit prompt"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {msg.role === "model" && (
                      <div className="flex items-center gap-4 px-2">
                        <button
                          onClick={() => copyToClipboard(msg.parts[0].text, true)}
                          className="h-8 px-4 rounded-xl bg-indigo-50 text-[10px] font-black text-indigo-600 flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" /> Copy Prompt
                        </button>
                        <button
                          onClick={() => copyToClipboard(msg.parts[0].text)}
                          className="h-8 px-4 rounded-xl bg-card border border-slate-100 text-[10px] font-black text-slate-400 flex items-center gap-2 hover:border-slate-200 hover:text-slate-600 transition-all shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" /> Analysis
                        </button>
                        <button
                          onClick={handleRegenerate}
                          disabled={isLoading}
                          className="text-[10px] font-black text-slate-300 flex items-center gap-1.5 hover:text-indigo-600 disabled:opacity-50 transition-colors ml-auto"
                        >
                          <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                      {userData?.avatar ? (
                        <img src={userData?.avatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                          {userData?.name?.charAt(0) || user?.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-[1.75rem] rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Engineering...</span>
                </div>
              </div>
            )}
          </div>

          {/* Sleek Pill-Style Input - ChatGPT/Gemini Aesthetic */}
          <div className="p-6 bg-card relative z-10 space-y-4">
            {/* Style Selector */}
            <div className="max-w-4xl mx-auto flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Mode:</span>
              {styles.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap border ${selectedStyle === s
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-600/5 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
              <div className="relative bg-card border border-slate-100 rounded-[2.5rem] p-1.5 flex items-center gap-3 shadow-xl shadow-slate-200/40 focus-within:border-indigo-600/20 transition-all duration-300">
                <div className="flex-1 min-h-[40px] max-h-[200px] overflow-y-auto no-scrollbar py-2 px-5">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEnhance();
                      }
                    }}
                    placeholder="Message AI Lab..."
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 font-bold text-[14px] resize-none py-1 h-full block"
                    style={{ height: 'auto', minHeight: '24px' }}
                  />
                </div>
                <button
                  onClick={() => handleEnhance()}
                  disabled={isLoading || !input.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${isLoading || !input.trim()
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-black active:scale-95 shadow-lg"
                    }`}
                >
                  <Send className={`w-3.5 h-3.5 ${isLoading ? "animate-pulse" : ""}`} />
                </button>
              </div>
            </div>
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
              AI Lab can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Footer info to match website aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Zap, label: "Neural Precision", desc: "Advanced logic mapping for every prompt" },
          { icon: Target, label: "Context Aware", desc: "Maintains intent across complex instructions" },
          { icon: Palette, label: "Style Control", desc: "Professional tone and structure enforcement" }
        ].map((feat, i) => (
          <div key={i} className="bg-card border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm shadow-slate-100/50">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600">
              <feat.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[13px] font-black text-slate-900">{feat.label}</h4>
              <p className="text-[11px] font-bold text-slate-400 leading-none mt-1">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Big Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row h-full">
                {/* Visual Side */}
                <div className="md:w-5/12 bg-indigo-600 p-10 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-card/20 backdrop-blur-md flex items-center justify-center text-white mb-6">
                      <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight">Unlock Neural Power</h2>
                  </div>
                  <div className="relative z-10">
                    <p className="text-indigo-100 font-bold text-sm">Join the elite rank of prompt engineers.</p>
                  </div>
                </div>

                {/* Content Side */}
                <div className="md:w-7/12 p-10 space-y-8">
                  <div className="space-y-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdminBypass ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}>
                      {isAdminBypass ? "Admin Override Detected" : "Daily Limit Reached"}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">
                      {isAdminBypass ? "Oh, Look Who It Is." : "You're out of Neural Bytes for this hour."}
                    </h3>
                    <p className="text-slate-500 font-medium text-[14px] leading-relaxed">
                      {isAdminBypass ? bypassMessage : "To prevent neural overload, standard accounts are limited to 5 enhances per hour. Upgrade to Pro for unlimited access."}
                    </p>
                  </div>

                  {!isAdminBypass && (
                    <div className="space-y-4">
                      {[
                        "Unlimited AI Prompt Enhancements",
                        "Priority Access to Gemini 3 nodes",
                        "No Hourly or Daily Limits",
                        "Advanced Style Customization"
                      ].map((perk, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <span className="text-[13px] font-bold text-slate-700">{perk}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    {isAdminBypass ? (
                      <Button
                        onClick={async () => {
                          setShowUpgradeModal(false);
                          // Force a manual bypass call by setting a temporary flag or just letting them re-click
                          toast.success("Bypass authorized. Proceeding, your highness.");
                        }}
                        className="w-full bg-orange-600 text-white h-14 rounded-2xl font-black text-base shadow-lg shadow-orange-100 group"
                      >
                        Ignore & Proceed 🙄
                      </Button>
                    ) : (
                      <Button
                        onClick={() => toast.success("Pro Subscriptions are coming soon! Stay tuned.", { icon: "🚀" })}
                        className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-black text-base shadow-indigo group"
                      >
                        Upgrade to Pro <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {isAdminBypass ? "Rank has its privileges, I suppose." : "Subscriptions coming soon to your region"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AIEnhancerPage = () => {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black text-slate-400 animate-pulse">CALIBRATING NEURAL LINK...</div>}>
      <AIEnhancerContent />
    </Suspense>
  );
};

export default AIEnhancerPage;
