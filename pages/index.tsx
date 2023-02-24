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
      <div className="container mx-auto max-w-5xl my-20 flex flex-wrap items-center flex-col">
        <div>
        {user && (
          <div className="flex flex-col justify-center items-center flex-wrap">
          <Link href="/admin"><button>Create Tournament</button></Link>
          </div>
            )}
        </div>
        <div className="w-full">
          <div className="flex flex-col p-4 w-full">
            <AthleteList/>
            <TournamentList/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
