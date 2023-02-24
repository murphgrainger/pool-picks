import React from 'react';
import prisma from '../../lib/prisma';
import { useState } from 'react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

const Tournament = ({ tournament }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

  return (
    <div>
      <div className="prose container mx-auto px-8">
        <h1>{tournament.name}</h1>
        <p>2023</p>
        <p>Par: {tournament.par}</p>
      </div>
    </div>
  );
};

export default Tournament;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

  const id = params?.id;
  const tournament = await prisma.tournament.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true,
      name: true,
      par: true
    },
  });

  if (!tournament) return {
    notFound: true
  }

  return {
    props: {
      tournament,
    },
  };
};
