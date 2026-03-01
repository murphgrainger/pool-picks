export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import axios from "axios";
import * as cheerio from "cheerio";

interface Athlete {
  full_name: string;
}

async function fetchAthleteField(id: string): Promise<Athlete[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: parseInt(id) },
  });
  if (!tournament || !tournament.external_id)
    throw new Error("Invalid tournament ID requested.");

  const url = `https://www.espn.com/golf/leaderboard/_/tournamentId/${tournament.external_id}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const athletes: Athlete[] = [];

  $("tr.PlayerRow__Overview").each((_index, element) => {
    const fullName = $(element).find(".leaderboard_player_name").text();
    if (fullName) {
      athletes.push({ full_name: fullName });
    }
  });

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
