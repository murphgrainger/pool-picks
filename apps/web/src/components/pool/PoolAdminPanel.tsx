"use client";

import { useState } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { PoolInviteForm } from "./PoolInviteForm";
import { Spinner } from "@/components/ui/Spinner";

interface SelectValues {
  value: string;
  label: string;
}

interface PoolAdminPanelProps {
  poolId: number;
  tournamentId: number;
  currentStatus: string;
  tournamentStatus: string;
  inviteCode: string | null;
  joinMode: string;
  existingInviteEmails: string[];
  onInviteCreated: (invite: {
    id: number;
    email: string;
    nickname: string;
    status: string;
  }) => void;
  onStatusChange: (newStatus: string) => void;
}

export function PoolAdminPanel({
  poolId,
  tournamentId,
  currentStatus,
  tournamentStatus,
  inviteCode,
  joinMode: initialJoinMode,
  existingInviteEmails,
  onInviteCreated,
  onStatusChange,
}: PoolAdminPanelProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: currentStatus,
    label: currentStatus,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingNotify, setPendingNotify] = useState<boolean | null>(null);
  const [joinMode, setJoinMode] = useState(initialJoinMode);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEmailInvites, setShowEmailInvites] = useState(initialJoinMode !== "OPEN");

  const tournamentHealth = trpc.tournament.getHealth.useQuery({
    id: tournamentId,
  });

  const updateJoinMode = trpc.pool.updateJoinMode.useMutation({
    onSuccess: (_data, variables) => {
      setJoinMode(variables.join_mode);
      toast.success(`Join mode updated to ${variables.join_mode === "OPEN" ? "open" : "invite-only"}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const updatePool = trpc.pool.updateStatus.useMutation({
    onSuccess: (_data, variables) => {
      const newStatus = variables.status;
      setSelectedOption({ value: newStatus, label: newStatus });
      onStatusChange(newStatus);
      setShowConfirmModal(false);
      setPendingStatus(null);
      setPendingNotify(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setShowConfirmModal(false);
      setPendingStatus(null);
      setPendingNotify(null);
    },
  });

  const handleStatusChange = async (option: SelectValues | null) => {
    if (!option) return;

    if (option.value === "Open" || option.value === "Locked") {
      setPendingStatus(option.value);
      setShowConfirmModal(true);
      return;
    }

    setSelectedOption(option);
    updatePool.mutate({
      pool_id: poolId,
      status: option.value as "Setup" | "Open" | "Locked" | "Complete",
      notify: false,
    });
  };

  const confirmStatusChange = (notify: boolean) => {
    if (!pendingStatus) return;
    setPendingNotify(notify);
    updatePool.mutate({
      pool_id: poolId,
      status: pendingStatus as "Setup" | "Open" | "Locked" | "Complete",
      notify,
    });
  };

  const poolStatuses = ["Setup", "Open", "Locked", "Complete"];
  const selectOptions: SelectValues[] = poolStatuses.map((el) => ({
    value: el,
    label: el,
  }));

  const showCompletionAlert =
    tournamentStatus === "Completed" && currentStatus !== "Complete";

  return (
    <div className="shadow-sm rounded-lg bg-grey-200 border border-grey-100 w-full m-2">
      <div className="p-5 flex flex-col space-y-2">
        {/* Completion alert */}
        {showCompletionAlert && (
          <div className="p-3 rounded bg-green-50 border border-green-100 mb-2">
            <p className="text-green-700 text-sm">
              Tournament is over! Change the pool status to Complete and share
              the results.
            </p>
          </div>
        )}

        {currentStatus === "Open" && (
          <div className="p-3 rounded bg-gold/10 border border-gold/30 mb-2">
            <p className="text-yellow text-sm">
              Pool will auto-lock at midnight PT the day the tournament starts.
            </p>
          </div>
        )}

        <label>Pool Status</label>
        <Select
          instanceId="status"
          name="status"
          onChange={(option) =>
            handleStatusChange(option as SelectValues | null)
          }
          options={selectOptions}
          value={selectedOption}
          isDisabled={updatePool.isPending}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />

        {/* Invite Link Section */}
        {inviteCode && (currentStatus === "Setup" || currentStatus === "Open") && (
          <div className="mt-4 pt-4 border-t border-grey-300">
            <label className="text-sm font-medium text-grey-75">
              Invite Link
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`}
                className="flex-1 text-sm bg-grey-100 border border-grey-300 rounded px-3 py-2 text-grey-75"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 text-sm rounded bg-green-700 text-white hover:bg-green-900 whitespace-nowrap"
              >
                {linkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm text-grey-75">Join mode:</label>
              <button
                onClick={() =>
                  updateJoinMode.mutate({
                    pool_id: poolId,
                    join_mode: joinMode === "OPEN" ? "INVITE_ONLY" : "OPEN",
                  })
                }
                disabled={updateJoinMode.isPending}
                className={`text-xs px-3 py-1 rounded font-medium ${
                  joinMode === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : "bg-grey-100 text-grey-75"
                }`}
              >
                {joinMode === "OPEN" ? "Open" : "Invite Only"}
              </button>
            </div>
          </div>
        )}

        {/* Email Invite Form */}
        {selectedOption.value === "Setup" && (
          joinMode === "OPEN" ? (
            <>
              <button
                onClick={() => setShowEmailInvites((prev) => !prev)}
                className="flex items-center text-sm text-grey-75 hover:text-black mt-3 self-start p-0"
              >
                <svg
                  className={`w-4 h-4 mr-1 transition-transform ${showEmailInvites ? "" : "-rotate-90"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Send Pool Invite via Email
              </button>
              {showEmailInvites && (
                <PoolInviteForm
                  poolId={poolId}
                  existingInviteEmails={existingInviteEmails}
                  onInviteCreated={onInviteCreated}
                />
              )}
            </>
          ) : (
            <PoolInviteForm
              poolId={poolId}
              existingInviteEmails={existingInviteEmails}
              onInviteCreated={onInviteCreated}
            />
          )
        )}

        {/* Tournament data pills */}
        {tournamentHealth.data && (
          <div className="mt-4 pt-4 border-t border-grey-300">
            <label className="text-sm font-medium text-grey-75">
              Tournament Data
            </label>
            <div className="flex gap-3 mt-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tournamentHealth.data.athleteCount > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {tournamentHealth.data.athleteCount > 0
                  ? `${tournamentHealth.data.athleteCount} athletes`
                  : "No field"}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tournamentHealth.data.scoredCount > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {tournamentHealth.data.scoredCount > 0
                  ? `${tournamentHealth.data.scoredCount} with scores`
                  : "No scores"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            {pendingStatus === "Open" ? (
              <>
                <h3 className="text-lg font-bold mb-3">Open this pool?</h3>
                <p className="text-sm text-grey-75 mb-4">
                  Opening the pool allows members to make their picks. You can
                  also notify the following invitees by email:
                </p>
                {existingInviteEmails.length > 0 && (
                  <ul className="text-xs text-grey-75 mb-6 space-y-1">
                    {existingInviteEmails.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                )}
                {existingInviteEmails.length === 0 && (
                  <p className="text-xs text-grey-75 italic mb-6">
                    No pending invites.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-3">Lock this pool?</h3>
                <p className="text-sm text-grey-75 mb-4">
                  Locking the pool finalizes all picks. Members will be able to
                  see who everyone picked. You can notify all pool members by
                  email.
                </p>
              </>
            )}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => confirmStatusChange(true)}
                disabled={updatePool.isPending}
                className="w-full px-4 py-2 rounded bg-green-700 hover:bg-green-900 text-white font-medium"
              >
                {updatePool.isPending && pendingNotify === true ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    {pendingStatus === "Open" ? "Opening..." : "Locking..."}
                  </span>
                ) : pendingStatus === "Open" ? (
                  "Open & Notify"
                ) : (
                  "Lock & Notify"
                )}
              </button>
              <button
                onClick={() => confirmStatusChange(false)}
                disabled={updatePool.isPending}
                className="w-full px-4 py-2 rounded bg-grey-100 hover:bg-grey-300"
              >
                {updatePool.isPending && pendingNotify === false ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    {pendingStatus === "Open" ? "Opening..." : "Locking..."}
                  </span>
                ) : pendingStatus === "Open" ? (
                  "Open Without Notifying"
                ) : (
                  "Lock Without Notifying"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                className="w-full px-4 py-2 rounded text-grey-75 hover:text-black"
                disabled={updatePool.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
