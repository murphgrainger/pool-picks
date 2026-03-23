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
  currentStatus: string;
  existingInviteEmails: string[];
  onInviteCreated: (invite: { id: number; email: string; nickname: string; status: string }) => void;
}

export function PoolAdminPanel({
  poolId,
  currentStatus,
  existingInviteEmails,
  onInviteCreated,
}: PoolAdminPanelProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: currentStatus,
    label: currentStatus,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingNotify, setPendingNotify] = useState<boolean | null>(null);

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
