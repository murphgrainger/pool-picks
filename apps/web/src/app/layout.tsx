import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@pool-picks/db";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Header } from "@/components/layout/Header";
import { DevBanner } from "@/components/layout/DevBanner";
import "./globals.css";

export const dynamic = "force-dynamic";

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
  const supabase = createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  let userEmail: string | null = null;
  let isAdmin = false;

  if (supabaseUser?.email) {
    userEmail = supabaseUser.email;
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { is_admin: true },
    });
    isAdmin = dbUser?.is_admin ?? false;
  }

  return (
    <html lang="en">
      <body className="bg-black flex flex-col">
        <TRPCProvider>
          <DevBanner />
          <Header userEmail={userEmail} isAdmin={isAdmin} />
          <div className="component-root">{children}</div>
          <footer className="p-10 bg-green-500 mt-10"></footer>
        </TRPCProvider>
      </body>
    </html>
  );
}
