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
    console.log(session)
    if(status === "unauthenticated") Router.replace('/');
    // if(session?.user?.role === "admin") setIsAdmin(true);
  }, [session, status]);

  if(loading) return <div>Loading...</div>
  if(error) return <div>Error: {error.message}</div>



  if(!isAdmin) {
    return (
      <div>Access Denied</div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-3">
      <h1>Commish Home</h1>
      <h2>Pools:</h2>
      <ul>
        {data.pools.map((pool:any) => (
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
