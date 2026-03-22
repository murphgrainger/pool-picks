import type { Metadata } from "next";
import { getAuthUser } from "@/lib/supabase/auth";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Header } from "@/components/layout/Header";
import { DevBanner } from "@/components/layout/DevBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoolPicks",
  description: "Golf pool wagering app",
  icons: { icon: "/favicon.png" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;
  let isAdmin = false;
  try {
    const auth = await getAuthUser();
    email = auth.email;
    isAdmin = auth.isAdmin;
  } catch {
    // Auth unavailable during static generation (e.g. /_not-found at build time)
  }

  return (
    <html lang="en">
      <body className="bg-black flex flex-col">
        <TRPCProvider>
          <DevBanner />
          <Header userEmail={email} isAdmin={isAdmin} />
          <div className="component-root">{children}</div>
          <footer className="p-10 bg-green-500 mt-10"></footer>
        </TRPCProvider>
      </body>
    </html>
  );
}
