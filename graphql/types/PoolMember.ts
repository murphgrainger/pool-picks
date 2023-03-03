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
      pool_id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const { pool_id } = args

      if (!(await ctx).user) {
        throw new Error("You have to be logged in to perform this action")
      }

      const user = await prisma.user.findUnique({
        where: {
          email: (await ctx).user?.email,
        }
      })

      if (!user) {
        throw new Error("User not found")
      }
      
    return await prisma.poolMember.create({
        ...query,
        data: {
            pool_id: Number(pool_id),
            user_id: user.id
        }
        })
    }
  })
)