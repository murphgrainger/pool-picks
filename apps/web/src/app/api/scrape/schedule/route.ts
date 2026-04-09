export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@pool-picks/db";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import {
  assertValidResponse,
  validateScheduleResponse,
  validateEventDetailsResponse,
} from "../espn-validation";

const ESPN_SCOREBOARD_API =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const ESPN_CORE_API =
  "https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events";

interface ParsedTournament {
  name: string;
  external_id: number;
  course: string;
  city: string;
  region: string;
  start_date: Date;
  end_date: Date;
}

async function fetchEventDetails(
  eventId: string
): Promise<{ course: string; city: string; region: string }> {
  try {
    const response = await fetch(`${ESPN_CORE_API}/${eventId}`, { cache: "no-store" });
    if (!response.ok) return { course: "", city: "", region: "" };

    const data = await response.json();
    const detailsValidation = validateEventDetailsResponse(data);
    if (!detailsValidation.valid) {
      console.warn(`Event details validation failed for ${eventId}:`, detailsValidation.errors);
      return { course: "", city: "", region: "" };
    }

    const courseData = data.courses?.[0];
    if (!courseData) return { course: "", city: "", region: "" };

    return {
      course: courseData.name || "",
      city: courseData.address?.city || "",
      region: courseData.address?.state || "",
    };
  } catch {
    return { course: "", city: "", region: "" };
  }
}

async function fetchSchedule(year: number): Promise<ParsedTournament[]> {
  const url = `${ESPN_SCOREBOARD_API}?dates=${year}0101-${year}1231`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error(`ESPN API returned ${response.status}`);

  const data = await response.json();
  await assertValidResponse(data, validateScheduleResponse, "scoreboard (schedule)");

  const events = data.events || [];
  const tournaments: ParsedTournament[] = [];

  // Fetch venue details for all events in parallel (batched)
  const BATCH_SIZE = 5;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (event: any) => {
        const status = event.status?.type?.name;
        if (status === "STATUS_CANCELED") return null;

        const external_id = parseInt(event.id, 10);
        if (isNaN(external_id)) return null;

        const startDate = new Date(event.date);
        const endDate = new Date(event.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
          return null;

        const details = await fetchEventDetails(event.id);

        return {
          name: event.name || event.shortName,
          external_id,
          course: details.course,
          city: details.city,
          region: details.region,
          start_date: startDate,
          end_date: endDate,
        };
      })
    );

    for (const result of results) {
      if (result) tournaments.push(result);
    }
  }

  return tournaments;
}

async function upsertTournaments(tournaments: ParsedTournament[]) {
  let total = 0;
  const BATCH_SIZE = 5;
  for (let i = 0; i < tournaments.length; i += BATCH_SIZE) {
    await Promise.all(
      tournaments.slice(i, i + BATCH_SIZE).map((t) =>
        prisma.tournament.upsert({
          where: { external_id: t.external_id },
          update: {
            name: t.name,
            course: t.course,
            city: t.city,
            region: t.region,
            start_date: t.start_date,
            end_date: t.end_date,
          },
          create: {
            name: t.name,
            external_id: t.external_id,
            course: t.course,
            city: t.city,
            region: t.region,
            start_date: t.start_date,
            end_date: t.end_date,
            status: "Scheduled",
          },
        })
      )
    );
    total += Math.min(BATCH_SIZE, tournaments.length - i);
  }

  return { total };
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

    const tournaments = await fetchSchedule(year);

    if (!tournaments.length) {
      return NextResponse.json(
        { message: "No tournaments found" },
        { status: 404 }
      );
    }

    const result = await upsertTournaments(tournaments);
    return NextResponse.json({
      message: `Synced ${result.total} tournaments`,
      ...result,
    });
  } catch (error: any) {
    console.error("ERROR SYNCING SCHEDULE:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
