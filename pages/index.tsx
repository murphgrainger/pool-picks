import Head from "next/head";
import { useState } from 'react';
import { gql, useMutation } from "@apollo/client";
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import prisma from '../lib/prisma';
import Link from "next/link";
import { useSession, signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next";
import { authOptions } from './api/auth/[...nextauth]';
import { useRouter } from 'next/router';

  const PoolInvitesAndMembers = ({ poolInvites: initialPoolInvites, poolMembers }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const [poolInvites, setPoolInvites] = useState(initialPoolInvites)
    const [isLoading, setLoading] = useState(false)
    const router = useRouter();
    const { data: session } = useSession()

    const CreateInviteMutation = gql`
    mutation($id: ID!, $status: String!, $pool_id: Int!, $nickname: String!, $email: String!) {
      updateInviteStatus(id: $id, status: $status, pool_id: $pool_id, nickname: $nickname, email: $email) { id }
    }
  `;  

  const [updatePoolInviteStatus] = useMutation(CreateInviteMutation)

  const updateInviteStatus = async (id: number, status: string, pool_id: string, nickname: string, email: string) => {
    
    try {
      setLoading(true);
      await updatePoolInviteStatus({ variables: { id, status, pool_id, nickname, email } });

      if (status === "Accepted") {
        router.push(`/pool/${pool_id}`);
        setLoading(false)
        return;
      } else {
        setPoolInvites(poolInvites.filter((invite : any) => invite.id !== id));
        setLoading(false)
      }
      
      return;
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  

  return (
    <div>
      <Head>        
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      { !session &&
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <h1 className="mt-10">Welcome to Pool Picks!</h1>
        <p className="m-4">Login to get started.</p>
        <button onClick={() => signIn()} className="rounded">Login</button>
      </div>
      }

      { session && 
        <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <div className="flex flex-col justify-center items-center flex-wrap rounded bg-blue-400 w-full mt-4 pt-8 px-6">
          <h3 className="mb-4">Active Pools</h3>
          { poolInvites?.map((invite:any) => (
        <div className="p-4 bg-yellow-200 w-full rounded mb-6" key={invite.id}>
            <div className="text-center">
              <span>You have been invited to:</span>
              <h3 className="mb-4">{invite?.pool?.name}</h3>
              <div className="flex flex-wrap justify-center">
                <button className="button-tertiary bg-gray-400" onClick={() => {updateInviteStatus(invite.id, "Rejected", invite.pool.id, invite.nickname, session.user?.email ?? '')}} disabled={isLoading}>Reject</button>
                <button className="button-tertiary bg-green-500" onClick={() => {updateInviteStatus(invite.id, "Accepted", invite.pool.id, invite.nickname, session.user?.email ?? '')}} disabled={isLoading}>Accept</button>
              </div>
            </div>
          </div>
          ))}
          { !poolMembers.length && !poolInvites.length && (
            <p className="text-center">You currently aren't in any active pools. Ask your commissioner to invite you!</p>
          )}
          { poolMembers?.map((member:any) => (
        <div className="p-4 mb-6 bg-blue-200 w-full rounded" key={member.id}>
            <div className="text-center">
              <h3 className="mb-2">{member?.pool?.name}</h3>
              <p className="mb-4">Status: {member?.pool?.status}</p>
              <div className="flex flex-wrap justify-center">
                <Link href={`/pool/${member.pool.id}`}><button className="rounded">Go to Pool</button></Link>
              </div>
            </div>
          </div>
          ))}
        </div>
        <div className="w-full">
          <div className="flex flex-col p-4 w-full">
          </div>
        </div>
      </div>
      }
      
    </div>
  );
}

export default PoolInvitesAndMembers;

export const getServerSideProps: GetServerSideProps = async ( context ) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  const email = session?.user?.email;

  const poolInvites = await prisma.poolInvite.findMany({
    where: {
      email: String(email),
      status: 'Invited',
      pool: {
        status: "Open"
      }
    },
    select: {
      id: true,
      nickname: true,
      pool: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    },
  });

  const poolMembers = await prisma.poolMember.findMany({
    where: {
      user: {
        email: String(email)
      }
    },
    select: {
      id: true,
      pool: {
        select: {
          id: true,
          name: true,
          status: true
        }
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });

  if (!poolInvites && !poolMembers) return {
    notFound: true
  }

  return {
    props: {
      poolInvites,
      poolMembers
    },
  };
};