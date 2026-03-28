export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import {
  assertValidResponse,
  validateScoreboardResponse,
} from "../../../espn-validation";

const ESPN_API_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";

interface ParsedAthleteData {
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

interface ParsedTournamentData {
  cut_line: number | null;
}

function parseScoreToPar(score: string): number | null {
  if (!score || score === "--") return null;
  if (score === "E") return 0;
  const parsed = parseInt(score, 10);
  return isNaN(parsed) ? null : parsed;
}

function getRoundScore(
  linescores: any[],
  period: number
): number | null {
  const round = linescores.find((ls: any) => ls.period === period);
  if (!round) return null;
  const value = round.value;
  return typeof value === "number" ? value : null;
}

function deriveStatus(roundCount: number, totalRounds: number): string {
  if (totalRounds >= 4) return "Active";
  if (roundCount === 2) return "CUT";
  // Mid-tournament withdrawal (e.g. 1 or 3 rounds in a 4-round event)
  return "WD";
}

function deriveCutLine(competitors: any[]): number | null {
  // Find the last player who made the cut (has 4 rounds)
  // and compute their after-R2 to-par score.
  // The cut line = the worst (highest) after-R2 to-par among made-cut players.
  let worstR2ToPar: number | null = null;

  for (const c of competitors) {
    const linescores = c.linescores || [];
    if (linescores.length < 4) continue;

    const r1 = linescores.find((ls: any) => ls.period === 1);
    const r2 = linescores.find((ls: any) => ls.period === 2);
    if (!r1 || !r2) continue;

    const r1ToPar = parseScoreToPar(r1.displayValue);
    const r2ToPar = parseScoreToPar(r2.displayValue);
    if (r1ToPar === null || r2ToPar === null) continue;

    const afterR2 = r1ToPar + r2ToPar;
    if (worstR2ToPar === null || afterR2 > worstR2ToPar) {
      worstR2ToPar = afterR2;
    }
  }

  return worstR2ToPar;
}

function deriveThru(competitor: any, competitionStatus: any): string | null {
  const state = competitionStatus?.type?.state;

  // Tournament is finished — everyone is "F"
  if (state === "post") return "F";

  const linescores = competitor.linescores || [];
  if (linescores.length === 0) return null;

  // Find the latest round
  const latestRound = linescores[linescores.length - 1];
  const holes = latestRound?.linescores || [];

  if (holes.length === 0) return null;
  if (holes.length >= 18) return "F";

  return String(holes.length);
}

function deriveTodayScore(competitor: any, competitionStatus: any): number | null {
  const state = competitionStatus?.type?.state;
  const period = competitionStatus?.period;
  const linescores = competitor.linescores || [];

  if (state === "post") {
    // Tournament over — "today" is the final round
    const lastRound = linescores.find((ls: any) => ls.period === period);
    return lastRound ? parseScoreToPar(lastRound.displayValue) : null;
  }

  // Mid-tournament — current round is the latest linescore
  if (linescores.length === 0) return null;
  const currentRound = linescores[linescores.length - 1];
  return parseScoreToPar(currentRound.displayValue);
}

async function fetchGolfData(id: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if (!tournament || !tournament.external_id)
    throw new Error("Invalid tournament ID requested.");

  const url = `${ESPN_API_BASE}?event=${tournament.external_id}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`ESPN API returned ${response.status}`);

  const data = await response.json();
  await assertValidResponse(data, validateScoreboardResponse, "scoreboard (scores)");

  const event = data.events[0];

  // ESPN silently returns the most recent event when the requested event
  // doesn't have data yet. Verify we got the right one.
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

  // Check if any competitor has score data (linescores)
  const hasScores = competitors.some(
    (c: any) => c.linescores && c.linescores.length > 0
  );
  if (!hasScores) {
    throw new Error(
      "The tournament field is set but no scores have been posted yet. The tournament may not have started."
    );
  }

  const parsedAthleteData: ParsedAthleteData[] = competitors.map(
    (c: any) => {
      const linescores = c.linescores || [];
      const roundCount = linescores.length;
      const scoreSum = linescores.reduce(
        (sum: number, ls: any) =>
          typeof ls.value === "number" ? sum + ls.value : sum,
        0
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
        score_sum: roundCount > 0 ? scoreSum : null,
        status: deriveStatus(roundCount, 4),
      };
    }
  );

  const parsedTournamentData: ParsedTournamentData = {
    cut_line: deriveCutLine(competitors),
  };

  return { parsedAthleteData, parsedTournamentData };
}

async function updateGolfData(
  {
    parsedAthleteData,
    parsedTournamentData,
  }: {
    parsedAthleteData: ParsedAthleteData[];
    parsedTournamentData: ParsedTournamentData;
  },
  tournamentId: number
) {
  if (!parsedAthleteData.length)
    throw new Error("No data available for this tournament!");

  await Promise.all(
    parsedAthleteData.map(async (athleteData) => {
      const existingAthlete = await prisma.athlete.upsert({
        where: { full_name: athleteData.full_name },
        create: { full_name: athleteData.full_name },
        update: {},
      });

      const scoreData = {
        score_round_one: athleteData.score_round_one,
        score_round_two: athleteData.score_round_two,
        score_round_three: athleteData.score_round_three,
        score_round_four: athleteData.score_round_four,
        score_sum: athleteData.score_sum,
        score_under_par: athleteData.score_under_par,
        score_today: athleteData.score_today,
        position: athleteData.position,
        thru: athleteData.thru,
        status: athleteData.status,
      };

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
    })
  );

  if (parsedTournamentData?.cut_line) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { cut_line: parsedTournamentData.cut_line },
    });
  } else {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { updated_at: new Date() },
    });
  }
}

// Server-side cooldown: one sync per tournament per 60 seconds
const lastSyncMap = new Map<string, number>();
const SYNC_COOLDOWN_MS = 60_000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createRouteHandlerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id)
    return NextResponse.json({ message: "No ID provided" }, { status: 400 });

  // Enforce cooldown per tournament
  const now = Date.now();
  const lastSync = lastSyncMap.get(id) ?? 0;
  if (now - lastSync < SYNC_COOLDOWN_MS) {
    const secsRemaining = Math.ceil((SYNC_COOLDOWN_MS - (now - lastSync)) / 1000);
    return NextResponse.json(
      { message: `Scores were just synced. Try again in ${secsRemaining}s.` },
      { status: 429 }
    );
  }

  try {
    const golfData = await fetchGolfData(id);
    await updateGolfData(golfData, parseInt(id));
    lastSyncMap.set(id, Date.now());
    return NextResponse.json({
      message: "Success updating golf data!",
    });
  } catch (error: any) {
    console.error("ERROR UPDATING TOURNAMENT SCORES:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
