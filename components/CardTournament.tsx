import React from 'react';

interface Props {
  id: number;
  name: string;
  course: string;
  city: string;
  region: string;
  start_date: Date;
  end_date: Date;
}

export const CardTournament: React.FC<Props> = ({
  id,
  name,
  course,
  city,
  region,
  start_date,
  end_date
}) => {
  return (
    <div key={id} className="shadow rounded bg-green m-2">
      <div className="p-5 flex flex-col space-y-2">
        <p className="text-lg font-medium">{name}</p>
        <p className="text-lg font-medium">{new Date(start_date).toLocaleDateString()}</p>
        <p className="text-lg font-medium">{course}</p>
        <p className="text-lg font-medium">{city}, {region}</p>
      </div>
    </div>
  );
};
