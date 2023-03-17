import React from 'react';
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getSession } from '@auth0/nextjs-auth0';


import PicksCreate from '../../components/PicksCreate';
import { Athlete, PoolInvite } from '@prisma/client';

const Pool = ({ pool, currentUserPoolMemberId }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const tournamentAthletes:Athlete[] = pool.tournament.athletes.map(({ athlete }: { athlete:Athlete }) => athlete);

    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <h1>{pool.name}</h1>
        <p>{pool.tournament.name}</p>
        <p>{pool.tournament.course}</p>
        <p>${pool.amount_entry} Buy-In | Total Pot: ${pool.amount_sum} </p>
        { pool?.pool_members?.map((member:any) => {
          return (
            <div className="w-full mt-6 p-6 rounded bg-blue-300" key={member.id}>
              <h3>{member?.user?.email}</h3>
              { member?.athletes?.map(({ athlete }: { athlete: Athlete }) => {
                return (
                  <p key={athlete.id}>{athlete.full_name}</p>
                )
              })}
              { !member.athletes.length &&
                <PicksCreate 
                  memberId={currentUserPoolMemberId}
                  athletes={tournamentAthletes} />
              }
            </div>
          )
        })}
        { pool?.pool_invites?.map((invite : any) => {
          return (
            <div className="w-full mt-6 p-6 rounded bg-gray-300">
             <p>{invite.email}</p>
            </div>
          )
        })}
        
        </div>
    );
  };
  
  export default Pool;

  export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {

    const id = params?.id;

    const session = await getSession(req, res);
    const email = session?.user?.email;

    const pool = await prisma.pool.findUnique({
      where: {
        id: Number(id)
      },
      select: {
        id: true,
        name: true,
        amount_entry: true,
        amount_sum: true,
        tournament: {
          select: {
            id: true,
            name: true,
            course: true,
            city: true,
            region: true,
            status: true,
            athletes: {
              select: {
                status: true,
                position: true,
                thru: true,
                score_today: true,
                athlete: {
                  select: {
                    id: true,
                    full_name: true,
                  }
                }
              }
            }
          }
        },
        pool_invites: {
          where:{
            status: 'Invited'
          },
          select: {
            id: true,
            status: true,
            email: true
          }
        },
        pool_members: {
          select: {
            id: true,
            user_id: true,
            user: {
              select: {
                email: true
              }
            },
            athletes: {
              select: {
                athlete: {
                  select: {
                    full_name: true
                  }
                }
              }
            }
          }
        }
      },
    });
  
    if (!pool) return {
      notFound: true
    }

    const currentUserPoolMember = pool.pool_members.find((member) => member.user.email === email);

  
    return {
      props: {
        pool,
        currentUserPoolMemberId: currentUserPoolMember?.id,
      },
    };
  };