import React, { useState, useEffect } from 'react';
import Head from "next/head";
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import { CardPoolMember } from '../../components/CardPoolMember';
import { CardPoolStatus } from '../../components/CardPoolStatus';
import { PoolAdmin } from '../../components/PoolAdmin';
import { redirectToSignIn, reformatPoolMembers, formattedDate } from '../../utils/utils';

const GET_SCORES = `
query getPoolScores($pool_id: Int!) {
  getPoolScores(pool_id: $pool_id) {
      id
      username
      user {
        nickname
      }
      athletes {
        athlete {
          id
          full_name
          tournaments {
            status
            position
            thru
            score_today
            score_round_one
            score_round_two
            score_round_three
            score_round_four
            score_sum
            score_under_par
            tournament_id
          }
        }
      }
    }
}
`;

const Pool = ({ pool, poolMembers, currentUserPoolMemberId, isAdmin }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const [poolStatus, setPoolStatus] = useState(pool.status);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [updatedPoolMembers, setUpdatedPoolMembers] = useState(poolMembers);  
  const [isLoading, setIsLoading] = useState(false);

  const totalPotAmount = poolMembers.length * pool.amount_entry;
  const tournamentExternalUrl = `https://www.espn.com/golf/leaderboard/_/tournamentId/${pool.tournament.external_id}`

  const showLogo = pool.tournament.name === "Masters Tournament";
  const updatedAtFormatted = formattedDate(pool.tournament.updated_at)

  const handleRefresh = async () => {
    setIsLoading(true)
    const variables = { pool_id: pool.id };

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_SCORES,
          variables
        }),
      });
      const result = await response.json();
      if(!result || !result.data) throw new Error('Error fetching updated scores')
      const updatedMembers = reformatPoolMembers(result.data.getPoolScores, pool.tournament.id)
      setUpdatedPoolMembers(updatedMembers);
      console.log(updatedMembers)
      setIsLoading(false)
    } catch(error) {
      console.log(error)
      setIsLoading(false)
    }
  };

  return (
      <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
        <Head>        
            <title>Pool View | PoolPicks</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
        <div className="flex">
          { showLogo && <div className="pl-4 pr-4">
          <img src="/logo_masters.png" className="w-24"></img>
          </div>}
          <div className={`flex justify-center flex-1 flex-col align-center ${!showLogo ? 'text-center' : ''}`}>
          <h1 className="text-lg font-bold">{pool.name}</h1>
          <p className="text-base">{pool.tournament.name}</p>
          <p className="text-base">{pool.tournament.course}</p>
          <p className="text-xs">${pool.amount_entry} Ante | Total Pot: ${totalPotAmount} </p>
          { pool.tournament.external_id &&
            <a href={tournamentExternalUrl} className="font-bold text-yellow underline mt-2" target="_blank" rel="noreferrer">Official Leaderboard</a>
          }
          {pool.tournament.cut_line && <p>Projected Cut <strong>{pool.tournament.cut_line}</strong></p>}

            {poolStatus === 'Active' && 
            <div>
              <button onClick={handleRefresh} className="bg-grey-100 p-1 pr-2 pl-2 mt-2 max-w-[125px] rounded" disabled={isLoading}>{ isLoading ? 'Refreshing...' : 'Refresh Pool'}</button>
            </div>
            }
          </div>
          </div>
          <CardPoolStatus status={poolStatus}/>
          { isAdmin &&
          <button onClick={() => setShowAdminPanel(prevState => !prevState)} className="p-1 pr-2 pl-2 mt-2 bg-gray-500 rounded">
            Admin Panel
            <span className={`accordion-arrow text-grey-50 ml-2 mt-1 text-xs ${showAdminPanel ? 'open' : ''}`}>&#9660;</span>
          </button>
          }
          {isAdmin && showAdminPanel &&
          <PoolAdmin pool={pool}/>}
        </div>
     
        { updatedPoolMembers?.map((member:any, i:number) => {
          return (
            <CardPoolMember
            key={member.id}
            member={member}
            currentMemberId={currentUserPoolMemberId}
            poolStatus={poolStatus}
            tournamentId={pool.tournament.id}
            tournamentExternalUrl={tournamentExternalUrl}
            updatedAt={pool.tournament.updated_at}
            position={i+1}
            />
          )
        })}
        { pool?.pool_invites?.map((invite : any) => {
          return (
            <div className="w-full mt-6 p-6 rounded bg-grey-100 flex justify-between items-center" key={invite.id}>
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
    
    if(!session) { return redirectToSignIn() };

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
            cut_line: true,
            external_id: true,
            updated_at: true
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
            username: true,
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
                        tournament_id: true,
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

    if(!pool) { return redirectToSignIn() }

    const currentUserPoolMember = pool!.pool_members.find((member) => member.user.email === email);
    const isAdmin = session.role === 'ADMIN';
    if(!currentUserPoolMember && !isAdmin) { return redirectToSignIn() }

    const poolMembers = reformatPoolMembers(pool.pool_members, pool.tournament_id)
    return {
      props: {
        pool,
        poolMembers,
        currentUserPoolMemberId: currentUserPoolMember?.id || null,
        isAdmin: isAdmin
      },
    };
  };