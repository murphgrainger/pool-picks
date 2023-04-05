import { Athlete } from '@prisma/client';
import { useMutation, useQuery, gql } from '@apollo/client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import { useRouter } from 'next/router';
import { SubmitHandler } from 'react-hook-form';

interface Props {
  memberId: number;
  tournamentId: number;
  tournamentExternalUrl: string | null;
}

interface SelectValues {
  value: string;
  label?: string;
}

type FormValues = {
  picks: { id: string }[];
};

const CREATE_PICKS = gql`
  mutation CreatePicks($poolMemberId: Int!, $athleteIds: [Int!]!) {
    createPicks(poolMemberId: $poolMemberId, athleteIds: $athleteIds) {
      athlete {
        id
        full_name
      }
      poolMember {
        id
      }
    }
  }
`;

const PicksCreate: React.FC<Props> = ({ memberId, tournamentId, tournamentExternalUrl }) => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<FormValues>();

  const { loading, error, data } = useQuery(GET_ATHLETES_BY_TOURNAMENT_ID, {
    variables: { tournament_id: tournamentId },
  });

  const athletes = data?.athletesByTournamentId;

  const router = useRouter();
  const [picks, setPicks] = useState<Array<Athlete | null>>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [createPicks] = useMutation(CREATE_PICKS);
  const [isSubmitting, setSubmitting] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const availableAthletes = athletes.filter((athlete: any) => {
    return !picks.some((pick) => pick?.id === athlete.id);
  });

  const selectOptions: SelectValues[] = availableAthletes.map(
    (athlete: any) => {
      const rankingLabel = athlete.ranking ? `(R:${athlete.ranking})`: '';
      const group = athlete.ranking && athlete.ranking <=20 ? `(A)` : `(B)`;
      return ({
        value: athlete.id,
        label: `${athlete.full_name} ${group}`,
      })
    }
  );

  const handlePickChange = (option: SelectValues | null, index: number) => {
    try {
      const newPick = option
        ? (athletes.find((athlete: any) => athlete.id === option.value) as Athlete)
        : undefined;
      if (newPick) {
        const newPicks = [...picks];
        newPicks[index] = newPick;
        setPicks(newPicks);
        setValue(`picks.${index}.id`, option?.value ?? '');
        clearErrors();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data:any) => {
    try {
      setSubmitting(true);
      const athleteIds = data.picks.map((pick:any) => parseInt(pick.id));
      await createPicks({
        variables: { poolMemberId: memberId, athleteIds },
      });
      router.reload();
    } catch (error) {
      console.log('error', error);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-y-6 p-4 rounded-lg bg-grey-100"
      >
        <h3>Submit Your Picks</h3>
       <ul className="list-none text-lg">
          <span className="font-bold">Pick 6, Use 4</span>
          <li>- A max of 3 picks can be picked from the A Group</li>
          <li>- Players in the top 20 OWGR are in the A Group</li>
          <li>- The lowest 4 of your 6 player scores makes up your total</li>
          <li>- The lowest total score wins</li>
          <li>- You are DQd if less than 4 players make the cut</li>
          <li>- Picks cannot be changed after submission</li>
          <br></br>
          { tournamentExternalUrl &&
          <li><a href={tournamentExternalUrl} className="font-bold text-yellow underline" target="_blank" rel="noreferrer">Full Tournament Field</a></li>
        }
        <li><a href='https://www.espn.com/golf/rankings' className="font-bold text-yellow underline" target="_blank" rel="noreferrer">Official World Golf Rankings (OWGR)</a></li>
       
        </ul>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="text-black">
            <label className="block">
              <span className="text-white">Pick {index + 1}</span>
              <input
                type="hidden"
                className='text-black'
                {...register(`picks.${index}.id`, { required: true })}
              />
              <Select
                instanceId={`long-value-select-${index}`}
                name={`pick-${index}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
                onChange={(option: SelectValues | null) =>
                  handlePickChange(option, index)
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
          disabled={isSubmitting}
          type="submit"
          className="my-4 capitalize bg-grey-200 text-white font-medium py-2 px-4 rounded-md hover:bg-yellow hover:text-black"
        >
                {isSubmitting ? (
                    <span className="flex items-center justify-center">
                    <svg
                        className="w-6 h-6 animate-spin mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    Submitting Picks...
                    </span>
                ) : (
                    <span>Submit Picks</span>
                )}
                </button>
            </form>
        </div>
    )
}

export default PicksCreate;

const GET_ATHLETES_BY_TOURNAMENT_ID = gql`
  query athletesByTournamentId($tournament_id: Int!) {
    athletesByTournamentId(tournament_id: $tournament_id) {
      id
      full_name,
      ranking
    }
  }
`;

