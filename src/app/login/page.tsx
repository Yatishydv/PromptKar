"use client";

import React, { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const { signInWithGoogle, loginWithEmail, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
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
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div className="space-y-4">
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
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-md"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-[13px] text-slate-500 font-medium">
                    Remember me
                  </label>
                </div>

                <div className="text-[13px]">
                  <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 h-auto font-black text-sm shadow-indigo group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
                {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-bold">
                <span className="px-3 bg-white text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center py-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-indigo-100 transition-all gap-2 text-sm font-bold text-slate-600"
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-4 h-4" alt="Google" />
                Continue with Google
              </button>
            </div>
          </CardContent>
          <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-500">
                Create one now
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
