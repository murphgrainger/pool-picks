"use client";

import type { AthletePlayerView } from "@pool-picks/utils";
import { PlayerCard } from "./PlayerCard";

interface PlayerCardListProps {
  athletes: AthletePlayerView[];
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
}

export function PlayerCardList({ athletes, expandedIds, onToggle }: PlayerCardListProps) {
  if (athletes.length === 0) {
    return (
      <div className="w-full mt-4 p-6 rounded-lg bg-white border border-grey-100 shadow-sm text-center">
        <p className="text-grey-75 italic">No picks to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {athletes.map((athlete) => (
        <PlayerCard
          key={athlete.id}
          athlete={athlete}
          isExpanded={expandedIds.has(athlete.id)}
          onToggle={() => onToggle(athlete.id)}
        />
      ))}
    </div>
  );
}
