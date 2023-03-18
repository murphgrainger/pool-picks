export const Models = {
    PoolInvite: {
        pool: (parent: any) =>
          prisma.poolInvite
            .findUnique({
              where: { id: parent.id },
            })
            .pool(),
      },
      PoolMember: {
        pool: (parent: any) =>
          prisma.poolMember
            .findUnique({
              where: { id: parent.id },
            })
            .pool(),
      },
      Pick: {
        poolMember: (parent: any) => parent.poolMember,
        athlete: (parent: any) => parent.athlete
      },
      AthletesInTournaments: {
        athlete: (parent: any) => parent.athlete
      }
}