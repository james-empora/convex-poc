import type { Metadata } from "next";
import { Red_Hat_Text, Red_Hat_Display, Red_Hat_Mono } from "next/font/google";
import { Providers } from "./providers";
import { UserProvider } from "@/components/auth/user-provider";
import { getUser } from "@/lib/auth/get-user";
import { LiquidGlassFilter } from "@/components/ui/liquid-glass-filter";
import "./globals.css";

const redHatText = Red_Hat_Text({
  variable: "--font-red-hat-text",
  subsets: ["latin"],
  display: "swap",
});

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
  display: "swap",
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-red-hat-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Empora",
  description: "Empora Title — Real estate title and escrow platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html
      lang="en"
      className={`${redHatText.variable} ${redHatDisplay.variable} ${redHatMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LiquidGlassFilter />
        <Providers>
          <UserProvider
            userName={user?.displayName ?? user?.email ?? null}
            userPermissions={user?.permissions ?? []}
            userType={user?.userType ?? null}
            userEntityType={user?.entityType ?? null}
            userEntityId={user?.entityId ?? null}
          >
            {children}
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
