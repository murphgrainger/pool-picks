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
  existingInviteEmails: string[];
  onInviteCreated: (invite: { id: number; email: string; nickname: string; status: string }) => void;
  isAdmin: boolean;
}

export function PoolAdminPanel({
  poolId,
  tournamentId,
  currentStatus,
  existingInviteEmails,
  onInviteCreated,
  isAdmin,
}: PoolAdminPanelProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: currentStatus,
    label: currentStatus,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingNotify, setPendingNotify] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAction, setSyncingAction] = useState<string | null>(null);

  const tournamentHealth = trpc.tournament.getHealth.useQuery(
    { id: tournamentId },
    { enabled: isAdmin }
  );

  const updatePool = trpc.pool.updateStatus.useMutation({
    onSuccess: () => {
      if (pendingStatus) {
        setSelectedOption({ value: pendingStatus, label: pendingStatus });
      }
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

    if (option.value === "Open" && currentStatus === "Setup") {
      setPendingStatus(option.value);
      setShowConfirmModal(true);
      return;
    }

    setSelectedOption(option);
    updatePool.mutate({ pool_id: poolId, status: option.value });
  };

  const confirmOpen = (notify: boolean) => {
    setPendingNotify(notify);
    updatePool.mutate({ pool_id: poolId, status: "Open", notify });
  };

  const syncTournamentData = async (action: "athletes" | "rankings" | "scores") => {
    setIsSyncing(true);
    setSyncingAction(action);

    const labels: Record<string, string> = {
      athletes: "athlete field",
      rankings: "rankings",
      scores: "scores",
    };
    const label = labels[action];

    try {
      const url =
        action === "rankings"
          ? `/api/scrape/${action}`
          : `/api/scrape/tournaments/${tournamentId}/${action}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.message ||
          (response.status === 504
            ? `Timed out updating ${label}. Try again.`
            : `Failed to update ${label} (${response.status}).`);
        toast.error(message);
        return;
      }

      const data = await response.json();
      toast.success(data.message || `Successfully updated ${label}!`);
      tournamentHealth.refetch();
    } catch {
      toast.error(`Network error updating ${label}.`);
    } finally {
      setIsSyncing(false);
      setSyncingAction(null);
    }
  };

  const poolStatuses = ["Setup", "Open", "Locked", "Active", "Complete"];
  const selectOptions: SelectValues[] = poolStatuses.map((el) => ({
    value: el,
    label: el,
  }));

  return (
    <div className="shadow rounded bg-grey-200 w-full m-2 text-white">
      <div className="p-5 flex flex-col space-y-2">
        <label>Pool Status</label>
        <Select
          instanceId="status"
          name="status"
          onChange={(option) => handleStatusChange(option as SelectValues | null)}
          options={selectOptions}
          value={selectedOption}
          isDisabled={updatePool.isPending}
          className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
        />
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-grey-100">
            <label className="text-sm font-medium text-grey-50">Tournament Data</label>
            {tournamentHealth.data && (
              <div className="flex gap-3 mt-2 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    tournamentHealth.data.athleteCount > 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {tournamentHealth.data.athleteCount > 0
                    ? `${tournamentHealth.data.athleteCount} athletes`
                    : "No field"}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    tournamentHealth.data.scoredCount > 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {tournamentHealth.data.scoredCount > 0
                    ? `${tournamentHealth.data.scoredCount} with scores`
                    : "No scores"}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                className="text-sm bg-grey-100 px-3 py-2 rounded hover:bg-grey-75 disabled:opacity-50"
                onClick={() => syncTournamentData("athletes")}
                disabled={isSyncing}
              >
                {isSyncing && syncingAction === "athletes" ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-3 h-3 mr-2" />
                    Syncing...
                  </span>
                ) : (
                  "Sync Field"
                )}
              </button>
              <button
                className="text-sm bg-grey-100 px-3 py-2 rounded hover:bg-grey-75 disabled:opacity-50"
                onClick={() => syncTournamentData("rankings")}
                disabled={isSyncing}
              >
                {isSyncing && syncingAction === "rankings" ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-3 h-3 mr-2" />
                    Syncing...
                  </span>
                ) : (
                  "Sync Rankings"
                )}
              </button>
              <button
                className="text-sm bg-grey-100 px-3 py-2 rounded hover:bg-grey-75 disabled:opacity-50"
                onClick={() => syncTournamentData("scores")}
                disabled={isSyncing}
              >
                {isSyncing && syncingAction === "scores" ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-3 h-3 mr-2" />
                    Syncing...
                  </span>
                ) : (
                  "Sync Scores"
                )}
              </button>
            </div>
          </div>
        )}
        {selectedOption.value === "Setup" && (
          <div className="mt-8">
            <PoolInviteForm
              poolId={poolId}
              existingInviteEmails={existingInviteEmails}
              onInviteCreated={onInviteCreated}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-grey-200 rounded p-6 max-w-sm mx-4 text-white">
            <h3 className="text-lg font-bold mb-3">Open this pool?</h3>
            <p className="text-sm text-grey-50 mb-4">
              Opening the pool allows members to make their picks. You can also
              notify the following invitees by email:
            </p>
            {existingInviteEmails.length > 0 && (
              <ul className="text-xs text-grey-50 mb-6 space-y-1">
                {existingInviteEmails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            )}
            {existingInviteEmails.length === 0 && (
              <p className="text-xs text-grey-50 italic mb-6">No pending invites.</p>
            )}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => confirmOpen(true)}
                disabled={updatePool.isPending}
                className="w-full px-4 py-2 rounded bg-green-500 hover:bg-green-300 text-black font-medium"
              >
                {updatePool.isPending && pendingNotify === true ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    Opening...
                  </span>
                ) : (
                  "Open & Notify"
                )}
              </button>
              <button
                onClick={() => confirmOpen(false)}
                disabled={updatePool.isPending}
                className="w-full px-4 py-2 rounded bg-grey-100 hover:bg-grey-75 text-white"
              >
                {updatePool.isPending && pendingNotify === false ? (
                  <span className="flex items-center justify-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    Opening...
                  </span>
                ) : (
                  "Open Without Notifying"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                className="w-full px-4 py-2 rounded text-grey-50 hover:text-white"
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
