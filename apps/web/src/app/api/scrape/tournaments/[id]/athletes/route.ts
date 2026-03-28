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

interface Athlete {
  full_name: string;
}

async function fetchAthleteField(id: string): Promise<Athlete[]> {
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
  await assertValidResponse(data, validateScoreboardResponse, "scoreboard (athletes)");

  const event = data.events[0];

  // ESPN silently returns the most recent event when the requested event
  // doesn't have data yet. Verify we got the right one.
  if (event.id !== String(tournament.external_id)) {
    throw new Error(
      "The field for this tournament hasn't been announced yet. Try again closer to the event."
    );
  }

  const competition = event.competitions?.[0];
  if (!competition) throw new Error("No competition data in ESPN response.");

  const competitors = competition.competitors || [];
  if (!competitors.length) {
    const status = competition.status?.type?.name;
    if (status === "STATUS_SCHEDULED") {
      throw new Error(
        "The field for this tournament hasn't been announced yet. Try again closer to the event."
      );
    }
    throw new Error("No athletes found for this tournament.");
  }

  const athletes: Athlete[] = [];

  for (const c of competitors) {
    const fullName = c.athlete?.fullName;
    if (fullName) {
      athletes.push({ full_name: fullName });
    }
  }

  return athletes;
}

async function updateAthleteField(
  parsedAthletes: Athlete[],
  tournamentId: number
) {
  if (!parsedAthletes.length) {
    throw new Error("No athlete data available for this tournament!");
  }

  await Promise.all(
    parsedAthletes.map(async (athlete) => {
      const existingAthlete = await prisma.athlete.upsert({
        where: { full_name: athlete.full_name },
        create: { full_name: athlete.full_name },
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
        },
        update: {},
      });
    })
  );
}

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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { is_admin: true },
  });
  if (!dbUser?.is_admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id)
    return NextResponse.json({ message: "No ID provided" }, { status: 400 });

  try {
    const field = await fetchAthleteField(id);
    await updateAthleteField(field, parseInt(id));
    return NextResponse.json({
      message: "Success updating athlete field!",
    });
  } catch (error: any) {
    console.error("ERROR UPDATING TOURNAMENT FIELD:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
