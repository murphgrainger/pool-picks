import { builder } from "../builder";

builder.prismaObject('PoolMember', {
    fields: (t) => ({
      id: t.exposeID('id'),
      pool_id: t.exposeID('pool_id'),
      pools: t.relation('pool'),
      user_id: t.exposeID('user_id'),
      users: t.relation('user'),
      created_at: t.expose("created_at", { type: "Date" }),
    }),
  })

builder.queryField("poolMembers", (t) =>
  t.prismaField({
    type: ['PoolMember'],
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.poolMember.findMany({ ...query })
  })
)

builder.queryField('poolMember', (t) =>
  t.prismaField({
    type: 'PoolMember',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.poolMember.findUnique({
        ...query,
        where: {
          id: Number(args.id),
        }
      })
  })
)

builder.mutationField('createPoolMember', (t) =>
  t.prismaField({
    type: 'PoolMember',
    args: {
      pool_id: t.arg.int({ required: true }),
      user_id: t.arg.int({required: true})
    },
    resolve: async (query, _parent, args, ctx) => {
      const { pool_id, user_id } = args

      return await prisma.poolInvite.create({
        ...query,
        data: {
            pool_id,
            user_id
        }
      })
    }
  })
)