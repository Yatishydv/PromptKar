"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Firebase Auth Action Handler
 * Firebase sends users to /__/auth/action?mode=resetPassword&oobCode=xxx
 * This page redirects them to our branded /reset-password page
 */
export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const continueUrl = searchParams.get("continueUrl");
    
    if (mode === "resetPassword" && oobCode) {
      router.replace(`/reset-password?mode=${mode}&oobCode=${oobCode}`);
    } else if (continueUrl) {
      router.replace(continueUrl);
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
