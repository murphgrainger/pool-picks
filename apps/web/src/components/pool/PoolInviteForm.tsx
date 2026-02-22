"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface PoolInviteFormProps {
  poolId: number;
  onInviteCreated: (invite: { id: number; email: string; nickname: string; status: string }) => void;
}

export function PoolInviteForm({ poolId, onInviteCreated }: PoolInviteFormProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");

  const createInvite = trpc.poolInvite.create.useMutation({
    onSuccess: (data) => {
      onInviteCreated(data);
      setEmail("");
      setNickname("");
      toast.success("Invite sent successfully!");
    },
    onError: () => {
      toast.error("Error creating invite");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createInvite.mutate({ pool_id: poolId, email, nickname });
  };

  return (
    <div className="w-full bg-grey-100 rounded p-4 mt-4">
      <Toaster />
      <h3 className="text-lg font-bold mb-4">Create Pool Invite</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded p-2 text-black"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full rounded p-2 text-black"
            placeholder="Enter nickname"
          />
        </div>
        <button
          type="submit"
          disabled={createInvite.isPending}
          className="w-full bg-green-500 text-black font-medium py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {createInvite.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Creating...
            </span>
          ) : (
            "Create Invite"
          )}
        </button>
      </form>
    </div>
  );
}
