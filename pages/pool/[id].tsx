import React from 'react';
import prisma from '../../lib/prisma';
import { Athlete } from '@prisma/client';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import { CardPoolMember } from '../../components/CardPoolMember';
import { CardPoolStatus } from '../../components/CardPoolStatus';

const Pool = ({ pool, currentUserPoolMemberId }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const tournamentAthletes:Athlete[] = pool.tournament.athletes.map(({ athlete }: { athlete:Athlete }) => athlete);

  const sortedMembers = pool?.pool_members?.sort((a:any, b:any) => {
    if (a.id === currentUserPoolMemberId) return -1;
    if (b.id === currentUserPoolMemberId) return 1;
    return 0;
  });

  const totalPotAmount = sortedMembers.length * pool.amount_entry;

    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <h1>{pool.name}</h1>
        <h3>{pool.tournament.name}</h3>
        <p>{pool.tournament.course}</p>
        <p>${pool.amount_entry} Buy-In | Total Pot: ${totalPotAmount} </p>
        <CardPoolStatus status={pool.status}/>
        { sortedMembers?.map((member:any) => {
          return (
            <CardPoolMember
            key={member.id}
            member={member}
            currentMemberId={currentUserPoolMemberId}
            poolStatus={pool.status}
            athletes={tournamentAthletes}
            />
          )
        })}
        { pool?.pool_invites?.map((invite : any) => {
          return (
            <div className="w-full mt-6 p-6 rounded bg-gray-300" key={invite.id}>
             <p>{invite.nickname}</p>
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
        status: true,
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
            email: true,
            nickname: true
          }
        },
        pool_members: {
          select: {
            id: true,
            user_id: true,
            user: {
              select: {
                email: true,
                nickname: true
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