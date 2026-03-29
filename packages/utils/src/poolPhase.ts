import type { TournamentStatus } from "./constants";

export const POOL_PHASES = [
  "setup",
  "open",
  "locked-awaiting",
  "live",
  "completed",
] as const;

export type PoolPhase = (typeof POOL_PHASES)[number];

/**
 * Computes the effective pool phase from pool status + resolved tournament status.
 * Use resolveTournamentStatus() to get the tournament status before calling this.
 *
 * This is a pure function — it does not consider dates or write to the DB.
 * Stale Locked pools are handled by autoCompleteStaleLockedPools() in the backend.
 */
export function getEffectivePoolPhase(
  poolStatus: string,
  tournamentStatus: TournamentStatus
): PoolPhase {
  switch (poolStatus) {
    case "Setup":
      return "setup";
    case "Open":
      return "open";
    case "Locked":
    case "Active": // legacy — treat same as Locked until migration runs
      switch (tournamentStatus) {
        case "Scheduled":
          return "locked-awaiting";
        case "Active":
        case "Completed":
          return "live";
        default:
          return "locked-awaiting";
      }
    case "Complete":
      return "completed";
    default:
      return "setup";
  }
}
