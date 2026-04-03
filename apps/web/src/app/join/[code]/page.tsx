import { notFound } from "next/navigation";
import { prisma } from "@pool-picks/db";
import { getAuthUser } from "@/lib/supabase/auth";
import { JoinPoolClient } from "@/components/pool/JoinPoolClient";

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const pool = await prisma.pool.findUnique({
    where: { invite_code: upperCode },
    select: {
      id: true,
      name: true,
      status: true,
      join_mode: true,
      amount_entry: true,
      invite_code: true,
      tournament: {
        select: {
          name: true,
          course: true,
          start_date: true,
          end_date: true,
        },
      },
      _count: { select: { pool_members: true } },
    },
  });

  if (!pool) notFound();

  const { supabaseUser } = await getAuthUser();

  let isAlreadyMember = false;
  let hasPendingInvite = false;
  if (supabaseUser) {
    const [membership, invite] = await Promise.all([
      prisma.poolMember.findFirst({
        where: { pool_id: pool.id, user_id: supabaseUser.id },
      }),
      prisma.poolInvite.findFirst({
        where: {
          pool_id: pool.id,
          email: { equals: supabaseUser.email!, mode: "insensitive" },
          status: "Invited",
        },
      }),
    ]);
    isAlreadyMember = !!membership;
    hasPendingInvite = !!invite;
  }

  return (
    <JoinPoolClient
      pool={pool}
      code={upperCode}
      isAuthenticated={!!supabaseUser}
      isAlreadyMember={isAlreadyMember}
      hasPendingInvite={hasPendingInvite}
    />
  );
}
