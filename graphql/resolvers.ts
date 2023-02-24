import prisma from '../lib/prisma'

export const resolvers = {
  Query: {
    links: () => prisma.link.findMany(),
    tournaments: () => prisma.tournament.findMany()
  },
}