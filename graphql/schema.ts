export const typeDefs = `
    scalar DateTime

    type User {
        id: ID
        email: String
        nickname: String
    }

    type Pool {
        id: ID
        name: String
        status: String
        amount_entry: Int
        amount_sum: Int
        invite_code: String
        tournament: Tournament
        poolMembers: [PoolMember]
        poolInvites: [PoolInvite]
    } 

    type PoolInvite {
        id: ID
        email: String
        nickname: String
        status: String
        created_at: DateTime!
        pool_id: ID
        pool: Pool
    }

    type PoolMember {
        id: ID
        username: String
        pool: Pool
        user: User
    }

    type Tournament {
        id: ID
        name: String
        course: String
        city: String
        region: String
        status: String
        cut_line: Int
        external_id: Int
        start_date: DateTime
        pools: [Pool]
    }

    type Pick {
        poolMember: PoolMember!
        athlete: Athlete!
    }

    type AthletesInTournaments {
        status:              String
        position:            Int
        thru:                Int
        score_today:         Int
        score_round_one:     Int
        score_round_two:     Int
        score_round_three:   Int
        score_round_four:    Int
        score_playoff:       Int
        score_sum:           Int
        score_under_par:     Int
        updated_at:          DateTime
        tournament:          Tournament!
        athlete:             Athlete!
    }

    type Athlete {
        id: ID
        first_name: String
        last_name: String
        full_name: String
        ranking: Int
    }
    
    type Query {
        pools: [Pool]!
        pool(id: ID!): Pool
        tournaments: [Tournament]!
        tournamentsAndPools: [Tournament!]!
        tournament(id: ID!): Tournament
        poolMembers: [PoolMember]!
        poolInvites: [PoolInvite]!
        athletes: [Athlete]!
        athletesInTournaments: [AthletesInTournaments]!
        athletesByTournamentId(tournament_id: Int!): [Athlete!]!
        pendingPoolInvites: [PoolInvite]
        picks(pool_member_id: ID!): [Pick]
        allPicks: [Pick!]
    }

    type Mutation {
        createPool(
            name: String!
            amount_entry: Int!
            tournament_id: Int!
        ): Pool!
        createPicks(poolMemberId: Int!, athleteIds: [Int!]!): [Pick!]
        updateInviteStatus(id: ID!, status: String!, pool_id: Int!, nickname: String!, email: String!): PoolMember
        updatePoolMemberUsername(id:ID!, username: String!): PoolMember
        updateTournament(id:ID!, status: String!): Tournament
        updatePool(id:ID!, status: String!): Pool
    }
`