import type { PoolPhase } from "@pool-picks/utils";

interface PoolStatusCardProps {
  phase: PoolPhase;
}

function phaseStyle(phase: PoolPhase) {
  switch (phase) {
    case "setup":
      return "border-blue-400 text-blue-700";
    case "open":
      return "border-gold text-yellow";
    case "completed":
      return "border-grey-300 text-grey-75";
    default:
      return "border-grey-300 text-grey-75";
  }
}

export function PoolStatusCard({ phase }: PoolStatusCardProps) {
  if (phase === "live" || phase === "locked-awaiting") return null;

  let statusDescription = "";

  if (phase === "open") {
    statusDescription =
      "This pool is still accepting member picks. You cannot view other members' picks until the commissioner locks the pool prior to the tournament start.";
  } else if (phase === "completed") {
    statusDescription =
      "The tournament for this pool has finished and the results of the pool are final.";
  } else if (phase === "setup") {
    statusDescription =
      "The commissioner is still setting up this pool. You can make your picks once the field is finalized.";
  }

  return (
    <div className={`w-full mt-4 pl-3 py-2 border-l-2 ${phaseStyle(phase)}`}>
      <p className="text-xs leading-relaxed">{statusDescription}</p>
    </div>
  );
}
