import { Athlete } from '@prisma/client';
import React, { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import Select from 'react-select';

interface Props {
    athletes: Array<{
        id: number,
        full_name: string,
    }>;
}

interface SelectValues {
    value: number,
    label: string
}

type FormValues = {
    picks: { full_name: string }[];
  }


const PicksCreate: React.FC<Props> = ({athletes}) => {

    const [picks, setPicks] = useState<Array<Athlete | null>>([null, null, null, null]);

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
            if (newPick && picks.every((pick) => pick?.id !== newPick.id)) {
              const newPicks = [...picks];
              newPicks[index] = newPick;
              setPicks(newPicks);
            } else {
                // throw an error saying the athlete was already picked
    
            }
        } catch(error) {
            console.log(error)
        }
      };
      

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
      } = useForm<FormValues>()
  
    const onSubmit: SubmitHandler<FormValues> = (picks) => {

        try {
            console.log(picks);
        } catch(error) {
            console.log(error)
        }
    };

    return (
        <div className="w-full mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6 p-8 rounded-lg bg-red-300">
            <h3>Make Your Picks</h3>
            <p>Here are some generic instructions.</p>
            {[0, 1, 2, 3].map((index) => (
                <label key={index} className="block">
                <span className="text-gray-700">Pick {index + 1}</span>
                <Select
                {...register(`picks.${index}.full_name`, { required: true })}
                name={`pick-${index}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                onChange={(option: SelectValues | null) => handlePickChange(option, index)}
                options={selectOptions} 
                isClearable={true}
                />
                </label>
            ))}
            <button type="submit" className="my-4 capitalize bg-green-500 text-white font-medium py-2 px-4 rounded-md hover:bg-green-600">
                Submit Picks
            </button>
            </form>
        </div>
    )
}

export default PicksCreate;