import { builder } from "../builder";

builder.prismaObject('PoolMembersAthletes', {
    fields: (t) => ({
        poolMember_id: t.exposeID('poolMember_id'),
        athlete_id: t.exposeID('athlete_id'),
        assigned_at: t.expose("assigned_at", { type: "Date" }),
    })
})

builder.queryField("picks", (t) =>
  t.prismaField({
    type: ['PoolMembersAthletes'],
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.poolMembersAthletes.findMany({ ...query })
  })
)

builder.queryField('membersPicks', (t) =>
  t.prismaField({
    type: ['PoolMembersAthletes'],
    nullable: true,
    args: {
        poolMember_id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.poolMembersAthletes.findMany({
        ...query,
        where: {
            poolMember_id: Number(args.poolMember_id),
        }
      })
  })
)

builder.mutationField('createPoolPick', (t) =>
  t.prismaField({
    type: 'PoolMembersAthletes',
    args: {
      poolMember_id: t.arg.int({ required: true }),
      athlete_id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const { poolMember_id, athlete_id } = args

      return await prisma.poolMembersAthletes.create({
        ...query,
        data: {
            poolMember_id,
            athlete_id,
        }
      })
    }
  })
)

builder.mutationField('createPoolPicks', (t) =>
  t.prismaField({
    type: 'PoolMembersAthletes',
    args: {
      poolMember_id: t.arg.int({ required: true }),
      athlete_id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
        const picks = { args }

      return await prisma.poolMembersAthletes.createMany({ picks })
    }
  })
)