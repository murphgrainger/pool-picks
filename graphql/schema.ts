export const typeDefs = `
    scalar DateTime

    type Pool {
        id: ID
        name: String
        amount_entry: Int
        amount_sum: Int
        invite_code: String
        tournament: Tournament
    } 

    type PoolInvite {
        id: ID
        email: String
        status: String
        created_at: DateTime!
        pool_id: ID
        pool: Pool
    }

    type PoolMember {
        id: ID
        pool: Pool
    }

    type Tournament {
        id: ID
        name: String
        course: String
        city: String
        region: String
        status: String
    }

    type Athlete {
        id: ID
        first_name: String
        last_name: String
        full_name: String
    }

    type Pick {
        poolMember: PoolMember!
        athlete: Athlete!
    }
    
    type Query {
        pools: [Pool]!
        pool(id: ID!): Pool
        tournaments: [Tournament]!
        tournament(id: ID!): Tournament
        poolMembers: [PoolMember]!
        poolInvites: [PoolInvite]!
        athletes: [Athlete]!
        pendingPoolInvites: [PoolInvite]
        picks(pool_member_id: ID!): [Pick]
        allPicks: [Pick!]
        poolMembersByEmail(email: String!): [PoolMember!]!
    }

    type Mutation {
        createPool(
            name: String!
            amount_entry: Int!
            tournament_id: Int!
        ): Pool!
        createPicks(poolMemberId: ID!, athleteIds: [ID!]!): [Pick!]
        updateInviteStatus(id: ID!, status: String!, pool_id: Int!, email: String!): PoolMember
    }
`