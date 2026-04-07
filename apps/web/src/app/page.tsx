export const dynamic = "force-dynamic";

import { createServerCaller } from "@/lib/trpc/server";
import { InviteActions } from "@/components/pool/InviteActions";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function HomePage() {
  const { email } = await getAuthUser();

  if (!email) return null;

  const caller = await createServerCaller();
  const [invites, poolMembers] = await Promise.all([
    caller.poolInvite.listPending(),
    caller.poolMember.listByUser(),
  ]);

  return (
    <InviteActions
      initialInvites={invites}
      poolMembers={poolMembers}
      userEmail={email}
    />
  );
}
