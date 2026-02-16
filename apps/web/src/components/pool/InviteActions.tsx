"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface Invite {
  id: number;
  nickname: string;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
  };
}

interface PoolMembership {
  id: number;
  role: string;
  pool: {
    id: number;
    name: string;
    status: string;
    amount_entry: number;
  };
}

interface InviteActionsProps {
  initialInvites: Invite[];
  poolMembers: PoolMembership[];
  userEmail: string;
}

export function InviteActions({
  initialInvites,
  poolMembers,
  userEmail,
}: InviteActionsProps) {
  const [poolInvites, setPoolInvites] = useState(initialInvites);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const router = useRouter();

  const updateInviteStatus = trpc.poolInvite.updateStatus.useMutation({
    onSuccess: (_, variables) => {
      if (variables.status === "Accepted") {
        router.push(`/pool/${variables.pool_id}`);
      } else {
        setPoolInvites(
          poolInvites.filter((invite) => invite.id !== variables.id)
        );
      }
      setLoadingButtonId(null);
    },
    onError: () => {
      setLoadingButtonId(null);
    },
  });

  const handleInvite = (
    invite: Invite,
    status: string
  ) => {
    const buttonId = `${invite.id}-${status === "Accepted" ? "accept" : "reject"}`;
    setLoadingButtonId(buttonId);
    updateInviteStatus.mutate({
      id: invite.id,
      status,
      pool_id: invite.pool.id,
      nickname: invite.nickname,
      email: userEmail,
    });
  };

  return (
    <div className="container max-w-xl mx-auto flex flex-wrap items-center flex-col bg-black">
      <div className="w-full p-6 rounded bg-grey-100 text-white text-xs">
        <p className="text-center font-bold">PoolPicks</p>
        <p className="text-center">
          Create a pool or accept an invitation to get started.
        </p>
      </div>
      <div className="flex flex-col justify-center items-center flex-wrap rounded bg-grey-200 w-full mt-4 pt-8 px-6 text-white">
        {poolInvites.map((invite) => (
          <div
            className="p-4 bg-yellow w-full rounded mb-6 text-black"
            key={invite.id}
          >
            <div className="text-center">
              <span>You have been invited to:</span>
              <h3>{invite.pool.name}</h3>
              <p className="pb-2">${invite.pool.amount_entry} Ante</p>
              <div className="flex flex-wrap justify-center">
                <button
                  disabled={loadingButtonId !== null}
                  className="button-tertiary bg-green-500"
                  onClick={() => handleInvite(invite, "Accepted")}
                >
                  {loadingButtonId === `${invite.id}-accept` ? (
                    <span className="flex items-center justify-center">
                      <Spinner className="w-6 h-6 mr-1" />
                      Accepting...
                    </span>
                  ) : (
                    <span>Accept</span>
                  )}
                </button>
                <button
                  disabled={loadingButtonId !== null}
                  className="button-tertiary bg-red-300"
                  onClick={() => handleInvite(invite, "Rejected")}
                >
                  {loadingButtonId === `${invite.id}-reject` ? (
                    <span className="flex items-center justify-center">
                      <Spinner className="w-6 h-6 mr-1" />
                      Declining...
                    </span>
                  ) : (
                    <span>Decline</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {!poolMembers.length && !poolInvites.length && (
          <p className="text-center pb-8">
            You currently aren't in any active pools. Create one or ask a
            commissioner to invite you!
          </p>
        )}

        {poolMembers.map((member) => (
          <div
            className="p-4 mb-6 bg-grey-100 w-full rounded"
            key={member.id}
          >
            <div className="text-center">
              <h3 className="mb-2">{member.pool.name}</h3>
              <p className="mb-4">{member.pool.status}</p>
              <div className="flex flex-wrap justify-center">
                <Link
                  href={`/pool/${member.pool.id}`}
                  className="rounded bg-grey-200 hover:bg-yellow hover:text-black px-4 py-2"
                >
                  Go To Pool
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="w-full flex justify-center pb-6">
          <Link
            href="/pool/create"
            className="rounded bg-green-500 text-black font-medium px-6 py-2 hover:bg-green-300"
          >
            Create a Pool
          </Link>
        </div>
      </div>
    </div>
  );
}
