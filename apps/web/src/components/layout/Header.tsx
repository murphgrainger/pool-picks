"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

interface HeaderProps {
  userEmail: string | null;
  isAdmin: boolean;
}

export function Header({ userEmail, isAdmin }: HeaderProps) {
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  };

  return (
    <header className="body-font bg-green-500">
      <div className="container mx-auto flex flex-wrap p-5 md:flex-row justify-between">
        <Link
          href="/"
          className="flex title-font font-medium items-center md:mb-0"
        >
          <span className="pr-2 text-2xl">&#9971;</span>
          <h3>PoolPicks</h3>
        </Link>
        <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
          {isAdmin && (
            <Link
              href="/system-admin"
              className="rounded bg-green-300 hover:bg-yellow hover:text-black mr-2 ml-2 px-4 py-2"
            >
              Admin
            </Link>
          )}
          {userEmail && (
            <div className="flex items-center space-x-5">
              <button
                className="rounded bg-green-300 hover:bg-yellow px-4 py-2"
                onClick={handleSignOut}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-6 h-6 mr-1" />
                  </span>
                ) : (
                  <span>Logout</span>
                )}
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
