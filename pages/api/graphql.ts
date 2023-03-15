import { createSchema, createYoga } from 'graphql-yoga'
import type { NextApiRequest, NextApiResponse } from 'next'
import { DateTimeResolver } from "graphql-scalars";
import { typeDefs } from '../../graphql/schema'
import { Query } from "../../graphql/resolvers/queries";
import { Mutation } from "../../graphql/resolvers/mutations";
import { Models } from "../../graphql/resolvers/models";

export default createYoga<{
  req: NextApiRequest
  res: NextApiResponse
}>({
  schema: createSchema({
    typeDefs,
    resolvers: {
      Query,
      Mutation,
      ...Models,
      DateTime: DateTimeResolver
    }
  }),
  graphqlEndpoint: '/api/graphql'
})

export const config = {
  api: {
    bodyParser: false
  }
}