import { builder } from "../builder";

builder.prismaObject('Tournament', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    course: t.exposeString('course'),
    city: t.exposeString('city'),
    region: t.exposeString('region'),
    status: t.exposeString('status'),
    start_date: t.expose("start_date", { type: "Date" }),
    end_date: t.expose("end_date", { type: "Date" }),
    created_at: t.expose("created_at", { type: "Date" }),
    updated_at: t.expose("updated_at", { type: "Date" }),
  }),
})

builder.queryField('tournaments', (t) =>
  t.prismaConnection({
    type: 'Tournament',
    cursor: 'id',
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.tournament.findMany({ ...query })
  })
)

builder.queryField('tournament', (t) =>
  t.prismaField({
    type: 'Tournament',
    nullable: true,
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: (query, _parent, args, _info) =>
      prisma.tournament.findUnique({
        ...query,
        where: {
          id: Number(args.id),
        }
      })
  })
)


builder.mutationField('createTournament', (t) =>
  t.prismaField({
    type: 'Tournament',
    args: {
      name: t.arg.string({ required: true }),
      course: t.arg.string({ required: true }),
      city: t.arg.string({ required: true }),
      region: t.arg.string({ required: true }),
      start_date: t.arg({ type: "Date", required: true }),
      end_date: t.arg({ type: "Date", required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const { name, course, city, region, start_date, end_date } = args

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
        return await prisma.tournament.create({
          ...query,
          data: {
              name, 
              course,
              city,
              region,
              start_date,
              end_date
          }
        })
    }
  })
)

builder.mutationField('deleteTournament', (t) =>
  t.prismaField({
    type: 'Tournament',
    args: {
      id: t.arg.id({ required: true })
    },
    resolve: async (query, _parent, args, _ctx) =>
      prisma.tournament.delete({
        ...query,
        where: {
          id: Number(args.id)
        }
      })
  })
)