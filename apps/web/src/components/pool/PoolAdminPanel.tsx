"use client";

import { useState } from "react";
import Select from "react-select";
import { trpc } from "@/lib/trpc/client";
import { PoolInviteForm } from "./PoolInviteForm";

interface SelectValues {
  value: string;
  label: string;
}

interface PoolAdminPanelProps {
  poolId: number;
  currentStatus: string;
  onInviteCreated: (invite: { id: number; email: string; nickname: string; status: string }) => void;
}

export function PoolAdminPanel({
  poolId,
  currentStatus,
  onInviteCreated,
}: PoolAdminPanelProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: currentStatus,
    label: currentStatus,
  });

  const updatePool = trpc.pool.updateStatus.useMutation();

  const handleStatusChange = async (option: SelectValues | null) => {
    setSelectedOption(option ?? { value: "", label: "" });
    if (option) {
      updatePool.mutate({ pool_id: poolId, status: option.value });
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
        {selectedOption.value === "Setup" && (
          <div className="mt-8">
            <PoolInviteForm
              poolId={poolId}
              onInviteCreated={onInviteCreated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
