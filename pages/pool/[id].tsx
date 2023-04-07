import React, { useState, useEffect } from 'react';
import Head from "next/head";
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';
import { CardPoolMember } from '../../components/CardPoolMember';
import { CardPoolStatus } from '../../components/CardPoolStatus';
import { PoolAdmin } from '../../components/PoolAdmin';
import { redirectToSignIn, reformatPoolMembers, formatToPar, timeAgo } from '../../utils/utils';

const GET_TOURNAMENT_UPDATED_TIME = `
query getTournament($id: ID!) {
  tournament(id: $id) {
    updated_at
  }
}`


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
            tournament {
              updated_at
            }
          }
        }
      }
    }
}
`;

const Pool = ({ pool, poolMembers, currentUserPoolMemberId, isAdmin, scoresUpdatedAt }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const [poolStatus, setPoolStatus] = useState(pool.status);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [updatedPoolMembers, setUpdatedPoolMembers] = useState(poolMembers);  
  const [lastScoreUpdateTime, setLastScoreUpdateTime] = useState(scoresUpdatedAt);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [elapsedTime, setElapsed] = useState('');
  console.log

  const totalPotAmount = poolMembers.length * pool.amount_entry;
  const tournamentExternalUrl = `https://www.espn.com/golf/leaderboard/_/tournamentId/${pool.tournament.external_id}`

  const showLogo = pool.tournament.name === "Masters Tournament";

  useEffect(() => {
    handleRefresh();
  }, []);

  const useElapsedTime = () => {
  
    setInterval(() => {
      const now = new Date();
      const updated = new Date(lastScoreUpdateTime)
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000);
      if (diff < 60) {
        setElapsed(`just now`);
      } else if (diff < 3600) {
        setElapsed(`${Math.floor(diff / 60)} minutes ago`);
      } else if (diff < 86400) {
        setElapsed(`${Math.floor(diff / 3600)} hours ago`);
      } else {
        setElapsed(`${Math.floor(diff / 86400)} days ago`);
      }
    }, 30000);
  
    return elapsedTime;
  };

  const fetchData = async () => {
    console.log('fetching!!')
    const variables = { id: pool.tournament_id };

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_TOURNAMENT_UPDATED_TIME,
          variables,
        }),
      });

      const result = await response.json();
      if(!result || !result.data) throw new Error('Error fetching tournament last updated time!')

      return result.data.tournament.updated_at;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const useFetchData = () => {
    useEffect(() => {
      const interval = setInterval(async () => {

        const lastUpdatedTime = await fetchData();

        setLastScoreUpdateTime(lastUpdatedTime);

        if(lastUpdatedTime !== lastScoreUpdateTime) {
          setNeedsRefresh(true);
        }

      return () => clearInterval(interval);
      }, 30000);

      return () => clearInterval(interval);
    }, [lastScoreUpdateTime]);
  };

  if(pool.tournament?.status.includes('In Progress')) {
    useFetchData();
    useElapsedTime();
  }

  const handleRefresh = async () => {
    console.log('getting new db data')
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
      console.log(result)
      const updatedMembers = reformatPoolMembers(result.data.getPoolScores, pool.tournament.id)
      setUpdatedPoolMembers(updatedMembers);
    
      
    } catch(error) {
      console.log(error)
      return error;
    }
  };

  useEffect(() => {
    if(needsRefresh) {
      console.log('Refreshing pool member scores...')
      handleRefresh()
      setNeedsRefresh(false)
    }
  }, [needsRefresh])
  


  return (
      <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
        <Head>        
            <title>Pool View | PoolPicks</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
          <div className="flex">
            { showLogo && <div className="pl-0 pr-4">
            <img src="/logo_masters.png" className="w-24"></img>
            </div>}
            <div className={`flex justify-center flex-1 flex-col align-center ${!showLogo ? 'text-center' : ''}`}>
            <h1 className="text-base font-bold">{pool.name}</h1>
            <p className="text-base">{pool.tournament.name}</p>
            <p className="text-base">{pool.tournament.course}</p>
            <p className="text-xs">${pool.amount_entry} Ante | Total Pot: ${totalPotAmount} </p>
            { pool.tournament.external_id &&
              <a href={tournamentExternalUrl} className="font-bold text-yellow underline mt-2" target="_blank" rel="noreferrer">Official Leaderboard</a>
            }
            {pool.tournament.cut_line && <p>Projected Cut <strong>{formatToPar(pool.tournament.cut_line)}</strong></p>}
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
        <div className="mt-6">
         <span className="bg-yellow text-black p-2 text-xs mr-2 rounded">{pool.tournament.status}</span>
          { elapsedTime.length > 0 && 
          <span className="bg-grey-200 p-2  rounded text-xs">Scores updated {elapsedTime}</span>
          }
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
          }
        }
      },
    });

    if(!pool) { return redirectToSignIn() }

    const { tournament, ...poolWithoutTournament } = pool;
    const { updated_at, ...tournamentWithoutUpdatedAt } = tournament;

    const updatedAtISOString = updated_at.toISOString();

    const currentUserPoolMember = pool!.pool_members.find((member) => member.user.email === email);
    const isAdmin = session.role === 'ADMIN';
    if(!currentUserPoolMember && !isAdmin) { return redirectToSignIn() }

    return {
      props: {
        pool: {
          ...poolWithoutTournament,
          tournament: tournamentWithoutUpdatedAt,
        },
        poolMembers: pool.pool_members,
        currentUserPoolMemberId: currentUserPoolMember?.id || null,
        isAdmin: isAdmin,
        scoresUpdatedAt: updatedAtISOString,
      },
    };
  };