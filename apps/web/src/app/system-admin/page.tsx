import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServerCaller } from "@/lib/trpc/server";
import { prisma } from "@pool-picks/db";
import { TournamentList } from "@/components/admin/TournamentList";

export default async function SystemAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { is_admin: true },
  });

  if (!dbUser?.is_admin) redirect("/");

  const caller = await createServerCaller();
  const tournaments = await caller.tournament.listWithPools();

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
        <TournamentList tournaments={tournaments} />
      </div>
    </div>
  );
}
