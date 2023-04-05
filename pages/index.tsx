import Head from "next/head";
import { useState } from 'react';
import { gql, useMutation } from "@apollo/client";
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import prisma from '../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from './api/auth/[...nextauth]';
import { useRouter } from 'next/router';
import { redirectToSignIn } from '../utils/utils';
import { ButtonLink } from '../components/ButtonLink';


  const PoolInvitesAndMembers = ({ session, poolInvites: initialPoolInvites, poolMembers }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const [poolInvites, setPoolInvites] = useState(initialPoolInvites)
    const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
    const router = useRouter();

    const CreateInviteMutation = gql`
    mutation($id: ID!, $status: String!, $pool_id: Int!, $nickname: String!, $email: String!) {
      updateInviteStatus(id: $id, status: $status, pool_id: $pool_id, nickname: $nickname, email: $email) { id }
    }
  `;  

  const [updatePoolInviteStatus] = useMutation(CreateInviteMutation)

  const updateInviteStatus = async (id: number, status: string, pool_id: string, nickname: string, email: string) => {
    
    try {
      await updatePoolInviteStatus({ variables: { id, status, pool_id, nickname, email } });

      if (status === "Accepted") {
        await router.push(`/pool/${pool_id}`);
        setLoadingButtonId(null);
        return;
      } else {
        setPoolInvites(poolInvites.filter((invite : any) => invite.id !== id));
        setLoadingButtonId(null);
      }
      
      return;
    } catch (error) {
      console.log(error);
      setLoadingButtonId(null);

    }
  };
  

  return (
    <div>
      <Head>        
        <title>Home | PoolPicks</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      { session && 
        <div className="container max-w-xl mx-auto flex flex-wrap items-center flex-col bg-black">
           <div className="w-full p-6 rounded bg-grey-100 text-white text-xs">
              <p className="text-center font-bold">PoolPicks is currently in Alpha</p>
              <p className="text-center">Only the app developer can be a commissioner.</p>
              <p className="text-center">Alpha testers (you!) can accept invitations to pools, make picks, and win the pool.</p>
            </div>
        <div className="flex flex-col justify-center items-center flex-wrap rounded bg-grey-200 w-full mt-4 pt-8 px-6 text-white">
          <h3 className="mb-4">Active Pools</h3>
          { poolInvites?.map((invite:any) => (
        <div className="p-4 bg-yellow w-full rounded mb-6 text-black" key={invite.id}>
            <div className="text-center">
              <span>You have been invited to:</span>
              <h3>{invite?.pool?.name}</h3>
              <p className="pb-2">${invite?.pool?.amount_entry} Ante</p>
              <div className="flex flex-wrap justify-center">
              <button
                disabled={loadingButtonId !== null}
                className="button-tertiary bg-green-500"
                onClick={() => {
                  setLoadingButtonId(`${invite.id}-accept`);
                  updateInviteStatus(invite.id, "Accepted", invite.pool.id, invite.nickname, session.user?.email ?? '');
                }}
              >
                { loadingButtonId === `${invite.id}-accept` ? (
                    <span className="flex items-center justify-center ">
                      <svg
                        className="w-6 h-6 animate-spin mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                      </svg>
                      Accepting...
                    </span>
                  ) : (
                    <span>Accept</span>
                  )
                }
                </button>
                <button
                disabled={loadingButtonId !== null}
                className="button-tertiary bg-red-300"
                onClick={() => {
                  setLoadingButtonId(`${invite.id}-reject`);
                  updateInviteStatus(invite.id, "Rejected", invite.pool.id, invite.nickname, session.user?.email ?? '');
                }}
              >
                { loadingButtonId === `${invite.id}-reject` ? (
                    <span className="flex items-center justify-center ">
                      <svg
                        className="w-6 h-6 animate-spin mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                      </svg>
                      Declining...
                    </span>
                  ) : (
                    <span>Decline</span>
                  )
                }
                </button>
              </div>
            </div>
          </div>
          
          ))}
          { !poolMembers.length && !poolInvites.length && (
            <p className="text-center pb-8">You currently aren't in any active pools. Ask your commissioner to invite you!</p>
          )}
          { poolMembers?.map((member:any) => (
        <div className="p-4 mb-6 bg-grey-100 w-full rounded" key={member.id}>
            <div className="text-center">
              <h3 className="mb-2">{member?.pool?.name}</h3>
              <p className="mb-4">Status: {member?.pool?.status}</p>
              <div className="flex flex-wrap justify-center">
              <ButtonLink href={`/pool/${member.pool.id}`} buttonText={'Go To Pool'} loadingText={'Going to pool...'} background='bg-grey-200'></ButtonLink>
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
  if(!session) { return redirectToSignIn() };
  
  const email = session.user?.email;

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
          status: true,
          amount_entry: true
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
          status: true,
          amount_entry: true
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
      session,
      poolInvites,
      poolMembers
    },
  };
};