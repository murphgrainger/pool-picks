"use client";

import { useState } from "react";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";
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

  const updatePool = trpc.pool.updateStatus.useMutation({
    onSuccess: () => {
      if (pendingStatus) {
        setSelectedOption({ value: pendingStatus, label: pendingStatus });
      }
      setShowConfirmModal(false);
      setPendingStatus(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setShowConfirmModal(false);
      setPendingStatus(null);
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

  const confirmOpen = () => {
    updatePool.mutate({ pool_id: poolId, status: "Open" });
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
        <div className="relative">
          <Toaster containerStyle={{ position: "absolute" }} />
        </div>
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
            <p className="text-sm text-grey-50 mb-6">
              This will notify all pool members via email that the field is ready
              and they can make their picks.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                className="px-4 py-2 rounded bg-grey-100 hover:bg-grey-75 text-white"
                disabled={updatePool.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmOpen}
                disabled={updatePool.isPending}
                className="px-4 py-2 rounded bg-green-500 hover:bg-green-300 text-black font-medium"
              >
                {updatePool.isPending ? (
                  <span className="flex items-center">
                    <Spinner className="w-4 h-4 mr-2" />
                    Opening...
                  </span>
                ) : (
                  "Open Pool"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
