"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reformatPoolMembers, type PoolMemberFormatted } from "@pool-picks/utils";
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
}

export function PoolDetailClient({
  pool,
  poolMembers: initialPoolMembers,
  currentUserPoolMemberId,
  isCommissioner,
}: PoolDetailClientProps) {
  const router = useRouter();
  const [poolStatus, setPoolStatus] = useState(pool.status);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [updatedPoolMembers, setUpdatedPoolMembers] =
    useState<PoolMemberFormatted[]>(initialPoolMembers);
  const [poolInvites, setPoolInvites] = useState(pool.pool_invites);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalPotAmount = updatedPoolMembers.length * pool.amount_entry;
  const tournamentExternalUrl = pool.tournament.external_id
    ? `https://www.espn.com/golf/leaderboard/_/tournamentId/${pool.tournament.external_id}`
    : null;

  const showLogo = pool.tournament.name === "Masters Tournament";

  const getScores = trpc.pool.getScores.useQuery(
    { pool_id: pool.id },
    { enabled: false }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await getScores.refetch();
    if (result.data) {
      const updatedMembers = reformatPoolMembers(
        result.data,
        pool.tournament.id
      );
      setUpdatedPoolMembers(updatedMembers);
    }
    setIsRefreshing(false);
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
            <h1 className="text-lg font-bold">{pool.name}</h1>
            <p className="text-base">{pool.tournament.name}</p>
            {pool.tournament.course && (
              <p className="text-base">{pool.tournament.course}</p>
            )}
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
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 bg-grey-200 text-white rounded px-4 py-2 hover:bg-grey-100"
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
            currentStatus={poolStatus}
            onInviteCreated={handleNewInvite}
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
