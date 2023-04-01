import React from 'react';
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import { CardPoolMember } from '../../components/CardPoolMember';
import { CardPoolStatus } from '../../components/CardPoolStatus';

import { redirectToHome, reformatPoolMembers } from '../../utils/utils';

const Pool = ({ pool, poolMembers, currentUserPoolMemberId }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  
  const totalPotAmount = poolMembers.length * pool.amount_entry;

    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <h1 className="mt-4">{pool.name}</h1>
        <h3>{pool.tournament.name}</h3>
        <p>{pool.tournament.course}</p>
        <p>${pool.amount_entry} Buy-In | Total Pot: ${totalPotAmount} </p>
        {pool.tournament.cut_line && <p>Projected Cut <strong>{pool.tournament.cut_line}</strong></p>}
        <CardPoolStatus status={pool.status}/>
        { poolMembers?.map((member:any, i:number) => {
          return (
            <CardPoolMember
            key={member.id}
            member={member}
            currentMemberId={currentUserPoolMemberId}
            poolStatus={pool.status}
            tournamentId={pool.tournament.id}
            position={i+1}
            />
          )
        })}
        { pool?.pool_invites?.map((invite : any) => {
          return (
            <div className="w-full mt-6 p-6 rounded bg-gray-300 flex justify-between items-center" key={invite.id}>
             <p>{invite.nickname}</p>
             <span className="italic text-xs">Invited</span>
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
        tournament_id: true,
        tournament: {
          select: {
            id: true,
            name: true,
            course: true,
            city: true,
            region: true,
            status: true,
            cut_line: true
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

    const poolMembers = reformatPoolMembers(pool.pool_members, pool.tournament_id)

    return {
      props: {
        pool,
        poolMembers,
        currentUserPoolMemberId: currentUserPoolMember?.id,
      },
    };
  };