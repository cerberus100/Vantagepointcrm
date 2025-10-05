"use client";

import dynamic from 'next/dynamic';

const OnboardingInvite = dynamic(() => import('@/components/OnboardingInvite'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  ),
});

export default function OnboardingPage() {
  return <OnboardingInvite />;
}
