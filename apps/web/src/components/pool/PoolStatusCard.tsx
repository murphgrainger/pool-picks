interface PoolStatusCardProps {
  status: string;
}

export function PoolStatusCard({ status }: PoolStatusCardProps) {
  if (status === "Active" || status === "Locked") return null;

  let statusDescription = "";

  if (status === "Open") {
    statusDescription =
      "This pool is still accepting member picks. You cannot view other members' picks until the commissioner locks the pool prior to the tournament start.";
  } else if (status === "Complete") {
    statusDescription =
      "The tournament for this pool has finished and the results of the pool are final.";
  } else if (status === "Setup") {
    statusDescription =
      "The commissioner is still setting up this pool. You can make your picks once the field is finalized.";
  }

  return (
    <div className="w-full mt-4 p-4 rounded bg-grey-200">
      <p className="text-white text-xs">&#11088; {statusDescription}</p>
    </div>
  );
}
