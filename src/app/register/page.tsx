"use client";

import React, { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const { signInWithGoogle, registerWithEmail, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=newuser&backgroundColor=b6e3f4,c0aede,d1d4f9`);

  const avatarCollections = {
    humans: Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}&backgroundColor=b6e3f4,c0aede,d1d4f9`),
    anime: Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${i + 200}&backgroundColor=ffdfbf,ffd5dc,d1d4f9`),
    pixel: Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${i + 300}&backgroundColor=b6e3f4,c0aede,d1d4f9`),
    robots: Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=${i + 700}&backgroundColor=b6e3f4,c0aede,d1d4f9`)
  };
  const [activeAvatarTab, setActiveAvatarTab] = useState<keyof typeof avatarCollections>("humans");

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return toast.error("Please choose a username");
    setLoading(true);
    try {
      await registerWithEmail(email, password, name, username, selectedAvatar);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 mb-6">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Join PromptKar and start sharing your brilliance
          </p>
        </div>

        <Card className="border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleRegister}>
              {/* Avatar Selection */}
              <div className="flex flex-col items-center gap-4 pb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50">
                    <img src={selectedAvatar} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-all border-4 border-white"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Your Identity</p>
              </div>

              {showAvatarPicker && (
                <div className="bg-slate-50 p-4 rounded-3xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {Object.keys(avatarCollections).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveAvatarTab(cat as any)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeAvatarTab === cat ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-100"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {avatarCollections[activeAvatarTab].map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(url);
                          setShowAvatarPicker(false);
                        }}
                        className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === url ? "border-indigo-600 ring-2 ring-indigo-50" : "border-transparent bg-white hover:border-slate-200"
                          }`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Identity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600/20 transition-all text-sm font-medium"
                    placeholder="Full Name"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-300 font-bold text-sm group-focus-within:text-indigo-600 transition-colors px-1">@</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600/20 transition-all text-sm font-medium"
                    placeholder="username"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600/20 transition-all text-sm font-medium"
                    placeholder="Email address"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600/20 transition-all text-sm font-medium"
                    placeholder="Create Password"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-md"
                />
                <label htmlFor="terms" className="ml-2 block text-[13px] text-slate-500 font-medium">
                  I agree to the <a href="#" className="font-bold text-indigo-600">Terms of Service</a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 h-auto font-black text-sm shadow-indigo group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-bold">
                <span className="px-3 bg-white text-slate-400">Or sign up with</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center py-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-indigo-100 transition-all gap-2 text-sm font-bold text-slate-600"
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-4 h-4" alt="Google" />
                Sign up with Google
              </button>
            </div>
          </CardContent>
          <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                Sign in instead
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
