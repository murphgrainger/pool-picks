import { prisma } from "@pool-picks/db";
import {
  assertValidResponse,
  validateCoreEventResponse,
  validateCoreTournamentResponse,
  validateScoreboardResponse,
} from "../espn-validation";

const ESPN_API_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const ESPN_CORE_BASE =
  "https://sports.core.api.espn.com/v2/sports/golf/leagues/pga";

// ESPN uses `STATUS_CUT` as the type for CUT, WD, and DQ; displayValue disambiguates.
// We collapse non-CUT variants to "WD" so downstream scoring/UI doesn't need to change.
function mapCoreStatus(typeName: string, displayValue: string): string {
  if (typeName !== "STATUS_CUT") return "Active";
  return displayValue === "CUT" ? "CUT" : "WD";
}

interface CutData {
  cutRound: number;
  cutScore: number | null; // null when cutRound === 0 (cut not yet applied / no cut event)
  cutCount: number;
}

// Fetches tournament-level cut data via the core API.
// Throws on network/schema errors — the schema validator fires admin alerts.
async function fetchCutData(externalEventId: number): Promise<CutData> {
  const eventRes = await fetch(
    `${ESPN_CORE_BASE}/events/${externalEventId}`,
    { cache: "no-store" }
  );
  if (!eventRes.ok) {
    throw new Error(`ESPN core event API returned ${eventRes.status}`);
  }
  const event = await eventRes.json();
  await assertValidResponse(event, validateCoreEventResponse, "core event");

  const tournamentRes = await fetch(event.tournament.$ref, {
    cache: "no-store",
  });
  if (!tournamentRes.ok) {
    throw new Error(
      `ESPN core tournament API returned ${tournamentRes.status}`
    );
  }
  const tournament = await tournamentRes.json();
  await assertValidResponse(
    tournament,
    validateCoreTournamentResponse,
    "core tournament"
  );

  return {
    cutRound: tournament.cutRound,
    cutScore: tournament.cutRound > 0 ? tournament.cutScore : null,
    cutCount: tournament.cutCount,
  };
}

// Fetches per-competitor status in parallel batches. Tolerates individual failures
// so a single 404 or timeout doesn't fail the whole sync — existing DB CUT/WD
// statuses are preserved in updateGolfData when the map is missing an entry.
async function fetchCompetitorStatuses(
  externalEventId: number,
  competitorIds: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const BATCH_SIZE = 20;

  for (let i = 0; i < competitorIds.length; i += BATCH_SIZE) {
    const batch = competitorIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (id) => {
        const url = `${ESPN_CORE_BASE}/events/${externalEventId}/competitions/${externalEventId}/competitors/${id}/status`;
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          const typeName = data?.type?.name;
          const displayValue = data?.displayValue;
          if (
            typeof typeName === "string" &&
            typeof displayValue === "string"
          ) {
            result.set(id, mapCoreStatus(typeName, displayValue));
          }
        } catch {
          // tolerate individual failures
        }
      })
    );
  }

  return result;
}

export interface ParsedAthleteData {
  full_name: string;
  position: number | null;
  score_round_one: number | null;
  score_round_two: number | null;
  score_round_three: number | null;
  score_round_four: number | null;
  score_sum: number | null;
  score_under_par: number | null;
  score_today: number | null;
  thru: string | null;
  status: string;
}

export function parseScoreToPar(score: string): number | null {
  if (!score || score === "--") return null;
  if (score === "E") return 0;
  const parsed = parseInt(score, 10);
  return isNaN(parsed) ? null : parsed;
}

function getRoundScore(linescores: any[], period: number): number | null {
  const round = linescores.find((ls: any) => ls.period === period);
  if (!round) return null;
  // ESPN returns value: 0.0 with displayValue: "-" for players who haven't teed off
  if (!round.displayValue || round.displayValue === "-") return null;
  const value = round.value;
  return typeof value === "number" ? value : null;
}

function deriveThru(competitor: any, competitionStatus: any): string | null {
  const state = competitionStatus?.type?.state;
  if (state === "post") return "F";

  const linescores = competitor.linescores || [];
  if (linescores.length === 0) return null;

  const latestRound = linescores[linescores.length - 1];
  const holes = latestRound?.linescores || [];

  if (holes.length === 0) return null;
  if (holes.length >= 18) return "F";

  return String(holes.length);
}

