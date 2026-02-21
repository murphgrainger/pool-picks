import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import axios from "axios";
import * as cheerio from "cheerio";

interface ParsedTournament {
  name: string;
  external_id: number;
  course: string;
  city: string;
  region: string;
  start_date: Date;
  end_date: Date;
}

function parseScheduleHtml(
  html: string,
  seasonYear: number
): ParsedTournament[] {
  const $ = cheerio.load(html);
  const tournaments: ParsedTournament[] = [];

  $(".Table__TR.Table__TR--sm").each((_index, row) => {
    const dateText = $(row).find(".dateAndTickets__col div div").text().trim();
    const nameEl = $(row).find(".eventAndLocation__tournamentLink");
    const name = nameEl.text().trim();
    const linkEl = $(row).find(".eventAndLocation__innerCell a.AnchorLink");
    const href = linkEl.attr("href") || "";
    const venueText = $(row)
      .find(".eventAndLocation__tournamentLocation")
      .text()
      .trim();

    if (!name || !dateText) return;

    // Extract external_id from href query param (e.g., tournamentId=401811933)
    const idMatch = href.match(/tournamentId=(\d+)/);
    if (!idMatch) return;
    const external_id = parseInt(idMatch[1], 10);

    // Parse venue: "Riviera Country Club - Pacific Palisades, CA"
    let course = "";
    let city = "";
    let region = "";
    if (venueText) {
      const venueParts = venueText.split(" - ");
      course = venueParts[0]?.trim() || "";
      if (venueParts[1]) {
        const locationParts = venueParts[1].split(", ");
        city = locationParts[0]?.trim() || "";
        region = locationParts[1]?.trim() || "";
      }
    }

    // Parse dates: "Feb 19 - 22" or "Feb 26 - Mar 1"
    const { startDate, endDate } = parseDateRange(dateText, seasonYear);
    if (!startDate || !endDate) return;

    tournaments.push({
      name,
      external_id,
      course,
      city,
      region,
      start_date: startDate,
      end_date: endDate,
    });
  });

  return tournaments;
}

function parseDateRange(
  dateText: string,
  year: number
): { startDate: Date | null; endDate: Date | null } {
  // Formats: "Feb 19 - 22" or "Feb 26 - Mar 1" or "Dec 28 - Jan 2"
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const parts = dateText.split(" - ");
  if (parts.length !== 2) return { startDate: null, endDate: null };

  const startPart = parts[0].trim();
  const endPart = parts[1].trim();

  // Parse start: always "Mon DD"
  const startTokens = startPart.split(" ");
  if (startTokens.length !== 2) return { startDate: null, endDate: null };
  const startMonth = months[startTokens[0]];
  const startDay = parseInt(startTokens[1], 10);
  if (startMonth === undefined || isNaN(startDay))
    return { startDate: null, endDate: null };

  // Parse end: either "DD" or "Mon DD"
  const endTokens = endPart.split(" ");
  let endMonth: number;
  let endDay: number;
  if (endTokens.length === 1) {
    // Same month as start
    endMonth = startMonth;
    endDay = parseInt(endTokens[0], 10);
  } else {
    endMonth = months[endTokens[0]];
    endDay = parseInt(endTokens[1], 10);
  }
  if (endMonth === undefined || isNaN(endDay))
    return { startDate: null, endDate: null };

  const startDate = new Date(year, startMonth, startDay);

  // If end month is earlier than start month (e.g., Dec 28 - Jan 2), end is next year
  let endYear = year;
  if (endMonth < startMonth) {
    endYear = year + 1;
  }
  const endDate = new Date(endYear, endMonth, endDay);

  return { startDate, endDate };
}

async function upsertTournaments(tournaments: ParsedTournament[]) {
  let created = 0;
  let updated = 0;

  for (const t of tournaments) {
    const existing = await prisma.tournament.findFirst({
      where: { external_id: t.external_id },
    });

    if (existing) {
      await prisma.tournament.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          course: t.course,
          city: t.city,
          region: t.region,
          start_date: t.start_date,
          end_date: t.end_date,
        },
      });
      updated++;
    } else {
      await prisma.tournament.create({
        data: {
          name: t.name,
          external_id: t.external_id,
          course: t.course,
          city: t.city,
          region: t.region,
          start_date: t.start_date,
          end_date: t.end_date,
          status: "Scheduled",
        },
      });
      created++;
    }
  }

  return { created, updated, total: tournaments.length };
}

export async function POST(request: NextRequest) {
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
    let year = new Date().getFullYear();
    try {
      const body = await request.json();
      if (body?.year && typeof body.year === "number") {
        year = body.year;
      }
    } catch {
      // No body or invalid JSON — use default year
    }

    const url = `https://www.espn.com/golf/schedule/_/season/${year}`;
    const response = await axios.get(url);
    const tournaments = parseScheduleHtml(response.data, year);

    if (!tournaments.length) {
      return NextResponse.json(
        { message: "No tournaments found on the page" },
        { status: 404 }
      );
    }

    const result = await upsertTournaments(tournaments);
    return NextResponse.json({
      message: `Synced ${result.total} tournaments (${result.created} created, ${result.updated} updated)`,
      ...result,
    });
  } catch (error: any) {
    console.error("ERROR SCRAPING SCHEDULE:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
