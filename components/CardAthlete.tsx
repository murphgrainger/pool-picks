import React from 'react';

interface Props {
  full_name: string;
  ranking: number | null;
  id: number;
}

export const CardAthlete: React.FC<Props> = ({
  full_name,
  ranking,
  id,
}) => {
  return (
    <div key={id} className="shadow rounded bg-red-500 m-2">
      <div className="p-5 flex flex-col space-y-2">
        <p className="text-lg font-medium">{full_name}</p>
      </div>
    </div>
  );
};
