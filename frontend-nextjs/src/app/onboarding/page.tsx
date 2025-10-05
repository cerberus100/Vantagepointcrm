"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Get token from URL parameters
    const token = searchParams.get('token');
    if (token) {
      // Redirect to the actual onboarding page
      router.push(`/onboarding/invite/${token}`);
    } else {
      // No token, redirect to login
      router.push('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </div>
  );
}
