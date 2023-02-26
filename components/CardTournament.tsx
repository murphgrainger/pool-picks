import React from 'react';

interface Props {
  name: string;
  id: number;
}

export const CardTournament: React.FC<Props> = ({
  name,
  id,
}) => {
  return (
    <div key={id} className="shadow rounded bg-green m-2">
      <div className="p-5 flex flex-col space-y-2">
        <p className="text-lg font-medium">{name}</p>
      </div>
    </div>
  );
};
