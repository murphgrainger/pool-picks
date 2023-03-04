import { Athlete } from '@prisma/client';
import React, { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';


interface Props {
    athletes: Array<{
        id: number,
        full_name: string,
    }>;
}

type FormValues = {
    picks: { full_name: string }[];
  }

const PicksCreate: React.FC<Props> = ({athletes}) => {
    const [picks, setPicks] = useState<Array<Athlete | null>>([null, null, null, null]);
    console.log(athletes)
    const handlePickChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {


        
      const newPick = athletes.find((athlete) => athlete.full_name.toLowerCase() === event.target.value.toLowerCase()) as Athlete;
      console.log('new', newPick)
      if (newPick && picks.every((pick) => pick?.id !== newPick.id)) {
        const newPicks = [...picks];
        newPicks[index] = newPick;
        setPicks(newPicks);
      }
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
      } = useForm<FormValues>()
  
    const onSubmit: SubmitHandler<FormValues> = (picks) => {
        console.log(picks);
    };

    return (
        <div className="w-full mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6 p-8 rounded-lg bg-red-300">
            <h3>Make Your Picks</h3>
            <p>Here are some generic instructions.</p>
            {[0, 1, 2, 3].map((index) => (
                <label key={index} className="block">
                <span className="text-gray-700">Pick {index + 1}</span>
                <input
                    {...register(`picks.${index}.full_name`, { required: true })}
                    name={`pick-${index}`}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={handlePickChange(index)}
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