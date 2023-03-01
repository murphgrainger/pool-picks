// /pages/index.tsx
import Head from "next/head";
import { gql, useQuery, useMutation } from "@apollo/client";
import AthleteList from "../components/AthleteList";
import TournamentList from "../components/TournamentList";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

function Home() {
  const { user } = useUser()

  return (
    <div>
      <Head>        
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <div className="p-4 bg-slate-300 w-full rounded"
          ><p> No new pool invites.</p>
        </div>
        <div className="flex flex-col justify-center items-center flex-wrap rounded bg-blue-400 w-full mt-4 py-8 px-6">
          <h3 className="mb-4">Active Pools</h3>
          <p className="text-center">You currently don't have any active pools or pending invitations to join a pool.</p>
          <Link href="/pool-create" className="w-full text-center mt-5"><button className="w-full rounded">Create Pool</button></Link>
        </div>
        <div className="flex flex-col justify-center items-center flex-wrap rounded bg-green-400 w-full mt-4 py-8 px-6">
          <h3 className="mb-4">Next Tournament</h3>
          <div className="bg-green-200 p-5 w-full rounded">
            <p className="">Honda Classic</p>
          </div>
          <Link href="/admin" className="w-full text-center mt-5"><button className="w-full rounded">See More</button></Link>
        </div>

        <div className="w-full">
          <div className="flex flex-col p-4 w-full">
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
