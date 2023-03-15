import { Athlete } from '@prisma/client';
import { useMutation, gql } from '@apollo/client';
import React, { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import Select from 'react-select';
import { useRouter } from 'next/router';


interface Props {
    athletes: Array<{
        id: number,
        full_name: string,
    }>;
}

interface SelectValues {
    value: number,
    label?: string
}

type FormValues = {
    picks: { id: number }[];
  }

  const CREATE_PICKS = gql`
  mutation CreatePicks($poolMemberId: ID!, $athleteIds: [ID!]!) {
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

const PicksCreate: React.FC<Props> = ({athletes}) => {

    const router = useRouter();
    const [picks, setPicks] = useState<Array<Athlete | null>>([null, null, null, null]);
    const [createPicks] = useMutation(CREATE_PICKS);

    const availableAthletes = athletes.filter((athlete) => {
        return !picks.some((pick) =>  pick?.id === athlete.id );
      });
      
      const selectOptions: SelectValues[] = availableAthletes.map((athlete) => ({
        value: athlete.id,
        label: athlete.full_name
      }));

    const handlePickChange = (option: SelectValues | null, index: number) => {
        try {
            const newPick = option ? athletes.find((athlete) => athlete.id === option.value) as Athlete : undefined;
            if (newPick) {
              const newPicks = [...picks];
              newPicks[index] = newPick;
              setPicks(newPicks);
              setValue(`picks.${index}.id`, option?.value ?? 0);
              clearErrors();
             }
        } catch(error) {
            console.log(error)
        }
      };
      
      const {
        setValue,
        handleSubmit,
        formState: { errors },
        setError,
        clearErrors,
        reset
      } = useForm<FormValues>()
  
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
              const poolMemberId = 1;
              const athleteIds = data.picks.map((pick) => pick.id);
              const response = await createPicks({
                variables: { poolMemberId, athleteIds },
              });
              console.log('Response:', response);
              router.reload();
          } catch (error) {
            console.log('error!!!', error);
          }
    };

    return (
        <div className="w-full mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6 p-4 rounded-lg bg-blue-200">
            <h3>Make Your Picks</h3>
            <p>Here are some generic instructions.</p>
            {[0, 1, 2, 3].map((index) => (
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