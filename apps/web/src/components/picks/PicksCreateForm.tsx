"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import Select from "react-select";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/Spinner";

interface SelectValues {
  value: number;
  label: string;
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

  const [picks, setPicks] = useState<Array<{ id: number; full_name: string } | null>>([
    null, null, null, null, null, null,
  ]);

  const createPicks = trpc.poolMember.submitPicks.useMutation({
    onSuccess: () => {
      router.refresh();
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

  const selectOptions: SelectValues[] = availableAthletes.map((athlete) => {
    const group =
      athlete.ranking && athlete.ranking <= 20 ? "(A Group)" : "";
    return {
      value: athlete.id,
      label: `${removeSuffix(athlete.full_name)} ${group}`,
    };
  });

  const handlePickChange = (option: SelectValues | null, index: number) => {
    if (!option) return;
    const newPick = athletes.find((a) => a.id === option.value);
    if (newPick) {
      const newPicks = [...picks];
      newPicks[index] = { id: newPick.id, full_name: newPick.full_name };
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
        className="grid grid-cols-1 gap-y-6 p-4 rounded-lg bg-grey-100"
      >
        <h3>Step 2: Submit Your Picks</h3>
        <ul className="list-none text-lg">
          <span className="font-bold">Pick 6, Use 4</span>
          <li>- Pick 3 players max from the A Group</li>
          <li>- The A Group is the players in the top 20 OWGR</li>
          <li>- The lowest 4 of your 6 player scores is your total score</li>
          <li>- The lowest total score wins</li>
          <li>- You are DQd if less than 4 players make the cut</li>
          <li>- Picks cannot be changed after submission</li>
          <br />
          {tournamentExternalUrl && (
            <li>
              <a
                href={tournamentExternalUrl}
                className="font-bold text-yellow underline"
                target="_blank"
                rel="noreferrer"
              >
                Full Tournament Field
              </a>
            </li>
          )}
          <li>
            <a
              href="https://www.espn.com/golf/rankings"
              className="font-bold text-yellow underline"
              target="_blank"
              rel="noreferrer"
            >
              Official World Golf Rankings (OWGR)
            </a>
          </li>
        </ul>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="text-black">
            <label className="block">
              <span className="text-white">Pick {index + 1}</span>
              <input
                type="hidden"
                {...register(`picks.${index}.id`, { required: true, valueAsNumber: true })}
              />
              <Select
                instanceId={`long-value-select-${index}`}
                name={`pick-${index}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
                onChange={(option) =>
                  handlePickChange(option as SelectValues | null, index)
                }
                options={selectOptions}
              />
            </label>
            {errors?.picks?.[index] && (
              <p className="text-yellow">Pick {index + 1} is required</p>
            )}
          </div>
        ))}
        <button
          disabled={createPicks.isPending}
          type="submit"
          className="my-4 capitalize bg-grey-200 text-white font-medium py-2 px-4 rounded-md hover:bg-yellow hover:text-black"
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
