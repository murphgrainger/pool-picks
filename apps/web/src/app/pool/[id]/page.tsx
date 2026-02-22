import { notFound, redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { reformatPoolMembers } from "@pool-picks/utils";
import { PoolDetailClient } from "@/components/pool/PoolDetailClient";

interface PoolPageProps {
  params: Promise<{ id: string }>;
}

export default async function PoolPage({ params }: PoolPageProps) {
  const { id } = await params;
  const { supabaseUser } = await getAuthUser();

  if (!supabaseUser) redirect("/auth/sign-in");

  const caller = await createServerCaller();
  const pool = await caller.pool.getById({ id: Number(id) });

  if (!pool) notFound();

  const currentUserPoolMember = pool.pool_members.find(
    (member) => member.user.email === supabaseUser.email
  );

  const isCommissioner = pool.pool_members.some(
    (member) => member.user_id === supabaseUser.id && member.role === "COMMISSIONER"
  );

  // Non-members and non-commissioners can't see the pool
  if (!currentUserPoolMember && !isCommissioner) {
    redirect("/");
  }

  const poolMembers = reformatPoolMembers(
    pool.pool_members,
    pool.tournament_id
  );

  return (
    <PoolDetailClient
      pool={pool}
      poolMembers={poolMembers}
      currentUserPoolMemberId={currentUserPoolMember?.id ?? null}
      isCommissioner={isCommissioner}
    />
  );
}
