"use client";

type View = "members" | "players";

interface ViewToggleProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-grey-200 rounded-full p-0.5">
      <button
        onClick={() => onViewChange("members")}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
          view === "members"
            ? "bg-white text-black shadow-sm"
            : "text-grey-75 hover:text-black"
        }`}
      >
        Pool Members
      </button>
      <button
        onClick={() => onViewChange("players")}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
          view === "players"
            ? "bg-white text-black shadow-sm"
            : "text-grey-75 hover:text-black"
        }`}
      >
        Players Picked
      </button>
    </div>
  );
}
