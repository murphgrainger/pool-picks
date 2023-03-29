import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function createContext({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
  const session = await getSession({ req });

  if (!session) {
    return { user: null };
  }

  return {
    user: {
      email: session.user?.email,
      name: session.user?.name,
    },
  };
}
