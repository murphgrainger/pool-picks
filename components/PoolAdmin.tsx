import React, { useState, useEffect } from 'react';
import { Pool } from '@prisma/client';
import Select from 'react-select';
import { useMutation, gql } from '@apollo/client';

interface SelectValues {
  value: string;
  label: string;
}

interface Props {
  pool: Pool,
  onStatusChange: (status: string) => void;
}

const UPDATE_POOL_STATUS = gql`
  mutation UpdatePool($id: ID!, $status: String!) {
    updatePool(id: $id, status: $status) {
        id
        status
    }
  }
`;

export const PoolAdmin: React.FC<Props> = ({ pool, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [updatePool] = useMutation(UPDATE_POOL_STATUS);
  const [selectedOption, setSelectedOption] = useState({
    value: pool.status,
    label: pool.status,
  });

  const handleStatusChange = async (option: SelectValues | null) => {
    setSelectedOption(option ?? { value: '', label: '' });

    try {
      await updatePool({
        variables: { id: pool.id, status: option?.value ?? '' },
      });
      onStatusChange(option?.value ?? '');
    } catch (error) {
      console.log(error)
  }
}




const poolStatuses = ['Open', 'Locked', 'Active', 'Complete']

const selectOptions: SelectValues[] = poolStatuses.map((el) => {
  return ({
    value: el,
    label: el,
  })
});

  return (
    <div key={pool.id} className="shadow rounded bg-grey-200 w-full m-2 text-white">
      <div className="p-5 flex flex-col space-y-2">
        <label>Pool Status</label>
        <Select instanceId="status" name="status" 
          onChange={(option: SelectValues | null) =>
            handleStatusChange(option)}
            options={selectOptions}
            value={selectedOption}
            isDisabled={isLoading}
          className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
          />
      </div>
    </div>
  );
};
