import Head from "next/head";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useEffect, useState } from "react";
import Router from 'next/router';
import { gql, useQuery } from '@apollo/client';
import { ButtonLink } from '../components/ButtonLink';

const GET_TOURNAMENTS_AND_POOLS_QUERY = gql`
  query tournamentAndPools {
    tournaments {
      id
      name
      status
      start_date
      pools {
        id
        name
        status
      }
    }
  }
`;


const AdminPage = () => {
  const { data: session, status } = useSession();
  const { loading, error, data } = useQuery(GET_TOURNAMENTS_AND_POOLS_QUERY);
  console.log('data', data)

  useEffect(() => {
    if(status === "unauthenticated") Router.replace('/auth/signin')
    if (status === "authenticated" && session?.role !== "ADMIN") {
      Router.replace('/');
    }
  }, [session, status]);

  return (
    <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
    <Head>        
        <title>Admin | PoolPicks</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
      <h1>Admin Home</h1>
      <div className="w-full">
        <h2 className="mb-2">Tournaments</h2>
        <ul>
          {data?.tournaments.map((tournament:any) => (
            <li key={tournament.id} className="bg-grey-200 rounded p-3 mb-2">
              <div>{tournament.name}</div>
              <div>Status: {tournament.status}</div>
              <Link href={`/tournament/${tournament.id}`}>To Tournament</Link>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
};

export default AdminPage;
