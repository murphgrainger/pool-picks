export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@pool-picks/db";
import { autoAdvanceScheduledTournaments } from "@pool-picks/api";
import { sendScoreSyncAlertEmail } from "@pool-picks/api/lib/email";
import { syncTournamentScores } from "../../scrape/tournaments/score-sync";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Auto-advance any Scheduled tournaments whose start_date has passed
  const advanced = await autoAdvanceScheduledTournaments();

  // Notify admin when score auto-sync turns on
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (adminEmail && advanced.length > 0) {
    await Promise.all(
      advanced.map((t) =>
        sendScoreSyncAlertEmail({
          to: adminEmail,
          tournamentName: t.name,
          active: true,
        }).catch(() => {})
      )
    );
  }

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: "Active",
      external_id: { not: null },
    },
    select: { id: true, name: true },
  });

  if (tournaments.length === 0) {
    return NextResponse.json({
      message: "No active tournaments",
      synced: 0,
      failed: 0,
    });
  }

  const results = await Promise.allSettled(
    tournaments.map(async (t) => {
      const result = await syncTournamentScores(t.id);
      return { name: t.name, ...result };
    })
  );

  const synced = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason?.message || "Unknown error");

  return NextResponse.json({
    message: `Synced ${synced} tournament(s)${failed > 0 ? `, ${failed} failed` : ""}`,
    synced,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
