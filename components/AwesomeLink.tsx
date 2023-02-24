import React from 'react';

interface Props {
  url: string;
  title: string;
  category: string;
  description: string;
  id: number;
}

export const AwesomeLink: React.FC<Props> = ({
  url,
  title,
  category,
  description,
  id,
}) => {
  return (
    <div key={id} className="shadow rounded bg-green">
      <div className="p-5 flex flex-col space-y-2">
        <p className="text-lg font-medium">{title}</p>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};