function deriveTodayScore(
  competitor: any,
  competitionStatus: any
): number | null {
  const state = competitionStatus?.type?.state;
  const period = competitionStatus?.period;
  const linescores = competitor.linescores || [];

  if (state === "post") {
    const lastRound = linescores.find((ls: any) => ls.period === period);
    return lastRound ? parseScoreToPar(lastRound.displayValue) : null;
  }

  if (linescores.length === 0) return null;
  const currentRound = linescores[linescores.length - 1];
  return parseScoreToPar(currentRound.displayValue);
}

export async function fetchGolfData(id: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if (!tournament || !tournament.external_id)
    throw new Error("Invalid tournament ID requested.");

  const url = `${ESPN_API_BASE}/${tournament.external_id}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`ESPN API returned ${response.status}`);

  const raw = await response.json();
  // Path-based URL returns the event directly; query-param URL wraps in { events: [...] }
  const event = raw.events ? raw.events[0] : raw;
  await assertValidResponse(
    event,
    validateScoreboardResponse,
    "scoreboard (scores)"
  );

  if (event.id !== String(tournament.external_id)) {
    const now = new Date();
    const isPast = tournament.end_date && tournament.end_date < now;
    throw new Error(
      isPast
        ? "ESPN no longer has live scoreboard data for this completed tournament."
        : "This tournament hasn't started yet — no scores to update."
    );
  }

  const competition = event.competitions?.[0];
  if (!competition) throw new Error("No competition data in ESPN response.");

  const competitors = competition.competitors || [];
  const competitionStatus = competition.status;
  const statusName = competitionStatus?.type?.name;

  if (!competitors.length) {
    if (statusName === "STATUS_SCHEDULED") {
      throw new Error(
        "This tournament hasn't started yet — no scores to update."
      );
    }
    throw new Error("No competitor data available for this tournament.");
  }

  const hasScores = competitors.some(
    (c: any) => c.linescores && c.linescores.length > 0
  );
  if (!hasScores) {
    throw new Error(
      "The tournament field is set but no scores have been posted yet. The tournament may not have started."
    );
  }

  const parsedAthleteData: ParsedAthleteData[] = competitors.map((c: any) => {
    const linescores = c.linescores || [];
    const scoreSum = linescores.reduce(
      (sum: number, ls: any) =>
        typeof ls.value === "number" && ls.displayValue && ls.displayValue !== "-"
          ? sum + ls.value
          : sum,
      0
    );
    const hasAnyScore = linescores.some(
      (ls: any) => typeof ls.value === "number" && ls.displayValue && ls.displayValue !== "-"
    );

    return {
      full_name: c.athlete.fullName,
      position: c.order ?? null,
      score_under_par: parseScoreToPar(c.score),
      score_today: deriveTodayScore(c, competitionStatus),
      thru: deriveThru(c, competitionStatus),
      score_round_one: getRoundScore(linescores, 1),
      score_round_two: getRoundScore(linescores, 2),
      score_round_three: getRoundScore(linescores, 3),
      score_round_four: getRoundScore(linescores, 4),
      score_sum: hasAnyScore ? scoreSum : null,
      status: "Active",
    };
  });

  // Pull cut data from the core API. Once the cut is set, also fetch per-competitor
  // status so we can mark CUT/WD from ESPN instead of deriving from a score threshold.
  const cutData = await fetchCutData(tournament.external_id);

  if (cutData.cutRound > 0) {
    const competitorIds = competitors.map((c: any) => String(c.id));
    const statusMap = await fetchCompetitorStatuses(
      tournament.external_id,
      competitorIds
    );
    competitors.forEach((c: any, i: number) => {
      const mapped = statusMap.get(String(c.id));
      if (mapped) parsedAthleteData[i].status = mapped;
    });
  }

  return { parsedAthleteData, cutScore: cutData.cutScore };
}

interface ScoreFields {
  score_under_par: number | null;
  score_today: number | null;
  position: number | null;
  thru: string | null;
  score_round_one: number | null;
  score_round_two: number | null;
  score_round_three: number | null;
  score_round_four: number | null;
  score_sum: number | null;
  status: string;
}

function scoreFieldsChanged(
  existing: ScoreFields,
  incoming: ScoreFields
): boolean {
  return (
    existing.score_under_par !== incoming.score_under_par ||
    existing.score_today !== incoming.score_today ||
    existing.position !== incoming.position ||
    existing.thru !== incoming.thru ||
    existing.score_round_one !== incoming.score_round_one ||
    existing.score_round_two !== incoming.score_round_two ||
    existing.score_round_three !== incoming.score_round_three ||
    existing.score_round_four !== incoming.score_round_four ||
    existing.score_sum !== incoming.score_sum ||
    existing.status !== incoming.status
  );
}

export async function updateGolfData(
  {
    parsedAthleteData,
    cutScore,
  }: {
    parsedAthleteData: ParsedAthleteData[];
    cutScore: number | null;
  },
  tournamentId: number
): Promise<{ hasChanges: boolean }> {
  if (!parsedAthleteData.length)
    throw new Error("No data available for this tournament!");

  // Mirror ESPN's cut line onto the tournament row. Null before the cut is applied;
  // populated once ESPN sets it. Also cleared for signature/no-cut events.
  const existingTournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { cut_line: true },
  });
  if (existingTournament && existingTournament.cut_line !== cutScore) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { cut_line: cutScore },
    });
  }

  // Fetch existing scores to compare against
  const existingRecords = await prisma.athletesInTournaments.findMany({
    where: { tournament_id: tournamentId },
    include: { athlete: { select: { full_name: true } } },
  });

  const existingByName = new Map(
    existingRecords.map((r) => [r.athlete.full_name, r])
  );

  let rowsWritten = 0;

  const BATCH_SIZE = 5;
  for (let i = 0; i < parsedAthleteData.length; i += BATCH_SIZE) {
    await Promise.all(
      parsedAthleteData.slice(i, i + BATCH_SIZE).map(async (athleteData) => {
        const existing = existingByName.get(athleteData.full_name);

        const scoreData: ScoreFields = {
          score_round_one: athleteData.score_round_one,
          score_round_two: athleteData.score_round_two,
          score_round_three: athleteData.score_round_three,
          score_round_four: athleteData.score_round_four,
          score_sum: athleteData.score_sum,
          score_under_par: athleteData.score_under_par,
          score_today: athleteData.score_today,
          position: athleteData.position,
          thru: athleteData.thru,
          // Preserve CUT/WD once set — a status fetch can fail for an individual
          // competitor, and a player can't un-cut. Transitions are monotonic.
          status:
            existing && (existing.status === "CUT" || existing.status === "WD")
              ? existing.status
              : athleteData.status,
        };

        // New athlete or scores changed — write to DB
        if (!existing || scoreFieldsChanged(existing, scoreData)) {
          const existingAthlete = await prisma.athlete.upsert({
            where: { full_name: athleteData.full_name },
            create: { full_name: athleteData.full_name },
            update: {},
          });

          await prisma.athletesInTournaments.upsert({
            where: {
              tournament_id_athlete_id: {
                tournament_id: tournamentId,
                athlete_id: existingAthlete.id,
              },
            },
            create: {
              tournament_id: tournamentId,
              athlete_id: existingAthlete.id,
              ...scoreData,
            },
            update: scoreData,
          });

          rowsWritten++;
        }
      })
    );
  }

  const hasChanges = rowsWritten > 0;

  if (hasChanges) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { updated_at: new Date() },
    });
  }

  return { hasChanges };
}

const FINISHED_STATUSES = ["CUT", "WD"];
const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * High-level convenience: fetch ESPN data and write changed scores to DB.
 * Skips the ESPN call when all athletes are done for the day (thru = "F" or
 * status is CUT/WD), unless it's been over 4 hours since the last update
 * (to catch the start of the next round).
 */
export async function syncTournamentScores(
  tournamentId: number
): Promise<{ updated: boolean; message: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { updated_at: true },
  });

  const athletes = await prisma.athletesInTournaments.findMany({
    where: { tournament_id: tournamentId },
    select: { thru: true, status: true },
  });

  if (athletes.length > 0 && tournament) {
    const allDone = athletes.every(
      (a) => a.thru === "F" || FINISHED_STATUSES.includes(a.status)
    );
    const msSinceUpdate = Date.now() - tournament.updated_at.getTime();

    if (allDone && msSinceUpdate < STALE_THRESHOLD_MS) {
      return {
        updated: false,
        message: "All players finished for the day — skipping ESPN sync.",
      };
    }
  }

  const golfData = await fetchGolfData(String(tournamentId));
  const { hasChanges } = await updateGolfData(golfData, tournamentId);
  return {
    updated: hasChanges,
    message: hasChanges
      ? "Scores updated successfully."
      : "No score changes detected.",
  };
}
