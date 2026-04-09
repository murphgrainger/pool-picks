import { createServerCaller } from "@/lib/trpc/server";
import { InviteActions } from "@/components/pool/InviteActions";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function HomePage() {
  const { email, isAdmin } = await getAuthUser();

  if (!email) return null;

  const caller = await createServerCaller();
  const [invites, poolMembers, allPools] = await Promise.all([
    caller.poolInvite.listPending(),
    caller.poolMember.listByUser(),
    isAdmin ? caller.pool.list() : Promise.resolve([]),
  ]);

  return (
    <InviteActions
      initialInvites={invites}
      poolMembers={poolMembers}
      userEmail={email}
      isAdmin={isAdmin}
      allPools={allPools}
    />
  );
}
