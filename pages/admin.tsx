import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from './api/auth/[...nextauth]';
import { redirectToSignIn, redirectToHome } from '../utils/utils';

const AdminPage = ({ tournaments }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  console.log(tournaments)
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
          {tournaments.map((tournament:any) => (
            <li key={tournament.id} className="bg-grey-200 rounded p-3 mb-2">
              <div>{tournament.name}</div>
              <div>Status: {tournament.status}</div>
              <Link href={`/tournament/${tournament.id}`}>To Tournament</Link>

              {tournament.pools && tournament.pools.map((pool:any, i:number) => {
                return (
                  <div key={i} className="p-4 bg-grey-100 rounded">
                    <h1>{pool.name}</h1>
                    <p>Status: {pool.status}</p>
                    <p>Members: {pool.pool_members.length}</p>
                    <p>Pending Invites: {pool.pool_invites.length}</p>
                  </div>
                )
              })
              }
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
};

export default AdminPage;

export const getServerSideProps: GetServerSideProps = async (context) => {

  const session = await getServerSession(context.req, context.res, authOptions)

  if(!session) { return redirectToSignIn() };
  if(session.role !== 'ADMIN') { return redirectToHome() };

  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      course: true,
      city: true,
      region: true,
      status: true,
      cut_line: true,
      external_id: true,
      pools: {
        select: {
          id: true,
          name: true,
          status: true,
          pool_members: {
            select: {
              id: true
            }
          },
          pool_invites: {
            where:{
              status: 'Invited'
            },
            select: {
              id: true
            }
          }
        }
      }
    },
  });

  return {
    props: {
      tournaments
    },
  };
};
