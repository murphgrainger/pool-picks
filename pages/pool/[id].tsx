import React from 'react';
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import { CardPoolMember } from '../../components/CardPoolMember';
import { CardPoolStatus } from '../../components/CardPoolStatus';

import { redirectToHome } from '../../utils/utils';

const Pool = ({ pool, currentUserPoolMemberId }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

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
            tournamentId={pool.tournament.id}
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

  export const getServerSideProps: GetServerSideProps = async (context) => {

    const id = context.params?.id;

    const session = await getServerSession(context.req, context.res, authOptions)
    
    if(!session) { return redirectToHome() };

    const email = session!.user?.email;

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
                    id: true,
                    full_name: true,
                    tournaments: {
                      select: {
                        status: true,
                        position: true,
                        thru: true,
                        score_today: true,
                        score_round_one: true,
                        score_round_two: true,
                        score_round_three: true,
                        score_round_four: true,
                        score_sum: true,
                        score_under_par: true,
                        tournament_id: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    });
  
    if(!pool) { return redirectToHome() }

    const currentUserPoolMember = pool!.pool_members.find((member) => member.user.email === email);
    if(!currentUserPoolMember) { return redirectToHome() }
  
    return {
      props: {
        pool,
        currentUserPoolMemberId: currentUserPoolMember?.id,
      },
    };
  };