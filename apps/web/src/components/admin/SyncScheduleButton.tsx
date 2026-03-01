"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export function SyncScheduleButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/scrape/schedule", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const message =
          res.status === 504
            ? "Request timed out. The sync may have partially completed — try again to finish."
            : `Server error (${res.status}). Please try again.`;
        setResult({ message, isError: true });
        return;
      }

      const data = await res.json();
      setResult({ message: data.message, isError: false });
    } catch {
      setResult({
        message: "Network error. Please check your connection and try again.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="bg-green-500 text-black font-medium py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center">
            <Spinner className="w-4 h-4 mr-2" />
            Syncing...
          </span>
        ) : (
          "Sync Tournament Schedule"
        )}
      </button>
      {result && (
        <p
          className={`text-sm ${result.isError ? "text-red-400" : "text-green-400"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
