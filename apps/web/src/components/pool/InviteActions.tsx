"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface Invite {
  id: number;
  nickname: string;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
  };
}

interface PoolMembership {
  id: number;
  role: string;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
  };
}

interface InviteActionsProps {
  initialInvites: Invite[];
  poolMembers: PoolMembership[];
  userEmail: string;
}

const STATUS_GROUP_ORDER = ["Active", "Locked", "Open", "Setup"] as const;

const STATUS_LABELS: Record<string, string> = {
  Active: "Active",
  Locked: "Locked",
  Open: "Open",
  Setup: "Setup",
  Complete: "Completed",
};

function groupPoolsByStatus(pools: PoolMembership[]) {
  const groups: Record<string, PoolMembership[]> = {};
  for (const member of pools) {
    const status = member.pool.status;
    if (!groups[status]) groups[status] = [];
    groups[status].push(member);
  }
  return groups;
}

export function InviteActions({
  initialInvites,
  poolMembers,
  userEmail,
}: InviteActionsProps) {
  const [poolInvites, setPoolInvites] = useState(initialInvites);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const router = useRouter();

  const updateInviteStatus = trpc.poolInvite.updateStatus.useMutation({
    onSuccess: (_, variables) => {
      if (variables.status === "Accepted") {
        router.push(`/pool/${variables.pool_id}`);
      } else {
        setPoolInvites(
          poolInvites.filter((invite) => invite.id !== variables.id)
        );
      }
      setLoadingButtonId(null);
    },
    onError: () => {
      setLoadingButtonId(null);
    },
  });

  const handleInvite = (invite: Invite, status: string) => {
    const buttonId = `${invite.id}-${status === "Accepted" ? "accept" : "reject"}`;
    setLoadingButtonId(buttonId);
    updateInviteStatus.mutate({
      id: invite.id,
      status,
      pool_id: invite.pool.id,
      nickname: invite.nickname,
      email: userEmail,
    });
  };

  const grouped = groupPoolsByStatus(poolMembers);
  const completedPools = grouped["Complete"] || [];
  const hasActivePools = STATUS_GROUP_ORDER.some(
    (s) => grouped[s] && grouped[s].length > 0
  );

  return (
    <div className="container max-w-xl mx-auto flex flex-wrap items-center flex-col bg-black">
      <div className="flex flex-col justify-center items-center flex-wrap rounded bg-grey-200 w-full mt-4 pt-8 px-6 text-white">
        {/* Pending Invites */}
        {poolInvites.map((invite) => (
          <div
            className="p-4 bg-yellow w-full rounded mb-6 text-black"
            key={invite.id}
          >
            <div className="text-center">
              <span>You have been invited to:</span>
              <h3>{invite.pool.name}</h3>
              <p className="pb-2">${invite.pool.amount_entry} Ante</p>
              <div className="flex flex-wrap justify-center">
                <button
                  disabled={loadingButtonId !== null}
                  className="button-tertiary bg-green-500"
                  onClick={() => handleInvite(invite, "Accepted")}
                >
                  {loadingButtonId === `${invite.id}-accept` ? (
                    <span className="flex items-center justify-center">
                      <Spinner className="w-6 h-6 mr-1" />
                      Accepting...
                    </span>
                  ) : (
                    <span>Accept</span>
                  )}
                </button>
                <button
                  disabled={loadingButtonId !== null}
                  className="button-tertiary bg-red-300"
                  onClick={() => handleInvite(invite, "Rejected")}
                >
                  {loadingButtonId === `${invite.id}-reject` ? (
                    <span className="flex items-center justify-center">
                      <Spinner className="w-6 h-6 mr-1" />
                      Declining...
                    </span>
                  ) : (
                    <span>Decline</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!hasActivePools && !poolInvites.length && !completedPools.length && (
          <p className="text-center pb-8">
            You currently aren&apos;t in any active pools. Create one or ask a
            commissioner to invite you!
          </p>
        )}

        {/* Pool groups by status */}
        {STATUS_GROUP_ORDER.map((status) => {
          const pools = grouped[status];
          if (!pools || pools.length === 0) return null;
          return (
            <div key={status} className="w-full mb-2">
              <h4 className="text-grey-75 text-xs uppercase tracking-wider mb-3">
                {STATUS_LABELS[status]}
              </h4>
              {pools.map((member) => (
                <div
                  className="relative p-4 mb-4 bg-grey-100 w-full rounded"
                  key={member.id}
                >
                  {member.role === "COMMISSIONER" && (
                    <span className="absolute top-2 right-2 group">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#edec3233] text-yellow text-[10px] leading-none pt-[1px] font-bold cursor-default">
                        C
                      </span>
                      <span className="absolute right-0 bottom-full mb-1 px-2 py-1 rounded bg-grey-200 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                        Pool Commissioner
                      </span>
                    </span>
                  )}
                  <div className="text-center">
                    <h3 className="mb-2">{member.pool.name}</h3>
                    <div className="flex flex-wrap justify-center">
                      <Link
                        href={`/pool/${member.pool.id}`}
                        className="rounded bg-grey-200 hover:bg-yellow hover:text-black px-4 py-2"
                      >
                        Go To Pool
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Completed pools accordion */}
        {completedPools.length > 0 && (
          <div className="-mx-6 w-[calc(100%+3rem)] mb-6 overflow-hidden">
            <button
              onClick={() => setCompletedOpen(!completedOpen)}
              className="group w-full flex items-center justify-between px-6 py-3 text-left bg-grey-200"
            >
              <h4 className="text-xs uppercase tracking-wider text-grey-75">
                Completed ({completedPools.length})
              </h4>
              <svg
                className={`w-4 h-4 transition-transform transform group-hover:text-white ${completedOpen ? "text-white" : "text-grey-75 rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {completedOpen && (
              <div className="bg-grey-200 px-6 pb-4 pt-2">
                {completedPools.map((member, index) => (
                  <div
                    className={`relative p-4 bg-grey-100 w-full rounded ${index < completedPools.length - 1 ? "mb-4" : ""}`}
                    key={member.id}
                  >
                    {member.role === "COMMISSIONER" && (
                      <span className="absolute top-2 right-2 group">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#edec3233] text-yellow text-[10px] leading-none pt-[1px] font-bold cursor-default">
                          C
                        </span>
                        <span className="absolute right-0 bottom-full mb-1 px-2 py-1 rounded bg-grey-200 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                          Pool Commissioner
                        </span>
                      </span>
                    )}
                    <div className="text-center">
                      <h3 className="mb-2">{member.pool.name}</h3>
                      <div className="flex flex-wrap justify-center">
                        <Link
                          href={`/pool/${member.pool.id}`}
                          className="rounded bg-grey-200 hover:bg-yellow hover:text-black px-4 py-2"
                        >
                          Go To Pool
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
