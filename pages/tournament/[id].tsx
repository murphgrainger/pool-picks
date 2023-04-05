import React, { useState } from 'react';
import Head from "next/head";
import prisma from '../../lib/prisma';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]';

import { redirectToSignIn, redirectToHome } from '../../utils/utils';

const Tournament = ({ tournament }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  console.log(tournament)
    const [status, setStatus] = useState(tournament.status);
    const [cutLine, setCutLine] = useState(tournament.cut_line);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      setStatus(newStatus);
  }

    const handleCutLineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCutLine = parseInt(e.target.value, 10);
        setCutLine(newCutLine);
        await updateTournament({
            id: tournament.id,
            cut_line: newCutLine,
        });
    }

    const updateTournament = async (data: { id: number, status?: string, cut_line?: number }) => {
        try {
            console.log('hello')
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto max-w-xl flex flex-wrap items-center flex-col bg-black text-white">
            <Head>
                <title>Tournament | PoolPicks</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex flex-col w-full bg-grey-75 rounded p-4 items-center">
                <h1>Admin Home</h1>
                <div className="w-full">
                    <h3>{tournament.name}</h3>
                    <p>Starts: {tournament.start_date}</p>
                    <div>
                        <label htmlFor="status">Status:</label>
                        <select id="status" value={status} onChange={handleStatusChange}>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Open">Open</option>
                            <option value="Locked">Locked</option>
                            <option value="Active">Active</option>
                            <option value="Complete">Complete</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="cutLine">Cut Line:</label>
                        <input type="number" id="cutLine" value={cutLine} onChange={handleCutLineChange} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tournament;

  export const getServerSideProps: GetServerSideProps = async (context) => {

    const id = context.params?.id;

    const session = await getServerSession(context.req, context.res, authOptions)
 
    if(!session) { return redirectToSignIn() };
    if(session.role !== 'ADMIN') { return redirectToHome() };

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: Number(id)
      },
      select: {
        id: true,
        name: true,
        course: true,
        city: true,
        region: true,
        status: true,
        cut_line: true,
        start_date: true,
        external_id: true
      },
    });
  
    if(!tournament) { return redirectToHome() }

    return {
      props: {
        tournament: {
          ...tournament,
          start_date: tournament.start_date.toLocaleDateString(),
        },
      },
    };
  };