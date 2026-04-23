import type { TournamentStatus } from "./constants";

/**
 * Computes what the tournament status "should" be based on dates alone.
 * Used to detect when a DB status is stale and needs advancing.
 */
export function getTournamentStatus(
  startDate: Date,
  endDate: Date
): TournamentStatus {
  const today = new Date();
  // Compare date-only (UTC midnight) to match Prisma @db.Date behavior
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const startUTC = Date.UTC(
    new Date(startDate).getUTCFullYear(),
    new Date(startDate).getUTCMonth(),
    new Date(startDate).getUTCDate()
  );
  const endUTC = Date.UTC(
    new Date(endDate).getUTCFullYear(),
    new Date(endDate).getUTCMonth(),
    new Date(endDate).getUTCDate()
  );

  if (todayUTC < startUTC) return "Scheduled";
  if (todayUTC > endUTC) return "Completed";
  return "Active";
}

/**
 * Returns the effective tournament status.
 *
 * The DB status is the source of truth. The only automatic transition is
 * Scheduled → Active (when start_date has passed). All other transitions
 * (including Active → Completed) require admin confirmation.
 *
 * This function is pure — it does NOT write to the DB. The backend
 * auto-advance logic (in the tournament router) handles the DB write.
 */
export function resolveTournamentStatus(tournament: {
  start_date: Date;
  end_date: Date;
  status: string;
}): TournamentStatus {
  // Admin-set terminal/suspended statuses are always respected — never auto-advance
  if (tournament.status === "Excluded") return "Excluded";
  if (tournament.status === "Completed") return "Completed";
  if (tournament.status === "Active") return "Active";

  // Auto-advance "Scheduled" → "Active" when start_date has passed
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const startUTC = Date.UTC(
    new Date(tournament.start_date).getUTCFullYear(),
    new Date(tournament.start_date).getUTCMonth(),
    new Date(tournament.start_date).getUTCDate()
  );

  if (todayUTC >= startUTC) return "Active";
  return "Scheduled";
}
