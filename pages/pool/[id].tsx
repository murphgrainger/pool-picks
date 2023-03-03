import React from 'react';
import prisma from '../../lib/prisma';

import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

const Pool = ({ pool }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

    return (
      <div className="container mx-auto max-w-5xl flex flex-wrap items-center flex-col p-4">
          <h1>{pool.name}</h1>
          <p>2023</p>
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