"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  reformatPoolMembers,
  formatTournamentDates,
  resolveTournamentStatus,
  getEffectivePoolPhase,
  type PoolMemberFormatted,
} from "@pool-picks/utils";
import { trpc } from "@/lib/trpc/client";
import { PoolStatusCard } from "./PoolStatusCard";
import { PoolAdminPanel } from "./PoolAdminPanel";
import { PoolMemberCard } from "./PoolMemberCard";
import { Spinner } from "@/components/ui/Spinner";

interface PoolDetailClientProps {
  pool: {
    id: number;
    name: string;
    status: string;
    invite_code: string | null;
    join_mode: string;
    amount_entry: number;
    amount_sum: number | null;
    tournament_id: number;
    tournament: {
      id: number;
      name: string;
      course: string | null;
      city: string | null;
      region: string | null;
      status: string;
      cut_line: number | null;
      external_id: number | null;
      start_date: Date;
      end_date: Date;
      updated_at: Date;
    };
    pool_invites: {
      id: number;
      status: string;
      email: string;
      nickname: string;
    }[];
  };
  poolMembers: PoolMemberFormatted[];
  currentUserPoolMemberId: number | null;
  isCommissioner: boolean;
  isAdmin: boolean;
}

export function PoolDetailClient({
  pool,
  poolMembers: initialPoolMembers,
  currentUserPoolMemberId,
  isCommissioner,
  isAdmin,
}: PoolDetailClientProps) {
  const router = useRouter();
  const [poolStatus, setPoolStatus] = useState(pool.status);
  const [showAdminPanel, setShowAdminPanel] = useState(isCommissioner);

  const tournamentStatus = useMemo(
    () => resolveTournamentStatus(pool.tournament),
    [pool.tournament]
  );
  const phase = useMemo(
    () => getEffectivePoolPhase(poolStatus, tournamentStatus),
    [poolStatus, tournamentStatus]
  );
  const [updatedPoolMembers, setUpdatedPoolMembers] =
    useState<PoolMemberFormatted[]>(initialPoolMembers);
  const [poolInvites, setPoolInvites] = useState(pool.pool_invites);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(
    new Date(pool.tournament.updated_at)
  );


  const totalPotAmount = updatedPoolMembers.length * pool.amount_entry;
  const tournamentExternalUrl = pool.tournament.external_id
    ? `https://www.espn.com/golf/leaderboard/_/tournamentId/${pool.tournament.external_id}`
    : null;

  const showLogo = pool.tournament.name === "Masters Tournament";

  const tournamentDates = formatTournamentDates(pool.tournament.start_date, pool.tournament.end_date);

  const getScores = trpc.pool.getScores.useQuery(
    { pool_id: pool.id },
    { enabled: false }
  );

  const formatLastRefreshed = useCallback(() => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(lastRefreshed).getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1 min ago";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs === 1) return "1 hr ago";
    return `${diffHrs} hrs ago`;
  }, [lastRefreshed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `/api/scrape/tournaments/${pool.tournament_id}/scores`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.message || "Failed to refresh scores.");
        setIsRefreshing(false);
        return;
      }

      const result = await getScores.refetch();
      if (result.data) {
        setUpdatedPoolMembers(
          reformatPoolMembers(result.data, pool.tournament.id)
        );
      }
      setLastRefreshed(new Date());
      toast.success("Scores updated!");
    } catch {
      toast.error("Network error refreshing scores.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setPoolStatus(newStatus);
    const result = await getScores.refetch();
    if (result.data) {
      setUpdatedPoolMembers(
        reformatPoolMembers(result.data, pool.tournament.id)
      );
    }
  };

  const handleNewInvite = (newInvite: {
    id: number;
    email: string;
    nickname: string;
    status: string;
  }) => {
    setPoolInvites([...poolInvites, newInvite]);
  };

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col">
      <div className="flex flex-col w-full bg-white border border-grey-100 rounded-lg shadow-sm p-4 items-center">
        <div className="flex">
          {showLogo && (
            <div className="pl-4 pr-4">
              <img src="/logo_masters.png" className="w-24" alt="Masters" />
            </div>
          )}
          <div
            className={`flex justify-center flex-1 flex-col align-center ${
              !showLogo ? "text-center" : ""
            }`}
          >
            <h1 className="text-2xl font-bold">{pool.name}</h1>
            <p className="text-base text-grey-75">{pool.tournament.name}</p>
            {pool.tournament.course && (
              <p className="text-xs text-grey-75">{pool.tournament.course}</p>
            )}
            <p className="text-xs text-grey-75">{tournamentDates}</p>
            <p className="text-xs text-grey-75">
              ${pool.amount_entry} Ante | Total Pot: ${totalPotAmount}
            </p>
            {tournamentExternalUrl && (
              <a
                href={tournamentExternalUrl}
                className="font-bold text-green-700 underline mt-2"
                target="_blank"
                rel="noreferrer"
              >
                Official Leaderboard
              </a>
            )}
          </div>
        </div>

        {/* Refresh button — only during active tournament */}
        {phase === "live" && tournamentStatus === "Active" && (
          <div className="flex flex-col items-center mt-4 gap-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-green-700 text-white rounded px-4 py-2 hover:bg-green-900"
            >
              {isRefreshing ? (
                <span className="flex items-center">
                  <Spinner className="w-4 h-4 mr-2" />
                  Refreshing...
                </span>
              ) : (
                "Refresh Scores"
              )}
            </button>
            <p className="text-xs text-grey-75">
              Updated {formatLastRefreshed()}
            </p>
          </div>
        )}

        <PoolStatusCard phase={phase} isCommissioner={isCommissioner} />

        {isCommissioner && (
          <button
            onClick={() => setShowAdminPanel((prev) => !prev)}
            className="p-1 pr-2 pl-2 mt-2 bg-grey-100 rounded flex items-center hover:bg-grey-300"
          >
            Commissioner Panel
            <svg
              className={`w-4 h-4 ml-2 transition-transform text-grey-75 ${showAdminPanel ? "" : "rotate-180"}`}
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
        )}
        {isCommissioner && showAdminPanel && (
          <PoolAdminPanel
            poolId={pool.id}
            tournamentId={pool.tournament.id}
            currentStatus={poolStatus}
            tournamentStatus={tournamentStatus}
            inviteCode={pool.invite_code}
            joinMode={pool.join_mode}
            existingInviteEmails={poolInvites.map((i) => i.email)}
            onInviteCreated={handleNewInvite}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {updatedPoolMembers.map((member) => (
        <PoolMemberCard
          key={member.id}
          member={member}
          currentMemberId={currentUserPoolMemberId}
          phase={phase}
          tournamentId={pool.tournament.id}
          tournamentExternalUrl={tournamentExternalUrl}
        />
      ))}

      {poolInvites.map((invite) => (
        <div
          className="w-full mt-4 p-6 rounded bg-white border border-grey-100 shadow-sm flex justify-between items-center"
          key={invite.id}
        >
          <p>{invite.nickname}</p>
          <span className="italic text-xs text-grey-75">Invited</span>
        </div>
      ))}
    </div>
  );
}
