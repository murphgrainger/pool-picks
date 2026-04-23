"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTournamentDates, resolveTournamentStatus } from "@pool-picks/utils";
import { SyncScheduleButton } from "./SyncScheduleButton";

interface Pool {
  id: number;
  name: string;
  status: string;
  created_at: Date;
  pool_members: { id: number; user_id: string; role: string }[];
  pool_invites: { id: number }[];
}

interface Tournament {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  pools: Pool[];
}

function statusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Completed":
      return "bg-grey-100 text-grey-75";
    case "Excluded":
      return "bg-grey-100 text-grey-75";
    default:
      return "bg-yellow/20 text-yellow";
  }
}

function poolStatusColor(status: string) {
  switch (status) {
    case "Setup":
      return "bg-blue-100 text-blue-700";
    case "Open":
      return "bg-yellow/20 text-yellow";
    case "Locked":
      return "bg-red-100 text-red-700";
    case "Complete":
      return "bg-grey-100 text-grey-75";
    default:
      return "bg-grey-100 text-grey-75";
  }
}

function normalizeName(name: string) {
  return name
    .replace(/\s+(pres\.|presented)\s+by\s+.+$/i, "")
    .trim()
    .toLowerCase();
}

function categorizeTournaments(tournaments: Tournament[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const currentYear_upcoming: Tournament[] = [];
  const currentYear_completed: Tournament[] = [];
  const pastYear_all: Tournament[] = [];

  for (const t of tournaments) {
    const year = new Date(t.start_date).getFullYear();
    const endDate = new Date(t.end_date);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    const isPast = endDate < twoWeeksAgo;

    if (year === currentYear) {
      if (isPast) {
        currentYear_completed.push(t);
      } else {
        currentYear_upcoming.push(t);
      }
    } else {
      pastYear_all.push(t);
    }
  }

  const upcomingNames = new Set(currentYear_upcoming.map((t) => normalizeName(t.name)));

  const pastByName: Record<string, Tournament[]> = {};
  const orphanedPast: Tournament[] = [];

  for (const t of pastYear_all) {
    const key = normalizeName(t.name);
    if (upcomingNames.has(key)) {
      if (!pastByName[key]) pastByName[key] = [];
      pastByName[key].push(t);
    } else {
      orphanedPast.push(t);
    }
  }

  const sortByStartAsc = (a: Tournament, b: Tournament) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime();

  currentYear_upcoming.sort(sortByStartAsc);
  currentYear_completed.sort(sortByStartAsc);
  orphanedPast.sort(sortByStartAsc);
  for (const key of Object.keys(pastByName)) {
    pastByName[key].sort(sortByStartAsc);
  }

  const overallPast = [...currentYear_completed, ...orphanedPast];

  return { upcoming: currentYear_upcoming, pastByName, overallPast };
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

function ChevronDown({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={`${className || "w-4 h-4"} transition-transform ${open ? "" : "rotate-180"}`}
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
  );
}

function GearIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function PoolList({ pools }: { pools: Pool[] }) {
  if (pools.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs uppercase tracking-wider text-grey-75 mb-2">
        Pools ({pools.length})
      </p>
      {pools.map((pool) => (
        <Link
          key={pool.id}
          href={`/pool/${pool.id}`}
          className="flex items-center justify-between p-3 mb-1 bg-grey-200 border border-grey-100 rounded group"
        >
          <div className="min-w-0">
            <p className="font-bold">{pool.name}</p>
            <div className="flex items-center gap-3 text-sm text-grey-75 mt-1">
              <span>{pool.pool_members.length} members</span>
              {pool.pool_invites.length > 0 && (
                <span>{pool.pool_invites.length} pending</span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${poolStatusColor(pool.status)}`}
              >
                {pool.status}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-grey-300 group-hover:text-green-700 shrink-0 ml-2" />
        </Link>
      ))}
    </div>
  );
}

function TournamentCard({
  tournament,
  pastVersions,
}: {
  tournament: Tournament;
  pastVersions?: Tournament[];
}) {
  const [pastOpen, setPastOpen] = useState(false);

  const displayStatus = resolveTournamentStatus(tournament);

  return (
    <li className="bg-white border border-grey-100 rounded-lg shadow-sm p-3 mb-2">
      <Link
        href={`/system-admin/tournament/${tournament.id}`}
        className="flex items-center justify-between group"
      >
        <div className="min-w-0">
          <p className="text-lg font-bold">
            &#9971; {tournament.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-grey-75">
              {formatTournamentDates(tournament.start_date, tournament.end_date)}
            </p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(displayStatus)}`}
            >
              {displayStatus}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-grey-300 group-hover:text-green-700 shrink-0 ml-2" />
      </Link>

      <PoolList pools={tournament.pools} />

      {pastVersions && pastVersions.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setPastOpen(!pastOpen)}
            className="group w-full flex items-center justify-between py-2 px-3 text-left rounded"
          >
            <span className="text-xs uppercase tracking-wider text-grey-75">
              Past Years ({pastVersions.length})
            </span>
            <ChevronDown
              className="w-3 h-3 text-grey-75 group-hover:text-black"
              open={pastOpen}
            />
          </button>
          {pastOpen && (
            <div className="mt-1 space-y-2">
              {pastVersions.map((past) => (
                <div key={past.id} className="bg-grey-200 border border-grey-100 rounded p-3">
                  <Link
                    href={`/system-admin/tournament/${past.id}`}
                    className="flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{new Date(past.start_date).getFullYear()}</p>
                      <p className="text-xs text-grey-75">
                        {formatTournamentDates(past.start_date, past.end_date)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-grey-300 group-hover:text-green-700 shrink-0 ml-2" />
                  </Link>
                  <PoolList pools={past.pools} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function TournamentList({ tournaments }: { tournaments: Tournament[] }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);

  const { upcoming, pastByName, overallPast } = categorizeTournaments(tournaments);

  return (
    <>
      <div className="flex items-center justify-between w-full mb-4">
        <h1 className="text-lg font-bold">System Admin</h1>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`p-2 rounded hover:bg-grey-200 transition-colors ${settingsOpen ? "text-green-700 bg-grey-200" : "text-grey-75"}`}
          title="Settings"
        >
          <GearIcon />
        </button>
      </div>

      {settingsOpen && (
        <div className="w-full mb-4 p-3 bg-grey-200 border border-grey-100 rounded">
          <SyncScheduleButton />
        </div>
      )}

      <div className="w-full">
        <h2 className="mb-2">Tournaments</h2>
        <ul>
          {upcoming.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              pastVersions={pastByName[normalizeName(tournament.name)]}
            />
          ))}
        </ul>

        {overallPast.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setPastOpen(!pastOpen)}
              className="group w-full flex items-center justify-between py-3 px-4 text-left bg-grey-200 border border-grey-100 rounded"
            >
              <h4 className="text-xs uppercase tracking-wider text-grey-75">
                Past ({overallPast.length})
              </h4>
              <ChevronDown
                className="w-4 h-4 text-grey-75 group-hover:text-black"
                open={pastOpen}
              />
            </button>
            {pastOpen && (
              <div className="mt-2">
                <ul>
                  {overallPast.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
