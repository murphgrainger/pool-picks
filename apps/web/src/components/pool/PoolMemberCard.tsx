"use client";

import { useState, useEffect } from "react";
import { formatToPar, type AthletePickFormatted } from "@pool-picks/utils";
import { PickCard } from "@/components/picks/PickCard";
import { PicksCreateForm } from "@/components/picks/PicksCreateForm";
import { UsernameCreateForm } from "@/components/picks/UsernameCreateForm";

interface PoolMemberCardProps {
  member: {
    id: number;
    nickname?: string;
    username?: string;
    member_sum_under_par: number | null;
    member_position?: number;
    isTied?: boolean;
    picks: AthletePickFormatted[];
  };
  currentMemberId: number | null;
  poolStatus: string;
  tournamentId: number;
  tournamentExternalUrl: string | null;
}

export function PoolMemberCard({
  member,
  currentMemberId,
  poolStatus,
  tournamentId,
  tournamentExternalUrl,
}: PoolMemberCardProps) {
  const currentUserCard = member.id === currentMemberId;
  const pickStatus = member.picks?.length
    ? "Picks Submitted"
    : "Awaiting Picks";

  const [showPicks, setShowPicks] = useState(false);
  const [hasSubmittedUsername, setHasSubmittedUsername] = useState(
    !!member.username
  );
  const [displayUsername, setDisplayUsername] = useState(member.username);

  useEffect(() => {
    if (member.username) {
      setHasSubmittedUsername(true);
      setDisplayUsername(member.username);
    }
  }, [member.username]);

  const handleUsernameSubmitSuccess = (username: string) => {
    setHasSubmittedUsername(true);
    setDisplayUsername(username);
  };

  const underParFormatted = formatToPar(member.member_sum_under_par);
  let positionFormatted: string = member.member_position
    ? String(member.member_position)
    : "--";
  if (member.isTied) {
    positionFormatted = `T${positionFormatted}`;
  }

  const displayName = hasSubmittedUsername
    ? displayUsername
    : member.nickname;

  if (poolStatus === "Open") {
    return (
      <div className="w-full mt-6 p-6 rounded bg-grey-200" key={member.id}>
        {!currentUserCard && (
          <div className="flex justify-between">
            <h3>{displayName}</h3>
            <p className="font-semibold">{pickStatus}</p>
          </div>
        )}
        {currentUserCard && member.picks?.length > 0 && (
          <h3 className="mb-4">{displayName}</h3>
        )}
        {currentUserCard && !hasSubmittedUsername && (
          <UsernameCreateForm
            memberId={currentMemberId!}
            onSubmitSuccess={handleUsernameSubmitSuccess}
          />
        )}
        {currentUserCard &&
          hasSubmittedUsername &&
          !member.picks.length && (
            <PicksCreateForm
              memberId={currentMemberId!}
              tournamentId={tournamentId}
              tournamentExternalUrl={tournamentExternalUrl}
            />
          )}
        {currentUserCard &&
          member.picks
            ?.sort((a, b) => a.full_name.localeCompare(b.full_name))
            .map((athlete) => (
              <p
                key={athlete.id}
                className="p-2 mb-2 bg-grey-100 rounded"
              >
                {athlete.full_name}
              </p>
            ))}
      </div>
    );
  }

  if (!member.picks?.length) {
    return (
      <div className="w-full mt-6 p-6 rounded bg-grey-200 flex justify-between items-center">
        <h3>{displayName}</h3>
        <span className="italic text-xs">No Picks Submitted</span>
      </div>
    );
  }

  return (
    <div
      className="w-full mt-6 p-6 pb-2 rounded bg-grey-200"
      key={member.id}
    >
      <div className="flex items-center pb-4 pt-0">
        <div className="flex-1 flex items-center">
          <p className="text-xl mr-4 text-yellow font-extrabold">
            {positionFormatted}
          </p>
          <h3>{displayName}</h3>
          <div className="flex-1 flex flex-col items-end pr-6 justify-center">
            <p className="text-xl rounded-lg bg-grey-100 p-2 pr-3 pl-3 font-bold text-white">
              {underParFormatted}
            </p>
          </div>
        </div>
        <div
          className="accordion-header"
          onClick={() => setShowPicks(!showPicks)}
        >
          <span
            className={`accordion-arrow text-yellow ${showPicks ? "open" : ""}`}
          >
            &#9660;
          </span>
        </div>
      </div>
      {showPicks &&
        member.picks
          .sort((a, b) => {
            if (
              a.score_under_par !== null &&
              b.score_under_par !== null
            ) {
              return a.score_under_par - b.score_under_par;
            } else if (a.score_under_par !== null) {
              return -1;
            } else if (b.score_under_par !== null) {
              return 1;
            } else {
              return a.full_name.localeCompare(b.full_name);
            }
          })
          .map((athlete, i) => (
            <PickCard key={athlete.id} pick={athlete} index={i} />
          ))}
    </div>
  );
}
