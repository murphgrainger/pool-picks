import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import axios from "axios";
import * as cheerio from "cheerio";

interface Athlete {
  full_name: string;
}

interface AthleteInTournament {
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
  [key: string]: number | null | string;
}

interface ParsedAthleteData {
  athlete: Athlete;
  athleteInTournament: AthleteInTournament;
}

interface ParsedTournamentData {
  cut_line: number | null;
}

function parseLeaderboardPosition(toPar: string): number | null {
  switch (toPar.toUpperCase()) {
    case "CUT":
      return null;
    case "WD":
      return null;
    case "E":
      return 0;
    default: {
      const parsed = parseInt(toPar, 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
}

async function fetchGolfData(id: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if (!tournament || !tournament.external_id)
    throw new Error("Invalid tournament ID requested.");

  const url = `${process.env.SCRAPE_URL}/${tournament.external_id}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const parsedAthleteData: ParsedAthleteData[] = [];
  const parsedTournamentData: ParsedTournamentData = { cut_line: null };
  const columnIndexes: Partial<Record<keyof AthleteInTournament, number>> = {};

  $("thead.Table__THEAD tr.Table__TR.Table__even th").each(
    (index, element) => {
      const cssClass = $(element).attr("class");
      if (cssClass) {
        const column = cssClass.split(" ")[0];
        switch (column) {
          case "pos":
            columnIndexes.position = index;
            break;
          case "toPar":
            columnIndexes.score_under_par = index;
            break;
          case "today":
            columnIndexes.score_today = index;
            break;
          case "thru":
            columnIndexes.thru = index;
            break;
          case "r1":
            columnIndexes.score_round_one = index;
            break;
          case "r2":
            columnIndexes.score_round_two = index;
            break;
          case "r3":
            columnIndexes.score_round_three = index;
            break;
          case "r4":
            columnIndexes.score_round_four = index;
            break;
          case "tot":
            columnIndexes.score_sum = index;
            break;
        }
      }
    }
  );

  $("tr.PlayerRow__Overview").each((_index, element) => {
    const fullName = $(element).find(".leaderboard_player_name").text();
    const scores = $(element)
      .find(".Table__TD")
      .map((_i, el) => $(el).text())
      .toArray();

    const athlete: Athlete = { full_name: fullName };
    const athleteInTournament: AthleteInTournament = {
      position: null,
      score_round_one: null,
      score_round_two: null,
      score_round_three: null,
      score_round_four: null,
      score_sum: null,
      score_under_par: null,
      score_today: null,
      thru: null,
      status: "Active",
    };

    for (const [key, value] of Object.entries(columnIndexes)) {
      if (value !== undefined) {
        let score = scores[value];
        if (score !== "--") {
          if (key === "position") {
            if (score && score !== "-") {
              if (score.includes("T")) score = score.substring(1);
              athleteInTournament[key] = parseInt(score, 10);
            }
          } else if (key === "score_under_par") {
            const formattedToPar = parseLeaderboardPosition(score);
            athleteInTournament[key] = formattedToPar;
            athleteInTournament["status"] =
              formattedToPar === null ? score : "Active";
          } else if (key === "score_today") {
            athleteInTournament[key] = parseLeaderboardPosition(score);
          } else if (key === "thru") {
            athleteInTournament[key] = score;
          } else {
            athleteInTournament[key] = parseInt(score, 10);
          }
        }
      }
    }

    parsedAthleteData.push({ athlete, athleteInTournament });
  });

  const cutLine = $(".cut-score").text();
  parsedTournamentData.cut_line = parseInt(cutLine);

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

  const chunkSize = 10;
  for (let i = 0; i < parsedAthleteData.length; i += chunkSize) {
    const chunk = parsedAthleteData.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async ({ athlete, athleteInTournament }) => {
        let existingAthlete = await prisma.athlete.findUnique({
          where: { full_name: athlete.full_name },
        });

        if (!existingAthlete) {
          existingAthlete = await prisma.athlete.create({
            data: { full_name: athlete.full_name },
          });
        }

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
            score_round_one: athleteInTournament.score_round_one as number | null,
            score_round_two: athleteInTournament.score_round_two as number | null,
            score_round_three: athleteInTournament.score_round_three as number | null,
            score_round_four: athleteInTournament.score_round_four as number | null,
            score_sum: athleteInTournament.score_sum as number | null,
            score_under_par: athleteInTournament.score_under_par as number | null,
            score_today: athleteInTournament.score_today as number | null,
            position: athleteInTournament.position as number | null,
            thru: athleteInTournament.thru as string | null,
            status: athleteInTournament.status as string,
          },
          update: {
            score_round_one: athleteInTournament.score_round_one as number | null,
            score_round_two: athleteInTournament.score_round_two as number | null,
            score_round_three: athleteInTournament.score_round_three as number | null,
            score_round_four: athleteInTournament.score_round_four as number | null,
            score_under_par: athleteInTournament.score_under_par as number | null,
            score_sum: athleteInTournament.score_sum as number | null,
            score_today: athleteInTournament.score_today as number | null,
            position: athleteInTournament.position as number | null,
            thru: athleteInTournament.thru as string | null,
            status: athleteInTournament.status as string,
          },
        });
      })
    );
  }

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

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { is_admin: true },
  });
  if (!dbUser?.is_admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id)
    return NextResponse.json({ message: "No ID provided" }, { status: 400 });

  try {
    const golfData = await fetchGolfData(id);
    await updateGolfData(golfData, parseInt(id));
    return NextResponse.json({
      message: "Success updating golf data!",
    });
  } catch (error: any) {
    console.error("ERROR UPDATING TOURNAMENT SCORES:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
