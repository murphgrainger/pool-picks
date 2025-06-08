import React, { useState } from "react";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import toast, { Toaster } from "react-hot-toast";

const CREATE_POOL_INVITE = gql`
  mutation ($email: String!, $nickname: String!, $pool_id: Int!) {
    createPoolInvite(email: $email, nickname: $nickname, pool_id: $pool_id) {
      id
      email
      nickname
      status
    }
  }
`;

const GET_POOL = gql`
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      poolInvites {
        id
        email
        nickname
        status
      }
    }
  }
`;

interface Props {
  poolId: number;
  onInviteCreated: (invite: any) => void;
}

const PoolInviteForm: React.FC<Props> = ({ poolId, onInviteCreated }) => {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const client = useApolloClient();
  const [createInvite, { loading }] = useMutation(CREATE_POOL_INVITE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await toast.promise(
        createInvite({
          variables: {
            email,
            nickname,
            pool_id: poolId,
          },
          update: (cache, { data }) => {
            // Refetch the pool data to update the invites list
            client.query({
              query: GET_POOL,
              variables: { id: poolId },
              fetchPolicy: "network-only",
            });
          },
        }),
        {
          loading: "Creating invite...",
          success: "Invite sent successfully! 🎉",
          error: "Error creating invite 😥",
        }
      );

      // Call the callback with the new invite
      if (result.data?.createPoolInvite) {
        onInviteCreated(result.data.createPoolInvite);
      }

      // Clear form
      setEmail("");
      setNickname("");
    } catch (error) {
      console.error("Error creating invite:", error);
    }
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
          disabled={loading}
          className="w-full bg-green-500 text-black font-medium py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-6 h-6 animate-spin mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              Creating...
            </span>
          ) : (
            "Create Invite"
          )}
        </button>
      </form>
    </div>
  );
};

export default PoolInviteForm;
