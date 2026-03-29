"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  formatTournamentDates,
  formatToPar,
  ordinalSuffix,
  resolveTournamentStatus,
  getEffectivePoolPhase,
  type PoolPhase,
} from "@pool-picks/utils";
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
  rank: number | null;
  score: number | null;
  isTied: boolean;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
    tournament: {
      name: string;
      start_date: Date;
      end_date: Date;
      status: string;
    };
  };
}

interface InviteActionsProps {
  initialInvites: Invite[];
  poolMembers: PoolMembership[];
  userEmail: string;
}

function phaseColor(phase: PoolPhase) {
  switch (phase) {
    case "setup":
      return "bg-blue-500/20 text-blue-300";
    case "open":
      return "bg-yellow/20 text-yellow";
    case "locked-awaiting":
      return "bg-red-500/20 text-red-400";
    case "live":
      return "bg-green-500/20 text-green-300";
    case "completed":
      return "bg-grey-100/50 text-grey-50";
    default:
      return "bg-grey-100/50 text-grey-50";
  }
}

function phaseLabel(phase: PoolPhase) {
  switch (phase) {
    case "setup":
      return "Setup";
    case "open":
      return "Open";
    case "locked-awaiting":
      return "Locked";
    case "live":
      return "Live";
    case "completed":
      return "Complete";
    default:
      return phase;
  }
}

const PHASE_GROUP_ORDER: PoolPhase[] = ["live", "open", "locked-awaiting", "setup"];

function getMemberPhase(member: PoolMembership): PoolPhase {
  const tournamentStatus = resolveTournamentStatus(member.pool.tournament);
  return getEffectivePoolPhase(member.pool.status, tournamentStatus, member.pool.tournament.end_date);
}

function groupPoolsByPhase(pools: PoolMembership[]) {
  const groups: Record<string, PoolMembership[]> = {};
  for (const member of pools) {
    const phase = getMemberPhase(member);
    if (!groups[phase]) groups[phase] = [];
    groups[phase].push(member);
  }
  return groups;
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function PoolCard({ member }: { member: PoolMembership }) {
  const phase = getMemberPhase(member);
  const showScore = phase === "live" || phase === "completed";

  return (
    <Link
      href={`/pool/${member.pool.id}`}
      className="flex items-center justify-between p-3 mb-2 bg-gradient-to-br from-grey-100 to-grey-200 rounded group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold">{member.pool.name}</p>
          {member.role === "COMMISSIONER" && (
            <span className="relative group/tip">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#edec3233] text-yellow text-[10px] leading-none pt-[1px] font-bold cursor-default">
                C
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-grey-200 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity">
                Commissioner
              </span>
            </span>
          )}
        </div>
        <p className="text-sm text-grey-50 mt-1">
          {formatTournamentDates(
            member.pool.tournament.start_date,
            member.pool.tournament.end_date
          )}
        </p>
        {showScore && member.rank !== null && (
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div>
              <span className="text-grey-50 text-xs">Rank </span>
              <span className="font-bold text-green-300">
                {member.isTied ? "T" : ""}
                {member.rank}
                {ordinalSuffix(member.rank)}
              </span>
            </div>
            <div>
              <span className="text-grey-50 text-xs">Score </span>
              <span className="font-bold text-green-300">
                {formatToPar(member.score ?? null) ?? "\u2014"}
              </span>
            </div>
          </div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-grey-75 group-hover:text-white shrink-0 ml-2" />
    </Link>
  );
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

  const grouped = groupPoolsByPhase(poolMembers);
  const completedPools = grouped["completed"] || [];
  const hasActivePools = PHASE_GROUP_ORDER.some(
    (p) => grouped[p] && grouped[p].length > 0
  );

  return (
    <div className="max-w-xl mx-auto w-full px-4 pt-6 pb-8 text-white">
      {/* Pending Invites */}
      {poolInvites.map((invite) => (
        <div
          className="p-4 bg-yellow w-full rounded mb-4 text-black"
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
        <p className="text-center text-grey-50">
          You currently aren&apos;t in any active pools. Create one or ask a
          commissioner to invite you!
        </p>
      )}

      {/* Pool groups by phase */}
      {PHASE_GROUP_ORDER.map((phase) => {
        const pools = grouped[phase];
        if (!pools || pools.length === 0) return null;
        return (
          <div key={phase} className="w-full mb-4">
            <div className="mb-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${phaseColor(phase)}`}
              >
                {phaseLabel(phase)}
              </span>
            </div>
            {pools.map((member) => (
              <PoolCard key={member.id} member={member} />
            ))}
          </div>
        );
      })}

      {/* Completed pools collapsible */}
      {completedPools.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setCompletedOpen(!completedOpen)}
            className="group w-full flex items-center justify-between py-3 px-4 text-left bg-grey-200 rounded"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${phaseColor("completed")}`}
              >
                Complete
              </span>
              <span className="text-xs text-grey-75">
                ({completedPools.length})
              </span>
            </div>
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
            <div className="mt-2">
              {completedPools.map((member) => (
                <PoolCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
