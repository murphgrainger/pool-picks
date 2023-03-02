import { builder } from "../builder";

builder.prismaObject('PoolInvite', {
    fields: (t) => ({
      id: t.exposeID('id'),
      email: t.exposeString('email'),
      status: t.exposeString('status'),
      pool_id: t.exposeID('pool_id'),
      pools: t.relation('pool'),
      created_at: t.expose("created_at", { type: "Date" }),
      updated_at: t.expose("updated_at", { type: "Date" }),
    }),
  })

builder.queryField("poolInvites", (t) =>
  t.prismaField({
    type: ['PoolInvite'],
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.poolInvite.findMany({ ...query })
  })
)


builder.queryField('poolInvite', (t) =>
  t.prismaField({
    type: 'PoolInvite',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.poolInvite.findUnique({
        ...query,
        where: {
          id: Number(args.id),
        }
      })
  })
)

builder.mutationField('createPoolInvite', (t) =>
  t.prismaField({
    type: 'PoolInvite',
    args: {
      email: t.arg.string({ required: true }),
      pool_id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const { email, pool_id } = args

      return await prisma.poolInvite.create({
        ...query,
        data: {
          email,
          pool_id,
        }
      })
    }
  })
)

builder.mutationField('updatePoolInvite', (t) =>
  t.prismaField({
    type: 'PoolInvite',
    args: {
      id: t.arg.id({ required: true }),
      status: t.arg.string({ required: true })
    },
    resolve: async (query, _parent, args, _ctx) =>
      prisma.poolInvite.update({
        ...query,
        where: {
          id: Number(args.id),
        },
        data: {
          status: args.status
        }
      })
  })
)