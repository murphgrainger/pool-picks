"use client";

import { formatToPar, type AthletePlayerView } from "@pool-picks/utils";

interface PlayerCardProps {
  athlete: AthletePlayerView;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PlayerCard({ athlete, isExpanded, onToggle }: PlayerCardProps) {
  const underParFormatted = formatToPar(athlete.score_under_par);
  const scoreTodayFormatted = formatToPar(athlete.score_today);
  const isCutOrWD = athlete.status === "CUT" || athlete.status === "WD";
  const showStatus = isCutOrWD ? athlete.status : "--";

  const thruIsTeeTime =
    athlete.thru &&
    (athlete.thru.includes("AM") || athlete.thru.includes("PM"));
  const thruFormatted = thruIsTeeTime ? null : athlete.thru;

  return (
    <div
      className={`w-full mt-4 p-6 pb-2 rounded-lg bg-white border border-grey-100 shadow-sm ${
        isCutOrWD ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center pb-4 pt-0">
        <div className="flex-1 flex items-center">
          <p className="text-xl mr-4 text-gold font-extrabold">
            {athlete.position || showStatus}
          </p>
          <h3 className="font-semibold flex-1">{athlete.full_name}</h3>
          <span className="text-xs text-grey-75 bg-grey-200 rounded px-2 py-1 mr-2">
            {athlete.pickedBy.length}{" "}
            {athlete.pickedBy.length === 1 ? "pick" : "picks"}
          </span>
          {athlete.score_under_par !== null && (
            <p className="text-xl rounded-lg bg-green-700 p-2 pr-3 pl-3 font-bold text-white mr-2">
              {underParFormatted}
            </p>
          )}
        </div>
        <button onClick={onToggle} className="p-1">
          <svg
            className={`w-4 h-4 transition-transform text-grey-75 ${
              isExpanded ? "" : "rotate-180"
            }`}
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
      </div>

      {isExpanded && (
        <>
          <div className="flex justify-around bg-grey-200 border border-grey-100 p-4 rounded mb-4">
            {scoreTodayFormatted && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs text-grey-75">Today</span>
                <p>{scoreTodayFormatted}</p>
              </div>
            )}
            {thruFormatted && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs text-grey-75">Thru</span>
                <p>{thruFormatted || "-"}</p>
              </div>
            )}
            {thruIsTeeTime && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs text-grey-75">Tee Time</span>
                <p>{athlete.thru || "-"}</p>
              </div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs text-grey-75">R1</span>
              <p>{athlete.score_round_one || "-"}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs text-grey-75">R2</span>
              <p>{athlete.score_round_two || "-"}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs text-grey-75">R3</span>
              <p>{athlete.score_round_three || "-"}</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-xs text-grey-75">R4</span>
              <p>{athlete.score_round_four || "-"}</p>
            </div>
          </div>

          <div className="pb-4">
            <p className="text-xs text-grey-75 mb-2 font-semibold">Picked by</p>
            {athlete.pickedBy.map((member) => {
              const posLabel = member.isDQ
                ? "DQ"
                : member.memberPosition
                  ? `${member.isTied ? "T" : ""}${member.memberPosition}`
                  : "--";
              const scoreLabel = member.isDQ
                ? "DQ"
                : formatToPar(member.memberScore);

              return (
                <div
                  key={member.memberId}
                  className="flex items-center p-2 mb-2 bg-grey-200 border border-grey-100 rounded"
                >
                  <p className="text-sm mr-3 text-gold font-extrabold">
                    {posLabel}
                  </p>
                  <p className="flex-1 text-sm font-medium">
                    {member.displayName}
                  </p>
                  {member.role === "COMMISSIONER" && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-yellow text-[10px] leading-none font-bold mr-2">
                      C
                    </span>
                  )}
                  {member.memberScore !== null && (
                    <span className="text-sm font-bold bg-green-700 text-white rounded px-2 py-1">
                      {scoreLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
