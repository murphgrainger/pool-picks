import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServerCaller } from "@/lib/trpc/server";
import { prisma } from "@pool-picks/db";

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

  const sortedTournaments = [...tournaments].sort((a, b) => {
    const aLatestPool = a.pools[0]?.created_at
      ? new Date(a.pools[0].created_at).getTime()
      : 0;
    const bLatestPool = b.pools[0]?.created_at
      ? new Date(b.pools[0].created_at).getTime()
      : 0;
    return bLatestPool - aLatestPool;
  });

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
        <h1>System Admin</h1>
        <div className="w-full">
          <h2 className="mb-2">Tournaments</h2>
          <ul>
            {sortedTournaments.map((tournament) => (
              <li
                key={tournament.id}
                className="bg-grey-200 rounded p-3 mb-2 mt-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      &#9971; {tournament.name}
                    </p>
                    <p>Status: {tournament.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/system-admin/tournament/${tournament.id}`}
                      className="rounded p-2 bg-grey-100"
                    >
                      View
                    </Link>
                    <Link
                      href={`/pool/create?tournament_id=${tournament.id}`}
                      className="rounded p-2 bg-green-500 text-black hover:bg-green-600"
                    >
                      Create Pool
                    </Link>
                  </div>
                </div>

                {tournament.pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="p-4 mb-2 mt-2 bg-grey-100 rounded"
                  >
                    <p className="font-bold">{pool.name}</p>
                    <p>Members: {pool.pool_members.length}</p>
                    <p>Pending Invites: {pool.pool_invites.length}</p>
                    <p className="mb-2">Status: {pool.status}</p>
                    <Link
                      href={`/pool/${pool.id}`}
                      className="rounded p-2 bg-grey-200"
                    >
                      To Pool
                    </Link>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
