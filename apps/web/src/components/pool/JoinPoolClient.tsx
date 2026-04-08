"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface JoinPoolClientProps {
  pool: {
    id: number;
    name: string;
    status: string;
    join_mode: string;
    amount_entry: number;
    invite_code: string | null;
    tournament: {
      name: string;
      course: string | null;
      start_date: Date;
      end_date: Date;
    };
    _count: { pool_members: number };
  };
  code: string;
  isAuthenticated: boolean;
  hasPendingInvite: boolean;
  commissionerNickname: string | null;
}

export function JoinPoolClient({
  pool,
  code,
  isAuthenticated,
  hasPendingInvite,
  commissionerNickname,
}: JoinPoolClientProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");

  const joinMutation = trpc.pool.joinByCode.useMutation({
    onSuccess: (data) => {
      toast.success("You've joined the pool!");
      router.push(`/pool/${data.poolId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate({ code, username });
  };

  const poolAccepting = pool.status === "Setup" || pool.status === "Open";
  const canJoin =
    poolAccepting &&
    (pool.join_mode === "OPEN" || hasPendingInvite);

  return (
    <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
      <div className="bg-white border border-grey-100 shadow-sm w-full max-w-md p-10 rounded-lg flex flex-col items-center text-center">
        <h1 className="mb-2">{pool.name}</h1>
        <p className="text-grey-75 mb-1">{pool.tournament.name}</p>
        {pool.tournament.course && (
          <p className="text-grey-50 text-sm mb-4">{pool.tournament.course}</p>
        )}

        {commissionerNickname && (
          <span className="text-sm text-grey-75 mb-1">Commissioner: {commissionerNickname}</span>
        )}
        <div className="flex gap-4 text-sm text-grey-75 mb-6">
          <span>{pool._count.pool_members} member{pool._count.pool_members !== 1 ? "s" : ""}</span>
          {pool.amount_entry > 0 && <span>${pool.amount_entry} entry</span>}
        </div>

        {/* Not authenticated */}
        {!isAuthenticated && (
          <>
            {poolAccepting ? (
              <a
                href={`/auth/sign-in?next=/join/${code}`}
                className="w-full bg-green-700 text-white hover:bg-green-900 rounded py-3 px-4 text-center block"
              >
                Sign In to Join
              </a>
            ) : (
              <p className="text-grey-75">
                This pool is no longer accepting new members.
              </p>
            )}
          </>
        )}

        {/* Can't join */}
        {isAuthenticated && !canJoin && (
          <p className="text-grey-75">
            {!poolAccepting
              ? "This pool is no longer accepting new members."
              : "This pool is invite-only. Ask the commissioner to invite you."}
          </p>
        )}

        {/* Can join */}
        {isAuthenticated && canJoin && (
          <form onSubmit={handleJoin} className="w-full flex flex-col">
            <input
              type="text"
              placeholder="Your nickname"
              className="w-full rounded h-14 border border-grey-300 mb-4"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-green-700 text-white hover:bg-green-900 rounded py-3 px-4"
              disabled={joinMutation.isPending || !username.trim()}
            >
              {joinMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <Spinner className="w-6 h-6 mr-1" /> Joining...
                </span>
              ) : (
                "Join Pool"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
