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
  const [menuOpen, setMenuOpen] = useState(false);
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
      <div className="container mx-auto flex flex-wrap p-5 justify-between items-center">
        <Link
          href="/"
          className="flex title-font font-medium items-center"
        >
          <span className="pr-2 text-2xl">&#9971;</span>
          <h3>PoolPicks</h3>
        </Link>

        {/* Desktop nav */}
        {userEmail && (
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              href="/pool/create"
              className="rounded bg-green-300 hover:bg-yellow hover:text-black px-4 py-2"
            >
              Create a Pool
            </Link>
            {isAdmin && (
              <Link
                href="/system-admin"
                className="rounded bg-green-300 hover:bg-yellow hover:text-black px-4 py-2"
              >
                Admin
              </Link>
            )}
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
          </nav>
        )}

        {/* Mobile hamburger button */}
        {userEmail && (
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-black transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-black transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-black transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {userEmail && menuOpen && (
        <nav className="md:hidden border-t border-green-300 px-5 pb-4 flex flex-col space-y-2">
          <Link
            href="/pool/create"
            className="rounded bg-green-300 hover:bg-yellow hover:text-black px-4 py-2 text-center"
            onClick={() => setMenuOpen(false)}
          >
            Create a Pool
          </Link>
          {isAdmin && (
            <Link
              href="/system-admin"
              className="rounded bg-green-300 hover:bg-yellow hover:text-black px-4 py-2 text-center"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
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
        </nav>
      )}
    </header>
  );
}
