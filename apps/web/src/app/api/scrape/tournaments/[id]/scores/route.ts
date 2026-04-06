export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { fetchGolfData, updateGolfData } from "../../score-sync";

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
    const secsRemaining = Math.ceil(
      (SYNC_COOLDOWN_MS - (now - lastSync)) / 1000
    );
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
