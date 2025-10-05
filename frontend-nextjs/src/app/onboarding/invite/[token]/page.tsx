import OnboardingInvite from "@/components/OnboardingInvite";

export default function TokenPage() {
  return <OnboardingInvite />;
}

export function generateStaticParams() {
  // Return empty array - dynamic routes will be handled client-side
  return [];
}