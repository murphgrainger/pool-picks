import { builder } from "../builder";

builder.prismaObject('Athlete', {
    fields: (t) => ({
        id: t.exposeID('id'),
        first_name: t.exposeString('first_name'),
        last_name: t.exposeString('last_name'),
    }),
})

builder.queryField('athletes', (t) =>
    t.prismaConnection({
        type: 'Athlete',
        cursor: 'id',
        resolve: (query, _parent, _args, _ctx, _info) => 
            prisma.athlete.findMany({ ...query })
    })
)

builder.queryField('athlete', (t) =>
  t.prismaField({
    type: 'Athlete',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.athlete.findUnique({
        ...query,
        where: {
          id: Number(args.id),
        }
      })
  })
)

builder.mutationField('createAthlete', (t) =>
  t.prismaField({
    type: 'Athlete',
    args: {
      first_name: t.arg.string({ required: true }),
      last_name: t.arg.string({ required: true }),
      ranking: t.arg.int(),
      external_id: t.arg.int()
    },
    resolve: async (query, _parent, args, ctx) => {
      const { first_name, last_name } = args

      if (!(await ctx).user) {
        throw new Error("You have to be logged in to perform this action")
      }

      const user = await prisma.user.findUnique({
        where: {
          email: (await ctx).user?.email,
        }
      })

      if (!user || user.role !== "ADMIN") {
        throw new Error("You don have permission ot perform this action")
      }
        return await prisma.athlete.create({
          ...query,
          data: {
              first_name,
              last_name
          }
        })
    }
  })
)