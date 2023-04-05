import React, { useState } from 'react';
import Head from "next/head";
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import Select from 'react-select';
import { useMutation, useQuery, gql } from '@apollo/client';

import { redirectToSignIn, redirectToHome } from '../../utils/utils';

interface SelectValues {
  value: string;
  label: string;
}

const UPDATE_TOURNAMENT_STATUS = gql`
  mutation UpdateTournament($id: ID!, $status: String!) {
    updateTournament(id: $id, status: $status) {
        id
        status
    }
  }
`;

const Tournament = ({ tournament }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [selectedOption, setSelectedOption] = useState({ value: tournament.status, label: tournament.status });
  const [updateTournament] = useMutation(UPDATE_TOURNAMENT_STATUS);


    const handleStatusChange = async (option: SelectValues | null) => {
      setSelectedOption(option ?? { value: '', label: '' });
      
      try {
        await updateTournament({
          variables: { id: tournament.id, status: option?.value ?? '' },
        });
      } catch (error) {
        console.log(error)
    }
  }

    const tournamentStatuses = ['Scheduled', 'Active', 'Completed']

    const selectOptions: SelectValues[] = tournamentStatuses.map((el) => {
      return ({
        value: el,
        label: el,
      })
    });

    return (
        <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
            <Head>
                <title>Tournament | PoolPicks</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
                <h1>Admin Home</h1>
                <div className="w-full">
                    <h3>{tournament.name}</h3>
                    <p>Starts: {tournament.start_date}</p>
                    <div>
                        <label htmlFor="status">Status:</label>
                        <Select instanceId="status" name="status" 
                        onChange={(option: SelectValues | null) =>
                          handleStatusChange(option)}
                          options={selectOptions}
                          value={selectedOption}
                        className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tournament;

  export const getServerSideProps: GetServerSideProps = async (context) => {

    const id = context.params?.id;

    const session = await getServerSession(context.req, context.res, authOptions)
 
    if(!session) { return redirectToSignIn() };
    if(session.role !== 'ADMIN') { return redirectToHome() };

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: Number(id)
      },
      select: {
        id: true,
        name: true,
        course: true,
        city: true,
        region: true,
        status: true,
        cut_line: true,
        start_date: true,
        external_id: true
      },
    });
  
    if(!tournament) { return redirectToHome() }

    return {
      props: {
        tournament: {
          ...tournament,
          start_date: tournament.start_date.toLocaleDateString(),
        },
      },
    };
  };