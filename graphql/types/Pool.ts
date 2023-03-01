// /graphql/types/Link.ts
import { builder } from "../builder";

builder.prismaObject('Pool', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    amount_entry: t.exposeInt('amount_entry'),
    amount_sum: t.exposeInt('amount_sum', { nullable: true, }),
    invite_code: t.exposeString('invite_code', { nullable: true, }),
    tournament_id: t.exposeID('tournament_id'),
    tournaments: t.relation('tournament'),
    created_at: t.expose("created_at", { type: "Date" }),
    updated_at: t.expose("updated_at", { type: "Date" }),
  }),
})


builder.queryField('pools', (t) =>
  t.prismaConnection({
    type: 'Pool',
    cursor: 'id',
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.pool.findMany({ ...query })
  })
)

builder.queryField('pool', (t) =>
  t.prismaField({
    type: 'Pool',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.pool.findUnique({
        ...query,
        where: {
          id: Number(args.id),
        }
      })
  })
)


builder.mutationField('createPool', (t) =>
  t.prismaField({
    type: 'Pool',
    args: {
      name: t.arg.string({ required: true }),
      amount_entry: t.arg.int({ required: true }),
      tournament_id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const { name, amount_entry, tournament_id } = args

      return await prisma.pool.create({
        ...query,
        data: {
          name,
          amount_entry,
          tournament_id,
        }
      })
    }
  })
)