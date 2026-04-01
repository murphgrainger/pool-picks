export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { prisma } from "@pool-picks/db";

export async function POST() {
  const supabase = createRouteHandlerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  await prisma.user.upsert({
    where: { email: user.email },
    update: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
    },
  });

  return NextResponse.json({ success: true });
}
