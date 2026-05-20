"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for oobCode (from Firebase reset email link)
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  
  // State
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [codeEmail, setCodeEmail] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // If oobCode is present, verify it
  useEffect(() => {
    if (oobCode && mode === "resetPassword") {
      setVerifying(true);
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setCodeEmail(email);
          setVerifying(false);
        })
        .catch((err) => {
          console.error("Invalid reset code:", err);
          setCodeError("This reset link has expired or is invalid. Please request a new one.");
          setVerifying(false);
        });
    }
  }, [oobCode, mode]);

  // Handle sending reset email
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  // Handle confirming new password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPass) { toast.error("Passwords don't match."); return; }
    
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      console.error("Password reset failed:", err);
      if (err.code === "auth/expired-action-code") {
        toast.error("This reset link has expired. Please request a new one.");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else {
        toast.error(err.message || "Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── RESET SUCCESS VIEW ──
  if (resetSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-200 mx-auto">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Password Updated!</h2>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
          </div>
          <Link href="/login">
            <Button className="bg-indigo-600 text-white rounded-xl py-3 px-8 h-auto font-black text-sm shadow-indigo group border-none">
              Sign In Now
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── CODE ERROR VIEW ──
  if (codeError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-3xl mx-auto">
            <AlertCircle className="text-red-500 w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Link Expired</h2>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">{codeError}</p>
          </div>
          <Link href="/reset-password">
            <Button className="bg-indigo-600 text-white rounded-xl py-3 px-8 h-auto font-black text-sm shadow-indigo group border-none">
              Request New Link
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── VERIFYING CODE VIEW ──
  if (verifying) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Verifying Reset Link...</p>
        </div>
      </div>
    );
  }

  // ── SET NEW PASSWORD VIEW (arrived from email link) ──
  if (oobCode && codeEmail) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-2xl" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Create New Password</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Setting a new password for <span className="font-black text-indigo-600">{codeEmail}</span>
            </p>
          </div>

          <Card className="border-slate-100 shadow-soft overflow-hidden">
            <CardContent className="p-8">
              <form className="space-y-5" onSubmit={handleConfirmReset}>
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-card focus:border-indigo-600/20 transition-all text-sm font-medium"
                      placeholder="New password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-card focus:border-indigo-600/20 transition-all text-sm font-medium"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            newPassword.length >= level * 3
                              ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-orange-400" : level <= 3 ? "bg-yellow-400" : "bg-emerald-500"
                              : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      {newPassword.length < 6 ? "Too short" : newPassword.length < 8 ? "Fair" : newPassword.length < 12 ? "Good" : "Strong"}
                    </p>
                  </div>
                )}

                {newPassword && confirmPass && newPassword !== confirmPass && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords don&apos;t match
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPass}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 h-auto font-black text-sm shadow-indigo group disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── EMAIL SENT SUCCESS VIEW ──
  if (sent) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-200 mx-auto">
                <Mail className="text-white w-10 h-10" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Check Your Email</h2>
              <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                We&apos;ve sent a password reset link to <span className="font-black text-indigo-600">{email}</span>
              </p>
            </div>
          </div>

          <Card className="border-slate-100 shadow-soft overflow-hidden">
            <CardContent className="p-8 space-y-5">
              <div className="space-y-3">
                {[
                  { step: "1", text: "Open your email inbox", sub: "Check the email from PromptKar" },
                  { step: "2", text: "Click the reset link", sub: "You'll be redirected back here" },
                  { step: "3", text: "Set your new password", sub: "Choose a strong, secure password" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-black text-indigo-600">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-900">{item.text}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[11px] font-bold text-amber-700">
                  ⚠️ Can&apos;t find it? Check your <span className="font-black">spam/junk folder</span>. The email comes from Firebase and may be filtered automatically.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full bg-slate-50 text-slate-600 rounded-xl py-2.5 h-auto font-black text-[12px] border border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                >
                  Try a Different Email
                </Button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try { await resetPassword(email); toast.success("Reset email re-sent!"); } catch {} finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="text-[12px] font-black text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend Email"}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/login" className="text-[13px] font-bold text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT: ENTER EMAIL VIEW ──
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-2xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
              <Sparkles className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-xs mx-auto">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <Card className="border-slate-100 shadow-soft overflow-hidden">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSendReset}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:bg-card focus:border-indigo-600/20 transition-all text-sm font-medium"
                  placeholder="Enter your email address"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 h-auto font-black text-sm shadow-indigo group disabled:opacity-50 disabled:cursor-not-allowed border-none"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
                {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </CardContent>
          <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium">
              Remember your password?{" "}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-[13px] font-bold text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
