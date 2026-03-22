export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function POST() {
  const supabase = createRouteHandlerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
