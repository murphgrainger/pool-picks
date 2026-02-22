import { createServerCaller } from "@/lib/trpc/server";
import { InviteActions } from "@/components/pool/InviteActions";
import { getAuthUser } from "@/lib/supabase/auth";
import { sortPoolMembersByPoolStatus } from "@pool-picks/utils";

export default async function HomePage() {
  const { email } = await getAuthUser();

  if (!email) return null;

  const caller = await createServerCaller();
  const [invites, unsortedMembers] = await Promise.all([
    caller.poolInvite.listPending(),
    caller.poolMember.listByUser(),
  ]);

  const poolMembers = sortPoolMembersByPoolStatus(unsortedMembers);

  return (
    <InviteActions
      initialInvites={invites}
      poolMembers={poolMembers}
      userEmail={email}
    />
  );
}
