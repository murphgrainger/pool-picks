import { createServerCaller } from "@/lib/trpc/server";
import { InviteActions } from "@/components/pool/InviteActions";
import { createClient } from "@/lib/supabase/server";
import { sortPoolMembersByPoolStatus } from "@pool-picks/utils";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

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
      userEmail={user.email}
    />
  );
}
