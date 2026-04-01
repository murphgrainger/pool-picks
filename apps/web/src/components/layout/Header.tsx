"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/Spinner";

interface HeaderProps {
  userEmail: string | null;
  isAdmin: boolean;
}

function NavButton({
  label,
  loading,
  onClick,
  className,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} className={className}>
      <span className="grid">
        <span className={`col-start-1 row-start-1 flex items-center justify-center ${loading ? "invisible" : ""}`}>
          {label}
        </span>
        {loading && (
          <span className="col-start-1 row-start-1 flex items-center justify-center">
            <Spinner className="w-5 h-5" />
          </span>
        )}
      </span>
    </button>
  );
}

export function Header({ userEmail, isAdmin }: HeaderProps) {
  const [isLoading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await fetch("/api/auth/sign-out", { method: "POST" });
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/auth/sign-in");
    router.refresh();
  };

  const handleNavigate = (href: string) => {
    setNavigatingTo(href);
    setMenuOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const isNavLoading = (href: string) => isPending && navigatingTo === href;

  return (
    <header className="body-font bg-green-700 text-white">
      <div className="container mx-auto flex flex-wrap p-5 justify-between items-center">
        <button
          onClick={() => handleNavigate("/")}
          className="flex title-font font-medium items-center text-white"
        >
          <span className="pr-2 text-2xl">&#9971;</span>
          <h3 className="text-white">PoolPicks</h3>
        </button>

        {/* Desktop nav */}
        {userEmail && (
          <nav className="hidden md:flex items-center space-x-2">
            <NavButton
              label="Create a Pool"
              loading={isNavLoading("/pool/create")}
              onClick={() => handleNavigate("/pool/create")}
              className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2"
            />
            {isAdmin && (
              <NavButton
                label="Admin"
                loading={isNavLoading("/system-admin")}
                onClick={() => handleNavigate("/system-admin")}
                className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2"
              />
            )}
            <NavButton
              label="Logout"
              loading={isLoading}
              onClick={handleSignOut}
              className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2"
            />
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
              className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {userEmail && menuOpen && (
        <nav className="md:hidden border-t border-green-900 px-5 pb-4 flex flex-col space-y-2">
          <NavButton
            label="Create a Pool"
            loading={isNavLoading("/pool/create")}
            onClick={() => handleNavigate("/pool/create")}
            className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2 text-center"
          />
          {isAdmin && (
            <NavButton
              label="Admin"
              loading={isNavLoading("/system-admin")}
              onClick={() => handleNavigate("/system-admin")}
              className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2 text-center"
            />
          )}
          <NavButton
            label="Logout"
            loading={isLoading}
            onClick={handleSignOut}
            className="rounded bg-green-900 hover:bg-gold hover:text-black text-white px-4 py-2"
          />
        </nav>
      )}
    </header>
  );
}
