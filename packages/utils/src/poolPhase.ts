import type { TournamentStatus } from "./constants";

export const POOL_PHASES = [
  "setup",
  "open",
  "locked-awaiting",
  "live",
  "completed",
] as const;

export type PoolPhase = (typeof POOL_PHASES)[number];

const STALE_POOL_DAYS = 7;

/**
 * Computes the effective pool phase from pool status + resolved tournament status.
 * Use resolveTournamentStatus() to get the tournament status before calling this.
 *
 * Pass tournamentEndDate so that Locked pools with long-finished tournaments
 * (7+ days past end_date) are treated as "completed" even if the commissioner
 * never explicitly marked them Complete.
 */
export function getEffectivePoolPhase(
  poolStatus: string,
  tournamentStatus: TournamentStatus,
  tournamentEndDate?: Date
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
          return "live";
        case "Completed": {
          // If tournament ended 7+ days ago and pool is still Locked,
          // treat as completed so it doesn't sit at the top forever
          if (tournamentEndDate) {
            const now = new Date();
            const diffMs = now.getTime() - new Date(tournamentEndDate).getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays >= STALE_POOL_DAYS) return "completed";
          }
          return "live";
        }
        default:
          return "locked-awaiting";
      }
    case "Complete":
      return "completed";
    default:
      return "setup";
  }
}
