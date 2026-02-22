export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import axios from "axios";
import * as cheerio from "cheerio";

interface Athlete {
  full_name: string;
  ranking: number;
}

async function fetchAthleteRankings(url: string): Promise<Athlete[]> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const athletes: Athlete[] = [];

  $(".Table.Table--align-right.Table--fixed.Table--fixed-left tbody tr").each(
    (_index, element) => {
      const ranking = parseInt($(element).find(".rank_column span").text());
      const fullName = $(element).find(".flex .AnchorLink").text();
      if (fullName && ranking) {
        athletes.push({ full_name: fullName, ranking });
      }
    }
  );

  return athletes;
}

async function updateAthleteRankings(parsedAthletes: Athlete[]) {
  if (!parsedAthletes.length) {
    throw new Error("No athlete data available!");
  }

  const chunkSize = 10;
  for (let i = 0; i < parsedAthletes.length; i += chunkSize) {
    const chunk = parsedAthletes.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (athlete) => {
        const existing = await prisma.athlete.findUnique({
          where: { full_name: athlete.full_name },
        });
        if (existing) {
          await prisma.athlete.update({
            where: { full_name: existing.full_name },
            data: { ranking: athlete.ranking },
          });
        }
      })
    );
  }
}

export async function POST() {
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

  try {
    const url = process.env.RANKINGS_SCRAPE_URL!;
    const rankings = await fetchAthleteRankings(url);
    await updateAthleteRankings(rankings);
    return NextResponse.json({ message: "Success updating athlete rankings!" });
  } catch (error: any) {
    console.error("ERROR UPDATING ATHLETE RANKINGS:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
