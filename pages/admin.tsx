import Head from "next/head";
import { useSession } from 'next-auth/react';
import { useEffect, useState } from "react";
import Router from 'next/router';
import { gql, useQuery } from '@apollo/client';

const GET_POOLS_QUERY = gql`
  query GetPools {
    pools {
      id
      name
      status
    }
  }
`;

const AdminPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session, status } = useSession();
  const { loading, error, data } = useQuery(GET_POOLS_QUERY);

  useEffect(() => {
    if(status === "unauthenticated") Router.replace('/auth/signin')
    if (status === "authenticated" && session?.role !== "ADMIN") {
      Router.replace('/');
    }
  }, [session, status]);

  return (
    <div className="container mx-auto max-w-md">
      <Head>        
        <title>Admin | PoolPicks</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Commish Home</h1>
      <h2>Pools:</h2>
      <ul>
        {data?.pools.map((pool:any) => (
          <li key={pool.id}>
            <div>{pool.name}</div>
            <div>Status: {pool.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPage;
