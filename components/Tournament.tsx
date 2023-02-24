import React from 'react';

interface Props {
  name: string;
  par: number | null;
  id: number;
}

export const Tournament: React.FC<Props> = ({
  name,
  par,
  id,
}) => {
  return (
    <div key={id} className="shadow rounded bg-green">
      <div className="p-5 flex flex-col space-y-2">
        <p className="text-lg font-medium">{name}</p>
        <p className="text-gray-600">{par}</p>
      </div>
    </div>
  );
};