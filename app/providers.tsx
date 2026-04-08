"use client";

import { Provider as JotaiProvider } from "jotai";
import { useSearchParams } from "next/navigation";
import { ConvexAuthProvider } from "@/components/auth/convex-auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const clean = searchParams.has("clean");

  return (
    <ConvexAuthProvider>
      <JotaiProvider>{children}</JotaiProvider>
      {clean && (
        <style>{`[data-nextjs-toast], nextjs-portal { display: none !important; }`}</style>
      )}
    </ConvexAuthProvider>
  );
}
