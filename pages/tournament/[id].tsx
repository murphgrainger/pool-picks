import React, { useState, useEffect } from 'react';
import Head from "next/head";
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import Select from 'react-select';
import { useMutation, gql } from '@apollo/client';

import { redirectToSignIn, redirectToHome, formattedDate } from '../../utils/utils';
import { String } from 'aws-sdk/clients/acm';

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
  const [isActive, setActiveTournament] = useState(tournament.status === 'Active');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(tournament.updatedAt);

  useEffect(() => {
    if (tournament.status && tournament.status === 'Active') {
      setActiveTournament(true);
    }
    setUpdatedAt(tournament.updated_at);
  }, [tournament.status, tournament.updated_at]);

    const handleStatusChange = async (option: SelectValues | null) => {
      setActiveTournament(option?.value === 'Active');
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

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' as RequestCredentials,
    }

    const updateData = async (scrapeRoute : String) => {
      setIsLoading(true)
      console.log('Updating data...')

      try {
        const url = scrapeRoute === 'rankings' ?  `/api/scrape/${scrapeRoute}` : `/api/scrape/tournaments/${tournament.id}/${scrapeRoute}`;
        const response = await fetch(url);
        if (!response.ok) {
          const { message } = await response.json();
          throw new Error(message);
        }
        console.log("Data updated successfully!");
        setUpdatedAt(formattedDate(new Date()));
        setIsLoading(false)

      } catch (error) {
        setIsLoading(false)
        console.log(error)
      }
    }

    return (
        <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
            <Head>
                <title>Tournament | PoolPicks</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
                <div className="w-full">
                    <h3>{tournament.name}</h3>
                    <p>Starts: {tournament.start_date}</p>
                    <p>Last Updated: {updatedAt}</p>
                    <div className="mt-2">
                        <label htmlFor="status">Update Status:</label>
                        <Select instanceId="status" name="status" 
                        onChange={(option: SelectValues | null) =>
                          handleStatusChange(option)}
                          options={selectOptions}
                          value={selectedOption}
                          isDisabled={isLoading}
                        className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 color-black"
                        />
                        { isActive &&
                        <div className="mt-6 flex flex-col">
                          <button className="bg-grey-200 m-2 hover:bg-green-700"
                          onClick={() => {updateData('athletes')
                          setLoadingButtonId(`atheletes`);
                            }
                          }
                          disabled={isLoading}
                          >{ isLoading && loadingButtonId ==='atheletes' ? 'Updating...' : 'Update Field'}</button>
                          <button className="bg-grey-200 m-2 hover:bg-green-700"
                            onClick={() => {updateData('rankings')
                            setLoadingButtonId(`rankings`);
                              }
                            }                          
                            disabled={isLoading}
                          >{ isLoading && loadingButtonId ==='rankings' ? 'Updating...' : 'Update Rankings'}</button>

                          <button className="bg-grey-200 m-2 hover:bg-green-700"
                            onClick={() => {updateData('scores')
                            setLoadingButtonId(`scores`);
                              }
                            }                            
                            disabled={isLoading}
                          >{ isLoading && loadingButtonId ==='scores' ? 'Updating...' : 'Update Scores'}</button>                        </div>
                        }
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
        external_id: true,
      },
    });
  
    if(!tournament) { return redirectToHome() }

    return {
      props: {
        tournament: {
          ...tournament
        },
      },
    };
  };