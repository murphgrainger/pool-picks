import { Athlete } from '@prisma/client';
import { useMutation, useQuery, gql } from '@apollo/client';
import React, { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import Select from 'react-select';
import { useRouter } from 'next/router';

interface Props {
    memberId: number,
    tournamentId: number
}

interface SelectValues {
    value: string,
    label?: string
}

type FormValues = {
    picks: { id: string }[];
  }

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

const PicksCreate: React.FC<Props> = ({memberId, tournamentId}) => {

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    reset
  } = useForm<FormValues>()

    const { loading, error, data } = useQuery(GET_ATHLETES_BY_TOURNAMENT_ID, {
      variables: { tournament_id: tournamentId },
    });

    const athletes = data?.athletesByTournamentId;

    const router = useRouter();
    const [picks, setPicks] = useState<Array<Athlete | null>>([null, null, null, null, null, null]);
    const [createPicks] = useMutation(CREATE_PICKS);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const availableAthletes = athletes.filter((athlete: any) => {
        return !picks.some((pick) =>  pick?.id === athlete.id );
      });
      
      const selectOptions: SelectValues[] = availableAthletes.map((athlete: any) => ({
        value: athlete.id,
        label: athlete.full_name
      }));

    const handlePickChange = (option: SelectValues | null, index: number) => {
        try {
            const newPick = option ? athletes.find((athlete:any) => athlete.id === option.value) as Athlete : undefined;
            if (newPick) {
              const newPicks = [...picks];
              newPicks[index] = newPick;
              setPicks(newPicks);
              setValue(`picks.${index}.id`, option?.value ?? "");
              clearErrors();
             }
        } catch(error) {
            console.log(error)
        }
      };
  
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
              const athleteIds = data.picks.map((pick) => parseInt(pick.id));
              await createPicks({
                variables: { poolMemberId: memberId, athleteIds },
              });
              router.reload();
          } catch (error) {
            console.log('error', error);
          }
    };

    return (
        <div className="w-full mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6 p-4 rounded-lg bg-blue-200">
            <h3>Submit Your Picks</h3>
            <ul className="list-none"><span className="font-bold">Pick 6, Use 4</span>
              <li>- A maximum of 3 players can be picked from the A Group.</li>
              <li>- The best 4 of your 6 to par player scores make up your total score. </li>
              <li>- You are DQd if less than 4 players make the cut.</li>
              <li>- The lowest total score wins.</li>
            </ul>
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <label key={index} className="block">
                <span className="text-gray-700">Pick {index + 1}</span>
                <Select
                instanceId="long-value-select"
                name={`pick-${index}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                onChange={(option: SelectValues | null) => handlePickChange(option, index)}
                options={selectOptions} 
                />
                </label>
            ))}
            {errors?.picks && <p>{errors.picks.message}</p>}
            <button type="submit" className="my-4 capitalize bg-green-500 text-white font-medium py-2 px-4 rounded-md hover:bg-green-600">
                Submit Picks
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
      full_name
    }
  }
`;

