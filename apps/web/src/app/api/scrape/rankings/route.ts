// NOTE: Rankings still uses HTML scraping because ESPN has no JSON API
// for world golf rankings. This is the only remaining HTML scraper.
// All other endpoints (scores, athletes, schedule) use the ESPN JSON API.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    throw new Error(
      "No ranking data found. ESPN may have changed their page layout."
    );
  }

  let updated = 0;
  let notFound = 0;
  const missingNames: string[] = [];

  await Promise.all(
    parsedAthletes.map(async (athlete) => {
      const result = await prisma.athlete.updateMany({
        where: { full_name: athlete.full_name },
        data: { ranking: athlete.ranking },
      });
      if (result.count > 0) {
        updated++;
      } else {
        notFound++;
        if (missingNames.length < 10) {
          missingNames.push(athlete.full_name);
        }
      }
    })
  );

  return { updated, notFound, missingNames };
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
    const url = "https://www.espn.com/golf/rankings";
    const rankings = await fetchAthleteRankings(url);
    const { updated, notFound, missingNames } =
      await updateAthleteRankings(rankings);

    let message = `Updated rankings for ${updated} athletes.`;
    if (notFound > 0) {
      message += ` ${notFound} ranked players not found in our database`;
      if (missingNames.length > 0) {
        message += ` (e.g. ${missingNames.slice(0, 5).join(", ")})`;
      }
      message += ".";
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("ERROR UPDATING ATHLETE RANKINGS:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
