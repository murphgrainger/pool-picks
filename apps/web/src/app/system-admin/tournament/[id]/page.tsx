"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  formattedDate,
  formatTournamentDates,
  resolveTournamentStatus,
  getTournamentStatus,
} from "@pool-picks/utils";
import { Spinner } from "@/components/ui/Spinner";

interface SelectValues {
  value: string;
  label: string;
}

export default function TournamentAdminPage() {
  const params = useParams();
  const id = Number(params?.id);

  const { data: tournament, isLoading: tournamentLoading } =
    trpc.tournament.getById.useQuery({ id });

  const tournamentHealth = trpc.tournament.getHealth.useQuery({ id });

  const updateTournament = trpc.tournament.updateStatus.useMutation();

  const [selectedOption, setSelectedOption] = useState<SelectValues>({
    value: "",
    label: "",
  });
  const [isScraping, setIsScraping] = useState(false);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    if (tournament) {
      const resolved = resolveTournamentStatus(tournament);
      setSelectedOption({
        value: resolved,
        label: resolved,
      });
      setUpdatedAt(
        tournament.updated_at
          ? formattedDate(new Date(tournament.updated_at))
          : ""
      );
    }
  }, [tournament]);

  if (tournamentLoading || !tournament)
    return (
      <div className="container mx-auto max-w-xl flex items-center justify-center text-white p-8">
        <Spinner />
      </div>
    );

  const resolvedStatus = resolveTournamentStatus(tournament);
  const dateBasedStatus = getTournamentStatus(
    tournament.start_date,
    tournament.end_date
  );
  const needsCompletionConfirm =
    dateBasedStatus === "Completed" && resolvedStatus === "Active";

  const handleStatusChange = async (option: SelectValues | null) => {
    if (!option) return;
    setSelectedOption(option);
    updateTournament.mutate({
      id: tournament.id,
      status: option.value as "Scheduled" | "Active" | "Completed",
    });
  };

  const tournamentStatuses = ["Scheduled", "Active", "Completed"];
  const selectOptions: SelectValues[] = tournamentStatuses.map((el) => ({
    value: el,
    label: el,
  }));

  const scrapeLabels: Record<string, string> = {
    athletes: "athlete field",
    rankings: "rankings",
    scores: "scores",
  };

  const updateData = async (scrapeRoute: string) => {
    setIsScraping(true);
    setLoadingButtonId(scrapeRoute);

    const label = scrapeLabels[scrapeRoute] || scrapeRoute;

    try {
      const url =
        scrapeRoute === "rankings"
          ? `/api/scrape/${scrapeRoute}`
          : `/api/scrape/tournaments/${tournament.id}/${scrapeRoute}`;

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
      setUpdatedAt(formattedDate(new Date()));
      tournamentHealth.refetch();
    } catch {
      toast.error(`Network error updating ${label}.`);
    } finally {
      setIsScraping(false);
      setLoadingButtonId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
        <div className="w-full">
          <h3>{tournament.name}</h3>
          <p className="text-sm text-grey-50">
            {formatTournamentDates(tournament.start_date, tournament.end_date)}
          </p>
          <p>Last Updated: {updatedAt}</p>
          {tournamentHealth.data && (
            <div className="flex gap-3 mt-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tournamentHealth.data.athleteCount > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {tournamentHealth.data.athleteCount > 0
                  ? `${tournamentHealth.data.athleteCount} athletes in field`
                  : "No field synced"}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tournamentHealth.data.scoredCount > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {tournamentHealth.data.scoredCount > 0
                  ? `${tournamentHealth.data.scoredCount} with scores`
                  : "No scores yet"}
              </span>
            </div>
          )}

          {/* Completion confirmation prompt */}
          {needsCompletionConfirm && (
            <div className="mt-4 p-4 rounded bg-green-500/20 border border-green-500/30">
              <p className="text-green-300 text-sm font-medium mb-2">
                Tournament end date has passed. Mark as completed?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange({ value: "Completed", label: "Completed" })}
                  disabled={updateTournament.isPending}
                  className="text-sm bg-green-500 text-black font-medium px-4 py-2 rounded hover:bg-green-300"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusChange({ value: "Active", label: "Active" })}
                  disabled={updateTournament.isPending}
                  className="text-sm bg-grey-100 text-white px-4 py-2 rounded hover:bg-grey-75"
                >
                  Keep Active (Rain Delay)
                </button>
              </div>
            </div>
          )}

          <div className="mt-2">
            <label htmlFor="status">Tournament Status:</label>
            <Select
              instanceId="status"
              name="status"
              onChange={(option) =>
                handleStatusChange(option as SelectValues | null)
              }
              options={selectOptions}
              value={selectedOption}
              isDisabled={isScraping}
              className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {(resolvedStatus === "Scheduled" || resolvedStatus === "Active") && (
              <div className="mt-6 flex flex-col">
                <button
                  className="bg-grey-200 m-2 hover:bg-green-700"
                  onClick={() => updateData("athletes")}
                  disabled={isScraping}
                >
                  {isScraping && loadingButtonId === "athletes"
                    ? "Updating..."
                    : "Update Field"}
                </button>
                <button
                  className="bg-grey-200 m-2 hover:bg-green-700"
                  onClick={() => updateData("rankings")}
                  disabled={isScraping}
                >
                  {isScraping && loadingButtonId === "rankings"
                    ? "Updating..."
                    : "Update Rankings"}
                </button>
                <button
                  className="bg-grey-200 m-2 hover:bg-green-700"
                  onClick={() => updateData("scores")}
                  disabled={isScraping}
                >
                  {isScraping && loadingButtonId === "scores"
                    ? "Updating..."
                    : "Update Scores"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
