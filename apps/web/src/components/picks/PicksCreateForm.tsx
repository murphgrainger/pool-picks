"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Select from "react-select";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";
import { MAX_A_GROUP_PICKS } from "@pool-picks/utils";

interface SelectValues {
  value: number;
  label: string;
  isAGroup: boolean;
  isDisabled: boolean;
}

type FormValues = {
  picks: { id: number }[];
};

interface PicksCreateFormProps {
  memberId: number;
  tournamentId: number;
  tournamentExternalUrl: string | null;
}

export function PicksCreateForm({
  memberId,
  tournamentId,
  tournamentExternalUrl,
}: PicksCreateFormProps) {
  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<FormValues>();

  const { data: athletes, isLoading, error } = trpc.athlete.listByTournament.useQuery({
    tournament_id: tournamentId,
  });

  const [picks, setPicks] = useState<Array<{ id: number; full_name: string; isAGroup: boolean } | null>>([
    null, null, null, null, null, null,
  ]);

  const createPicks = trpc.poolMember.submitPicks.useMutation({
    onSuccess: () => {
      toast.success("Picks submitted!");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit picks. Please try again.");
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!athletes) return null;

  const availableAthletes = athletes.filter(
    (athlete) => !picks.some((pick) => pick?.id === athlete.id)
  );

  function removeSuffix(str: string) {
    return str.replace(/\s*\(a\)$/, "");
  }

  const aGroupPickCount = picks.filter((p) => p?.isAGroup).length;
  const aGroupFull = aGroupPickCount >= MAX_A_GROUP_PICKS;

  const selectOptions = availableAthletes
    .map((athlete) => {
      const isAGroup = !!(athlete.ranking && athlete.ranking <= 20);
      return {
        value: athlete.id,
        label: `${removeSuffix(athlete.full_name)} ${isAGroup ? "(A Group)" : ""}`,
        isAGroup,
        isDisabled: isAGroup && aGroupFull,
      };
    })
    .sort((a, b) => {
      if (a.isAGroup !== b.isAGroup) return a.isAGroup ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

  const handlePickChange = (option: SelectValues | null, index: number) => {
    const newPicks = [...picks];
    if (!option) {
      newPicks[index] = null;
      setPicks(newPicks);
      setValue(`picks.${index}.id`, undefined as unknown as number);
      return;
    }
    const newPick = athletes.find((a) => a.id === option.value);
    if (newPick) {
      const isAGroup = !!(newPick.ranking && newPick.ranking <= 20);
      newPicks[index] = { id: newPick.id, full_name: newPick.full_name, isAGroup };
      setPicks(newPicks);
      setValue(`picks.${index}.id`, option.value);
      clearErrors();
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const athleteIds = data.picks.map((pick) => pick.id);
    createPicks.mutate({ poolMemberId: memberId, athleteIds });
  };

  return (
    <div className="w-full mt-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-y-6 p-4 rounded-lg bg-grey-200 border border-grey-100"
      >
        <h3>Submit Your Picks</h3>
        <ul className="list-none text-lg">
          <span className="font-bold">Pick 6, Use 4</span>
          <li>- Pick 3 players max from the A Group</li>
          <li>- The A Group is the players in the top 20 OWGR</li>
          <li>- The lowest 4 of your 6 player scores is your total score</li>
          <li>- The lowest total score wins</li>
          <li>- You are DQd if less than 4 players make the cut</li>
          <li>- Picks cannot be changed after submission</li>
        </ul>
        <div className="flex flex-col gap-2">
            {tournamentExternalUrl && (
              <a
                href={tournamentExternalUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Full Tournament Field
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <a
              href="https://www.espn.com/golf/rankings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Official World Golf Rankings (OWGR)
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
        </div>
        <p className={`text-sm font-medium ${aGroupFull ? "text-red-500" : "text-grey-75"}`}>
          A Group picks: {aGroupPickCount} / {MAX_A_GROUP_PICKS}
        </p>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <input
              type="hidden"
              {...register(`picks.${index}.id`, { required: true, valueAsNumber: true })}
            />
            <Select
              instanceId={`long-value-select-${index}`}
              name={`pick-${index}`}
              placeholder={`Pick ${index + 1}`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={picks[index] ? selectOptions.find((o) => o.value === picks[index]?.id) ?? { value: picks[index]!.id, label: picks[index]!.full_name, isAGroup: picks[index]!.isAGroup, isDisabled: false } : null}
              onChange={(option) =>
                handlePickChange(option as SelectValues | null, index)
              }
              options={selectOptions}
              isClearable
              isOptionDisabled={(option) => option.isDisabled}
            />
            {errors?.picks?.[index] && (
              <p className="text-red-500">Pick {index + 1} is required</p>
            )}
          </div>
        ))}
        <button
          disabled={createPicks.isPending}
          type="submit"
          className="my-4 capitalize bg-green-700 text-white font-medium py-2 px-4 rounded-md hover:bg-gold hover:text-black"
        >
          {createPicks.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="w-6 h-6 mr-1" />
              Submitting Picks...
            </span>
          ) : (
            <span>Submit Picks</span>
          )}
        </button>
      </form>
    </div>
  );
}
