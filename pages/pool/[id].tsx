import React from 'react';
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

import PicksCreate from '../../components/PicksCreate';
import { Athlete } from '@prisma/client';

const Pool = ({ pool }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  const tournamentAthletes:Athlete[] = pool.tournament.athletes.map(({ athlete }: { athlete:Athlete }) => athlete);

    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
        <h1>{pool.name}</h1>
        <p>{pool.tournament.name}</p>
        <p>{pool.tournament.course}</p>
        <p>{pool.tournament.city}, {pool.tournament.region}</p>
        <p>{pool.tournament.status}</p>
        <p>Athlete Count: {pool.tournament.athletes.length}</p>


        <p>${pool.amount_entry} Buy-In</p>
        <p>${pool.amount_sum} Total Pot</p>
        <p>Active Members: {pool.pool_members.length}</p>
        <p>Pending Members: {pool.pool_invites.length}</p>
        <PicksCreate
        athletes={tournamentAthletes}
        />
        </div>
    );
  };
  
  export default Pool;

  export const getServerSideProps: GetServerSideProps = async ({ params }) => {

    const id = params?.id;
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
            status: true
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
            }
          }
        }
      },
    });
  
    if (!pool) return {
      notFound: true
    }
  
    return {
      props: {
        pool,
      },
    };
  };