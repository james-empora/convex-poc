import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { PortfolioLayoutShell } from "./_components/portfolio-layout-shell";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexNextjsOptions } from "@/lib/convex/client";

export const metadata: Metadata = {
  title: "Portfolio | Empora",
};

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preloadedFiles = await preloadQuery(
    api.files.listFiles,
    {},
    await createAuthenticatedConvexNextjsOptions(),
  );

  return (
    <PortfolioLayoutShell preloadedFiles={preloadedFiles}>
      {children}
    </PortfolioLayoutShell>
  );
}
