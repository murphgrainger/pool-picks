import React from 'react';
import prisma from '../../lib/prisma';

import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';

const Pool = ({ pool }: InferGetServerSidePropsType<typeof getServerSideProps>) => {

    return (
      <div>
        <div className="prose container mx-auto px-8">
          <h1>{pool.name}</h1>
          <p>2023</p>
        </div>
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