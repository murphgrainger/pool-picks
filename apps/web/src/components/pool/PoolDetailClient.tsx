"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { reformatPoolMembers, formatTournamentDates, type PoolMemberFormatted } from "@pool-picks/utils";
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

      // Re-fetch pool scores from DB now that ESPN data is written
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

  const handleNewInvite = (newInvite: {
    id: number;
    email: string;
    nickname: string;
    status: string;
  }) => {
    setPoolInvites([...poolInvites, newInvite]);
  };

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
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
            <p className="text-base">{pool.tournament.name}</p>
            {pool.tournament.course && (
              <p className="text-xs">{pool.tournament.course}</p>
            )}
            <p className="text-xs">{tournamentDates}</p>
            <p className="text-xs">
              ${pool.amount_entry} Ante | Total Pot: ${totalPotAmount}
            </p>
            {tournamentExternalUrl && (
              <a
                href={tournamentExternalUrl}
                className="font-bold text-yellow underline mt-2"
                target="_blank"
                rel="noreferrer"
              >
                Official Leaderboard
              </a>
            )}
          </div>
        </div>

        {/* Refresh button */}
        {(poolStatus === "Active" || poolStatus === "Locked") && (
          <div className="flex flex-col items-center mt-4 gap-1">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-grey-200 text-white rounded px-4 py-2 hover:bg-grey-100"
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
            <p className="text-xs text-grey-50">
              Updated {formatLastRefreshed()}
            </p>
          </div>
        )}

        <PoolStatusCard status={poolStatus} />

        {isCommissioner && (
          <button
            onClick={() => setShowAdminPanel((prev) => !prev)}
            className="p-1 pr-2 pl-2 mt-2 bg-gray-500 rounded"
          >
            Commissioner Panel
            <span
              className={`accordion-arrow text-grey-50 ml-2 mt-1 text-xs ${
                showAdminPanel ? "open" : ""
              }`}
            >
              &#9660;
            </span>
          </button>
        )}
        {isCommissioner && showAdminPanel && (
          <PoolAdminPanel
            poolId={pool.id}
            tournamentId={pool.tournament.id}
            currentStatus={poolStatus}
            existingInviteEmails={poolInvites.map((i) => i.email)}
            onInviteCreated={handleNewInvite}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {updatedPoolMembers.map((member) => (
        <PoolMemberCard
          key={member.id}
          member={member}
          currentMemberId={currentUserPoolMemberId}
          poolStatus={poolStatus}
          tournamentId={pool.tournament.id}
          tournamentExternalUrl={tournamentExternalUrl}
        />
      ))}

      {poolInvites.map((invite) => (
        <div
          className="w-full mt-6 p-6 rounded bg-grey-100 flex justify-between items-center"
          key={invite.id}
        >
          <p>{invite.nickname}</p>
          <span className="italic text-xs">Invited</span>
        </div>
      ))}
    </div>
  );
}
