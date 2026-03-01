"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { formattedDate } from "@pool-picks/utils";
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

  const updateTournament = trpc.tournament.updateStatus.useMutation();

  const [selectedOption, setSelectedOption] = useState<SelectValues>({
    value: "",
    label: "",
  });
  const [isActive, setActiveTournament] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [scrapeResult, setScrapeResult] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (tournament) {
      setSelectedOption({
        value: tournament.status,
        label: tournament.status,
      });
      setActiveTournament(tournament.status === "Active");
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

  const handleStatusChange = async (option: SelectValues | null) => {
    if (!option) return;
    setActiveTournament(option.value === "Active");
    setSelectedOption(option);

    updateTournament.mutate({ id: tournament.id, status: option.value });
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
    setScrapeResult(null);

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
        const message =
          response.status === 504
            ? `Timed out updating ${label}. It may have partially completed — try again.`
            : `Failed to update ${label} (${response.status}). Please try again.`;
        setScrapeResult({ message, isError: true });
        return;
      }

      const data = await response.json();
      setScrapeResult({
        message: data.message || `Successfully updated ${label}!`,
        isError: false,
      });
      setUpdatedAt(formattedDate(new Date()));
    } catch {
      setScrapeResult({
        message: `Network error updating ${label}. Please check your connection and try again.`,
        isError: true,
      });
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
          <p>Last Updated: {updatedAt}</p>
          <div className="mt-2">
            <label htmlFor="status">Update Status:</label>
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
            {isActive && (
              <div className="mt-6 flex flex-col">
                {tournament.status === "Scheduled" && (
                  <button
                    className="bg-grey-200 m-2 hover:bg-green-700"
                    onClick={() => updateData("athletes")}
                    disabled={isScraping}
                  >
                    {isScraping && loadingButtonId === "athletes"
                      ? "Updating..."
                      : "Update Field"}
                  </button>
                )}
                {tournament.status === "Scheduled" && (
                  <button
                    className="bg-grey-200 m-2 hover:bg-green-700"
                    onClick={() => updateData("rankings")}
                    disabled={isScraping}
                  >
                    {isScraping && loadingButtonId === "rankings"
                      ? "Updating..."
                      : "Update Rankings"}
                  </button>
                )}
                <button
                  className="bg-grey-200 m-2 hover:bg-green-700"
                  onClick={() => updateData("scores")}
                  disabled={isScraping}
                >
                  {isScraping && loadingButtonId === "scores"
                    ? "Updating..."
                    : "Update Scores"}
                </button>
                {scrapeResult && (
                  <p
                    className={`text-sm mt-2 text-center ${scrapeResult.isError ? "text-red-400" : "text-green-400"}`}
                  >
                    {scrapeResult.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
